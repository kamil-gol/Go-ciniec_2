/**
 * Hall Controller
 * Handles HTTP requests for hall management
 * UPDATED: Removed pricePerPerson validation (pricing removed from halls)
 */

import { Request, Response, NextFunction } from 'express';
import hallService from '../services/hall.service';
import { AppError } from '../utils/AppError';

class HallController {
  /**
   * Get all halls
   */
  async getHalls(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string | undefined,
      };

      const halls = await hallService.getHalls(filters);

      res.json({
        success: true,
        data: halls,
        count: halls.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get hall by ID
   */
  async getHallById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hall = await hallService.getHallById(req.params.id);
      res.json({ success: true, data: hall });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new hall
   */
  async createHall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('User not authenticated');
      }

      if (!data.name || !data.capacity) {
        res.status(400).json({ success: false, message: 'Name and capacity are required' });
        return;
      }

      const hall = await hallService.createHall(data, userId);
      res.status(201).json({ success: true, data: hall });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update hall
   */
  async updateHall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('User not authenticated');
      }

      const hall = await hallService.updateHall(req.params.id, req.body, userId);
      res.json({ success: true, data: hall });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete hall (soft delete)
   */
  async deleteHall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw AppError.unauthorized('User not authenticated');
      }

      await hallService.deleteHall(req.params.id, userId);
      res.json({ success: true, message: 'Hall deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new HallController();
