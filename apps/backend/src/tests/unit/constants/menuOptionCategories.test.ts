import {
  MENU_OPTION_CATEGORIES,
  VALID_MENU_OPTION_CATEGORIES,
  CATEGORY_TRANSLATIONS,
  LEGACY_CATEGORY_FORMATS,
  isValidMenuOptionCategory,
  getCategoryTranslation,
  normalizeCategoryFormat,
  getAllCategoriesWithTranslations,
} from '../../../constants/menuOptionCategories';

describe('menuOptionCategories', () => {
  describe('MENU_OPTION_CATEGORIES', () => {
    it('should be defined with all 12 categories', () => {
      expect(MENU_OPTION_CATEGORIES).toBeDefined();
      expect(Object.keys(MENU_OPTION_CATEGORIES)).toHaveLength(12);
    });

    it('should contain standard categories', () => {
      expect(MENU_OPTION_CATEGORIES.ALCOHOL).toBe('Alcohol');
      expect(MENU_OPTION_CATEGORIES.MUSIC).toBe('Music');
      expect(MENU_OPTION_CATEGORIES.FOOD).toBe('Food');
      expect(MENU_OPTION_CATEGORIES.OTHER).toBe('Other');
    });
  });

  describe('VALID_MENU_OPTION_CATEGORIES', () => {
    it('should be array of all category values', () => {
      expect(Array.isArray(VALID_MENU_OPTION_CATEGORIES)).toBe(true);
      expect(VALID_MENU_OPTION_CATEGORIES).toHaveLength(12);
      expect(VALID_MENU_OPTION_CATEGORIES).toContain('Alcohol');
      expect(VALID_MENU_OPTION_CATEGORIES).toContain('Other');
    });
  });

  describe('CATEGORY_TRANSLATIONS', () => {
    it('should map English to Polish', () => {
      expect(CATEGORY_TRANSLATIONS['Alcohol']).toBe('Alkohol');
      expect(CATEGORY_TRANSLATIONS['Music']).toBe('Muzyka');
      expect(CATEGORY_TRANSLATIONS['Food']).toBe('Jedzenie');
    });

    it('should have translation for every category', () => {
      VALID_MENU_OPTION_CATEGORIES.forEach((cat) => {
        expect(CATEGORY_TRANSLATIONS[cat as keyof typeof CATEGORY_TRANSLATIONS]).toBeDefined();
      });
    });
  });

  describe('isValidMenuOptionCategory', () => {
    it('should return true for valid category', () => {
      expect(isValidMenuOptionCategory('Alcohol')).toBe(true);
      expect(isValidMenuOptionCategory('Music')).toBe(true);
    });

    it('should return false for invalid category', () => {
      expect(isValidMenuOptionCategory('INVALID')).toBe(false);
      expect(isValidMenuOptionCategory('')).toBe(false);
    });

    it('should return false for legacy UPPERCASE format', () => {
      expect(isValidMenuOptionCategory('ALCOHOL')).toBe(false);
    });
  });

  describe('getCategoryTranslation', () => {
    it('should return Polish for known category', () => {
      expect(getCategoryTranslation('Alcohol')).toBe('Alkohol');
      expect(getCategoryTranslation('Decorations')).toBe('Dekoracje');
    });

    it('should return original for unknown category', () => {
      expect(getCategoryTranslation('UnknownCat')).toBe('UnknownCat');
    });
  });

  describe('normalizeCategoryFormat', () => {
    it('should return as-is for standard format', () => {
      expect(normalizeCategoryFormat('Alcohol')).toBe('Alcohol');
      expect(normalizeCategoryFormat('Music')).toBe('Music');
    });

    it('should convert legacy UPPERCASE', () => {
      expect(normalizeCategoryFormat('ALCOHOL')).toBe('Alcohol');
      expect(normalizeCategoryFormat('DRINK')).toBe('Drinks');
      expect(normalizeCategoryFormat('DESSERT')).toBe('Food');
    });

    it('should convert Polish formats', () => {
      expect(normalizeCategoryFormat('Alkohol')).toBe('Alcohol');
      expect(normalizeCategoryFormat('Muzyka')).toBe('Music');
      expect(normalizeCategoryFormat('Dekoracje')).toBe('Decorations');
    });

    it('should return original for unrecognized format', () => {
      expect(normalizeCategoryFormat('CompletelyUnknown')).toBe('CompletelyUnknown');
    });
  });

  describe('getAllCategoriesWithTranslations', () => {
    it('should return array of english/polish pairs', () => {
      const result = getAllCategoriesWithTranslations();
      expect(result).toHaveLength(12);
      expect(result[0]).toHaveProperty('english');
      expect(result[0]).toHaveProperty('polish');
    });

    it('should contain Alcohol → Alkohol mapping', () => {
      const result = getAllCategoriesWithTranslations();
      const alcohol = result.find((r) => r.english === 'Alcohol');
      expect(alcohol).toBeDefined();
      expect(alcohol!.polish).toBe('Alkohol');
    });
  });

  describe('LEGACY_CATEGORY_FORMATS', () => {
    it('should map DRINK to Drinks', () => {
      expect(LEGACY_CATEGORY_FORMATS['DRINK']).toBe('Drinks');
    });

    it('should map EXTRA_DISH to Food', () => {
      expect(LEGACY_CATEGORY_FORMATS['EXTRA_DISH']).toBe('Food');
    });

    it('should map Polish Dodatkowe to Additions', () => {
      expect(LEGACY_CATEGORY_FORMATS['Dodatkowe']).toBe('Additions');
    });
  });
});
