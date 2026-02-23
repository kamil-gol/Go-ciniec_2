/**
 * 🏠 Venue Surcharge Calculator — #137
 *
 * Pure function that determines the surcharge amount when booking
 * the whole venue ("Cały Obiekt").
 *
 * Business rules:
 * - hall.isWholeVenue === false → no surcharge (null)
 * - guests < 30  → 3 000 PLN surcharge
 * - guests >= 30 → 2 000 PLN surcharge
 *
 * The surcharge is added ON TOP of menu + extras, BEFORE discount.
 * Final price formula:
 *   totalPrice = (menuPrice + extrasTotal + venueSurcharge) - discountAmount
 */

import { VENUE_SURCHARGE } from '../i18n/pl';

export interface VenueSurchargeResult {
  /** Surcharge amount in PLN, or null if not applicable */
  amount: number | null;
  /** Human-readable label for display/PDF, or null */
  label: string | null;
}

/**
 * Calculate venue surcharge based on hall type and guest count.
 *
 * @param isWholeVenue - Whether the hall represents the entire venue
 * @param guests - Total number of guests (adults + children + toddlers)
 * @returns Surcharge amount and label, or nulls if not applicable
 *
 * @example
 * calculateVenueSurcharge(true, 25)  // { amount: 3000, label: "Dopłata za cały obiekt (poniżej 30 gości)" }
 * calculateVenueSurcharge(true, 30)  // { amount: 2000, label: "Dopłata za cały obiekt (30+ gości)" }
 * calculateVenueSurcharge(true, 50)  // { amount: 2000, label: "Dopłata za cały obiekt (30+ gości)" }
 * calculateVenueSurcharge(false, 25) // { amount: null, label: null }
 */
export function calculateVenueSurcharge(
  isWholeVenue: boolean,
  guests: number
): VenueSurchargeResult {
  if (!isWholeVenue) {
    return { amount: null, label: null };
  }

  if (guests < VENUE_SURCHARGE.THRESHOLD_GUESTS) {
    return {
      amount: VENUE_SURCHARGE.AMOUNT_UNDER_30,
      label: VENUE_SURCHARGE.LABEL_UNDER_30,
    };
  }

  return {
    amount: VENUE_SURCHARGE.AMOUNT_30_PLUS,
    label: VENUE_SURCHARGE.LABEL_30_PLUS,
  };
}
