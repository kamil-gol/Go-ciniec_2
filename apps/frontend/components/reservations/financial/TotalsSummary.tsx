'use client'

import { DollarSign, CheckCircle2, TrendingUp } from 'lucide-react'
import { formatPLN } from './utils'
import type { ExtraHoursInfo, Financials } from './types'

interface TotalsSummaryProps {
  finalTotalPrice: number
  hasActiveDiscount: boolean
  activeDiscountAmount: number
  hasVenueSurcharge: boolean
  effectiveVenueSurcharge: number
  extrasTotalPrice: number
  activeExtrasCount: number
  effectiveCategoryExtrasTotal: number
  activeCategoryExtrasCount: number
  extraHoursInfo: ExtraHoursInfo | null
  financials: Financials
}

export function TotalsSummary({
  finalTotalPrice,
  hasActiveDiscount,
  activeDiscountAmount,
  hasVenueSurcharge,
  effectiveVenueSurcharge,
  extrasTotalPrice,
  activeExtrasCount,
  effectiveCategoryExtrasTotal,
  activeCategoryExtrasCount,
  extraHoursInfo,
  financials,
}: TotalsSummaryProps) {
  return (
    <>
      {/* TOTAL */}
      <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white mb-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 opacity-80" />
            <span className="font-bold">Razem do zapłaty</span>
          </div>
          <span className="text-2xl font-bold" data-testid="final-total-price">{formatPLN(finalTotalPrice)} zł</span>
        </div>
        {hasActiveDiscount && (
          <div className="flex items-center justify-between mt-1 text-white/80 text-xs">
            <span>w tym rabat</span>
            <span>-{formatPLN(activeDiscountAmount)} zł</span>
          </div>
        )}
        {hasVenueSurcharge && (
          <div className="flex items-center justify-between mt-1 text-white/80 text-xs">
            <span>w tym dopłata za cały obiekt</span>
            <span>+{formatPLN(effectiveVenueSurcharge)} zł</span>
          </div>
        )}
        {extrasTotalPrice > 0 && (
          <div className="flex items-center justify-between mt-1 text-white/80 text-xs">
            <span>w tym usługi dodatkowe ({activeExtrasCount})</span>
            <span>+{formatPLN(extrasTotalPrice)} zł</span>
          </div>
        )}
        {effectiveCategoryExtrasTotal > 0 && (
          <div className="flex items-center justify-between mt-1 text-white/80 text-xs">
            <span>w tym dodatkowo płatne porcje ({activeCategoryExtrasCount})</span>
            <span>+{formatPLN(effectiveCategoryExtrasTotal)} zł</span>
          </div>
        )}
        {extraHoursInfo && extraHoursInfo.extraCost > 0 && (
          <div className="flex items-center justify-between mt-1 text-white/80 text-xs">
            <span>w tym dopłata za {extraHoursInfo.extraHours} dodatkow{extraHoursInfo.extraHours === 1 ? 'ą godzinę' : extraHoursInfo.extraHours < 5 ? 'e godziny' : 'ych godzin'}</span>
            <span>+{formatPLN(extraHoursInfo.extraCost)} zł</span>
          </div>
        )}
      </div>

      {/* Balance bar */}
      <div className="p-4 bg-white dark:bg-black/20 rounded-xl mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold">Stan rozliczeń</span>
          </div>
          <span className="text-sm font-bold">
            {formatPLN(financials.totalPaid)} / {formatPLN(finalTotalPrice)} zł
          </span>
        </div>

        <div className="relative h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-amber-300 dark:bg-amber-700 rounded-full transition-all duration-700"
            style={{ width: `${financials.percentCommitted}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
            style={{ width: `${financials.percentPaid}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              Wpłacono ({financials.percentPaid}%)
            </span>
            {financials.totalPending > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 dark:bg-amber-700" />
                Oczekuje
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              Brakuje
            </span>
          </div>
        </div>

        {financials.remaining > 0 && (
          <div className="mt-3 flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Pozostało do zapłaty</span>
            <span className="text-lg font-bold text-amber-800 dark:text-amber-300">{formatPLN(financials.remaining)} zł</span>
          </div>
        )}
        {financials.remaining === 0 && financials.totalPaid > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Całkowicie opłacone!</span>
          </div>
        )}
      </div>
    </>
  )
}
