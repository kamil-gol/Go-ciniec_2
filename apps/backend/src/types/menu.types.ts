/**
 * Menu System Types
 * 
 * Complete type definitions for the menu management system.
 * Supports snapshot architecture for price history preservation.
 */

import { Decimal } from '@prisma/client/runtime/library';

// ═══════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════

export enum PriceType {
  PER_PERSON = 'PER_PERSON',
  FLAT = 'FLAT',
  FREE = 'FREE',
}

export enum MenuEntityType {
  TEMPLATE = 'TEMPLATE',
  PACKAGE = 'PACKAGE',
  OPTION = 'OPTION',
}

export enum OptionCategory {
  MUSIC = 'Muzyka',
  ALCOHOL = 'Alkohol',
  DECORATIONS = 'Dekoracje',
  PHOTO_VIDEO = 'Foto & Video',
  CATERING = 'Catering',
  ENTERTAINMENT = 'Rozrywka',
  OTHER = 'Inne',
}

// ═══════════════════════════════════════════════════════════════════════
// CORE MODELS
// ═══════════════════════════════════════════════════════════════════════

export interface MenuTemplate {
  id: string;
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string; // "Zimowe", "Letnie", "Świąteczne"
  validFrom: Date;
  validTo?: Date;
  isActive: boolean;
  displayOrder: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  eventType?: {
    id: string;
    name: string;
    color?: string;
  };
  packages?: MenuPackage[];
}

export interface MenuPackage {
  id: string;
  menuTemplateId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: Decimal | number;
  pricePerChild: Decimal | number;
  pricePerToddler: Decimal | number;
  color?: string;
  icon?: string;
  badgeText?: string;
  displayOrder: number;
  isPopular: boolean;
  isRecommended: boolean;
  includedItems: string[];
  minGuests?: number;
  maxGuests?: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  menuTemplate?: MenuTemplate;
  packageOptions?: MenuPackageOption[];
}

export interface MenuOption {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  category: string;
  priceType: PriceType;
  priceAmount: Decimal | number;
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
}

export interface MenuPackageOption {
  id: string;
  packageId: string;
  optionId: string;
  customPrice?: Decimal | number;
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

export interface ReservationMenuSnapshot {
  id: string;
  reservationId: string;
  menuData: MenuSnapshotData;
  menuTemplateId?: string;
  packageId?: string;
  packagePrice: Decimal | number;
  optionsPrice: Decimal | number;
  totalMenuPrice: Decimal | number;
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  selectedAt: Date;
  updatedAt: Date;
}

export interface MenuPriceHistory {
  id: string;
  entityType: MenuEntityType;
  entityId: string;
  menuTemplateId?: string;
  packageId?: string;
  optionId?: string;
  fieldName: string;
  oldValue: Decimal | number;
  newValue: Decimal | number;
  changeReason?: string;
  effectiveFrom: Date;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════
// SNAPSHOT DATA (Immutable JSON)
// ═══════════════════════════════════════════════════════════════════════

export interface MenuSnapshotData {
  // Template info
  templateId: string;
  templateName: string;
  templateVariant?: string;

  // Package info
  packageId: string;
  packageName: string;
  packageDescription?: string;
  packageColor?: string;
  packageIcon?: string;
  packagePricePerAdult: number;
  packagePricePerChild: number;
  packagePricePerToddler: number;
  includedItems: string[];

  // Selected options
  selectedOptions: SelectedOptionSnapshot[];

  // Guest breakdown
  adults: number;
  children: number;
  toddlers: number;

  // Calculated prices
  packageTotal: number;
  optionsTotal: number;
  grandTotal: number;

