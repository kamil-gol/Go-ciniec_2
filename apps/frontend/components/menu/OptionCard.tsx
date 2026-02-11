/**
 * OptionCard Component
 * 
 * Displays a menu option card with quantity selector and premium UI
 */

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MenuOption } from '@/types/menu.types';
import { Minus, Plus, Sparkles, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translateOptionCategory } from '@/lib/menu-utils';
import { motion, AnimatePresence } from 'framer-motion';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all duration-300 group',
          isSelected
            ? 'border-green-500 ring-4 ring-green-500/20'
            : 'border-transparent hover:border-purple-200',
          className
        )}
      >
        {/* Gradient Overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-rose-500/5 transition-all",
          isSelected && "from-green-500/10 via-emerald-500/10 to-teal-500/10",
          "group-hover:from-purple-500/10 group-hover:via-pink-500/10 group-hover:to-rose-500/10"
        )} />

        {/* Glow Effect */}
        <div className={cn(
          "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl transition-all",
          isSelected ? "bg-green-400/20" : "bg-purple-400/10 group-hover:bg-purple-400/20"
        )} />
        
        <div className="relative z-10 p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "p-3 rounded-2xl shadow-lg transition-all",
              isSelected
                ? "bg-gradient-to-br from-green-500 to-emerald-500"
                : "bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110"
            )}>
              <Sparkles className="h-6 w-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <h3 className={cn(
                    "text-lg font-bold transition-colors",
                    isSelected && "text-green-600"
                  )}>
                    {option.name}
                  </h3>
                  {option.category && (
                    <Badge
                      className={cn(
                        "border-0",
                        isSelected
                          ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400"
                      )}
                    >
                      {translatedCategory}
                    </Badge>
                  )}
                </div>

                {/* Price Badge */}
                <div className={cn(
                  "px-4 py-2 rounded-xl shadow-md",
                  isSelected
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                )}>
                  <div className="flex items-center gap-1 text-white">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xl font-bold">{option.priceAmount}</span>
                    <span className="text-xs opacity-90">zł</span>
                  </div>
                  <p className="text-[10px] text-white/80 text-center mt-0.5">
                    {isPricePerPerson ? 'za osobę' : 'stała'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {option.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 pr-2">
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
                      "h-10 w-10 p-0 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-green-300 hover:bg-green-50 hover:border-green-400"
                        : "border-purple-200 hover:bg-purple-50 hover:border-purple-300"
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
                        "w-16 h-10 flex items-center justify-center rounded-xl font-bold text-lg shadow-md",
                        isSelected
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "bg-white dark:bg-gray-900 border-2"
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
                      "h-10 w-10 p-0 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-green-300 hover:bg-green-50 hover:border-green-400"
                        : "border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status Indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full shadow-md"
                    >
                      ✓ Dodano
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Skeleton Loader
export function OptionCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-1/3 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="w-1/2 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
}
