import { formatCurrency, formatDateLong } from '@/lib/utils'
export const formatPln = formatCurrency
export const formatDatePl = formatDateLong

export function buildAddress(street: string, number: string, city: string): string {
  const streetPart = [street.trim(), number.trim()].filter(Boolean).join(' ');
  return [streetPart, city.trim()].filter(Boolean).join(', ');
}
