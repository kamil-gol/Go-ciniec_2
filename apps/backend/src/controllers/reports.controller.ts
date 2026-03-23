// apps/backend/src/controllers/reports.controller.ts

/**
 * Reports Controller
 * Thin controller: validates input, delegates to services, sends response
 * Updated: menu preparations export endpoints (#160)
 * Refactored: extracted repeated validation into helpers, removed boilerplate
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import reportsService from '../services/reports';
import reportsExportService from '../services/reports-export.service';
import { AppError } from '../utils/AppError';
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

// ============================================
// HELPERS
// ============================================

/**
 * Parse and validate query params with a Zod schema + dateFrom <= dateTo check.
 * Throws AppError on failure so asyncHandler / error middleware catches it.
 */
function parseReportQuery<T extends { dateFrom: string; dateTo: string }>(
  query: unknown,
  schema: ZodSchema<T>,
): T {
  const validation = schema.safeParse(query);

  if (!validation.success) {
    throw AppError.badRequest(
      `Invalid query parameters: ${validation.error.errors.map(e => e.message).join(', ')}`,
    );
  }

  const filters = validation.data;

  if (filters.dateFrom > filters.dateTo) {
    throw AppError.badRequest('dateFrom must be before or equal to dateTo');
  }

  return filters;
}

/**
 * Set headers and send a file download response (Excel or PDF).
 */
function sendFileResponse(
  res: Response,
  buffer: Buffer,
  filename: string,
  contentType: string,
): void {
  const encodedFilename = encodeURIComponent(filename);
  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
  );
  res.send(buffer);
}

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_CONTENT_TYPE = 'application/pdf';

export class ReportsController {
  // ============================================
  // REVENUE REPORTS
  // ============================================

  async getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, revenueQuerySchema) as RevenueReportFilters;
      const report = await reportsService.getRevenueReport(filters);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // OCCUPANCY REPORTS
  // ============================================

  async getOccupancyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, occupancyQuerySchema) as OccupancyReportFilters;
      const report = await reportsService.getOccupancyReport(filters);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PREPARATIONS REPORTS (Service Extras) #159
  // ============================================

  async getPreparationsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, preparationsQuerySchema) as PreparationsReportFilters;
      const report = await reportsService.getPreparationsReport(filters);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // MENU PREPARATIONS REPORTS #160
  // ============================================

  async getMenuPreparationsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, menuPreparationsQuerySchema) as MenuPreparationsReportFilters;
      const report = await reportsService.getMenuPreparationsReport(filters);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // MENU PREPARATIONS EXPORT ENDPOINTS (#160)
  // ============================================

  async exportMenuPreparationsExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, menuPreparationsQuerySchema) as MenuPreparationsReportFilters;
      const report = await reportsService.getMenuPreparationsReport(filters);
      const buffer = await reportsExportService.exportMenuPreparationsToExcel(report);
      sendFileResponse(res, buffer, `raport_menu_${filters.dateFrom}_${filters.dateTo}.xlsx`, XLSX_CONTENT_TYPE);
    } catch (error) {
      next(error);
    }
  }

  async exportMenuPreparationsPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, menuPreparationsQuerySchema) as MenuPreparationsReportFilters;
      const report = await reportsService.getMenuPreparationsReport(filters);
      const buffer = await reportsExportService.exportMenuPreparationsToPDF(report);
      sendFileResponse(res, buffer, `raport_menu_${filters.dateFrom}_${filters.dateTo}.pdf`, PDF_CONTENT_TYPE);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PREPARATIONS EXPORT ENDPOINTS (#159)
  // ============================================

  async exportPreparationsExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, preparationsQuerySchema) as PreparationsReportFilters;
      const report = await reportsService.getPreparationsReport(filters);
      const buffer = await reportsExportService.exportPreparationsToExcel(report);
      sendFileResponse(res, buffer, `raport_przygotowania_${filters.dateFrom}_${filters.dateTo}.xlsx`, XLSX_CONTENT_TYPE);
    } catch (error) {
      next(error);
    }
  }

  async exportPreparationsPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, preparationsQuerySchema) as PreparationsReportFilters;
      const report = await reportsService.getPreparationsReport(filters);
      const buffer = await reportsExportService.exportPreparationsToPDF(report);
      sendFileResponse(res, buffer, `raport_przygotowania_${filters.dateFrom}_${filters.dateTo}.pdf`, PDF_CONTENT_TYPE);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // REVENUE & OCCUPANCY EXPORT ENDPOINTS
  // ============================================

  async exportRevenueExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, revenueQuerySchema) as RevenueReportFilters;
      const report = await reportsService.getRevenueReport(filters);
      const buffer = await reportsExportService.exportRevenueToExcel(report);
      sendFileResponse(res, buffer, `raport_przychody_${filters.dateFrom}_${filters.dateTo}.xlsx`, XLSX_CONTENT_TYPE);
    } catch (error) {
      next(error);
    }
  }

  async exportRevenuePDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, revenueQuerySchema) as RevenueReportFilters;
      const report = await reportsService.getRevenueReport(filters);
      const buffer = await reportsExportService.exportRevenueToPDF(report);
      sendFileResponse(res, buffer, `raport_przychody_${filters.dateFrom}_${filters.dateTo}.pdf`, PDF_CONTENT_TYPE);
    } catch (error) {
      next(error);
    }
  }

  async exportOccupancyExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, occupancyQuerySchema) as OccupancyReportFilters;
      const report = await reportsService.getOccupancyReport(filters);
      const buffer = await reportsExportService.exportOccupancyToExcel(report);
      sendFileResponse(res, buffer, `raport_zajetosc_${filters.dateFrom}_${filters.dateTo}.xlsx`, XLSX_CONTENT_TYPE);
    } catch (error) {
      next(error);
    }
  }

  async exportOccupancyPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = parseReportQuery(req.query, occupancyQuerySchema) as OccupancyReportFilters;
      const report = await reportsService.getOccupancyReport(filters);
      const buffer = await reportsExportService.exportOccupancyToPDF(report);
      sendFileResponse(res, buffer, `raport_zajetosc_${filters.dateFrom}_${filters.dateTo}.pdf`, PDF_CONTENT_TYPE);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportsController();
