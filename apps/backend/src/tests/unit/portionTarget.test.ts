/**
 * Unit tests for #166: calculatePortions()
 * Pure function — no DB, no mocks needed.
 */
import { calculatePortions } from '@services/reports.service';

describe('calculatePortions (#166)', () => {
  const adults = 40;
  const children = 15;

  describe('portionTarget = ALL', () => {
    it('should give portions to both adults and children', () => {
      const result = calculatePortions('ALL', adults, children, 1);
      expect(result.adultPortions).toBe(40);
      expect(result.childrenPortions).toBe(15);
      expect(result.totalPortions).toBe(55);
    });

    it('should multiply by portionSize', () => {
      const result = calculatePortions('ALL', adults, children, 2);
      expect(result.adultPortions).toBe(80);
      expect(result.childrenPortions).toBe(30);
      expect(result.totalPortions).toBe(110);
    });
  });

  describe('portionTarget = ADULTS_ONLY', () => {
    it('should give portions only to adults, children = 0', () => {
      const result = calculatePortions('ADULTS_ONLY', adults, children, 1);
      expect(result.adultPortions).toBe(40);
      expect(result.childrenPortions).toBe(0);
      expect(result.totalPortions).toBe(40);
    });

    it('should multiply by portionSize for adults only', () => {
      const result = calculatePortions('ADULTS_ONLY', 20, 10, 3);
      expect(result.adultPortions).toBe(60);
      expect(result.childrenPortions).toBe(0);
      expect(result.totalPortions).toBe(60);
    });
  });

  describe('portionTarget = CHILDREN_ONLY', () => {
    it('should give portions only to children, adults = 0', () => {
      const result = calculatePortions('CHILDREN_ONLY', adults, children, 1);
      expect(result.adultPortions).toBe(0);
      expect(result.childrenPortions).toBe(15);
      expect(result.totalPortions).toBe(15);
    });

    it('should multiply by portionSize for children only', () => {
      const result = calculatePortions('CHILDREN_ONLY', 20, 10, 2);
      expect(result.adultPortions).toBe(0);
      expect(result.childrenPortions).toBe(20);
      expect(result.totalPortions).toBe(20);
    });
  });

  describe('mixed portionTargets in one package (#166 scenario 4)', () => {
    const mixAdults = 50;
    const mixChildren = 20;

    it('should correctly calculate portions for ALL + ADULTS_ONLY + CHILDREN_ONLY mix', () => {
      const allResult = calculatePortions('ALL', mixAdults, mixChildren, 1);
      const adultsResult = calculatePortions('ADULTS_ONLY', mixAdults, mixChildren, 1);
      const childrenResult = calculatePortions('CHILDREN_ONLY', mixAdults, mixChildren, 1);

      // ALL: 50 + 20 = 70
      expect(allResult.totalPortions).toBe(70);
      expect(allResult.adultPortions).toBe(50);
      expect(allResult.childrenPortions).toBe(20);

      // ADULTS_ONLY: 50 + 0 = 50
      expect(adultsResult.totalPortions).toBe(50);
      expect(adultsResult.adultPortions).toBe(50);
      expect(adultsResult.childrenPortions).toBe(0);

      // CHILDREN_ONLY: 0 + 20 = 20
      expect(childrenResult.totalPortions).toBe(20);
      expect(childrenResult.adultPortions).toBe(0);
      expect(childrenResult.childrenPortions).toBe(20);

      // Grand total across all categories: 70 + 50 + 20 = 140
      const grandTotal = allResult.totalPortions + adultsResult.totalPortions + childrenResult.totalPortions;
      expect(grandTotal).toBe(140);
    });

    it('should correctly calculate with varying portionSizes per category', () => {
      // Zupy (ALL) × 1 porcja, Alkohol (ADULTS_ONLY) × 2 porcje, Nuggetsy (CHILDREN_ONLY) × 1.5 porcji
      const zupy = calculatePortions('ALL', mixAdults, mixChildren, 1);
      const alkohol = calculatePortions('ADULTS_ONLY', mixAdults, mixChildren, 2);
      const nuggetsy = calculatePortions('CHILDREN_ONLY', mixAdults, mixChildren, 1.5);

      expect(zupy.totalPortions).toBe(70);       // (50+20) × 1
      expect(alkohol.totalPortions).toBe(100);    // 50 × 2
      expect(nuggetsy.totalPortions).toBe(30);    // 20 × 1.5

      expect(alkohol.adultPortions).toBe(100);
      expect(alkohol.childrenPortions).toBe(0);

      expect(nuggetsy.adultPortions).toBe(0);
      expect(nuggetsy.childrenPortions).toBe(30);

      const grandTotal = zupy.totalPortions + alkohol.totalPortions + nuggetsy.totalPortions;
      expect(grandTotal).toBe(200);
    });

    it('should handle mix when one guest group is zero', () => {
      // 30 adults, 0 children
      const all = calculatePortions('ALL', 30, 0, 1);
      const adultsOnly = calculatePortions('ADULTS_ONLY', 30, 0, 1);
      const childrenOnly = calculatePortions('CHILDREN_ONLY', 30, 0, 1);

      expect(all.totalPortions).toBe(30);         // 30 + 0
      expect(adultsOnly.totalPortions).toBe(30);  // 30
      expect(childrenOnly.totalPortions).toBe(0); // 0 children → 0 portions

      // Grand total: 30 + 30 + 0 = 60 (CHILDREN_ONLY contributes nothing)
      expect(all.totalPortions + adultsOnly.totalPortions + childrenOnly.totalPortions).toBe(60);
    });
  });

  describe('edge cases', () => {
    it('should fallback to ALL for unknown portionTarget', () => {
      const result = calculatePortions('UNKNOWN_VALUE', 10, 5, 1);
      expect(result.adultPortions).toBe(10);
      expect(result.childrenPortions).toBe(5);
      expect(result.totalPortions).toBe(15);
    });

    it('should handle zero guests correctly', () => {
      const result = calculatePortions('ALL', 0, 0, 1);
      expect(result.adultPortions).toBe(0);
      expect(result.childrenPortions).toBe(0);
      expect(result.totalPortions).toBe(0);
    });
  });
});
