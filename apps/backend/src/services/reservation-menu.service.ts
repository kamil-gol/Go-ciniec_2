/**
 * Reservation Menu Service
 * 
 * Handles menu selection for reservations:
 * - Validates dish selections against category min/max rules
 * - Creates menu snapshots with pricing
 * - Supports category-based dish selection
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  MenuSelectionInput,
  CategorySelectionDTO,
  MenuSnapshotData,
} from '../dto/menu-selection.dto';

const prisma = new PrismaClient();

class ReservationMenuService {
  /**
   * Select menu for reservation (POST)
   */
  async selectMenu(
    reservationId: string,
    input: MenuSelectionInput
  ): Promise<any> {
    console.log('[ReservationMenu] Selecting menu for reservation:', reservationId);

    // 1. Get reservation with guest counts
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        eventType: true,
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Use guest counts from input or reservation
    const adults = input.adults ?? reservation.adults;
    const children = input.children ?? reservation.children;
    const toddlers = input.toddlers ?? reservation.toddlers;

    // 2. Get package with category settings
    const menuPackage = await prisma.menuPackage.findUnique({
      where: { id: input.packageId },
      include: {
        menuTemplate: {
          include: {
            eventType: true,
          },
        },
        categorySettings: {
          where: { isEnabled: true },
          include: {
            category: {
              include: {
                dishes: {
                  where: { isActive: true },
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!menuPackage) {
      throw new Error('Menu package not found');
    }

    // 3. Validate dish selections against category rules
    if (input.dishSelections && input.dishSelections.length > 0) {
      await this.validateDishSelections(
        input.dishSelections,
        menuPackage.categorySettings
      );
    }

    // 4. Get selected options
    const selectedOptions = input.selectedOptions || [];
    const optionIds = selectedOptions.map(opt => opt.optionId);
    
    const options = optionIds.length > 0 ? await prisma.menuOption.findMany({
      where: {
        id: { in: optionIds },
        isActive: true,
      },
    }) : [];

    // 5. Build menu snapshot with dishSelections
    const snapshot = await this.buildMenuSnapshot(
      menuPackage,
      input.dishSelections || [],
      options,
      selectedOptions,
      adults,
      children,
      toddlers
    );

    // 6. Calculate prices
    const packagePrice = this.calculatePackagePrice(
      menuPackage,
      adults,
      children,
      toddlers
    );

    const optionsPrice = this.calculateOptionsPrice(
      options,
      selectedOptions,
      adults + children + toddlers
    );

    const totalMenuPrice = packagePrice + optionsPrice;

    // 7. Save or update snapshot
    const menuSnapshot = await prisma.reservationMenuSnapshot.upsert({
      where: { reservationId },
      create: {
        reservationId,
        menuData: snapshot as Prisma.InputJsonValue,
        menuTemplateId: menuPackage.menuTemplateId,
        packageId: menuPackage.id,
        packagePrice,
        optionsPrice,
        totalMenuPrice,
        adultsCount: adults,
        childrenCount: children,
        toddlersCount: toddlers,
      },
      update: {
        menuData: snapshot as Prisma.InputJsonValue,
        menuTemplateId: menuPackage.menuTemplateId,
        packageId: menuPackage.id,
        packagePrice,
        optionsPrice,
        totalMenuPrice,
        adultsCount: adults,
        childrenCount: children,
        toddlersCount: toddlers,
        updatedAt: new Date(),
      },
    });

    // 8. Return formatted response
    return this.formatMenuResponse(menuSnapshot, adults, children, toddlers);
  }

  /**
   * Get reservation menu (GET)
   */
  async getReservationMenu(reservationId: string): Promise<any> {
    const snapshot = await prisma.reservationMenuSnapshot.findUnique({
      where: { reservationId },
    });

    if (!snapshot) {
      throw new Error('Menu not selected for this reservation');
    }

    return this.formatMenuResponse(
      snapshot,
      snapshot.adultsCount,
      snapshot.childrenCount,
      snapshot.toddlersCount
    );
  }

  /**
   * Update menu selection (PUT)
   */
  async updateMenu(
    reservationId: string,
    input: MenuSelectionInput
  ): Promise<any> {
    // Reuse selectMenu logic (upsert handles both create and update)
    return this.selectMenu(reservationId, input);
  }

  /**
   * Remove menu selection (DELETE)
   */
  async removeMenu(reservationId: string): Promise<void> {
    await prisma.reservationMenuSnapshot.delete({
      where: { reservationId },
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * Validate dish selections against category min/max rules
   */
  private async validateDishSelections(
    dishSelections: CategorySelectionDTO[],
    categorySettings: any[]
  ): Promise<void> {
    const errors: string[] = [];

    for (const categorySetting of categorySettings) {
      const selection = dishSelections.find(
        s => s.categoryId === categorySetting.categoryId
      );

      const totalQuantity = selection
        ? selection.dishes.reduce((sum, d) => sum + d.quantity, 0)
        : 0;

      const minSelect = parseFloat(categorySetting.minSelect.toString());
      const maxSelect = parseFloat(categorySetting.maxSelect.toString());

      if (categorySetting.isRequired && totalQuantity < minSelect) {
        errors.push(
          `Category "${categorySetting.category.name}" requires minimum ${minSelect} selections (got ${totalQuantity})`
        );
      }

      if (totalQuantity > maxSelect) {
        errors.push(
          `Category "${categorySetting.category.name}" allows maximum ${maxSelect} selections (got ${totalQuantity})`
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(`Menu selection validation failed: ${errors.join('; ')}`);
    }
  }

  /**
   * Build menu snapshot with full data
   */
  private async buildMenuSnapshot(
    menuPackage: any,
    dishSelections: CategorySelectionDTO[],
    options: any[],
    selectedOptions: any[],
    adults: number,
    children: number,
    toddlers: number
  ): Promise<MenuSnapshotData> {
    // Enrich dishSelections with full dish data
    const enrichedDishSelections = await Promise.all(
      dishSelections.map(async (catSelection) => {
        const categorySetting = menuPackage.categorySettings.find(
          (cs: any) => cs.categoryId === catSelection.categoryId
        );

        if (!categorySetting) {
          return null;
        }

        const dishIds = catSelection.dishes.map(d => d.dishId);
        const dishes = await prisma.dish.findMany({
          where: {
            id: { in: dishIds },
            isActive: true,
          },
        });

        return {
          categoryId: catSelection.categoryId,
          categoryName: categorySetting.category.name,
          dishes: catSelection.dishes.map(dishSel => {
            const dish = dishes.find(d => d.id === dishSel.dishId);
            return {
              dishId: dishSel.dishId,
              dishName: dish?.name || 'Unknown dish',
              description: dish?.description,
              quantity: dishSel.quantity,
              allergens: dish?.allergens || [],
            };
          }),
        };
      })
    );

    // Filter out null entries
    const validDishSelections = enrichedDishSelections.filter(Boolean);

    return {
      packageId: menuPackage.id,
      packageName: menuPackage.name,
      packageDescription: menuPackage.description || undefined,
      pricePerAdult: parseFloat(menuPackage.pricePerAdult.toString()),
      pricePerChild: parseFloat(menuPackage.pricePerChild.toString()),
      pricePerToddler: parseFloat(menuPackage.pricePerToddler.toString()),
      adults,
      children,
      toddlers,
      dishSelections: validDishSelections as any,
      selectedOptions: selectedOptions.map(selOpt => {
        const option = options.find(o => o.id === selOpt.optionId);
        return {
          optionId: selOpt.optionId,
          optionName: option?.name || 'Unknown option',
          category: option?.category || '',
          quantity: selOpt.quantity,
          priceAmount: parseFloat(option?.priceAmount.toString() || '0'),
          priceUnit: option?.priceType || 'FLAT',
        };
      }),
      prices: {
        packageTotal: this.calculatePackagePrice(menuPackage, adults, children, toddlers),
        optionsTotal: this.calculateOptionsPrice(options, selectedOptions, adults + children + toddlers),
        total: 0, // Will be calculated
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate package price
   */
  private calculatePackagePrice(
    menuPackage: any,
    adults: number,
    children: number,
    toddlers: number
  ): number {
    const adultPrice = parseFloat(menuPackage.pricePerAdult.toString());
    const childPrice = parseFloat(menuPackage.pricePerChild.toString());
    const toddlerPrice = parseFloat(menuPackage.pricePerToddler.toString());

    return adults * adultPrice + children * childPrice + toddlers * toddlerPrice;
  }

  /**
   * Calculate options price
   */
  private calculateOptionsPrice(
    options: any[],
    selectedOptions: any[],
    totalGuests: number
  ): number {
    return selectedOptions.reduce((total, selOpt) => {
      const option = options.find(o => o.id === selOpt.optionId);
      if (!option) return total;

      const price = parseFloat(option.priceAmount.toString());

      if (option.priceType === 'PER_PERSON') {
        return total + price * totalGuests * selOpt.quantity;
      } else if (option.priceType === 'FLAT') {
        return total + price * selOpt.quantity;
      }

      return total;
    }, 0);
  }

  /**
   * Format menu response
   */
  private formatMenuResponse(
    snapshot: any,
    adults: number,
    children: number,
    toddlers: number
  ): any {
    const menuData = snapshot.menuData as MenuSnapshotData;

    return {
      snapshot: {
        id: snapshot.id,
        reservationId: snapshot.reservationId,
        menuData,
        adultsCount: snapshot.adultsCount,
        childrenCount: snapshot.childrenCount,
        toddlersCount: snapshot.toddlersCount,
        snapshotDate: snapshot.selectedAt.toISOString(),
        createdAt: snapshot.selectedAt.toISOString(),
        updatedAt: snapshot.updatedAt.toISOString(),
      },
      priceBreakdown: {
        packageCost: {
          adults: {
            count: snapshot.adultsCount,
            priceEach: menuData.pricePerAdult,
            total: snapshot.adultsCount * menuData.pricePerAdult,
          },
          children: {
            count: snapshot.childrenCount,
            priceEach: menuData.pricePerChild,
            total: snapshot.childrenCount * menuData.pricePerChild,
          },
          toddlers: {
            count: snapshot.toddlersCount,
            priceEach: menuData.pricePerToddler,
            total: snapshot.toddlersCount * menuData.pricePerToddler,
          },
          subtotal: parseFloat(snapshot.packagePrice.toString()),
        },
        optionsCost: menuData.selectedOptions?.map(opt => ({
          option: opt.optionName,
          priceType: opt.priceUnit,
          priceEach: opt.priceAmount,
          quantity: opt.quantity,
          total: opt.priceAmount * opt.quantity,
        })) || [],
        optionsSubtotal: parseFloat(snapshot.optionsPrice.toString()),
        totalMenuPrice: parseFloat(snapshot.totalMenuPrice.toString()),
      },
    };
  }
}

export default new ReservationMenuService();
