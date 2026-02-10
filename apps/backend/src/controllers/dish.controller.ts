/**
 * Dish Controller
 * Handles HTTP requests for dish management
 */

import { Request, Response } from 'express';
import dishService from '../services/dish.service';
import { logger } from '../utils/logger';

class DishController {
  /**
   * GET /api/dishes
   * Get all dishes with optional filters
   */
  async getDishes(req: Request, res: Response) {
    try {
      const { category, isActive, search } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (search) filters.search = search as string;

      const dishes = await dishService.findAll(filters);

      res.status(200).json({
        success: true,
        data: dishes,
      });
    } catch (error: any) {
      logger.error('Error getting dishes:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch dishes',
      });
    }
  }

  /**
   * GET /api/dishes/:id
   * Get single dish by ID
   */
  async getDishById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dish = await dishService.findOne(id);

      if (!dish) {
        return res.status(404).json({
          success: false,
          error: 'Dish not found',
        });
      }

      res.status(200).json({
        success: true,
        data: dish,
      });
    } catch (error: any) {
      logger.error('Error getting dish:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch dish',
      });
    }
  }

  /**
   * GET /api/dishes/category/:category
   * Get dishes by category
   */
  async getDishesByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const dishes = await dishService.findByCategory(category);

      res.status(200).json({
        success: true,
        data: dishes,
      });
    } catch (error: any) {
      logger.error('Error getting dishes by category:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch dishes',
      });
    }
  }

  /**
   * POST /api/dishes
   * Create new dish
   */
  async createDish(req: Request, res: Response) {
    try {
      const { name, description, category, allergens, isActive } = req.body;

      // Validation
      if (!name || !category) {
        return res.status(400).json({
          success: false,
          error: 'Name and category are required',
        });
      }

      const dish = await dishService.create({
        name,
        description,
        category,
        allergens: allergens || [],
        isActive: isActive ?? true,
      });

      res.status(201).json({
        success: true,
        data: dish,
        message: 'Dish created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating dish:', error);
      
      if (error.message?.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create dish',
      });
    }
  }

  /**
   * PUT /api/dishes/:id
   * Update dish
   */
  async updateDish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, category, allergens, isActive } = req.body;

      const dish = await dishService.update(id, {
        name,
        description,
        category,
        allergens,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: dish,
        message: 'Dish updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating dish:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message?.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update dish',
      });
    }
  }

  /**
   * DELETE /api/dishes/:id
   * Delete dish
   */
  async deleteDish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await dishService.remove(id);

      res.status(200).json({
        success: true,
        message: 'Dish deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting dish:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete dish',
      });
    }
  }
}

export default new DishController();
