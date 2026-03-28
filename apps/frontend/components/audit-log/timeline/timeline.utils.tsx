// apps/frontend/components/audit-log/timeline/timeline.utils.tsx
import { formatCurrency } from '@/lib/utils'
// Extracted from EntityActivityTimeline.tsx — utility functions

import {
  Plus, Edit, Trash2, RefreshCw, Archive, ArchiveRestore,
  LogIn, LogOut, ListPlus, ListMinus, ArrowLeftRight, ArrowUpDown,
  CreditCard, Paperclip, FileX, AlertCircle, Calculator
} from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { fieldLabels } from './timeline.constants'

/**
 * Próbuje wydobyć czytelny tekst z obiektu.
 * Np. hall → hall.name, client → "firstName lastName", eventType → name
 */
export function formatObjectValue(value: any): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '(pusta lista)'
    if (value[0]?.name) return value.map((v: any) => v.name).join(', ')
    return `(${value.length} elementów)`
  }

  // Próbuj wyciągnąć czytelne pole
  if (value.name) return value.name
  if (value.firstName && value.lastName) return `${value.firstName} ${value.lastName}`
  if (value.firstName) return value.firstName
  if (value.email) return value.email
  if (value.title) return value.title
  if (value.label) return value.label
  if (value.status) return value.status

  // Ostateczność — nie pokazuj [object Object]
  const keys = Object.keys(value)
  if (keys.length === 0) return '(pusty)'
  if (keys.length <= 3) {
    const parts = keys
      .filter(k => typeof value[k] !== 'object' || value[k] === null)
      .map(k => {
        const label = fieldLabels[k] || k
        return `${label}: ${value[k]}`
      })
    if (parts.length > 0) return parts.join(', ')
  }

  return null
}

/** Formatuje status na polską nazwę */
export function formatStatusValue(value: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'Oczekująca',
    CONFIRMED: 'Potwierdzona',
    CANCELLED: 'Anulowana',
    COMPLETED: 'Zakończona',
    DRAFT: 'Szkic',
    ACTIVE: 'Aktywna',
    INACTIVE: 'Nieaktywna',
    ARCHIVED: 'Zarchiwizowana',
  }
  return statusMap[value] || value
}

/** Formatuje dowolną wartość pola do czytelnego stringa */
export function formatFieldValue(field: string, value: any): string | null {
  if (value === null || value === undefined) return null
  if (value === '') return '(puste)'

  // Statusy
  if (field === 'status') return formatStatusValue(String(value))

  // Daty
  if (
    field.includes('Date') || field.includes('date') ||
    field === 'createdAt' || field === 'updatedAt' ||
    field === 'archivedAt' || field === 'paidAt' ||
    field === 'confirmationDeadline'
  ) {
    try {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        return format(d, 'dd.MM.yyyy HH:mm', { locale: pl })
      }
    } catch { /* ignore */ }
  }

  // Ceny
  if (
    (field.toLowerCase().includes('price') ||
     field.toLowerCase().includes('amount') ||
     field === 'totalPrice' || field === 'priceBeforeDiscount') &&
    !isNaN(Number(value))
  ) {
    return formatCurrency(value)
  }

  // Obiekty
  if (typeof value === 'object') return formatObjectValue(value)

  // Boolean
  if (typeof value === 'boolean') return value ? 'Tak' : 'Nie'

  return String(value)
}

export function getActionIcon(action: string) {
  switch (action) {
    case 'CREATE': return <Plus className="w-4 h-4" />
    case 'UPDATE': return <Edit className="w-4 h-4" />
    case 'DELETE': return <Trash2 className="w-4 h-4" />
    case 'STATUS_CHANGE': return <RefreshCw className="w-4 h-4" />
    case 'ARCHIVE': return <Archive className="w-4 h-4" />
    case 'UNARCHIVE': case 'RESTORE': return <ArchiveRestore className="w-4 h-4" />
    case 'LOGIN': return <LogIn className="w-4 h-4" />
    case 'LOGOUT': return <LogOut className="w-4 h-4" />
    case 'QUEUE_ADD': return <ListPlus className="w-4 h-4" />
    case 'QUEUE_REMOVE': return <ListMinus className="w-4 h-4" />
    case 'QUEUE_SWAP': return <ArrowLeftRight className="w-4 h-4" />
    case 'QUEUE_MOVE': return <ArrowUpDown className="w-4 h-4" />
    case 'MARK_PAID': return <CreditCard className="w-4 h-4" />
    case 'ATTACHMENT_ADD': return <Paperclip className="w-4 h-4" />
    case 'ATTACHMENT_DELETE': return <FileX className="w-4 h-4" />
    case 'MENU_RECALCULATED': case 'MENU_CHANGE': return <Calculator className="w-4 h-4" />
    case 'DEPOSIT_ADD': case 'DEPOSIT_UPDATE': case 'DEPOSIT_DELETE': return <CreditCard className="w-4 h-4" />
    case 'PRICE_CHANGE': case 'DISCOUNT_CHANGE': return <Calculator className="w-4 h-4" />
    default: return <AlertCircle className="w-4 h-4" />
  }
}

export function getIconBgColor(action: string): string {
  switch (action) {
    case 'CREATE': return 'bg-blue-500'
    case 'UPDATE': return 'bg-amber-500'
    case 'DELETE': return 'bg-red-500'
    case 'STATUS_CHANGE': return 'bg-violet-500'
    case 'ARCHIVE': return 'bg-orange-500'
    case 'UNARCHIVE': case 'RESTORE': return 'bg-emerald-500'
    case 'MARK_PAID': return 'bg-green-500'
    case 'ATTACHMENT_ADD': return 'bg-cyan-500'
    case 'ATTACHMENT_DELETE': return 'bg-pink-500'
    case 'QUEUE_ADD': return 'bg-teal-500'
    case 'QUEUE_REMOVE': return 'bg-rose-500'
    case 'QUEUE_SWAP': return 'bg-purple-500'
    case 'QUEUE_MOVE': return 'bg-indigo-500'
    case 'MENU_RECALCULATED': case 'MENU_CHANGE': return 'bg-lime-600'
    case 'DEPOSIT_ADD': return 'bg-green-500'
    case 'DEPOSIT_UPDATE': return 'bg-amber-500'
    case 'DEPOSIT_DELETE': return 'bg-red-500'
    case 'PRICE_CHANGE': case 'DISCOUNT_CHANGE': return 'bg-amber-600'
    default: return 'bg-neutral-500'
  }
}
