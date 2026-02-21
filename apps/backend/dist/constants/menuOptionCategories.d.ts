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
export declare const MENU_OPTION_CATEGORIES: {
    /** Alcoholic beverages and bar services */
    readonly ALCOHOL: "Alcohol";
    /** Entertainment and animations for children */
    readonly ANIMATIONS: "Animations";
    /** Decorations, flowers, balloons */
    readonly DECORATIONS: "Decorations";
    /** Additional items and extras */
    readonly ADDITIONS: "Additions";
    /** Photography and videography services */
    readonly PHOTO_VIDEO: "Photo & Video";
    /** Music services: DJ, bands, equipment */
    readonly MUSIC: "Music";
    /** Entertainment: games, activities, attractions */
    readonly ENTERTAINMENT: "Entertainment";
    /** Food items: meals, desserts, extras */
    readonly FOOD: "Food";
    /** Non-alcoholic beverages */
    readonly DRINKS: "Drinks";
    /** Additional services: staff, security, etc. */
    readonly SERVICES: "Services";
    /** Rental equipment and technical gear */
    readonly EQUIPMENT: "Equipment";
    /** Miscellaneous options */
    readonly OTHER: "Other";
};
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
export declare const VALID_MENU_OPTION_CATEGORIES: ("Alcohol" | "Animations" | "Decorations" | "Additions" | "Photo & Video" | "Music" | "Entertainment" | "Food" | "Drinks" | "Services" | "Equipment" | "Other")[];
/**
 * Mapping from English categories to Polish translations
 * (This mapping is also maintained in frontend for display)
 *
 * Note: Frontend handles the actual translation for users.
 * This mapping is provided for backend logging, reports, or emails.
 */
export declare const CATEGORY_TRANSLATIONS: {
    readonly Alcohol: "Alkohol";
    readonly Animations: "Animacje";
    readonly Decorations: "Dekoracje";
    readonly Additions: "Dodatki";
    readonly 'Photo & Video': "Foto & Video";
    readonly Music: "Muzyka";
    readonly Entertainment: "Rozrywka";
    readonly Food: "Jedzenie";
    readonly Drinks: "Napoje";
    readonly Services: "Usługi";
    readonly Equipment: "Sprzęt";
    readonly Other: "Inne";
};
/**
 * Legacy category formats that should be migrated
 * These formats are supported by the migration script
 */
export declare const LEGACY_CATEGORY_FORMATS: {
    readonly ALCOHOL: "Alcohol";
    readonly DRINK: "Drinks";
    readonly DRINKS: "Drinks";
    readonly DESSERT: "Food";
    readonly EXTRA_DISH: "Food";
    readonly FOOD: "Food";
    readonly SERVICE: "Services";
    readonly SERVICES: "Services";
    readonly DECORATION: "Decorations";
    readonly DECORATIONS: "Decorations";
    readonly ENTERTAINMENT: "Entertainment";
    readonly MUSIC: "Music";
    readonly ANIMATIONS: "Animations";
    readonly EQUIPMENT: "Equipment";
    readonly OTHER: "Other";
    readonly Alkohol: "Alcohol";
    readonly Animacje: "Animations";
    readonly Dekoracje: "Decorations";
    readonly Dodatki: "Additions";
    readonly Dodatkowe: "Additions";
    readonly 'Foto & Video': "Photo & Video";
    readonly Muzyka: "Music";
    readonly Rozrywka: "Entertainment";
    readonly Jedzenie: "Food";
    readonly Napoje: "Drinks";
    readonly Usługi: "Services";
    readonly Sprzęt: "Equipment";
    readonly Inne: "Other";
};
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
export declare function isValidMenuOptionCategory(category: string): category is MenuOptionCategory;
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
export declare function getCategoryTranslation(category: string): string;
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
export declare function normalizeCategoryFormat(category: string): string;
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
export declare function getAllCategoriesWithTranslations(): Array<{
    english: string;
    polish: string;
}>;
//# sourceMappingURL=menuOptionCategories.d.ts.map