/**
 * Menu Option Categories
 * 
 * Standard category names for MenuOption records.
 * These English names are stored in the database and automatically
 * translated to Polish in the frontend.
 * 
 * IMPORTANT: Always use these exact English names when creating/updating
 * menu options to ensure proper translation in the UI.
 * 
 * @example
 * ```typescript
 * import { MENU_OPTION_CATEGORIES } from './constants/menuOptionCategories';
 * 
 * const option = await prisma.menuOption.create({
 *   data: {
 *     name: 'DJ Professional',
 *     category: MENU_OPTION_CATEGORIES.MUSIC,
 *     priceType: 'FLAT',
 *     priceAmount: 800
 *   }
 * });
 * ```
 */

/**
 * Standard menu option category values
 * Use these constants instead of hardcoded strings
 */
export const MENU_OPTION_CATEGORIES = {
  /** Alcoholic beverages and bar services */
  ALCOHOL: 'Alcohol',
  
  /** Entertainment and animations for children */
  ANIMATIONS: 'Animations',
  
  /** Decorations, flowers, balloons */
  DECORATIONS: 'Decorations',
  
  /** Additional items and extras */
  ADDITIONS: 'Additions',
  
  /** Photography and videography services */
  PHOTO_VIDEO: 'Photo & Video',
  
  /** Music services: DJ, bands, equipment */
  MUSIC: 'Music',
  
  /** Entertainment: games, activities, attractions */
  ENTERTAINMENT: 'Entertainment',
  
  /** Food items: meals, desserts, extras */
  FOOD: 'Food',
  
  /** Non-alcoholic beverages */
  DRINKS: 'Drinks',
  
  /** Additional services: staff, security, etc. */
  SERVICES: 'Services',
  
  /** Rental equipment and technical gear */
  EQUIPMENT: 'Equipment',
  
  /** Miscellaneous options */
  OTHER: 'Other',
} as const;

/**
 * Type for menu option category values
 * Use this for type-safe category handling
 * 
 * @example
 * ```typescript
 * function filterByCategory(category: MenuOptionCategory) {
 *   return prisma.menuOption.findMany({
 *     where: { category }
 *   });
 * }
 * ```
 */
export type MenuOptionCategory = typeof MENU_OPTION_CATEGORIES[keyof typeof MENU_OPTION_CATEGORIES];

/**
 * Array of all valid category values (for validation)
 * Use this for dropdowns, validation, or iteration
 * 
 * @example
 * ```typescript
 * // Validate user input
 * if (!VALID_MENU_OPTION_CATEGORIES.includes(userInput)) {
 *   throw new Error('Invalid category');
 * }
 * ```
 */
export const VALID_MENU_OPTION_CATEGORIES = Object.values(MENU_OPTION_CATEGORIES);

/**
 * Mapping from English categories to Polish translations
 * (This mapping is also maintained in frontend for display)
 * 
 * Note: Frontend handles the actual translation for users.
 * This mapping is provided for backend logging, reports, or emails.
 */
export const CATEGORY_TRANSLATIONS = {
  'Alcohol': 'Alkohol',
  'Animations': 'Animacje',
  'Decorations': 'Dekoracje',
  'Additions': 'Dodatki',
  'Photo & Video': 'Foto & Video',
  'Music': 'Muzyka',
  'Entertainment': 'Rozrywka',
  'Food': 'Jedzenie',
  'Drinks': 'Napoje',
  'Services': 'Usługi',
  'Equipment': 'Sprzęt',
  'Other': 'Inne',
} as const;

/**
 * Legacy category formats that should be migrated
 * These formats are supported by the migration script
 */
