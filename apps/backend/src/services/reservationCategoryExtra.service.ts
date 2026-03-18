/**
 * Reservation Category Extra Service
 *
 * Manages additional paid items beyond package category limits (#216).
 * Each extra has a snapshot price (pricePerItem) from PackageCategorySettings.extraItemPrice.
 * Price model: per-item (quantity × pricePerItem), NOT per-person.
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { logChange } from '../utils/audit-logger';

class ReservationCategoryExtraService {

  /**
   * Upsert category extras for a reservation.
   * - Snapshots pricePerItem from PackageCategorySettings.extraItemPrice
   * - Validates: category supports extras, quantity within maxExtra limit
   * - Removes extras for categories not in input (quantity=0)
   */
  async upsertExtras(
    reservationId: string,
    extras: Array<{ packageCategoryId: string; quantity: number }>,
    userId?: string
  ) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new Error('Nie znaleziono rezerwacji');

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
      if (category.maxExtra !== null && extra.quantity > category.maxExtra) {
        throw new Error(`Przekroczono limit dodatkowych pozycji (max: ${category.maxExtra})`);
      }

      const pricePerItem = Number(category.extraItemPrice);
      const totalPrice = Math.round(extra.quantity * pricePerItem * 100) / 100;

      const result = await prisma.reservationCategoryExtra.upsert({
        where: {
          reservationId_packageCategoryId: {
            reservationId,
            packageCategoryId: extra.packageCategoryId,
          },
        },
        update: {
          quantity: extra.quantity,
          pricePerItem: new Decimal(pricePerItem),
          totalPrice: new Decimal(totalPrice),
        },
        create: {
          reservationId,
          packageCategoryId: extra.packageCategoryId,
          quantity: extra.quantity,
          pricePerItem: new Decimal(pricePerItem),
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
      const summary = results.map(r => `${r.packageCategoryId}: ${r.quantity}×${Number(r.pricePerItem)}zł`).join(', ');
      await logChange({
        userId,
        action: 'CATEGORY_EXTRAS_UPDATED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Zaktualizowano extra pozycje kategorii: ${summary}`,
          extras: results.map(r => ({
            packageCategoryId: r.packageCategoryId,
            quantity: r.quantity,
            pricePerItem: Number(r.pricePerItem),
            totalPrice: Number(r.totalPrice),
          })),
        },
      });
    }

    return results;
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
          description: `Usunięto ${result.count} extra pozycji kategorii (zmiana pakietu)`,
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
