/**
 * Package Category Settings Controller
 * 
 * Handles CRUD for PackageCategorySettings
 * Links packages to dish categories with min/max selection rules
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toNumber(decimal: any): number {
  return parseFloat(decimal.toString());
}

class PackageCategoryController {
  /**
   * GET /api/menu-packages/:packageId/categories
   * Get all categories configured for a package with their dishes
   */
  async getByPackage(req: Request, res: Response) {
    try {
      const { packageId } = req.params;

      console.log('[PackageCategory] Fetching categories for package:', packageId);

      // Fetch package with category settings
      const menuPackage = await prisma.menuPackage.findUnique({
        where: { id: packageId },
        include: {
          categorySettings: {
            where: { isEnabled: true },
            include: {
              category: {
                include: {
                  dishes: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                  },
                },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!menuPackage) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Transform to frontend-friendly format
      const categories = menuPackage.categorySettings.map((setting) => ({
        id: setting.id,
        categoryId: setting.categoryId,
        categoryName: setting.category.name,
        categorySlug: setting.category.slug,
        categoryIcon: setting.category.icon,
        categoryColor: setting.category.color,
        
        minSelect: toNumber(setting.minSelect),
        maxSelect: toNumber(setting.maxSelect),
        isRequired: setting.isRequired,
        customLabel: setting.customLabel || setting.category.name,
        displayOrder: setting.displayOrder,
        
        dishes: setting.category.dishes.map((dish) => ({
          id: dish.id,
          name: dish.name,
          description: dish.description,
          allergens: dish.allergens,
          displayOrder: dish.displayOrder,
        })),
      }));

      console.log('[PackageCategory] Returning', categories.length, 'categories with dishes');

      res.json({
        success: true,
        data: {
          packageId: menuPackage.id,
          packageName: menuPackage.name,
          categories,
        },
      });
    } catch (error: any) {
      console.error('[PackageCategory] Error in getByPackage:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /api/package-category-settings/:id
   * Get single category setting
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const setting = await prisma.packageCategorySettings.findUnique({
        where: { id },
        include: {
          category: true,
          package: true,
        },
      });

      if (!setting) {
        return res.status(404).json({ error: 'Category setting not found' });
      }

      res.json({
        success: true,
        data: setting,
      });
    } catch (error: any) {
      console.error('[PackageCategory] Error in getById:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /api/package-category-settings
   * Create category setting (Admin only)
   */
  async create(req: Request, res: Response) {
    try {
      // TODO: Implement when admin panel is ready
      res.status(501).json({ error: 'Not implemented yet - coming in admin panel' });
    } catch (error: any) {
      console.error('[PackageCategory] Error in create:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * PUT /api/package-category-settings/:id
   * Update category setting (Admin only)
   */
  async update(req: Request, res: Response) {
    try {
      // TODO: Implement when admin panel is ready
      res.status(501).json({ error: 'Not implemented yet - coming in admin panel' });
    } catch (error: any) {
      console.error('[PackageCategory] Error in update:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * DELETE /api/package-category-settings/:id
   * Delete category setting (Admin only)
   */
  async delete(req: Request, res: Response) {
    try {
      // TODO: Implement when admin panel is ready
      res.status(501).json({ error: 'Not implemented yet - coming in admin panel' });
    } catch (error: any) {
      console.error('[PackageCategory] Error in delete:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * PUT /api/menu-packages/:packageId/categories
   * Bulk update category settings for a package (Admin only)
   */
  async bulkUpdate(req: Request, res: Response) {
    try {
      // TODO: Implement when admin panel is ready
      res.status(501).json({ error: 'Not implemented yet - coming in admin panel' });
    } catch (error: any) {
      console.error('[PackageCategory] Error in bulkUpdate:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

export const packageCategoryController = new PackageCategoryController();
