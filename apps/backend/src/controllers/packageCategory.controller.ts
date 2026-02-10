/**
 * Package Category Settings Controller
 * 
 * HTTP handlers for category settings operations
 */

import { Request, Response, NextFunction } from 'express';
import { packageCategoryService } from '../services/packageCategory.service';
import { z } from 'zod';
import { DishCategory } from '@prisma/client';

// Validation schemas
const createCategorySettingSchema = z.object({
  packageId: z.string().uuid(),
  category: z.nativeEnum(DishCategory),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  customLabel: z.string().max(255).nullable().optional(),
});

const updateCategorySettingSchema = z.object({
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  customLabel: z.string().max(255).nullable().optional(),
});

const bulkUpdateSchema = z.object({
  settings: z.array(
    z.object({
      category: z.nativeEnum(DishCategory),
      minSelect: z.number().int().min(0).optional(),
      maxSelect: z.number().int().min(1).optional(),
      isRequired: z.boolean().optional(),
      isEnabled: z.boolean().optional(),
      displayOrder: z.number().int().optional(),
      customLabel: z.string().max(255).nullable().optional(),
    })
  ),
});

export class PackageCategoryController {

  /**
   * GET /api/menu-packages/:packageId/categories
   * Get all category settings for a package
   */
  async getByPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const { packageId } = req.params;

      const settings = await packageCategoryService.getByPackageId(packageId);

      return res.status(200).json({
        success: true,
        data: settings,
        count: settings.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/package-category-settings/:id
   * Get single category setting
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const setting = await packageCategoryService.getById(id);

      return res.status(200).json({
        success: true,
        data: setting,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Category setting not found') {
        return res.status(404).json({
          success: false,
          error: 'Category setting not found',
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/package-category-settings
   * Create category setting
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySettingSchema.parse(req.body);

      const setting = await packageCategoryService.create(data);

      return res.status(201).json({
        success: true,
        data: setting,
        message: 'Category setting created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/package-category-settings/:id
   * Update category setting
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateCategorySettingSchema.parse(req.body);

      const setting = await packageCategoryService.update(id, data);

      return res.status(200).json({
        success: true,
        data: setting,
        message: 'Category setting updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof Error && error.message === 'Category setting not found') {
        return res.status(404).json({
          success: false,
          error: 'Category setting not found',
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/menu-packages/:packageId/categories
   * Bulk update category settings for a package
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { packageId } = req.params;
      const data = bulkUpdateSchema.parse(req.body);

      const settings = await packageCategoryService.bulkUpdate(packageId, data);

      return res.status(200).json({
        success: true,
        data: settings,
        message: 'Category settings updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      if (error instanceof Error && error.message === 'Package not found') {
        return res.status(404).json({
          success: false,
          error: 'Package not found',
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/package-category-settings/:id
   * Delete category setting
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await packageCategoryService.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Category setting deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Category setting not found') {
        return res.status(404).json({
          success: false,
          error: 'Category setting not found',
        });
      }
      next(error);
    }
  }
}

export const packageCategoryController = new PackageCategoryController();
