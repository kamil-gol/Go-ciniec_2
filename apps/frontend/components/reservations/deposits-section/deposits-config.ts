import { formatDateLong } from '@/lib/utils'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowDownUp,
  Banknote,
  Smartphone,
  CreditCard,
} from 'lucide-react'
import type { DepositStatus, PaymentMethod } from '@/lib/api/deposits'

// ═════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════

export interface ReservationDepositsSectionProps {
  reservationId: string
  totalPrice: number
}

// ═════════════════════════════════════════════
// Config
// ═════════════════════════════════════════════

export const statusConfig: Record<DepositStatus, {
  label: string
  icon: React.ElementType
  className: string
  dotColor: string
}> = {
  PENDING: {
    label: 'Oczekująca',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-400',
  },
  PAID: {
    label: 'Opłacona',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-400',
  },
  OVERDUE: {
    label: 'Przetermin.',
    icon: AlertTriangle,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    dotColor: 'bg-red-400',
  },
  PARTIALLY_PAID: {
    label: 'Częściowa',
    icon: Clock,
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    dotColor: 'bg-blue-400',
  },
  CANCELLED: {
    label: 'Anulowana',
    icon: XCircle,
    className: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
    dotColor: 'bg-neutral-400',
  },
}

export const paymentMethodIcons: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  TRANSFER: { label: 'Przelew', icon: ArrowDownUp },
  CASH: { label: 'Gotówka', icon: Banknote },
  BLIK: { label: 'BLIK', icon: Smartphone },
  CARD: { label: 'Karta', icon: CreditCard },
}

export const paymentMethodOptions: { value: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'TRANSFER', label: 'Przelew', icon: ArrowDownUp, color: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'CASH', label: 'Gotówka', icon: Banknote, color: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { value: 'BLIK', label: 'BLIK', icon: Smartphone, color: 'border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'CARD', label: 'Karta', icon: CreditCard, color: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
]

// ═════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════

export function getDaysLabel(dateStr: string): { text: string; className: string } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return { text: 'dziś', className: 'text-amber-600 dark:text-amber-400' }
  if (diff === 1) return { text: 'jutro', className: 'text-amber-600 dark:text-amber-400' }
  if (diff > 1 && diff <= 7) return { text: `za ${diff} dni`, className: 'text-blue-600 dark:text-blue-400' }
  if (diff < 0) return { text: `${Math.abs(diff)} dni temu`, className: 'text-red-600 dark:text-red-400 font-medium' }
  return null
}

export function formatDate(dateStr: string): string {
  return formatDateLong(dateStr)
}

export function suggestDueDate(daysFromNow: number = 14): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}
