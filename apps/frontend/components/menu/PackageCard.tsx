/**
 * PackageCard Component
 * 
 * Displays a menu package card with pricing and premium UI
 */

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MenuPackage } from '@/types/menu.types';
import { Check, Users, DollarSign, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-2 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group',
          isSelected 
            ? 'border-blue-500 ring-4 ring-blue-500/20' 
            : 'border-transparent hover:border-blue-300',
          className
        )}
        onClick={() => onSelect?.(pkg)}
      >
        {/* Gradient Overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 transition-all",
          isSelected && "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
          "group-hover:from-blue-500/20 group-hover:via-cyan-500/20 group-hover:to-teal-500/20"
        )} />
        
        {/* Selected Badge */}
        {isSelected && (
          <div className="absolute top-4 right-4 z-20">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-lg">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
        )}

        {/* Glow Effect */}
        <div className={cn(
          "absolute -top-20 -right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl transition-all",
          isSelected && "bg-blue-400/40"
        )} />
        
        <div className="relative z-10 p-6 space-y-5">
          {/* Header */}
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg w-fit group-hover:scale-110 transition-transform">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <h3 className={cn(
              "text-2xl font-bold transition-colors",
              isSelected ? "text-blue-600" : "group-hover:text-blue-600"
            )}>
              {pkg.name}
            </h3>
          </div>

          {/* Prices Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl shadow-sm">
              <Users className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              <p className="text-xs text-muted-foreground mb-1">Dorośli</p>
              <p className="text-xl font-bold">{pkg.pricePerAdult} zł</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl shadow-sm">
              <Users className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-muted-foreground mb-1">Dzieci</p>
              <p className="text-xl font-bold">{pkg.pricePerChild} zł</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl shadow-sm">
              <Users className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <p className="text-xs text-muted-foreground mb-1">Maluchy</p>
              <p className="text-xl font-bold">{pkg.pricePerToddler} zł</p>
            </div>
          </div>

          {/* Included Items */}
          {pkg.includedItems && pkg.includedItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                W pakiecie:
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {pkg.includedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm p-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg"
                  >
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hover Effect Indicator */}
          <div className={cn(
            "transition-opacity pt-2",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <div className={cn(
              "text-sm font-semibold flex items-center justify-center gap-2 p-2 rounded-lg",
              isSelected 
                ? "bg-blue-500 text-white" 
                : "text-blue-600"
            )}>
              {isSelected ? '✓ Wybrany' : 'Kliknij aby wybrać'}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Skeleton Loader
export function PackageCardSkeleton() {
  return (
    <Card className="border-0 shadow-xl">
      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl animate-pulse" />
          <div className="w-3/4 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
