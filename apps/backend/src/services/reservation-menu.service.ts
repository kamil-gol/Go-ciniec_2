/**
 * Reservation Menu Service
 * Handles menu selection for reservations
 * UPDATED: Added recalculateForGuestChange for Phase C integration
 * FIX: formatMenuResponse now exposes menuTemplateId + packageId from DB columns
 * Updated: Phase 3 Audit — logChange() for menu selection, recalculation, removal
 * 🇵🇱 Spolonizowany — komunikaty błędów z i18n/pl.ts
 * Updated: #166 — portionTarget saved in menu snapshot per category
 *
 * NOTE: MenuOption model removed from Prisma.
 * Options are now passed via input data, no DB lookup for MenuOption.
 */

import { Prisma, ReservationMenuSnapshot } from '@/prisma-client';
import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import { logChange } from '../utils/audit-logger';
import { RESERVATION, MENU, MENU_SELECTION } from '../i18n/pl';
import {
  MenuSelectionInput,
  CategorySelectionDTO,
  DishSelectionDTO,
  SelectedOptionDTO,
  MenuSnapshotData,
} from '../dto/menu-selection.dto';

/** Shape of menuPackage with included relations as queried in selectMenu */
interface MenuPackageWithRelations {
  id: string;
  menuTemplateId: string;
  name: string;
  description: string | null;
  pricePerAdult: Prisma.Decimal;
  pricePerChild: Prisma.Decimal;
  pricePerToddler: Prisma.Decimal;
  menuTemplate: { name: string; eventType: unknown };
  categorySettings: CategorySettingWithRelations[];
}

interface CategorySettingWithRelations {
  categoryId: string;
  minSelect: Prisma.Decimal;
  maxSelect: Prisma.Decimal;
  isRequired: boolean;
  isEnabled: boolean;
  portionTarget: string;
  category: {
    name: string;
    dishes: Array<{ id: string; name: string; description: string | null; allergens: string[]; isActive: boolean }>;
  };
}

/** Response shape returned by formatMenuResponse */
interface MenuResponse {
  snapshot: {
    id: string;
    reservationId: string;
    menuData: MenuSnapshotData;
    menuTemplateId: string | null;
    packageId: string | null;
    adultsCount: number;
    childrenCount: number;
    toddlersCount: number;
    snapshotDate: string;
    createdAt: string;
    updatedAt: string;
  };
  priceBreakdown: {
    packageCost: {
      adults: { count: number; priceEach: number; total: number };
      children: { count: number; priceEach: number; total: number };
      toddlers: { count: number; priceEach: number; total: number };
      subtotal: number;
    };
    optionsCost: Array<{
      option: string;
      priceType: string;
      priceEach: number;
      quantity: number;
      total: number;
    }>;
    optionsSubtotal: number;
    totalMenuPrice: number;
  };
}

