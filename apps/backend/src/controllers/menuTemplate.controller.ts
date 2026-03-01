/**
 * Menu Template Controller - with userId for audit
 * NOTE: MenuOption/packageOptions removed from Prisma.
 * PDF options section now returns empty array.
 */

import { Request, Response, NextFunction } from 'express';
import { menuService } from '../services/menu.service';
import { pdfService } from '../services/pdf.service';
import type { MenuCardPDFData } from '../services/pdf.service';
import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import { CreateMenuTemplateInput, UpdateMenuTemplateInput } from '../types/menu.types';
import {
  createMenuTemplateSchema,
  updateMenuTemplateSchema,
  duplicateMenuTemplateSchema,
  menuTemplateQuerySchema
} from '../validation/menu.validation';
import { z } from 'zod';

export class MenuTemplateController {

  async list(req: Request, res: Response, next: NextFunction) {
    try {
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
          error: 'Błąd walidacji',
          details: error.errors
        });
      }
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const template = await menuService.getMenuTemplateById(id);

      return res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      if (error instanceof Error && (error.message.includes('nie znaleziono') || (error.message.toLowerCase().includes('nie znaleziono') || error.message.toLowerCase().includes('not found')))) {
        return res.status(404).json({
          success: false,
          error: 'Menu template not found'
        });
      }
      next(error);
    }
  }

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
      if (error instanceof Error && (error.message.includes('Nie znaleziono aktywnego menu') || error.message.includes('No active menu found'))) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createMenuTemplateSchema.parse(req.body) as unknown as CreateMenuTemplateInput;
      const userId = (req as any).user?.id;

      if (!userId) throw AppError.unauthorized('User not authenticated');

      const template = await menuService.createMenuTemplate(data, userId);

      return res.status(201).json({
        success: true,
        data: template,
        message: 'Menu template created successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Błąd walidacji',
          details: error.errors
        });
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateMenuTemplateSchema.parse(req.body) as unknown as UpdateMenuTemplateInput;
      const userId = (req as any).user?.id;

      if (!userId) throw AppError.unauthorized('User not authenticated');

      const template = await menuService.updateMenuTemplate(id, data, userId);

      return res.status(200).json({
        success: true,
        data: template,
        message: 'Menu template updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Błąd walidacji',
          details: error.errors
        });
      }
      if (error instanceof Error && (error.message.includes('nie znaleziono') || (error.message.toLowerCase().includes('nie znaleziono') || error.message.toLowerCase().includes('not found')))) {
        return res.status(404).json({
          success: false,
          error: 'Menu template not found'
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

      await menuService.deleteMenuTemplate(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Menu template deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && (error.message.includes('Nie można usunąć') || error.message.includes('Cannot delete'))) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      if (error instanceof Error && (error.message.includes('nie znaleziono') || (error.message.toLowerCase().includes('nie znaleziono') || error.message.toLowerCase().includes('not found')))) {
        return res.status(404).json({
          success: false,
          error: 'Menu template not found'
        });
      }
      next(error);
    }
  }

  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = duplicateMenuTemplateSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) throw AppError.unauthorized('User not authenticated');

      const template = await menuService.duplicateMenuTemplate(id, {
        name: data.newName,
        variant: data.newVariant,
        validFrom: data.validFrom,
        validTo: data.validTo ?? undefined
      }, userId);

      return res.status(201).json({
        success: true,
        data: template,
        message: 'Menu template duplicated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Błąd walidacji',
          details: error.errors
        });
      }
      if (error instanceof Error && (error.message.includes('nie znaleziono') || (error.message.toLowerCase().includes('nie znaleziono') || error.message.toLowerCase().includes('not found')))) {
        return res.status(404).json({
          success: false,
          error: 'Menu template not found'
        });
      }
      next(error);
    }
  }

  async downloadPdf(req: Request, res: Response) {
    try {
      const { id } = req.params;

      console.log(`[MenuTemplate PDF] Starting PDF generation for template ${id}`);

      const template = await menuService.getMenuTemplateById(id);
      const templateAny = template as any;
      console.log(`[MenuTemplate PDF] Template found: ${template.name}, packages: ${templateAny.packages?.length || 0}`);

      const packagesWithCourses = await Promise.all(
        (templateAny.packages || []).map(async (pkg: any) => {
          console.log(`[MenuTemplate PDF] Fetching categories for package: ${pkg.name} (${pkg.id})`);

          const categorySettings = await prisma.packageCategorySettings.findMany({
            where: { packageId: pkg.id, isEnabled: true },
            include: {
              category: {
                include: {
                  dishes: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' }
                  }
                }
              }
            },
            orderBy: { displayOrder: 'asc' }
          });

          console.log(`[MenuTemplate PDF] Package ${pkg.name}: ${categorySettings.length} categories found`);

          return {
            name: pkg.name,
            description: pkg.description,
            shortDescription: pkg.shortDescription,
            pricePerAdult: Number(pkg.pricePerAdult),
            pricePerChild: Number(pkg.pricePerChild),
            pricePerToddler: Number(pkg.pricePerToddler),
            badgeText: pkg.badgeText,
            includedItems: Array.isArray(pkg.includedItems) ? pkg.includedItems as string[] : [],
            courses: categorySettings.map((cs: any) => ({
              name: cs.customLabel || cs.category.name,
              description: null,
              icon: cs.category.icon,
              minSelect: Number(cs.minSelect),
              maxSelect: Number(cs.maxSelect),
              dishes: (cs.category.dishes || []).map((dish: any) => ({
                name: dish.name,
                description: dish.description,
                allergens: Array.isArray(dish.allergens) ? dish.allergens : [],
              })),
            })),
            // MenuOption/packageOptions removed — options section empty
            options: [],
          };
        })
      );

      const pdfData: MenuCardPDFData = {
        templateName: template.name,
        templateDescription: template.description,
        variant: template.variant,
        eventTypeName: (template as any).eventType?.name || 'Ogolne',
        eventTypeColor: (template as any).eventType?.color,
        packages: packagesWithCourses,
      };

      console.log(`[MenuTemplate PDF] Generating PDF with ${packagesWithCourses.length} packages`);

      const pdfBuffer = await pdfService.generateMenuCardPDF(pdfData);

      console.log(`[MenuTemplate PDF] PDF generated successfully, size: ${pdfBuffer.length} bytes`);

      // RFC 5987 encoding for Polish characters in filename
      const safeFilename = `Karta_menu_${template.name.replace(/\s+/g, '_')}.pdf`;
      const encodedFilename = encodeURIComponent(safeFilename);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="menu.pdf"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error('[MenuTemplate PDF] Error:', error);

      if (error instanceof Error && (error.message.includes('nie znaleziono') || (error.message.toLowerCase().includes('nie znaleziono') || error.message.toLowerCase().includes('not found')))) {
        return res.status(404).json({
          success: false,
          error: 'Menu template not found',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Nie udało się wygenerować PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const menuTemplateController = new MenuTemplateController();
