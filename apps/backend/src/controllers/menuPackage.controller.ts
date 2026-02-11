/**
 * Menu Package Controller
 * 
 * HTTP handlers for menu package operations
 */

import { Request, Response, NextFunction } from 'express';
import { menuService } from '../services/menu.service';
import {
  createMenuPackageSchema,
  updateMenuPackageSchema,
  reorderPackagesSchema,
  assignOptionsToPackageSchema
} from '../validation/menu.validation';
import { z } from 'zod';

export class MenuPackageController {

  /**
   * GET /api/menu-packages
   * List all packages (with optional filter by menuTemplateId)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { menuTemplateId } = req.query;

      // If menuTemplateId provided, filter by template
      if (menuTemplateId && typeof menuTemplateId === 'string') {
        const packages = await menuService.getPackagesByTemplateId(menuTemplateId);
        return res.status(200).json({
          success: true,
          data: packages,
          count: packages.length
        });
      }

      // Otherwise return all packages
      const packages = await menuService.getAllPackages();

      return res.status(200).json({
        success: true,
        data: packages,
        count: packages.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/menu-packages/template/:templateId
   * List all packages for a menu template
   */
  async listByTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateId } = req.params;

      const packages = await menuService.getPackagesByTemplateId(templateId);

      return res.status(200).json({
        success: true,
        data: packages,
        count: packages.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/menu-packages/:id
   * Get single package by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const pkg = await menuService.getPackageById(id);

      return res.status(200).json({
        success: true,
        data: pkg
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Package not found') {
        return res.status(404).json({
          success: false,
          error: 'Package not found'
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/menu-packages
   * Create new package (ADMIN only)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = createMenuPackageSchema.parse(req.body);

      const pkg = await menuService.createPackage(data);

      return res.status(201).json({
        success: true,
        data: pkg,
        message: 'Package created successfully'
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
   * PUT /api/menu-packages/:id
   * Update package (ADMIN only)
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Validate request body
      const data = updateMenuPackageSchema.parse(req.body);

      const pkg = await menuService.updatePackage(id, data);

      return res.status(200).json({
        success: true,
        data: pkg,
        message: 'Package updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      if (error instanceof Error && error.message === 'Package not found') {
        return res.status(404).json({
          success: false,
          error: 'Package not found'
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/menu-packages/:id
   * Delete package (ADMIN only)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await menuService.deletePackage(id);

      return res.status(200).json({
        success: true,
        message: 'Package deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot delete')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      if (error instanceof Error && error.message === 'Package not found') {
        return res.status(404).json({
          success: false,
          error: 'Package not found'
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/menu-packages/reorder
   * Reorder packages (ADMIN only)
   */
  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const data = reorderPackagesSchema.parse(req.body);

      const result = await menuService.reorderPackages(data.packageOrders);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Packages reordered successfully'
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
   * POST /api/menu-packages/:id/options
   * Assign options to package (ADMIN only)
   */
  async assignOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Validate request body
      const data = assignOptionsToPackageSchema.parse(req.body);

      const pkg = await menuService.assignOptionsToPackage(id, data);

      return res.status(200).json({
        success: true,
        data: pkg,
        message: 'Options assigned successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      if (error instanceof Error && error.message === 'Package not found') {
        return res.status(404).json({
          success: false,
          error: 'Package not found'
        });
      }
      next(error);
    }
  }
}

export const menuPackageController = new MenuPackageController();
