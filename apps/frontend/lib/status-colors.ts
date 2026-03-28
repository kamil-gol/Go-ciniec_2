/**
 * Shared Status Colors — Unified color system for all entity statuses
 *
 * Use these maps instead of defining status colors inline in components.
 * Each status has light mode + dark mode variants.
 */

import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CircleDot,
  Archive,
  FileEdit,
  MessageSquare,
  Send,
  PackageCheck,
  Truck,
  Timer,
  type LucideIcon,
} from 'lucide-react'

export type StatusColorConfig = {
  label: string
  icon: LucideIcon
  bg: string
  text: string
  border: string
  dot: string
  /** Solid variant — for hero badges on dark backgrounds */
  solid: string
}

// ============================================
// RESERVATION STATUSES
// ============================================
export const reservationStatusColors: Record<string, StatusColorConfig> = {
  PENDING: {
    label: 'Oczekująca',
    icon: Clock,
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    solid: 'bg-amber-500 text-white',
  },
  CONFIRMED: {
    label: 'Potwierdzona',
    icon: CheckCircle2,
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    solid: 'bg-green-500 text-white',
  },
  CANCELLED: {
    label: 'Anulowana',
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    solid: 'bg-red-500 text-white',
  },
  COMPLETED: {
    label: 'Zakończona',
    icon: CheckCircle2,
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    solid: 'bg-blue-500 text-white',
  },
  RESERVED: {
    label: 'Zarezerwowana',
    icon: Clock,
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    solid: 'bg-indigo-500 text-white',
  },
  ARCHIVED: {
    label: 'Zarchiwizowana',
    icon: Archive,
    bg: 'bg-neutral-50 dark:bg-neutral-800',
    text: 'text-neutral-500 dark:text-neutral-400',
    border: 'border-neutral-200 dark:border-neutral-700',
    dot: 'bg-neutral-400',
    solid: 'bg-neutral-500 text-white',
  },
}

// ============================================
// DEPOSIT STATUSES
// ============================================
export const depositStatusColors: Record<string, StatusColorConfig> = {
  PENDING: {
    label: 'Oczekująca',
    icon: Clock,
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    solid: 'bg-amber-500 text-white',
  },
  PAID: {
    label: 'Opłacona',
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    solid: 'bg-emerald-500 text-white',
  },
  OVERDUE: {
    label: 'Przeterminowana',
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    solid: 'bg-red-500 text-white',
  },
  PARTIALLY_PAID: {
    label: 'Częściowa',
    icon: CircleDot,
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    solid: 'bg-blue-500 text-white',
  },
  CANCELLED: {
    label: 'Anulowana',
    icon: XCircle,
    bg: 'bg-neutral-50 dark:bg-neutral-800',
    text: 'text-neutral-500 dark:text-neutral-400',
    border: 'border-neutral-200 dark:border-neutral-700',
    dot: 'bg-neutral-400',
    solid: 'bg-neutral-500 text-white',
  },
}

// ============================================
// QUEUE STATUSES
// ============================================
export const queueStatusColors: Record<string, StatusColorConfig> = {
  WAITING: {
    label: 'Oczekuje',
    icon: Clock,
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    solid: 'bg-amber-500 text-white',
  },
  PROMOTED: {
    label: 'Promowana',
    icon: CheckCircle2,
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    solid: 'bg-green-500 text-white',
  },
  EXPIRED: {
    label: 'Wygasła',
    icon: Timer,
    bg: 'bg-neutral-50 dark:bg-neutral-800',
    text: 'text-neutral-500 dark:text-neutral-400',
    border: 'border-neutral-200 dark:border-neutral-700',
    dot: 'bg-neutral-400',
    solid: 'bg-neutral-500 text-white',
  },
  CANCELLED: {
    label: 'Anulowana',
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    solid: 'bg-red-500 text-white',
  },
}

