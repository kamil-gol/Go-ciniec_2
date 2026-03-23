/**
 * Package Category Settings Controller
 * Thin controller: parse request, call service, send response
 * Links packages to dish categories with min/max selection rules
 * Updated: #166 — Added portionTarget support (ALL | ADULTS_ONLY | CHILDREN_ONLY)
 * Refactored: all business logic moved to packageCategory.service.ts
 * Errors propagate to asyncHandler which forwards to global error middleware
 */

import { Request, Response } from 'express';
import { packageCategoryService } from '../services/packageCategory.service';
import { bulkUpdateCategorySettingsSchema } from '@/validation/menu.validation';
import { AppError } from '../utils/AppError';

class PackageCategoryController {
  /**
   * GET /api/menu-packages/:packageId/categories
   * Get all categories configured for a package with their dishes
   */
  async getByPackage(req: Request, res: Response) {
    const { packageId } = req.params;
    const data = await packageCategoryService.getByPackageWithDishes(packageId);

    res.json({ success: true, data });
  }

  /**
   * GET /api/package-category-settings/:id
   * Get single category setting
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const setting = await packageCategoryService.getById(id);

    res.json({ success: true, data: setting });
  }

  /**
   * POST /api/package-category-settings
   * Create category setting (Admin only)
   */
  async create(req: Request, res: Response) {
    const setting = await packageCategoryService.createFromInput(req.body);

    res.status(201).json({
      success: true,
      data: setting,
      message: 'Category setting created successfully',
    });
  }

  /**
   * PUT /api/package-category-settings/:id
   * Update category setting (Admin only)
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const updated = await packageCategoryService.updateById(id, req.body);

    res.json({
      success: true,
      data: updated,
      message: 'Category setting updated successfully',
    });
  }

  /**
   * DELETE /api/package-category-settings/:id
   * Delete category setting (Admin only)
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await packageCategoryService.deleteById(id);

    res.json({ success: true, message: 'Category setting deleted successfully' });
  }

  /**
   * PUT /api/menu-packages/:packageId/categories
   * Bulk update category settings for a package (Admin only)
   */
  async bulkUpdate(req: Request, res: Response) {
    const { packageId } = req.params;

    const validation = bulkUpdateCategorySettingsSchema.safeParse(req.body);
    if (!validation.success) {
      throw AppError.badRequest(
        `Błąd walidacji: ${validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')}`
      );
    }

    const { settings } = validation.data;
    const result = await packageCategoryService.bulkUpdateFromInput(packageId, settings);

    res.json({
      success: true,
      data: result,
      message: `Updated ${result.length} category settings`,
    });
  }
}

export const packageCategoryController = new PackageCategoryController();