  // Timestamp
  snapshotVersion: string; // "1.0"
  selectedAt: string; // ISO string
}

export interface SelectedOptionSnapshot {
  optionId: string;
  optionName: string;
  category: string;
  priceType: PriceType;
  priceAmount: number;
  quantity: number;
  totalPrice: number;
  icon?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// DTOs (Data Transfer Objects)
// ═══════════════════════════════════════════════════════════════════════

// Menu Template DTOs
export interface CreateMenuTemplateDTO {
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;
  validFrom: string | Date;
  validTo?: string | Date;
  isActive?: boolean;
  displayOrder?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface UpdateMenuTemplateDTO {
  name?: string;
  description?: string;
  variant?: string;
  validFrom?: string | Date;
  validTo?: string | Date;
  isActive?: boolean;
  displayOrder?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
}

// Menu Package DTOs
export interface CreateMenuPackageDTO {
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
  optionIds?: string[]; // Options to attach
}

export interface UpdateMenuPackageDTO {
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

// Menu Option DTOs
export interface CreateMenuOptionDTO {
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
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateMenuOptionDTO {
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

// Package Options DTOs
export interface AttachOptionToPackageDTO {
  optionId: string;
  customPrice?: number;
  isRequired?: boolean;
  isDefault?: boolean;
  isExclusive?: boolean;
  displayOrder?: number;
}

export interface UpdatePackageOptionDTO {
  customPrice?: number;
  isRequired?: boolean;
  isDefault?: boolean;
  isExclusive?: boolean;
  displayOrder?: number;
}

// Reservation Menu Selection DTOs
export interface SelectMenuDTO {
  packageId: string;
  selectedOptions: SelectedOptionDTO[];
}

export interface SelectedOptionDTO {
  optionId: string;
  quantity?: number; // Default 1, can be > 1 if allowMultiple
}

export interface UpdateReservationMenuDTO {
  packageId?: string;
  selectedOptions?: SelectedOptionDTO[];
}

// Reorder DTOs
export interface ReorderPackagesDTO {
  packageOrders: Array<{
    id: string;
    displayOrder: number;
  }>;
}

export interface ReorderOptionsDTO {
  optionOrders: Array<{
    id: string;
    displayOrder: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface MenuTemplateWithPackages extends MenuTemplate {
  packages: MenuPackageWithOptions[];
}

export interface MenuPackageWithOptions extends MenuPackage {
  options: MenuOptionInPackage[];
}

export interface MenuOptionInPackage extends MenuOption {
  // From junction table
  customPrice?: number;
  isRequired: boolean;
  isDefault: boolean;
  isExclusive: boolean;
  packageOptionDisplayOrder: number;
}

export interface MenuSelectionResponse {
  snapshot: ReservationMenuSnapshot;
  breakdown: PriceBreakdown;
}

export interface PriceBreakdown {
  package: {
    name: string;
    adults: number;
    children: number;
    toddlers: number;
    pricePerAdult: number;
    pricePerChild: number;
    pricePerToddler: number;
    subtotal: number;
  };
  options: Array<{
    name: string;
    category: string;
    priceType: PriceType;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
  }>;
  totals: {
    packageTotal: number;
    optionsTotal: number;
    grandTotal: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// QUERY FILTERS
// ═══════════════════════════════════════════════════════════════════════

export interface MenuTemplateFilters {
  eventTypeId?: string;
  isActive?: boolean;
  variant?: string;
  date?: Date; // Find templates valid on this date
}

export interface MenuOptionFilters {
  category?: string;
  isActive?: boolean;
  priceType?: PriceType;
  allowMultiple?: boolean;
}

export interface MenuPriceHistoryFilters {
  entityType?: MenuEntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
}

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════

export const VALID_PRICE_TYPES: PriceType[] = [
  PriceType.PER_PERSON,
  PriceType.FLAT,
  PriceType.FREE,
];

export const VALID_OPTION_CATEGORIES = [
  OptionCategory.MUSIC,
  OptionCategory.ALCOHOL,
  OptionCategory.DECORATIONS,
  OptionCategory.PHOTO_VIDEO,
  OptionCategory.CATERING,
  OptionCategory.ENTERTAINMENT,
  OptionCategory.OTHER,
];

export function isPriceType(value: string): value is PriceType {
  return VALID_PRICE_TYPES.includes(value as PriceType);
}

export function isOptionCategory(value: string): boolean {
  return VALID_OPTION_CATEGORIES.some(cat => cat === value);
}
