/**
 * PriceBreakdown Component
 * 
 * Displays detailed price calculation for reservation menu
 */

'use client';

import { PriceBreakdown as PriceBreakdownType } from '@/types/menu.types';
import { Users, Package, Plus, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
  showDetails?: boolean;
  className?: string;
}

export function PriceBreakdown({ 
  breakdown, 
  showDetails = true,
  className 
}: PriceBreakdownProps) {
  const [isPackageExpanded, setIsPackageExpanded] = useState(true);
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900', className)}>
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-violet-600" />
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
          Rozliczenie cen
        </h3>
      </div>

      {showDetails && (
        <div className="space-y-4">
          {/* Package Cost Section */}
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setIsPackageExpanded(!isPackageExpanded)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-violet-600" />
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Pakiet
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-violet-600">
                  {formatPrice(breakdown.packageCost.subtotal)}
                </span>
                {isPackageExpanded ? (
                  <ChevronUp className="h-4 w-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isPackageExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: motionTokens.duration.fast }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 border-t border-neutral-200 p-4 dark:border-neutral-700">
                    {/* Adults */}
                    {breakdown.packageCost.adults.count > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                          <Users className="h-4 w-4" />
                          <span>
                            {breakdown.packageCost.adults.count} × Dorośli ({formatPrice(breakdown.packageCost.adults.priceEach)})
                          </span>
                        </div>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {formatPrice(breakdown.packageCost.adults.total)}
                        </span>
                      </div>
                    )}

                    {/* Children */}
                    {breakdown.packageCost.children.count > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                          <Users className="h-4 w-4" />
                          <span>
                            {breakdown.packageCost.children.count} × Dzieci ({formatPrice(breakdown.packageCost.children.priceEach)})
                          </span>
                        </div>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {formatPrice(breakdown.packageCost.children.total)}
                        </span>
                      </div>
                    )}

                    {/* Toddlers */}
                    {breakdown.packageCost.toddlers.count > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                          <Users className="h-4 w-4" />
                          <span>
                            {breakdown.packageCost.toddlers.count} × Maluchy 
                            {breakdown.packageCost.toddlers.priceEach > 0 
                              ? ` (${formatPrice(breakdown.packageCost.toddlers.priceEach)})`
                              : ' (Gratis)'
                            }
                          </span>
                        </div>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {breakdown.packageCost.toddlers.total > 0 
                            ? formatPrice(breakdown.packageCost.toddlers.total)
                            : 'Gratis'
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Options Cost Section */}
          {breakdown.optionsCost.length > 0 && (
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-violet-600" />
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    Opcje dodatkowe
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-violet-600">
                    {formatPrice(breakdown.optionsSubtotal)}
                  </span>
                  {isOptionsExpanded ? (
                    <ChevronUp className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isOptionsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: motionTokens.duration.fast }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 border-t border-neutral-200 p-4 dark:border-neutral-700">
                      {breakdown.optionsCost.map((option, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-neutral-900 dark:text-white">
                              {option.option}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {option.quantity} × {formatPrice(option.priceEach)}
                              {option.priceType === 'PER_PERSON' && ' (za os.)'}
                              {option.priceType === 'FLAT' && ' (jednorazowo)'}
                            </span>
                          </div>
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {formatPrice(option.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="mt-6 flex items-center justify-between border-t border-neutral-300 pt-4 dark:border-neutral-700">
        <span className="text-lg font-bold text-neutral-900 dark:text-white">
          SUMA CAŁKOWITA
        </span>
        <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
          {formatPrice(breakdown.totalMenuPrice)}
        </span>
      </div>

      {/* VAT Info */}
      <div className="mt-2 text-center text-xs text-neutral-500">
        Ceny brutto (zawierają VAT)
      </div>
    </div>
  );
}

/**
 * PriceBreakdownSkeleton - Loading state
 */
export function PriceBreakdownSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 h-6 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="space-y-4">
        <div className="h-16 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-16 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-neutral-300 pt-4 dark:border-neutral-700">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
