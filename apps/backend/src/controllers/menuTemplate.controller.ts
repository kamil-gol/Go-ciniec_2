/**
 * Menu Template Controller
 * 
 * HTTP handlers for menu template operations
 */

import { Request, Response, NextFunction } from 'express';
import { menuService } from '../services/menu.service';
import {
  createMenuTemplateSchema,
  updateMenuTemplateSchema,
  duplicateMenuTemplateSchema,
  menuTemplateQuerySchema
} from '../validation/menu.validation';
import { z } from 'zod';

export class MenuTemplateController {

  /**
   * GET /api/menu-templates
   * List all menu templates with optional filters
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate query params
      const filters = menuTemplateQuerySchema.parse(req.query);

      const templates = await menuService.getMenuTemplates({
        eventTypeId: filters.eventTypeId,
        isActive: filters.isActive,
        date: filters.date
      });

      return res.status(200).json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/menu-templates/:id
   * Get single menu template by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const template = await menuService.getMenuTemplateById(id);

      return res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Menu template not found') {
        return res.status(404).json({
          success: false,
          error: 'Menu template not found'
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/menu-templates/active/:eventTypeId
   * Get active menu template for event type
   */
  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventTypeId } = req.params;
      const { date } = req.query;

      const menuDate = date ? new Date(date as string) : new Date();

      const template = await menuService.getActiveMenuForEventType(
        eventTypeId,
        menuDate
      );

      return res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('No active menu found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/menu-templates
   * Create new menu template (ADMIN only)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = createMenuTemplateSchema.parse(req.body);

      const template = await menuService.createMenuTemplate(data);

      return res.status(201).json({
        success: true,
        data: template,
        message: 'Menu template created successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/menu-templates/:id
   * Update menu template (ADMIN only)
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Validate request body
      const data = updateMenuTemplateSchema.parse(req.body);

      const template = await menuService.updateMenuTemplate(id, data);

      return res.status(200).json({
        success: true,
        data: template,
        message: 'Menu template updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      if (error instanceof Error && error.message === 'Menu template not found') {
        return res.status(404).json({
          success: false,
          error: 'Menu template not found'
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/menu-templates/:id
   * Delete menu template (ADMIN only)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await menuService.deleteMenuTemplate(id);

      return res.status(200).json({
        success: true,
        message: 'Menu template deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot delete')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      if (error instanceof Error && error.message === 'Menu template not found') {
        return res.status(404).json({
          success: false,
          error: 'Menu template not found'
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/menu-templates/:id/duplicate
   * Duplicate menu template with all packages and options (ADMIN only)
   */
  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Validate request body
      const data = duplicateMenuTemplateSchema.parse(req.body);

      const template = await menuService.duplicateMenuTemplate(id, {
        name: data.newName,
        variant: data.newVariant,
        validFrom: data.validFrom,
        validTo: data.validTo
      });

      return res.status(201).json({
        success: true,
        data: template,
        message: 'Menu template duplicated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      if (error instanceof Error && error.message === 'Menu template not found') {
        return res.status(404).json({
          success: false,
          error: 'Menu template not found'
        });
      }
      next(error);
    }
  }
}

export const menuTemplateController = new MenuTemplateController();
