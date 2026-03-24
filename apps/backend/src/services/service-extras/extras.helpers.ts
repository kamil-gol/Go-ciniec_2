// apps/backend/src/services/service-extras/extras.helpers.ts

/**
 * Shared constants and helpers for service extras.
 */

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const VALID_PRICE_TYPES = ['FLAT', 'PER_PERSON', 'PER_UNIT', 'FREE'];
export const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'];

/**
 * Calculate total price for a service extra based on its price type.
 */
export function calculateTotalPrice(
  priceType: string,
  unitPrice: number,
  quantity: number,
  adults: number,
  children: number,
): number {
  switch (priceType) {
    case 'FREE':
      return 0;
    case 'PER_PERSON':
      return unitPrice * (adults + children) * quantity;
    case 'PER_UNIT':
      return unitPrice * quantity;
    case 'FLAT':
    default:
      return unitPrice * quantity;
  }
}
