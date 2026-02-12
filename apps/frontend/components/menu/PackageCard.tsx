/**
 * PackageCard Component
 *
 * Displays a menu package card with pricing and design-token styling
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { MenuPackage } from '@/types/menu.types';
import { Check, Users, DollarSign, CheckCircle2, Baby, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { moduleAccents } from '@/lib/design-tokens';

const accent = moduleAccents.menu;

interface PackageCardProps {
  package: MenuPackage;
  isSelected?: boolean;
  onSelect?: (pkg: MenuPackage) => void;
  className?: string;
}

export function PackageCard({
  package: pkg,
  isSelected,
  onSelect,
  className
}: PackageCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          'group rounded-2xl bg-white dark:bg-neutral-800/80 border-2 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden',
          isSelected
            ? 'border-blue-500 ring-4 ring-blue-500/20'
            : 'border-neutral-200/80 dark:border-neutral-700/50 hover:border-rose-300 dark:hover:border-rose-700',
          className
        )}
        onClick={() => onSelect?.(pkg)}
      >
        {/* Selected Badge */}
        {isSelected && (
          <div className="absolute top-4 right-4 z-20">
            <div className="p-2 bg-blue-500 rounded-full shadow-md">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
        )}

        <div className="relative p-6 space-y-5">
          {/* Header */}
          <div className="space-y-3">
            <div className={cn(
              'p-3 rounded-xl bg-gradient-to-br shadow-md w-fit',
              accent.iconBg
            )}>
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h3 className={cn(
              'text-xl font-bold text-neutral-900 dark:text-neutral-100 transition-colors',
              isSelected ? 'text-blue-600 dark:text-blue-400' : `group-hover:${accent.text} dark:group-hover:${accent.textDark}`
            )}>
              {pkg.name}
            </h3>
          </div>

          {/* Prices Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/50 dark:border-neutral-700/30">
              <Users className="h-4 w-4 mx-auto mb-1.5 text-neutral-600 dark:text-neutral-400" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Doro\u015bli</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{pkg.pricePerAdult} z\u0142</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
              <Smile className="h-4 w-4 mx-auto mb-1.5 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Dzieci</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{pkg.pricePerChild} z\u0142</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
              <Baby className="h-4 w-4 mx-auto mb-1.5 text-green-600 dark:text-green-400" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Maluchy</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{pkg.pricePerToddler} z\u0142</p>
            </div>
          </div>

          {/* Included Items */}
          {pkg.includedItems && pkg.includedItems.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                W pakiecie:
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {pkg.includedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/50 dark:border-neutral-700/30"
                  >
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2 text-neutral-700 dark:text-neutral-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hover / Selected Indicator */}
          <div className={cn(
            'transition-opacity pt-2',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}>
            <div className={cn(
              'text-sm font-semibold flex items-center justify-center gap-2 p-2.5 rounded-xl',
              isSelected
                ? 'bg-blue-500 text-white'
                : cn('bg-neutral-100 dark:bg-neutral-700', accent.text, accent.textDark)
            )}>
              {isSelected ? '\u2713 Wybrany' : 'Kliknij aby wybra\u0107'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PackageCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md">
      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div className="w-14 h-14 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          <div className="w-3/4 h-7 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="w-full h-20 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          <div className="w-full h-20 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          <div className="w-full h-20 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-full h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div className="w-full h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
