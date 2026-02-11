'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { MenuPackage, CreatePackageInput, UpdatePackageInput, DishCategory } from '@/types/menu';
import { createPackage, updatePackage, getDishCategories } from '@/lib/api/menu-packages';
import CategorySettingsSection from './CategorySettingsSection';
import type { CategorySettingInput } from '@/types/menu';
import { Save, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';

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
    pricePerAdult: initialData?.pricePerAdult || 0,
    pricePerChild: initialData?.pricePerChild || 0,
    pricePerToddler: initialData?.pricePerToddler || 0,
    displayOrder: initialData?.displayOrder || 0,
    isPopular: initialData?.isPopular || false,
    isRecommended: initialData?.isRecommended || false,
    color: initialData?.color || '3b82f6',
    icon: initialData?.icon || '\ud83c\udf82',
    badgeText: initialData?.badgeText || '',
    includedItems: initialData?.includedItems || [],
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
        customLabel: cs.customLabel,
      }));
      setCategorySettings(settings);
    }
  }, [initialData]);

  async function loadCategories() {
    const loadingToast = toast.loading('\ud83d\udcc1 Ładowanie kategorii...');
    try {
      const data = await getDishCategories();
      setCategories(data);
      toast.success('\u2705 Kategorie załadowane', { id: loadingToast });
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('\u274c Błąd ładowania kategorii', { 
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

  function validateForm(): boolean {
    // Name validation
    if (!formData.name || formData.name.trim().length < 3) {
      toast.error('\u26a0\ufe0f Błąd walidacji', {
        description: 'Nazwa pakietu musi mieć co najmniej 3 znaki',
        duration: 4000,
      });
      return false;
    }

    // Price validation
    if (formData.pricePerAdult <= 0) {
      toast.error('\u26a0\ufe0f Błąd walidacji', {
        description: 'Cena dla dorosłych musi być większa od 0',
        duration: 4000,
      });
      return false;
    }

    if (formData.pricePerChild < 0) {
      toast.error('\u26a0\ufe0f Błąd walidacji', {
        description: 'Cena dla dzieci nie może być ujemna',
        duration: 4000,
      });
      return false;
    }

    // Color validation
    if (formData.color && !/^[0-9A-Fa-f]{6}$/.test(formData.color.replace('#', ''))) {
      toast.warning('\u26a0\ufe0f Nieprawidłowy kolor', {
        description: 'Kolor musi być w formacie HEX (np. 3b82f6 lub #3b82f6)',
        duration: 4000,
      });
      return false;
    }

    // Category settings validation
    if (categorySettings.length === 0) {
      toast.warning('\ud83d\udcc2 Brak kategorii', {
        description: 'Dodaj co najmniej jedną kategorię do pakietu',
        duration: 4000,
      });
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const savingToast = toast.loading(
      initialData ? '\ud83d\udcbe Aktualizacja pakietu...' : '\u2728 Tworzenie pakietu...'
    );

    try {
      // Clean color (remove # if present)
      const cleanColor = formData.color.replace('#', '');

      const packageData: CreatePackageInput | UpdatePackageInput = {
        ...formData,
        color: cleanColor,
        menuTemplateId,
        categorySettings,
      };

      if (initialData) {
        // Update
        await updatePackage(initialData.id, packageData);
        toast.success('\ud83c\udf89 Pakiet zaktualizowany!', {
          id: savingToast,
          description: `Pakiet "${formData.name}" został pomyślnie zaktualizowany`,
          duration: 5000,
        });
      } else {
        // Create
        await createPackage(packageData as CreatePackageInput);
        toast.success('\u2728 Pakiet utworzony!', {
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
      
      toast.error('\u274c Błąd zapisu', {
        id: savingToast,
        description: errorMessage,
        duration: 6000,
        action: {
          label: 'Spróbuj ponownie',
          onClick: () => handleSubmit(e),
        },
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
                type="number"
                id="pricePerAdult"
                name="pricePerAdult"
                value={formData.pricePerAdult}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                placeholder="180.00"
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
                type="number"
                id="pricePerChild"
                name="pricePerChild"
                value={formData.pricePerChild}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                placeholder="90.00"
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
                type="number"
                id="pricePerToddler"
                name="pricePerToddler"
                value={formData.pricePerToddler}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
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
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Opcje wyświetlania</h2>
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

          {/* Display inputs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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
              <label htmlFor="color" className="block text-sm font-semibold text-slate-700 mb-2">
                Kolor
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="3b82f6"
                  maxLength={7}
                  className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                />
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded border-2 border-slate-300"
                  style={{ backgroundColor: `#${formData.color.replace('#', '')}` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Bez # (np. 3b82f6)</p>
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
                placeholder="\ud83c\udf82"
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
