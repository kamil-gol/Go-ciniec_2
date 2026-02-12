'use client'

import { CheckCircle2, Clock, AlertTriangle, XCircle, CircleDot } from 'lucide-react'
import type { DepositStatus } from '@/lib/api/deposits'

const statusConfig: Record<DepositStatus, {
  label: string
  icon: React.ElementType
  className: string
}> = {
  PENDING: {
    label: 'Oczekująca',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  },
  PAID: {
    label: 'Opłacona',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  },
  OVERDUE: {
    label: 'Przeterminowana',
    icon: AlertTriangle,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  },
  PARTIALLY_PAID: {
    label: 'Częściowo',
    icon: CircleDot,
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  },
  CANCELLED: {
    label: 'Anulowana',
    icon: XCircle,
    className: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
  },
}

export function DepositStatusBadge({ status }: { status: DepositStatus }) {
  const config = statusConfig[status] || statusConfig.PENDING
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
