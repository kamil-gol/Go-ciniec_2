/**
 * deposit.validation — Unit Tests
 */

import {
  createDepositSchema,
  updateDepositSchema,
  markAsPaidSchema,
  depositFiltersSchema,
} from '../../../validation/deposit.validation';

describe('deposit.validation', () => {

  describe('createDepositSchema', () => {
    it('should accept valid input', () => {
      expect(() => createDepositSchema.parse({
          amount: 1500,
        dueDate: '2026-06-01',
      })).not.toThrow();
    });
    it('should reject amount <= 0', () => {
      expect(() => createDepositSchema.parse({
        reservationId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 0,
        dueDate: '2026-06-01',
      })).toThrow();
    });

    it('should reject invalid dueDate format', () => {
      expect(() => createDepositSchema.parse({
        reservationId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 1500,
        dueDate: 'not-a-date',
      })).toThrow();
    });

    it('should accept optional note', () => {
      expect(() => createDepositSchema.parse({
        reservationId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 1500,
        dueDate: '2026-06-01',
        note: 'Pierwsza wpłata',
      })).not.toThrow();
    });
  });

  describe('updateDepositSchema', () => {
    it('should accept partial update', () => {
      expect(() => updateDepositSchema.parse({ amount: 2000 })).not.toThrow();
    });

    it('should accept dueDate only', () => {
      expect(() => updateDepositSchema.parse({ dueDate: '2026-07-01' })).not.toThrow();
    });

    it('should reject empty object', () => {
      expect(() => updateDepositSchema.parse({})).toThrow();
    });

    it('should reject amount <= 0', () => {
      expect(() => updateDepositSchema.parse({ amount: -100 })).toThrow();
    });
  });

  describe('markAsPaidSchema', () => {
    it('should accept valid paymentMethod', () => {
      expect(() => markAsPaidSchema.parse({ paymentMethod: 'CASH' })).not.toThrow();
    });

    it('should accept BANK_TRANSFER', () => {
      expect(() => markAsPaidSchema.parse({ paymentMethod: 'BANK_TRANSFER' })).not.toThrow();
    });

    it('should reject invalid paymentMethod', () => {
      expect(() => markAsPaidSchema.parse({ paymentMethod: 'BITCOIN' })).toThrow();
    });

    it('should accept without paymentMethod (optional)', () => {
      expect(() => markAsPaidSchema.parse({})).not.toThrow();
    });
  });

  describe('depositFiltersSchema', () => {
    it('should accept default empty filters', () => {
      expect(() => depositFiltersSchema.parse({})).not.toThrow();
    });

    it('should accept valid page and limit', () => {
      expect(() => depositFiltersSchema.parse({ page: 1, limit: 20 })).not.toThrow();
    });

    it('should reject page < 1', () => {
      expect(() => depositFiltersSchema.parse({ page: 0 })).toThrow();
    });

    it('should reject limit > 500', () => {
      // POPRAWKA: max limit w schemacie to 500, nie 100
      expect(() => depositFiltersSchema.parse({ limit: 501 })).toThrow();
    });

    it('should accept valid status filter', () => {
      expect(() => depositFiltersSchema.parse({ status: 'PAID' })).not.toThrow();
    });

    it('should reject invalid status', () => {
      expect(() => depositFiltersSchema.parse({ status: 'INVALID_STATUS' })).toThrow();
    });
  });
});
