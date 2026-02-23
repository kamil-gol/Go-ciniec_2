/**
 * Venue Surcharge Preview Utility
 * Mirrors backend calculateVenueSurcharge() logic for live preview in edit forms.
 * Source of truth: apps/backend/src/utils/venue-surcharge.ts
 *
 * IMPORTANT: If backend thresholds change, update these constants too.
 */

const SURCHARGE_THRESHOLD = 30
const SURCHARGE_BELOW_THRESHOLD = 3000
const SURCHARGE_AT_OR_ABOVE_THRESHOLD = 2000

export interface VenueSurchargePreview {
  amount: number
  label: string
}

/**
 * Calculate venue surcharge preview for frontend display.
 * Returns null if hall is not whole venue.
 */
export function calculateVenueSurchargePreview(
  isWholeVenue: boolean,
  totalGuests: number
): VenueSurchargePreview | null {
  if (!isWholeVenue) return null

  if (totalGuests < SURCHARGE_THRESHOLD) {
    return {
      amount: SURCHARGE_BELOW_THRESHOLD,
      label: `Dopłata za cały obiekt (poniżej ${SURCHARGE_THRESHOLD} gości)`,
    }
  }

  return {
    amount: SURCHARGE_AT_OR_ABOVE_THRESHOLD,
    label: `Dopłata za cały obiekt (${SURCHARGE_THRESHOLD}+ gości)`,
  }
}

/**
 * Format surcharge amount in PLN.
 */
export function formatSurchargePLN(amount: number): string {
  return `${amount.toLocaleString('pl-PL')} zł`
}
