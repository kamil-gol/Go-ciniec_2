'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { MenuPackage, CreatePackageInput, DishCategory } from '@/types/menu';
import { createPackage, updatePackage, getDishCategories, updatePackageCategories } from '@/lib/api/menu-packages-api';
import CategorySettingsSection from './CategorySettingsSection';
import type { CategorySettingInput } from '@/types/menu';
import { Save, Loader2, AlertCircle, X } from 'lucide-react';
import { validateForm } from './package-form/package-form.validation';
import PackageDisplaySection from './package-form/PackageDisplaySection';

interface PackageFormProps {
  menuTemplateId: string;
  initialData?: MenuPackage;
  onSuccess?: () => void;
}

export default function PackageForm({
  menuTemplateId,
  initialData,
  onSuccess,
}: PackageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [categorySettings, setCategorySettings] = useState<CategorySettingInput[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    shortDescription: initialData?.shortDescription || '',
    pricePerAdult: initialData?.pricePerAdult?.toString() || '',
    pricePerChild: initialData?.pricePerChild?.toString() || '',
    pricePerToddler: initialData?.pricePerToddler?.toString() || '0',
    displayOrder: initialData?.displayOrder || 0,
    isPopular: initialData?.isPopular || false,
    isRecommended: initialData?.isRecommended || false,
    color: initialData?.color?.replace('#', '') || '3b82f6',
    icon: initialData?.icon || '🎂',
    badgeText: initialData?.badgeText || '',
  });

  // Load dish categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load existing category settings if editing
  useEffect(() => {
    if (initialData?.categorySettings) {
      const settings = initialData.categorySettings.map((cs) => ({
        categoryId: cs.categoryId,
        minSelect: Number(cs.minSelect) || 0,
        maxSelect: Number(cs.maxSelect) || 0,
        isRequired: cs.isRequired,
        isEnabled: cs.isEnabled,
        portionTarget: cs.portionTarget || 'ALL', // #166 fix: map portionTarget from saved data
        displayOrder: Number(cs.displayOrder) || 0,
        customLabel: cs.customLabel || undefined,
        extraItemPrice: cs.extraItemPrice != null ? Number(cs.extraItemPrice) : null,
        maxExtra: cs.maxExtra != null ? Number(cs.maxExtra) : null,
      }));
      setCategorySettings(settings);
    }
  }, [initialData]);

  async function loadCategories() {
    const loadingToast = toast.loading('Ładowanie kategorii...');
    try {
      const data = await getDishCategories();
      setCategories(data);
      toast.success('Kategorie załadowane', { id: loadingToast });
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('❌ Błąd ładowania kategorii', { 
        id: loadingToast,
        description: 'Spróbuj odświeżyć stronę'
      });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  }

  function handleCategorySettingsChange(settings: CategorySettingInput[]) {
    setCategorySettings(settings);
  }

  async function saveCategorySettings(packageId: string) {
    const enabledSettings = categorySettings.filter((cs) => cs.isEnabled);
    
    if (enabledSettings.length === 0) return;

    // Ensure all numeric fields are proper numbers (Prisma Decimal comes as strings)
    const normalizedSettings = enabledSettings.map((cs) => ({
      categoryId: cs.categoryId,
      minSelect: Number(cs.minSelect) || 0,
      maxSelect: Number(cs.maxSelect) || 0,
      isRequired: cs.isRequired,
      isEnabled: cs.isEnabled,
      portionTarget: cs.portionTarget || 'ALL', // #166 fix: include portionTarget in save payload
      displayOrder: Number(cs.displayOrder) || 0,
      customLabel: cs.customLabel || null,
      // #216: Category extras fields
      extraItemPrice: cs.extraItemPrice != null ? Number(cs.extraItemPrice) : null,
      maxExtra: cs.maxExtra != null ? Number(cs.maxExtra) : null,
    }));

    try {
      await updatePackageCategories(packageId, normalizedSettings);
      console.log('Category settings saved successfully');
    } catch (error) {
      console.error('Error saving category settings:', error);
      throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate form
    if (!validateForm(formData, categorySettings)) {
      return;
    }

    setLoading(true);
    const savingToast = toast.loading(
      initialData ? 'Aktualizacja pakietu...' : 'Tworzenie pakietu...'
    );

    try {
      // Clean color (remove # if present) and add it back
      const cleanColor = formData.color.replace('#', '');
      const colorWithHash = `#${cleanColor}`;

      // Parse prices to numbers
      const pricePerAdult = parseFloat(formData.pricePerAdult);
      const pricePerChild = parseFloat(formData.pricePerChild);
      const pricePerToddler = parseFloat(formData.pricePerToddler) || 0;

      const packageData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        shortDescription: formData.shortDescription.trim() || null,
        pricePerAdult,
        pricePerChild,
        pricePerToddler,
        displayOrder: Number(formData.displayOrder) || 0,
        isPopular: formData.isPopular,
        isRecommended: formData.isRecommended,
        color: colorWithHash,
        icon: formData.icon || null,
        badgeText: formData.badgeText.trim() || null,
      };

      // Add menuTemplateId only for create
      if (!initialData) {
        packageData.menuTemplateId = menuTemplateId;
      }

      console.log('Sending package data:', packageData);

      let createdOrUpdatedPackage;

      if (initialData) {
        // Update package
        createdOrUpdatedPackage = await updatePackage(initialData.id, packageData);
        
        // Update category settings
        await saveCategorySettings(initialData.id);
        
        toast.success('Pakiet zaktualizowany!', {
          id: savingToast,
          description: `Pakiet "${formData.name}" został pomyślnie zaktualizowany`,
          duration: 5000,
        });
      } else {
        // Create package
        createdOrUpdatedPackage = await createPackage(packageData as CreatePackageInput);
        
        // Save category settings for newly created package
        await saveCategorySettings(createdOrUpdatedPackage.id);
        
        toast.success('Pakiet utworzony!', {
          id: savingToast,
          description: `Nowy pakiet "${formData.name}" został dodany do menu`,
          duration: 5000,
        });
      }

      // Small delay for better UX
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.back();
        }
      }, 500);
    } catch (error: any) {
      console.error('Error saving package:', error);
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Nieznany błąd';
      
      toast.error('❌ Błąd zapisu', {
        id: savingToast,
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* BASIC INFO */}
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/60 dark:border-neutral-700/60 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Podstawowe informacje</h2>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Nazwa pakietu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={3}
              placeholder="np. Pakiet Komunijny Elegancki"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>

          {/* Short Description */}
          <div>
            <label htmlFor="shortDescription" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Krótki opis
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              maxLength={100}
              placeholder="Krótki opis wyświetlany na karcie pakietu"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1">{formData.shortDescription.length}/100 znaków</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Pełny opis
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Szczegółowy opis pakietu, co zawiera, dla kogo jest przeznaczony..."
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/60 dark:border-neutral-700/60 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Ceny</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label htmlFor="pricePerAdult" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Dorośli <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="pricePerAdult"
                name="pricePerAdult"
                value={formData.pricePerAdult}
                onChange={handleChange}
                required
                placeholder="180.00"
                pattern="[0-9]+\.?[0-9]*"
                className="w-full px-4 py-3 pr-12 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-300 font-medium">zł</span>
            </div>
          </div>

          <div>
            <label htmlFor="pricePerChild" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Dzieci (4-12 lat) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="pricePerChild"
                name="pricePerChild"
                value={formData.pricePerChild}
                onChange={handleChange}
                required
                placeholder="90.00"
                pattern="[0-9]+\.?[0-9]*"
                className="w-full px-4 py-3 pr-12 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-300 font-medium">zł</span>
            </div>
          </div>

          <div>
            <label htmlFor="pricePerToddler" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Maluchy (0-3 lata)
            </label>
            <div className="relative">
              <input
                type="text"
                id="pricePerToddler"
                name="pricePerToddler"
                value={formData.pricePerToddler}
                onChange={handleChange}
                placeholder="0.00"
                pattern="[0-9]+\.?[0-9]*"
                className="w-full px-4 py-3 pr-12 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-300 font-medium">zł</span>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY SETTINGS */}
      <CategorySettingsSection
        categories={categories}
        settings={categorySettings}
        onChange={handleCategorySettingsChange}
      />

      {/* DISPLAY OPTIONS */}
      <PackageDisplaySection
        formData={formData}
        onFormDataChange={setFormData}
        handleChange={handleChange}
      />

      {/* ACTIONS */}
      <div className="flex justify-end gap-4 sticky bottom-6 z-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3.5 bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all flex items-center gap-2 shadow-sm"
          disabled={loading}
        >
          <X className="w-5 h-5" />
          Anuluj
        </button>
        <button
          type="submit"
          className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {initialData ? 'Zaktualizuj pakiet' : 'Utwórz pakiet'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
