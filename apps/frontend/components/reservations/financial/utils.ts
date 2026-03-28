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

import { formatCurrency as _fc, formatDateLong as _fdl } from '@/lib/utils'

export function formatDate(dateStr: string): string {
  return _fdl(dateStr)
}

export function formatPLN(amount: number): string {
  return _fc(amount)
}

export function suggestDueDate(daysFromNow: number = 14): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}
