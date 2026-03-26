/**
 * Unit tests for service-extras/extras.helpers.ts
 * Covers: SLUG_REGEX, VALID_PRICE_TYPES, VALID_STATUSES, calculateTotalPrice
 */

import { SLUG_REGEX, VALID_PRICE_TYPES, VALID_STATUSES, calculateTotalPrice } from '../../../../services/service-extras/extras.helpers';

// ===============================================================
// Constants
// ===============================================================

describe('SLUG_REGEX', () => {
  it('matches valid slugs', () => {
    expect(SLUG_REGEX.test('tort-weselny')).toBe(true);
    expect(SLUG_REGEX.test('dj')).toBe(true);
    expect(SLUG_REGEX.test('muzyka-na-zywo-2')).toBe(true);
  });

  it('rejects invalid slugs', () => {
    expect(SLUG_REGEX.test('UPPERCASE')).toBe(false);
    expect(SLUG_REGEX.test('has space')).toBe(false);
    expect(SLUG_REGEX.test('-starts-with')).toBe(false);
    expect(SLUG_REGEX.test('ends-with-')).toBe(false);
    expect(SLUG_REGEX.test('')).toBe(false);
  });
});

describe('VALID_PRICE_TYPES', () => {
  it('contains expected types', () => {
    expect(VALID_PRICE_TYPES).toEqual(['FLAT', 'PER_PERSON', 'PER_UNIT', 'FREE']);
  });
});

describe('VALID_STATUSES', () => {
  it('contains expected statuses', () => {
    expect(VALID_STATUSES).toEqual(['PENDING', 'CONFIRMED', 'CANCELLED']);
  });
});

// ===============================================================
// calculateTotalPrice
// ===============================================================

describe('calculateTotalPrice', () => {
  it('returns 0 for FREE', () => {
    expect(calculateTotalPrice('FREE', 100, 5, 80, 20)).toBe(0);
  });

  it('calculates PER_PERSON: unitPrice * (adults + children) * quantity', () => {
    expect(calculateTotalPrice('PER_PERSON', 30, 1, 80, 20)).toBe(3000);
  });

  it('calculates PER_PERSON with quantity > 1', () => {
    expect(calculateTotalPrice('PER_PERSON', 30, 2, 80, 20)).toBe(6000);
  });

  it('calculates PER_UNIT: unitPrice * quantity', () => {
    expect(calculateTotalPrice('PER_UNIT', 15, 80, 100, 20)).toBe(1200);
  });

  it('calculates FLAT: unitPrice * quantity', () => {
    expect(calculateTotalPrice('FLAT', 2000, 1, 80, 20)).toBe(2000);
  });

  it('calculates FLAT with quantity > 1', () => {
    expect(calculateTotalPrice('FLAT', 1000, 3, 80, 20)).toBe(3000);
  });

  it('uses FLAT as default for unknown type', () => {
    expect(calculateTotalPrice('CUSTOM', 500, 2, 10, 5)).toBe(1000);
  });
});
