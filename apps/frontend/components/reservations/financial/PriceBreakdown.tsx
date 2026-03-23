'use client'

import {
  Users, ShoppingCart, Gift, Building2, Timer,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { formatPLN } from './utils'
import type { CategoryExtra, ExtraHoursInfo } from './types'
import { STANDARD_HOURS } from './types'

interface PriceBreakdownProps {
  adults: number
  childrenCount: number
  toddlers: number
  effectivePricePerAdult: number
  effectivePricePerChild: number
  effectivePricePerToddler: number
  hasMenu: boolean
  priceBreakdown: any
  activeExtras: any[]
  extrasTotalPrice: number
  activeCategoryExtras: CategoryExtra[]
  effectiveCategoryExtrasTotal: number
  hasVenueSurcharge: boolean
  effectiveVenueSurcharge: number
  venueSurchargeLabel?: string | null
  extraHoursInfo: ExtraHoursInfo | null
  isExtraHoursExempt: boolean
  standardHours: number
  extraHourRate: number
}

export function PriceBreakdown({
  adults,
  childrenCount,
  toddlers,
  effectivePricePerAdult,
  effectivePricePerChild,
  effectivePricePerToddler,
  hasMenu,
  priceBreakdown,
  activeExtras,
  extrasTotalPrice,
  activeCategoryExtras,
  effectiveCategoryExtrasTotal,
  hasVenueSurcharge,
  effectiveVenueSurcharge,
  venueSurchargeLabel,
  extraHoursInfo,
  isExtraHoursExempt,
  standardHours,
  extraHourRate,
}: PriceBreakdownProps) {
  return (
    <div className="space-y-3 mb-4 animate-in slide-in-from-top-2 duration-200">
      {/* Package / Base pricing */}
      <div className="bg-white dark:bg-black/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-purple-600" />
          <p className="text-sm font-semibold text-muted-foreground">
            {hasMenu ? 'Pakiet gastronomiczny' : 'Cennik za osobę'}
          </p>
        </div>
        <div className="space-y-2">
          {adults > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dorośli ({adults} × {formatPLN(effectivePricePerAdult)} zł)</span>
              <span className="font-semibold">{formatPLN(adults * effectivePricePerAdult)} zł</span>
            </div>
          )}
          {childrenCount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dzieci ({childrenCount} × {formatPLN(effectivePricePerChild)} zł)</span>
              <span className="font-semibold">{formatPLN(childrenCount * effectivePricePerChild)} zł</span>
            </div>
          )}
          {toddlers > 0 && effectivePricePerToddler > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Maluchy ({toddlers} × {formatPLN(effectivePricePerToddler)} zł)</span>
              <span className="font-semibold">{formatPLN(toddlers * effectivePricePerToddler)} zł</span>
            </div>
          )}
          {toddlers > 0 && effectivePricePerToddler === 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Maluchy ({toddlers})</span>
              <span className="font-semibold text-emerald-600">bezpłatnie</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between text-sm font-semibold">
            <span>Suma podstawowa</span>
            <span>{formatPLN(hasMenu && priceBreakdown ? priceBreakdown.packageCost.subtotal : (adults * effectivePricePerAdult + childrenCount * effectivePricePerChild + toddlers * effectivePricePerToddler))} zł</span>
          </div>
        </div>
      </div>

      {/* Menu options */}
      {hasMenu && priceBreakdown?.optionsCost && priceBreakdown.optionsCost.length > 0 && (
        <div className="bg-white dark:bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-muted-foreground">Opcje dodatkowe</p>
          </div>
          <div className="space-y-2">
            {priceBreakdown.optionsCost.map((opt: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {opt.option} ({opt.priceType === 'PER_PERSON' ? `${opt.quantity} × ${formatPLN(opt.priceEach)} zł` : 'stała kwota'})
                </span>
                <span className="font-semibold">{formatPLN(opt.total)} zł</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Suma opcji</span>
              <span>{formatPLN(priceBreakdown.optionsSubtotal)} zł</span>
            </div>
          </div>
        </div>
      )}

      {/* Service Extras */}
      {activeExtras.length > 0 && (
        <div className="bg-white dark:bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold text-muted-foreground">Usługi dodatkowe</p>
          </div>
          <div className="space-y-2">
            {activeExtras.map((extra: any) => (
              <div key={extra.id} className="flex justify-between text-sm gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{extra.serviceItem?.icon || '📦'}</span>
                  <span className="truncate">
                    {extra.serviceItem?.name || 'Pozycja'}
                    {extra.quantity > 1 && ` (×${extra.quantity})`}
                  </span>
                </span>
                <span className="font-semibold shrink-0 text-right tabular-nums">{formatPLN(Number(extra.totalPrice))} zł</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Suma usług dodatkowych</span>
              <span>{formatPLN(extrasTotalPrice)} zł</span>
            </div>
          </div>
        </div>
      )}

      {/* #216: Category Extras */}
      {activeCategoryExtras.length > 0 && (
        <div className="bg-white dark:bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-muted-foreground">Dodatkowo płatne porcje</p>
          </div>
          <div className="space-y-2">
            {activeCategoryExtras.map((extra) => {
              const qty = Number(extra.quantity);
              const guestCount = extra.guestCount ?? 1;
              const qtyLabel = qty === Math.floor(qty) ? qty : qty.toFixed(1);
              return (
                <div key={extra.id} className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{extra.packageCategory?.category?.icon || '🍽️'}</span>
                    <span className="truncate">
                      {extra.packageCategory?.category?.name || 'Kategoria'}
                      {' '}({qtyLabel} × {formatPLN(Number(extra.pricePerItem))} zł × {guestCount} os.)
                    </span>
                  </span>
                  <span className="font-semibold shrink-0 text-right tabular-nums">{formatPLN(Number(extra.totalPrice))} zł</span>
                </div>
              );
            })}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Suma dodatkowych pozycji</span>
              <span>{formatPLN(effectiveCategoryExtrasTotal)} zł</span>
            </div>
          </div>
        </div>
      )}

      {/* Venue Surcharge */}
      {hasVenueSurcharge && (
        <div className="bg-white dark:bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-orange-600" />
            <p className="text-sm font-semibold text-muted-foreground">Dopłata za cały obiekt</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {venueSurchargeLabel || 'Dopłata za wynajem całego obiektu'}
              </span>
              <span className="font-semibold text-orange-700 dark:text-orange-400">{formatPLN(effectiveVenueSurcharge)} zł</span>
            </div>
          </div>
        </div>
      )}

      {/* Extra hours */}
      {extraHoursInfo && extraHoursInfo.extraHours > 0 && (
        <div className="bg-white dark:bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-muted-foreground">Dodatkowe godziny</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Czas trwania wydarzenia</span>
              <span className="font-medium">{extraHoursInfo.durationHours}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Czas w cenie ({standardHours !== STANDARD_HOURS ? 'typ wydarzenia' : 'standard'})
              </span>
              <span className="font-medium text-emerald-600">{standardHours}h</span>
            </div>
            <Separator className="my-2" />
            {isExtraHoursExempt ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Dodatkowe godziny ({extraHoursInfo.extraHours}h)
                </span>
                <span className="font-semibold text-emerald-600">w cenie</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Dodatkowe godziny ({extraHoursInfo.extraHours} × {formatPLN(extraHourRate)} zł/h)
                </span>
                <span className="font-semibold text-blue-700">{formatPLN(extraHoursInfo.extraCost)} zł</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
