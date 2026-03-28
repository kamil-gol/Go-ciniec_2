import {
  CheckCircle2, AlertTriangle, Clock, FileCheck, FileX,
  ShieldCheck, ShieldAlert, Sparkles
} from 'lucide-react'
import type { Deposit } from '@/lib/api/deposits'

// Deposit Badge Helper
export function DepositBadge({ deposits }: { deposits: Deposit[] }) {
  const active = deposits.filter(d => d.status !== 'CANCELLED')
  if (active.length === 0) return null

  const allPaid = active.every(d => d.status === 'PAID')
  const hasOverdue = active.some(d => d.status === 'OVERDUE')
  const totalAmount = active.reduce((s, d) => s + Number(d.amount), 0)
  const paidAmount = active.reduce((s, d) => s + Number(d.paidAmount || 0), 0)

  if (allPaid) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        Zaliczka opłacona
      </span>
    )
  }

  if (hasOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 animate-pulse">
        <AlertTriangle className="h-3 w-3" />
        Zaległa: {totalAmount.toLocaleString('pl-PL')} zł
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
      <Clock className="h-3 w-3" />
      Zaliczka: {paidAmount > 0 ? `${paidAmount.toLocaleString('pl-PL')} / ` : ''}{totalAmount.toLocaleString('pl-PL')} zł
    </span>
  )
}

// Extras Badge Helper
export function ExtrasBadge({ extrasCount, extrasTotalPrice }: { extrasCount?: number; extrasTotalPrice?: number }) {
  if (!extrasCount || extrasCount === 0) return null

  const priceLabel = extrasTotalPrice && extrasTotalPrice > 0
    ? ` · ${extrasTotalPrice.toLocaleString('pl-PL')} zł`
    : ''

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800">
      <Sparkles className="h-3 w-3" />
      {extrasCount} {extrasCount === 1 ? 'extra' : 'extras'}{priceLabel}
    </span>
  )
}

// Contract Badge Helper
export function ContractBadge({ hasContract }: { hasContract: boolean | undefined }) {
  if (hasContract === undefined) return null

  if (hasContract) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
        <FileCheck className="h-3 w-3" />
        Umowa
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-50 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
      <FileX className="h-3 w-3" />
      Brak umowy
    </span>
  )
}

// RODO Badge Helper
export function RodoBadge({ hasRodo }: { hasRodo: boolean | undefined }) {
  if (hasRodo === undefined) return null

  if (hasRodo) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800">
        <ShieldCheck className="h-3 w-3" />
        RODO
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
      <ShieldAlert className="h-3 w-3" />
      Brak RODO
    </span>
  )
}
