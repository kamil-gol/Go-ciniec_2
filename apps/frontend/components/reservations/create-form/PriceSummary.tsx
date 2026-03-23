'use client'

import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import { Clock, UtensilsCrossed, Package, Building2, ChevronRight } from 'lucide-react'
import type { PriceSummaryProps } from './types'

export function PriceSummary({
  compact = false,
  adults,
  children,
  toddlers,
  pricePerAdult,
  pricePerChild,
  pricePerToddler,
  calculatedPrice,
  extraHours,
  extraHoursCost,
  extraHourRate,
  extrasTotal,
  selectedExtras,
  totalWithExtras,
  useMenuPackage,
  selectedTemplate,
  selectedPackage,
  venueSurchargeAmount,
  venueSurcharge,
}: PriceSummaryProps) {
  if (calculatedPrice <= 0 && extraHoursCost <= 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 border rounded-xl ${
        compact
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          : 'bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800'
      }`}
    >
      <div className="space-y-2">
        {adults > 0 && (
          <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
            <span>Dorośli: {adults} × {pricePerAdult} PLN</span>
            <span className="font-medium">{adults * pricePerAdult} PLN</span>
          </div>
        )}
        {children > 0 && (
          <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
            <span>Dzieci (4–12): {children} × {pricePerChild} PLN</span>
            <span className="font-medium">{children * pricePerChild} PLN</span>
          </div>
        )}
        {toddlers > 0 && (
          <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
            <span>Dzieci (0–3): {toddlers} × {pricePerToddler} PLN</span>
            <span className="font-medium">{toddlers * pricePerToddler} PLN</span>
          </div>
        )}
        {calculatedPrice > 0 && extraHoursCost > 0 && (
          <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300 pt-1 border-t border-neutral-200 dark:border-neutral-700">
            <span className="font-medium">Podsuma menu / goście:</span>
            <span className="font-medium">{formatCurrency(calculatedPrice)}</span>
          </div>
        )}
        {extraHoursCost > 0 && (
          <div className="flex justify-between text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 -mx-4 px-4 py-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Dodatkowe godziny: {extraHours}h × {extraHourRate} PLN
            </span>
            <span className="font-medium">{formatCurrency(extraHoursCost)}</span>
          </div>
        )}
        {extrasTotal > 0 && (
          <div className="flex justify-between text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 -mx-4 px-4 py-2">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              Usługi dodatkowe ({selectedExtras.length})
            </span>
            <span className="font-medium">+{formatCurrency(extrasTotal)}</span>
          </div>
        )}
        {/* #216: Category extras display removed — handled via DishSelector in edit flow */}
        {venueSurchargeAmount > 0 && (
          <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 -mx-4 px-4 py-2">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {venueSurcharge.label}
            </span>
            <span className="font-medium">+{formatCurrency(venueSurchargeAmount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-primary-300 dark:border-primary-700">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">Cena całkowita:</span>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(totalWithExtras)}</span>
        </div>
        {useMenuPackage && selectedTemplate && selectedPackage && (
          <p className="text-xs text-primary-700 dark:text-primary-300 flex items-center gap-1 pt-1">
            <UtensilsCrossed className="w-3 h-3" />
            {selectedTemplate.name}
            <ChevronRight className="w-3 h-3" />
            {selectedPackage.name}
          </p>
        )}
      </div>
    </motion.div>
  )
}
