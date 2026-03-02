/**
 * Centralized Reservation Total Recalculation
 *
 * Single source of truth for the final totalPrice formula:
 *   totalPrice = basePricing + extrasTotal + venueSurcharge + extraHoursCost - discountAmount
 *
 * Also maintains priceBeforeDiscount for the discount UI section:
 *   priceBeforeDiscount = basePricing + extrasTotal + venueSurcharge + extraHoursCost
 *
 * Called from:
 *   - serviceExtra.service.ts  (after add/update/remove extras)
 *   - reservation.service.ts   (after guest count, price, or time changes)
 *   - reservation.service.ts   (after menu package updates)
 *
 * This ensures totalPrice is NEVER stale regardless of which
 * operation triggers a recalculation.
 */

import { prisma } from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateTotalPrice } from './reservation.utils';
import logger from './logger';

const STANDARD_HOURS = 6;
const DEFAULT_EXTRA_HOUR_RATE = 500;

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

/**
 * Calculate extra hours cost from event start/end times.
 * Standard included time is 6 hours; each extra hour costs extraHourRate.
 * Mirrors frontend logic in ReservationFinancialSummary.tsx.
 */
function calculateExtraHoursCostFromTimes(
  startDateTime: Date | null,
  endDateTime: Date | null,
  extraHourRate: number = DEFAULT_EXTRA_HOUR_RATE
): number {
  if (!startDateTime || !endDateTime) return 0;
  const durationMs = endDateTime.getTime() - startDateTime.getTime();
  if (durationMs <= 0) return 0;
  const durationHours = durationMs / (1000 * 60 * 60);
  const extraHours = Math.max(0, Math.ceil(durationHours - STANDARD_HOURS));
  return extraHours * extraHourRate;
}

export interface RecalculationResult {
  basePricing: number;
  extrasTotal: number;
  venueSurcharge: number;
  extraHoursCost: number;
  discountAmount: number;
  priceBeforeDiscount: number;
  totalPrice: number;
}

/**
 * Recalculate and persist the reservation's totalPrice, extrasTotalPrice,
 * extraHoursCost, and priceBeforeDiscount.
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

  // 4. Extra hours cost from event times
  const extraHoursCost = calculateExtraHoursCostFromTimes(
    reservation.startDateTime,
    reservation.endDateTime
  );

  // 5. Discount (already stored on the reservation)
  const discountAmount = Number(reservation.discountAmount) || 0;

  // 6. Price before discount (used by frontend discount section)
  const priceBeforeDiscount = Math.round(
    (basePricing + extrasTotal + venueSurcharge + extraHoursCost) * 100
  ) / 100;

  // 7. Final total
  const totalPrice = Math.round(
    (priceBeforeDiscount - discountAmount) * 100
  ) / 100;

  // Persist all pricing fields atomically
  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      totalPrice: new Decimal(totalPrice),
      extrasTotalPrice: new Decimal(extrasTotal),
      extraHoursCost: new Decimal(extraHoursCost),
      priceBeforeDiscount: discountAmount > 0
        ? new Decimal(priceBeforeDiscount)
        : null,
    },
  });

  logger.info(
    `[recalculateTotal] Reservation ${reservationId}: ` +
    `base=${basePricing} + extras=${extrasTotal} + surcharge=${venueSurcharge} + extraHours=${extraHoursCost} ` +
    `= ${priceBeforeDiscount} (before discount) - discount=${discountAmount} = ${totalPrice}`
  );

  return { basePricing, extrasTotal, venueSurcharge, extraHoursCost, discountAmount, priceBeforeDiscount, totalPrice };
}
