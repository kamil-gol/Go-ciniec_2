/**
 * Reservation Menu Controller
 * MIGRATED: Prisma singleton + AppError + no try/catch
 * CRITICAL FIX: removed `new PrismaClient()` (connection leak)
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { menuSnapshotService } from '../services/menuSnapshot.service';
import { AppError } from '../utils/AppError';
import {
  selectMenuSchema,
  updateMenuSelectionSchema
} from '../validation/menu.validation';
import { z } from 'zod';

export class ReservationMenuController {
  async selectMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;

    // Zod validation — errors caught by global errorHandler
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
      adultsCount: reservation.adults,
      childrenCount: reservation.children ?? 0,
      toddlersCount: reservation.toddlers ?? 0
    });

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

  async updateMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;

    // Zod validation — errors caught by global errorHandler
    const data = updateMenuSelectionSchema.parse(req.body);

    const result = await menuSnapshotService.updateSnapshot(reservationId, {
      adultsCount: data.adultsCount,
      childrenCount: data.childrenCount,
      toddlersCount: data.toddlersCount
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Menu updated successfully'
    });
  }

  async deleteMenu(req: Request, res: Response): Promise<void> {
    const { id: reservationId } = req.params;

    await menuSnapshotService.deleteSnapshot(reservationId);

    res.status(200).json({
      success: true,
      message: 'Menu removed successfully'
    });
  }
}

export const reservationMenuController = new ReservationMenuController();
