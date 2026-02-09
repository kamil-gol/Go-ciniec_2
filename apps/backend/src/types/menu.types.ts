/**
 * 🍽️ Menu System Types
 * 
 * Type definitions for menu management system with snapshot architecture.
 * Supports dynamic menu templates, packages, options, and immutable snapshots.
 */

import { Decimal } from '@prisma/client/runtime/library';

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export enum PriceType {
  PER_PERSON = 'PER_PERSON',  // Price per guest (e.g., Open Bar: 50 zł/person)
  FLAT = 'FLAT',              // One-time flat fee (e.g., DJ: 2000 zł)
  FREE = 'FREE'               // Included in package
}

export enum OptionCategory {
  MUSIC = 'Muzyka',
  ALCOHOL = 'Alkohol',
  DECORATIONS = 'Dekoracje',
  PHOTO_VIDEO = 'Foto & Video',
  ENTERTAINMENT = 'Rozrywka',
  CATERING = 'Catering',
  OTHER = 'Inne'
}

export enum EntityType {
  TEMPLATE = 'TEMPLATE',
  PACKAGE = 'PACKAGE',
  OPTION = 'OPTION'
}

// ═══════════════════════════════════════════════════════════
// MENU TEMPLATE
// ═══════════════════════════════════════════════════════════

export interface MenuTemplate {
  id: string;
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;              // "Zimowe", "Letnie", "Świąteczne"
  validFrom: Date;
  validTo?: Date;
  isActive: boolean;
  displayOrder: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  eventType?: any;               // EventType
  packages?: MenuPackage[];
  priceHistory?: MenuPriceHistory[];
}

export interface CreateMenuTemplateInput {
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;
  validFrom: Date | string;
  validTo?: Date | string;
  displayOrder?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface UpdateMenuTemplateInput {
  name?: string;
  description?: string;
  variant?: string;
  validFrom?: Date | string;
  validTo?: Date | string;
  isActive?: boolean;
  displayOrder?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
}

// ═══════════════════════════════════════════════════════════
// MENU PACKAGE
// ═══════════════════════════════════════════════════════════

export interface MenuPackage {
  id: string;
  menuTemplateId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: Decimal;
  pricePerChild: Decimal;
  pricePerToddler: Decimal;
  color?: string;                // "#FFD700"
  icon?: string;                 // "star", "crown", "diamond"
  badgeText?: string;            // "Najpopularniejszy"
  displayOrder: number;
  isPopular: boolean;
  isRecommended: boolean;
  includedItems: string[];       // ["Tort 3-piętrowy", "Kelnerzy"]
  minGuests?: number;
  maxGuests?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  menuTemplate?: MenuTemplate;
  packageOptions?: MenuPackageOption[];
  priceHistory?: MenuPriceHistory[];
}

export interface CreateMenuPackageInput {
  menuTemplateId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: number;
  pricePerChild?: number;
  pricePerToddler?: number;
  color?: string;
  icon?: string;
  badgeText?: string;
  displayOrder?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  includedItems?: string[];
  minGuests?: number;
  maxGuests?: number;
}

export interface UpdateMenuPackageInput {
  name?: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult?: number;
  pricePerChild?: number;
  pricePerToddler?: number;
  color?: string;
  icon?: string;
  badgeText?: string;
  displayOrder?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  includedItems?: string[];
  minGuests?: number;
  maxGuests?: number;
}

// ═══════════════════════════════════════════════════════════
// MENU OPTION
// ═══════════════════════════════════════════════════════════

export interface MenuOption {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  category: string;              // OptionCategory
  priceType: PriceType;
  priceAmount: Decimal;
  allowMultiple: boolean;
  maxQuantity: number;
  icon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  packageOptions?: MenuPackageOption[];
  priceHistory?: MenuPriceHistory[];
}

export interface CreateMenuOptionInput {
  name: string;
  description?: string;
  shortDescription?: string;
  category: string;
  priceType: PriceType;
  priceAmount: number;
  allowMultiple?: boolean;
  maxQuantity?: number;
  icon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  displayOrder?: number;
}

export interface UpdateMenuOptionInput {
  name?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  priceType?: PriceType;
  priceAmount?: number;
  allowMultiple?: boolean;
  maxQuantity?: number;
  icon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// ═══════════════════════════════════════════════════════════
// MENU PACKAGE OPTION (Junction)
// ═══════════════════════════════════════════════════════════

export interface MenuPackageOption {
  id: string;
  packageId: string;
  optionId: string;
  customPrice?: Decimal;         // Override default option price
  isRequired: boolean;
  isDefault: boolean;
  isExclusive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  package?: MenuPackage;
  option?: MenuOption;
}

export interface AddOptionToPackageInput {
  packageId: string;
  optionId: string;
  customPrice?: number;
  isRequired?: boolean;
  isDefault?: boolean;
  isExclusive?: boolean;
  displayOrder?: number;
}

export interface UpdatePackageOptionInput {
  customPrice?: number | null;
  isRequired?: boolean;
  isDefault?: boolean;
  isExclusive?: boolean;
  displayOrder?: number;
}

// ═══════════════════════════════════════════════════════════
// RESERVATION MENU SNAPSHOT
// ═══════════════════════════════════════════════════════════

export interface ReservationMenuSnapshot {
  id: string;
  reservationId: string;
  menuData: MenuSnapshotData;    // Full JSON snapshot
  menuTemplateId?: string;
  packageId?: string;
  packagePrice: Decimal;         // Total package cost
  optionsPrice: Decimal;         // Total options cost
  totalMenuPrice: Decimal;       // packagePrice + optionsPrice
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  selectedAt: Date;
  updatedAt: Date;
  
