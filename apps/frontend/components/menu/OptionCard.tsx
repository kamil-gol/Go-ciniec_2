/**
 * OptionCard Component
 * 
 * Displays a menu option with quantity selector
 */

'use client';

import { MenuOption } from '@/types/menu.types';
import { 
  Plus, 
  Minus, 
  Wine, 
  Music, 
  Camera, 
  Sparkles, 
  Cake,
  Gift,
  PartyPopper
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface OptionCardProps {
  option: MenuOption;
  quantity?: number;
  onQuantityChange?: (optionId: string, quantity: number) => void;
  className?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Alkohol': Wine,
  'Muzyka': Music,
  'Foto & Video': Camera,
  'Dekoracje': Sparkles,
  'Dodatki': Cake,
  'Dodatkowe': Gift,
  'Rozrywka': PartyPopper,
  'Animacje': PartyPopper,
};

export function OptionCard({ 
  option, 
  quantity = 0,
  onQuantityChange,
  className 
}: OptionCardProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity);

  const price = typeof option.priceAmount === 'string' 
    ? parseFloat(option.priceAmount) 
    : option.priceAmount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPriceLabel = () => {
    if (option.priceType === 'FREE') {
      return <span className="text-lg font-bold text-green-600">Gratis</span>;
    }
    if (option.priceType === 'FLAT') {
      return (
        <div className="text-right">
          <div className="text-2xl font-bold text-violet-600">{formatPrice(price)}</div>
          <div className="text-xs text-neutral-500">jednorazowo</div>
        </div>
      );
    }
    // PER_PERSON
    return (
      <div className="text-right">
        <div className="text-2xl font-bold text-violet-600">{formatPrice(price)}</div>
        <div className="text-xs text-neutral-500">za osobę</div>
      </div>
    );
  };

  const handleIncrement = () => {
    if (option.maxQuantity && localQuantity >= option.maxQuantity) return;
    const newQuantity = localQuantity + 1;
    setLocalQuantity(newQuantity);
    onQuantityChange?.(option.id, newQuantity);
  };

  const handleDecrement = () => {
    if (localQuantity <= 0) return;
    const newQuantity = localQuantity - 1;
    setLocalQuantity(newQuantity);
    onQuantityChange?.(option.id, newQuantity);
  };

  const CategoryIcon = CATEGORY_ICONS[option.category] || Sparkles;
  const isSelected = localQuantity > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative overflow-hidden rounded-lg border bg-white p-4',
        'transition-all duration-200',
        isSelected
          ? 'border-violet-500 shadow-md'
          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
        'dark:bg-neutral-900 dark:border-neutral-800',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon & Details */}
        <div className="flex-1">
          {/* Category Badge */}
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <CategoryIcon className="h-3 w-3" />
            {option.category}
          </div>

          {/* Name */}
          <h4 className="mb-1 font-semibold text-neutral-900 dark:text-white">
            {option.name}
          </h4>

          {/* Short Description */}
          {option.shortDescription && (
            <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
              {option.shortDescription}
            </p>
          )}

          {/* Description */}
          {option.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              {option.description}
            </p>
          )}

          {/* Max Quantity Info */}
          {option.maxQuantity && (
            <div className="mt-2 text-xs text-neutral-500">
              Maks. {option.maxQuantity} szt.
            </div>
          )}
        </div>

        {/* Right: Price & Quantity */}
        <div className="flex flex-col items-end gap-3">
          {/* Price */}
          <div>{getPriceLabel()}</div>

          {/* Quantity Selector */}
          {option.allowMultiple ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDecrement}
                disabled={localQuantity <= 0}
                className={cn(
                  'rounded-full p-1.5 transition-colors',
                  localQuantity > 0
                    ? 'bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800'
                )}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold text-neutral-900 dark:text-white">
                {localQuantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={option.maxQuantity ? localQuantity >= option.maxQuantity : false}
                className={cn(
                  'rounded-full p-1.5 transition-colors',
                  (!option.maxQuantity || localQuantity < option.maxQuantity)
                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800'
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const newQuantity = localQuantity > 0 ? 0 : 1;
                setLocalQuantity(newQuantity);
                onQuantityChange?.(option.id, newQuantity);
              }}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                isSelected
                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                  : 'bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400'
              )}
            >
              {isSelected ? 'Wybrano' : 'Dodaj'}
            </button>
          )}
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500 origin-left"
        />
      )}
    </motion.div>
  );
}

/**
 * OptionCardSkeleton - Loading state
 */
export function OptionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 h-6 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="mb-1 h-5 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="h-8 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
