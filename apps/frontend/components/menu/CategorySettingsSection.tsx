'use client';

import { useState, useEffect } from 'react';
import type { DishCategory, CategorySettingInput, PortionTarget } from '@/types/menu';
import { PORTION_TARGET_LABELS, PORTION_TARGET_ICONS } from '@/types/menu';
import { AlertCircle, Users, User, Baby, ShoppingCart } from 'lucide-react';

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

  /**
   * Get the global displayOrder for a category from the categories prop.
   * Falls back to a high number so unknown categories sort last.
   */
  function getGlobalCategoryOrder(categoryId: string): number {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.displayOrder ?? 999;
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
          displayOrder: getGlobalCategoryOrder(categoryId), // Use global category order
          extraItemPrice: null, // #216: domyślnie brak extras
          maxExtra: null,
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
            <span className="text-2xl">{'\ud83c\udf7d\ufe0f'}</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Kategorie dań w pakiecie</h2>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Wybierz kategorie dań dostępne w tym pakiecie i ustaw limity wyboru
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600">
          <div className="text-4xl mb-3">{'\ud83d\udcc2'}</div>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">Brak kategorii dań</p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
            Dodaj kategorie dań w sekcji {'"'}Kategorie{'"'} aby móc je przypisywać do pakietów
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const enabled = isEnabled(category.id);
            const setting = getSetting(category.id);
            const hasError = setting ? hasValidationError(setting) : false;

            return (
              <div
                key={category.id}
                className={`border-2 rounded-xl p-6 transition-all duration-200 ${
                  enabled
                    ? hasError
                      ? 'border-red-400 bg-red-50/80 dark:bg-red-950/20 shadow-md'
                      : 'border-blue-400 bg-blue-50/80 dark:bg-blue-950/20 shadow-md'
                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50'
                }`}
              >
                {/* Header with toggle */}
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => handleToggle(category.id, e.target.checked)}
                        className="w-6 h-6 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {category.name}
                        </span>
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400 font-mono">{category.slug}</span>
                      </div>
                    </div>
                  </label>

                  {/* #166: Portion target selector */}
                  {enabled && setting && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 shadow-sm">
                        <PortionTargetIcon target={(setting.portionTarget || 'ALL') as PortionTarget} className="w-4 h-4 text-neutral-500" />
                        <select
                          value={setting.portionTarget || 'ALL'}
                          onChange={(e) => handleChange(category.id, 'portionTarget', e.target.value)}
                          className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer text-neutral-700 dark:text-neutral-300 pr-6"
                        >
                          {Object.entries(PORTION_TARGET_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {'\ud83d\udc65'} Wszyscy
                      </span>
                    </div>
                  )}
                </div>

                {/* Settings (visible when enabled) */}
                {enabled && setting && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
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
                          min="0"
                          step="0.5"
                          className={`w-full px-4 py-2.5 border-2 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            hasError ? 'border-red-400' : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                          Max wyborów
                        </label>
                        <input
                          type="number"
                          value={setting.maxSelect}
                          onChange={(e) =>
                            handleChange(
                              category.id,
                              'maxSelect',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          step="0.5"
                          className={`w-full px-4 py-2.5 border-2 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            hasError ? 'border-red-400' : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                        />
                      </div>
                    </div>

                    {hasError && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-4 py-2.5 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Minimalna wartość nie może być większa niż maksymalna</span>
                      </div>
                    )}

                    {/* Porcje dla & Wymagana */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                          Porcje dla
                        </label>
                        <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-3 py-2">
                          <PortionTargetIcon target={(setting.portionTarget || 'ALL') as PortionTarget} className="w-4 h-4 text-neutral-500" />
                          <select
                            value={setting.portionTarget || 'ALL'}
                            onChange={(e) => handleChange(category.id, 'portionTarget', e.target.value)}
                            className="flex-1 text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer text-neutral-700 dark:text-neutral-300"
                          >
                            {Object.entries(PORTION_TARGET_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          checked={setting.isRequired}
                          onChange={(e) =>
                            handleChange(category.id, 'isRequired', e.target.checked)
                          }
                          className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Wymagana</span>
                      </div>
                    </div>

                    {/* Własna etykieta */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                        Własna etykieta
                      </label>
                      <input
                        type="text"
                        value={setting.customLabel || ''}
                        onChange={(e) =>
                          handleChange(category.id, 'customLabel', e.target.value || undefined)
                        }
                        placeholder={category.name}
                        className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* #216: Dodatkowe pozycje płatne */}
                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={setting.extraItemPrice != null}
                          onChange={(e) => {
                            const updates = e.target.checked
                              ? { extraItemPrice: 0, maxExtra: 5 }
                              : { extraItemPrice: null, maxExtra: null };
                            const newSettings = localSettings.map((s) =>
                              s.categoryId === category.id ? { ...s, ...updates } : s
                            );
                            setLocalSettings(newSettings);
                            onChange(newSettings);
                          }}
                          className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 text-orange-600 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        />
                        <ShoppingCart className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Dodatkowo płatne porcje
                        </span>
                      </label>

                      {setting.extraItemPrice != null && (
                        <div className="grid grid-cols-2 gap-4 ml-7">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                              Cena za szt. (PLN)
                            </label>
                            <input
                              type="number"
                              value={setting.extraItemPrice ?? ''}
                              onChange={(e) =>
                                handleChange(
                                  category.id,
                                  'extraItemPrice',
                                  e.target.value === '' ? 0 : parseFloat(e.target.value)
                                )
                              }
                              onFocus={(e) => {
                                if (e.target.value === '0') e.target.value = '';
                              }}
                              onBlur={(e) => {
                                if (e.target.value === '') {
                                  handleChange(category.id, 'extraItemPrice', 0);
                                }
                              }}
                              min="0"
                              step="0.01"
                              placeholder="0"
                              className="w-full px-4 py-2.5 border-2 border-orange-200 dark:border-orange-700 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder:text-neutral-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                              Max dodatkowych
                            </label>
                            <input
                              type="number"
                              value={setting.maxExtra ?? ''}
                              onChange={(e) =>
                                handleChange(
                                  category.id,
                                  'maxExtra',
                                  e.target.value ? parseInt(e.target.value) : null
                                )
                              }
                              min="1"
                              placeholder="Bez limitu"
                              className="w-full px-4 py-2.5 border-2 border-orange-200 dark:border-orange-700 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder:text-neutral-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
