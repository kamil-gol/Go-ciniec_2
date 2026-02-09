/**
 * MenuCard Component
 * 
 * Displays a menu template with its packages
 */

'use client';

import { MenuTemplate } from '@/types/menu.types';
import { Calendar, Sparkles, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MenuCardProps {
  template: MenuTemplate;
  onSelect?: (template: MenuTemplate) => void;
  className?: string;
}

export function MenuCard({ template, onSelect, className }: MenuCardProps) {
  const validFrom = new Date(template.validFrom);
  const validTo = template.validTo ? new Date(template.validTo) : null;

  const packageCount = template.packages?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-neutral-200 bg-white',
        'shadow-sm hover:shadow-lg transition-all duration-300',
        'dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
    >
      {/* Header Image/Gradient */}
      <div 
        className="h-32 w-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500"
        style={{
          background: template.eventType?.color 
            ? `linear-gradient(135deg, ${template.eventType.color}dd, ${template.eventType.color})`
            : undefined
        }}
      >
        {template.imageUrl && (
          <img 
            src={template.imageUrl} 
            alt={template.name}
            className="h-full w-full object-cover opacity-80"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Event Type Badge */}
        {template.eventType && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <Sparkles className="h-3 w-3" />
            {template.eventType.name}
          </div>
        )}

        {/* Title */}
        <h3 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">
          {template.name}
        </h3>

        {/* Variant */}
        {template.variant && (
          <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            {template.variant}
          </p>
        )}

        {/* Description */}
        {template.description && (
          <p className="mb-4 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
            {template.description}
          </p>
        )}

        {/* Validity Period */}
        <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Calendar className="h-4 w-4" />
          <span>
            {format(validFrom, 'd MMM yyyy', { locale: pl })}
            {validTo && (
              <>
                {' - '}
                {format(validTo, 'd MMM yyyy', { locale: pl })}
              </>
            )}
          </span>
        </div>

        {/* Package Count */}
        <div className="mb-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {packageCount} {packageCount === 1 ? 'pakiet' : packageCount < 5 ? 'pakiety' : 'pakietów'}
        </div>

        {/* Action Button */}
        {onSelect && (
          <button
            onClick={() => onSelect(template)}
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-lg',
              'bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white',
              'hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
              'transition-colors duration-200',
              'dark:bg-violet-500 dark:hover:bg-violet-600'
            )}
          >
            Zobacz pakiety
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Active Badge */}
      {template.isActive && (
        <div className="absolute right-4 top-4 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          Aktywne
        </div>
      )}
    </motion.div>
  );
}

/**
 * MenuCardSkeleton - Loading state
 */
export function MenuCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="h-32 w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />
      <div className="p-6">
        <div className="mb-3 h-6 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mb-4 h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mb-4 h-4 w-1/2 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
