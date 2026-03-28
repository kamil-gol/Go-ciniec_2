export { formatCurrency as formatPln, formatDateLong as formatDatePl } from '@/lib/utils'

export function buildAddress(street: string, number: string, city: string): string {
  const streetPart = [street.trim(), number.trim()].filter(Boolean).join(' ');
  return [streetPart, city.trim()].filter(Boolean).join(', ');
}
