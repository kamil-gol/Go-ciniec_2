/**
 * Menu System TypeScript Types
 * 
 * Type definitions for menu templates, packages, and snapshots
 * 
 * NOTE: MenuOption and MenuPackageOption Prisma models were removed.
 * Options are now handled via the ServiceExtras system.
 * Legacy type interfaces kept for backward compatibility where needed.
 * Updated: #166 — Added portionTarget to enriched dish selections in snapshot
 */

import { MenuTemplate, MenuPackage } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════
// MENU TEMPLATE TYPES
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// MENU PACKAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

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
// SELECTED OPTION DTO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DTO for selected options in snapshot input.
 * Required: optionId + quantity.
 * Optional fields are used by menuSnapshot.service to enrich snapshot data.
 * If omitted, the service falls back to defaults.
 */
export interface SelectedOptionDTO {
  optionId: string;
  quantity: number;
  name?: string;
  description?: string | null;
  category?: string;
  priceType?: 'PER_PERSON' | 'FLAT' | 'FREE';
  priceAmount?: number;
  icon?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PORTION TARGET TYPE
// ═══════════════════════════════════════════════════════════════════════════

export type PortionTarget = 'ALL' | 'ADULTS_ONLY' | 'CHILDREN_ONLY';

// ═══════════════════════════════════════════════════════════════════════════
// ENRICHED DISH SELECTION (stored in snapshot JSONB)
// ═══════════════════════════════════════════════════════════════════════════

export interface EnrichedDishSelection {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  portionTarget: PortionTarget;
  dishes: Array<{
    dishId: string;
    dishName: string;
    description: string | null;
    allergens: string[];
    quantity: number;
  }>;
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

  // Dish selections — #166: now includes portionTarget per category
  dishSelections?: EnrichedDishSelection[];
}

export interface CreateMenuSnapshotInput {
  reservationId: string;
  packageId: string;
  selectedOptions: SelectedOptionDTO[];
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
