/**
 * MenuSummary Component
 * 
 * Display summary of menu selection with price breakdown
 */

'use client';

import { 
  MenuTemplate,
  MenuPackage, 
  MenuOption,
  PriceBreakdown as PriceBreakdownType
} from '@/types/menu.types';
import { PriceBreakdown } from './PriceBreakdown';
import { MenuDishesPreview } from './MenuDishesPreview';
import { Package, Users, Check, Edit, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DishSelection {
  dishId: string;
  dishName: string;
  quantity: number;
  allergens?: string[];
  description?: string;
}

interface CategorySelection {
  categoryId: string;
  categoryName: string;
  dishes: DishSelection[];
}

interface MenuSummaryProps {
  template: MenuTemplate;
  package: MenuPackage;
  selectedOptions: (MenuOption & { quantity: number })[];
  guestCounts: {
    adults: number;
    childrenCount: number;
    toddlers: number;
  };
  dishSelections?: CategorySelection[];
  priceBreakdown?: PriceBreakdownType;
  onEdit?: () => void;
  onConfirm?: () => void;
  className?: string;
}

export function MenuSummary({
  template,
  package: pkg,
  selectedOptions,
  guestCounts,
  dishSelections,
  priceBreakdown,
  onEdit,
  onConfirm,
  className
}: MenuSummaryProps) {
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const totalGuests = guestCounts.adults + guestCounts.childrenCount + guestCounts.toddlers;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Podsumowanie Wybór Menu
        </h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Sprawdź szczegóły przed potwierdzeniem
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Details */}
        <div className="space-y-4">
          {/* Template Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <h3 className="font-bold text-neutral-900 dark:text-white">Menu</h3>
              </div>
              {template.eventType && (
                <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  {template.eventType.name}
                </div>
              )}
            </div>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {template.name}
            </p>
            {template.variant && (
              <p className="text-sm text-neutral-500">{template.variant}</p>
            )}
          </motion.div>

          {/* Package Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-violet-600" />
              <h3 className="font-bold text-neutral-900 dark:text-white">Pakiet</h3>
            </div>
            <p className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
              {pkg.name}
            </p>
            
            {/* Pricing */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Dorośli</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatPrice(pkg.pricePerAdult)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Dzieci</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatPrice(pkg.pricePerChild)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Maluchy</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {typeof pkg.pricePerToddler === 'string' && parseFloat(pkg.pricePerToddler) === 0 
                    ? 'Gratis' 
                    : formatPrice(pkg.pricePerToddler)}
                </span>
              </div>
            </div>

            {/* Included Items */}
            {pkg.includedItems && pkg.includedItems.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  W pakiecie:
                </p>
                <ul className="space-y-1">
                  {pkg.includedItems.slice(0, 5).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                  {pkg.includedItems.length > 5 && (
                    <li className="text-sm text-neutral-500">
                      +{pkg.includedItems.length - 5} więcej...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </motion.div>

          {/* Selected Dishes Preview */}
          {dishSelections && dishSelections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <MenuDishesPreview dishSelections={dishSelections} />
            </motion.div>
          )}

          {/* Guest Counts Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              <h3 className="font-bold text-neutral-900 dark:text-white">Goście</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Dorośli</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {guestCounts.adults} osób
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Dzieci</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {guestCounts.childrenCount} osób
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Maluchy</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {guestCounts.toddlers} osób
                </span>
              </div>
              <div className="border-t border-neutral-200 pt-2 dark:border-neutral-700">
                <div className="flex justify-between">
                  <span className="font-bold text-neutral-900 dark:text-white">Razem</span>
                  <span className="font-bold text-violet-600">{totalGuests} osób</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Options Card */}
          {selectedOptions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="mb-4 font-bold text-neutral-900 dark:text-white">
                Opcje Dodatkowe ({selectedOptions.length})
              </h3>
              <ul className="space-y-3">
                {selectedOptions.map((option) => (
                  <li key={option.id} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {option.name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {option.category}
                        {option.quantity > 1 && ` × ${option.quantity}`}
                      </p>
                    </div>
                    <span className="font-semibold text-violet-600">
                      {option.priceType === 'FREE' ? 'Gratis' : formatPrice(option.priceAmount)}
                      {option.priceType === 'PER_PERSON' && (
                        <span className="text-xs text-neutral-500"> /os.</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Right: Price Breakdown */}
        {priceBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="sticky top-6">
              <PriceBreakdown breakdown={priceBreakdown} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      {(onEdit || onConfirm) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-4"
        >
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Edit className="h-5 w-5" />
              Edytuj
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Check className="h-5 w-5" />
              Potwierdź Wybór
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
