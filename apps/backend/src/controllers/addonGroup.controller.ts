/**
 * Addon Group Controller
 * 
 * HTTP handlers for addon group operations
 */

import { Request, Response, NextFunction } from 'express';
import { addonGroupService } from '../services/addonGroup.service';
import { z } from 'zod';

// Validation schemas
const createAddonGroupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
  priceType: z.enum(['FREE', 'PER_ITEM', 'PER_GROUP', 'PER_PERSON']),
  basePrice: z.number().min(0).optional(),
  icon: z.string().max(50).nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateAddonGroupSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
  priceType: z.enum(['FREE', 'PER_ITEM', 'PER_GROUP', 'PER_PERSON']).optional(),
  basePrice: z.number().min(0).optional(),
  icon: z.string().max(50).nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const assignDishesSchema = z.object({
  dishes: z.array(
    z.object({
      dishId: z.string().uuid(),
      customPrice: z.number().min(0).nullable().optional(),
      displayOrder: z.number().int().optional(),
    })
  ),
});

export class AddonGroupController {

  /**
   * GET /api/addon-groups
   * List all addon groups (with optional filters)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string | undefined,
      };

      const groups = await addonGroupService.list(filters);

      return res.status(200).json({
        success: true,
        data: groups,
        count: groups.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/addon-groups/:id
   * Get single addon group by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const group = await addonGroupService.getById(id);

      return res.status(200).json({
        success: true,
        data: group,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Addon group not found') {
        return res.status(404).json({
          success: false,
          error: 'Addon group not found',
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/addon-groups
   * Create new addon group
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createAddonGroupSchema.parse(req.body);

      const group = await addonGroupService.create(data);

      return res.status(201).json({
        success: true,
        data: group,
        message: 'Addon group created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/addon-groups/:id
   * Update addon group
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateAddonGroupSchema.parse(req.body);

      const group = await addonGroupService.update(id, data);

      return res.status(200).json({
        success: true,
        data: group,
        message: 'Addon group updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof Error && error.message === 'Addon group not found') {
        return res.status(404).json({
          success: false,
          error: 'Addon group not found',
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/addon-groups/:id
   * Delete addon group
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await addonGroupService.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Addon group deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Addon group not found') {
        return res.status(404).json({
          success: false,
          error: 'Addon group not found',
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/addon-groups/:id/dishes
   * Assign dishes to addon group
   */
  async assignDishes(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = assignDishesSchema.parse(req.body);

      const assignments = await addonGroupService.assignDishes(id, data);

      return res.status(200).json({
        success: true,
        data: assignments,
        message: 'Dishes assigned successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof Error && error.message === 'Addon group not found') {
        return res.status(404).json({
          success: false,
          error: 'Addon group not found',
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/addon-groups/:groupId/dishes/:dishId
   * Remove dish from addon group
   */
  async removeDish(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId, dishId } = req.params;

      await addonGroupService.removeDish(groupId, dishId);

      return res.status(200).json({
        success: true,
        message: 'Dish removed from addon group successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Dish not found in addon group') {
        return res.status(404).json({
          success: false,
          error: 'Dish not found in addon group',
        });
      }
      next(error);
    }
  }
}

export const addonGroupController = new AddonGroupController();
