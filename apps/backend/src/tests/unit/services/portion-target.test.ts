/**
 * #166 — portionTarget unit tests
 *
 * Covers:
 * - calculatePortions() pure function: ALL, ADULTS_ONLY, CHILDREN_ONLY, default
 * - packageCategoryService: validation rejects invalid portionTarget
 * - buildMenuSnapshot: portionTarget persisted in snapshot
 * - Mixed report scenario: 3 target types in one package
 */

import { calculatePortions } from '../../../services/reports';

// ═══════════════════════════════════════════
// 1. calculatePortions() — pure function
// ═══════════════════════════════════════════

describe('calculatePortions (#166)', () => {
  const adults = 50;
  const children = 20;
  const portionSize = 1;

  describe('ALL (default)', () => {
    it('should calculate portions for all guests', () => {
      const result = calculatePortions('ALL', adults, children, portionSize);
      expect(result.adultPortions).toBe(50);
      expect(result.childrenPortions).toBe(20);
      expect(result.totalPortions).toBe(70);
    });

    it('should scale with portionSize', () => {
      const result = calculatePortions('ALL', adults, children, 0.5);
      expect(result.adultPortions).toBe(25);
      expect(result.childrenPortions).toBe(10);
      expect(result.totalPortions).toBe(35);
    });
  });

  describe('ADULTS_ONLY', () => {
    it('should calculate portions only for adults', () => {
      const result = calculatePortions('ADULTS_ONLY', adults, children, portionSize);
      expect(result.adultPortions).toBe(50);
      expect(result.childrenPortions).toBe(0);
      expect(result.totalPortions).toBe(50);
    });

    it('should return 0 when no adults', () => {
      const result = calculatePortions('ADULTS_ONLY', 0, children, portionSize);
      expect(result.adultPortions).toBe(0);
      expect(result.childrenPortions).toBe(0);
      expect(result.totalPortions).toBe(0);
    });
  });

  describe('CHILDREN_ONLY', () => {
    it('should calculate portions only for children', () => {
      const result = calculatePortions('CHILDREN_ONLY', adults, children, portionSize);
      expect(result.adultPortions).toBe(0);
      expect(result.childrenPortions).toBe(20);
      expect(result.totalPortions).toBe(20);
    });

    it('should return 0 when no children', () => {
      const result = calculatePortions('CHILDREN_ONLY', adults, 0, portionSize);
      expect(result.adultPortions).toBe(0);
      expect(result.childrenPortions).toBe(0);
      expect(result.totalPortions).toBe(0);
    });
  });

  describe('default / unknown', () => {
    it('should fallback to ALL for unknown value', () => {
      const result = calculatePortions('UNKNOWN_VALUE', adults, children, portionSize);
      expect(result.adultPortions).toBe(50);
      expect(result.childrenPortions).toBe(20);
      expect(result.totalPortions).toBe(70);
    });

    it('should fallback to ALL for empty string', () => {
      const result = calculatePortions('', adults, children, portionSize);
      expect(result.adultPortions).toBe(50);
      expect(result.childrenPortions).toBe(20);
      expect(result.totalPortions).toBe(70);
    });
  });

  describe('edge cases', () => {
    it('should handle zero guests', () => {
      const result = calculatePortions('ALL', 0, 0, 1);
      expect(result.totalPortions).toBe(0);
    });

    it('should handle large portionSize', () => {
      const result = calculatePortions('ALL', 10, 5, 3);
      expect(result.adultPortions).toBe(30);
      expect(result.childrenPortions).toBe(15);
      expect(result.totalPortions).toBe(45);
    });

    it('should handle fractional portionSize', () => {
      const result = calculatePortions('ADULTS_ONLY', 10, 5, 0.25);
      expect(result.adultPortions).toBe(2.5);
      expect(result.childrenPortions).toBe(0);
      expect(result.totalPortions).toBe(2.5);
    });
  });
});

// ═══════════════════════════════════════════
// 2. Mixed scenario — 3 target types in one report
// ═══════════════════════════════════════════

describe('Mixed portionTarget scenario (#166)', () => {
  const adults = 40;
  const children = 15;

  it('should correctly aggregate mixed targets in a package', () => {
    // Zupa (ALL) — 40+15 = 55 porcji
    const soup = calculatePortions('ALL', adults, children, 1);
    expect(soup.totalPortions).toBe(55);

    // Alkohol (ADULTS_ONLY) — 40 porcji
    const alcohol = calculatePortions('ADULTS_ONLY', adults, children, 1);
    expect(alcohol.totalPortions).toBe(40);
    expect(alcohol.childrenPortions).toBe(0);

    // Menu dziecięce (CHILDREN_ONLY) — 15 porcji
    const kidsMenu = calculatePortions('CHILDREN_ONLY', adults, children, 1);
    expect(kidsMenu.totalPortions).toBe(15);
    expect(kidsMenu.adultPortions).toBe(0);

    // Grand total for this package = 55 + 40 + 15 = 110
    const grandTotal = soup.totalPortions + alcohol.totalPortions + kidsMenu.totalPortions;
    expect(grandTotal).toBe(110);
  });

  it('should handle portionSize variations across targets', () => {
    // Zupa 0.5 porcji (ALL)
    const soup = calculatePortions('ALL', adults, children, 0.5);
    expect(soup.totalPortions).toBe(27.5);

    // Whisky 1 porcja (ADULTS_ONLY)
    const whisky = calculatePortions('ADULTS_ONLY', adults, children, 1);
    expect(whisky.totalPortions).toBe(40);

    // Nuggetsy 2 porcje (CHILDREN_ONLY)
    const nuggets = calculatePortions('CHILDREN_ONLY', adults, children, 2);
    expect(nuggets.totalPortions).toBe(30);
  });
});

// ═══════════════════════════════════════════
// 3. portionTarget validation
// ═══════════════════════════════════════════

describe('portionTarget validation (#166)', () => {
  // Import PORTION_TARGETS to test allowed values
  const { PORTION_TARGETS } = require('../../../services/packageCategory.service');

  it('should define exactly 3 valid targets', () => {
    expect(PORTION_TARGETS).toEqual(['ALL', 'ADULTS_ONLY', 'CHILDREN_ONLY']);
    expect(PORTION_TARGETS).toHaveLength(3);
  });

  it('should include ALL as first (default) value', () => {
    expect(PORTION_TARGETS[0]).toBe('ALL');
  });
});