  // Relations
  reservation?: any;             // Reservation
}

// Snapshot data structure (immutable JSON)
export interface MenuSnapshotData {
  template: {
    id: string;
    name: string;
    description?: string;
    variant?: string;
  };
  package: {
    id: string;
    name: string;
    description?: string;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    color?: string;
    icon?: string;
    badgeText?: string;
    includedItems: string[];
  };
  selectedOptions: SelectedOptionSnapshot[];
  guests: {
    adults: number;
    children: number;
    toddlers: number;
    total: number;
  };
  pricing: {
    packageSubtotal: number;     // pricePerAdult × adults + pricePerChild × children + ...
    optionsSubtotal: number;     // Sum of all options
    total: number;               // packageSubtotal + optionsSubtotal
  };
  selectedAt: string;            // ISO timestamp
}

export interface SelectedOptionSnapshot {
  id: string;
  name: string;
  description?: string;
  category: string;
  priceType: PriceType;
  priceAmount: number;           // Price at selection time
  quantity: number;              // 1 for FLAT, guests count for PER_PERSON
  totalPrice: number;            // priceAmount × quantity
  icon?: string;
}

export interface SelectMenuForReservationInput {
  reservationId: string;
  packageId: string;
  selectedOptions?: SelectedOptionInput[];
}

export interface SelectedOptionInput {
  optionId: string;
  quantity?: number;             // Optional, default 1 for FLAT, guests for PER_PERSON
}

export interface UpdateReservationMenuInput {
  packageId?: string;
  selectedOptions?: SelectedOptionInput[];
}

// ═══════════════════════════════════════════════════════════
// PRICE HISTORY
// ═══════════════════════════════════════════════════════════

export interface MenuPriceHistory {
  id: string;
  entityType: EntityType;
  entityId: string;
  menuTemplateId?: string;
  packageId?: string;
  optionId?: string;
  fieldName: string;             // "pricePerAdult", "priceAmount"
  oldValue: Decimal;
  newValue: Decimal;
  changeReason?: string;
  effectiveFrom: Date;
  createdAt: Date;
  
  // Relations
  menuTemplate?: MenuTemplate;
  package?: MenuPackage;
  option?: MenuOption;
}

export interface CreatePriceHistoryInput {
  entityType: EntityType;
  entityId: string;
  menuTemplateId?: string;
  packageId?: string;
  optionId?: string;
  fieldName: string;
  oldValue: number;
  newValue: number;
  changeReason?: string;
  effectiveFrom?: Date | string;
}

// ═══════════════════════════════════════════════════════════
// QUERY FILTERS
// ═══════════════════════════════════════════════════════════

export interface MenuTemplateFilters {
  eventTypeId?: string;
  isActive?: boolean;
  variant?: string;
  validOn?: Date | string;       // Filter templates valid on specific date
}

export interface MenuPackageFilters {
  menuTemplateId?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface MenuOptionFilters {
  category?: string;
  priceType?: PriceType;
  isActive?: boolean;
  search?: string;               // Search in name/description
}

// ═══════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════

export interface MenuTemplateWithPackages extends MenuTemplate {
  packages: (MenuPackage & {
    packageOptions: (MenuPackageOption & {
      option: MenuOption;
    })[];
  })[];
}

export interface MenuPackageWithOptions extends MenuPackage {
  packageOptions: (MenuPackageOption & {
    option: MenuOption;
  })[];
}

export interface MenuSelectionCalculation {
  packagePrice: number;
  optionsPrice: number;
  totalMenuPrice: number;
  breakdown: {
    package: {
      adults: { count: number; price: number; total: number };
      children: { count: number; price: number; total: number };
      toddlers: { count: number; price: number; total: number };
    };
    options: {
      id: string;
      name: string;
      priceType: PriceType;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
  };
}

// ═══════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════

export interface ReorderInput {
  id: string;
  displayOrder: number;
}

export interface DuplicateMenuTemplateInput {
  templateId: string;
  newName: string;
  validFrom: Date | string;
  validTo?: Date | string;
}

export interface BulkOptionAssignmentInput {
  packageId: string;
  optionIds: string[];
  isDefault?: boolean;
}

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════

export interface MenuValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface PackageValidation {
  hasOptions: boolean;
  optionsCount: number;
  pricesValid: boolean;
  guestRangeValid: boolean;
}
