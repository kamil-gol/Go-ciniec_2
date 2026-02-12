/**
 * Dish Category Controller
 * MIGRATED: Prisma singleton + AppError + no try/catch
 * CRITICAL FIX: removed `new PrismaClient()` (connection leak)
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

class DishCategoryController {
  async getCategories(_req: Request, res: Response): Promise<void> {
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
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const category = await prisma.dishCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dishes: true },
        },
      },
    });

    if (!category) throw AppError.notFound('Category');

    res.status(200).json({
      success: true,
      data: category,
    });
  }

  async getCategoryBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;
    const category = await prisma.dishCategory.findUnique({
      where: { slug: slug.toUpperCase() },
      include: {
        _count: {
          select: { dishes: true },
        },
      },
    });

    if (!category) throw AppError.notFound(`Category with slug "${slug}"`);

    res.status(200).json({
      success: true,
      data: category,
    });
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const { slug, name, icon, color, displayOrder, isActive } = req.body;

    if (!slug || !name) {
      throw AppError.badRequest('Slug and name are required');
    }

    const existing = await prisma.dishCategory.findUnique({
      where: { slug: slug.toUpperCase() },
    });

    if (existing) {
      throw AppError.conflict(`Category with slug "${slug}" already exists`);
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
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { slug, name, icon, color, displayOrder, isActive } = req.body;

    const existing = await prisma.dishCategory.findUnique({
      where: { id },
    });

    if (!existing) throw AppError.notFound('Category');

    if (slug && slug !== existing.slug) {
      const conflict = await prisma.dishCategory.findFirst({
        where: {
          slug: slug.toUpperCase(),
          NOT: { id },
        },
      });

      if (conflict) {
        throw AppError.conflict(`Category with slug "${slug}" already exists`);
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
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const category = await prisma.dishCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dishes: true },
        },
      },
    });

    if (!category) throw AppError.notFound('Category');

    if (category._count.dishes > 0) {
      throw AppError.conflict(
        `Cannot delete category "${category.name}" because it has ${category._count.dishes} dish(es) assigned`
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.dishCategory.delete({
        where: { id },
      });

      const remainingCategories = await tx.dishCategory.findMany({
        orderBy: { displayOrder: 'asc' },
      });

      const reorderUpdates = remainingCategories.map((cat, index) =>
        tx.dishCategory.update({
          where: { id: cat.id },
          data: { displayOrder: index },
        })
      );

      await Promise.all(reorderUpdates);
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  }

  async reorderCategories(req: Request, res: Response): Promise<void> {
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      throw AppError.badRequest('ids must be an array');
    }

    const updates = ids.map((id: string, index: number) =>
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
  }
}

export default new DishCategoryController();
