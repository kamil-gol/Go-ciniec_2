/**
 * MenuCard Component
 * 
 * Displays a menu template card with premium UI styling
 */

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MenuTemplate } from '@/types/menu.types';
import { UtensilsCrossed, Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MenuCardProps {
  template: MenuTemplate;
  onSelect?: (template: MenuTemplate) => void;
  className?: string;
}

export function MenuCard({ template, onSelect, className }: MenuCardProps) {
  const isActive = template.isActive;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group',
          className
        )}
        onClick={() => onSelect?.(template)}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 group-hover:from-orange-500/20 group-hover:via-amber-500/20 group-hover:to-yellow-500/20 transition-all" />
        
        {/* Glow Effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-400/20 rounded-full blur-3xl group-hover:bg-orange-400/30 transition-all" />
        
        <div className="relative z-10 p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="h-7 w-7 text-white" />
            </div>
            <Badge
              className={cn(
                'border-0 shadow-md',
                isActive
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-400 text-white'
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

          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold group-hover:text-orange-600 transition-colors">
              {template.name}
            </h3>
            {template.variant && (
              <Badge
                variant="outline"
                className="border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-950/30"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {template.variant}
              </Badge>
            )}
          </div>

          {/* Event Type */}
          {template.eventType && (
            <div className="flex items-center gap-2 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl">
              <div
                className="w-4 h-4 rounded-full shadow-md"
                style={{ backgroundColor: template.eventType.color || '#888' }}
              />
              <span className="font-medium text-sm">{template.eventType.name}</span>
            </div>
          )}

          {/* Validity Period */}
          {template.validFrom && template.validTo && (
            <div className="flex items-center gap-2 text-sm p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">
                {format(new Date(template.validFrom), 'dd.MM.yyyy', { locale: pl })} -{' '}
                {format(new Date(template.validTo), 'dd.MM.yyyy', { locale: pl })}
              </span>
            </div>
          )}

          {/* Package Count */}
          {template._count?.packages !== undefined && (
            <div className="pt-2">
              <Badge className="bg-blue-100 text-blue-700 border-0 dark:bg-blue-950/50 dark:text-blue-400">
                {template._count.packages} {template._count.packages === 1 ? 'pakiet' : 'pakietów'}
              </Badge>
            </div>
          )}

          {/* Hover Effect Indicator */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-2">
            <div className="text-sm font-semibold text-orange-600 flex items-center gap-2">
              Kliknij aby wybrać →
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Skeleton Loader
export function MenuCardSkeleton() {
  return (
    <Card className="border-0 shadow-xl">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl animate-pulse" />
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-3/4 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-1/2 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    </Card>
  );
}
