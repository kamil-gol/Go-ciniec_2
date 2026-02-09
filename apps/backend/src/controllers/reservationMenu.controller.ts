/**
 * Reservation Menu Controller
 * 
 * HTTP handlers for menu selection in reservations
 */

import { Request, Response, NextFunction } from 'express';
import { menuSnapshotService } from '../services/menuSnapshot.service';
import { PrismaClient } from '@prisma/client';
import {
  selectMenuSchema,
  updateMenuSelectionSchema
} from '../validation/menu.validation';
import { z } from 'zod';

const prisma = new PrismaClient();

export class ReservationMenuController {

  /**
   * POST /api/reservations/:id/select-menu
   * Select menu for reservation (create snapshot)
   */
  async selectMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: reservationId } = req.params;

      // Validate request body
      const data = selectMenuSchema.parse(req.body);

      // Check if reservation exists and get guest counts
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        select: {
          id: true,
          adultsCount: true,
          childrenCount: true,
          toddlersCount: true
        }
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }

      // Check if menu already selected
      const existing = await menuSnapshotService.hasSnapshot(reservationId);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Menu already selected for this reservation. Use PUT to update.'
        });
      }

      // Create snapshot
      const result = await menuSnapshotService.createSnapshot({
        reservationId,
        packageId: data.packageId,
        selectedOptions: data.selectedOptions,
        adultsCount: reservation.adultsCount,
        childrenCount: reservation.childrenCount ?? 0,
        toddlersCount: reservation.toddlersCount ?? 0
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Menu selected successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: error.message
          });
        }
      }
      next(error);
    }
  }

  /**
   * GET /api/reservations/:id/menu
   * Get menu snapshot for reservation
   */
  async getMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: reservationId } = req.params;

      const result = await menuSnapshotService.getSnapshotByReservationId(reservationId);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Menu not selected for this reservation'
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/reservations/:id/menu
   * Update menu selection (guest counts)
   */
  async updateMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: reservationId } = req.params;

      // Validate request body
      const data = updateMenuSelectionSchema.parse(req.body);

      const result = await menuSnapshotService.updateSnapshot(reservationId, {
        adultsCount: data.adultsCount,
        childrenCount: data.childrenCount,
        toddlersCount: data.toddlersCount
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Menu updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Menu not selected for this reservation'
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/reservations/:id/menu
   * Remove menu selection
   */
  async deleteMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: reservationId } = req.params;

      await menuSnapshotService.deleteSnapshot(reservationId);

      return res.status(200).json({
        success: true,
        message: 'Menu removed successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Menu not selected for this reservation'
        });
      }
      next(error);
    }
  }
}

export const reservationMenuController = new ReservationMenuController();
