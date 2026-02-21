/**
 * Discount Controller
 * Handle HTTP requests for reservation discount management
 * Sprint 7: System Rabatów
 */

import { Request, Response } from 'express';
import discountService from '../services/discount.service';
import { AppError } from '../utils/AppError';

export class DiscountController {
  /**
   * Apply or update discount
   * PATCH /api/reservations/:id/discount
   */
  async applyDiscount(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized();

    const { type, value, reason } = req.body;
    if (!type || value === undefined || !reason) {
      throw AppError.badRequest('type (PERCENTAGE|FIXED), value, and reason are required');
    }

    const reservation = await discountService.applyDiscount(
      id,
      { type, value: Number(value), reason },
      userId
    );

    res.status(200).json({
      success: true,
      data: reservation,
      message: 'Discount applied successfully',
    });
  }

  /**
   * Remove discount
   * DELETE /api/reservations/:id/discount
   */
  async removeDiscount(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized();

    const reservation = await discountService.removeDiscount(id, userId);

    res.status(200).json({
      success: true,
      data: reservation,
      message: 'Discount removed successfully',
    });
  }
}

export const discountController = new DiscountController();
