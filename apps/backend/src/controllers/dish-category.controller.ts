/**
 * Dish Category Controller
 * Handles HTTP requests for dish category management
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class DishCategoryController {
  /**
   * GET /api/dish-categories
   * Get all categories
   */
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.dishCategory.findMany({
        include: {
          _count: {
            select: { dishes: true },
          },
        },
        orderBy: { displayOrder: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      logger.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch categories',
      });
    }
  }

  /**
   * GET /api/dish-categories/:id
   * Get single category by ID
   */
  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await prisma.dishCategory.findUnique({
        where: { id },
        include: {
          _count: {
            select: { dishes: true },
          },
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
        });
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Error getting category:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch category',
      });
    }
  }

  /**
   * GET /api/dish-categories/slug/:slug
   * Get category by slug
   */
  async getCategoryBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const category = await prisma.dishCategory.findUnique({
        where: { slug: slug.toUpperCase() },
        include: {
          _count: {
            select: { dishes: true },
          },
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: `Category with slug "${slug}" not found`,
        });
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Error getting category by slug:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch category',
      });
    }
  }

  /**
   * POST /api/dish-categories
   * Create new category (protected)
   */
  async createCategory(req: Request, res: Response) {
    try {
      const { slug, name, icon, color, displayOrder, isActive } = req.body;

      // Validation
      if (!slug || !name) {
        return res.status(400).json({
          success: false,
          error: 'Slug and name are required',
        });
      }

      // Check if category with same slug already exists
      const existing = await prisma.dishCategory.findUnique({
        where: { slug: slug.toUpperCase() },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: `Category with slug "${slug}" already exists`,
        });
      }

      const category = await prisma.dishCategory.create({
        data: {
          slug: slug.toUpperCase(),
          name,
          icon,
          color,
          displayOrder: displayOrder ?? 0,
          isActive: isActive ?? true,
        },
      });

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create category',
      });
    }
  }

  /**
   * PUT /api/dish-categories/:id
   * Update category (protected)
   */
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { slug, name, icon, color, displayOrder, isActive } = req.body;

      // Check if category exists
      const existing = await prisma.dishCategory.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
        });
      }

      // If updating slug, check for conflicts
      if (slug && slug !== existing.slug) {
        const conflict = await prisma.dishCategory.findFirst({
          where: {
            slug: slug.toUpperCase(),
            NOT: { id },
          },
        });

        if (conflict) {
          return res.status(409).json({
            success: false,
            error: `Category with slug "${slug}" already exists`,
          });
        }
      }

      const updateData: any = {};
      if (slug !== undefined) updateData.slug = slug.toUpperCase();
      if (name !== undefined) updateData.name = name;
      if (icon !== undefined) updateData.icon = icon;
      if (color !== undefined) updateData.color = color;
      if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
      if (isActive !== undefined) updateData.isActive = isActive;

      const category = await prisma.dishCategory.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        data: category,
        message: 'Category updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update category',
      });
    }
  }

  /**
   * DELETE /api/dish-categories/:id
   * Delete category (protected)
   * Now with automatic displayOrder reordering!
   */
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if category exists
      const category = await prisma.dishCategory.findUnique({
        where: { id },
        include: {
          _count: {
            select: { dishes: true },
          },
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
        });
      }

      // Check if category has dishes
      if (category._count.dishes > 0) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete category "${category.name}" because it has ${category._count.dishes} dish(es) assigned`,
        });
      }

      // Delete category and reorder in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete the category
        await tx.dishCategory.delete({
          where: { id },
        });

        // Get all remaining categories ordered by displayOrder
        const remainingCategories = await tx.dishCategory.findMany({
          orderBy: { displayOrder: 'asc' },
        });

        // Reindex displayOrder to be sequential (0, 1, 2, ...)
        const reorderUpdates = remainingCategories.map((cat, index) =>
          tx.dishCategory.update({
            where: { id: cat.id },
            data: { displayOrder: index },
          })
        );

        await Promise.all(reorderUpdates);
      });

      logger.info(`[DishCategory] Deleted category: ${category.name} and reordered remaining`);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete category',
      });
    }
  }

  /**
   * POST /api/dish-categories/reorder
   * Reorder categories (protected)
   */
  async reorderCategories(req: Request, res: Response) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids)) {
        return res.status(400).json({
          success: false,
          error: 'ids must be an array',
        });
      }

      const updates = ids.map((id, index) =>
        prisma.dishCategory.update({
          where: { id },
          data: { displayOrder: index },
        })
      );

      await prisma.$transaction(updates);

      res.status(200).json({
        success: true,
        message: 'Categories reordered successfully',
      });
    } catch (error: any) {
      logger.error('Error reordering categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to reorder categories',
      });
    }
  }
}

export default new DishCategoryController();
