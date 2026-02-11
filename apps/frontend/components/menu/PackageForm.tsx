'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuPackage, CreatePackageInput, UpdatePackageInput, DishCategory } from '@/types/menu';
import { createPackage, updatePackage, getDishCategories } from '@/lib/api/menu-packages';
import CategorySettingsSection from './CategorySettingsSection';
import type { CategorySettingInput } from '@/types/menu';

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
    color: initialData?.color || '',
    icon: initialData?.icon || '',
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
    try {
      const data = await getDishCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  }

  function handleCategorySettingsChange(settings: CategorySettingInput[]) {
    setCategorySettings(settings);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const packageData: CreatePackageInput | UpdatePackageInput = {
        ...formData,
        menuTemplateId,
        categorySettings,
      };

      if (initialData) {
        // Update
        await updatePackage(initialData.id, packageData);
        alert('Pakiet został zaktualizowany!');
      } else {
        // Create
        await createPackage(packageData as CreatePackageInput);
        alert('Pakiet został utworzony!');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
    } catch (error: any) {
      console.error('Error saving package:', error);
      alert(`Błąd: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* BASIC INFO */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Podstawowe informacje</h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa pakietu *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Short Description */}
          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Krótki opis
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Pełny opis
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Ceny</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="pricePerAdult" className="block text-sm font-medium text-gray-700 mb-1">
              Dorośli *
            </label>
            <input
              type="number"
              id="pricePerAdult"
              name="pricePerAdult"
              value={formData.pricePerAdult}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="pricePerChild" className="block text-sm font-medium text-gray-700 mb-1">
              Dzieci (4-12 lat) *
            </label>
            <input
              type="number"
              id="pricePerChild"
              name="pricePerChild"
              value={formData.pricePerChild}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="pricePerToddler" className="block text-sm font-medium text-gray-700 mb-1">
              Maluchy (0-3 lata)
            </label>
            <input
              type="number"
              id="pricePerToddler"
              name="pricePerToddler"
              value={formData.pricePerToddler}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* CATEGORY SETTINGS - KEY SECTION! */}
      <CategorySettingsSection
        categories={categories}
        settings={categorySettings}
        onChange={handleCategorySettingsChange}
      />

      {/* DISPLAY OPTIONS */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Opcje wyświetlania</h2>

        <div className="space-y-4">
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isPopular"
                checked={formData.isPopular}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Popularny</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="isRecommended"
                checked={formData.isRecommended}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Polecany</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
                Kolejność wyświetlania
              </label>
              <input
                type="number"
                id="displayOrder"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Kolor
              </label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="#3B82F6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="badgeText" className="block text-sm font-medium text-gray-700 mb-1">
                Tekst odznaki
              </label>
              <input
                type="text"
                id="badgeText"
                name="badgeText"
                value={formData.badgeText}
                onChange={handleChange}
                placeholder="BESTSELLER"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Anuluj
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Zapisywanie...' : initialData ? 'Zaktualizuj pakiet' : 'Utwórz pakiet'}
        </button>
      </div>
    </form>
  );
}
