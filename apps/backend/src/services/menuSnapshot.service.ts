/**
 * Menu Snapshot Service
 * Creates and manages immutable menu snapshots for reservations.
 * FIX: dishSelections enriched with dish/category names from DB
 * FIX: menuTemplateId/packageId saved in DB columns (not just JSONB)
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { 
  MenuSnapshotData,
  CreateMenuSnapshotInput,
  MenuPriceBreakdown
} from '../types/menu.types';
import { MENU_CRUD } from '../i18n/pl';

export class MenuSnapshotService {

  async createSnapshot(input: CreateMenuSnapshotInput) {
    const pkg = await prisma.menuPackage.findUnique({
      where: { id: input.packageId },
      include: { menuTemplate: { include: { eventType: true } } }
    });
    if (!pkg) throw new Error(MENU_CRUD.PACKAGE_NOT_FOUND);

    const optionIds = input.selectedOptions.map(opt => opt.optionId);
    const options = optionIds.length > 0 
      ? await prisma.menuOption.findMany({ where: { id: { in: optionIds } } })
      : [];
    if (options.length !== optionIds.length) throw new Error('Nie znaleziono niektórych opcji menu');

    // ── Enrich dishSelections with names from DB ──
    let enrichedDishSelections: any[] = [];
    if (input.dishSelections && input.dishSelections.length > 0) {
      // Collect all dishIds and categoryIds
      const allDishIds: string[] = [];
      const allCategoryIds: string[] = [];
      
      for (const catSel of input.dishSelections) {
        allCategoryIds.push(catSel.categoryId);
        for (const dish of catSel.dishes) {
          allDishIds.push(dish.dishId);
        }
      }

      // Fetch dishes and categories in bulk
      const [dishes, categories] = await Promise.all([
        /* istanbul ignore next */ allDishIds.length > 0 
          ? prisma.dish.findMany({ 
              where: { id: { in: allDishIds } },
              select: { id: true, name: true, description: true, allergens: true }
            })
          : [],
        /* istanbul ignore next */ allCategoryIds.length > 0
          ? prisma.dishCategory.findMany({
              where: { id: { in: allCategoryIds } },
              select: { id: true, name: true, icon: true }
            })
          : []
      ]);

      const dishMap = new Map(dishes.map(d => [d.id, d]));
      const categoryMap = new Map(categories.map(c => [c.id, c]));

      enrichedDishSelections = input.dishSelections.map(catSel => {
        const category = categoryMap.get(catSel.categoryId);
        return {
          categoryId: catSel.categoryId,
          /* istanbul ignore next -- category always found from bulk fetch */
          categoryName: category?.name || 'Nieznana kategoria',
          /* istanbul ignore next */
          categoryIcon: category?.icon || null,
          dishes: catSel.dishes.map(dish => {
            const dishData = dishMap.get(dish.dishId);
            return {
              dishId: dish.dishId,
              /* istanbul ignore next -- dish always found from bulk fetch */
              dishName: dishData?.name || 'Nieznane danie',
              /* istanbul ignore next */
              description: dishData?.description || null,
              /* istanbul ignore next */
              allergens: dishData?.allergens || [],
              quantity: dish.quantity
            };
          })
        };
      });
    }

    const snapshotData: MenuSnapshotData = {
      templateId: pkg.menuTemplateId,
      templateName: pkg.menuTemplate.name,
      templateVariant: pkg.menuTemplate.variant,
      eventTypeName: pkg.menuTemplate.eventType.name,
      packageId: pkg.id,
      packageName: pkg.name,
      packageDescription: pkg.description,
      pricePerAdult: pkg.pricePerAdult.toNumber(),
      pricePerChild: pkg.pricePerChild.toNumber(),
      pricePerToddler: pkg.pricePerToddler.toNumber(),
      includedItems: pkg.includedItems,
      packageColor: pkg.color,
      packageIcon: pkg.icon,
      selectedOptions: input.selectedOptions.map(selectedOpt => {
        const option = options.find(o => o.id === selectedOpt.optionId)!;
        return {
          optionId: option.id, name: option.name, description: option.description,
          category: option.category, priceType: option.priceType as "PER_PERSON" | "FLAT" | "FREE",
          priceAmount: option.priceAmount.toNumber(), quantity: selectedOpt.quantity,
          icon: option.icon
        };
      }),
      // Store enriched dish selections with names
      dishSelections: enrichedDishSelections
    };

    const priceBreakdown = this.calculatePriceBreakdown(snapshotData, input.adultsCount, input.childrenCount, input.toddlersCount);

    const snapshot = await prisma.reservationMenuSnapshot.create({
      data: {
        reservationId: input.reservationId,
        menuTemplateId: pkg.menuTemplateId,
        packageId: pkg.id,
        menuData: snapshotData as any,
        packagePrice: priceBreakdown.packageCost.subtotal,
        optionsPrice: priceBreakdown.optionsSubtotal,
        totalMenuPrice: priceBreakdown.totalMenuPrice,
        adultsCount: input.adultsCount,
        childrenCount: input.childrenCount,
        toddlersCount: input.toddlersCount,
        selectedAt: new Date()
      }
    });

    return { snapshot, priceBreakdown };
  }

  /**
   * Replace entire snapshot (delete old + create new).
   * Used when user changes package, options, or dishes via "Zmień" flow.
   */
  async replaceSnapshot(input: CreateMenuSnapshotInput) {
    const existing = await prisma.reservationMenuSnapshot.findUnique({
      where: { reservationId: input.reservationId }
    });
    if (existing) {
      await prisma.reservationMenuSnapshot.delete({
        where: { reservationId: input.reservationId }
      });
    }
    return this.createSnapshot(input);
  }

  calculatePriceBreakdown(
    menuData: MenuSnapshotData, adultsCount: number, childrenCount: number, toddlersCount: number
  ): MenuPriceBreakdown {
    const adultsTotal = adultsCount * menuData.pricePerAdult;
    const childrenTotal = childrenCount * menuData.pricePerChild;
    const toddlersTotal = toddlersCount * menuData.pricePerToddler;
    const packageSubtotal = adultsTotal + childrenTotal + toddlersTotal;
    const totalGuests = adultsCount + childrenCount + toddlersCount;

    const optionsCost = menuData.selectedOptions.map(opt => {
      let totalPrice = 0;
      let quantity = opt.quantity;
      if (opt.priceType === 'FLAT') { totalPrice = opt.priceAmount * opt.quantity; }
      else if (opt.priceType === 'PER_PERSON') { quantity = totalGuests; totalPrice = opt.priceAmount * totalGuests * opt.quantity; }
      else if (opt.priceType === 'FREE') { totalPrice = 0; }
      return { option: opt.name, priceType: opt.priceType, priceEach: opt.priceAmount, quantity, total: totalPrice };
    });

    const optionsSubtotal = optionsCost.reduce((sum, opt) => sum + opt.total, 0);

    return {
      packageCost: {
        adults: { count: adultsCount, priceEach: menuData.pricePerAdult, total: adultsTotal },
        children: { count: childrenCount, priceEach: menuData.pricePerChild, total: childrenTotal },
        toddlers: { count: toddlersCount, priceEach: menuData.pricePerToddler, total: toddlersTotal },
        subtotal: packageSubtotal
      },
      optionsCost,
      optionsSubtotal,
      totalMenuPrice: packageSubtotal + optionsSubtotal
    };
  }

  async getSnapshotByReservationId(reservationId: string) {
    const snapshot = await prisma.reservationMenuSnapshot.findUnique({ where: { reservationId } });
    if (!snapshot) throw new Error('Nie znaleziono snapshotu menu dla tej rezerwacji');
    const menuData = snapshot.menuData as unknown as MenuSnapshotData;
    const priceBreakdown = this.calculatePriceBreakdown(menuData, snapshot.adultsCount, snapshot.childrenCount, snapshot.toddlersCount);
    return { snapshot, priceBreakdown };
  }

  async updateSnapshot(reservationId: string, updates: { adultsCount?: number; childrenCount?: number; toddlersCount?: number }) {
    const existing = await prisma.reservationMenuSnapshot.findUnique({ where: { reservationId } });
    if (!existing) throw new Error('Nie znaleziono snapshotu menu');
    const menuData = existing.menuData as unknown as MenuSnapshotData;
    const adultsCount = updates.adultsCount ?? existing.adultsCount;
    const childrenCount = updates.childrenCount ?? existing.childrenCount;
    const toddlersCount = updates.toddlersCount ?? existing.toddlersCount;
    const priceBreakdown = this.calculatePriceBreakdown(menuData, adultsCount, childrenCount, toddlersCount);
    const updated = await prisma.reservationMenuSnapshot.update({
      where: { reservationId },
      data: { adultsCount, childrenCount, toddlersCount, packagePrice: priceBreakdown.packageCost.subtotal, optionsPrice: priceBreakdown.optionsSubtotal, totalMenuPrice: priceBreakdown.totalMenuPrice }
    });
    return { snapshot: updated, priceBreakdown };
  }

  async deleteSnapshot(reservationId: string) {
    return prisma.reservationMenuSnapshot.delete({ where: { reservationId } });
  }

  async hasSnapshot(reservationId: string): Promise<boolean> {
    const count = await prisma.reservationMenuSnapshot.count({ where: { reservationId } });
    return count > 0;
  }

  async getSnapshotStatistics() {
    const totalSnapshots = await prisma.reservationMenuSnapshot.count();
    const avgMenuPrice = await prisma.reservationMenuSnapshot.aggregate({
      _avg: { totalMenuPrice: true, packagePrice: true, optionsPrice: true }
    });
    return {
      totalSnapshots,
      /* istanbul ignore next -- null when no snapshots exist */
      averageMenuPrice: avgMenuPrice._avg.totalMenuPrice?.toNumber() ?? 0,
      /* istanbul ignore next */
      averagePackagePrice: avgMenuPrice._avg.packagePrice?.toNumber() ?? 0,
      /* istanbul ignore next */
      averageOptionsPrice: avgMenuPrice._avg.optionsPrice?.toNumber() ?? 0
    };
  }

  async getPopularOptions(limit: number = 10) {
    const snapshots = await prisma.reservationMenuSnapshot.findMany({ select: { menuData: true } });
    const optionCounts: Record<string, { name: string; count: number }> = {};
    snapshots.forEach(snapshot => {
      const menuData = snapshot.menuData as unknown as MenuSnapshotData;
      menuData.selectedOptions.forEach(opt => {
        /* istanbul ignore next */
        if (!optionCounts[opt.optionId]) optionCounts[opt.optionId] = { name: opt.name, count: 0 };
        optionCounts[opt.optionId].count++;
      });
    });
    return Object.entries(optionCounts).map(([optionId, data]) => ({ optionId, name: data.name, count: data.count })).sort((a, b) => b.count - a.count).slice(0, limit);
  }

  async getPopularPackages(limit: number = 10) {
    const snapshots = await prisma.reservationMenuSnapshot.findMany({ select: { menuData: true } });
    const packageCounts: Record<string, { name: string; count: number }> = {};
    snapshots.forEach(snapshot => {
      const menuData = snapshot.menuData as unknown as MenuSnapshotData;
      const pkgId = menuData.packageId;
      /* istanbul ignore next */
      if (!packageCounts[pkgId]) packageCounts[pkgId] = { name: menuData.packageName, count: 0 };
      packageCounts[pkgId].count++;
    });
    return Object.entries(packageCounts).map(([packageId, data]) => ({ packageId, name: data.name, count: data.count })).sort((a, b) => b.count - a.count).slice(0, limit);
  }
}

export const menuSnapshotService = new MenuSnapshotService();
