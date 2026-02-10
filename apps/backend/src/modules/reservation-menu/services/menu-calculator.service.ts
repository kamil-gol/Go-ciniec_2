/**
 * Menu Calculator Service
 * 
 * Calculates menu prices based on package and selected options
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  MenuCalculatorRequestDto,
  MenuCalculatorResponseDto,
  PriceBreakdownDto,
  OptionPriceDetailDto,
} from '../dto/menu-calculator.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MenuCalculatorService {
  constructor(private prisma: PrismaService) {}

  async calculateMenuPrice(
    dto: MenuCalculatorRequestDto,
  ): Promise<MenuCalculatorResponseDto> {
    // 1. Fetch package with template
    const menuPackage = await this.prisma.menuPackage.findUnique({
      where: { id: dto.packageId },
      include: {
        menuTemplate: {
          include: {
            eventType: true,
          },
        },
      },
    });

    if (!menuPackage) {
      throw new NotFoundException(`Menu package with ID ${dto.packageId} not found`);
    }

    // 2. Validate guest counts
    const totalGuests = dto.adults + dto.children + dto.toddlers;
    const warnings: string[] = [];

    if (totalGuests === 0) {
      throw new BadRequestException('At least one guest is required');
    }

    // Check min/max guests
    if (menuPackage.minGuests && totalGuests < menuPackage.minGuests) {
      warnings.push(
        `Package requires minimum ${menuPackage.minGuests} guests, but ${totalGuests} provided`,
      );
    }

    if (menuPackage.maxGuests && totalGuests > menuPackage.maxGuests) {
      warnings.push(
        `Package allows maximum ${menuPackage.maxGuests} guests, but ${totalGuests} provided`,
      );
    }

    // 3. Calculate package price breakdown
    const pricePerAdult = this.toNumber(menuPackage.pricePerAdult);
    const pricePerChild = this.toNumber(menuPackage.pricePerChild);
    const pricePerToddler = this.toNumber(menuPackage.pricePerToddler);

    const adultsSubtotal = pricePerAdult * dto.adults;
    const childrenSubtotal = pricePerChild * dto.children;
    const toddlersSubtotal = pricePerToddler * dto.toddlers;

    const packageTotal = adultsSubtotal + childrenSubtotal + toddlersSubtotal;

    const priceBreakdown: PriceBreakdownDto = {
      pricePerAdult,
      pricePerChild,
      pricePerToddler,
      adultsCount: dto.adults,
      childrenCount: dto.children,
      toddlersCount: dto.toddlers,
      adultsSubtotal,
      childrenSubtotal,
      toddlersSubtotal,
      packageTotal,
    };

    // 4. Calculate options prices
    let optionsTotal = 0;
    const optionsDetails: OptionPriceDetailDto[] = [];

    if (dto.selectedOptions && dto.selectedOptions.length > 0) {
      const optionIds = dto.selectedOptions.map((opt) => opt.optionId);

      const options = await this.prisma.menuOption.findMany({
        where: {
          id: { in: optionIds },
          isActive: true,
        },
      });

      for (const selectedOption of dto.selectedOptions) {
        const option = options.find((opt) => opt.id === selectedOption.optionId);

        if (!option) {
          warnings.push(`Option ${selectedOption.optionId} not found or inactive`);
          continue;
        }

        // Calculate price based on price type
        const basePrice = selectedOption.customPrice ?? this.toNumber(option.priceAmount);
        let calculatedPrice = 0;

        switch (option.priceType) {
          case 'PER_PERSON':
            calculatedPrice = basePrice * totalGuests * selectedOption.quantity;
            break;

          case 'PER_ADULT':
            calculatedPrice = basePrice * dto.adults * selectedOption.quantity;
            break;

          case 'PER_CHILD':
            calculatedPrice = basePrice * dto.children * selectedOption.quantity;
            break;

          case 'PER_GUEST_TYPE':
            // Apply different rates (adults full, children 50%, toddlers free)
            const adultPrice = basePrice * dto.adults;
            const childPrice = basePrice * 0.5 * dto.children;
            calculatedPrice = (adultPrice + childPrice) * selectedOption.quantity;
            break;

          case 'FLAT_FEE':
          default:
            calculatedPrice = basePrice * selectedOption.quantity;
            break;
        }

        optionsDetails.push({
          optionId: option.id,
          name: option.name,
          category: option.category,
          priceType: option.priceType,
          priceAmount: basePrice,
          quantity: selectedOption.quantity,
          calculatedPrice,
        });

        optionsTotal += calculatedPrice;
      }
    }

    // 5. Calculate grand total and averages
    const grandTotal = packageTotal + optionsTotal;
    const averagePerGuest = totalGuests > 0 ? grandTotal / totalGuests : 0;

    return {
      packageId: menuPackage.id,
      packageName: menuPackage.name,
      priceBreakdown,
      optionsDetails,
      optionsTotal,
      totalGuests,
      grandTotal: this.roundToTwo(grandTotal),
      averagePerGuest: this.roundToTwo(averagePerGuest),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Calculate price for a specific option
   */
  async calculateOptionPrice(
    optionId: string,
    guests: { adults: number; children: number; toddlers: number },
    quantity: number = 1,
  ): Promise<number> {
    const option = await this.prisma.menuOption.findUnique({
      where: { id: optionId },
    });

    if (!option || !option.isActive) {
      throw new NotFoundException(`Menu option ${optionId} not found or inactive`);
    }

    const basePrice = this.toNumber(option.priceAmount);
    const totalGuests = guests.adults + guests.children + guests.toddlers;
    let calculatedPrice = 0;

    switch (option.priceType) {
      case 'PER_PERSON':
        calculatedPrice = basePrice * totalGuests * quantity;
        break;

      case 'PER_ADULT':
        calculatedPrice = basePrice * guests.adults * quantity;
        break;

      case 'PER_CHILD':
        calculatedPrice = basePrice * guests.children * quantity;
        break;

      case 'PER_GUEST_TYPE':
        const adultPrice = basePrice * guests.adults;
        const childPrice = basePrice * 0.5 * guests.children;
        calculatedPrice = (adultPrice + childPrice) * quantity;
        break;

      case 'FLAT_FEE':
      default:
        calculatedPrice = basePrice * quantity;
        break;
    }

    return this.roundToTwo(calculatedPrice);
  }

  /**
   * Get available packages for date and event type
   */
  async getAvailablePackages(eventTypeId: string, date?: Date) {
    const whereClause: any = {
      menuTemplate: {
        eventTypeId,
        isActive: true,
      },
    };

    // Filter by date if provided
    if (date) {
      whereClause.menuTemplate.OR = [
        {
          validFrom: null,
          validTo: null,
        },
        {
          validFrom: { lte: date },
          validTo: { gte: date },
        },
        {
          validFrom: { lte: date },
          validTo: null,
        },
        {
          validFrom: null,
          validTo: { gte: date },
        },
      ];
    }

    return this.prisma.menuPackage.findMany({
      where: whereClause,
      include: {
        menuTemplate: {
          include: {
            eventType: true,
          },
        },
        _count: {
          select: {
            packageOptions: true,
          },
        },
      },
      orderBy: [
        { isPopular: 'desc' },
        { isRecommended: 'desc' },
        { displayOrder: 'asc' },
      ],
    });
  }

  // Helper methods
  private toNumber(decimal: Decimal): number {
    return parseFloat(decimal.toString());
  }

  private roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
  }
}
