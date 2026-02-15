/**
 * Menu Package Controller - with userId for audit
 */

import { Request, Response, NextFunction } from 'express';
import { menuService } from '../services/menu.service';
import { AppError } from '../utils/AppError';
import {
  createMenuPackageSchema,
  updateMenuPackageSchema,
  reorderPackagesSchema,
  assignOptionsToPackageSchema
} from '../validation/menu.validation';
import { z } from 'zod';

export class MenuPackageController {

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { menuTemplateId } = req.query;

      if (menuTemplateId && typeof menuTemplateId === 'string') {
        const packages = await menuService.getPackagesByTemplateId(menuTemplateId);
        return res.status(200).json({
          success: true,
          data: packages,
          count: packages.length
        });
      }

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

  async listByEventType(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventTypeId } = req.params;

      const packages = await menuService.getPackagesByEventType(eventTypeId);

      return res.status(200).json({
        success: true,
        data: packages,
        count: packages.length
      });
    } catch (error) {
      next(error);
    }
  }

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

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createMenuPackageSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) throw AppError.unauthorized('User not authenticated');

      const pkg = await menuService.createPackage(data, userId);

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

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateMenuPackageSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) throw AppError.unauthorized('User not authenticated');

      const pkg = await menuService.updatePackage(id, data, userId);

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

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) throw AppError.unauthorized('User not authenticated');

      await menuService.deletePackage(id, userId);

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

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
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

  async assignOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
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
