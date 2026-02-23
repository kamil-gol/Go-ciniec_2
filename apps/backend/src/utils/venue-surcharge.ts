/**
 * Venue Surcharge Calculator — "Cały Obiekt" pricing logic
 *
 * Business rules:
 * - Hall with isWholeVenue = true gets automatic surcharge
 * - guests < 30 → 3000 PLN surcharge
 * - guests >= 30 → 2000 PLN surcharge
 * - Regular halls → no surcharge
 *
 * Surcharge is included in totalPrice BEFORE discount calculation.
 * priceBeforeDiscount = menuPrice + extras + surcharge
 * totalPrice = priceBeforeDiscount - discountAmount
 */

export interface VenueSurchargeResult {
  amount: number | null;
  label: string | null;
}

/**
 * Calculate venue surcharge for "Cały Obiekt" (whole venue) bookings.
 */
export function calculateVenueSurcharge(
  isWholeVenue: boolean,
  guests: number
): VenueSurchargeResult {
  if (!isWholeVenue) {
    return { amount: null, label: null };
  }

  if (guests < 30) {
    return {
      amount: 3000,
      label: 'Dopłata za cały obiekt (poniżej 30 gości)',
    };
  }

  return {
    amount: 2000,
    label: 'Dopłata za cały obiekt (30+ gości)',
  };
}

/**
 * Get surcharge amount as number (0 if no surcharge).
 * Convenience wrapper for price calculations.
 */
export function getSurchargeAmount(isWholeVenue: boolean, guests: number): number {
  const result = calculateVenueSurcharge(isWholeVenue, guests);
  return result.amount || 0;
}
