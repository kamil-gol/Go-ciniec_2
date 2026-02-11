// =============================================================================
// MENU TYPES
// =============================================================================

export interface MenuTemplate {
  id: string;
  eventTypeId: string;
  name: string;
  description?: string;
  variant?: string;
  validFrom?: string;
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

export interface EventType {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
}

export interface MenuPackage {
  id: string;
  menuTemplateId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  color?: string;
  icon?: string;
  badgeText?: string;
  displayOrder: number;
  isPopular: boolean;
  isRecommended: boolean;
  includedItems: string[];
  minGuests?: number;
  maxGuests?: number;
  createdAt: string;
  updatedAt: string;
  menuTemplate?: MenuTemplate;
  categorySettings?: CategorySetting[];
}

export interface DishCategory {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySetting {
  id: string;
  packageId: string;
  categoryId: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  isEnabled: boolean;
  displayOrder: number;
  customLabel?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: DishCategory;
}

export interface Dish {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  allergens: string[];
  isActive: boolean;
  displayOrder: number;
}

// =============================================================================
// DTOs (Data Transfer Objects)
// =============================================================================

export interface CreatePackageInput {
  menuTemplateId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: number;
  pricePerChild: number;
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
  categorySettings?: CategorySettingInput[];
}

export interface UpdatePackageInput extends Partial<CreatePackageInput> {}

export interface CategorySettingInput {
  categoryId: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  isEnabled: boolean;
  displayOrder: number;
  customLabel?: string;
}

export interface BulkUpdateCategorySettingsInput {
  settings: CategorySettingInput[];
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  page?: number;
  perPage?: number;
  total?: number;
}
