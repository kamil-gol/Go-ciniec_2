/**
 * Recalculate Reservation Total Price
 * Single source of truth for reservation price computation.
 *
 * Formula: totalPrice = menuPrice + extrasTotal + venueSurcharge + extraHoursCost - discountAmount
 *
 * Call after any change to: menu, extras, surcharge, time, or discount.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateTotalPrice } from './reservation.utils';

const GLOBAL_STANDARD_HOURS = 6;
const GLOBAL_EXTRA_HOUR_RATE = 500;

export interface ReservationPriceBreakdown {
  menuPrice: number;
  extrasTotal: number;
  surcharge: number;
  extraHoursCost: number;
  standardHours: number;
  extraHourRate: number;
  basePrice: number;
  discountAmount: number;
  totalPrice: number;
  hasDiscount: boolean;
}

/**
 * Calculate extra hours cost from event start/end times.
 * Now parameterized: standardHours and extraHourRate can be set per EventType.
 * If extraHourRate is 0, the event type is exempt from extra hours charges.
 */
function calculateExtraHoursCost(
  startDateTime: Date | null,
  endDateTime: Date | null,
  standardHours: number = GLOBAL_STANDARD_HOURS,
  extraHourRate: number = GLOBAL_EXTRA_HOUR_RATE
): number {
  if (!startDateTime || !endDateTime) return 0;
  if (extraHourRate === 0) return 0;
  const durationMs = endDateTime.getTime() - startDateTime.getTime();
  if (durationMs <= 0) return 0;
  const durationHours = durationMs / (1000 * 60 * 60);
  const extraHours = Math.max(0, Math.ceil(durationHours - standardHours));
  return extraHours * extraHourRate;
}

/**
 * Compute the full price breakdown from reservation components.
 * Does NOT modify the database.
 */
export async function computeReservationBasePrice(
  reservationId: string
): Promise<ReservationPriceBreakdown> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      eventType: true,
      menuSnapshot: true,
      extras: {
        where: { status: { not: 'CANCELLED' } },
        include: {
          serviceItem: {
            select: { basePrice: true, priceType: true },
          },
        },
      },
    },
  });

  if (!reservation) throw new Error('Nie znaleziono rezerwacji');

  // 1. Menu price from snapshot or per-person prices
  let menuPrice: number;
  if (reservation.menuSnapshot) {
    menuPrice = Number((reservation.menuSnapshot as any).totalMenuPrice);
  } else {
    menuPrice = calculateTotalPrice(
      reservation.adults,
      reservation.children,
      Number(reservation.pricePerAdult),
      Number(reservation.pricePerChild),
      reservation.toddlers,
      Number(reservation.pricePerToddler)
    );
  }

  // 2. Extras total (from saved per-extra totalPrice)
  const extrasTotal = (reservation.extras || []).reduce(
    (sum: number, e: any) => sum + Number(e.totalPrice),
    0
  );

  // 3. Venue surcharge
  const surcharge = Number((reservation as any).venueSurcharge) || 0;

  // 4. Extra hours — resolve per-event-type or fallback to global defaults
  const standardHours = reservation.eventType?.standardHours ?? GLOBAL_STANDARD_HOURS;
  const extraHourRate = reservation.eventType?.extraHourRate != null
    ? Number(reservation.eventType.extraHourRate)
    : GLOBAL_EXTRA_HOUR_RATE;

  const extraHoursCost = calculateExtraHoursCost(
    reservation.startDateTime,
    reservation.endDateTime,
    standardHours,
    extraHourRate
  );

  // 5. Base price before discount (includes extra hours)
  const basePrice =
    Math.round((menuPrice + extrasTotal + surcharge + extraHoursCost) * 100) / 100;

  // 6. Discount
  const hasDiscount = !!(
    reservation.discountType &&
    reservation.discountValue &&
    Number(reservation.discountValue) > 0
  );
  let discountAmount = 0;
  if (hasDiscount) {
    if (reservation.discountType === 'PERCENTAGE') {
      discountAmount =
        Math.round(
          basePrice * (Number(reservation.discountValue) / 100) * 100
        ) / 100;
    } else {
      discountAmount = Math.min(Number(reservation.discountValue), basePrice);
    }
  }

  const totalPrice = Math.round((basePrice - discountAmount) * 100) / 100;

  return {
    menuPrice,
    extrasTotal,
    surcharge,
    extraHoursCost,
    standardHours,
    extraHourRate,
    basePrice,
    discountAmount,
    totalPrice,
    hasDiscount,
  };
}

/**
 * Recalculate and persist totalPrice + related fields for a reservation.
 * Returns the new totalPrice.
 */
export async function recalculateReservationTotalPrice(
  reservationId: string
): Promise<number> {
  const breakdown = await computeReservationBasePrice(reservationId);

  const updateData: any = {
    totalPrice: breakdown.totalPrice,
    extrasTotalPrice: new Decimal(breakdown.extrasTotal),
    extraHoursCost: new Decimal(breakdown.extraHoursCost),
  };

  if (breakdown.hasDiscount) {
    updateData.priceBeforeDiscount = breakdown.basePrice;
    updateData.discountAmount = breakdown.discountAmount;
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: updateData,
  });

  return breakdown.totalPrice;
}
