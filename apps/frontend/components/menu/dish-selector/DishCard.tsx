'use client';

import { Badge } from '@/components/ui/badge';
import { Check, CheckCircle2, Lock } from 'lucide-react';
import { useCallback } from 'react';

interface DishCardProps {
  dish: any;
  categoryId: string;
  isSelected: boolean;
  quantity: number;
  isDisabled: boolean;
  availableOptions: number[];
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
}

export function DishCard({
  dish,
  categoryId,
  isSelected,
  quantity,
  isDisabled,
  availableOptions,
  onToggle,
  onQuantityChange,
}: DishCardProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isDisabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  }, [isDisabled, onToggle]);

  return (
    <div
      role="checkbox"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      className={`group relative p-3 border rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900'
          : isSelected
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 shadow-md scale-[1.01] cursor-pointer'
            : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 hover:border-blue-300 hover:shadow-sm cursor-pointer'
      }`}
      onClick={() => !isDisabled && onToggle()}
      onKeyDown={handleKeyDown}
    >
      {isDisabled && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-neutral-400 rounded-full flex items-center justify-center">
          <Lock className="h-3 w-3 text-white" />
        </div>
      )}

      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-200">
          <Check className="h-3.5 w-3.5 text-white font-bold" strokeWidth={3} />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
          isDisabled
            ? 'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600'
            : isSelected
              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-500 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-400 dark:border-neutral-500 group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30'
        }`}>
          {isSelected && (
            <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${
            isDisabled
              ? 'text-neutral-400 dark:text-neutral-600'
              : isSelected
                ? 'text-blue-900 dark:text-blue-100'
                : 'text-neutral-900 dark:text-neutral-100'
          }`}>
            {dish.name}
          </h4>
          {dish.description && (
            <p className={`text-xs mt-0.5 line-clamp-2 ${
              isDisabled ? 'text-neutral-400' : 'text-muted-foreground'
            }`}>
              {dish.description}
            </p>
          )}

          {dish.allergens && dish.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {dish.allergens.map((allergen: string) => (
                <Badge
                  key={allergen}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400"
                >
                  {allergen}
                </Badge>
              ))}
            </div>
          )}

          {isSelected && (
            <div className="mt-2 p-2 bg-white dark:bg-neutral-800 rounded-md border border-blue-200 dark:border-blue-800" onClick={(e) => e.stopPropagation()}>
              <label className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1 block">
                Ilość porcji:
              </label>
              <select
                value={quantity}
                onChange={(e) => onQuantityChange(parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 border border-blue-300 dark:border-blue-700 rounded-md text-sm font-bold bg-white dark:bg-neutral-900 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              >
                {availableOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt === Math.floor(opt) ? opt : opt.toFixed(1)} {opt === 1 ? 'porcja' : opt > 1 && opt < 5 ? 'porcje' : 'porcji'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
