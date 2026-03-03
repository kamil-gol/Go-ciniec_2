// apps/frontend/types/catering.types.ts

// ═══════════════════════════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════════════════════════

export type CateringPriceType = 'PER_PERSON' | 'FLAT' | 'TIERED';

export const CATERING_PRICE_TYPE_LABELS: Record<CateringPriceType, string> = {
  PER_PERSON: 'Za osobę',
  FLAT: 'Kwota stała',
  TIERED: 'Progi cenowe',
};

// ═══════════════════════════════════════════════════════════════
// Catering Template
// ═══════════════════════════════════════════════════════════════

export interface CateringTemplate {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  packages?: CateringPackage[];
}

export interface CreateCateringTemplateInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCateringTemplateInput {
  name?: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

// ═══════════════════════════════════════════════════════════════
// Catering Package
// ═══════════════════════════════════════════════════════════════

export interface CateringPackage {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  priceType: CateringPriceType;
  basePrice: number;
  tieredPricing: Record<string, unknown> | null;
  badgeText: string | null;
  isPopular: boolean;
  displayOrder: number;
  isActive: boolean;
  minGuests: number | null;
  maxGuests: number | null;
  createdAt: string;
  updatedAt: string;
  template?: CateringTemplate;
  sections?: CateringPackageSection[];
}

export interface CreateCateringPackageInput {
  name: string;
  basePrice: number;
  description?: string;
  shortDescription?: string;
  priceType?: CateringPriceType;
  tieredPricing?: Record<string, unknown>;
  badgeText?: string;
  isPopular?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  minGuests?: number;
  maxGuests?: number;
}

export interface UpdateCateringPackageInput {
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  priceType?: CateringPriceType;
  basePrice?: number;
  tieredPricing?: Record<string, unknown> | null;
  badgeText?: string | null;
  isPopular?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  minGuests?: number | null;
  maxGuests?: number | null;
}

// ═══════════════════════════════════════════════════════════════
// Catering Package Section
// ═══════════════════════════════════════════════════════════════

export interface DishCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  isActive: boolean;
}

export interface CateringSectionOption {
  id: string;
  sectionId: string;
  dishId: string;
  customPrice: number | null;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  dish?: Dish;
}

export interface CateringPackageSection {
  id: string;
  packageId: string;
  categoryId: string;
  name: string | null;
  description: string | null;
  minSelect: number;
  maxSelect: number | null;
  isRequired: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: DishCategory;
  options?: CateringSectionOption[];
}

export interface CreateCateringSectionInput {
  categoryId: string;
  name?: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  displayOrder?: number;
}

export interface UpdateCateringSectionInput {
  name?: string | null;
  description?: string | null;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  displayOrder?: number;
}

export interface CreateSectionOptionInput {
  dishId: string;
  customPrice?: number | null;
  isDefault?: boolean;
  displayOrder?: number;
}

export interface UpdateSectionOptionInput {
  customPrice?: number | null;
  isDefault?: boolean;
  displayOrder?: number;
}

// ═══════════════════════════════════════════════════════════════
// API Response wrappers
// ═══════════════════════════════════════════════════════════════

export interface CateringTemplatesResponse {
  success: boolean;
  data: CateringTemplate[];
  count: number;
}

export interface CateringTemplateResponse {
  success: boolean;
  data: CateringTemplate;
}

export interface CateringPackageResponse {
  success: boolean;
  data: CateringPackage;
}

export interface CateringSectionResponse {
  success: boolean;
  data: CateringPackageSection;
}

export interface CateringSectionOptionResponse {
  success: boolean;
  data: CateringSectionOption;
}
