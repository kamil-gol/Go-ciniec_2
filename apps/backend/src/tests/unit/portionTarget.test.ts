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
