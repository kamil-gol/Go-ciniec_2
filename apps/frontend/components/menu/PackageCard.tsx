/**
 * PackageCard Component
 * 
 * Displays a menu package with pricing and details
 */

'use client';

import { MenuPackage } from '@/types/menu.types';
import { Check, Star, Crown, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const priceAdult = typeof pkg.pricePerAdult === 'string' 
    ? parseFloat(pkg.pricePerAdult) 
    : pkg.pricePerAdult;
  const priceChild = typeof pkg.pricePerChild === 'string' 
    ? parseFloat(pkg.pricePerChild) 
    : pkg.pricePerChild;
  const priceToddler = typeof pkg.pricePerToddler === 'string' 
    ? parseFloat(pkg.pricePerToddler) 
    : pkg.pricePerToddler;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 bg-white p-6',
        'transition-all duration-200',
        isSelected
          ? 'border-violet-500 shadow-xl shadow-violet-100 dark:shadow-violet-900/20'
          : 'border-neutral-200 hover:border-violet-300 hover:shadow-lg dark:border-neutral-800',
        'dark:bg-neutral-900',
        onSelect && 'cursor-pointer',
        className
      )}
      onClick={() => onSelect?.(pkg)}
    >
      {/* Badges */}
      <div className="mb-4 flex items-center gap-2">
        {pkg.isPopular && (
          <div className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            <Star className="h-3 w-3 fill-current" />
            Popularny
          </div>
        )}
        {pkg.isRecommended && (
          <div className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <Crown className="h-3 w-3" />
            Polecany
          </div>
        )}
        {pkg.badgeText && (
          <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {pkg.badgeText}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
        {pkg.name}
      </h3>

      {/* Short Description */}
      {pkg.shortDescription && (
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          {pkg.shortDescription}
        </p>
      )}

      {/* Pricing */}
      <div className="mb-6 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Dorośli</span>
          <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {formatPrice(priceAdult)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Dzieci (do 12 lat)</span>
          <span className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
            {formatPrice(priceChild)}
          </span>
        </div>
        {priceToddler === 0 ? (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Maluchy (do 3 lat)</span>
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
              Gratis
            </span>
          </div>
        ) : (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Maluchy (do 3 lat)</span>
            <span className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
              {formatPrice(priceToddler)}
            </span>
          </div>
        )}
      </div>

      {/* Guest Limits */}
      {(pkg.minGuests || pkg.maxGuests) && (
        <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Users className="h-4 w-4" />
          <span>
            {pkg.minGuests && `Min. ${pkg.minGuests}`}
            {pkg.minGuests && pkg.maxGuests && ' - '}
            {pkg.maxGuests && `Maks. ${pkg.maxGuests}`}
            {' osób'}
          </span>
        </div>
      )}

      {/* Included Items */}
      {pkg.includedItems && pkg.includedItems.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            W pakiecie:
          </h4>
          <ul className="space-y-2">
            {pkg.includedItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Description */}
      {pkg.description && (
        <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {pkg.description}
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute right-4 top-4 rounded-full bg-violet-500 p-2 shadow-lg">
          <Check className="h-5 w-5 text-white" />
        </div>
      )}

      {/* Color Accent */}
      {pkg.color && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: pkg.color }}
        />
      )}
    </motion.div>
  );
}

/**
 * PackageCardSkeleton - Loading state
 */
export function PackageCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 h-6 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
      <div className="mb-2 h-8 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mb-6 h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mb-6 space-y-2">
        <div className="h-8 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-6 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-6 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}
