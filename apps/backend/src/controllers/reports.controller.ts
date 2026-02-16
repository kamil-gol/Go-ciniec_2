// apps/backend/src/controllers/reports.controller.ts

/**
 * Reports Controller
 * Endpoints for revenue, occupancy, and other analytics
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import reportsService from '../services/reports.service';
import type {
  RevenueReportFilters,
  OccupancyReportFilters,
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

export class ReportsController {
  // ============================================
  // REVENUE REPORTS
  // ============================================

  /**
   * GET /api/reports/revenue
   * Get revenue report with breakdown and rankings
   * @query dateFrom - Start date (YYYY-MM-DD)
   * @query dateTo - End date (YYYY-MM-DD)
   * @query groupBy - Aggregation period (day/week/month/year)
   * @query hallId - Filter by hall (optional)
   * @query eventTypeId - Filter by event type (optional)
   * @query status - Filter by status (optional)
   */
  async getRevenueReport(req: Request, res: Response): Promise<void> {
    try {
      // Validate query params
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

      // Additional validation: dateFrom <= dateTo
      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      // Get report
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

  /**
   * GET /api/reports/occupancy
   * Get occupancy report with hall rankings and peak times
   * @query dateFrom - Start date (YYYY-MM-DD)
   * @query dateTo - End date (YYYY-MM-DD)
   * @query hallId - Filter by hall (optional)
   */
  async getOccupancyReport(req: Request, res: Response): Promise<void> {
    try {
      // Validate query params
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

      // Additional validation: dateFrom <= dateTo
      if (filters.dateFrom > filters.dateTo) {
        res.status(400).json({
          success: false,
          message: 'dateFrom must be before or equal to dateTo',
        });
        return;
      }

      // Get report
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
}

export default new ReportsController();
