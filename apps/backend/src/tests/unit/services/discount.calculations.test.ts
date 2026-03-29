/**
 * Tests for discount calculation formulas (pure math, no DB)
 *
 * Formulas tested (from discount.service.ts + recalculate-price.ts):
 *   PERCENTAGE: discountAmount = Math.round(basePrice * value / 100 * 100) / 100
 *   FIXED:      discountAmount = value
 *   totalPrice = Math.round((basePrice - discountAmount) * 100) / 100
 *
 * Validation rules:
 *   - PERCENTAGE value must be <= 100
 *   - FIXED discountAmount must be <= basePrice
 */

describe('Discount calculations (pure math)', () => {
  /**
   * Extract the discount formula from discount.service.ts applyDiscount:
   *   PERCENTAGE → Math.round(basePrice * value / 100 * 100) / 100
   *   FIXED      → value (rejected if > basePrice)
   */
  function calculateDiscountAmount(
    type: 'PERCENTAGE' | 'FIXED',
    value: number,
    basePrice: number
  ): number {
    if (type === 'PERCENTAGE') {
      return Math.round((basePrice * value) / 100 * 100) / 100;
    }
    return value;
  }

  function calculateTotalPrice(basePrice: number, discountAmount: number): number {
    return Math.round((basePrice - discountAmount) * 100) / 100;
  }

  function validateDiscount(
    type: 'PERCENTAGE' | 'FIXED',
    value: number,
    basePrice: number
  ): string | null {
    if (type === 'PERCENTAGE' && value > 100) {
      return 'Rabat procentowy nie może przekroczyć 100%';
    }
    if (type === 'FIXED' && value > basePrice) {
      return `Rabat kwotowy (${value} PLN) nie może przekroczyć ceny (${basePrice} PLN)`;
    }
    return null;
  }

  // -------------------------------------------------------------------
  // PERCENTAGE discount tests
  // -------------------------------------------------------------------
  describe('PERCENTAGE discount', () => {
    it('10% of 2000 → discountAmount = 200, totalPrice = 1800', () => {
      const basePrice = 2000;
      const discountAmount = calculateDiscountAmount('PERCENTAGE', 10, basePrice);
      const totalPrice = calculateTotalPrice(basePrice, discountAmount);

      expect(discountAmount).toBe(200);
      expect(totalPrice).toBe(1800);
    });

    it('15.5% of 1000 → discountAmount = 155, totalPrice = 845', () => {
      const basePrice = 1000;
      const discountAmount = calculateDiscountAmount('PERCENTAGE', 15.5, basePrice);
      const totalPrice = calculateTotalPrice(basePrice, discountAmount);

      expect(discountAmount).toBe(155);
      expect(totalPrice).toBe(845);
    });

    it('100% → totalPrice = 0', () => {
      const basePrice = 2500;
      const discountAmount = calculateDiscountAmount('PERCENTAGE', 100, basePrice);
      const totalPrice = calculateTotalPrice(basePrice, discountAmount);

      expect(discountAmount).toBe(2500);
      expect(totalPrice).toBe(0);
    });

    it('rejects percentage > 100', () => {
      const error = validateDiscount('PERCENTAGE', 101, 1000);
      expect(error).toBe('Rabat procentowy nie może przekroczyć 100%');
    });
  });

  // -------------------------------------------------------------------
  // FIXED discount tests
  // -------------------------------------------------------------------
  describe('FIXED discount', () => {
    it('500 from 2000 → totalPrice = 1500', () => {
      const basePrice = 2000;
      const discountAmount = calculateDiscountAmount('FIXED', 500, basePrice);
      const totalPrice = calculateTotalPrice(basePrice, discountAmount);

      expect(discountAmount).toBe(500);
      expect(totalPrice).toBe(1500);
    });

    it('rejects FIXED > basePrice', () => {
      const basePrice = 1000;
      const fixedValue = 1500;
      const error = validateDiscount('FIXED', fixedValue, basePrice);

      expect(error).toBe(
        `Rabat kwotowy (${fixedValue} PLN) nie może przekroczyć ceny (${basePrice} PLN)`
      );
    });
  });

  // -------------------------------------------------------------------
  // Rounding tests
  // -------------------------------------------------------------------
  describe('Rounding: Math.round(basePrice * rate / 100 * 100) / 100', () => {
    it('rounds to 2 decimal places correctly', () => {
      // 7.3% of 999 = 72.927 → rounded to 72.93
      const discountAmount = calculateDiscountAmount('PERCENTAGE', 7.3, 999);
      expect(discountAmount).toBe(72.93);

      const totalPrice = calculateTotalPrice(999, discountAmount);
      expect(totalPrice).toBe(926.07);
    });

    it('33.33% of 100 → discountAmount = 33.33, totalPrice = 66.67', () => {
      const basePrice = 100;
      const discountAmount = calculateDiscountAmount('PERCENTAGE', 33.33, basePrice);
      const totalPrice = calculateTotalPrice(basePrice, discountAmount);

      expect(discountAmount).toBe(33.33);
      expect(totalPrice).toBe(66.67);
    });

    it('handles sub-cent precision without floating point drift', () => {
      // 10% of 0.01 = 0.001 → rounds to 0
      const discountAmount = calculateDiscountAmount('PERCENTAGE', 10, 0.01);
      expect(discountAmount).toBe(0);
    });

    it('totalPrice never goes negative when discount equals basePrice', () => {
      const basePrice = 1234.56;
      const totalPrice = calculateTotalPrice(basePrice, basePrice);
      expect(totalPrice).toBe(0);
    });
  });

  // -------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------
  describe('Edge cases', () => {
    it('0.01% of large amount preserves precision', () => {
      // 0.01% of 100000 = 10
      const discountAmount = calculateDiscountAmount('PERCENTAGE', 0.01, 100000);
      expect(discountAmount).toBe(10);
    });

    it('FIXED discount equal to basePrice → totalPrice = 0', () => {
      const basePrice = 750;
      const discountAmount = calculateDiscountAmount('FIXED', 750, basePrice);
      const totalPrice = calculateTotalPrice(basePrice, discountAmount);

      expect(discountAmount).toBe(750);
      expect(totalPrice).toBe(0);
      expect(validateDiscount('FIXED', 750, basePrice)).toBeNull();
    });

    it('very small percentage on small base', () => {
      // 1% of 1 = 0.01
      const discountAmount = calculateDiscountAmount('PERCENTAGE', 1, 1);
      expect(discountAmount).toBe(0.01);
    });
  });
});
