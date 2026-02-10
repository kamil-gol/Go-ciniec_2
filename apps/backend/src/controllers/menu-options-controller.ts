import { Request, Response, NextFunction } from 'express';
import * as menuOptionsService from '../services/menu-options-service';
import { AppError } from '../utils/errors';

/**
 * Get all menu options with filtering
 * Query params: category, priceType, isActive
 */
export async function getAllMenuOptions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category, priceType, isActive } = req.query;

    const filters: any = {};
    if (category) filters.category = category as string;
    if (priceType) filters.priceType = priceType as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const options = await menuOptionsService.getAllMenuOptions(filters);

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single menu option by ID
 */
export async function getMenuOptionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const option = await menuOptionsService.getMenuOptionById(id);

    if (!option) {
      throw new AppError('Menu option not found', 404);
    }

    res.json({
      success: true,
      data: option,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new menu option
 */
export async function createMenuOption(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      name,
      description,
      shortDescription,
      category,
      priceType,
      priceAmount,
      allowMultiple,
      maxQuantity,
      icon,
      imageUrl,
      thumbnailUrl,
      isActive,
      displayOrder,
    } = req.body;

    // Validation
    if (!name || !category || !priceType) {
      throw new AppError('Name, category, and priceType are required', 400);
    }

    // Validate priceType
    const validPriceTypes = ['PER_PERSON', 'PER_ITEM', 'FLAT'];
    if (!validPriceTypes.includes(priceType)) {
      throw new AppError(
        `Invalid priceType. Must be one of: ${validPriceTypes.join(', ')}`,
        400
      );
    }

    // Validate category
    const validCategories = [
      'DRINK',
      'ALCOHOL',
      'DESSERT',
      'EXTRA_DISH',
      'SERVICE',
      'DECORATION',
      'ENTERTAINMENT',
      'OTHER',
    ];
    if (!validCategories.includes(category)) {
      throw new AppError(
        `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        400
      );
    }

    const option = await menuOptionsService.createMenuOption({
      name,
      description,
      shortDescription,
      category,
      priceType,
      priceAmount: priceAmount || 0,
      allowMultiple: allowMultiple || false,
      maxQuantity: maxQuantity || 1,
      icon,
      imageUrl,
      thumbnailUrl,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0,
    });

    res.status(201).json({
      success: true,
      data: option,
      message: 'Menu option created successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update menu option
 */
export async function updateMenuOption(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if exists
    const existing = await menuOptionsService.getMenuOptionById(id);
    if (!existing) {
      throw new AppError('Menu option not found', 404);
    }

    // Validate priceType if provided
    if (updateData.priceType) {
      const validPriceTypes = ['PER_PERSON', 'PER_ITEM', 'FLAT'];
      if (!validPriceTypes.includes(updateData.priceType)) {
        throw new AppError(
          `Invalid priceType. Must be one of: ${validPriceTypes.join(', ')}`,
          400
        );
      }
    }

    // Validate category if provided
    if (updateData.category) {
      const validCategories = [
        'DRINK',
        'ALCOHOL',
        'DESSERT',
        'EXTRA_DISH',
        'SERVICE',
        'DECORATION',
        'ENTERTAINMENT',
        'OTHER',
      ];
      if (!validCategories.includes(updateData.category)) {
        throw new AppError(
          `Invalid category. Must be one of: ${validCategories.join(', ')}`,
          400
        );
      }
    }

    const option = await menuOptionsService.updateMenuOption(id, updateData);

    res.json({
      success: true,
      data: option,
      message: 'Menu option updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete menu option
 */
export async function deleteMenuOption(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Check if exists
    const existing = await menuOptionsService.getMenuOptionById(id);
    if (!existing) {
      throw new AppError('Menu option not found', 404);
    }

    await menuOptionsService.deleteMenuOption(id);

    res.json({
      success: true,
      message: 'Menu option deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
