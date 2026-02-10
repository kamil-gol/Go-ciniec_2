/**
 * Dish Categories Constants
 * Polish translations and metadata for dish categories
 */

export enum DishCategory {
  SOUP = 'SOUP',
  MAIN_COURSE = 'MAIN_COURSE',
  MEAT = 'MEAT',
  SIDE_DISH = 'SIDE_DISH',
  SALAD = 'SALAD',
  APPETIZER = 'APPETIZER',
  DESSERT = 'DESSERT',
  DRINK = 'DRINK',
  COLD_CUTS = 'COLD_CUTS',
  SNACK = 'SNACK',
  BREAKFAST = 'BREAKFAST',
  ADDON = 'ADDON',
  OTHER = 'OTHER',
}

export const DISH_CATEGORY_LABELS: Record<DishCategory, string> = {
  [DishCategory.SOUP]: 'Zupy',
  [DishCategory.MAIN_COURSE]: 'Dania główne',
  [DishCategory.MEAT]: 'Mięsa',
  [DishCategory.SIDE_DISH]: 'Dodatki',
  [DishCategory.SALAD]: 'Sałatki',
  [DishCategory.APPETIZER]: 'Przystawki',
  [DishCategory.DESSERT]: 'Desery',
  [DishCategory.DRINK]: 'Napoje',
  [DishCategory.COLD_CUTS]: 'Wędliny',
  [DishCategory.SNACK]: 'Przekąski',
  [DishCategory.BREAKFAST]: 'Śniadania',
  [DishCategory.ADDON]: 'Dodatki specjalne',
  [DishCategory.OTHER]: 'Inne',
};

export const DISH_CATEGORY_ICONS: Record<DishCategory, string> = {
  [DishCategory.SOUP]: '🍜',
  [DishCategory.MAIN_COURSE]: '🍽️',
  [DishCategory.MEAT]: '🥩',
  [DishCategory.SIDE_DISH]: '🥔',
  [DishCategory.SALAD]: '🥗',
  [DishCategory.APPETIZER]: '🍤',
  [DishCategory.DESSERT]: '🍰',
  [DishCategory.DRINK]: '☕',
  [DishCategory.COLD_CUTS]: '🥓',
  [DishCategory.SNACK]: '🍿',
  [DishCategory.BREAKFAST]: '🍳',
  [DishCategory.ADDON]: '➕',
  [DishCategory.OTHER]: '📋',
};

export const DISH_CATEGORY_COLORS: Record<DishCategory, string> = {
  [DishCategory.SOUP]: 'bg-orange-100 text-orange-700 border-orange-200',
  [DishCategory.MAIN_COURSE]: 'bg-blue-100 text-blue-700 border-blue-200',
  [DishCategory.MEAT]: 'bg-red-100 text-red-700 border-red-200',
  [DishCategory.SIDE_DISH]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [DishCategory.SALAD]: 'bg-green-100 text-green-700 border-green-200',
  [DishCategory.APPETIZER]: 'bg-purple-100 text-purple-700 border-purple-200',
  [DishCategory.DESSERT]: 'bg-pink-100 text-pink-700 border-pink-200',
  [DishCategory.DRINK]: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  [DishCategory.COLD_CUTS]: 'bg-amber-100 text-amber-700 border-amber-200',
  [DishCategory.SNACK]: 'bg-lime-100 text-lime-700 border-lime-200',
  [DishCategory.BREAKFAST]: 'bg-rose-100 text-rose-700 border-rose-200',
  [DishCategory.ADDON]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [DishCategory.OTHER]: 'bg-gray-100 text-gray-700 border-gray-200',
};

/**
 * Get Polish label for category
 */
export function getDishCategoryLabel(category: string): string {
  return DISH_CATEGORY_LABELS[category as DishCategory] || category;
}

/**
 * Get icon for category
 */
export function getDishCategoryIcon(category: string): string {
  return DISH_CATEGORY_ICONS[category as DishCategory] || '📋';
}

/**
 * Get color classes for category
 */
export function getDishCategoryColor(category: string): string {
  return DISH_CATEGORY_COLORS[category as DishCategory] || DISH_CATEGORY_COLORS[DishCategory.OTHER];
}

/**
 * Get all categories for select/filter
 */
export function getAllDishCategories() {
  return Object.values(DishCategory).map(cat => ({
    value: cat,
    label: DISH_CATEGORY_LABELS[cat],
    icon: DISH_CATEGORY_ICONS[cat],
  }));
}
