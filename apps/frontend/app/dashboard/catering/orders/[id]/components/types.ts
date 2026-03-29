import type { CateringOrder, CateringDeposit } from '@/types/catering-order.types';

// ═══ RE-EXPORTS ═══
export type { CateringOrder, CateringDeposit };

// ═══ HELPERS ═══

import { formatCurrency, formatDateLong } from '@/lib/utils'
export const formatPrice = formatCurrency
export const formatDatePl = formatDateLong

export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  companyName?: string | null,
) {
  if (companyName) return companyName.slice(0, 2).toUpperCase();
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '??';
}

// Wspolne style ikon akcji
export const iconBtnEdit =
  'p-1 rounded text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors';
export const iconBtnDelete =
  'p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50';