class ReservationMenuService {
  async selectMenu(reservationId: string, input: MenuSelectionInput, userId?: string): Promise<MenuResponse> {
    console.log('[ReservationMenu] Selecting menu for reservation:', reservationId);

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { eventType: true, client: true }
    });
    if (!reservation) throw new AppError(RESERVATION.NOT_FOUND, 404);

    const adults = input.adults ?? reservation.adults;
    const children = input.children ?? reservation.children;
    const toddlers = input.toddlers ?? reservation.toddlers;

    const menuPackage = await prisma.menuPackage.findUnique({
      where: { id: input.packageId },
      include: {
        menuTemplate: { include: { eventType: true } },
        categorySettings: {
          where: { isEnabled: true },
          include: { category: { include: { dishes: { where: { isActive: true } } } } },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
    if (!menuPackage) throw new AppError(MENU.PACKAGE_NOT_FOUND, 404);

    const typedPackage = menuPackage as unknown as MenuPackageWithRelations;

    if (input.dishSelections && input.dishSelections.length > 0) {
      await this.validateDishSelections(input.dishSelections, typedPackage.categorySettings);
    }

    const selectedOptions: SelectedOptionDTO[] = input.selectedOptions || [];

    // Check if existing snapshot exists (for audit: new vs update)
    const existingSnapshot = await prisma.reservationMenuSnapshot.findUnique({ where: { reservationId } });
    const isNewSelection = !existingSnapshot;

    const snapshot = await this.buildMenuSnapshot(typedPackage, input.dishSelections || [], selectedOptions, adults, children, toddlers);
    const packagePrice = this.calculatePackagePrice(typedPackage, adults, children, toddlers);
    const optionsPrice = this.calculateOptionsPrice(selectedOptions, adults + children + toddlers);
    const totalMenuPrice = packagePrice + optionsPrice;

    const menuSnapshot = await prisma.reservationMenuSnapshot.upsert({
      where: { reservationId },
      create: {
        reservationId, menuData: snapshot as unknown as Prisma.InputJsonValue,
        menuTemplateId: typedPackage.menuTemplateId, packageId: typedPackage.id,
        packagePrice, optionsPrice, totalMenuPrice,
        adultsCount: adults, childrenCount: children, toddlersCount: toddlers
      },
      update: {
        menuData: snapshot as unknown as Prisma.InputJsonValue,
        menuTemplateId: typedPackage.menuTemplateId, packageId: typedPackage.id,
        packagePrice, optionsPrice, totalMenuPrice,
        adultsCount: adults, childrenCount: children, toddlersCount: toddlers,
        updatedAt: new Date()
      }
    });

    // Audit log — MENU_SELECTED
    const clientName = reservation.client
      ? `${reservation.client.firstName} ${reservation.client.lastName}`
      : 'N/A';
    await logChange({
      userId: userId || null,
      action: 'MENU_SELECTED',
      entityType: 'RESERVATION',
      entityId: reservationId,
      details: {
        description: `Menu ${isNewSelection ? 'wybrane' : 'zmienione'}: ${typedPackage.name} (${totalMenuPrice} PLN) | ${clientName}`,
        isNewSelection,
        packageName: typedPackage.name,
        templateName: typedPackage.menuTemplate.name,
        packagePrice,
        optionsPrice,
        totalMenuPrice,
        guests: { adults, children, toddlers },
        dishSelectionsCount: input.dishSelections?.length || 0,
        optionsCount: selectedOptions.length,
      },
    });

    return this.formatMenuResponse(menuSnapshot, adults, children, toddlers);
  }

  /**
   * Recalculate menu prices when guest counts change.
   * Reuses existing snapshot (same package, dishes, options) but
   * recalculates all prices with new guest counts.
   *
   * Called automatically from reservation.service.ts when guests are updated.
   * Returns the new totalMenuPrice for the reservation to use.
   */
  async recalculateForGuestChange(
    reservationId: string,
    newAdults: number,
    newChildren: number,
    newToddlers: number,
    userId?: string
  ): Promise<{ totalMenuPrice: number; packagePrice: number; optionsPrice: number } | null> {
    const existingSnapshot = await prisma.reservationMenuSnapshot.findUnique({
      where: { reservationId }
    });

    if (!existingSnapshot) return null;

    const menuData = existingSnapshot.menuData as unknown as MenuSnapshotData;
    if (!menuData) return null;

    // Save old values for audit
    const oldPackagePrice = Number(existingSnapshot.packagePrice);
    const oldOptionsPrice = Number(existingSnapshot.optionsPrice);
    const oldTotalPrice = Number(existingSnapshot.totalMenuPrice);
    const oldGuests = {
      adults: existingSnapshot.adultsCount,
      children: existingSnapshot.childrenCount,
      toddlers: existingSnapshot.toddlersCount,
    };

    // Recalculate package price using stored per-person prices
    const pricePerAdult = menuData.pricePerAdult || 0;
    const pricePerChild = menuData.pricePerChild || 0;
    const pricePerToddler = menuData.pricePerToddler || 0;
    const packagePrice = (newAdults * pricePerAdult) + (newChildren * pricePerChild) + (newToddlers * pricePerToddler);

    // Recalculate options price with new total guests
    const newTotalGuests = newAdults + newChildren + newToddlers;
    let optionsPrice = 0;
    if (menuData.selectedOptions && menuData.selectedOptions.length > 0) {
      for (const opt of menuData.selectedOptions) {
        const price = opt.priceAmount || 0;
        const quantity = opt.quantity || 1;
        if (opt.priceUnit === 'PER_PERSON') {
          optionsPrice += price * newTotalGuests * quantity;
        } else {
          // FLAT price — not affected by guest count
          optionsPrice += price * quantity;
        }
      }
    }

    const totalMenuPrice = packagePrice + optionsPrice;

    // Update snapshot data with new guest counts
    const updatedMenuData: MenuSnapshotData = {
      ...menuData,
      adults: newAdults,
      children: newChildren,
      toddlers: newToddlers,
      prices: {
        ...menuData.prices,
        packageTotal: packagePrice,
        optionsTotal: optionsPrice,
        total: totalMenuPrice
      }
    };

    // Update snapshot in DB
    await prisma.reservationMenuSnapshot.update({
      where: { reservationId },
      data: {
        menuData: updatedMenuData as unknown as Prisma.InputJsonValue,
        packagePrice,
        optionsPrice,
        totalMenuPrice,
        adultsCount: newAdults,
        childrenCount: newChildren,
        toddlersCount: newToddlers,
        updatedAt: new Date()
      }
    });

    console.log(`[ReservationMenu] Recalculated prices for ${reservationId}: guests=${newTotalGuests}, package=${packagePrice}, options=${optionsPrice}, total=${totalMenuPrice}`);

    // Audit log — MENU_RECALCULATED
    if (oldTotalPrice !== totalMenuPrice) {
      await logChange({
        userId: userId || null,
        action: 'MENU_RECALCULATED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          /* istanbul ignore next -- packageName always present in snapshot data */
          description: `Menu przeliczone (zmiana gości): ${oldTotalPrice} PLN → ${totalMenuPrice} PLN | ${menuData.packageName || 'N/A'}`,
          /* istanbul ignore next */
          packageName: menuData.packageName || null,
          oldGuests,
          newGuests: { adults: newAdults, children: newChildren, toddlers: newToddlers },
          oldPrice: { package: oldPackagePrice, options: oldOptionsPrice, total: oldTotalPrice },
          newPrice: { package: packagePrice, options: optionsPrice, total: totalMenuPrice },
        },
      });
    }

    return { totalMenuPrice, packagePrice, optionsPrice };
  }

  async getReservationMenu(reservationId: string): Promise<MenuResponse> {
    const snapshot = await prisma.reservationMenuSnapshot.findUnique({ where: { reservationId } });
    if (!snapshot) throw new AppError(MENU_SELECTION.NOT_SELECTED, 404);
    return this.formatMenuResponse(snapshot, snapshot.adultsCount, snapshot.childrenCount, snapshot.toddlersCount);
  }

  async updateMenu(reservationId: string, input: MenuSelectionInput, userId?: string): Promise<MenuResponse> {
    return this.selectMenu(reservationId, input, userId);
  }

  async removeMenu(reservationId: string, userId?: string): Promise<void> {
    // Get snapshot info before deletion for audit
    const snapshot = await prisma.reservationMenuSnapshot.findUnique({
      where: { reservationId },
    });

    await prisma.reservationMenuSnapshot.delete({ where: { reservationId } });

    // Audit log — MENU_DIRECT_REMOVED
    if (snapshot) {
      const menuData = snapshot.menuData as unknown as MenuSnapshotData | null;
      await logChange({
        userId: userId || null,
        action: 'MENU_DIRECT_REMOVED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          /* istanbul ignore next -- menuData always has packageName */
          description: `Menu usunięte (bezpośrednio): ${menuData?.packageName || 'N/A'} (${Number(snapshot.totalMenuPrice)} PLN)`,
          /* istanbul ignore next */
          packageName: menuData?.packageName || null,
          totalMenuPrice: Number(snapshot.totalMenuPrice),
          packagePrice: Number(snapshot.packagePrice),
          optionsPrice: Number(snapshot.optionsPrice),
        },
      });
    }
  }

  // ═══════════════════════════ PRIVATE HELPERS ═══════════════════════════

  private async validateDishSelections(dishSelections: CategorySelectionDTO[], categorySettings: CategorySettingWithRelations[]): Promise<void> {
    const errors: string[] = [];
    for (const categorySetting of categorySettings) {
      const selection = dishSelections.find(s => s.categoryId === categorySetting.categoryId);
      const totalQuantity = selection ? selection.dishes.reduce((sum: number, d: DishSelectionDTO) => sum + d.quantity, 0) : 0;
      const minSelect = parseFloat(categorySetting.minSelect.toString());
      const maxSelect = parseFloat(categorySetting.maxSelect.toString());
      if (categorySetting.isRequired && totalQuantity < minSelect) {
        errors.push(MENU_SELECTION.CATEGORY_MIN(categorySetting.category.name, minSelect, totalQuantity));
      }
      if (totalQuantity > maxSelect) {
        errors.push(MENU_SELECTION.CATEGORY_MAX(categorySetting.category.name, maxSelect, totalQuantity));
      }
    }
    if (errors.length > 0) throw new AppError(`${MENU_SELECTION.VALIDATION_FAILED}: ${errors.join('; ')}`, 400);
  }

  /**
   * Build menu snapshot data including dish selections and options.
   * #166: Now includes portionTarget per category from PackageCategorySettings.
   */
  private async buildMenuSnapshot(
    menuPackage: MenuPackageWithRelations, dishSelections: CategorySelectionDTO[],
    selectedOptions: SelectedOptionDTO[], adults: number, children: number, toddlers: number
  ): Promise<MenuSnapshotData> {
    const enrichedDishSelections = await Promise.all(
      dishSelections.map(async (catSelection) => {
        const categorySetting = menuPackage.categorySettings.find((cs: CategorySettingWithRelations) => cs.categoryId === catSelection.categoryId);
        if (!categorySetting) return null;
        const dishIds = catSelection.dishes.map((d: DishSelectionDTO) => d.dishId);
        const dishes = await prisma.dish.findMany({ where: { id: { in: dishIds }, isActive: true } });
        return {
          categoryId: catSelection.categoryId,
          categoryName: categorySetting.category.name,
          portionTarget: (categorySetting.portionTarget || 'ALL') as 'ALL' | 'ADULTS_ONLY' | 'CHILDREN_ONLY', // #166
          dishes: catSelection.dishes.map((dishSel: DishSelectionDTO) => {
            const dish = dishes.find(d => d.id === dishSel.dishId);
            return {
              /* istanbul ignore next -- dish always found from DB query */
              dishId: dishSel.dishId, dishName: dish?.name || MENU_SELECTION.UNKNOWN_DISH,
              description: dish?.description, quantity: dishSel.quantity,
              /* istanbul ignore next */
              allergens: dish?.allergens || []
            };
          })
        };
      })
    );

    return {
      packageId: menuPackage.id, packageName: menuPackage.name,
      packageDescription: menuPackage.description || undefined,
      pricePerAdult: parseFloat(menuPackage.pricePerAdult.toString()),
      pricePerChild: parseFloat(menuPackage.pricePerChild.toString()),
      pricePerToddler: parseFloat(menuPackage.pricePerToddler.toString()),
      adults, children, toddlers,
      dishSelections: enrichedDishSelections.filter((s): s is NonNullable<typeof s> => s !== null),
      selectedOptions: selectedOptions.map((selOpt: SelectedOptionDTO) => ({
        optionId: selOpt.optionId,
        optionName: selOpt.name || MENU_SELECTION.UNKNOWN_OPTION,
        category: selOpt.category || '',
        quantity: selOpt.quantity,
        priceAmount: selOpt.priceAmount || 0,
        priceUnit: selOpt.priceType || 'FLAT'
      })),
      prices: {
        packageTotal: this.calculatePackagePrice(menuPackage, adults, children, toddlers),
        optionsTotal: this.calculateOptionsPrice(selectedOptions, adults + children + toddlers),
        total: 0
      },
      createdAt: new Date().toISOString()
    };
  }

  private calculatePackagePrice(menuPackage: MenuPackageWithRelations, adults: number, children: number, toddlers: number): number {
    return adults * parseFloat(menuPackage.pricePerAdult.toString()) +
      children * parseFloat(menuPackage.pricePerChild.toString()) +
      toddlers * parseFloat(menuPackage.pricePerToddler.toString());
  }

  private calculateOptionsPrice(selectedOptions: SelectedOptionDTO[], totalGuests: number): number {
    return selectedOptions.reduce((total: number, selOpt: SelectedOptionDTO) => {
      const price = selOpt.priceAmount || 0;
      const priceType = selOpt.priceType || 'FLAT';
      if (priceType === 'PER_PERSON') return total + price * totalGuests * selOpt.quantity;
      if (priceType === 'FLAT') return total + price * selOpt.quantity;
      return total;
    }, 0);
  }

  private formatMenuResponse(snapshot: ReservationMenuSnapshot, adults: number, children: number, toddlers: number): MenuResponse {
    const menuData = snapshot.menuData as unknown as MenuSnapshotData;
    return {
      snapshot: {
        id: snapshot.id,
        reservationId: snapshot.reservationId,
        menuData,
        menuTemplateId: snapshot.menuTemplateId,
        packageId: snapshot.packageId,
        adultsCount: snapshot.adultsCount,
        childrenCount: snapshot.childrenCount,
        toddlersCount: snapshot.toddlersCount,
        snapshotDate: snapshot.selectedAt.toISOString(),
        createdAt: snapshot.selectedAt.toISOString(),
        updatedAt: snapshot.updatedAt.toISOString()
      },
      priceBreakdown: {
        packageCost: {
          adults: { count: snapshot.adultsCount, priceEach: menuData.pricePerAdult, total: snapshot.adultsCount * menuData.pricePerAdult },
          children: { count: snapshot.childrenCount, priceEach: menuData.pricePerChild, total: snapshot.childrenCount * menuData.pricePerChild },
          toddlers: { count: snapshot.toddlersCount, priceEach: menuData.pricePerToddler, total: snapshot.toddlersCount * menuData.pricePerToddler },
          subtotal: parseFloat(snapshot.packagePrice.toString())
        },
        /* istanbul ignore next -- selectedOptions always present in snapshot menuData */
        optionsCost: menuData.selectedOptions?.map((opt) => ({
          option: opt.optionName, priceType: opt.priceUnit, priceEach: opt.priceAmount,
          quantity: opt.quantity, total: opt.priceAmount * opt.quantity
        })) || [],
        optionsSubtotal: parseFloat(snapshot.optionsPrice.toString()),
        totalMenuPrice: parseFloat(snapshot.totalMenuPrice.toString())
      }
    };
  }
}

export default new ReservationMenuService();
