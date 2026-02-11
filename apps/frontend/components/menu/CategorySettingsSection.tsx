'use client';

import { useState, useEffect } from 'react';
import type { DishCategory, CategorySettingInput } from '@/types/menu';

interface CategorySettingsSectionProps {
  categories: DishCategory[];
  settings: CategorySettingInput[];
  onChange: (settings: CategorySettingInput[]) => void;
}

export default function CategorySettingsSection({
  categories,
  settings,
  onChange,
}: CategorySettingsSectionProps) {
  const [localSettings, setLocalSettings] = useState<CategorySettingInput[]>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  function isEnabled(categoryId: string): boolean {
    return localSettings.some(
      (s) => s.categoryId === categoryId && s.isEnabled
    );
  }

  function getSetting(categoryId: string): CategorySettingInput | undefined {
    return localSettings.find((s) => s.categoryId === categoryId);
  }

  function handleToggle(categoryId: string, enabled: boolean) {
    let newSettings = [...localSettings];

    if (enabled) {
      // Add if not exists
      if (!getSetting(categoryId)) {
        newSettings.push({
          categoryId,
          minSelect: 1,
          maxSelect: 1,
          isRequired: true,
          isEnabled: true,
          displayOrder: newSettings.length,
        });
      } else {
        // Update existing
        newSettings = newSettings.map((s) =>
          s.categoryId === categoryId ? { ...s, isEnabled: true } : s
        );
      }
    } else {
      // Disable
      newSettings = newSettings.map((s) =>
        s.categoryId === categoryId ? { ...s, isEnabled: false } : s
      );
    }

    setLocalSettings(newSettings);
    onChange(newSettings);
  }

  function handleChange(
    categoryId: string,
    field: keyof CategorySettingInput,
    value: any
  ) {
    const newSettings = localSettings.map((s) =>
      s.categoryId === categoryId ? { ...s, [field]: value } : s
    );

    setLocalSettings(newSettings);
    onChange(newSettings);
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">🍽️ Kategorie dań w pakiecie</h2>
        <p className="text-sm text-gray-600">
          Wybierz z jakich kategorii goście będą mogli wybierać dania oraz określ
          minimalną i maksymalną liczbę wyborów.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Brak dostępnych kategorii dań. Najpierw stwórz kategorie w systemie.
        </p>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const enabled = isEnabled(category.id);
            const setting = getSetting(category.id);

            return (
              <div
                key={category.id}
                className={`border rounded-lg p-4 transition-colors ${
                  enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {/* Header with checkbox */}
                <div className="flex items-start justify-between mb-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleToggle(category.id, e.target.checked)}
                      className="mr-3 w-5 h-5"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {category.icon && <span className="mr-2">{category.icon}</span>}
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500">{category.slug}</div>
                    </div>
                  </label>
                </div>

                {/* Settings (only if enabled) */}
                {enabled && setting && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200">
                    {/* Min Select */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Min wyborów
                      </label>
                      <input
                        type="number"
                        value={setting.minSelect}
                        onChange={(e) =>
                          handleChange(
                            category.id,
                            'minSelect',
                            parseFloat(e.target.value)
                          )
                        }
                        step="0.5"
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Max Select */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Max wyborów
                      </label>
                      <input
                        type="number"
                        value={setting.maxSelect}
                        onChange={(e) =>
                          handleChange(
                            category.id,
                            'maxSelect',
                            parseFloat(e.target.value)
                          )
                        }
                        step="0.5"
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Is Required */}
                    <div>
                      <label className="flex items-center h-full pt-5">
                        <input
                          type="checkbox"
                          checked={setting.isRequired}
                          onChange={(e) =>
                            handleChange(category.id, 'isRequired', e.target.checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          Wymagana
                        </span>
                      </label>
                    </div>

                    {/* Custom Label */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Własna etykieta
                      </label>
                      <input
                        type="text"
                        value={setting.customLabel || ''}
                        onChange={(e) =>
                          handleChange(category.id, 'customLabel', e.target.value || undefined)
                        }
                        placeholder={category.name}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {localSettings.filter((s) => s.isEnabled).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Podsumowanie:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {localSettings
              .filter((s) => s.isEnabled)
              .map((s) => {
                const cat = categories.find((c) => c.id === s.categoryId);
                return (
                  <li key={s.categoryId}>
                    • <strong>{cat?.name}</strong>: {s.minSelect}–{s.maxSelect} wyborów
                    {s.isRequired && ' (wymagane)'}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}
