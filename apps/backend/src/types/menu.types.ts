/**
 * Menu System Types
 * 
 * Type definitions for the menu management system with snapshot architecture.
 * Supports versioned menus, packages, options, and immutable reservations.
 */

import { Decimal } from '@prisma/client/runtime/library';

// ═══════════════════════════════════════════════════════════
// Core Menu Types
// ═══════════════════════════════════════════════════════════

export type PriceType = 'PER_PERSON' | 'FLAT' | 'FREE';

export interface MenuTemplate {
  id: string;
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;
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
  
  // Pricing
  pricePerAdult: Decimal;
  pricePerChild: Decimal;
  pricePerToddler: Decimal;
  
  // UI
  color?: string;
  icon?: string;
  badgeText?: string;
  displayOrder: number;
  isPopular: boolean;
  isRecommended: boolean;
  
  // Features
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
  category: string; // "Muzyka", "Alkohol", "Dekoracje", "Foto/Video"
  
  // Pricing
  priceType: PriceType;
  priceAmount: Decimal;
  
  // Multiplier
  allowMultiple: boolean;
  maxQuantity: number;
  
  // UI
  icon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  
  // Status
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
  
  customPrice?: Decimal;
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

// ═══════════════════════════════════════════════════════════
// Menu Snapshot Types
// ═══════════════════════════════════════════════════════════

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
  
  // Package pricing (at time of selection)
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  includedItems: string[];
  
  // Selected options
  selectedOptions: SnapshotOption[];
  
  // Metadata
  selectedAt: string; // ISO date
  validFrom: string;
  validTo?: string;
}

export interface SnapshotOption {
  optionId: string;
  name: string;
  description?: string;
  category: string;
  priceType: PriceType;
  priceAmount: number;
  quantity: number; // For multiplier support
  totalPrice: number; // priceAmount * quantity (or * guestCount if PER_PERSON)
}

export interface ReservationMenuSnapshot {
  id: string;
  reservationId: string;
  
  menuData: MenuSnapshotData;
  
  // References (may be null)
  menuTemplateId?: string;
  packageId?: string;
  
  // Totals
  packagePrice: Decimal;
  optionsPrice: Decimal;
  totalMenuPrice: Decimal;
  
  // Guest counts
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  
  selectedAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// API Request/Response Types
// ═══════════════════════════════════════════════════════════

// Create Menu Template
export interface CreateMenuTemplateRequest {
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;
  validFrom: string; // ISO date
  validTo?: string;
  displayOrder?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface UpdateMenuTemplateRequest extends Partial<CreateMenuTemplateRequest> {
  isActive?: boolean;
}

// Create Package
export interface CreateMenuPackageRequest {
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

export interface UpdateMenuPackageRequest extends Partial<CreateMenuPackageRequest> {}

// Create Option
export interface CreateMenuOptionRequest {
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

export interface UpdateMenuOptionRequest extends Partial<CreateMenuOptionRequest> {
  isActive?: boolean;
}

// Assign options to package
export interface AssignOptionsToPackageRequest {
  packageId: string;
  options: {
    optionId: string;
    customPrice?: number;
    isRequired?: boolean;
    isDefault?: boolean;
    isExclusive?: boolean;
    displayOrder?: number;
  }[];
}

// Select menu for reservation
export interface SelectMenuRequest {
  packageId: string;
  selectedOptions?: {
    optionId: string;
    quantity?: number; // Default 1
  }[];
}

export interface SelectMenuResponse {
  snapshot: ReservationMenuSnapshot;
  priceBreakdown: {
    packageCost: {
      adults: { count: number; priceEach: number; total: number };
      children: { count: number; priceEach: number; total: number };
      toddlers: { count: number; priceEach: number; total: number };
      subtotal: number;
    };
    optionsCost: {
      option: string;
      priceType: PriceType;
      priceEach: number;
      quantity: number;
      total: number;
    }[];
    optionsSubtotal: number;
    totalMenuPrice: number;
  };
}

// Reorder packages
export interface ReorderPackagesRequest {
  packageOrders: {
    packageId: string;
    displayOrder: number;
  }[];
}

// Duplicate template
export interface DuplicateMenuTemplateRequest {
  newName: string;
  newVariant?: string;
  validFrom: string;
  validTo?: string;
  copyPackages?: boolean; // Default true
  copyOptions?: boolean; // Default true
}

// ═══════════════════════════════════════════════════════════
// Query Filter Types
// ═══════════════════════════════════════════════════════════

export interface MenuTemplateFilters {
  eventTypeId?: string;
  isActive?: boolean;
  date?: string; // Find templates valid on this date
  variant?: string;
  page?: number;
  perPage?: number;
}

export interface MenuOptionFilters {
  category?: string;
  isActive?: boolean;
  priceType?: PriceType;
  search?: string;
  page?: number;
  perPage?: number;
}

// ═══════════════════════════════════════════════════════════
// Validation Types
// ═══════════════════════════════════════════════════════════

export interface MenuValidationError {
  field: string;
  message: string;
  code: string;
}

export interface MenuTemplateValidation {
  isValid: boolean;
  errors: MenuValidationError[];
  warnings?: MenuValidationError[];
}

// ═══════════════════════════════════════════════════════════
// Price History Types
// ═══════════════════════════════════════════════════════════

export interface MenuPriceHistory {
  id: string;
  entityType: 'TEMPLATE' | 'PACKAGE' | 'OPTION';
  entityId: string;
  
  menuTemplateId?: string;
  packageId?: string;
  optionId?: string;
  
  fieldName: string;
  oldValue: Decimal;
  newValue: Decimal;
  changeReason?: string;
  
  effectiveFrom: Date;
  createdAt: Date;
}

export interface PriceChangeRequest {
  fieldName: string;
  newValue: number;
  changeReason?: string;
  effectiveFrom?: string; // ISO date, default now
}

// ═══════════════════════════════════════════════════════════
// Statistics Types
// ═══════════════════════════════════════════════════════════

export interface MenuStatistics {
  totalTemplates: number;
  activeTemplates: number;
  totalPackages: number;
  totalOptions: number;
  
  // By event type
  byEventType: {
    eventTypeId: string;
    eventTypeName: string;
    templateCount: number;
    packageCount: number;
  }[];
  
  // Most popular
  mostPopularPackages: {
    packageId: string;
    packageName: string;
    selectionCount: number;
  }[];
  
  mostPopularOptions: {
    optionId: string;
    optionName: string;
    category: string;
    selectionCount: number;
  }[];
}

// ═══════════════════════════════════════════════════════════
// Helper Types
// ═══════════════════════════════════════════════════════════

export type MenuEntityType = 'template' | 'package' | 'option';

export interface MenuBulkOperation {
  operation: 'activate' | 'deactivate' | 'delete';
  entityType: MenuEntityType;
  entityIds: string[];
}

export interface MenuExportData {
  templates: MenuTemplate[];
  packages: MenuPackage[];
  options: MenuOption[];
  packageOptions: MenuPackageOption[];
  exportedAt: string;
  version: string;
}

// ═══════════════════════════════════════════════════════════
// Client-Side Types (Frontend)
// ═══════════════════════════════════════════════════════════

export interface MenuSelectionState {
  selectedPackage?: MenuPackage;
  selectedOptions: Map<string, { option: MenuOption; quantity: number }>;
  calculatedPrice: {
    packageTotal: number;
    optionsTotal: number;
    grandTotal: number;
  };
}

export interface MenuCategory {
  name: string;
  icon?: string;
  displayOrder: number;
  options: MenuOption[];
}
