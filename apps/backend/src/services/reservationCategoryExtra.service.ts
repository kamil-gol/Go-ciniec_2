/**
 * Reservation Category Extra Service
 *
 * Manages additional paid items beyond package category limits (#216).
 * Each extra has a snapshot price (pricePerItem) from PackageCategorySettings.extraItemPrice.
 * Price model: per-person (quantity × pricePerItem × guestCount based on portionTarget).
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { logChange } from '../utils/audit-logger';

/** Compute relevant guest count based on portionTarget */
function getGuestCount(
  portionTarget: string,
  adults: number,
  children: number,
  toddlers: number
): number {
  switch (portionTarget) {
    case 'ADULTS_ONLY':
      return adults;
    case 'CHILDREN_ONLY':
      return children;
    case 'ALL':
    default:
      return adults + children + toddlers;
  }
}

class ReservationCategoryExtraService {

  /**
   * Upsert category extras for a reservation.
   * - Snapshots pricePerItem from PackageCategorySettings.extraItemPrice
   * - Validates: category supports extras, quantity within maxExtra limit
   * - Calculates totalPrice = quantity × pricePerItem × guestCount (per-person model)
   * - Removes extras for categories not in input (quantity=0)
   */
  async upsertExtras(
    reservationId: string,
    extras: Array<{ packageCategoryId: string; quantity: number; portionTarget?: string }>,
    userId?: string,
    guestCounts?: { adults: number; children: number; toddlers: number }
  ) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new Error('Nie znaleziono rezerwacji');

    // Use provided guest counts or fall back to reservation values
    const adults = guestCounts?.adults ?? reservation.adults;
    const children = guestCounts?.children ?? reservation.children;
    const toddlers = guestCounts?.toddlers ?? reservation.toddlers;

    const categoryIds = extras.map(e => e.packageCategoryId);
    const categories = await prisma.packageCategorySettings.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const results = [];

    for (const extra of extras) {
      const category = categoryMap.get(extra.packageCategoryId);
      if (!category) {
        throw new Error(`Nie znaleziono kategorii pakietu: ${extra.packageCategoryId}`);
      }
      if (category.extraItemPrice === null) {
        throw new Error('Ta kategoria nie wspiera dodatkowych pozycji');
      }
      if (extra.quantity <= 0) continue;
      if (category.maxExtra !== null && extra.quantity > Number(category.maxExtra)) {
        throw new Error(`Przekroczono limit dodatkowych pozycji (max: ${Number(category.maxExtra)})`);
      }

      const pricePerItem = Number(category.extraItemPrice);
      const portionTarget = extra.portionTarget || category.portionTarget || 'ALL';
      const guestCount = getGuestCount(portionTarget, adults, children, toddlers);
      const totalPrice = Math.round(extra.quantity * pricePerItem * guestCount * 100) / 100;

      const result = await prisma.reservationCategoryExtra.upsert({
        where: {
          reservationId_packageCategoryId: {
            reservationId,
            packageCategoryId: extra.packageCategoryId,
          },
        },
        update: {
          quantity: new Decimal(extra.quantity),
          pricePerItem: new Decimal(pricePerItem),
          guestCount,
          portionTarget,
          totalPrice: new Decimal(totalPrice),
        },
        create: {
          reservationId,
          packageCategoryId: extra.packageCategoryId,
          quantity: new Decimal(extra.quantity),
          pricePerItem: new Decimal(pricePerItem),
          guestCount,
          portionTarget,
          totalPrice: new Decimal(totalPrice),
        },
      });
      results.push(result);
    }

    // Remove extras for categories not in the input
    const inputCategoryIds = extras.filter(e => e.quantity > 0).map(e => e.packageCategoryId);
    await prisma.reservationCategoryExtra.deleteMany({
      where: {
        reservationId,
        packageCategoryId: { notIn: inputCategoryIds },
      },
    });

    // Audit log
    if (userId) {
      const summary = results.map(r =>
        `${r.packageCategoryId}: ${Number(r.quantity)}×${Number(r.pricePerItem)}zl×${r.guestCount}os.`
      ).join(', ');
      await logChange({
        userId,
        action: 'CATEGORY_EXTRAS_UPDATED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Zaktualizowano extra pozycje kategorii: ${summary}`,
          extras: results.map(r => ({
            packageCategoryId: r.packageCategoryId,
            quantity: Number(r.quantity),
            pricePerItem: Number(r.pricePerItem),
            guestCount: r.guestCount,
            portionTarget: r.portionTarget,
            totalPrice: Number(r.totalPrice),
          })),
        },
      });
    }

    return results;
  }

  /**
   * Recalculate category extras totals when guest counts change.
   * Updates guestCount and totalPrice for each extra based on its portionTarget.
   */
  async recalculateForGuestChange(
    reservationId: string,
    adults: number,
    children: number,
    toddlers: number,
    userId?: string
  ) {
    const extras = await prisma.reservationCategoryExtra.findMany({
      where: { reservationId },
    });

    if (extras.length === 0) return;

    for (const extra of extras) {
      const newGuestCount = getGuestCount(extra.portionTarget, adults, children, toddlers);
      const newTotalPrice = Math.round(Number(extra.quantity) * Number(extra.pricePerItem) * newGuestCount * 100) / 100;

      if (newGuestCount !== extra.guestCount) {
        await prisma.reservationCategoryExtra.update({
          where: { id: extra.id },
          data: {
            guestCount: newGuestCount,
            totalPrice: new Decimal(newTotalPrice),
          },
        });
      }
    }

    if (userId) {
      await logChange({
        userId,
        action: 'CATEGORY_EXTRAS_UPDATED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Przeliczono extra pozycje kategorii po zmianie liczby gosci (${adults} doroslych, ${children} dzieci, ${toddlers} maluchow)`,
        },
      });
    }
  }

  /**
   * Get all category extras for a reservation with category details.
   */
  async getByReservation(reservationId: string) {
    return prisma.reservationCategoryExtra.findMany({
      where: { reservationId },
      include: {
        packageCategory: {
          include: {
            category: { select: { id: true, name: true, icon: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Delete all category extras for a reservation (e.g. on package change).
   */
  async deleteByReservation(reservationId: string, userId?: string) {
    const result = await prisma.reservationCategoryExtra.deleteMany({
      where: { reservationId },
    });

    if (userId && result.count > 0) {
      await logChange({
        userId,
        action: 'CATEGORY_EXTRAS_REMOVED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Usunieto ${result.count} extra pozycji kategorii (zmiana pakietu)`,
          removedCount: result.count,
        },
      });
    }

    return result;
  }

  /**
   * Calculate total price of all category extras for a reservation.
   */
  async calculateTotal(reservationId: string): Promise<number> {
    const extras = await prisma.reservationCategoryExtra.findMany({
      where: { reservationId },
    });
    return extras.reduce((sum, e) => sum + Number(e.totalPrice), 0);
  }
}

export const reservationCategoryExtraService = new ReservationCategoryExtraService();
