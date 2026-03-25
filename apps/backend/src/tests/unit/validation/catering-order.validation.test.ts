/**
 * catering-order.validation — Unit Tests
 */

import {
  createOrderSchema,
  updateOrderSchema,
  changeStatusSchema,
  createDepositSchema,
  updateDepositSchema,
  markDepositPaidSchema,
  CateringOrderStatusEnum,
  CateringDeliveryTypeEnum,
  CateringDiscountTypeEnum,
} from '../../../validation/catering-order.validation';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('catering-order.validation', () => {
  // ─── createOrderSchema ─────────────────────────────────────────

  describe('createOrderSchema', () => {
    const validData = { clientId: validUUID };

    it('should accept minimal valid order', () => {
      const result = createOrderSchema.parse(validData);
      expect(result.clientId).toBe(validUUID);
    });

    it('should reject missing clientId', () => {
      expect(() => createOrderSchema.parse({})).toThrow();
    });

    it('should reject invalid clientId', () => {
      expect(() => createOrderSchema.parse({ clientId: 'bad' })).toThrow();
    });

    it('should accept full order with all optional fields', () => {
      const result = createOrderSchema.parse({
        clientId: validUUID,
        templateId: validUUID,
        packageId: validUUID,
        deliveryType: 'DELIVERY',
        eventName: 'Wesele',
        eventDate: '2026-06-15',
        eventTime: '14:00',
        eventLocation: 'Sala Weselna',
        guestsCount: 100,
        deliveryAddress: 'ul. Testowa 1',
        deliveryNotes: 'Brama od ulicy',
        deliveryDate: '2026-06-15',
        deliveryTime: '12:00',
        contactName: 'Jan Kowalski',
        contactPhone: '+48123456789',
        contactEmail: 'jan@example.com',
        notes: 'Uwagi ogólne',
        internalNotes: 'Notatki wewnętrzne',
        specialRequirements: 'Bez glutenu',
      });
      expect(result.deliveryType).toBe('DELIVERY');
      expect(result.guestsCount).toBe(100);
    });

    it('should accept all delivery types', () => {
      ['PICKUP', 'DELIVERY', 'ON_SITE'].forEach((dt) => {
        const result = createOrderSchema.parse({ ...validData, deliveryType: dt });
        expect(result.deliveryType).toBe(dt);
      });
    });

    it('should reject invalid deliveryType', () => {
      expect(() => createOrderSchema.parse({ ...validData, deliveryType: 'DRONE' })).toThrow();
    });

    it('should reject invalid eventDate format', () => {
      expect(() => createOrderSchema.parse({ ...validData, eventDate: 'not-a-date' })).toThrow();
    });

    it('should reject invalid eventTime format', () => {
      expect(() => createOrderSchema.parse({ ...validData, eventTime: '2pm' })).toThrow();
    });

    it('should accept valid date and time formats', () => {
      const result = createOrderSchema.parse({ ...validData, eventDate: '2026-12-31', eventTime: '23:59' });
      expect(result.eventDate).toBe('2026-12-31');
      expect(result.eventTime).toBe('23:59');
    });

    it('should reject invalid contactEmail', () => {
      expect(() => createOrderSchema.parse({ ...validData, contactEmail: 'not-email' })).toThrow();
    });

    it('should accept all discount types', () => {
      ['PERCENTAGE', 'AMOUNT'].forEach((dt) => {
        const result = createOrderSchema.parse({ ...validData, discountType: dt, discountValue: 10 });
        expect(result.discountType).toBe(dt);
      });
    });

    it('should reject invalid discountType', () => {
      expect(() => createOrderSchema.parse({ ...validData, discountType: 'COUPON' })).toThrow();
    });

    it('should reject negative discountValue', () => {
      expect(() => createOrderSchema.parse({ ...validData, discountValue: -10 })).toThrow();
    });

    it('should accept items array', () => {
      const result = createOrderSchema.parse({
        ...validData,
        items: [{ dishId: validUUID, quantity: 2, unitPrice: 50 }],
      });
      expect(result.items).toHaveLength(1);
    });

    it('should reject item with quantity < 1', () => {
      expect(() => createOrderSchema.parse({
        ...validData,
        items: [{ dishId: validUUID, quantity: 0, unitPrice: 50 }],
      })).toThrow();
    });

    it('should reject item with negative unitPrice', () => {
      expect(() => createOrderSchema.parse({
        ...validData,
        items: [{ dishId: validUUID, quantity: 1, unitPrice: -5 }],
      })).toThrow();
    });

    it('should accept extras array', () => {
      const result = createOrderSchema.parse({
        ...validData,
        extras: [{ name: 'Serwetki', quantity: 100, unitPrice: 1 }],
      });
      expect(result.extras).toHaveLength(1);
    });

    it('should reject extra with empty name', () => {
      expect(() => createOrderSchema.parse({
        ...validData,
        extras: [{ name: '', quantity: 1, unitPrice: 10 }],
      })).toThrow();
    });

    it('should accept valid quoteExpiresAt (ISO 8601)', () => {
      const result = createOrderSchema.parse({
        ...validData,
        quoteExpiresAt: '2026-06-15T14:00:00.000Z',
      });
      expect(result.quoteExpiresAt).toBe('2026-06-15T14:00:00.000Z');
    });

    it('should reject invalid quoteExpiresAt', () => {
      expect(() => createOrderSchema.parse({ ...validData, quoteExpiresAt: 'not-iso' })).toThrow();
    });

    it('should reject notes > 5000 chars', () => {
      expect(() => createOrderSchema.parse({ ...validData, notes: 'X'.repeat(5001) })).toThrow();
    });
  });

  // ─── updateOrderSchema ─────────────────────────────────────────

  describe('updateOrderSchema', () => {
    it('should accept partial update', () => {
      const result = updateOrderSchema.parse({ eventName: 'Nowe wesele' });
      expect(result.eventName).toBe('Nowe wesele');
    });

    it('should accept empty update', () => {
      const result = updateOrderSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should accept changeReason', () => {
      const result = updateOrderSchema.parse({ changeReason: 'Zmiana terminu' });
      expect(result.changeReason).toBe('Zmiana terminu');
    });

    it('should reject changeReason > 500 chars', () => {
      expect(() => updateOrderSchema.parse({ changeReason: 'X'.repeat(501) })).toThrow();
    });

    it('should accept nullable fields', () => {
      const result = updateOrderSchema.parse({
        eventName: null,
        eventDate: null,
        deliveryAddress: null,
        contactEmail: null,
      });
      expect(result.eventName).toBeNull();
    });
  });

  // ─── changeStatusSchema ────────────────────────────────────────

  describe('changeStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const statuses = [
        'DRAFT', 'INQUIRY', 'QUOTED', 'CONFIRMED',
        'IN_PREPARATION', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED',
      ];
      statuses.forEach((s) => {
        const result = changeStatusSchema.parse({ status: s });
        expect(result.status).toBe(s);
      });
    });

    it('should reject invalid status', () => {
      expect(() => changeStatusSchema.parse({ status: 'UNKNOWN' })).toThrow();
    });

    it('should reject missing status', () => {
      expect(() => changeStatusSchema.parse({})).toThrow();
    });

    it('should accept optional reason', () => {
      const result = changeStatusSchema.parse({ status: 'CANCELLED', reason: 'Klient zrezygnował' });
      expect(result.reason).toBe('Klient zrezygnował');
    });

    it('should reject reason > 500 chars', () => {
      expect(() => changeStatusSchema.parse({ status: 'CANCELLED', reason: 'X'.repeat(501) })).toThrow();
    });
  });

  // ─── createDepositSchema (catering-order) ──────────────────────

  describe('createDepositSchema', () => {
    const validData = { amount: 1000, dueDate: '2026-06-01' };

    it('should accept valid deposit', () => {
      const result = createDepositSchema.parse(validData);
      expect(result.amount).toBe(1000);
      expect(result.dueDate).toBe('2026-06-01');
    });

    it('should reject missing amount', () => {
      expect(() => createDepositSchema.parse({ dueDate: '2026-06-01' })).toThrow();
    });

    it('should reject missing dueDate', () => {
      expect(() => createDepositSchema.parse({ amount: 1000 })).toThrow();
    });

    it('should reject amount <= 0', () => {
      expect(() => createDepositSchema.parse({ ...validData, amount: 0 })).toThrow();
      expect(() => createDepositSchema.parse({ ...validData, amount: -100 })).toThrow();
    });

    it('should reject amount > 999999.99', () => {
      expect(() => createDepositSchema.parse({ ...validData, amount: 1000000 })).toThrow();
    });

    it('should reject invalid dueDate format', () => {
      expect(() => createDepositSchema.parse({ ...validData, dueDate: 'not-a-date' })).toThrow();
    });

    it('should accept optional title', () => {
      const result = createDepositSchema.parse({ ...validData, title: 'Zaliczka 1' });
      expect(result.title).toBe('Zaliczka 1');
    });

    it('should accept optional description and internalNotes', () => {
      const result = createDepositSchema.parse({
        ...validData,
        description: 'Opis',
        internalNotes: 'Notatka',
      });
      expect(result.description).toBe('Opis');
      expect(result.internalNotes).toBe('Notatka');
    });
  });

  // ─── updateDepositSchema (catering-order) ──────────────────────

  describe('updateDepositSchema', () => {
    it('should accept partial update', () => {
      const result = updateDepositSchema.parse({ amount: 2000 });
      expect(result.amount).toBe(2000);
    });

    it('should accept empty update', () => {
      const result = updateDepositSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should reject amount <= 0', () => {
      expect(() => updateDepositSchema.parse({ amount: 0 })).toThrow();
    });

    it('should reject invalid dueDate', () => {
      expect(() => updateDepositSchema.parse({ dueDate: 'bad' })).toThrow();
    });

    it('should accept nullable fields', () => {
      const result = updateDepositSchema.parse({ title: null, description: null, internalNotes: null });
      expect(result.title).toBeNull();
    });
  });

  // ─── markDepositPaidSchema ─────────────────────────────────────

  describe('markDepositPaidSchema', () => {
    it('should accept valid paymentMethods', () => {
      ['CASH', 'TRANSFER', 'BLIK', 'CARD'].forEach((pm) => {
        const result = markDepositPaidSchema.parse({ paymentMethod: pm });
        expect(result.paymentMethod).toBe(pm);
      });
    });

    it('should reject invalid paymentMethod', () => {
      expect(() => markDepositPaidSchema.parse({ paymentMethod: 'BITCOIN' })).toThrow();
    });

    it('should accept without paymentMethod (optional)', () => {
      const result = markDepositPaidSchema.parse({});
      expect(result).toBeDefined();
    });
  });
});
