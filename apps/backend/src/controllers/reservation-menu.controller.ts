/**
 * Reservation Menu Controller
 * 
 * HTTP endpoints for menu selection
 */

import { Request, Response } from 'express';
import reservationMenuService from '../services/reservation-menu.service';
import { MenuSelectionInput } from '../dto/menu-selection.dto';

class ReservationMenuController {
  /**
   * Select menu for reservation
   * POST /api/reservations/:id/menu
   */
  async selectMenu(req: Request, res: Response): Promise<void> {
    try {
      const { id: reservationId } = req.params;
      const input: MenuSelectionInput = req.body;

      // Validate required fields
      if (!input.packageId) {
        res.status(400).json({
          success: false,
          error: 'Package ID is required',
        });
        return;
      }

      const result = await reservationMenuService.selectMenu(reservationId, input);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Menu selected successfully',
      });
    } catch (error: any) {
      console.error('[ReservationMenu] Error selecting menu:', error);
      
      const statusCode = 
        error.message.includes('not found') ? 404 :
        error.message.includes('validation') ? 400 :
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

      const result = await reservationMenuService.getReservationMenu(reservationId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[ReservationMenu] Error getting menu:', error);
      
      const statusCode = error.message.includes('not found') || error.message.includes('not selected') ? 404 : 500;

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
  async updateMenu(req: Request, res: Response): Promise<void> {
    try {
      const { id: reservationId } = req.params;
      const input: MenuSelectionInput = req.body;

      // Validate required fields
      if (!input.packageId) {
        res.status(400).json({
          success: false,
          error: 'Package ID is required',
        });
        return;
      }

      const result = await reservationMenuService.updateMenu(reservationId, input);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Menu updated successfully',
      });
    } catch (error: any) {
      console.error('[ReservationMenu] Error updating menu:', error);
      
      const statusCode = 
        error.message.includes('not found') ? 404 :
        error.message.includes('validation') ? 400 :
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
  async deleteMenu(req: Request, res: Response): Promise<void> {
    try {
      const { id: reservationId } = req.params;

      await reservationMenuService.removeMenu(reservationId);

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
