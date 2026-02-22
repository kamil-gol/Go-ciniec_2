/**
 * Menu Calculator DTOs
 *
 * Data Transfer Objects for menu price calculation
 * Plain TypeScript interfaces — no external dependencies
 */

export interface SelectedOptionDto {
  /** Menu option ID */
  optionId: string;
  /** Quantity of this option (minimum: 1, default: 1) */
  quantity: number;
  /** Custom price override */
  customPrice?: number;
}

export interface MenuCalculatorRequestDto {
  /** Menu package ID */
  packageId: string;
  /** Number of adults (minimum: 0) */
  adults: number;
  /** Number of children (minimum: 0) */
  children: number;
  /** Number of toddlers (minimum: 0) */
  toddlers: number;
  /** Selected menu options */
  selectedOptions?: SelectedOptionDto[];
}

export interface PriceBreakdownDto {
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  adultsSubtotal: number;
  childrenSubtotal: number;
  toddlersSubtotal: number;
  packageTotal: number;
}

export interface OptionPriceDetailDto {
  optionId: string;
  name: string;
  category: string;
  /** Price type (PER_PERSON, PER_ADULT, PER_CHILD, FLAT_FEE) */
  priceType: string;
  priceAmount: number;
  quantity: number;
  calculatedPrice: number;
}

export interface MenuCalculatorResponseDto {
  packageId: string;
  packageName: string;
  priceBreakdown: PriceBreakdownDto;
  optionsDetails: OptionPriceDetailDto[];
  optionsTotal: number;
  totalGuests: number;
  grandTotal: number;
  averagePerGuest: number;
  warnings?: string[];
}
