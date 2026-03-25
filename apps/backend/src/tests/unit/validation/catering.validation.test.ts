/**
 * catering.validation — Unit Tests
 */

import {
  createCateringTemplateSchema,
  updateCateringTemplateSchema,
  createCateringPackageSchema,
  updateCateringPackageSchema,
  createCateringSectionSchema,
  updateCateringSectionSchema,
  createCateringSectionOptionSchema,
  updateCateringSectionOptionSchema,
} from '../../../validation/catering.validation';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('catering.validation', () => {
  // ─── Templates ──────────────────────────────────────────────────

  describe('createCateringTemplateSchema', () => {
    const validData = { name: 'Wesele Premium', slug: 'wesele-premium' };

    it('should accept valid template with defaults', () => {
      const result = createCateringTemplateSchema.parse(validData);
      expect(result.name).toBe('Wesele Premium');
      expect(result.isActive).toBe(true);
      expect(result.displayOrder).toBe(0);
    });

    it('should reject missing name', () => {
      expect(() => createCateringTemplateSchema.parse({ slug: 'test' })).toThrow();
    });

    it('should reject missing slug', () => {
      expect(() => createCateringTemplateSchema.parse({ name: 'Test' })).toThrow();
    });

    it('should reject name > 255 chars', () => {
      expect(() => createCateringTemplateSchema.parse({ ...validData, name: 'A'.repeat(256) })).toThrow();
    });

    it('should reject empty name', () => {
      expect(() => createCateringTemplateSchema.parse({ ...validData, name: '' })).toThrow();
    });

    it('should reject slug > 100 chars', () => {
      expect(() => createCateringTemplateSchema.parse({ ...validData, slug: 'a'.repeat(101) })).toThrow();
    });

    it('should reject slug with uppercase letters', () => {
      expect(() => createCateringTemplateSchema.parse({ ...validData, slug: 'Test-Slug' })).toThrow();
    });

    it('should reject slug with spaces', () => {
      expect(() => createCateringTemplateSchema.parse({ ...validData, slug: 'test slug' })).toThrow();
    });

    it('should accept valid slug with hyphens', () => {
      const result = createCateringTemplateSchema.parse({ ...validData, slug: 'my-test-slug' });
      expect(result.slug).toBe('my-test-slug');
    });

    it('should accept optional description', () => {
      const result = createCateringTemplateSchema.parse({ ...validData, description: 'Opis szablonu' });
      expect(result.description).toBe('Opis szablonu');
    });

    it('should reject description > 2000 chars', () => {
      expect(() => createCateringTemplateSchema.parse({ ...validData, description: 'X'.repeat(2001) })).toThrow();
    });

    it('should accept optional imageUrl', () => {
      const result = createCateringTemplateSchema.parse({ ...validData, imageUrl: 'https://example.com/img.jpg' });
      expect(result.imageUrl).toBe('https://example.com/img.jpg');
    });

    it('should reject invalid imageUrl', () => {
      expect(() => createCateringTemplateSchema.parse({ ...validData, imageUrl: 'not-a-url' })).toThrow();
    });

    it('should accept isActive = false', () => {
      const result = createCateringTemplateSchema.parse({ ...validData, isActive: false });
      expect(result.isActive).toBe(false);
    });
  });

  describe('updateCateringTemplateSchema', () => {
    it('should accept partial update', () => {
      const result = updateCateringTemplateSchema.parse({ name: 'Nowa nazwa' });
      expect(result.name).toBe('Nowa nazwa');
    });

    it('should accept empty update', () => {
      const result = updateCateringTemplateSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should accept nullable description', () => {
      const result = updateCateringTemplateSchema.parse({ description: null });
      expect(result.description).toBeNull();
    });

    it('should accept nullable imageUrl', () => {
      const result = updateCateringTemplateSchema.parse({ imageUrl: null });
      expect(result.imageUrl).toBeNull();
    });

    it('should reject invalid slug', () => {
      expect(() => updateCateringTemplateSchema.parse({ slug: 'BAD SLUG' })).toThrow();
    });
  });

  // ─── Packages ──────────────────────────────────────────────────

  describe('createCateringPackageSchema', () => {
    const validData = { name: 'Pakiet Standard', basePrice: 150 };

    it('should accept valid package with defaults', () => {
      const result = createCateringPackageSchema.parse(validData);
      expect(result.name).toBe('Pakiet Standard');
      expect(result.priceType).toBe('PER_PERSON');
      expect(result.isPopular).toBe(false);
      expect(result.isActive).toBe(true);
      expect(result.displayOrder).toBe(0);
    });

    it('should reject missing name', () => {
      expect(() => createCateringPackageSchema.parse({ basePrice: 150 })).toThrow();
    });

    it('should reject missing basePrice', () => {
      expect(() => createCateringPackageSchema.parse({ name: 'Test' })).toThrow();
    });

    it('should reject negative basePrice', () => {
      expect(() => createCateringPackageSchema.parse({ ...validData, basePrice: -10 })).toThrow();
    });

    it('should reject basePrice > 999999.99', () => {
      expect(() => createCateringPackageSchema.parse({ ...validData, basePrice: 1000000 })).toThrow();
    });

    it('should accept all valid priceTypes', () => {
      ['PER_PERSON', 'FLAT', 'TIERED'].forEach((pt) => {
        const data = pt === 'TIERED'
          ? { ...validData, priceType: pt, tieredPricing: { '10': 100 } }
          : { ...validData, priceType: pt };
        const result = createCateringPackageSchema.parse(data);
        expect(result.priceType).toBe(pt);
      });
    });

    it('should reject invalid priceType', () => {
      expect(() => createCateringPackageSchema.parse({ ...validData, priceType: 'HOURLY' })).toThrow();
    });

    it('should reject TIERED without tieredPricing', () => {
      expect(() => createCateringPackageSchema.parse({ ...validData, priceType: 'TIERED' })).toThrow();
    });

    it('should accept TIERED with tieredPricing', () => {
      const result = createCateringPackageSchema.parse({
        ...validData,
        priceType: 'TIERED',
        tieredPricing: { '10': 100, '20': 90 },
      });
      expect(result.priceType).toBe('TIERED');
    });

    it('should reject minGuests > maxGuests', () => {
      expect(() => createCateringPackageSchema.parse({ ...validData, minGuests: 100, maxGuests: 10 })).toThrow();
    });

    it('should accept minGuests <= maxGuests', () => {
      const result = createCateringPackageSchema.parse({ ...validData, minGuests: 10, maxGuests: 100 });
      expect(result.minGuests).toBe(10);
      expect(result.maxGuests).toBe(100);
    });

    it('should accept optional badgeText', () => {
      const result = createCateringPackageSchema.parse({ ...validData, badgeText: 'Bestseller' });
      expect(result.badgeText).toBe('Bestseller');
    });

    it('should reject badgeText > 50 chars', () => {
      expect(() => createCateringPackageSchema.parse({ ...validData, badgeText: 'X'.repeat(51) })).toThrow();
    });

    it('should reject description > 5000 chars', () => {
      expect(() => createCateringPackageSchema.parse({ ...validData, description: 'X'.repeat(5001) })).toThrow();
    });
  });

  describe('updateCateringPackageSchema', () => {
    it('should accept partial update', () => {
      const result = updateCateringPackageSchema.parse({ name: 'Pakiet Premium' });
      expect(result.name).toBe('Pakiet Premium');
    });

    it('should accept empty update', () => {
      const result = updateCateringPackageSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should accept nullable fields', () => {
      const result = updateCateringPackageSchema.parse({
        description: null,
        shortDescription: null,
        badgeText: null,
        tieredPricing: null,
      });
      expect(result.description).toBeNull();
      expect(result.shortDescription).toBeNull();
    });

    it('should reject invalid basePrice', () => {
      expect(() => updateCateringPackageSchema.parse({ basePrice: -1 })).toThrow();
    });
  });

  // ─── Sections ──────────────────────────────────────────────────

  describe('createCateringSectionSchema', () => {
    const validData = { categoryId: validUUID };

    it('should accept valid section with defaults', () => {
      const result = createCateringSectionSchema.parse(validData);
      expect(result.minSelect).toBe(1);
      expect(result.isRequired).toBe(true);
      expect(result.displayOrder).toBe(0);
    });

    it('should reject missing categoryId', () => {
      expect(() => createCateringSectionSchema.parse({})).toThrow();
    });

    it('should reject invalid categoryId', () => {
      expect(() => createCateringSectionSchema.parse({ categoryId: 'bad' })).toThrow();
    });

    it('should accept quarter-step minSelect values', () => {
      [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].forEach((val) => {
        const result = createCateringSectionSchema.parse({ ...validData, minSelect: val });
        expect(result.minSelect).toBe(val);
      });
    });

    it('should reject minSelect not a multiple of 0.25', () => {
      expect(() => createCateringSectionSchema.parse({ ...validData, minSelect: 0.3 })).toThrow();
    });

    it('should reject minSelect > 2', () => {
      expect(() => createCateringSectionSchema.parse({ ...validData, minSelect: 2.25 })).toThrow();
    });

    it('should reject minSelect < 0.25', () => {
      expect(() => createCateringSectionSchema.parse({ ...validData, minSelect: 0 })).toThrow();
    });

    it('should reject minSelect > maxSelect', () => {
      expect(() => createCateringSectionSchema.parse({ ...validData, minSelect: 2, maxSelect: 0.5 })).toThrow();
    });

    it('should accept maxSelect = null (no limit)', () => {
      const result = createCateringSectionSchema.parse({ ...validData, maxSelect: null });
      expect(result.maxSelect).toBeNull();
    });

    it('should accept optional name', () => {
      const result = createCateringSectionSchema.parse({ ...validData, name: 'Przystawki' });
      expect(result.name).toBe('Przystawki');
    });

    it('should reject name > 255 chars', () => {
      expect(() => createCateringSectionSchema.parse({ ...validData, name: 'A'.repeat(256) })).toThrow();
    });

    it('should reject description > 2000 chars', () => {
      expect(() => createCateringSectionSchema.parse({ ...validData, description: 'X'.repeat(2001) })).toThrow();
    });
  });

  describe('updateCateringSectionSchema', () => {
    it('should accept partial update', () => {
      const result = updateCateringSectionSchema.parse({ isRequired: false });
      expect(result.isRequired).toBe(false);
    });

    it('should accept empty update', () => {
      const result = updateCateringSectionSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should accept nullable name', () => {
      const result = updateCateringSectionSchema.parse({ name: null });
      expect(result.name).toBeNull();
    });

    it('should accept nullable maxSelect (clear limit)', () => {
      const result = updateCateringSectionSchema.parse({ maxSelect: null });
      expect(result.maxSelect).toBeNull();
    });

    it('should reject invalid minSelect', () => {
      expect(() => updateCateringSectionSchema.parse({ minSelect: 0.1 })).toThrow();
    });
  });

  // ─── Section Options ───────────────────────────────────────────

  describe('createCateringSectionOptionSchema', () => {
    const validData = { dishId: validUUID };

    it('should accept valid option with defaults', () => {
      const result = createCateringSectionOptionSchema.parse(validData);
      expect(result.isDefault).toBe(false);
      expect(result.displayOrder).toBe(0);
    });

    it('should reject missing dishId', () => {
      expect(() => createCateringSectionOptionSchema.parse({})).toThrow();
    });

    it('should reject invalid dishId', () => {
      expect(() => createCateringSectionOptionSchema.parse({ dishId: 'bad' })).toThrow();
    });

    it('should accept optional customPrice', () => {
      const result = createCateringSectionOptionSchema.parse({ ...validData, customPrice: 25.50 });
      expect(result.customPrice).toBe(25.50);
    });

    it('should accept customPrice = null', () => {
      const result = createCateringSectionOptionSchema.parse({ ...validData, customPrice: null });
      expect(result.customPrice).toBeNull();
    });

    it('should reject negative customPrice', () => {
      expect(() => createCateringSectionOptionSchema.parse({ ...validData, customPrice: -1 })).toThrow();
    });

    it('should reject customPrice > 999999.99', () => {
      expect(() => createCateringSectionOptionSchema.parse({ ...validData, customPrice: 1000000 })).toThrow();
    });

    it('should accept isDefault = true', () => {
      const result = createCateringSectionOptionSchema.parse({ ...validData, isDefault: true });
      expect(result.isDefault).toBe(true);
    });
  });

  describe('updateCateringSectionOptionSchema', () => {
    it('should accept partial update', () => {
      const result = updateCateringSectionOptionSchema.parse({ isDefault: true });
      expect(result.isDefault).toBe(true);
    });

    it('should accept empty update', () => {
      const result = updateCateringSectionOptionSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should accept nullable customPrice', () => {
      const result = updateCateringSectionOptionSchema.parse({ customPrice: null });
      expect(result.customPrice).toBeNull();
    });

    it('should reject negative customPrice', () => {
      expect(() => updateCateringSectionOptionSchema.parse({ customPrice: -5 })).toThrow();
    });
  });
});
