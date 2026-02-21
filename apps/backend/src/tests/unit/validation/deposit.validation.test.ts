import {
  createDepositSchema,
  updateDepositSchema,
  markPaidSchema,
  depositFiltersSchema,
  DepositStatusEnum,
  PaymentMethodEnum,
} from '../../../validation/deposit.validation';

describe('deposit.validation', () => {
  describe('DepositStatusEnum', () => {
    it('should accept valid statuses', () => {
      ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIALLY_PAID'].forEach((s) => {
        expect(DepositStatusEnum.parse(s)).toBe(s);
      });
    });

    it('should reject invalid status', () => {
      expect(() => DepositStatusEnum.parse('UNKNOWN')).toThrow();
    });
  });

  describe('PaymentMethodEnum', () => {
    it('should accept valid methods', () => {
      ['CASH', 'TRANSFER', 'BLIK', 'CARD'].forEach((m) => {
        expect(PaymentMethodEnum.parse(m)).toBe(m);
      });
    });

    it('should reject invalid method', () => {
      expect(() => PaymentMethodEnum.parse('CRYPTO')).toThrow();
    });
  });

  describe('createDepositSchema', () => {
    const validData = { amount: 500, dueDate: '2025-07-01T00:00:00Z' };

    it('should accept valid data', () => {
      const result = createDepositSchema.parse(validData);
      expect(result.amount).toBe(500);
    });

    it('should accept optional notes', () => {
      const result = createDepositSchema.parse({ ...validData, notes: 'Zaliczka' });
      expect(result.notes).toBe('Zaliczka');
    });

    it('should reject missing amount', () => {
      expect(() => createDepositSchema.parse({ dueDate: '2025-07-01' })).toThrow();
    });

    it('should reject amount = 0', () => {
      expect(() => createDepositSchema.parse({ ...validData, amount: 0 })).toThrow();
    });

    it('should reject negative amount', () => {
      expect(() => createDepositSchema.parse({ ...validData, amount: -100 })).toThrow();
    });

    it('should reject amount > 999999.99', () => {
      expect(() => createDepositSchema.parse({ ...validData, amount: 1000000 })).toThrow();
    });

    it('should reject invalid date format', () => {
      expect(() => createDepositSchema.parse({ ...validData, dueDate: 'not-a-date' })).toThrow();
    });

    it('should reject notes longer than 1000 chars', () => {
      expect(() => createDepositSchema.parse({ ...validData, notes: 'A'.repeat(1001) })).toThrow();
    });
  });

  describe('updateDepositSchema', () => {
    it('should accept partial update (amount only)', () => {
      const result = updateDepositSchema.parse({ amount: 600 });
      expect(result.amount).toBe(600);
    });

    it('should accept partial update (dueDate only)', () => {
      const result = updateDepositSchema.parse({ dueDate: '2025-08-01' });
      expect(result.dueDate).toBeDefined();
    });

    it('should accept partial update (notes only)', () => {
      const result = updateDepositSchema.parse({ notes: 'Updated' });
      expect(result.notes).toBe('Updated');
    });

    it('should reject empty object (no fields)', () => {
      expect(() => updateDepositSchema.parse({})).toThrow(/przynajmniej jedno pole/i);
    });

    it('should reject negative amount', () => {
      expect(() => updateDepositSchema.parse({ amount: -50 })).toThrow();
    });
  });

  describe('markPaidSchema', () => {
    const validPaid = { paymentMethod: 'BLIK', paidAt: '2025-06-20T15:00:00Z' };

    it('should accept valid payment data', () => {
      const result = markPaidSchema.parse(validPaid);
      expect(result.paymentMethod).toBe('BLIK');
    });

    it('should accept optional amountPaid', () => {
      const result = markPaidSchema.parse({ ...validPaid, amountPaid: 500 });
      expect(result.amountPaid).toBe(500);
    });

    it('should reject invalid paymentMethod', () => {
      expect(() => markPaidSchema.parse({ ...validPaid, paymentMethod: 'PAYPAL' })).toThrow();
    });

    it('should reject invalid paidAt date', () => {
      expect(() => markPaidSchema.parse({ ...validPaid, paidAt: 'xyz' })).toThrow();
    });

    it('should reject amountPaid = 0', () => {
      expect(() => markPaidSchema.parse({ ...validPaid, amountPaid: 0 })).toThrow();
    });
  });

  describe('depositFiltersSchema', () => {
    it('should accept empty query (all defaults)', () => {
      const result = depositFiltersSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('dueDate');
      expect(result.sortOrder).toBe('asc');
    });

    it('should accept valid UUID for reservationId', () => {
      const result = depositFiltersSchema.parse({ reservationId: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result.reservationId).toBeDefined();
    });

    it('should reject invalid UUID', () => {
      expect(() => depositFiltersSchema.parse({ reservationId: 'not-uuid' })).toThrow();
    });

    it('should coerce page and limit to numbers', () => {
      const result = depositFiltersSchema.parse({ page: '3', limit: '50' });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
    });

    it('should reject page < 1', () => {
      expect(() => depositFiltersSchema.parse({ page: 0 })).toThrow();
    });

    it('should reject limit > 100', () => {
      expect(() => depositFiltersSchema.parse({ limit: 101 })).toThrow();
    });

    it('should accept valid status filter', () => {
      const result = depositFiltersSchema.parse({ status: 'PAID' });
      expect(result.status).toBe('PAID');
    });

    it('should accept valid sortBy values', () => {
      ['dueDate', 'amount', 'createdAt', 'status'].forEach((s) => {
        const result = depositFiltersSchema.parse({ sortBy: s });
        expect(result.sortBy).toBe(s);
      });
    });
  });
});
