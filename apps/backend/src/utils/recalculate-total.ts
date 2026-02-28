/**
 * Centralized Reservation Total Recalculation
 *
 * Single source of truth for the final totalPrice formula:
 *   totalPrice = basePricing + extrasTotal + venueSurcharge - discountAmount
 *
 * Called from:
 *   - serviceExtra.service.ts  (after add/update/remove extras)
 *   - reservation.service.ts   (after guest count or price changes)
 *   - reservation.service.ts   (after menu package updates)
 *
 * This ensures totalPrice is NEVER stale regardless of which
 * operation triggers a recalculation.
 */

import { prisma } from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateTotalPrice } from './reservation.utils';
import logger from './logger';

/**
 * Calculate extras total from reservation's non-cancelled extras.
 * Supports FLAT, PER_PERSON, PER_UNIT, FREE price types.
 */
function calculateExtrasTotalFromRecords(
  extras: Array<{ totalPrice: any; status: string }>
): number {
  return extras
    .filter((e) => e.status !== 'CANCELLED')
    .reduce((sum, e) => sum + Number(e.totalPrice), 0);
}

export interface RecalculationResult {
  basePricing: number;
  extrasTotal: number;
  venueSurcharge: number;
  discountAmount: number;
  totalPrice: number;
}

/**
 * Recalculate and persist the reservation's totalPrice and extrasTotalPrice.
 *
 * @param reservationId - UUID of the reservation
 * @returns Breakdown of all price components + final totalPrice
 */
export async function recalculateReservationTotal(
  reservationId: string
): Promise<RecalculationResult> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      extras: true,
    },
  });

  if (!reservation) {
    throw new Error(`Reservation ${reservationId} not found during recalculation`);
  }

  // 1. Base pricing from per-person rates
  const basePricing = calculateTotalPrice(
    reservation.adults,
    reservation.children,
    Number(reservation.pricePerAdult),
    Number(reservation.pricePerChild),
    reservation.toddlers,
    Number(reservation.pricePerToddler)
  );

  // 2. Extras total (non-cancelled)
  const extrasTotal = calculateExtrasTotalFromRecords(reservation.extras as any[]);

  // 3. Venue surcharge (already stored on the reservation)
  const venueSurcharge = Number(reservation.venueSurcharge) || 0;

  // 4. Discount (already stored on the reservation)
  const discountAmount = Number(reservation.discountAmount) || 0;

  // 5. Final total
  const totalPrice = Math.round(
    (basePricing + extrasTotal + venueSurcharge - discountAmount) * 100
  ) / 100;

  // Persist
  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      totalPrice: new Decimal(totalPrice),
      extrasTotalPrice: new Decimal(extrasTotal),
    },
  });

  logger.info(
    `[recalculateTotal] Reservation ${reservationId}: ` +
    `base=${basePricing} + extras=${extrasTotal} + surcharge=${venueSurcharge} - discount=${discountAmount} = ${totalPrice}`
  );

  return { basePricing, extrasTotal, venueSurcharge, discountAmount, totalPrice };
}
