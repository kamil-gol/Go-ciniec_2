import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { pl } from 'date-fns/locale/pl'

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to Polish locale
 */
export function formatDate(date: string | Date, formatStr = 'dd.MM.yyyy'): string {
  if (!date) return 'N/A'
  
  try {
    let dateObj: Date
    
    if (typeof date === 'string') {
      // Handle different date formats
      if (date.includes('T')) {
        dateObj = parseISO(date)
      } else {
        // Handle simple date format like "2026-02-13"
        dateObj = new Date(date + 'T00:00:00')
      }
    } else {
      dateObj = date
    }
    
    if (!isValid(dateObj)) {
      return 'Invalid date'
    }
    
    return format(dateObj, formatStr, { locale: pl })
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return 'Invalid date'
  }
}

/**
 * Format time
 */
export function formatTime(time: string): string {
  if (!time) return 'N/A'
  return time.substring(0, 5) // HH:MM
}

/**
 * Format currency (PLN) - always "X XXX,XX zl" with 2 decimal places
 * Standard formatter for all price display across the app.
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '\u2014'
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '\u2014'
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * Format date as "DD MMMM YYYY" - e.g. "3 marca 2026"
 * Standard long date format for detail views.
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '\u2014'
  try {
    const dateObj = typeof date === 'string'
      ? (date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00'))
      : date
    if (isNaN(dateObj.getTime())) return '\u2014'
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj)
  } catch {
    return '\u2014'
  }
}

/**
 * Format date as "DD.MM.YYYY" - e.g. "03.03.2026"
 * Standard short date format for tables and compact views.
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '\u2014'
  try {
    const dateObj = typeof date === 'string'
      ? (date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00'))
      : date
    if (isNaN(dateObj.getTime())) return '\u2014'
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj)
  } catch {
    return '\u2014'
  }
}

/**
 * Calculate total price
 */
export function calculateTotalPrice(guests: number, pricePerPerson: number | string): number {
  const price = typeof pricePerPerson === 'string' ? parseFloat(pricePerPerson) : pricePerPerson
  return guests * price
}

/**
 * Calculate duration in hours
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  return (endMinutes - startMinutes) / 60
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    ARCHIVED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get status label in Polish
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Oczekująca',
    CONFIRMED: 'Potwierdzona',
    COMPLETED: 'Zakończona',
    CANCELLED: 'Anulowana',
    ARCHIVED: 'Zarchiwizowana',
  }
  return labels[status] || status
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  try {
    let dateObj: Date
    if (typeof date === 'string') {
      dateObj = date.includes('T') ? parseISO(date) : new Date(date + 'T00:00:00')
    } else {
      dateObj = date
    }
    return isValid(dateObj) && dateObj < new Date()
  } catch {
    return false
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
