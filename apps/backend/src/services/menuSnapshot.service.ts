/**
 * Menu Snapshot Service
 * 
 * Creates and manages immutable menu snapshots for reservations.
 * Snapshots preserve menu data even if templates/packages/options change.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { 
  MenuSnapshotData,
  CreateMenuSnapshotInput,
  MenuPriceBreakdown
} from '../types/menu.types';

const prisma = new PrismaClient();

export class MenuSnapshotService {

  /**
   * Create menu snapshot for reservation
   */
  async createSnapshot(input: CreateMenuSnapshotInput) {
    // 1. Get package with template
    const pkg = await prisma.menuPackage.findUnique({
      where: { id: input.packageId },
      include: {
        menuTemplate: {
          include: {
            eventType: true
          }
        }
      }
    });

    if (!pkg) {
      throw new Error('Package not found');
    }

    // 2. Get selected options
    const optionIds = input.selectedOptions.map(opt => opt.optionId);
    const options = await prisma.menuOption.findMany({
      where: { id: { in: optionIds } }
    });

    if (options.length !== optionIds.length) {
      throw new Error('Some options not found');
    }

    // 3. Build snapshot data
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
          optionId: option.id,
          name: option.name,
          description: option.description,
          category: option.category,
          priceType: option.priceType,
          priceAmount: option.priceAmount.toNumber(),
          quantity: selectedOpt.quantity,
          icon: option.icon
        };
      })
    };

    // 4. Calculate prices
    const priceBreakdown = this.calculatePriceBreakdown(
      snapshotData,
      input.adultsCount,
      input.childrenCount,
      input.toddlersCount
    );

    // 5. Create snapshot
    const snapshot = await prisma.reservationMenuSnapshot.create({
      data: {
        reservationId: input.reservationId,
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

    return {
      snapshot,
      priceBreakdown
    };
  }

  /**
   * Calculate price breakdown
   */
  calculatePriceBreakdown(
    menuData: MenuSnapshotData,
    adultsCount: number,
    childrenCount: number,
    toddlersCount: number
  ): MenuPriceBreakdown {
    // Package cost
    const adultsTotal = adultsCount * menuData.pricePerAdult;
    const childrenTotal = childrenCount * menuData.pricePerChild;
    const toddlersTotal = toddlersCount * menuData.pricePerToddler;
    const packageSubtotal = adultsTotal + childrenTotal + toddlersTotal;

    // Options cost
    const totalGuests = adultsCount + childrenCount + toddlersCount;
    const optionsCost = menuData.selectedOptions.map(opt => {
      let totalPrice = 0;
      let quantity = opt.quantity;

      if (opt.priceType === 'FLAT') {
        totalPrice = opt.priceAmount * opt.quantity;
      } else if (opt.priceType === 'PER_PERSON') {
        quantity = totalGuests;
        totalPrice = opt.priceAmount * totalGuests * opt.quantity;
      } else if (opt.priceType === 'FREE') {
        totalPrice = 0;
      }

      return {
        option: opt.name,
        priceType: opt.priceType,
        priceEach: opt.priceAmount,
        quantity: quantity,
        total: totalPrice
      };
    });

    const optionsSubtotal = optionsCost.reduce((sum, opt) => sum + opt.total, 0);

    return {
      packageCost: {
        adults: {
          count: adultsCount,
          priceEach: menuData.pricePerAdult,
          total: adultsTotal
        },
        children: {
          count: childrenCount,
          priceEach: menuData.pricePerChild,
          total: childrenTotal
        },
        toddlers: {
          count: toddlersCount,
          priceEach: menuData.pricePerToddler,
          total: toddlersTotal
        },
        subtotal: packageSubtotal
      },
      optionsCost,
      optionsSubtotal,
      totalMenuPrice: packageSubtotal + optionsSubtotal
    };
  }

  /**
   * Get snapshot by reservation ID
   */
  async getSnapshotByReservationId(reservationId: string) {
    const snapshot = await prisma.reservationMenuSnapshot.findUnique({
      where: { reservationId }
    });

    if (!snapshot) {
      throw new Error('Menu snapshot not found for this reservation');
    }

    // Recalculate price breakdown for display
    const menuData = snapshot.menuData as MenuSnapshotData;
    const priceBreakdown = this.calculatePriceBreakdown(
      menuData,
      snapshot.adultsCount,
      snapshot.childrenCount,
      snapshot.toddlersCount
    );

    return {
      snapshot,
      priceBreakdown
    };
  }

  /**
   * Update snapshot (e.g., if guest count changes)
   */
  async updateSnapshot(
    reservationId: string,
    updates: {
      adultsCount?: number;
      childrenCount?: number;
      toddlersCount?: number;
    }
  ) {
    const existing = await prisma.reservationMenuSnapshot.findUnique({
      where: { reservationId }
    });

    if (!existing) {
      throw new Error('Snapshot not found');
    }

    const menuData = existing.menuData as MenuSnapshotData;

    // Use updated counts or keep existing
    const adultsCount = updates.adultsCount ?? existing.adultsCount;
    const childrenCount = updates.childrenCount ?? existing.childrenCount;
    const toddlersCount = updates.toddlersCount ?? existing.toddlersCount;

    // Recalculate prices
    const priceBreakdown = this.calculatePriceBreakdown(
      menuData,
      adultsCount,
      childrenCount,
      toddlersCount
    );

    // Update snapshot
    const updated = await prisma.reservationMenuSnapshot.update({
      where: { reservationId },
      data: {
        adultsCount,
        childrenCount,
        toddlersCount,
        packagePrice: priceBreakdown.packageCost.subtotal,
        optionsPrice: priceBreakdown.optionsSubtotal,
        totalMenuPrice: priceBreakdown.totalMenuPrice
      }
    });

    return {
      snapshot: updated,
      priceBreakdown
    };
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(reservationId: string) {
    return await prisma.reservationMenuSnapshot.delete({
      where: { reservationId }
    });
  }

  /**
   * Check if reservation has menu snapshot
   */
  async hasSnapshot(reservationId: string): Promise<boolean> {
    const count = await prisma.reservationMenuSnapshot.count({
      where: { reservationId }
    });
    return count > 0;
  }

  /**
   * Get snapshot statistics
   */
  async getSnapshotStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    eventTypeId?: string;
  }) {
    // This would require joining with Reservation table
    // For now, return basic stats
    const totalSnapshots = await prisma.reservationMenuSnapshot.count();

    const avgMenuPrice = await prisma.reservationMenuSnapshot.aggregate({
      _avg: {
        totalMenuPrice: true,
        packagePrice: true,
        optionsPrice: true
      }
    });

    return {
      totalSnapshots,
      averageMenuPrice: avgMenuPrice._avg.totalMenuPrice?.toNumber() ?? 0,
      averagePackagePrice: avgMenuPrice._avg.packagePrice?.toNumber() ?? 0,
      averageOptionsPrice: avgMenuPrice._avg.optionsPrice?.toNumber() ?? 0
    };
  }

  /**
   * Get popular options (most selected)
   */
  async getPopularOptions(limit: number = 10) {
    const snapshots = await prisma.reservationMenuSnapshot.findMany({
      select: {
        menuData: true
      }
    });

    // Count option occurrences
    const optionCounts: Record<string, { name: string; count: number }> = {};

    snapshots.forEach(snapshot => {
      const menuData = snapshot.menuData as MenuSnapshotData;
      menuData.selectedOptions.forEach(opt => {
        if (!optionCounts[opt.optionId]) {
          optionCounts[opt.optionId] = {
            name: opt.name,
            count: 0
          };
        }
        optionCounts[opt.optionId].count++;
      });
    });

    // Sort and return top N
    return Object.entries(optionCounts)
      .map(([optionId, data]) => ({
        optionId,
        name: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get popular packages (most selected)
   */
  async getPopularPackages(limit: number = 10) {
    const snapshots = await prisma.reservationMenuSnapshot.findMany({
      select: {
        menuData: true
      }
    });

    // Count package occurrences
    const packageCounts: Record<string, { name: string; count: number }> = {};

    snapshots.forEach(snapshot => {
      const menuData = snapshot.menuData as MenuSnapshotData;
      const pkgId = menuData.packageId;
      
      if (!packageCounts[pkgId]) {
        packageCounts[pkgId] = {
          name: menuData.packageName,
          count: 0
        };
      }
      packageCounts[pkgId].count++;
    });

    // Sort and return top N
    return Object.entries(packageCounts)
      .map(([packageId, data]) => ({
        packageId,
        name: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

export const menuSnapshotService = new MenuSnapshotService();
