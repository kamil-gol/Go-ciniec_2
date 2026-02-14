/**
 * Menu System TypeScript Types
 * 
 * Type definitions for menu templates, packages, options, and snapshots
 */

import { MenuTemplate, MenuPackage, MenuOption, MenuPackageOption } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════
// MENU TEMPLATE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateMenuTemplateInput {
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;
  validFrom: Date;
  validTo?: Date | null;
  isActive?: boolean;
  displayOrder?: number;
  imageUrl?: string | null;
}

export interface UpdateMenuTemplateInput {
  name?: string;
  description?: string | null;
  variant?: string | null;
  validFrom?: Date;
  validTo?: Date | null;
  isActive?: boolean;
  displayOrder?: number;
  imageUrl?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU PACKAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateMenuPackageInput {
  menuTemplateId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  includedItems?: string[];
  minGuests?: number | null;
  maxGuests?: number | null;
  color?: string | null;
  icon?: string | null;
  badgeText?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
}

export interface UpdateMenuPackageInput {
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  pricePerAdult?: number;
  pricePerChild?: number;
  pricePerToddler?: number;
  includedItems?: string[];
  minGuests?: number | null;
  maxGuests?: number | null;
  color?: string | null;
  icon?: string | null;
  badgeText?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  changeReason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU OPTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateMenuOptionInput {
  name: string;
  description?: string;
  shortDescription?: string;
  category: string;
  priceType: 'PER_PERSON' | 'FLAT' | 'FREE';
  priceAmount: number;
  allowMultiple?: boolean;
  maxQuantity?: number | null;
  icon?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuOptionInput {
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  category?: string;
  priceType?: 'PER_PERSON' | 'FLAT' | 'FREE';
  priceAmount?: number;
  allowMultiple?: boolean;
  maxQuantity?: number | null;
  icon?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  changeReason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PACKAGE-OPTION ASSIGNMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AssignOptionsToPackageInput {
  options: Array<{
    optionId: string;
    customPrice?: number | null;
    isRequired?: boolean;
    isDefault?: boolean;
    displayOrder?: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// DISH SELECTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DishSelectionItem {
  dishId: string;
  quantity: number;
}

export interface CategoryDishSelection {
  categoryId: string;
  dishes: DishSelectionItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SNAPSHOT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MenuSnapshotData {
  // Template info
  templateId: string;
  templateName: string;
  templateVariant: string | null;
  eventTypeName: string;

  // Package info
  packageId: string;
  packageName: string;
  packageDescription: string | null;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  includedItems: string[];
  packageColor: string | null;
  packageIcon: string | null;

  // Selected options
  selectedOptions: Array<{
    optionId: string;
    name: string;
    description: string | null;
    category: string;
    priceType: 'PER_PERSON' | 'FLAT' | 'FREE';
    priceAmount: number;
    quantity: number;
    icon: string | null;
  }>;

  // Dish selections (added for full menu persistence)
  dishSelections?: CategoryDishSelection[];
}

export interface CreateMenuSnapshotInput {
  reservationId: string;
  packageId: string;
  selectedOptions: Array<{
    optionId: string;
    quantity: number;
  }>;
  dishSelections?: CategoryDishSelection[];
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
}

export interface MenuPriceBreakdown {
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
  optionsCost: Array<{
    option: string;
    priceType: 'PER_PERSON' | 'FLAT' | 'FREE';
    priceEach: number;
    quantity: number;
    total: number;
  }>;
  optionsSubtotal: number;
  totalMenuPrice: number;
}

// Re-export Prisma types for convenience
export type {
  MenuTemplate,
  MenuPackage,
  MenuOption,
  MenuPackageOption
};
