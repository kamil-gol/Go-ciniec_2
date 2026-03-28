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
 * Format currency (PLN)
 */
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(numAmount)
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
