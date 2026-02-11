'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { MenuPackage, CreatePackageInput, UpdatePackageInput, DishCategory } from '@/types/menu';
import { createPackage, updatePackage, getDishCategories, updatePackageCategories } from '@/lib/api/menu-packages';
import CategorySettingsSection from './CategorySettingsSection';
import type { CategorySettingInput } from '@/types/menu';
import { Save, Loader2, AlertCircle, CheckCircle2, X, Palette } from 'lucide-react';

interface PackageFormProps {
  menuTemplateId: string;
  initialData?: MenuPackage;
  onSuccess?: () => void;
}

const PRESET_COLORS = [
  { name: 'Niebieski', value: '3b82f6' },
  { name: 'Zielony', value: '22c55e' },
  { name: 'Fioletowy', value: 'a855f7' },
  { name: 'Różowy', value: 'ec4899' },
  { name: 'Pomarańczowy', value: 'f97316' },
  { name: 'Czerwony', value: 'ef4444' },
  { name: 'Żółty', value: 'eab308' },
  { name: 'Turkusowy', value: '06b6d4' },
  { name: 'Indygo', value: '6366f1' },
  { name: 'Szary', value: '6b7280' },
];

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
        minSelect: cs.minSelect,
        maxSelect: cs.maxSelect,
        isRequired: cs.isRequired,
        isEnabled: cs.isEnabled,
        displayOrder: cs.displayOrder,
        customLabel: cs.customLabel || null,
      }));
      setCategorySettings(settings);
    }
  }, [initialData]);

  async function loadCategories() {
    const loadingToast = toast.loading('📁 Ładowanie kategorii...');
    try {
      const data = await getDishCategories();
      setCategories(data);
      toast.success('✅ Kategorie załadowane', { id: loadingToast });
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
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
    }));
  }

  function handleCategorySettingsChange(settings: CategorySettingInput[]) {
    setCategorySettings(settings);
  }

  function validateForm(): boolean {
    // Name validation
    if (!formData.name || formData.name.trim().length < 3) {
      toast.error('⚠️ Błąd walidacji', {
        description: 'Nazwa pakietu musi mieć co najmniej 3 znaki',
        duration: 4000,
      });
      return false;
    }

    // Price validation
    const adultPrice = parseFloat(formData.pricePerAdult);
    if (isNaN(adultPrice) || adultPrice <= 0) {
      toast.error('⚠️ Błąd walidacji', {
        description: 'Cena dla dorosłych musi być większa od 0',
        duration: 4000,
      });
      return false;
    }

    const childPrice = parseFloat(formData.pricePerChild);
    if (isNaN(childPrice) || childPrice < 0) {
      toast.error('⚠️ Błąd walidacji', {
        description: 'Cena dla dzieci nie może być ujemna',
        duration: 4000,
      });
      return false;
    }

    // Color validation
    if (formData.color && !/^[0-9A-Fa-f]{6}$/.test(formData.color.replace('#', ''))) {
      toast.warning('⚠️ Nieprawidłowy kolor', {
        description: 'Kolor musi być w formacie HEX (np. 3b82f6)',
        duration: 4000,
      });
      return false;
    }

    // Category settings validation
    const enabledCategories = categorySettings.filter((cs) => cs.isEnabled);
    if (enabledCategories.length === 0) {
      toast.warning('📂 Brak kategorii', {
        description: 'Dodaj i włącz co najmniej jedną kategorię do pakietu',
        duration: 4000,
      });
      return false;
    }

    return true;
  }

  async function saveCategorySettings(packageId: string) {
    const enabledSettings = categorySettings.filter((cs) => cs.isEnabled);
    
    if (enabledSettings.length === 0) return;

    try {
      await updatePackageCategories(packageId, enabledSettings);
      console.log('Category settings saved successfully');
    } catch (error) {
      console.error('Error saving category settings:', error);
      throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const savingToast = toast.loading(
      initialData ? '💾 Aktualizacja pakietu...' : '✨ Tworzenie pakietu...'
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
        displayOrder: formData.displayOrder,
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
        
        toast.success('🎉 Pakiet zaktualizowany!', {
          id: savingToast,
          description: `Pakiet "${formData.name}" został pomyślnie zaktualizowany`,
          duration: 5000,
        });
      } else {
        // Create package
        createdOrUpdatedPackage = await createPackage(packageData as CreatePackageInput);
        
        // Save category settings for newly created package
        await saveCategorySettings(createdOrUpdatedPackage.id);
        
        toast.success('✨ Pakiet utworzony!', {
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
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Podstawowe informacje</h2>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
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
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Short Description */}
          <div>
            <label htmlFor="shortDescription" className="block text-sm font-semibold text-slate-700 mb-2">
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
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">{formData.shortDescription.length}/100 znaków</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
              Pełny opis
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Szczegółowy opis pakietu, co zawiera, dla kogo jest przeznaczony..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Save className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Ceny</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label htmlFor="pricePerAdult" className="block text-sm font-semibold text-slate-700 mb-2">
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
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">zł</span>
            </div>
          </div>

          <div>
            <label htmlFor="pricePerChild" className="block text-sm font-semibold text-slate-700 mb-2">
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
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">zł</span>
            </div>
          </div>

          <div>
            <label htmlFor="pricePerToddler" className="block text-sm font-semibold text-slate-700 mb-2">
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
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">zł</span>
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
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Wygląd i opcje</h2>
        </div>

        <div className="space-y-6">
          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="isPopular"
                  checked={formData.isPopular}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                🔥 Popularny
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="isRecommended"
                  checked={formData.isRecommended}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-green-600 transition-colors">
                ⭐ Polecany
              </span>
            </label>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Kolor pakietu
            </label>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color: preset.value }))}
                  className={`group relative w-full aspect-square rounded-xl transition-all ${
                    formData.color === preset.value
                      ? 'ring-4 ring-blue-500 ring-offset-2 scale-110'
                      : 'hover:scale-105 hover:ring-2 hover:ring-slate-300'
                  }`}
                  style={{ backgroundColor: `#${preset.value}` }}
                  title={preset.name}
                >
                  {formData.color === preset.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="3b82f6"
                maxLength={7}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
              />
              <div 
                className="w-12 h-12 rounded-xl border-2 border-slate-300 shadow-sm"
                style={{ backgroundColor: `#${formData.color.replace('#', '')}` }}
              ></div>
            </div>
          </div>

          {/* Display inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label htmlFor="displayOrder" className="block text-sm font-semibold text-slate-700 mb-2">
                Kolejność
              </label>
              <input
                type="number"
                id="displayOrder"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="icon" className="block text-sm font-semibold text-slate-700 mb-2">
                Emoji
              </label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="🎂"
                maxLength={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-2xl text-center"
              />
            </div>

            <div>
              <label htmlFor="badgeText" className="block text-sm font-semibold text-slate-700 mb-2">
                Tekst odznaki
              </label>
              <input
                type="text"
                id="badgeText"
                name="badgeText"
                value={formData.badgeText}
                onChange={handleChange}
                placeholder="BESTSELLER"
                maxLength={20}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-4 sticky bottom-6 z-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2 shadow-sm"
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
