/**
 * Menu utilities and helper functions
 */

// Map English category names to Polish
export const OPTION_CATEGORY_TRANSLATIONS: Record<string, string> = {
  // English to Polish
  'Alcohol': 'Alkohol',
  'Animations': 'Animacje',
  'Decorations': 'Dekoracje',
  'Additions': 'Dodatki',
  'Additional': 'Dodatkowe',
  'Photo & Video': 'Foto & Video',
  'Music': 'Muzyka',
  'Entertainment': 'Rozrywka',
  'Food': 'Jedzenie',
  'Drinks': 'Napoje',
  'Services': 'Usługi',
  'Equipment': 'Sprzęt',
  'Other': 'Inne',
  
  // Common variations
  'ALCOHOL': 'Alkohol',
  'ANIMATIONS': 'Animacje',
  'DECORATIONS': 'Dekoracje',
  'ADDITIONS': 'Dodatki',
  'ADDITIONAL': 'Dodatkowe',
  'PHOTO_VIDEO': 'Foto & Video',
  'MUSIC': 'Muzyka',
  'ENTERTAINMENT': 'Rozrywka',
  'FOOD': 'Jedzenie',
  'DRINKS': 'Napoje',
  'SERVICES': 'Usługi',
  'EQUIPMENT': 'Sprzęt',
  'OTHER': 'Inne',
};

/**
 * Translates menu option category from English to Polish
 * Falls back to original value if no translation found
 */
export function translateOptionCategory(category: string): string {
  return OPTION_CATEGORY_TRANSLATIONS[category] || category;
}

/**
 * Sorts categories with preferred order
 * Places common categories first, others alphabetically
 */
export function sortCategories(categories: string[]): string[] {
  const preferredOrder = [
    'Alkohol',
    'Muzyka',
    'Foto & Video',
    'Animacje',
    'Dekoracje',
    'Rozrywka',
    'Jedzenie',
    'Napoje',
    'Dodatki',
    'Usługi',
    'Sprzęt',
  ];

  return categories.sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);

    // Both in preferred list - use preferred order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // Only a in preferred list - a comes first
    if (aIndex !== -1) return -1;

    // Only b in preferred list - b comes first
    if (bIndex !== -1) return 1;

    // Neither in preferred list - alphabetical
    return a.localeCompare(b, 'pl');
  });
}
