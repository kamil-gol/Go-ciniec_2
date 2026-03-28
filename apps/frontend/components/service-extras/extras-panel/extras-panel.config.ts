import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { ExtraStatus, ReservationExtra } from '@/types/service-extra.types'

export const STATUS_CONFIG: Record<
  ExtraStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  PENDING: {
    label: 'Oczekuje',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Potwierdzone',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Anulowane',
    className: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
    icon: XCircle,
  },
}

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
  const unit = formatCurrency(extra.unitPrice);
  const total = formatCurrency(extra.totalPrice);

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
