import {
  createMenuCourseSchema,
  updateMenuCourseSchema,
  assignDishToCourseSchema,
  assignDishesToCourseSchema,
  reorderDishesSchema,
} from '../../../validation/menuCourse.validation';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('menuCourse.validation', () => {
  describe('createMenuCourseSchema', () => {
    const validData = { packageId: validUUID, name: 'Danie g\u0142\u00f3wne' };

    it('should accept valid data with defaults', () => {
      const result = createMenuCourseSchema.parse(validData);
      expect(result.name).toBe('Danie g\u0142\u00f3wne');
      expect(result.minSelect).toBe(1);
      expect(result.maxSelect).toBe(1);
      expect(result.isRequired).toBe(true);
      expect(result.displayOrder).toBe(0);
    });

    it('should reject name < 2 chars', () => {
      expect(() => createMenuCourseSchema.parse({ ...validData, name: 'A' })).toThrow();
    });

    it('should reject name > 255 chars', () => {
      expect(() => createMenuCourseSchema.parse({ ...validData, name: 'A'.repeat(256) })).toThrow();
    });

    it('should reject invalid packageId', () => {
      expect(() => createMenuCourseSchema.parse({ ...validData, packageId: 'bad' })).toThrow();
    });

    it('should reject negative minSelect', () => {
      expect(() => createMenuCourseSchema.parse({ ...validData, minSelect: -1 })).toThrow();
    });

    it('should reject maxSelect < 1', () => {
      expect(() => createMenuCourseSchema.parse({ ...validData, maxSelect: 0 })).toThrow();
    });

    it('should reject maxSelect < minSelect (refine)', () => {
      expect(() => createMenuCourseSchema.parse({ ...validData, minSelect: 5, maxSelect: 2 })).toThrow(/greater than or equal/i);
    });

    it('should accept maxSelect = minSelect', () => {
      const result = createMenuCourseSchema.parse({ ...validData, minSelect: 3, maxSelect: 3 });
      expect(result.minSelect).toBe(3);
    });

    it('should accept optional description', () => {
      const result = createMenuCourseSchema.parse({ ...validData, description: 'Wybierz danie' });
      expect(result.description).toBe('Wybierz danie');
    });

    it('should reject description > 1000 chars', () => {
      expect(() => createMenuCourseSchema.parse({ ...validData, description: 'X'.repeat(1001) })).toThrow();
    });

    it('should reject icon > 50 chars', () => {
      expect(() => createMenuCourseSchema.parse({ ...validData, icon: 'X'.repeat(51) })).toThrow();
    });
  });

  describe('updateMenuCourseSchema', () => {
    it('should accept partial update', () => {
      const result = updateMenuCourseSchema.parse({ name: 'Zupa' });
      expect(result.name).toBe('Zupa');
    });

    it('should accept empty update', () => {
      const result = updateMenuCourseSchema.parse({});
      expect(result).toBeDefined();
    });

    it('should reject maxSelect < minSelect when both provided', () => {
      expect(() => updateMenuCourseSchema.parse({ minSelect: 5, maxSelect: 2 })).toThrow();
    });

    it('should accept when only one of min/max is provided', () => {
      const result = updateMenuCourseSchema.parse({ minSelect: 5 });
      expect(result.minSelect).toBe(5);
    });

    it('should accept nullable icon', () => {
      const result = updateMenuCourseSchema.parse({ icon: null });
      expect(result.icon).toBeNull();
    });
  });

  describe('assignDishToCourseSchema', () => {
    it('should accept valid dish assignment', () => {
      const result = assignDishToCourseSchema.parse({ dishId: validUUID });
      expect(result.isDefault).toBe(false);
      expect(result.isRecommended).toBe(false);
    });

    it('should reject invalid dishId', () => {
      expect(() => assignDishToCourseSchema.parse({ dishId: 'bad' })).toThrow();
    });

    it('should accept optional customPrice', () => {
      const result = assignDishToCourseSchema.parse({ dishId: validUUID, customPrice: 25 });
      expect(result.customPrice).toBe(25);
    });
  });

  describe('assignDishesToCourseSchema', () => {
    it('should accept array of dishes', () => {
      const result = assignDishesToCourseSchema.parse({ dishes: [{ dishId: validUUID }, { dishId: validUUID }] });
      expect(result.dishes).toHaveLength(2);
    });

    it('should reject empty array', () => {
      expect(() => assignDishesToCourseSchema.parse({ dishes: [] })).toThrow();
    });

    it('should reject > 50 dishes', () => {
      const dishes = Array.from({ length: 51 }, () => ({ dishId: validUUID }));
      expect(() => assignDishesToCourseSchema.parse({ dishes })).toThrow();
    });
  });

  describe('reorderDishesSchema', () => {
    it('should accept valid reorder', () => {
      const result = reorderDishesSchema.parse({ orders: [{ dishId: validUUID, displayOrder: 0 }] });
      expect(result.orders).toHaveLength(1);
    });

    it('should reject empty orders', () => {
      expect(() => reorderDishesSchema.parse({ orders: [] })).toThrow();
    });

    it('should reject negative displayOrder', () => {
      expect(() => reorderDishesSchema.parse({ orders: [{ dishId: validUUID, displayOrder: -1 }] })).toThrow();
    });
  });
});
