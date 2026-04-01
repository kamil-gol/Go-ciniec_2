/**
 * Date Utility Helpers
 * Common date operations and formatting functions
 */

/**
 * Format date as YYYY-MM-DD (ISO date string without time)
 * @example
 * formatDateISO(new Date('2026-04-01')) // '2026-04-01'
 */
export function formatDateISO(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toISOString().substring(0, 10);
}

/**
 * Get today's date as YYYY-MM-DD
 * @example
 * getTodayISO() // '2026-04-01'
 */
export function getTodayISO(): string {
  return new Date().toISOString().substring(0, 10);
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return formatDateISO(date) === getTodayISO();
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.getTime() < new Date().getTime();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.getTime() > new Date().getTime();
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}
