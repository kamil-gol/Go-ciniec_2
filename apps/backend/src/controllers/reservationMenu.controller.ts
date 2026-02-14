/**
 * Reservation Menu Controller
 * MIGRATED: Prisma singleton + AppError + no try/catch
 * CRITICAL FIX: updateMenu now replaces entire snapshot (package + options + dishes)
 * instead of only updating guest counts.
 * SYNC: selectMenu/updateMenu now sync pricePerAdult/Child/Toddler + totalPrice
 * back to the Reservation model for consistency across the system.
 * UPDATED: deleteMenu no longer references hall pricing (removed from Hall model)
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { menuSnapshotService } from '../services/menuSnapshot.service';
import { AppError } from '../utils/AppError';
import {
  selectMenuSchema,
} from '../validation/menu.validation';
import { z } from 'zod';

export class ReservationMenuController {
  /**
   * Sync reservation pricing fields from menu snapshot priceBreakdown.
   * Updates pricePerAdult, pricePerChild, pricePerToddler and totalPrice
   * so that all parts of the system (lists, API, reports) show correct values.
   */
  private async syncReservationPricing(
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
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        pricePerAdult: priceBreakdown.packageCost.adults.priceEach,
        pricePerChild: priceBreakdown.packageCost.children.priceEach,
        pricePerToddler: priceBreakdown.packageCost.toddlers.priceEach,
        totalPrice: priceBreakdown.totalMenuPrice,
      },
    });
  }

  async selectMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;

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

    // Sync pricing back to reservation
    await this.syncReservationPricing(reservationId, result.priceBreakdown);

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
   */
  async updateMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;

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

    // Sync pricing back to reservation
    await this.syncReservationPricing(reservationId, result.priceBreakdown);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Menu updated successfully'
    });
  }

  /**
   * Delete menu selection for reservation.
   * Keeps existing per-person prices from the reservation,
   * then recalculates totalPrice without menu options.
   */
  async deleteMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;

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

    await menuSnapshotService.deleteSnapshot(reservationId);

    // Keep existing per-person prices from the reservation
    // (prices that were set before menu was selected, or manually entered)
    const basePricePerAdult = reservation.pricePerAdult.toNumber();
    const basePricePerChild = reservation.pricePerChild.toNumber();
    const basePricePerToddler = reservation.pricePerToddler.toNumber();

    const newTotal =
      reservation.adults * basePricePerAdult +
      (reservation.children ?? 0) * basePricePerChild +
      (reservation.toddlers ?? 0) * basePricePerToddler;

    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        pricePerAdult: basePricePerAdult,
        pricePerChild: basePricePerChild,
        pricePerToddler: basePricePerToddler,
        totalPrice: newTotal,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Menu removed successfully'
    });
  }
}

export const reservationMenuController = new ReservationMenuController();
