/**
 * Menu System Types
 * 
 * Mirrors backend types for type-safe API integration
 */

import { z } from 'zod';

// ══════════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface EventType {
  id: string;
  name: string;
  color: string;
}

export interface MenuTemplate {
  id: string;
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;
  validFrom: string;
  validTo?: string;
  isActive: boolean;
  displayOrder: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  eventType?: EventType;
  packages?: MenuPackage[];
}

export interface MenuPackage {
  id: string;
  menuTemplateId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: string | number;
  pricePerChild: string | number;
  pricePerToddler: string | number;
  includedItems: string[];
  minGuests?: number;
  maxGuests?: number;
  color?: string;
  icon?: string;
  badgeText?: string;
  imageUrl?: string;
  displayOrder: number;
  isPopular: boolean;
  isRecommended: boolean;
  createdAt?: string;
  updatedAt?: string;
  menuTemplate?: MenuTemplate;
  packageOptions?: MenuPackageOption[];
  courses?: MenuCourse[]; // NEW: Courses in this package
}

export interface MenuOption {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  category: string;
  priceType: 'FLAT' | 'PER_PERSON' | 'FREE';
  priceAmount: string | number;
  allowMultiple: boolean;
  maxQuantity?: number;
  icon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuPackageOption {
  id: string;
  packageId: string;
  optionId: string;
  customPrice?: string | number;
  isRequired: boolean;
  isDefault: boolean;
  displayOrder: number;
  option?: MenuOption;
}

// ══════════════════════════════════════════════════════════════════════════════
// 🍽️ DISH LIBRARY & MENU COURSES (NEW)
// ══════════════════════════════════════════════════════════════════════════════

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
  [DishCategory.COLD_CUTS]: 'Zimna płyta',
  [DishCategory.SNACK]: 'Podwieczorek',
  [DishCategory.BREAKFAST]: 'Śniadanie',
  [DishCategory.OTHER]: 'Inne',
};

export interface Dish {
  id: string;
  name: string;
  description?: string;
  category: DishCategory;
  allergens: string[];
  priceModifier: string | number;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCourse {
  id: string;
  packageId: string;
  name: string;
  description?: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  displayOrder: number;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  options?: MenuCourseOption[];
}

export interface MenuCourseOption {
  id: string;
  courseId: string;
  dishId: string;
  customPrice?: string | number;
  isDefault: boolean;
  isRecommended: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  dish?: Dish;
}

// ══════════════════════════════════════════════════════════════════════════════
// RESERVATION MENU SELECTION
// ══════════════════════════════════════════════════════════════════════════════

export interface SelectedOption {
  optionId: string;
  quantity: number;
}

export interface SelectedDish {
  courseId: string;
  dishIds: string[]; // Array because can select multiple dishes per course
}

export interface MenuSelectionInput {
  packageId: string;
  selectedOptions?: SelectedOption[];
  selectedDishes?: SelectedDish[]; // NEW: Selected dishes from courses
}

export interface ReservationMenuSnapshot {
  id: string;
  reservationId: string;
  menuData: MenuSnapshotData;
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  snapshotDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuSnapshotData {
  templateId: string;
  templateName: string;
  packageId: string;
  packageName: string;
  packagePrices: {
    adult: number;
    child: number;
    toddler: number;
  };
  selectedOptions: {
    optionId: string;
    name: string;
    priceType: string;
    priceAmount: number;
    quantity: number;
  }[];
  selectedCourses?: { // NEW: Snapshot of selected dishes
    courseId: string;
    courseName: string;
    dishes: {
      dishId: string;
      dishName: string;
      priceModifier: number;
    }[];
  }[];
}

// ══════════════════════════════════════════════════════════════════════════════
// PRICE BREAKDOWN
// ══════════════════════════════════════════════════════════════════════════════

export interface PriceBreakdown {
  packageCost: {
    adults: {
      count: number;
      priceEach: number;
      total: number;
    };
    children: {
      count: number;
      priceEach: number;
      total: number;
    };
    toddlers: {
      count: number;
      priceEach: number;
      total: number;
    };
    subtotal: number;
  };
  optionsCost: {
    option: string;
    priceType: string;
    priceEach: number;
    quantity: number;
    total: number;
  }[];
  optionsSubtotal: number;
  totalMenuPrice: number;
}

export interface ReservationMenuResponse {
  snapshot: ReservationMenuSnapshot;
  priceBreakdown: PriceBreakdown;
}

// ══════════════════════════════════════════════════════════════════════════════
// API RESPONSE WRAPPERS
// ══════════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: any[];
}

// ══════════════════════════════════════════════════════════════════════════════
// FILTERS & QUERIES
// ══════════════════════════════════════════════════════════════════════════════

export interface MenuTemplateFilters {
  eventTypeId?: string;
  isActive?: boolean;
  date?: string;
}

export interface MenuOptionFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface DishFilters {
  category?: DishCategory;
  isActive?: boolean;
  search?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ZOD SCHEMAS FOR VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

export const menuSelectionSchema = z.object({
  packageId: z.string().uuid('Wybierz pakiet'),
  selectedOptions: z.array(
    z.object({
      optionId: z.string().uuid(),
      quantity: z.number().int().positive().default(1),
    })
  ).optional().default([]),
  selectedDishes: z.array(
    z.object({
      courseId: z.string().uuid(),
      dishIds: z.array(z.string().uuid()),
    })
  ).optional().default([]),
});

export const guestCountsSchema = z.object({
  adultsCount: z.number().int().min(1, 'Minimum 1 osoba dorosła'),
  childrenCount: z.number().int().min(0).default(0),
  toddlersCount: z.number().int().min(0).default(0),
});

export type MenuSelectionFormData = z.infer<typeof menuSelectionSchema>;
export type GuestCountsFormData = z.infer<typeof guestCountsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// UI STATE TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface MenuSelectionState {
  selectedTemplate?: MenuTemplate;
  selectedPackage?: MenuPackage;
  selectedOptions: Map<string, number>; // optionId -> quantity
  selectedDishes: Map<string, string[]>; // courseId -> dishIds
  guestCounts: {
    adults: number;
    children: number;
    toddlers: number;
  };
}

export interface MenuCart {
  reservationId: string;
  packageId: string;
  packageName: string;
  packagePrice: {
    adult: number;
    child: number;
    toddler: number;
  };
  selectedOptions: {
    id: string;
    name: string;
    priceType: string;
    priceAmount: number;
    quantity: number;
  }[];
  selectedCourses: {
    courseId: string;
    courseName: string;
    dishes: {
      id: string;
      name: string;
      priceModifier: number;
    }[];
  }[];
  guestCounts: {
    adults: number;
    children: number;
    toddlers: number;
  };
  totalPrice: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER TYPE GUARDS
// ══════════════════════════════════════════════════════════════════════════════

export function isApiError(response: any): response is ApiError {
  return response && response.success === false && 'error' in response;
}

export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return response && response.success === true && 'data' in response;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

export const OPTION_CATEGORIES = [
  'Alkohol',
  'Animacje',
  'Dekoracje',
  'Dodatki',
  'Dodatkowe',
  'Foto & Video',
  'Muzyka',
  'Rozrywka',
] as const;

export type OptionCategory = typeof OPTION_CATEGORIES[number];

export const PRICE_TYPES = {
  FLAT: 'Stała cena',
  PER_PERSON: 'Za osobę',
  FREE: 'Gratis',
} as const;
