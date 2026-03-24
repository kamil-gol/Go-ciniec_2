import type { ServiceItem } from '@/types/service-extra.types'
import { formatCurrency } from '@/lib/utils'

// ═══ CATEGORY ICON MAP ═══

export const CATEGORY_ICONS: { [key: string]: string } = {
  'muzyka': '🎵',
  'torty-slodkosci': '🎂',
  'dekoracje': '💐',
  'foto-video': '📷',
  'animacje-efekty': '🎉',
  'transport': '🚗',
  'inne': '📦',
}

// ═══ PRICE HELPERS ═══

export function getItemPrice(item: ServiceItem, totalGuests: number, qty: number = 1): string {
  if (item.priceType === 'FREE') return 'Gratis'
  if (item.priceType === 'PER_PERSON') {
    return `${formatCurrency(item.basePrice)}/os × ${totalGuests} = ${formatCurrency(item.basePrice * totalGuests * qty)}`
  }
  if (item.priceType === 'PER_UNIT') {
    return qty > 1
      ? `${formatCurrency(item.basePrice)}/szt. × ${qty} szt. = ${formatCurrency(item.basePrice * qty)}`
      : `${formatCurrency(item.basePrice)}/szt.`
  }
  // FLAT
  return qty > 1
    ? `${formatCurrency(item.basePrice)} × ${qty} = ${formatCurrency(item.basePrice * qty)}`
    : formatCurrency(item.basePrice)
}

export function calculateExtrasTotal(
  selectedExtras: { serviceItem: ServiceItem; quantity: number }[],
  totalGuests: number,
): number {
  let total = 0
  for (const extra of selectedExtras) {
    const item = extra.serviceItem
    switch (item.priceType) {
      case 'FREE':
        break
      case 'PER_PERSON':
        total += item.basePrice * totalGuests * extra.quantity
        break
      case 'PER_UNIT':
        total += item.basePrice * extra.quantity
        break
      case 'FLAT':
      default:
        total += item.basePrice * extra.quantity
        break
    }
  }
  return total
}
