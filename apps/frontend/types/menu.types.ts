/**
 * Menu System Types
 */

export interface MenuTemplate {
  id: string;
  eventTypeId: string;
  name: string;
  description: string;
  variant: string;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  packages: MenuPackage[];
  eventType?: {
    id: string;
    name: string;
  };
}

export interface MenuPackage {
  id: string;
  menuTemplateId?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  pricePerAdult: string;
  pricePerChild: string;
  pricePerToddler?: string;
  color?: string;
  icon?: string;
  badgeText?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  includedItems?: string[];
  minGuests?: number;
  maxGuests?: number;
}

export type MenuOptionCategory = 'CULINARY' | 'BEVERAGES' | 'DECORATIONS' | 'ENTERTAINMENT' | 'SERVICES';
export type MenuOptionPriceType = 'PER_PERSON' | 'PER_ADULT' | 'PER_CHILD' | 'FLAT_FEE' | 'FREE';

export interface MenuOption {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: MenuOptionCategory;
  priceType: MenuOptionPriceType;
  priceAmount: string;
  allowMultiple: boolean;
  maxQuantity: number;
  icon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface GuestCounts {
  adults: number;
  children: number;
  toddlers: number;
}

export interface ReservationMenu {
  id: string;
  reservationId: string;
  packageId: string;
  selectedOptions: string[];
  guestCounts: GuestCounts;
  totalPrice: number;
  package: MenuPackage;
  options: MenuOption[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuCalculation {
  packageCost: number;
  optionsCost: number;
  totalCost: number;
  breakdown: {
    adults: number;
    children: number;
    toddlers: number;
  };
}

export interface MenuSelectionData {
  packageId: string;
  selectedOptions: string[];
  guestCounts: GuestCounts;
}
