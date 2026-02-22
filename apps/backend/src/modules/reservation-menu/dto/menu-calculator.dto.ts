/**
 * Menu Calculator DTOs
 * 
 * Data Transfer Objects for menu price calculation
 */

import { IsUUID, IsInt, Min, IsArray, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SelectedOptionDto {
  /** Menu option ID */
  @IsUUID()
  optionId!: string;

  /** Quantity of this option (minimum: 1, default: 1) */
  @IsInt()
  @Min(1)
  quantity: number = 1;

  /** Custom price override */
  @IsOptional()
  @IsNumber()
  customPrice?: number;
}

export class MenuCalculatorRequestDto {
  /** Menu package ID */
  @IsUUID()
  packageId!: string;

  /** Number of adults (minimum: 0, default: 0) */
  @IsInt()
  @Min(0)
  adults!: number;

  /** Number of children (minimum: 0, default: 0) */
  @IsInt()
  @Min(0)
  children!: number;

  /** Number of toddlers (minimum: 0, default: 0) */
  @IsInt()
  @Min(0)
  toddlers!: number;

  /** Selected menu options */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedOptionDto)
  selectedOptions?: SelectedOptionDto[];
}

export class PriceBreakdownDto {
  /** Price per adult */
  pricePerAdult!: number;

  /** Price per child */
  pricePerChild!: number;

  /** Price per toddler */
  pricePerToddler!: number;

  /** Number of adults */
  adultsCount!: number;

  /** Number of children */
  childrenCount!: number;

  /** Number of toddlers */
  toddlersCount!: number;

  /** Subtotal for adults */
  adultsSubtotal!: number;

  /** Subtotal for children */
  childrenSubtotal!: number;

  /** Subtotal for toddlers */
  toddlersSubtotal!: number;

  /** Total package price */
  packageTotal!: number;
}

export class OptionPriceDetailDto {
  /** Option ID */
  optionId!: string;

  /** Option name */
  name!: string;

  /** Option category */
  category!: string;

  /** Price type (PER_PERSON, PER_ADULT, PER_CHILD, FLAT_FEE) */
  priceType!: string;

  /** Base price amount */
  priceAmount!: number;

  /** Quantity selected */
  quantity!: number;

  /** Calculated price for this option */
  calculatedPrice!: number;
}

export class MenuCalculatorResponseDto {
  /** Package ID */
  packageId!: string;

  /** Package name */
  packageName!: string;

  /** Package price breakdown */
  priceBreakdown!: PriceBreakdownDto;

  /** Options price details */
  optionsDetails!: OptionPriceDetailDto[];

  /** Total options price */
  optionsTotal!: number;

  /** Total guests count */
  totalGuests!: number;

  /** Grand total price (package + options) */
  grandTotal!: number;

  /** Average price per guest */
  averagePerGuest!: number;

  /** Validation warnings */
  warnings?: string[];
}
