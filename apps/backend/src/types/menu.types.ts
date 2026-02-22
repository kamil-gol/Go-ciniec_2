/**
 * Menu System TypeScript Types
 * 
 * Type definitions for menu templates, packages, and snapshots
 * 
 * NOTE: MenuOption and MenuPackageOption Prisma models were removed.
 * Options are now handled via the ServiceExtras system.
 * Legacy type interfaces kept for backward compatibility where needed.
 */

import { MenuTemplate, MenuPackage } from '@prisma/client';

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// MENU TEMPLATE TYPES
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

export interface CreateMenuTemplateInput {
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;
  validFrom?: Date;
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

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// MENU PACKAGE TYPES
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

export interface CreateMenuPackageInput {
  menuTemplateId: string;
  name: string;
  description?: string | null;
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

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// LEGACY MENU OPTION TYPES (Prisma models removed, interfaces kept for compat)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

/** @deprecated Use ServiceExtras system instead */
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

/** @deprecated Use ServiceExtras system instead */
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

/** @deprecated Use ServiceExtras system instead */
export interface AssignOptionsToPackageInput {
  options: Array<{
    optionId: string;
    customPrice?: number | null;
    isRequired?: boolean;
    isDefault?: boolean;
    displayOrder?: number;
  }>;
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// DISH SELECTION TYPES
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

export interface DishSelectionItem {
  dishId: string;
  quantity: number;
}

export interface CategoryDishSelection {
  categoryId: string;
  dishes: DishSelectionItem[];
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// SNAPSHOT TYPES
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

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

  // Selected options (legacy — kept for snapshot backward compat)
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

  // Dish selections
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
};