// ============================================
// CATERING ORDER STATUSES
// ============================================
export const cateringStatusColors: Record<string, StatusColorConfig> = {
  DRAFT: {
    label: 'Szkic',
    icon: FileEdit,
    bg: 'bg-neutral-50 dark:bg-neutral-800',
    text: 'text-neutral-600 dark:text-neutral-400',
    border: 'border-neutral-200 dark:border-neutral-700',
    dot: 'bg-neutral-400',
    solid: 'bg-neutral-500 text-white',
  },
  INQUIRY: {
    label: 'Zapytanie',
    icon: MessageSquare,
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    solid: 'bg-blue-500 text-white',
  },
  QUOTED: {
    label: 'Oferta wysłana',
    icon: Send,
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
    solid: 'bg-purple-500 text-white',
  },
  CONFIRMED: {
    label: 'Potwierdzone',
    icon: CheckCircle2,
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    solid: 'bg-green-500 text-white',
  },
  IN_PREPARATION: {
    label: 'W przygotowaniu',
    icon: Clock,
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
    solid: 'bg-orange-500 text-white',
  },
  READY: {
    label: 'Gotowe',
    icon: PackageCheck,
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    solid: 'bg-emerald-500 text-white',
  },
  DELIVERED: {
    label: 'Dostarczone',
    icon: Truck,
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500',
    solid: 'bg-teal-500 text-white',
  },
  COMPLETED: {
    label: 'Zakończone',
    icon: CheckCircle2,
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500',
    solid: 'bg-slate-500 text-white',
  },
  CANCELLED: {
    label: 'Anulowane',
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    solid: 'bg-red-500 text-white',
  },
}

// ============================================
// SERVICE EXTRAS STATUSES
// ============================================
export const extrasStatusColors: Record<string, StatusColorConfig> = {
  PENDING: {
    label: 'Oczekuje',
    icon: Clock,
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    solid: 'bg-amber-500 text-white',
  },
  CONFIRMED: {
    label: 'Potwierdzone',
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    solid: 'bg-emerald-500 text-white',
  },
  CANCELLED: {
    label: 'Anulowane',
    icon: XCircle,
    bg: 'bg-neutral-50 dark:bg-neutral-800',
    text: 'text-neutral-500 dark:text-neutral-400',
    border: 'border-neutral-200 dark:border-neutral-700',
    dot: 'bg-neutral-400',
    solid: 'bg-neutral-500 text-white',
  },
}

// ============================================
// UNIFIED LOOKUP
// ============================================

export type StatusType = 'reservation' | 'deposit' | 'queue' | 'catering' | 'extras'

const STATUS_MAPS: Record<StatusType, Record<string, StatusColorConfig>> = {
  reservation: reservationStatusColors,
  deposit: depositStatusColors,
  queue: queueStatusColors,
  catering: cateringStatusColors,
  extras: extrasStatusColors,
}

const FALLBACK: StatusColorConfig = {
  label: 'Nieznany',
  icon: CircleDot,
  bg: 'bg-neutral-50 dark:bg-neutral-800',
  text: 'text-neutral-500 dark:text-neutral-400',
  border: 'border-neutral-200 dark:border-neutral-700',
  dot: 'bg-neutral-400',
  solid: 'bg-neutral-500 text-white',
}

/** Get status config by type + status key */
export function getStatusConfig(type: StatusType, status: string): StatusColorConfig {
  return STATUS_MAPS[type]?.[status] ?? FALLBACK
}

// ============================================
// GENERIC HELPER
// ============================================

/** Get full badge className for a status */
export function getStatusBadgeClass(config: StatusColorConfig): string {
  return `${config.bg} ${config.text} ${config.border}`
}

/** Semantic color intents — use for consistent meaning across the app */
export const semanticColors = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  neutral: {
    bg: 'bg-neutral-50 dark:bg-neutral-800',
    text: 'text-neutral-600 dark:text-neutral-400',
    border: 'border-neutral-200 dark:border-neutral-700',
  },
} as const
