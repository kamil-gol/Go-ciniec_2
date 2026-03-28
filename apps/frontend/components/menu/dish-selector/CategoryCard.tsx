'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info, Ban } from 'lucide-react';
import type { PortionTarget } from '@/types/menu';
import { PortionTargetBadge } from './PortionTargetBadge';
import { ExtrasToggle } from './ExtrasToggle';
import { DishCard } from './DishCard';
import { isCategoryInactive, getInactiveReason, getGuestCountForTarget } from './helpers';
import { formatCurrency } from '@/lib/utils';

interface CategoryCardProps {
  category: any;
  adults: number;
  childrenCount: number;
  toddlers: number;
  selections: Record<string, number>;
  errors: Record<string, string>;
  extrasEnabled: boolean;
  extrasWarning?: string;
  getCategoryTotal: (categoryId: string) => number;
  getEffectiveMaxSelect: (category: any) => number;
  getCategoryRemaining: (categoryId: string) => number;
  getAvailableQuantityOptions: (categoryId: string, dishId: string) => number[];
  getExtraQuantity: (category: any) => number;
  getExtraCost: (category: any) => number;
  onToggleDish: (categoryId: string, dishId: string) => void;
  onUpdateQuantity: (categoryId: string, dishId: string, quantity: number) => void;
  onToggleExtras: (categoryId: string) => void;
}

export function CategoryCard({
  category,
  adults,
  childrenCount,
  toddlers,
  selections,
  errors,
  extrasEnabled: isExtrasOn,
  extrasWarning,
  getCategoryTotal,
  getEffectiveMaxSelect,
  getCategoryRemaining,
  getAvailableQuantityOptions,
  getExtraQuantity,
  getExtraCost,
  onToggleDish,
  onUpdateQuantity,
  onToggleExtras,
}: CategoryCardProps) {
  const total = getCategoryTotal(category.categoryId);
  const effectiveMax = getEffectiveMaxSelect(category);
  const remaining = getCategoryRemaining(category.categoryId);
  const isOptional = category.minSelect === 0;
  const isValid = total >= category.minSelect && total <= effectiveMax;
  const hasError = errors[category.categoryId];
  const isAtMaxLimit = total >= effectiveMax;
  const portionTarget = category.portionTarget as PortionTarget | undefined;
  const inactive = isCategoryInactive(portionTarget, adults, childrenCount);

  // #216: Extras info
  const hasExtrasSupport = category.extraItemPrice != null && category.maxExtra != null && Number(category.maxExtra) > 0;
  const extraQty = getExtraQuantity(category);
  const extraCost = getExtraCost(category);
  const baseMax = Number(category.maxSelect);
  const guestCount = getGuestCountForTarget(category.portionTarget, adults, childrenCount, toddlers);

  return (
    <Card
      role="region"
      aria-label={`Kategoria: ${category.customLabel || category.categoryName}${inactive ? ' (nieaktywna)' : ''}`}
      className={`border shadow-sm ${
        inactive ? 'opacity-50 grayscale' : ''
      }`}
    >
      <CardContent className="p-4">
        {/* Category Header */}
        <div className={inactive ? 'mb-1' : 'mb-3'}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{category.categoryIcon}</span>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-lg font-bold">{category.customLabel || category.categoryName}</h3>
                  {/* #166: Portion target badge */}
                  <PortionTargetBadge target={portionTarget} />
                </div>
                {/* #166: Subtitle for non-ALL targets */}
                {portionTarget && portionTarget !== 'ALL' && !inactive && (
                  <span className="text-xs text-muted-foreground">
                    Porcje liczone {portionTarget === 'ADULTS_ONLY' ? 'tylko dla dorosłych' : 'tylko dla dzieci'}
                  </span>
                )}
                {isOptional && !inactive && !portionTarget?.startsWith('ADULTS') && !portionTarget?.startsWith('CHILDREN') && (
                  <span className="text-xs font-medium text-muted-foreground">Opcjonalna kategoria</span>
                )}
                {isOptional && !inactive && portionTarget && portionTarget !== 'ALL' && (
                  <span className="text-xs font-medium text-muted-foreground"> · Opcjonalna</span>
                )}
              </div>
            </div>
            {!inactive && (
              <div className="flex items-center gap-2">
                {!isAtMaxLimit && total > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Pozostało: {remaining}
                  </span>
                )}
                <Badge
                  variant={isValid ? "default" : "secondary"}
                  className={`text-sm px-2.5 py-1 ${
                    isValid
                      ? isOptional && total === 0
                        ? 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {total} / {isOptional ? `0-${effectiveMax}` : `${category.minSelect}-${effectiveMax}`}
                </Badge>
              </div>
            )}
          </div>

          {/* #216: Extras toggle — only for categories that support extras */}
          {!inactive && hasExtrasSupport && (
            <ExtrasToggle
              categoryId={category.categoryId}
              isExtrasOn={isExtrasOn}
              extraQty={extraQty}
              extraCost={extraCost}
              baseMax={baseMax}
              effectiveMax={effectiveMax}
              guestCount={guestCount}
              maxExtra={Number(category.maxExtra)}
              extraItemPrice={Number(category.extraItemPrice)}
              extrasWarning={extrasWarning}
              onToggle={() => onToggleExtras(category.categoryId)}
            />
          )}

          {/* #166: Inactive category banner */}
          {inactive && (
            <Alert className="mt-2 py-2 bg-neutral-100 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700">
              <Ban className="h-3.5 w-3.5 text-neutral-500" />
              <AlertDescription className="text-xs text-neutral-600 dark:text-neutral-400">
                {getInactiveReason(portionTarget)}
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar — only for active categories */}
          {!inactive && (
            <div className="relative h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mt-2">
              {/* #216: Show base limit marker when extras are enabled */}
              {isExtrasOn && effectiveMax > baseMax && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-400 dark:bg-orange-500 z-10"
                  style={{ left: `${(baseMax / effectiveMax) * 100}%` }}
                  title={`Bazowy limit: ${baseMax}`}
                />
              )}
              <div
                className={`h-full transition-all duration-300 ${
                  !isOptional && total < category.minSelect ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                  total > effectiveMax ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                  total === 0 ? '' :
                  extraQty > 0
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-orange-500'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}
                style={{
                  width: `${Math.min((total / effectiveMax) * 100, 100)}%`
                }}
              />
            </div>
          )}

          {!inactive && isAtMaxLimit && (
            <Alert className="mt-2 py-2 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <Info className="h-3.5 w-3.5 text-blue-600" />
              <AlertDescription className="text-xs text-blue-900 dark:text-blue-100">
                Osiągnięto maksymalną liczbę pozycji. Odznacz danie aby wybrać inne.
              </AlertDescription>
            </Alert>
          )}

          {hasError && (
            <Alert variant="destructive" className="mt-2 py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">{hasError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Dishes Grid — hidden for inactive categories */}
        {!inactive && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {category.dishes.map((dish: any) => {
              const isSelected = !!selections[dish.id];
              const quantity = selections[dish.id] || 1;
              const isDisabled = !isSelected && isAtMaxLimit;
              const availableOptions = getAvailableQuantityOptions(category.categoryId, dish.id);

              return (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  categoryId={category.categoryId}
                  isSelected={isSelected}
                  quantity={quantity}
                  isDisabled={isDisabled}
                  availableOptions={availableOptions}
                  onToggle={() => onToggleDish(category.categoryId, dish.id)}
                  onQuantityChange={(qty) => onUpdateQuantity(category.categoryId, dish.id, qty)}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