export const LEGACY_CATEGORY_FORMATS = {
  // UPPERCASE formats (old system)
  'ALCOHOL': MENU_OPTION_CATEGORIES.ALCOHOL,
  'DRINK': MENU_OPTION_CATEGORIES.DRINKS,
  'DRINKS': MENU_OPTION_CATEGORIES.DRINKS,
  'DESSERT': MENU_OPTION_CATEGORIES.FOOD,
  'EXTRA_DISH': MENU_OPTION_CATEGORIES.FOOD,
  'FOOD': MENU_OPTION_CATEGORIES.FOOD,
  'SERVICE': MENU_OPTION_CATEGORIES.SERVICES,
  'SERVICES': MENU_OPTION_CATEGORIES.SERVICES,
  'DECORATION': MENU_OPTION_CATEGORIES.DECORATIONS,
  'DECORATIONS': MENU_OPTION_CATEGORIES.DECORATIONS,
  'ENTERTAINMENT': MENU_OPTION_CATEGORIES.ENTERTAINMENT,
  'MUSIC': MENU_OPTION_CATEGORIES.MUSIC,
  'ANIMATIONS': MENU_OPTION_CATEGORIES.ANIMATIONS,
  'EQUIPMENT': MENU_OPTION_CATEGORIES.EQUIPMENT,
  'OTHER': MENU_OPTION_CATEGORIES.OTHER,
  
  // Polish formats
  'Alkohol': MENU_OPTION_CATEGORIES.ALCOHOL,
  'Animacje': MENU_OPTION_CATEGORIES.ANIMATIONS,
  'Dekoracje': MENU_OPTION_CATEGORIES.DECORATIONS,
  'Dodatki': MENU_OPTION_CATEGORIES.ADDITIONS,
  'Dodatkowe': MENU_OPTION_CATEGORIES.ADDITIONS,
  'Foto & Video': MENU_OPTION_CATEGORIES.PHOTO_VIDEO,
  'Muzyka': MENU_OPTION_CATEGORIES.MUSIC,
  'Rozrywka': MENU_OPTION_CATEGORIES.ENTERTAINMENT,
  'Jedzenie': MENU_OPTION_CATEGORIES.FOOD,
  'Napoje': MENU_OPTION_CATEGORIES.DRINKS,
  'Usługi': MENU_OPTION_CATEGORIES.SERVICES,
  'Sprzęt': MENU_OPTION_CATEGORIES.EQUIPMENT,
  'Inne': MENU_OPTION_CATEGORIES.OTHER,
} as const;

/**
 * Check if a category value is valid
 * 
 * @param category - Category string to validate
 * @returns True if category is valid
 * 
 * @example
 * ```typescript
 * if (isValidMenuOptionCategory(req.body.category)) {
 *   // Proceed with valid category
 * } else {
 *   res.status(400).json({ error: 'Invalid category' });
 * }
 * ```
 */
export function isValidMenuOptionCategory(category: string): category is MenuOptionCategory {
  return VALID_MENU_OPTION_CATEGORIES.includes(category as MenuOptionCategory);
}

/**
 * Get Polish translation for a category
 * Used for backend logging, reports, or email notifications
 * 
 * @param category - English category name
 * @returns Polish translation or original value if not found
 * 
 * @example
 * ```typescript
 * const polishName = getCategoryTranslation('Music'); // 'Muzyka'
 * console.log(`Kategoria: ${polishName}`);
 * ```
 */
export function getCategoryTranslation(category: string): string {
  return CATEGORY_TRANSLATIONS[category as keyof typeof CATEGORY_TRANSLATIONS] || category;
}

/**
 * Normalize legacy category format to standard format
 * Useful for handling old data or external integrations
 * 
 * @param category - Category in any format
 * @returns Standard category name or original if not recognized
 * 
 * @example
 * ```typescript
 * const normalized = normalizeCategoryFormat('DRINK'); // 'Drinks'
 * const normalized2 = normalizeCategoryFormat('Alkohol'); // 'Alcohol'
 * ```
 */
export function normalizeCategoryFormat(category: string): string {
  // Check if already in standard format
  if (isValidMenuOptionCategory(category)) {
    return category;
  }
  
  // Try legacy format conversion
  return LEGACY_CATEGORY_FORMATS[category as keyof typeof LEGACY_CATEGORY_FORMATS] || category;
}

/**
 * Get all categories with their translations
 * Useful for admin panels or reports
 * 
 * @returns Array of { english, polish } objects
 * 
 * @example
 * ```typescript
 * const categories = getAllCategoriesWithTranslations();
 * // [{ english: 'Alcohol', polish: 'Alkohol' }, ...]
 * ```
 */
export function getAllCategoriesWithTranslations(): Array<{ english: string; polish: string }> {
  return VALID_MENU_OPTION_CATEGORIES.map(english => ({
    english,
    polish: CATEGORY_TRANSLATIONS[english as keyof typeof CATEGORY_TRANSLATIONS],
  }));
}
