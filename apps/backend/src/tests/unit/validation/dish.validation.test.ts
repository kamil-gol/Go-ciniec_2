/**
 * dish.validation — Unit Tests
 */

import {
  createDishSchema,
  updateDishSchema,
  dishQuerySchema,
} from '../../../validation/dish.validation';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('dish.validation', () => {
  // ─── createDishSchema ──────────────────────────────────────────

  describe('createDishSchema', () => {
    const validData = { name: 'Rosół', categoryId: validUUID };

    it('should accept valid dish with defaults', () => {
      const result = createDishSchema.parse(validData);
      expect(result.name).toBe('Rosół');
      expect(result.categoryId).toBe(validUUID);
      expect(result.allergens).toEqual([]);
      // isActive and displayOrder have .default().optional() — when not sent, result is undefined
      expect(result.isActive).toBeUndefined();
      expect(result.displayOrder).toBeUndefined();
    });

    it('should reject missing name', () => {
      expect(() => createDishSchema.parse({ categoryId: validUUID })).toThrow();
    });

    it('should reject missing categoryId', () => {
      expect(() => createDishSchema.parse({ name: 'Rosół' })).toThrow();
    });

    it('should reject name < 2 chars', () => {
      expect(() => createDishSchema.parse({ ...validData, name: 'A' })).toThrow();
    });

    it('should reject name > 255 chars', () => {
      expect(() => createDishSchema.parse({ ...validData, name: 'A'.repeat(256) })).toThrow();
    });

    it('should reject invalid categoryId', () => {
      expect(() => createDishSchema.parse({ ...validData, categoryId: 'bad' })).toThrow();
    });

    it('should accept optional description', () => {
      const result = createDishSchema.parse({ ...validData, description: 'Tradycyjny rosół' });
      expect(result.description).toBe('Tradycyjny rosół');
    });

    it('should reject description > 1000 chars', () => {
      expect(() => createDishSchema.parse({ ...validData, description: 'X'.repeat(1001) })).toThrow();
    });

    it('should accept allergens array', () => {
      const result = createDishSchema.parse({ ...validData, allergens: ['gluten', 'mleko'] });
      expect(result.allergens).toEqual(['gluten', 'mleko']);
    });

    it('should default allergens to empty array', () => {
      const result = createDishSchema.parse(validData);
      expect(result.allergens).toEqual([]);
    });

    it('should accept priceModifier within range', () => {
      const result = createDishSchema.parse({ ...validData, priceModifier: 500 });
      expect(result.priceModifier).toBe(500);
    });

    it('should reject priceModifier < -1000', () => {
      expect(() => createDishSchema.parse({ ...validData, priceModifier: -1001 })).toThrow();
    });

    it('should reject priceModifier > 10000', () => {
      expect(() => createDishSchema.parse({ ...validData, priceModifier: 10001 })).toThrow();
    });

    it('should accept valid imageUrl', () => {
      const result = createDishSchema.parse({ ...validData, imageUrl: 'https://example.com/img.jpg' });
      expect(result.imageUrl).toBe('https://example.com/img.jpg');
    });

    it('should reject invalid imageUrl', () => {
      expect(() => createDishSchema.parse({ ...validData, imageUrl: 'not-a-url' })).toThrow();
    });

    it('should accept imageUrl = null', () => {
      const result = createDishSchema.parse({ ...validData, imageUrl: null });
      expect(result.imageUrl).toBeNull();
    });

    it('should accept valid thumbnailUrl', () => {
      const result = createDishSchema.parse({ ...validData, thumbnailUrl: 'https://example.com/thumb.jpg' });
      expect(result.thumbnailUrl).toBe('https://example.com/thumb.jpg');
    });

    it('should reject invalid thumbnailUrl', () => {
      expect(() => createDishSchema.parse({ ...validData, thumbnailUrl: 'bad' })).toThrow();
    });

    it('should accept isActive = false', () => {
      const result = createDishSchema.parse({ ...validData, isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('should reject negative displayOrder', () => {
      expect(() => createDishSchema.parse({ ...validData, displayOrder: -1 })).toThrow();
    });

    it('should reject non-integer displayOrder', () => {
      expect(() => createDishSchema.parse({ ...validData, displayOrder: 1.5 })).toThrow();
    });
  });

  // ─── updateDishSchema ──────────────────────────────────────────

  describe('updateDishSchema', () => {
    it('should accept partial update', () => {
      const result = updateDishSchema.parse({ name: 'Barszcz' });
      expect(result.name).toBe('Barszcz');
    });

    it('should accept empty update', () => {
      const result = updateDishSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should reject name < 2 chars', () => {
      expect(() => updateDishSchema.parse({ name: 'A' })).toThrow();
    });

    it('should accept nullable description', () => {
      const result = updateDishSchema.parse({ description: null });
      expect(result.description).toBeNull();
    });

    it('should accept nullable imageUrl', () => {
      const result = updateDishSchema.parse({ imageUrl: null });
      expect(result.imageUrl).toBeNull();
    });

    it('should accept nullable thumbnailUrl', () => {
      const result = updateDishSchema.parse({ thumbnailUrl: null });
      expect(result.thumbnailUrl).toBeNull();
    });

    it('should reject invalid categoryId', () => {
      expect(() => updateDishSchema.parse({ categoryId: 'bad' })).toThrow();
    });

    it('should reject priceModifier out of range', () => {
      expect(() => updateDishSchema.parse({ priceModifier: -1001 })).toThrow();
      expect(() => updateDishSchema.parse({ priceModifier: 10001 })).toThrow();
    });
  });

  // ─── dishQuerySchema ───────────────────────────────────────────

  describe('dishQuerySchema', () => {
    it('should accept empty query', () => {
      const result = dishQuerySchema.parse({});
      expect(result).toBeDefined();
    });

    it('should accept valid categoryId filter', () => {
      const result = dishQuerySchema.parse({ categoryId: validUUID });
      expect(result.categoryId).toBe(validUUID);
    });

    it('should reject invalid categoryId', () => {
      expect(() => dishQuerySchema.parse({ categoryId: 'bad' })).toThrow();
    });

    it('should transform isActive string "true" to boolean true', () => {
      const result = dishQuerySchema.parse({ isActive: 'true' });
      expect(result.isActive).toBe(true);
    });

    it('should transform isActive string "false" to boolean false', () => {
      const result = dishQuerySchema.parse({ isActive: 'false' });
      expect(result.isActive).toBe(false);
    });

    it('should accept search string', () => {
      const result = dishQuerySchema.parse({ search: 'rosół' });
      expect(result.search).toBe('rosół');
    });

    it('should reject empty search string', () => {
      expect(() => dishQuerySchema.parse({ search: '' })).toThrow();
    });
  });
});
