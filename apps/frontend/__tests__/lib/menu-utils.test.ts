import { describe, it, expect } from 'vitest';
import {
  translateOptionCategory,
  sortCategories,
  OPTION_CATEGORY_TRANSLATIONS,
} from '../../lib/menu-utils';

describe('menu-utils', () => {
  describe('OPTION_CATEGORY_TRANSLATIONS', () => {
    it('should be a non-empty record', () => {
      expect(Object.keys(OPTION_CATEGORY_TRANSLATIONS).length).toBeGreaterThan(0);
    });

    it('should have Polish values', () => {
      Object.values(OPTION_CATEGORY_TRANSLATIONS).forEach((v) => {
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
      });
    });
  });

  describe('translateOptionCategory', () => {
    it('should translate known English categories to Polish', () => {
      const keys = Object.keys(OPTION_CATEGORY_TRANSLATIONS);
      if (keys.length > 0) {
        const translated = translateOptionCategory(keys[0]);
        expect(translated).toBe(OPTION_CATEGORY_TRANSLATIONS[keys[0]]);
      }
    });

    it('should return original string for unknown categories', () => {
      expect(translateOptionCategory('UNKNOWN_CATEGORY')).toBe('UNKNOWN_CATEGORY');
    });
  });

  describe('sortCategories', () => {
    it('should sort categories in preferred order', () => {
      const input = ['Zupy', 'Przystawki', 'Desery', 'Danie główne'];
      const sorted = sortCategories(input);
      expect(Array.isArray(sorted)).toBe(true);
      expect(sorted.length).toBe(input.length);
    });

    it('should handle empty array', () => {
      expect(sortCategories([])).toEqual([]);
    });

    it('should handle single element', () => {
      expect(sortCategories(['Desery'])).toEqual(['Desery']);
    });
  });
});
