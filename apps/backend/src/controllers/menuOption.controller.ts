import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Menu Option Categories (strict validation)
 */
const VALID_CATEGORIES = [
  'DRINK',
  'ALCOHOL',
  'DESSERT',
  'EXTRA_DISH',
  'SERVICE',
  'DECORATION',
  'ENTERTAINMENT',
  'OTHER',
] as const;

/**
 * Price Types
 */
const VALID_PRICE_TYPES = ['PER_PERSON', 'PER_ITEM', 'FLAT'] as const;

class MenuOptionController {
  /**
   * List all menu options with filtering
   * GET /api/menu-options
   * Query: category?, priceType?, isActive?, search?
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, priceType, isActive, search } = req.query;

      const where: any = {};

      if (category) {
        where.category = category as string;
      }

      if (priceType) {
        where.priceType = priceType as string;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const options = await prisma.menuOption.findMany({
        where,
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      logger.info(`[MenuOption] Listed ${options.length} options`, { filters: where });

      res.json({
        success: true,
        data: options,
        count: options.length,
      });
    } catch (error: any) {
      logger.error('[MenuOption] List error:', error);
      next(error);
    }
  }

  /**
   * Get single menu option by ID
   * GET /api/menu-options/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const option = await prisma.menuOption.findUnique({
        where: { id },
      });

      if (!option) {
        res.status(404).json({
          success: false,
          error: 'Menu option not found',
        });
        return;
      }

      logger.info(`[MenuOption] Retrieved option: ${option.name}`);

      res.json({
        success: true,
        data: option,
      });
    } catch (error: any) {
      logger.error('[MenuOption] GetById error:', error);
      next(error);
    }
  }

  /**
   * Create new menu option
   * POST /api/menu-options
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        res.status(400).json({
          success: false,
          error: 'Name, category, and priceType are required',
        });
        return;
      }

      // Validate category
      if (!VALID_CATEGORIES.includes(category)) {
        res.status(400).json({
          success: false,
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        });
        return;
      }

      // Validate priceType
      if (!VALID_PRICE_TYPES.includes(priceType)) {
        res.status(400).json({
          success: false,
          error: `Invalid priceType. Must be one of: ${VALID_PRICE_TYPES.join(', ')}`,
        });
        return;
      }

      const option = await prisma.menuOption.create({
        data: {
          name,
          description: description || null,
          shortDescription: shortDescription || null,
          category,
          priceType,
          priceAmount: priceAmount || 0,
          allowMultiple: allowMultiple || false,
          maxQuantity: maxQuantity || 1,
          icon: icon || null,
          imageUrl: imageUrl || null,
          thumbnailUrl: thumbnailUrl || null,
          isActive: isActive !== undefined ? isActive : true,
          displayOrder: displayOrder || 0,
        },
      });

      logger.info(`[MenuOption] Created: ${option.name} (${option.id})`);

      res.status(201).json({
        success: true,
        data: option,
        message: 'Menu option created successfully',
      });
    } catch (error: any) {
      logger.error('[MenuOption] Create error:', error);
      next(error);
    }
  }

  /**
   * Update menu option
   * PUT /api/menu-options/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if exists
      const existing = await prisma.menuOption.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Menu option not found',
        });
        return;
      }

      // Validate category if provided
      if (updateData.category && !VALID_CATEGORIES.includes(updateData.category)) {
        res.status(400).json({
          success: false,
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        });
        return;
      }

      // Validate priceType if provided
      if (updateData.priceType && !VALID_PRICE_TYPES.includes(updateData.priceType)) {
        res.status(400).json({
          success: false,
          error: `Invalid priceType. Must be one of: ${VALID_PRICE_TYPES.join(', ')}`,
        });
        return;
      }

      const option = await prisma.menuOption.update({
        where: { id },
        data: updateData,
      });

      logger.info(`[MenuOption] Updated: ${option.name} (${option.id})`);

      res.json({
        success: true,
        data: option,
        message: 'Menu option updated successfully',
      });
    } catch (error: any) {
      logger.error('[MenuOption] Update error:', error);
      next(error);
    }
  }

  /**
   * Delete menu option
   * DELETE /api/menu-options/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check if exists
      const existing = await prisma.menuOption.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Menu option not found',
        });
        return;
      }

      await prisma.menuOption.delete({
        where: { id },
      });

      logger.info(`[MenuOption] Deleted: ${existing.name} (${id})`);

      res.json({
        success: true,
        message: 'Menu option deleted successfully',
      });
    } catch (error: any) {
      logger.error('[MenuOption] Delete error:', error);
      next(error);
    }
  }
}

export const menuOptionController = new MenuOptionController();
