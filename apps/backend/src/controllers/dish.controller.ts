/**
 * Dish Controller
 * 
 * HTTP handlers for dish library operations
 */

import { Request, Response, NextFunction } from 'express';
import { dishService } from '../services/dish.service';
import {
  createDishSchema,
  updateDishSchema,
  dishQuerySchema
} from '../validation/dish.validation';
import { z } from 'zod';

export class DishController {

  /**
   * GET /api/dishes
   * List all dishes with optional filters
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate query params
      const filters = dishQuerySchema.parse(req.query);

      const dishes = await dishService.list({
        category: filters.category,
        isActive: filters.isActive,
        search: filters.search
      });

      return res.status(200).json({
        success: true,
        data: dishes,
        count: dishes.length
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/dishes/:id
   * Get single dish by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const dish = await dishService.getById(id);

      return res.status(200).json({
        success: true,
        data: dish
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Dish not found') {
        return res.status(404).json({
          success: false,
          error: 'Dish not found'
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/dishes
   * Create new dish (ADMIN only)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = createDishSchema.parse(req.body);

      const dish = await dishService.create(data);

      return res.status(201).json({
        success: true,
        data: dish,
        message: 'Dish created successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/dishes/:id
   * Update dish (ADMIN only)
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Validate request body
      const data = updateDishSchema.parse(req.body);

      const dish = await dishService.update(id, data);

      return res.status(200).json({
        success: true,
        data: dish,
        message: 'Dish updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      if (error instanceof Error && error.message === 'Dish not found') {
        return res.status(404).json({
          success: false,
          error: 'Dish not found'
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/dishes/:id
   * Delete dish (ADMIN only)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await dishService.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Dish deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot delete')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      if (error instanceof Error && error.message === 'Dish not found') {
        return res.status(404).json({
          success: false,
          error: 'Dish not found'
        });
      }
      next(error);
    }
  }
}

export const dishController = new DishController();
