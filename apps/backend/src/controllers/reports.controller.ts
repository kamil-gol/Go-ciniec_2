// apps/backend/src/controllers/reports.controller.ts

/**
 * Reports Controller
 * Endpoints for revenue, occupancy, preparations, menu-preparations, and other analytics
 * Updated: menu preparations export endpoints (#160)
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import reportsService from '../services/reports';
import reportsExportService from '../services/reports-export.service';
import type {
  RevenueReportFilters,
  OccupancyReportFilters,
  PreparationsReportFilters,
  MenuPreparationsReportFilters,
} from '@/types/reports.types';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const revenueQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  groupBy: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
  hallId: z.string().uuid().optional(),
  eventTypeId: z.string().uuid().optional(),
  status: z.enum(['CONFIRMED', 'COMPLETED']).optional(),
});

const occupancyQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  hallId: z.string().uuid().optional(),
});

const preparationsQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  categoryId: z.string().uuid().optional(),
  view: z.enum(['detailed', 'summary']).optional().default('detailed'),
});

const menuPreparationsQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  view: z.enum(['detailed', 'summary']).optional().default('detailed'),
});

export class ReportsController {
  // ============================================
  // REVENUE REPORTS
  // ============================================

  async getRevenueReport(req: Request, res: Response): Promise<void> {
    try {
      const validation = revenueQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as RevenueReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getRevenueReport(filters);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error in getRevenueReport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate revenue report',
        error: error.message,
      });
    }
  }

  // ============================================
  // OCCUPANCY REPORTS
  // ============================================

  async getOccupancyReport(req: Request, res: Response): Promise<void> {
    try {
      const validation = occupancyQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as OccupancyReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getOccupancyReport(filters);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error in getOccupancyReport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate occupancy report',
        error: error.message,
      });
    }
  }

  // ============================================
  // PREPARATIONS REPORTS (Service Extras) #159
  // ============================================

  async getPreparationsReport(req: Request, res: Response): Promise<void> {
    try {
      const validation = preparationsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as PreparationsReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getPreparationsReport(filters);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error in getPreparationsReport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate preparations report',
        error: error.message,
      });
    }
  }

  // ============================================
  // MENU PREPARATIONS REPORTS #160
  // ============================================

  async getMenuPreparationsReport(req: Request, res: Response): Promise<void> {
    try {
      const validation = menuPreparationsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as MenuPreparationsReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getMenuPreparationsReport(filters);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error in getMenuPreparationsReport:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate menu preparations report',
        error: error.message,
      });
    }
  }

  // ============================================
  // MENU PREPARATIONS EXPORT ENDPOINTS (#160)
  // ============================================

  /**
   * GET /api/reports/export/menu-preparations/excel
   * Export menu preparations report to Excel (XLSX)
   */
  async exportMenuPreparationsExcel(req: Request, res: Response): Promise<void> {
    try {
      const validation = menuPreparationsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as MenuPreparationsReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getMenuPreparationsReport(filters);
      const buffer = await reportsExportService.exportMenuPreparationsToExcel(report);

      const filename = `raport_menu_${filters.dateFrom}_${filters.dateTo}.xlsx`;
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.send(buffer);
    } catch (error: any) {
      console.error('Error in exportMenuPreparationsExcel:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export menu preparations report to Excel',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/export/menu-preparations/pdf
   * Export menu preparations report to PDF
   */
  async exportMenuPreparationsPDF(req: Request, res: Response): Promise<void> {
    try {
      const validation = menuPreparationsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as MenuPreparationsReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getMenuPreparationsReport(filters);
      const buffer = await reportsExportService.exportMenuPreparationsToPDF(report);

      const filename = `raport_menu_${filters.dateFrom}_${filters.dateTo}.pdf`;
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.send(buffer);
    } catch (error: any) {
      console.error('Error in exportMenuPreparationsPDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export menu preparations report to PDF',
        error: error.message,
      });
    }
  }

  // ============================================
  // PREPARATIONS EXPORT ENDPOINTS (#159)
  // ============================================

  /**
   * GET /api/reports/export/preparations/excel
   * Export preparations report to Excel (XLSX)
   */
  async exportPreparationsExcel(req: Request, res: Response): Promise<void> {
    try {
      const validation = preparationsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as PreparationsReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getPreparationsReport(filters);
      const buffer = await reportsExportService.exportPreparationsToExcel(report);

      const filename = `raport_przygotowania_${filters.dateFrom}_${filters.dateTo}.xlsx`;
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.send(buffer);
    } catch (error: any) {
      console.error('Error in exportPreparationsExcel:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export preparations report to Excel',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/export/preparations/pdf
   * Export preparations report to PDF
   */
  async exportPreparationsPDF(req: Request, res: Response): Promise<void> {
    try {
      const validation = preparationsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as PreparationsReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getPreparationsReport(filters);
      const buffer = await reportsExportService.exportPreparationsToPDF(report);

      const filename = `raport_przygotowania_${filters.dateFrom}_${filters.dateTo}.pdf`;
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.send(buffer);
    } catch (error: any) {
      console.error('Error in exportPreparationsPDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export preparations report to PDF',
        error: error.message,
      });
    }
  }

  // ============================================
  // REVENUE & OCCUPANCY EXPORT ENDPOINTS
  // ============================================

  async exportRevenueExcel(req: Request, res: Response): Promise<void> {
    try {
      const validation = revenueQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as RevenueReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getRevenueReport(filters);
      const buffer = await reportsExportService.exportRevenueToExcel(report);

      const filename = `raport_przychody_${filters.dateFrom}_${filters.dateTo}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error in exportRevenueExcel:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export revenue report to Excel',
        error: error.message,
      });
    }
  }

  async exportRevenuePDF(req: Request, res: Response): Promise<void> {
    try {
      const validation = revenueQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as RevenueReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getRevenueReport(filters);
      const buffer = await reportsExportService.exportRevenueToPDF(report);

      const filename = `raport_przychody_${filters.dateFrom}_${filters.dateTo}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error in exportRevenuePDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export revenue report to PDF',
        error: error.message,
      });
    }
  }

  async exportOccupancyExcel(req: Request, res: Response): Promise<void> {
    try {
      const validation = occupancyQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as OccupancyReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getOccupancyReport(filters);
      const buffer = await reportsExportService.exportOccupancyToExcel(report);

      const filename = `raport_zajetosc_${filters.dateFrom}_${filters.dateTo}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error in exportOccupancyExcel:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export occupancy report to Excel',
        error: error.message,
      });
    }
  }

  async exportOccupancyPDF(req: Request, res: Response): Promise<void> {
    try {
      const validation = occupancyQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors,
        });
        return;
      }

      const filters = validation.data as OccupancyReportFilters;

      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      const report = await reportsService.getOccupancyReport(filters);
      const buffer = await reportsExportService.exportOccupancyToPDF(report);

      const filename = `raport_zajetosc_${filters.dateFrom}_${filters.dateTo}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error in exportOccupancyPDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export occupancy report to PDF',
        error: error.message,
      });
    }
  }
}

export default new ReportsController();
