'use client';

import { useState, useEffect } from 'react';
import type { DishCategory, CategorySettingInput, PortionTarget } from '@/types/menu';
import { PORTION_TARGET_LABELS, PORTION_TARGET_ICONS } from '@/types/menu';
import { AlertCircle, Users, User, Baby } from 'lucide-react';

interface CategorySettingsSectionProps {
  categories: DishCategory[];
  settings: CategorySettingInput[];
  onChange: (settings: CategorySettingInput[]) => void;
}

/** #166: Icon component for portion target */
function PortionTargetIcon({ target, className = 'w-4 h-4' }: { target: PortionTarget; className?: string }) {
  switch (target) {
    case 'ADULTS_ONLY': return <User className={className} />;
    case 'CHILDREN_ONLY': return <Baby className={className} />;
    default: return <Users className={className} />;
  }
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
      if (!getSetting(categoryId)) {
        newSettings.push({
          categoryId,
          minSelect: 1,
          maxSelect: 1,
          isRequired: true,
          isEnabled: true,
          portionTarget: 'ALL', // #166: default
          displayOrder: newSettings.length,
        });
      } else {
        newSettings = newSettings.map((s) =>
          s.categoryId === categoryId ? { ...s, isEnabled: true } : s
        );
      }
    } else {
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

    if (field === 'minSelect') {
      newSettings = newSettings.map((s) => {
        if (s.categoryId === categoryId && s.minSelect > s.maxSelect) {
          return { ...s, maxSelect: s.minSelect };
        }
        return s;
      });
    }

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
    <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/60 dark:border-neutral-700/60 p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <span className="text-2xl">{'🍽️'}</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Kategorie dań w pakiecie</h2>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Wybierz z jakich kategorii goście będą mogli wybierać dania oraz określ
          minimalną i maksymalną liczbę wyborów.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
          <p className="text-neutral-500 dark:text-neutral-400">
            Brak dostępnych kategorii dań. Najpierw stwórz kategorie w systemie.
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
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                {/* Header with checkbox */}
                <div className="flex items-start justify-between mb-3">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleToggle(category.id, e.target.checked)}
                      className="mr-3 w-5 h-5 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {category.icon && <span className="mr-2 text-lg">{category.icon}</span>}
                        {category.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{category.slug}</div>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    {/* #166: Portion target badge */}
                    {enabled && setting && (
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        setting.portionTarget === 'ADULTS_ONLY'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : setting.portionTarget === 'CHILDREN_ONLY'
                            ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      }`}>
                        <PortionTargetIcon target={setting.portionTarget || 'ALL'} className="w-3.5 h-3.5" />
                        {PORTION_TARGET_LABELS[setting.portionTarget || 'ALL']}
                      </div>
                    )}

                    {hasError && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                        <AlertCircle className="w-4 h-4" />
                        Min &gt; Max!
                      </div>
                    )}
                  </div>
                </div>

                {/* Settings (only if enabled) */}
                {enabled && setting && (
                  <div className={`mt-4 pt-4 border-t ${
                    hasError ? 'border-red-200 dark:border-red-800' : 'border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Min Select */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                          Min wyborów
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
                          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 ${
                            hasError
                              ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                              : 'border-neutral-300 dark:border-neutral-600 focus:ring-blue-500'
                          }`}
                        />
                      </div>

                      {/* Max Select */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                          Max wyborów
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
                          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 ${
                            hasError
                              ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                              : 'border-neutral-300 dark:border-neutral-600 focus:ring-blue-500'
                          }`}
                        />
                      </div>

                      {/* #166: Portion Target Select */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                          Porcje dla
                        </label>
                        <div className="relative">
                          <select
                            value={setting.portionTarget || 'ALL'}
                            onChange={(e) =>
                              handleChange(category.id, 'portionTarget', e.target.value as PortionTarget)
                            }
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer pr-8"
                          >
                            <option value="ALL">{PORTION_TARGET_ICONS.ALL} Wszyscy goście</option>
                            <option value="ADULTS_ONLY">{PORTION_TARGET_ICONS.ADULTS_ONLY} Tylko dorośli</option>
                            <option value="CHILDREN_ONLY">{PORTION_TARGET_ICONS.CHILDREN_ONLY} Tylko dzieci</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <PortionTargetIcon target={setting.portionTarget || 'ALL'} className="w-4 h-4 text-neutral-500" />
                          </div>
                        </div>
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
                            className="mr-2 w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Wymagana
                          </span>
                        </label>
                      </div>

                      {/* Custom Label */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                          Własna etykieta
                        </label>
                        <input
                          type="text"
                          value={setting.customLabel || ''}
                          onChange={(e) =>
                            handleChange(category.id, 'customLabel', e.target.value || null)
                          }
                          placeholder={category.name}
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Validation Error Message */}
                    {hasError && (
                      <div className="mt-3 flex items-start gap-2 text-red-700 dark:text-red-400 text-xs bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Błąd walidacji:</strong> Minimalna wartość ({setting.minSelect}) nie może być większa niż maksymalna ({setting.maxSelect}).
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
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            {'📊'} Podsumowanie:
          </h3>
          <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
            {localSettings
              .filter((s) => s.isEnabled)
              .map((s) => {
                const cat = categories.find((c) => c.id === s.categoryId);
                const error = hasValidationError(s);
                const target = s.portionTarget || 'ALL';
                return (
                  <li key={s.categoryId} className={`flex items-center gap-2 ${error ? 'text-red-700 dark:text-red-400 font-medium' : ''}`}>
                    {error && '⚠️ '}
                    {'•'} <strong>{cat?.name}</strong>: {s.minSelect}{'–'}{s.maxSelect} wyborów
                    {s.isRequired && ' (wymagane)'}
                    {target !== 'ALL' && (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        target === 'ADULTS_ONLY'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
                      }`}>
                        {PORTION_TARGET_ICONS[target]} {PORTION_TARGET_LABELS[target]}
                      </span>
                    )}
                    {error && ' - NIEPRAWIDŁOWE!'}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}
