/**
 * Reservation Menu Controller
 * MIGRATED: Prisma singleton + AppError + no try/catch
 * CRITICAL FIX: updateMenu now replaces entire snapshot (package + options + dishes)
 * instead of only updating guest counts.
 * SYNC: selectMenu/updateMenu now sync pricePerAdult/Child/Toddler + totalPrice
 * back to the Reservation model for consistency across the system.
 * #216: selectMenu/updateMenu now save categoryExtras via upsertExtras
 * #216: deleteMenu now removes categoryExtras
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { menuSnapshotService } from '../services/menuSnapshot.service';
import { reservationCategoryExtraService } from '../services/reservationCategoryExtra.service';
import { recalculateReservationTotalPrice } from '../utils/recalculate-price';
import { AppError } from '../utils/AppError';
import {
  selectMenuSchema,
} from '../validation/menu.validation';
import { z } from 'zod';

export class ReservationMenuController {
  /**
   * Sync reservation pricing fields from menu snapshot priceBreakdown,
   * then run full recalculation (includes extras, surcharge, discount, etc.).
   */
  private async syncReservationPricingAndRecalculate(
    reservationId: string,
    priceBreakdown: {
      packageCost: {
        adults: { priceEach: number };
        children: { priceEach: number };
        toddlers: { priceEach: number };
      };
      totalMenuPrice: number;
    }
  ) {
    // First sync per-person prices from package
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        pricePerAdult: priceBreakdown.packageCost.adults.priceEach,
        pricePerChild: priceBreakdown.packageCost.children.priceEach,
        pricePerToddler: priceBreakdown.packageCost.toddlers.priceEach,
      },
    });
    // Then run full recalculation (includes categoryExtras, extras, surcharge, discount, extra hours)
    await recalculateReservationTotalPrice(reservationId);
  }

  /**
   * #216: Save category extras from DishSelector result.
   * Maps frontend format (packageCategorySettingsId) to backend format (packageCategoryId).
   */
  private async saveCategoryExtras(
    reservationId: string,
    categoryExtras: Array<{
      packageCategorySettingsId: string;
      extraQuantity: number;
      portionTarget: string;
      [key: string]: any;
    }>,
    guestCounts: { adults: number; children: number; toddlers: number },
    userId?: string
  ) {
    // First delete existing extras for this reservation
    await reservationCategoryExtraService.deleteByReservation(reservationId, userId);

    // Then upsert new ones (if any)
    if (categoryExtras.length > 0) {
      const extrasForService = categoryExtras
        .filter(e => e.extraQuantity > 0)
        .map(e => ({
          packageCategoryId: e.packageCategorySettingsId,
          quantity: e.extraQuantity,
          portionTarget: e.portionTarget || 'ALL',
        }));

      if (extrasForService.length > 0) {
        await reservationCategoryExtraService.upsertExtras(
          reservationId,
          extrasForService,
          userId,
          guestCounts
        );
      }
    }
  }

  async selectMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;
    const userId = req.user?.id;

    // Zod validation
    const data = selectMenuSchema.parse(req.body);

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        adults: true,
        children: true,
        toddlers: true
      }
    });

    if (!reservation) throw AppError.notFound('Reservation');

    const existing = await menuSnapshotService.hasSnapshot(reservationId);
    if (existing) {
      throw AppError.conflict('Menu already selected for this reservation. Use PUT to update.');
    }

    const result = await menuSnapshotService.createSnapshot({
      reservationId,
      packageId: data.packageId,
      selectedOptions: data.selectedOptions,
      dishSelections: data.dishSelections,
      adultsCount: reservation.adults,
      childrenCount: reservation.children ?? 0,
      toddlersCount: reservation.toddlers ?? 0
    });

    // #216: Save category extras from DishSelector
    if (data.categoryExtras && data.categoryExtras.length > 0) {
      await this.saveCategoryExtras(
        reservationId,
        data.categoryExtras,
        { adults: reservation.adults, children: reservation.children ?? 0, toddlers: reservation.toddlers ?? 0 },
        userId
      );
    }

    // Sync pricing + full recalculation (includes categoryExtras in total)
    await this.syncReservationPricingAndRecalculate(reservationId, result.priceBreakdown);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Menu selected successfully'
    });
  }

  async getMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;

    const result = await menuSnapshotService.getSnapshotByReservationId(reservationId);

    res.status(200).json({
      success: true,
      data: result
    });
  }

  /**
   * Update menu selection for reservation.
   * FIXED: Now replaces the entire snapshot (package, options, dishes)
   * instead of only updating guest counts.
   * Guest counts are always read from reservation (single source of truth).
   * #216: Also replaces category extras and recalculates total price.
   */
  async updateMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;
    const userId = req.user?.id;

    // Use same schema as selectMenu - full menu data
    const data = selectMenuSchema.parse(req.body);

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        adults: true,
        children: true,
        toddlers: true
      }
    });

    if (!reservation) throw AppError.notFound('Reservation');

    // Replace entire snapshot (delete old + create new)
    const result = await menuSnapshotService.replaceSnapshot({
      reservationId,
      packageId: data.packageId,
      selectedOptions: data.selectedOptions,
      dishSelections: data.dishSelections,
      adultsCount: reservation.adults,
      childrenCount: reservation.children ?? 0,
      toddlersCount: reservation.toddlers ?? 0
    });

    // #216: Replace category extras — delete old + save new from DishSelector
    await this.saveCategoryExtras(
      reservationId,
      data.categoryExtras || [],
      { adults: reservation.adults, children: reservation.children ?? 0, toddlers: reservation.toddlers ?? 0 },
      userId
    );

    // Sync pricing + full recalculation (includes categoryExtras in total)
    await this.syncReservationPricingAndRecalculate(reservationId, result.priceBreakdown);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Menu updated successfully'
    });
  }

  /**
   * Delete menu selection for reservation.
   * #216: Also deletes associated category extras.
   * Then recalculates total price without menu or extras.
   */
  async deleteMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;
    const userId = req.user?.id;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        adults: true,
        children: true,
        toddlers: true,
        pricePerAdult: true,
        pricePerChild: true,
        pricePerToddler: true,
      }
    });

    if (!reservation) throw AppError.notFound('Reservation');

    // Delete menu snapshot
    await menuSnapshotService.deleteSnapshot(reservationId);

    // #216: Delete all category extras for this reservation
    await reservationCategoryExtraService.deleteByReservation(reservationId, userId);

    // Reset per-person prices to 0 — they were set from the menu package,
    // so after menu deletion they must be cleared to avoid stale pricing
    // in recalculateReservationTotalPrice (which falls back to per-person
    // prices when no menuSnapshot exists).
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        pricePerAdult: 0,
        pricePerChild: 0,
        pricePerToddler: 0,
      },
    });

    // Recalculate total price (now without menu and without extras)
    await recalculateReservationTotalPrice(reservationId);

    res.status(200).json({
      success: true,
      message: 'Menu removed successfully'
    });
  }
}

export const reservationMenuController = new ReservationMenuController();
