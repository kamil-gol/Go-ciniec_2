'use client';

import { useState, useEffect } from 'react';
import type { DishCategory, CategorySettingInput } from '@/types/menu';
import { AlertCircle } from 'lucide-react';

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
    let newSettings = localSettings.map((s) =>
      s.categoryId === categoryId ? { ...s, [field]: value } : s
    );

    // Auto-fix: if minSelect > maxSelect, adjust maxSelect
    if (field === 'minSelect') {
      newSettings = newSettings.map((s) => {
        if (s.categoryId === categoryId && s.minSelect > s.maxSelect) {
          return { ...s, maxSelect: s.minSelect };
        }
        return s;
      });
    }

    // Auto-fix: if maxSelect < minSelect, adjust minSelect
    if (field === 'maxSelect') {
      newSettings = newSettings.map((s) => {
        if (s.categoryId === categoryId && s.maxSelect < s.minSelect) {
          return { ...s, minSelect: s.maxSelect };
        }
        return s;
      });
    }

    setLocalSettings(newSettings);
    onChange(newSettings);
  }

  function hasValidationError(setting: CategorySettingInput): boolean {
    return setting.minSelect > setting.maxSelect;
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <span className="text-2xl">{"\uD83C\uDF7D\uFE0F"}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Kategorie da\u0144 w pakiecie</h2>
        </div>
        <p className="text-sm text-slate-600">
          Wybierz z jakich kategorii go\u015bcie b\u0119d\u0105 mogli wybiera\u0107 dania oraz okre\u015bl
          minimaln\u0105 i maksymaln\u0105 liczb\u0119 wybor\u00f3w.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-500">
            Brak dost\u0119pnych kategorii da\u0144. Najpierw stw\u00f3rz kategorie w systemie.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const enabled = isEnabled(category.id);
            const setting = getSetting(category.id);
            const hasError = setting ? hasValidationError(setting) : false;

            return (
              <div
                key={category.id}
                className={`border-2 rounded-xl p-5 transition-all ${
                  enabled 
                    ? hasError
                      ? 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Header with checkbox */}
                <div className="flex items-start justify-between mb-3">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleToggle(category.id, e.target.checked)}
                      className="mr-3 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">
                        {category.icon && <span className="mr-2 text-lg">{category.icon}</span>}
                        {category.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{category.slug}</div>
                    </div>
                  </label>

                  {hasError && (
                    <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-100 px-2 py-1 rounded">
                      <AlertCircle className="w-4 h-4" />
                      Min &gt; Max!
                    </div>
                  )}
                </div>

                {/* Settings (only if enabled) */}
                {enabled && setting && (
                  <div className={`mt-4 pt-4 border-t ${
                    hasError ? 'border-red-200' : 'border-blue-200'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Min Select */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Min wybor\u00f3w
                        </label>
                        <input
                          type="number"
                          value={setting.minSelect}
                          onChange={(e) =>
                            handleChange(
                              category.id,
                              'minSelect',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          step="0.5"
                          min="0"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            hasError
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                        />
                      </div>

                      {/* Max Select */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Max wybor\u00f3w
                        </label>
                        <input
                          type="number"
                          value={setting.maxSelect}
                          onChange={(e) =>
                            handleChange(
                              category.id,
                              'maxSelect',
                              parseFloat(e.target.value) || 1
                            )
                          }
                          step="0.5"
                          min="0"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            hasError
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                        />
                      </div>

                      {/* Is Required */}
                      <div>
                        <label className="flex items-center h-full pt-7">
                          <input
                            type="checkbox"
                            checked={setting.isRequired}
                            onChange={(e) =>
                              handleChange(category.id, 'isRequired', e.target.checked)
                            }
                            className="mr-2 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs font-semibold text-slate-700">
                            Wymagana
                          </span>
                        </label>
                      </div>

                      {/* Custom Label */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          W\u0142asna etykieta
                        </label>
                        <input
                          type="text"
                          value={setting.customLabel || ''}
                          onChange={(e) =>
                            handleChange(category.id, 'customLabel', e.target.value || null)
                          }
                          placeholder={category.name}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Validation Error Message */}
                    {hasError && (
                      <div className="mt-3 flex items-start gap-2 text-red-700 text-xs bg-red-100 border border-red-300 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>B\u0142\u0105d walidacji:</strong> Minimalna warto\u015b\u0107 ({setting.minSelect}) nie mo\u017ce by\u0107 wi\u0119ksza ni\u017c maksymalna ({setting.maxSelect}).
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {localSettings.filter((s) => s.isEnabled).length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            {"\uD83D\uDCCA"} Podsumowanie:
          </h3>
          <ul className="text-sm text-slate-600 space-y-2">
            {localSettings
              .filter((s) => s.isEnabled)
              .map((s) => {
                const cat = categories.find((c) => c.id === s.categoryId);
                const error = hasValidationError(s);
                return (
                  <li key={s.categoryId} className={error ? 'text-red-700 font-medium' : ''}>
                    {error && '\u26A0\uFE0F '}
                    \u2022 <strong>{cat?.name}</strong>: {s.minSelect}\u2013{s.maxSelect} wybor\u00f3w
                    {s.isRequired && ' (wymagane)'}
                    {error && ' - NIEPRAWID\u0141OWE!'}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}
