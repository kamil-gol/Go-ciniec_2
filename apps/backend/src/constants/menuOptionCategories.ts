/**
 * Menu Option Categories
 * 
 * Standard category names for MenuOption records.
 * These English names are stored in the database and automatically
 * translated to Polish in the frontend.
 * 
 * IMPORTANT: Always use these exact English names when creating/updating
 * menu options to ensure proper translation in the UI.
 */

export const MENU_OPTION_CATEGORIES = {
  ALCOHOL: 'Alcohol',
  ANIMATIONS: 'Animations',
  DECORATIONS: 'Decorations',
  ADDITIONS: 'Additions',
  PHOTO_VIDEO: 'Photo & Video',
  MUSIC: 'Music',
  ENTERTAINMENT: 'Entertainment',
  FOOD: 'Food',
  DRINKS: 'Drinks',
  SERVICES: 'Services',
  EQUIPMENT: 'Equipment',
  OTHER: 'Other',
} as const;

/**
 * Type for menu option category values
 */
export type MenuOptionCategory = typeof MENU_OPTION_CATEGORIES[keyof typeof MENU_OPTION_CATEGORIES];

/**
 * Array of all valid category values (for validation)
 */
export const VALID_MENU_OPTION_CATEGORIES = Object.values(MENU_OPTION_CATEGORIES);

/**
 * Mapping from English categories to Polish translations
 * (This mapping is also maintained in frontend for display)
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
 * Check if a category value is valid
 */
export function isValidMenuOptionCategory(category: string): category is MenuOptionCategory {
  return VALID_MENU_OPTION_CATEGORIES.includes(category as MenuOptionCategory);
}

/**
 * Get Polish translation for a category (for backend logging/reports)
 */
export function getCategoryTranslation(category: string): string {
  return CATEGORY_TRANSLATIONS[category as keyof typeof CATEGORY_TRANSLATIONS] || category;
}
