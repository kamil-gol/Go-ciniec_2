/**
 * OptionCard Component
 *
 * Displays a menu option card with quantity selector and design-token styling
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MenuOption } from '@/types/menu.types';
import { Minus, Plus, Sparkles, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translateOptionCategory } from '@/lib/menu-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { moduleAccents } from '@/lib/design-tokens';

const accent = moduleAccents.menu;

interface OptionCardProps {
  option: MenuOption;
  quantity: number;
  onQuantityChange?: (id: string, quantity: number) => void;
  className?: string;
}

export function OptionCard({
  option,
  quantity,
  onQuantityChange,
  className
}: OptionCardProps) {
  const isSelected = quantity > 0;
  const isPricePerPerson = option.priceType === 'PER_PERSON';
  const translatedCategory = translateOptionCategory(option.category);

  const handleIncrement = () => {
    onQuantityChange?.(option.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange?.(option.id, quantity - 1);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <div
        className={cn(
          'group rounded-2xl bg-white dark:bg-neutral-800/80 border-2 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden',
          isSelected
            ? 'border-green-500 ring-4 ring-green-500/20'
            : 'border-neutral-200/80 dark:border-neutral-700/50 hover:border-rose-300 dark:hover:border-rose-700',
          className
        )}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              'p-3 rounded-xl shadow-md transition-all flex-shrink-0',
              isSelected
                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                : cn('bg-gradient-to-br', accent.iconBg)
            )}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className={cn(
                    'text-lg font-bold text-neutral-900 dark:text-neutral-100 transition-colors truncate',
                    isSelected && 'text-green-600 dark:text-green-400'
                  )}>
                    {option.name}
                  </h3>
                  {option.category && (
                    <Badge
                      className={cn(
                        'border-0 shadow-none',
                        isSelected
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : cn(accent.badge, accent.badgeText)
                      )}
                    >
                      {translatedCategory}
                    </Badge>
                  )}
                </div>

                {/* Price Badge */}
                <div className={cn(
                  'px-3 py-2 rounded-xl shadow-md flex-shrink-0',
                  isSelected
                    ? 'bg-green-500'
                    : cn('bg-gradient-to-r', accent.gradient)
                )}>
                  <div className="flex items-center gap-1 text-white">
                    <span className="text-lg font-bold">{option.priceAmount}</span>
                    <span className="text-xs opacity-90">z\u0142</span>
                  </div>
                  <p className="text-[10px] text-white/80 text-center mt-0.5">
                    {isPricePerPerson ? 'za osob\u0119' : 'sta\u0142a'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {option.description && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {option.description}
                </p>
              )}

              {/* Quantity Controls */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDecrement}
                    disabled={quantity === 0}
                    className={cn(
                      'h-10 w-10 p-0 rounded-xl border-2 transition-all',
                      isSelected
                        ? 'border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    )}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={quantity}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className={cn(
                        'w-14 h-10 flex items-center justify-center rounded-xl font-bold text-lg shadow-sm',
                        isSelected
                          ? 'bg-green-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100'
                      )}
                    >
                      {quantity}
                    </motion.div>
                  </AnimatePresence>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleIncrement}
                    className={cn(
                      'h-10 w-10 p-0 rounded-xl border-2 transition-all',
                      isSelected
                        ? 'border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full shadow-sm"
                    >
                      \u2713 Dodano
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function OptionCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="w-3/4 h-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                <div className="w-1/3 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
              </div>
              <div className="w-16 h-14 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
            </div>
            <div className="w-1/2 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
