/**
 * Deposit Helpers
 * Extracted from deposit.service.ts — shared constants, utility functions, types
 */

export const DEPOSIT_INCLUDE = {
  reservation: {
    include: {
      client: true,
      hall: true,
      eventType: true,
    },
  },
} as const;

/**
 * Calculate full reservation price including extras.
 * Used as the deposit ceiling — sum of base totalPrice + extrasTotalPrice.
 */
export function getFullReservationPrice(reservation: { totalPrice?: unknown; extrasTotalPrice?: unknown }): number {
  return Number(reservation.totalPrice || 0) + Number(reservation.extrasTotalPrice || 0);
}
