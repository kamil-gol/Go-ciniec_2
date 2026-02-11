/**
 * Reservation Menu Controller
 * 
 * HTTP endpoints for menu selection
 * UPDATED: Integrated with new menu logic in reservation.service
 */

import { Request, Response } from 'express';
import reservationService from '../services/reservation.service';
import { UpdateReservationMenuDTO } from '../types/reservation.types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

class ReservationMenuController {
  /**
   * Select menu for reservation
   * POST /api/reservations/:id/menu
   */
  async selectMenu(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: reservationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const data: UpdateReservationMenuDTO = {
        menuPackageId: req.body.packageId,
        selectedOptions: req.body.selectedOptions || [],
        adultsCount: req.body.adultsCount,
        childrenCount: req.body.childrenCount,
        toddlersCount: req.body.toddlersCount,
      };

      // Validate required fields
      if (!data.menuPackageId) {
        res.status(400).json({
          success: false,
          error: 'Package ID is required',
        });
        return;
      }

      const result = await reservationService.updateReservationMenu(reservationId, data, userId);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Menu selected successfully',
      });
    } catch (error: any) {
      console.error('[ReservationMenu] Error selecting menu:', error);
      
      const statusCode = 
        error.message.includes('not found') ? 404 :
        error.message.includes('validation') || error.message.includes('required') || error.message.includes('allows') ? 400 :
        500;

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to select menu',
      });
    }
  }

  /**
   * Get menu for reservation
   * GET /api/reservations/:id/menu
   */
  async getMenu(req: Request, res: Response): Promise<void> {
    try {
      const { id: reservationId } = req.params;

      const reservation = await reservationService.getReservationById(reservationId);

      if (!reservation.menuSnapshot) {
        res.status(404).json({
          success: false,
          error: 'No menu selected for this reservation',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: reservation.menuSnapshot,
      });
    } catch (error: any) {
      console.error('[ReservationMenu] Error getting menu:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to get menu',
      });
    }
  }

  /**
   * Update menu for reservation
   * PUT /api/reservations/:id/menu
   */
  async updateMenu(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: reservationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const data: UpdateReservationMenuDTO = {
        menuPackageId: req.body.packageId,
        selectedOptions: req.body.selectedOptions || [],
        adultsCount: req.body.adultsCount,
        childrenCount: req.body.childrenCount,
        toddlersCount: req.body.toddlersCount,
      };

      // Validate required fields
      if (!data.menuPackageId) {
        res.status(400).json({
          success: false,
          error: 'Package ID is required',
        });
        return;
      }

      const result = await reservationService.updateReservationMenu(reservationId, data, userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Menu updated successfully',
      });
    } catch (error: any) {
      console.error('[ReservationMenu] Error updating menu:', error);
      
      const statusCode = 
        error.message.includes('not found') ? 404 :
        error.message.includes('validation') || error.message.includes('required') || error.message.includes('allows') ? 400 :
        500;

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update menu',
      });
    }
  }

  /**
   * Remove menu from reservation
   * DELETE /api/reservations/:id/menu
   */
  async deleteMenu(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: reservationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const data: UpdateReservationMenuDTO = {
        menuPackageId: null, // null means remove menu
      };

      await reservationService.updateReservationMenu(reservationId, data, userId);

      res.status(200).json({
        success: true,
        message: 'Menu removed successfully',
      });
    } catch (error: any) {
      console.error('[ReservationMenu] Error deleting menu:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to remove menu',
      });
    }
  }
}

export default new ReservationMenuController();
