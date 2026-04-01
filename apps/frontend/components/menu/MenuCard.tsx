/**
 * MenuCard Component
 *
 * Displays a menu template card with design-token styling
 * Supports isSelected prop for edit mode highlighting
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { MenuTemplate } from '@/types/menu.types';
import { UtensilsCrossed, Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { moduleAccents } from '@/lib/design-tokens';
import { useCallback } from 'react';

const accent = moduleAccents.menu;

interface MenuCardProps {
  template: MenuTemplate;
  isSelected?: boolean;
  onSelect?: (template: MenuTemplate) => void;
  className?: string;
}

export function MenuCard({ template, isSelected, onSelect, className }: MenuCardProps) {
  const isActive = template.isActive;
  const packageCount = template.packages?.length ?? (template as any)._count?.packages;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(template);
    }
  }, [onSelect, template]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={template.name}
        className={cn(
          'group rounded-2xl bg-white dark:bg-neutral-800/80 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isSelected
            ? 'border-green-500 ring-2 ring-green-500/50 shadow-green-100 dark:shadow-green-900/20'
            : 'border-neutral-200/80 dark:border-neutral-700/50',
          className
        )}
        onClick={() => onSelect?.(template)}
        onKeyDown={handleKeyDown}
      >
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className={cn(
              'p-3 rounded-xl bg-gradient-to-br shadow-md',
              accent.iconBg
            )}>
              <UtensilsCrossed className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              {isSelected && (
                <Badge className="bg-success-500 text-white border-0 shadow-sm">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Wybrane
                </Badge>
              )}
              <Badge
                className={cn(
                  'border-0 shadow-none',
                  isActive
                    ? 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                )}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Aktywny
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Nieaktywny
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h3 className={cn(
              'text-xl font-bold transition-colors',
              isSelected
                ? 'text-success-700 dark:text-success-400'
                : 'text-neutral-900 dark:text-neutral-100',
              !isSelected && `group-hover:${accent.text} dark:group-hover:${accent.textDark}`
            )}>
              {template.name}
            </h3>
            {template.variant && (
              <Badge
                variant="outline"
                className={cn(
                  'rounded-lg',
                  accent.badge, accent.badgeText,
                  'border-rose-200/50 dark:border-rose-800/50'
                )}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {template.variant}
              </Badge>
            )}
          </div>

          {/* Event Type */}
          {template.eventType && (
            <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/50 dark:border-neutral-700/30">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: template.eventType.color || '#888' }}
              />
              <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300">
                {template.eventType.name}
              </span>
            </div>
          )}

          {/* Validity Period */}
          {template.validFrom && template.validTo && (
            <div className={cn(
              'flex items-center gap-2 text-sm p-3 rounded-xl border',
              accent.badge,
              'border-rose-200/50 dark:border-rose-800/50'
            )}>
              <Calendar className={cn('h-4 w-4', accent.text, accent.textDark)} />
              <span className="text-neutral-600 dark:text-neutral-300">
                {format(new Date(template.validFrom), 'dd.MM.yyyy', { locale: pl })} -{' '}
                {format(new Date(template.validTo), 'dd.MM.yyyy', { locale: pl })}
              </span>
            </div>
          )}

          {/* Package Count */}
          {packageCount !== undefined && (
            <div className="pt-1">
              <Badge className={cn(
                'border-0 shadow-none',
                accent.badge, accent.badgeText
              )}>
                {packageCount} {packageCount === 1 ? 'pakiet' : 'pakietów'}
              </Badge>
            </div>
          )}

          {/* Hover Indicator */}
          {!isSelected && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
              <div className={cn(
                'text-sm font-semibold flex items-center gap-2',
                accent.text, accent.textDark
              )}>
                {'Kliknij aby wybrać →'}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MenuCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 shadow-md">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
          <div className="w-20 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-3/4 h-7 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div className="w-1/2 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>
        <div className="w-full h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
