'use client'

import { useState } from 'react'
import {
  Receipt,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Plus,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react'
import { SectionCard } from './SectionCard'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ═══ TYPES ═══

export interface FinancialLineItem {
  id: string
  icon?: React.ReactNode
  label: string
  /** Optional detail in parentheses, e.g. "(3 × 150,00 zł)" */
  detail?: string
  amount: number
  /** Color class for the amount, e.g. "text-orange-700" */
  amountColor?: string
}

export interface FinancialLineGroup {
  id: string
  icon?: React.ReactNode
  title: string
  items: FinancialLineItem[]
  subtotal?: number
  /** When true, show individual items; when false, show only group summary line */
  expandable?: boolean
}

export interface FinancialDiscount {
  type: 'PERCENTAGE' | 'FIXED' | string
  value?: number | string | null
  amount: number
  reason?: string | null
}

export interface FinancialDeposit {
  id: string
  amount: number
  title?: string | null
  status: string
  paid: boolean
  dueDate?: string | null
  paymentMethod?: string | null
  paidAmount?: number
}

export interface FinancialBalance {
  totalPaid: number
  totalCommitted: number
  totalPending: number
  remaining: number
  percentPaid: number
  percentCommitted: number
  depositsCount: number
}

export interface UnifiedFinancialSummaryProps {
  /** Title for the card header (default: "Podsumowanie finansowe") */
  title?: string
  /** Line item groups (collapsible breakdown sections) */
  lineGroups?: FinancialLineGroup[]
  /** Simple flat line items (shown directly, no grouping) */
  lineItems?: FinancialLineItem[]
  /** Discount info — rendered as a slot (the parent provides the DiscountSection or inline display) */
  discountSlot?: React.ReactNode
  /** Discount data for total display */
  discount?: FinancialDiscount | null
  /** Final total price (after discount) */
  totalPrice: number
  /** Optional per-person price */
  pricePerPerson?: number | null
  /** Per-person label (default: "/ osobę") */
  pricePerPersonLabel?: string
  /** Balance/payment tracking data */
  balance?: FinancialBalance | null
  /** Deposit section — rendered as a slot (parent provides full deposit UI) */
  depositsSlot?: React.ReactNode
  /** Whether line groups are initially collapsed */
  lineGroupsCollapsed?: boolean
  /** Optional action button in header (e.g. "Dodaj rabat") */
  headerAction?: React.ReactNode
  /** Optional className */
  className?: string
}

// ═══ COMPONENT ═══

export function UnifiedFinancialSummary({
  title = 'Podsumowanie finansowe',
  lineGroups,
  lineItems,
  discountSlot,
  discount,
  totalPrice,
  pricePerPerson,
  pricePerPersonLabel = '/ osobę',
  balance,
  depositsSlot,
  lineGroupsCollapsed = true,
  headerAction,
  className,
}: UnifiedFinancialSummaryProps) {
  const [showBreakdown, setShowBreakdown] = useState(!lineGroupsCollapsed)

  const hasLineGroups = lineGroups && lineGroups.length > 0
  const hasLineItems = lineItems && lineItems.length > 0
  const hasBreakdown = hasLineGroups || hasLineItems

  // Calculate pre-discount subtotal from groups for the toggle button
  const groupsSubtotal = lineGroups
    ? lineGroups.reduce((sum, g) => sum + (g.subtotal ?? g.items.reduce((s, i) => s + i.amount, 0)), 0)
    : 0
  const itemsSubtotal = lineItems
    ? lineItems.reduce((sum, i) => sum + i.amount, 0)
    : 0
  const breakdownTotal = groupsSubtotal + itemsSubtotal

  return (
    <SectionCard
      icon={Receipt}
      iconBg="bg-emerald-100 dark:bg-emerald-900/30"
      iconColor="text-emerald-600 dark:text-emerald-400"
      title={title}
      badge={headerAction}
      className={className}
    >
      <div className="space-y-4">
        {/* ═══ BREAKDOWN TOGGLE ═══ */}
        {hasBreakdown && (
          <div>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  Koszty usług
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(breakdownTotal)}
                </span>
                {showBreakdown
                  ? <ChevronUp className="h-4 w-4 text-neutral-400" />
                  : <ChevronDown className="h-4 w-4 text-neutral-400" />}
              </div>
            </button>

            {showBreakdown && (
              <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                {/* Line groups (expandable sections like Package pricing, Extras, etc.) */}
                {hasLineGroups && lineGroups!.map((group) => (
                  <LineGroupSection key={group.id} group={group} />
                ))}

                {/* Flat line items */}
                {hasLineItems && (
                  <div className="space-y-2">
                    {lineItems!.map((item) => (
                      <LineItemRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ SIMPLE LINE ITEMS (no breakdown toggle, for catering-style) ═══ */}
        {!hasBreakdown && hasLineItems && (
          <div className="space-y-2.5">
            {lineItems!.map((item) => (
              <LineItemRow key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* ═══ DISCOUNT SLOT ═══ */}
        {discountSlot}

        {/* ═══ TOTAL ═══ */}
        <div className="pt-4 border-t-2 border-dashed border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Łącznie
            </span>
            <span className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100" data-testid="final-total-price">
              {formatCurrency(totalPrice)}
            </span>
          </div>
          {pricePerPerson != null && pricePerPerson > 0 && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 text-right">
              {formatCurrency(pricePerPerson)} {pricePerPersonLabel}
            </p>
          )}
          {discount && discount.amount > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 text-right">
              w tym rabat −{formatCurrency(discount.amount)}
            </p>
          )}
        </div>

        {/* ═══ BALANCE BAR ═══ */}
        {balance && balance.depositsCount > 0 && (
          <BalanceSection balance={balance} totalPrice={totalPrice} />
        )}

        {/* ═══ DEPOSITS SLOT ═══ */}
        {depositsSlot}
      </div>
    </SectionCard>
  )
}

// ═══ SUB-COMPONENTS ═══

function LineGroupSection({ group }: { group: FinancialLineGroup }) {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {group.icon}
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-300">
          {group.title}
        </p>
      </div>
      <div className="space-y-2">
        {group.items.map((item) => (
          <LineItemRow key={item.id} item={item} />
        ))}
        {group.subtotal != null && (
          <>
            <div className="border-t border-neutral-200 dark:border-neutral-700 my-2" />
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-neutral-700 dark:text-neutral-200">Suma</span>
              <span className="text-neutral-900 dark:text-neutral-100">{formatCurrency(group.subtotal)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LineItemRow({ item }: { item: FinancialLineItem }) {
  return (
    <div className="flex items-center justify-between text-sm gap-2">
      <span className="flex items-center gap-2 text-neutral-500 dark:text-neutral-300 min-w-0">
        {item.icon}
        <span className="truncate">
          {item.label}
          {item.detail && (
            <span className="text-neutral-400 dark:text-neutral-500 ml-1">{item.detail}</span>
          )}
        </span>
      </span>
      <span className={`font-medium shrink-0 tabular-nums ${item.amountColor ?? ''}`}>
        {formatCurrency(item.amount)}
      </span>
    </div>
  )
}

function BalanceSection({ balance, totalPrice }: { balance: FinancialBalance; totalPrice: number }) {
  return (
    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Stan rozliczeń</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(balance.totalPaid)}
          </span>
          <span className="text-sm text-neutral-400 dark:text-neutral-500">/ {formatCurrency(totalPrice)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden shadow-inner">
        <div
          className="absolute inset-y-0 left-0 bg-amber-300 dark:bg-amber-700 rounded-full transition-all duration-700"
          style={{ width: `${balance.percentCommitted}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
          style={{ width: `${balance.percentPaid}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <span className="text-emerald-700 dark:text-emerald-400">Wpłacono ({balance.percentPaid}%)</span>
          </span>
          {balance.totalPending > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-600" />
              <span className="text-amber-700 dark:text-amber-400">Oczekuje ({formatCurrency(balance.totalPending)})</span>
            </span>
          )}
          {balance.remaining > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <span className="text-red-600 dark:text-red-400">Brakuje ({formatCurrency(balance.remaining)})</span>
            </span>
          )}
        </div>
      </div>

      {/* Status message */}
      {balance.remaining > 0 && (
        <div className="mt-3 flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-lg border border-red-200 dark:border-red-800">
          <span className="text-sm font-semibold text-red-700 dark:text-red-300">Pozostało do zapłaty</span>
          <span className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(balance.remaining)}</span>
        </div>
      )}
      {balance.remaining === 0 && balance.totalPaid > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Całkowicie opłacone!</span>
        </div>
      )}
    </div>
  )
}
