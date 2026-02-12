'use client'

import { cn } from '@/lib/utils'
import type { DepositStatus } from '@/lib/api/deposits'

const statusConfig: Record<DepositStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Oczekuje',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  PAID: {
    label: 'Opłacona',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  OVERDUE: {
    label: 'Przeterminowana',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
  PARTIALLY_PAID: {
    label: 'Częściowo',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  CANCELLED: {
    label: 'Anulowana',
    className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  },
}

interface DepositStatusBadgeProps {
  status: DepositStatus
  className?: string
}

export function DepositStatusBadge({ status, className }: DepositStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
