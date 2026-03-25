/**
 * serviceExtra.validation — Unit Tests
 */

import {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  reorderCategoriesSchema,
  createServiceItemSchema,
  updateServiceItemSchema,
  assignExtraSchema,
  bulkAssignExtrasSchema,
  updateReservationExtraSchema,
} from '../../../validation/serviceExtra.validation';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('serviceExtra.validation', () => {
  // ─── Categories ────────────────────────────────────────────────

  describe('createServiceCategorySchema', () => {
    const validData = { name: 'Dekoracje', slug: 'dekoracje' };

    it('should accept valid category with defaults', () => {
      const result = createServiceCategorySchema.parse(validData);
      expect(result.name).toBe('Dekoracje');
      expect(result.slug).toBe('dekoracje');
      // isActive, isExclusive, displayOrder have .default().optional() — when not sent, result is undefined
      expect(result.isActive).toBeUndefined();
      expect(result.isExclusive).toBeUndefined();
      expect(result.displayOrder).toBeUndefined();
    });

    it('should reject missing name', () => {
      expect(() => createServiceCategorySchema.parse({ slug: 'test' })).toThrow();
    });

    it('should reject missing slug', () => {
      expect(() => createServiceCategorySchema.parse({ name: 'Test' })).toThrow();
    });

    it('should reject empty name', () => {
      expect(() => createServiceCategorySchema.parse({ ...validData, name: '' })).toThrow();
    });

    it('should reject name > 255 chars', () => {
      expect(() => createServiceCategorySchema.parse({ ...validData, name: 'A'.repeat(256) })).toThrow();
    });

    it('should reject slug > 100 chars', () => {
      expect(() => createServiceCategorySchema.parse({ ...validData, slug: 'a'.repeat(101) })).toThrow();
    });

    it('should reject slug with uppercase', () => {
      expect(() => createServiceCategorySchema.parse({ ...validData, slug: 'Test' })).toThrow();
    });

    it('should reject slug with spaces', () => {
      expect(() => createServiceCategorySchema.parse({ ...validData, slug: 'test slug' })).toThrow();
    });

    it('should accept slug with hyphens', () => {
      const result = createServiceCategorySchema.parse({ ...validData, slug: 'my-category' });
      expect(result.slug).toBe('my-category');
    });

    it('should accept optional description', () => {
      const result = createServiceCategorySchema.parse({ ...validData, description: 'Opis kategorii' });
      expect(result.description).toBe('Opis kategorii');
    });

    it('should reject description > 2000 chars', () => {
      expect(() => createServiceCategorySchema.parse({ ...validData, description: 'X'.repeat(2001) })).toThrow();
    });

    it('should accept optional icon and color', () => {
      const result = createServiceCategorySchema.parse({ ...validData, icon: 'flower', color: '#FF5733' });
      expect(result.icon).toBe('flower');
      expect(result.color).toBe('#FF5733');
    });

    it('should accept nullable description/icon/color', () => {
      const result = createServiceCategorySchema.parse({ ...validData, description: null, icon: null, color: null });
      expect(result.description).toBeNull();
      expect(result.icon).toBeNull();
      expect(result.color).toBeNull();
    });

    it('should accept isExclusive = true', () => {
      const result = createServiceCategorySchema.parse({ ...validData, isExclusive: true });
      expect(result.isExclusive).toBe(true);
    });
  });

  describe('updateServiceCategorySchema', () => {
    it('should accept partial update', () => {
      const result = updateServiceCategorySchema.parse({ name: 'Nowa nazwa' });
      expect(result.name).toBe('Nowa nazwa');
    });

    it('should accept empty update', () => {
      const result = updateServiceCategorySchema.parse({});
      expect(result).toBeDefined();
    });

    it('should accept nullable fields', () => {
      const result = updateServiceCategorySchema.parse({ description: null, icon: null, color: null });
      expect(result.description).toBeNull();
    });

    it('should reject invalid slug', () => {
      expect(() => updateServiceCategorySchema.parse({ slug: 'BAD SLUG' })).toThrow();
    });
  });

  // ─── Reorder Categories ────────────────────────────────────────

  describe('reorderCategoriesSchema', () => {
    it('should accept valid ordered IDs', () => {
      const result = reorderCategoriesSchema.parse({ orderedIds: [validUUID] });
      expect(result.orderedIds).toHaveLength(1);
    });

    it('should reject empty array', () => {
      expect(() => reorderCategoriesSchema.parse({ orderedIds: [] })).toThrow();
    });

    it('should reject invalid UUID in array', () => {
      expect(() => reorderCategoriesSchema.parse({ orderedIds: ['bad'] })).toThrow();
    });

    it('should reject missing orderedIds', () => {
      expect(() => reorderCategoriesSchema.parse({})).toThrow();
    });
  });

  // ─── Items ─────────────────────────────────────────────────────

  describe('createServiceItemSchema', () => {
    const validData = { categoryId: validUUID, name: 'Bukiet kwiatów', priceType: 'FLAT' as const };

    it('should accept valid item with defaults', () => {
      const result = createServiceItemSchema.parse(validData);
      expect(result.name).toBe('Bukiet kwiatów');
      expect(result.priceType).toBe('FLAT');
      // basePrice, isActive, requiresNote, displayOrder have .default().optional() — when not sent, result is undefined
      expect(result.basePrice).toBeUndefined();
      expect(result.isActive).toBeUndefined();
      expect(result.requiresNote).toBeUndefined();
      expect(result.displayOrder).toBeUndefined();
    });

    it('should reject missing categoryId', () => {
      expect(() => createServiceItemSchema.parse({ name: 'Test', priceType: 'FLAT' })).toThrow();
    });

    it('should reject invalid categoryId', () => {
      expect(() => createServiceItemSchema.parse({ ...validData, categoryId: 'bad' })).toThrow();
    });

    it('should reject missing name', () => {
      expect(() => createServiceItemSchema.parse({ categoryId: validUUID, priceType: 'FLAT' })).toThrow();
    });

    it('should reject empty name', () => {
      expect(() => createServiceItemSchema.parse({ ...validData, name: '' })).toThrow();
    });

    it('should reject name > 255 chars', () => {
      expect(() => createServiceItemSchema.parse({ ...validData, name: 'A'.repeat(256) })).toThrow();
    });

    it('should reject missing priceType', () => {
      expect(() => createServiceItemSchema.parse({ categoryId: validUUID, name: 'Test' })).toThrow();
    });

    it('should accept all valid priceTypes', () => {
      ['FLAT', 'PER_PERSON', 'PER_UNIT', 'FREE'].forEach((pt) => {
        const result = createServiceItemSchema.parse({ ...validData, priceType: pt });
        expect(result.priceType).toBe(pt);
      });
    });

    it('should reject invalid priceType', () => {
      expect(() => createServiceItemSchema.parse({ ...validData, priceType: 'HOURLY' })).toThrow();
    });

    it('should reject negative basePrice', () => {
      expect(() => createServiceItemSchema.parse({ ...validData, basePrice: -1 })).toThrow();
    });

    it('should reject basePrice > 999999.99', () => {
      expect(() => createServiceItemSchema.parse({ ...validData, basePrice: 1000000 })).toThrow();
    });

    it('should accept optional description', () => {
      const result = createServiceItemSchema.parse({ ...validData, description: 'Opis usługi' });
      expect(result.description).toBe('Opis usługi');
    });

    it('should reject description > 2000 chars', () => {
      expect(() => createServiceItemSchema.parse({ ...validData, description: 'X'.repeat(2001) })).toThrow();
    });

    it('should accept requiresNote = true with noteLabel', () => {
      const result = createServiceItemSchema.parse({ ...validData, requiresNote: true, noteLabel: 'Podaj kolor' });
      expect(result.requiresNote).toBe(true);
      expect(result.noteLabel).toBe('Podaj kolor');
    });

    it('should reject noteLabel > 255 chars', () => {
      expect(() => createServiceItemSchema.parse({ ...validData, noteLabel: 'X'.repeat(256) })).toThrow();
    });
  });

  describe('updateServiceItemSchema', () => {
    it('should accept partial update', () => {
      const result = updateServiceItemSchema.parse({ name: 'Nowa usługa' });
      expect(result.name).toBe('Nowa usługa');
    });

    it('should accept empty update', () => {
      const result = updateServiceItemSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should accept nullable fields', () => {
      const result = updateServiceItemSchema.parse({ description: null, icon: null, noteLabel: null });
      expect(result.description).toBeNull();
    });

    it('should reject invalid priceType', () => {
      expect(() => updateServiceItemSchema.parse({ priceType: 'INVALID' })).toThrow();
    });

    it('should reject negative basePrice', () => {
      expect(() => updateServiceItemSchema.parse({ basePrice: -5 })).toThrow();
    });
  });

  // ─── Reservation Extras ────────────────────────────────────────

  describe('assignExtraSchema', () => {
    const validData = { serviceItemId: validUUID };

    it('should accept valid assignment', () => {
      const result = assignExtraSchema.parse(validData);
      expect(result.serviceItemId).toBe(validUUID);
    });

    it('should reject missing serviceItemId', () => {
      expect(() => assignExtraSchema.parse({})).toThrow();
    });

    it('should reject invalid serviceItemId', () => {
      expect(() => assignExtraSchema.parse({ serviceItemId: 'bad' })).toThrow();
    });

    it('should accept optional quantity', () => {
      const result = assignExtraSchema.parse({ ...validData, quantity: 5 });
      expect(result.quantity).toBe(5);
    });

    it('should reject quantity < 1', () => {
      expect(() => assignExtraSchema.parse({ ...validData, quantity: 0 })).toThrow();
    });

    it('should accept optional note', () => {
      const result = assignExtraSchema.parse({ ...validData, note: 'Kolor biały' });
      expect(result.note).toBe('Kolor biały');
    });

    it('should reject note > 1000 chars', () => {
      expect(() => assignExtraSchema.parse({ ...validData, note: 'X'.repeat(1001) })).toThrow();
    });

    it('should accept optional customPrice', () => {
      const result = assignExtraSchema.parse({ ...validData, customPrice: 99.99 });
      expect(result.customPrice).toBe(99.99);
    });

    it('should accept customPrice = null', () => {
      const result = assignExtraSchema.parse({ ...validData, customPrice: null });
      expect(result.customPrice).toBeNull();
    });

    it('should reject negative customPrice', () => {
      expect(() => assignExtraSchema.parse({ ...validData, customPrice: -1 })).toThrow();
    });
  });

  describe('bulkAssignExtrasSchema', () => {
    it('should accept valid bulk assignment', () => {
      const result = bulkAssignExtrasSchema.parse({
        extras: [{ serviceItemId: validUUID, quantity: 2 }],
      });
      expect(result.extras).toHaveLength(1);
    });

    it('should accept empty extras array', () => {
      const result = bulkAssignExtrasSchema.parse({ extras: [] });
      expect(result.extras).toHaveLength(0);
    });

    it('should reject missing extras', () => {
      expect(() => bulkAssignExtrasSchema.parse({})).toThrow();
    });

    it('should reject invalid serviceItemId in extras', () => {
      expect(() => bulkAssignExtrasSchema.parse({
        extras: [{ serviceItemId: 'bad' }],
      })).toThrow();
    });
  });

  describe('updateReservationExtraSchema', () => {
    it('should accept partial update', () => {
      const result = updateReservationExtraSchema.parse({ quantity: 3 });
      expect(result.quantity).toBe(3);
    });

    it('should accept empty update', () => {
      const result = updateReservationExtraSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should reject quantity < 1', () => {
      expect(() => updateReservationExtraSchema.parse({ quantity: 0 })).toThrow();
    });

    it('should accept all valid statuses', () => {
      ['PENDING', 'CONFIRMED', 'CANCELLED'].forEach((s) => {
        const result = updateReservationExtraSchema.parse({ status: s });
        expect(result.status).toBe(s);
      });
    });

    it('should reject invalid status', () => {
      expect(() => updateReservationExtraSchema.parse({ status: 'UNKNOWN' })).toThrow();
    });

    it('should accept nullable fields', () => {
      const result = updateReservationExtraSchema.parse({ note: null, customPrice: null });
      expect(result.note).toBeNull();
      expect(result.customPrice).toBeNull();
    });

    it('should reject negative customPrice', () => {
      expect(() => updateReservationExtraSchema.parse({ customPrice: -10 })).toThrow();
    });

    it('should reject note > 1000 chars', () => {
      expect(() => updateReservationExtraSchema.parse({ note: 'X'.repeat(1001) })).toThrow();
    });
  });
});
