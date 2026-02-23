import { calculateVenueSurcharge, VenueSurchargeResult } from '../../../utils/venue-surcharge';

/**
 * Unit tests for #137 — Venue Surcharge Calculator
 *
 * Business rules:
 * - hall.isWholeVenue === false → { amount: null, label: null }
 * - hall.isWholeVenue === true && guests < 30 → 3 000 PLN
 * - hall.isWholeVenue === true && guests >= 30 → 2 000 PLN
 */
describe('calculateVenueSurcharge', () => {
  // ═══ Non-whole-venue halls (no surcharge) ═══

  describe('when hall is NOT whole venue', () => {
    it('should return null amount and label for 0 guests', () => {
      const result = calculateVenueSurcharge(false, 0);
      expect(result.amount).toBeNull();
      expect(result.label).toBeNull();
    });

    it('should return null for small guest count', () => {
      const result = calculateVenueSurcharge(false, 10);
      expect(result.amount).toBeNull();
      expect(result.label).toBeNull();
    });

    it('should return null for large guest count', () => {
      const result = calculateVenueSurcharge(false, 100);
      expect(result.amount).toBeNull();
      expect(result.label).toBeNull();
    });

    it('should return null at threshold boundary (29 guests)', () => {
      const result = calculateVenueSurcharge(false, 29);
      expect(result.amount).toBeNull();
      expect(result.label).toBeNull();
    });

    it('should return null at threshold boundary (30 guests)', () => {
      const result = calculateVenueSurcharge(false, 30);
      expect(result.amount).toBeNull();
      expect(result.label).toBeNull();
    });
  });

  // ═══ Whole venue — below threshold (<30 guests) ═══

  describe('when hall IS whole venue and guests < 30', () => {
    it('should return 3000 PLN for 1 guest', () => {
      const result = calculateVenueSurcharge(true, 1);
      expect(result.amount).toBe(3000);
      expect(result.label).toBeTruthy();
      expect(result.label).toContain('30');
    });

    it('should return 3000 PLN for 15 guests', () => {
      const result = calculateVenueSurcharge(true, 15);
      expect(result.amount).toBe(3000);
    });

    it('should return 3000 PLN for 29 guests (boundary)', () => {
      const result = calculateVenueSurcharge(true, 29);
      expect(result.amount).toBe(3000);
      expect(result.label).not.toBeNull();
    });

    it('should return 3000 PLN for 0 guests (edge case)', () => {
      const result = calculateVenueSurcharge(true, 0);
      expect(result.amount).toBe(3000);
    });
  });

  // ═══ Whole venue — at/above threshold (>=30 guests) ═══

  describe('when hall IS whole venue and guests >= 30', () => {
    it('should return 2000 PLN for exactly 30 guests (boundary)', () => {
      const result = calculateVenueSurcharge(true, 30);
      expect(result.amount).toBe(2000);
      expect(result.label).toBeTruthy();
      expect(result.label).toContain('30');
    });

    it('should return 2000 PLN for 31 guests', () => {
      const result = calculateVenueSurcharge(true, 31);
      expect(result.amount).toBe(2000);
    });

    it('should return 2000 PLN for 50 guests', () => {
      const result = calculateVenueSurcharge(true, 50);
      expect(result.amount).toBe(2000);
    });

    it('should return 2000 PLN for 100 guests', () => {
      const result = calculateVenueSurcharge(true, 100);
      expect(result.amount).toBe(2000);
    });

    it('should return 2000 PLN for very large guest count', () => {
      const result = calculateVenueSurcharge(true, 500);
      expect(result.amount).toBe(2000);
    });
  });

  // ═══ Return type structure ═══

  describe('return type VenueSurchargeResult', () => {
    it('should always return object with amount and label keys', () => {
      const resultA = calculateVenueSurcharge(false, 10);
      expect(resultA).toHaveProperty('amount');
      expect(resultA).toHaveProperty('label');

      const resultB = calculateVenueSurcharge(true, 10);
      expect(resultB).toHaveProperty('amount');
      expect(resultB).toHaveProperty('label');
    });

    it('should return non-null label when surcharge applies', () => {
      const result = calculateVenueSurcharge(true, 20);
      expect(result.label).toEqual(expect.any(String));
      expect(result.label!.length).toBeGreaterThan(0);
    });

    it('should return numeric amount (not string) when surcharge applies', () => {
      const result = calculateVenueSurcharge(true, 20);
      expect(typeof result.amount).toBe('number');
    });
  });

  // ═══ Boundary precision tests ═══

  describe('threshold boundary (29 → 30 transition)', () => {
    it('should have higher surcharge below threshold than at/above', () => {
      const below = calculateVenueSurcharge(true, 29);
      const atThreshold = calculateVenueSurcharge(true, 30);

      expect(below.amount).toBe(3000);
      expect(atThreshold.amount).toBe(2000);
      expect(below.amount!).toBeGreaterThan(atThreshold.amount!);
    });

    it('should have different labels for below vs at/above threshold', () => {
      const below = calculateVenueSurcharge(true, 29);
      const atThreshold = calculateVenueSurcharge(true, 30);

      expect(below.label).not.toEqual(atThreshold.label);
    });
  });
});
