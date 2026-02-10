/**
 * Menu Calculator DTOs
 * 
 * Data Transfer Objects for menu price calculation
 */

import { IsUUID, IsInt, Min, IsArray, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SelectedOptionDto {
  @ApiProperty({ description: 'Menu option ID' })
  @IsUUID()
  optionId: string;

  @ApiProperty({ description: 'Quantity of this option', minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number = 1;

  @ApiPropertyOptional({ description: 'Custom price override' })
  @IsOptional()
  @IsNumber()
  customPrice?: number;
}

export class MenuCalculatorRequestDto {
  @ApiProperty({ description: 'Menu package ID' })
  @IsUUID()
  packageId: string;

  @ApiProperty({ description: 'Number of adults', minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  adults: number;

  @ApiProperty({ description: 'Number of children', minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  children: number;

  @ApiProperty({ description: 'Number of toddlers', minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  toddlers: number;

  @ApiPropertyOptional({ description: 'Selected menu options', type: [SelectedOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedOptionDto)
  selectedOptions?: SelectedOptionDto[];
}

export class PriceBreakdownDto {
  @ApiProperty({ description: 'Price per adult' })
  pricePerAdult: number;

  @ApiProperty({ description: 'Price per child' })
  pricePerChild: number;

  @ApiProperty({ description: 'Price per toddler' })
  pricePerToddler: number;

  @ApiProperty({ description: 'Number of adults' })
  adultsCount: number;

  @ApiProperty({ description: 'Number of children' })
  childrenCount: number;

  @ApiProperty({ description: 'Number of toddlers' })
  toddlersCount: number;

  @ApiProperty({ description: 'Subtotal for adults' })
  adultsSubtotal: number;

  @ApiProperty({ description: 'Subtotal for children' })
  childrenSubtotal: number;

  @ApiProperty({ description: 'Subtotal for toddlers' })
  toddlersSubtotal: number;

  @ApiProperty({ description: 'Total package price' })
  packageTotal: number;
}

export class OptionPriceDetailDto {
  @ApiProperty({ description: 'Option ID' })
  optionId: string;

  @ApiProperty({ description: 'Option name' })
  name: string;

  @ApiProperty({ description: 'Option category' })
  category: string;

  @ApiProperty({ description: 'Price type (PER_PERSON, PER_ADULT, PER_CHILD, FLAT_FEE)' })
  priceType: string;

  @ApiProperty({ description: 'Base price amount' })
  priceAmount: number;

  @ApiProperty({ description: 'Quantity selected' })
  quantity: number;

  @ApiProperty({ description: 'Calculated price for this option' })
  calculatedPrice: number;
}

export class MenuCalculatorResponseDto {
  @ApiProperty({ description: 'Package ID' })
  packageId: string;

  @ApiProperty({ description: 'Package name' })
  packageName: string;

  @ApiProperty({ description: 'Package price breakdown', type: PriceBreakdownDto })
  priceBreakdown: PriceBreakdownDto;

  @ApiProperty({ description: 'Options price details', type: [OptionPriceDetailDto] })
  optionsDetails: OptionPriceDetailDto[];

  @ApiProperty({ description: 'Total options price' })
  optionsTotal: number;

  @ApiProperty({ description: 'Total guests count' })
  totalGuests: number;

  @ApiProperty({ description: 'Grand total price (package + options)' })
  grandTotal: number;

  @ApiProperty({ description: 'Average price per guest' })
  averagePerGuest: number;

  @ApiPropertyOptional({ description: 'Validation warnings', type: [String] })
  warnings?: string[];
}
