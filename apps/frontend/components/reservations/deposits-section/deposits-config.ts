import {
  ArrowDownUp,
  Banknote,
  Smartphone,
  CreditCard,
} from 'lucide-react'
import type { PaymentMethod } from '@/lib/api/deposits'

// ═════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════

export interface ReservationDepositsSectionProps {
  reservationId: string
  totalPrice: number
}

// ═════════════════════════════════════════════
// Config (status colors moved to lib/status-colors.ts)
// ═════════════════════════════════════════════

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
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function suggestDueDate(daysFromNow: number = 14): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}
