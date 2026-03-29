/**
 * Unit tests for catering/catering-order.helpers.ts
 * Covers: computeTotals (subtotal, extras, discounts, totalPrice)
 */

import { computeTotals } from '../../../../services/catering/catering-order.helpers';

describe('computeTotals', () => {
  // ─── Basic: no items, no extras ────────────────────────────────────────────

  it('returns all zeros when items and extras are empty', () => {
    const result = computeTotals([], []);
    expect(result).toEqual({
      subtotal: 0,
      extrasTotalPrice: 0,
      discountAmount: 0,
      totalPrice: 0,
    });
  });

  // ─── Subtotal calculation ──────────────────────────────────────────────────

  it('calculates subtotal as sum of quantity * unitPrice for items', () => {
    const items = [
      { quantity: 2, unitPrice: 50 },
      { quantity: 3, unitPrice: 30 },
    ];
    const result = computeTotals(items, []);
    // 2*50 + 3*30 = 100 + 90 = 190
    expect(result.subtotal).toBe(190);
    expect(result.extrasTotalPrice).toBe(0);
    expect(result.totalPrice).toBe(190);
  });

  it('calculates subtotal for a single item', () => {
    const items = [{ quantity: 5, unitPrice: 20 }];
    const result = computeTotals(items, []);
    expect(result.subtotal).toBe(100);
  });

  // ─── Extras calculation ────────────────────────────────────────────────────

  it('calculates extrasTotalPrice as sum of quantity * unitPrice for extras', () => {
    const extras = [
      { quantity: 1, unitPrice: 100 },
      { quantity: 4, unitPrice: 25 },
    ];
    const result = computeTotals([], extras);
    // 1*100 + 4*25 = 100 + 100 = 200
    expect(result.subtotal).toBe(0);
    expect(result.extrasTotalPrice).toBe(200);
    expect(result.totalPrice).toBe(200);
  });

  // ─── Gross = subtotal + extras ─────────────────────────────────────────────

  it('calculates gross as subtotal + extrasTotalPrice (no discount)', () => {
    const items = [{ quantity: 2, unitPrice: 100 }];
    const extras = [{ quantity: 3, unitPrice: 50 }];
    const result = computeTotals(items, extras);
    // subtotal=200, extras=150, gross=350
    expect(result.subtotal).toBe(200);
    expect(result.extrasTotalPrice).toBe(150);
    expect(result.discountAmount).toBe(0);
    expect(result.totalPrice).toBe(350);
  });

  // ─── Multiple items with different prices ──────────────────────────────────

  it('handles multiple items with varying quantities and prices', () => {
    const items = [
      { quantity: 1, unitPrice: 999.99 },
      { quantity: 10, unitPrice: 0.5 },
      { quantity: 3, unitPrice: 150 },
    ];
    const extras = [
      { quantity: 2, unitPrice: 75.5 },
      { quantity: 1, unitPrice: 200 },
    ];
    const result = computeTotals(items, extras);
    // subtotal = 999.99 + 5 + 450 = 1454.99
    // extras = 151 + 200 = 351
    // total = 1805.99
    expect(result.subtotal).toBeCloseTo(1454.99, 2);
    expect(result.extrasTotalPrice).toBe(351);
    expect(result.totalPrice).toBeCloseTo(1805.99, 2);
  });

  // ─── PERCENTAGE discount ───────────────────────────────────────────────────

  describe('PERCENTAGE discount', () => {
    it('calculates discount as Math.round(gross * (value/100) * 100) / 100', () => {
      const items = [{ quantity: 1, unitPrice: 200 }];
      const extras = [{ quantity: 1, unitPrice: 100 }];
      // gross = 300, 10% = 30
      const result = computeTotals(items, extras, 'PERCENTAGE', 10);
      expect(result.discountAmount).toBe(30);
      expect(result.totalPrice).toBe(270);
    });

    it('handles 100% discount', () => {
      const items = [{ quantity: 2, unitPrice: 50 }];
      const result = computeTotals(items, [], 'PERCENTAGE', 100);
      // gross=100, 100% = 100
      expect(result.discountAmount).toBe(100);
      expect(result.totalPrice).toBe(0);
    });

    it('handles 50% discount', () => {
      const items = [{ quantity: 1, unitPrice: 100 }];
      const result = computeTotals(items, [], 'PERCENTAGE', 50);
      expect(result.discountAmount).toBe(50);
      expect(result.totalPrice).toBe(50);
    });

    it('rounds percentage discount to 2 decimal places', () => {
      // gross = 33, 10% = 3.3 (already 1 decimal)
      const items = [{ quantity: 1, unitPrice: 33 }];
      const result = computeTotals(items, [], 'PERCENTAGE', 10);
      expect(result.discountAmount).toBe(3.3);
      expect(result.totalPrice).toBe(29.7);
    });

    it('handles rounding edge case where multiplication produces floating point noise', () => {
      // gross = 99.99, 33% => 99.99 * 0.33 = 32.9967
      // Math.round(32.9967 * 100) / 100 = Math.round(3299.67) / 100 = 3300 / 100 = 33
      const items = [{ quantity: 1, unitPrice: 99.99 }];
      const result = computeTotals(items, [], 'PERCENTAGE', 33);
      expect(result.discountAmount).toBe(33);
      expect(result.totalPrice).toBeCloseTo(66.99, 2);
    });

    it('rounds correctly for gross=1.01 at 33%', () => {
      // 1.01 * 0.33 = 0.3333, Math.round(0.3333 * 100)/100 = Math.round(33.33)/100 = 33/100 = 0.33
      const items = [{ quantity: 1, unitPrice: 1.01 }];
      const result = computeTotals(items, [], 'PERCENTAGE', 33);
      expect(result.discountAmount).toBe(0.33);
      expect(result.totalPrice).toBeCloseTo(0.68, 2);
    });
  });

  // ─── AMOUNT discount ─────────────────────────────────────────────────

  describe('AMOUNT discount', () => {
    it('applies fixed discount when value < gross', () => {
      const items = [{ quantity: 1, unitPrice: 200 }];
      const result = computeTotals(items, [], 'AMOUNT', 50);
      expect(result.discountAmount).toBe(50);
      expect(result.totalPrice).toBe(150);
    });

    it('caps fixed discount at gross (discount > gross)', () => {
      const items = [{ quantity: 1, unitPrice: 100 }];
      const result = computeTotals(items, [], 'AMOUNT', 500);
      // min(500, 100) = 100
      expect(result.discountAmount).toBe(100);
      expect(result.totalPrice).toBe(0);
    });

    it('caps fixed discount at gross (discount == gross)', () => {
      const items = [{ quantity: 2, unitPrice: 50 }];
      const result = computeTotals(items, [], 'AMOUNT', 100);
      expect(result.discountAmount).toBe(100);
      expect(result.totalPrice).toBe(0);
    });

    it('applies fixed discount across items + extras', () => {
      const items = [{ quantity: 1, unitPrice: 80 }];
      const extras = [{ quantity: 1, unitPrice: 70 }];
      const result = computeTotals(items, extras, 'AMOUNT', 30);
      // gross = 150, discount = 30
      expect(result.discountAmount).toBe(30);
      expect(result.totalPrice).toBe(120);
    });
  });

  // ─── totalPrice never goes below 0 ────────────────────────────────────────

  it('ensures totalPrice is never negative (large AMOUNT)', () => {
    const items = [{ quantity: 1, unitPrice: 10 }];
    const result = computeTotals(items, [], 'AMOUNT', 9999);
    expect(result.totalPrice).toBe(0);
    expect(result.totalPrice).toBeGreaterThanOrEqual(0);
  });

  // ─── No discount applied when params are null/undefined/0 ──────────────────

  describe('no discount applied for edge-case discount params', () => {
    it('no discount when discountType is null', () => {
      const items = [{ quantity: 1, unitPrice: 100 }];
      const result = computeTotals(items, [], null, 10);
      expect(result.discountAmount).toBe(0);
      expect(result.totalPrice).toBe(100);
    });

    it('no discount when discountType is undefined', () => {
      const items = [{ quantity: 1, unitPrice: 100 }];
      const result = computeTotals(items, [], undefined, 10);
      expect(result.discountAmount).toBe(0);
      expect(result.totalPrice).toBe(100);
    });

    it('no discount when discountValue is null', () => {
      const items = [{ quantity: 1, unitPrice: 100 }];
      const result = computeTotals(items, [], 'PERCENTAGE', null);
      expect(result.discountAmount).toBe(0);
      expect(result.totalPrice).toBe(100);
    });

    it('no discount when discountValue is undefined', () => {
      const items = [{ quantity: 1, unitPrice: 100 }];
      const result = computeTotals(items, [], 'PERCENTAGE', undefined);
      expect(result.discountAmount).toBe(0);
      expect(result.totalPrice).toBe(100);
    });

    it('no discount when discountValue is 0', () => {
      const items = [{ quantity: 1, unitPrice: 100 }];
      const result = computeTotals(items, [], 'PERCENTAGE', 0);
      expect(result.discountAmount).toBe(0);
      expect(result.totalPrice).toBe(100);
    });

    it('no discount when discountValue is negative', () => {
      const items = [{ quantity: 1, unitPrice: 100 }];
      const result = computeTotals(items, [], 'AMOUNT', -50);
      expect(result.discountAmount).toBe(0);
      expect(result.totalPrice).toBe(100);
    });

    it('no discount when both type and value omitted', () => {
      const items = [{ quantity: 1, unitPrice: 100 }];
      const result = computeTotals(items, []);
      expect(result.discountAmount).toBe(0);
      expect(result.totalPrice).toBe(100);
    });
  });

  // ─── Rounding edge cases ───────────────────────────────────────────────────

  describe('rounding edge cases', () => {
    it('handles fractional unit prices', () => {
      const items = [{ quantity: 3, unitPrice: 33.33 }];
      const result = computeTotals(items, []);
      // 3 * 33.33 = 99.99
      expect(result.subtotal).toBeCloseTo(99.99, 2);
    });

    it('handles very small amounts', () => {
      const items = [{ quantity: 1, unitPrice: 0.01 }];
      const extras = [{ quantity: 1, unitPrice: 0.02 }];
      const result = computeTotals(items, extras);
      expect(result.subtotal).toBe(0.01);
      expect(result.extrasTotalPrice).toBe(0.02);
      expect(result.totalPrice).toBe(0.03);
    });

    it('handles large quantities', () => {
      const items = [{ quantity: 10000, unitPrice: 99.99 }];
      const result = computeTotals(items, []);
      expect(result.subtotal).toBe(999900);
    });

    it('percentage discount rounding: gross=0.03 at 33%', () => {
      // 0.03 * 0.33 = 0.0099, Math.round(0.0099*100)/100 = Math.round(0.99)/100 = 1/100 = 0.01
      const items = [{ quantity: 1, unitPrice: 0.03 }];
      const result = computeTotals(items, [], 'PERCENTAGE', 33);
      expect(result.discountAmount).toBe(0.01);
      // 0.03 - 0.01 has floating point imprecision
      expect(result.totalPrice).toBeCloseTo(0.02, 10);
    });
  });
});
