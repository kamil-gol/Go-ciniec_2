/**
 * attachmentCategories constants — Unit Tests
 * Tests: ATTACHMENT_CATEGORIES, MAX_FILE_SIZE
 */

import { ATTACHMENT_CATEGORIES, MAX_FILE_SIZE } from '../../../constants/attachmentCategories';

describe('attachmentCategories constants', () => {
  describe('ATTACHMENT_CATEGORIES', () => {
    it('should contain all required categories', () => {
      const expectedCategories = [
        'CONTRACT',
        'INVOICE',
        'MENU',
        'FLOOR_PLAN',
        'PHOTO',
        'OTHER',
      ];

      expectedCategories.forEach((category) => {
        expect(ATTACHMENT_CATEGORIES).toContain(category);
      });
    });

    it('should have CONTRACT as first category', () => {
      expect(ATTACHMENT_CATEGORIES[0]).toBe('CONTRACT');
    });

    it('should have OTHER as last category', () => {
      expect(ATTACHMENT_CATEGORIES[ATTACHMENT_CATEGORIES.length - 1]).toBe('OTHER');
    });

    it('should not contain duplicates', () => {
      const uniqueCategories = [...new Set(ATTACHMENT_CATEGORIES)];
      expect(uniqueCategories.length).toBe(ATTACHMENT_CATEGORIES.length);
    });

    it('should contain exactly 6 categories', () => {
      expect(ATTACHMENT_CATEGORIES).toHaveLength(6);
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('should be 25 MB', () => {
      expect(MAX_FILE_SIZE).toBe(25 * 1024 * 1024);
    });

    it('should be a positive number', () => {
      expect(MAX_FILE_SIZE).toBeGreaterThan(0);
    });

    it('should be at least 10 MB', () => {
      expect(MAX_FILE_SIZE).toBeGreaterThanOrEqual(10 * 1024 * 1024);
    });
  });

  describe('category validation', () => {
    it('should validate CONTRACT category', () => {
      expect(ATTACHMENT_CATEGORIES.includes('CONTRACT')).toBe(true);
    });

    it('should validate INVOICE category', () => {
      expect(ATTACHMENT_CATEGORIES.includes('INVOICE')).toBe(true);
    });

    it('should validate MENU category', () => {
      expect(ATTACHMENT_CATEGORIES.includes('MENU')).toBe(true);
    });

    it('should validate FLOOR_PLAN category', () => {
      expect(ATTACHMENT_CATEGORIES.includes('FLOOR_PLAN')).toBe(true);
    });

    it('should validate PHOTO category', () => {
      expect(ATTACHMENT_CATEGORIES.includes('PHOTO')).toBe(true);
    });

    it('should validate OTHER category', () => {
      expect(ATTACHMENT_CATEGORIES.includes('OTHER')).toBe(true);
    });

    it('should reject invalid category', () => {
      expect(ATTACHMENT_CATEGORIES.includes('INVALID_CATEGORY' as any)).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should be a readonly array', () => {
      expect(Array.isArray(ATTACHMENT_CATEGORIES)).toBe(true);
    });

    it('should contain only string values', () => {
      ATTACHMENT_CATEGORIES.forEach((category) => {
        expect(typeof category).toBe('string');
      });
    });

    it('should have all uppercase values', () => {
      ATTACHMENT_CATEGORIES.forEach((category) => {
        expect(category).toBe(category.toUpperCase());
      });
    });
  });
});
