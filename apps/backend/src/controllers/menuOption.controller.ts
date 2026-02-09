/**
 * Menu Option Controller
 * 
 * HTTP handlers for menu option operations
 */

import { Request, Response, NextFunction } from 'express';
import { menuService } from '../services/menu.service';
import {
  createMenuOptionSchema,
  updateMenuOptionSchema,
  menuOptionQuerySchema
} from '../validation/menu.validation';
import { z } from 'zod';

export class MenuOptionController {

  /**
   * GET /api/menu-options
   * List all menu options with optional filters
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate query params
      const filters = menuOptionQuerySchema.parse(req.query);

      const options = await menuService.getOptions({
        category: filters.category,
        isActive: filters.isActive,
        search: filters.search
      });

      return res.status(200).json({
        success: true,
        data: options,
        count: options.length
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
   * GET /api/menu-options/:id
   * Get single option by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const option = await menuService.getOptionById(id);

      return res.status(200).json({
        success: true,
        data: option
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Option not found') {
        return res.status(404).json({
          success: false,
          error: 'Option not found'
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/menu-options
   * Create new option (ADMIN only)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = createMenuOptionSchema.parse(req.body);

      const option = await menuService.createOption(data);

      return res.status(201).json({
        success: true,
        data: option,
        message: 'Option created successfully'
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
   * PUT /api/menu-options/:id
   * Update option (ADMIN only)
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Validate request body
      const data = updateMenuOptionSchema.parse(req.body);

      const option = await menuService.updateOption(id, data);

      return res.status(200).json({
        success: true,
        data: option,
        message: 'Option updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      if (error instanceof Error && error.message === 'Option not found') {
        return res.status(404).json({
          success: false,
          error: 'Option not found'
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/menu-options/:id
   * Delete option (ADMIN only)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await menuService.deleteOption(id);

      return res.status(200).json({
        success: true,
        message: 'Option deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot delete')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      if (error instanceof Error && error.message === 'Option not found') {
        return res.status(404).json({
          success: false,
          error: 'Option not found'
        });
      }
      next(error);
    }
  }
}

export const menuOptionController = new MenuOptionController();
