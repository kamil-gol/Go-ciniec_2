'use client';

import { useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface CategoryExtraSelection {
  packageCategoryId: string;
  categoryName: string;
  quantity: number;
  pricePerItem: number;
  maxExtra: number | null;
}

interface CategoryExtrasSelectorProps {
  /** Package's category settings with extra item prices */
  categorySettings: Array<{
    id: string;
    categoryId: string;
    extraItemPrice?: string | number | null;
    maxExtra?: number | null;
    customLabel?: string | null;
    isEnabled?: boolean;
    category?: {
      id: string;
      name: string;
      icon?: string | null;
    };
  }>;
  /** Currently selected extras */
  selectedExtras: CategoryExtraSelection[];
  /** Callback when extras change */
  onExtrasChange: (extras: CategoryExtraSelection[]) => void;
}

/**
 * #216: Category Extras Selector for create-reservation form (Step 3).
 * Shows categories that have extraItemPrice configured, allowing
 * the user to select a quantity of extra items per category.
 */
export default function CategoryExtrasSelector({
  categorySettings,
  selectedExtras,
  onExtrasChange,
}: CategoryExtrasSelectorProps) {
  // Filter only categories that support extras (extraItemPrice is set and > 0 or == 0)
  const extrasCategories = useMemo(() => {
    return categorySettings.filter(
      (cs) => cs.isEnabled !== false && cs.extraItemPrice != null
    );
  }, [categorySettings]);

  if (extrasCategories.length === 0) return null;

  const totalExtrasPrice = selectedExtras.reduce(
    (sum, e) => sum + e.quantity * e.pricePerItem,
    0
  );

  function getQuantity(packageCategoryId: string): number {
    return selectedExtras.find((e) => e.packageCategoryId === packageCategoryId)?.quantity ?? 0;
  }

  function updateQuantity(cs: typeof extrasCategories[0], newQuantity: number) {
    const price = Number(cs.extraItemPrice) || 0;
    const maxExtra = cs.maxExtra ?? null;
    const clampedQty = Math.max(0, maxExtra != null ? Math.min(newQuantity, maxExtra) : newQuantity);
    const categoryName = cs.customLabel || cs.category?.name || 'Kategoria';

    if (clampedQty === 0) {
      // Remove from selection
      onExtrasChange(selectedExtras.filter((e) => e.packageCategoryId !== cs.id));
    } else {
      const existing = selectedExtras.find((e) => e.packageCategoryId === cs.id);
      if (existing) {
        onExtrasChange(
          selectedExtras.map((e) =>
            e.packageCategoryId === cs.id ? { ...e, quantity: clampedQty } : e
          )
        );
      } else {
        onExtrasChange([
          ...selectedExtras,
          {
            packageCategoryId: cs.id,
            categoryName,
            quantity: clampedQty,
            pricePerItem: price,
            maxExtra,
          },
        ]);
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30">
          <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Dodatkowo płatne pozycje
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pozycje ponad limit pakietu — wyceniane per sztuka
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {extrasCategories.map((cs) => {
          const price = Number(cs.extraItemPrice) || 0;
          const qty = getQuantity(cs.id);
          const categoryName = cs.customLabel || cs.category?.name || 'Kategoria';
          const maxExtra = cs.maxExtra;

          return (
            <div
              key={cs.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                qty > 0
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {categoryName}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {formatCurrency(price)} / szt.
                  </span>
                </div>
                {maxExtra != null && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    maks. {maxExtra} szt.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(cs, qty - 1)}
                  disabled={qty === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className={`w-8 text-center text-sm font-semibold ${
                  qty > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-neutral-400'
                }`}>
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(cs, qty + 1)}
                  disabled={maxExtra != null && qty >= maxExtra}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {qty > 0 && (
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400 min-w-[70px] text-right">
                    {formatCurrency(qty * price)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalExtrasPrice > 0 && (
        <div className="flex justify-between items-center pt-2 border-t border-orange-200 dark:border-orange-800">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Suma dodatkowo płatnych pozycji:
          </span>
          <span className="text-base font-bold text-orange-600 dark:text-orange-400">
            +{formatCurrency(totalExtrasPrice)}
          </span>
        </div>
      )}
    </div>
  );
}
