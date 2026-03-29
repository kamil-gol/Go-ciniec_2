'use client';

import { ShoppingCart, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ExtrasToggleProps {
  categoryId: string;
  isExtrasOn: boolean;
  extraQty: number;
  extraCost: number;
  baseMax: number;
  effectiveMax: number;
  guestCount: number;
  maxExtra: number;
  extraItemPrice: number;
  extrasWarning?: string;
  onToggle: () => void;
}

export function ExtrasToggle({
  categoryId,
  isExtrasOn,
  extraQty,
  extraCost,
  baseMax,
  effectiveMax,
  guestCount,
  maxExtra,
  extraItemPrice,
  extrasWarning,
  onToggle,
}: ExtrasToggleProps) {
  return (
    <div className={`mt-2 p-2.5 rounded-lg border transition-colors ${
      isExtrasOn
        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
        : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
    }`}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isExtrasOn}
          onChange={onToggle}
          className="w-4 h-4 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
        />
        <ShoppingCart className={`w-3.5 h-3.5 ${isExtrasOn ? 'text-orange-600' : 'text-neutral-400'}`} />
        <span className={`text-xs font-semibold ${isExtrasOn ? 'text-orange-800 dark:text-orange-200' : 'text-neutral-600 dark:text-neutral-300'}`}>
          Dodatkowa płatna pozycja (+{maxExtra} porcji, {formatCurrency(extraItemPrice)}/os.)
        </span>
      </label>
      {isExtrasOn && extraQty > 0 && (
        <div className="mt-1.5 ml-6 text-xs text-orange-700 dark:text-orange-300 font-medium">
          Extra: {extraQty} × {formatCurrency(extraItemPrice)} × {guestCount} os. = {formatCurrency(extraCost)}
        </div>
      )}
      {isExtrasOn && extraQty === 0 && !extrasWarning && (
        <div className="mt-1.5 ml-6 text-xs text-neutral-500 dark:text-neutral-300">
          Limit zwiększony do {effectiveMax}. Wybierz ponad {baseMax} pozycji, aby naliczyć dodatkowe.
        </div>
      )}
      {extrasWarning && (
        <div className="mt-2 ml-6 p-2 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300">
              {extrasWarning}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
