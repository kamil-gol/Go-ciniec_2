/**
import { getErrorMessage } from '@/utils/AppError';
 * Menu Package Categories Controller
 * 
 * Handles fetching package category settings with dishes
 */

import { Request, Response } from 'express';
import prisma from '@/lib/prisma';

function toNumber(decimal: any): number {
  return parseFloat(decimal.toString());
}

/**
 * GET /api/menu-packages/:packageId/categories
 * Get all categories configured for a package with their dishes
 */
export async function getPackageCategories(req: Request, res: Response) {
  try {
    const { packageId } = req.params;

    console.log('[getPackageCategories] Fetching for package:', packageId);

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
      customLabel: setting.customLabel,
      displayOrder: setting.displayOrder,
      portionTarget: setting.portionTarget,
      // #216: Category extras fields
      extraItemPrice: setting.extraItemPrice != null ? toNumber(setting.extraItemPrice) : null,
      maxExtra: setting.maxExtra != null ? toNumber(setting.maxExtra) : null,
      
      dishes: setting.category.dishes.map((dish) => ({
        id: dish.id,
        name: dish.name,
        description: dish.description,
        allergens: dish.allergens,
        displayOrder: dish.displayOrder,
      })),
    }));

    console.log('[getPackageCategories] Returning', categories.length, 'categories');

    res.json({
      success: true,
      data: {
        packageId: menuPackage.id,
        packageName: menuPackage.name,
        categories,
      },
    });
  } catch (error: unknown) {
    console.error('[getPackageCategories] Error:', error);
    res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' });
  }
}
