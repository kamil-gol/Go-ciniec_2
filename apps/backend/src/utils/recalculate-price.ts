/**
 * Recalculate Reservation Total Price
 * Single source of truth for reservation price computation.
 *
 * Formula: totalPrice = menuPrice + extrasTotal + venueSurcharge - discountAmount
 *
 * Call after any change to: menu, extras, surcharge, or discount.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateTotalPrice } from './reservation.utils';

export interface ReservationPriceBreakdown {
  menuPrice: number;
  extrasTotal: number;
  surcharge: number;
  basePrice: number;
  discountAmount: number;
  totalPrice: number;
  hasDiscount: boolean;
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

  // 4. Base price before discount
  const basePrice =
    Math.round((menuPrice + extrasTotal + surcharge) * 100) / 100;

  // 5. Discount
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
