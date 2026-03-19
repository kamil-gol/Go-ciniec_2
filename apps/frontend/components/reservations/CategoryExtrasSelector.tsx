'use client';

import { useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Info, Users, User, Baby } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface CategoryExtraSelection {
  packageCategoryId: string;
  categoryName: string;
  quantity: number;         // 0.5 step: 0, 0.5, 1, 1.5...
  pricePerItem: number;     // per-person per-extra-portion
  maxExtra: number | null;
  portionTarget: string;    // ALL | ADULTS_ONLY | CHILDREN_ONLY
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
    portionTarget?: string;
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
  /** Guest counts for per-person pricing */
  adults?: number;
  children?: number;
  toddlers?: number;
}

/** Get relevant guest count for portionTarget */
function getGuestCount(portionTarget: string | undefined, adults: number, children: number, toddlers: number): number {
  switch (portionTarget) {
    case 'ADULTS_ONLY': return adults;
    case 'CHILDREN_ONLY': return children;
    case 'ALL':
    default: return adults + children + toddlers;
  }
}

/** Short label for portion target */
function getPortionLabel(portionTarget: string | undefined): string | null {
  switch (portionTarget) {
    case 'ADULTS_ONLY': return 'dorośli';
    case 'CHILDREN_ONLY': return 'dzieci';
    default: return null;
  }
}

/**
 * #216: Category Extras Selector for create-reservation form (Step 3).
 * Shows categories that have extraItemPrice configured, allowing
 * the user to select a quantity of extra items per category.
 * Pricing: per-person (quantity × pricePerItem × guestCount based on portionTarget).
 * Quantity step: 0.5
 */
export default function CategoryExtrasSelector({
  categorySettings,
  selectedExtras,
  onExtrasChange,
  adults = 0,
  children = 0,
  toddlers = 0,
}: CategoryExtrasSelectorProps) {
  // Filter only categories that support extras (extraItemPrice is set)
  const extrasCategories = useMemo(() => {
    return categorySettings.filter(
      (cs) => cs.isEnabled !== false && cs.extraItemPrice != null
    );
  }, [categorySettings]);

  if (extrasCategories.length === 0) return null;

  // Total per-person extras price
  const totalExtrasPrice = selectedExtras.reduce((sum, e) => {
    const guests = getGuestCount(e.portionTarget, adults, children, toddlers);
    return sum + e.quantity * e.pricePerItem * guests;
  }, 0);

  function getQuantity(packageCategoryId: string): number {
    return selectedExtras.find((e) => e.packageCategoryId === packageCategoryId)?.quantity ?? 0;
  }

  function updateQuantity(cs: typeof extrasCategories[0], newQuantity: number) {
    const price = Number(cs.extraItemPrice) || 0;
    const maxExtra = cs.maxExtra != null ? Number(cs.maxExtra) : null;
    // Clamp: 0.5 step, min 0, max maxExtra
    const clampedQty = Math.max(0, maxExtra != null ? Math.min(newQuantity, maxExtra) : newQuantity);
    // Round to nearest 0.5
    const roundedQty = Math.round(clampedQty * 2) / 2;
    const categoryName = cs.customLabel || cs.category?.name || 'Kategoria';
    const portionTarget = cs.portionTarget || 'ALL';

    if (roundedQty <= 0) {
      onExtrasChange(selectedExtras.filter((e) => e.packageCategoryId !== cs.id));
    } else {
      const existing = selectedExtras.find((e) => e.packageCategoryId === cs.id);
      if (existing) {
        onExtrasChange(
          selectedExtras.map((e) =>
            e.packageCategoryId === cs.id ? { ...e, quantity: roundedQty } : e
          )
        );
      } else {
        onExtrasChange([
          ...selectedExtras,
          {
            packageCategoryId: cs.id,
            categoryName,
            quantity: roundedQty,
            pricePerItem: price,
            maxExtra,
            portionTarget,
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
            Pozycje ponad limit pakietu — cena naliczana per osoba
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {extrasCategories.map((cs) => {
          const price = Number(cs.extraItemPrice) || 0;
          const qty = getQuantity(cs.id);
          const categoryName = cs.customLabel || cs.category?.name || 'Kategoria';
          const maxExtra = cs.maxExtra != null ? Number(cs.maxExtra) : null;
          const portionTarget = cs.portionTarget || 'ALL';
          const guestCount = getGuestCount(portionTarget, adults, children, toddlers);
          const lineTotal = qty * price * guestCount;
          const portionLabel = getPortionLabel(portionTarget);

          return (
            <div
              key={cs.id}
              className={`p-3 rounded-lg border transition-colors ${
                qty > 0
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {categoryName}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {formatCurrency(price)} / os.
                    </span>
                    {portionLabel && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0 rounded-full ${
                        portionTarget === 'ADULTS_ONLY'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
                      }`}>
                        {portionTarget === 'ADULTS_ONLY' ? <User className="w-2.5 h-2.5" /> : <Baby className="w-2.5 h-2.5" />}
                        {portionLabel}
                      </span>
                    )}
                  </div>
                  {maxExtra != null && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      maks. {maxExtra} porcji · {guestCount} os.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity(cs, qty - 0.5)}
                    disabled={qty === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className={`w-10 text-center text-sm font-semibold ${
                    qty > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-neutral-400'
                  }`}>
                    {qty === Math.floor(qty) ? qty : qty.toFixed(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(cs, qty + 0.5)}
                    disabled={maxExtra != null && qty >= maxExtra}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Per-person breakdown when active */}
              {qty > 0 && (
                <div className="mt-2 pt-2 border-t border-orange-200/50 dark:border-orange-700/50 flex items-center justify-between">
                  <span className="text-xs text-orange-600/80 dark:text-orange-400/80">
                    {qty === Math.floor(qty) ? qty : qty.toFixed(1)} × {formatCurrency(price)} × {guestCount} os.
                  </span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>
              )}
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
