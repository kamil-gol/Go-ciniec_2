import type { ReservationExtra } from '@/types/service-extra.types'

// Status colors moved to lib/status-colors.ts (extrasStatusColors)

/** Price suffix for display */
export function priceSuffix(priceType: string): string {
  switch (priceType) {
    case 'PER_PERSON': return '/os.';
    case 'PER_UNIT': return '/szt.';
    default: return '';
  }
}

/** Quantity label based on price type */
export function quantityLabel(priceType: string): string {
  switch (priceType) {
    case 'PER_UNIT': return 'Ilość (szt.)';
    case 'PER_PERSON': return 'Ilość (os.)';
    default: return 'Ilość';
  }
}

/** Format extra price details line */
export function formatExtraPriceDetails(extra: ReservationExtra): string {
  const pt = extra.priceType;
  const qty = extra.quantity;
  const unit = Number(extra.unitPrice).toLocaleString('pl-PL');
  const total = Number(extra.totalPrice).toLocaleString('pl-PL');

  if (pt === 'FREE') return 'Gratis';

  if (pt === 'PER_UNIT' && qty > 1) {
    return `${unit} zł/szt. × ${qty} szt. = ${total} zł`;
  }
  if (pt === 'PER_PERSON' && qty > 1) {
    return `${unit} zł/os. × ${qty} = ${total} zł`;
  }
  if (pt === 'FLAT' && qty > 1) {
    return `${unit} zł × ${qty} = ${total} zł`;
  }

  return `${total} zł`;
}
