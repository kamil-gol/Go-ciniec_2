/**
 * Shared Status Colors — Unified color system for all entity statuses
 * 
 * Use these maps instead of defining status colors inline in components.
 * Each status has light mode + dark mode variants.
 */

export type StatusColorConfig = {
  label: string
  bg: string
  text: string
  border: string
  dot: string
}

// ============================================
// RESERVATION STATUSES
// ============================================
export const reservationStatusColors: Record<string, StatusColorConfig> = {
  PENDING: {
    label: 'Oczekująca',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Potwierdzona',
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  CANCELLED: {
    label: 'Anulowana',
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  COMPLETED: {
    label: 'Zakończona',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
}

// ============================================
// DEPOSIT STATUSES
// ============================================
export const depositStatusColors: Record<string, StatusColorConfig> = {
  PENDING: {
    label: 'Oczekująca',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  PAID: {
    label: 'Opłacona',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  OVERDUE: {
    label: 'Przeterminowana',
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  PARTIALLY_PAID: {
    label: 'Częściowa',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  CANCELLED: {
    label: 'Anulowana',
    bg: 'bg-neutral-50 dark:bg-neutral-800',
    text: 'text-neutral-500 dark:text-neutral-400',
    border: 'border-neutral-200 dark:border-neutral-700',
    dot: 'bg-neutral-400',
  },
}

// ============================================
// QUEUE STATUSES
// ============================================
export const queueStatusColors: Record<string, StatusColorConfig> = {
  WAITING: {
    label: 'Oczekuje',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  PROMOTED: {
    label: 'Promowana',
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  EXPIRED: {
    label: 'Wygasła',
    bg: 'bg-neutral-50 dark:bg-neutral-800',
    text: 'text-neutral-500 dark:text-neutral-400',
    border: 'border-neutral-200 dark:border-neutral-700',
    dot: 'bg-neutral-400',
  },
  CANCELLED: {
    label: 'Anulowana',
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
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
