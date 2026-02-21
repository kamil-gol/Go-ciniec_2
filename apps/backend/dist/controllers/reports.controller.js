// apps/backend/src/controllers/reports.controller.ts
import { z } from 'zod';
import reportsService from '../services/reports.service';
import reportsExportService from '../services/reports-export.service';
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
    async getRevenueReport(req, res) {
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
            const filters = validation.data;
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
        }
        catch (error) {
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
    async getOccupancyReport(req, res) {
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
            const filters = validation.data;
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
        }
        catch (error) {
            console.error('Error in getOccupancyReport:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate occupancy report',
                error: error.message,
            });
        }
    }
    // ============================================
    // EXPORT ENDPOINTS
    // ============================================
    /**
     * GET /api/reports/export/revenue/excel
     * Export revenue report to Excel (XLSX)
     * @query Same as getRevenueReport
     */
    async exportRevenueExcel(req, res) {
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
            const filters = validation.data;
            if (filters.dateFrom > filters.dateTo) {
                res.status(400).json({
                    success: false,
                    message: 'dateFrom must be before or equal to dateTo',
                });
                return;
            }
            // Get report data
            const report = await reportsService.getRevenueReport(filters);
            // Generate Excel file
            const buffer = await reportsExportService.exportRevenueToExcel(report);
            // Set headers for file download
            const filename = `raport_przychody_${filters.dateFrom}_${filters.dateTo}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(buffer);
        }
        catch (error) {
            console.error('Error in exportRevenueExcel:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export revenue report to Excel',
                error: error.message,
            });
        }
    }
    /**
     * GET /api/reports/export/revenue/pdf
     * Export revenue report to PDF
     * @query Same as getRevenueReport
     */
    async exportRevenuePDF(req, res) {
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
            const filters = validation.data;
            if (filters.dateFrom > filters.dateTo) {
                res.status(400).json({
                    success: false,
                    message: 'dateFrom must be before or equal to dateTo',
                });
                return;
            }
            // Get report data
            const report = await reportsService.getRevenueReport(filters);
            // Generate PDF file
            const buffer = await reportsExportService.exportRevenueToPDF(report);
            // Set headers for file download
            const filename = `raport_przychody_${filters.dateFrom}_${filters.dateTo}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(buffer);
        }
        catch (error) {
            console.error('Error in exportRevenuePDF:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export revenue report to PDF',
                error: error.message,
            });
        }
    }
    /**
     * GET /api/reports/export/occupancy/excel
     * Export occupancy report to Excel (XLSX)
     * @query Same as getOccupancyReport
     */
    async exportOccupancyExcel(req, res) {
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
            const filters = validation.data;
            if (filters.dateFrom > filters.dateTo) {
                res.status(400).json({
                    success: false,
                    message: 'dateFrom must be before or equal to dateTo',
                });
                return;
            }
            // Get report data
            const report = await reportsService.getOccupancyReport(filters);
            // Generate Excel file
            const buffer = await reportsExportService.exportOccupancyToExcel(report);
            // Set headers for file download
            const filename = `raport_zajetosc_${filters.dateFrom}_${filters.dateTo}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(buffer);
        }
        catch (error) {
            console.error('Error in exportOccupancyExcel:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export occupancy report to Excel',
                error: error.message,
            });
        }
    }
    /**
     * GET /api/reports/export/occupancy/pdf
     * Export occupancy report to PDF
     * @query Same as getOccupancyReport
     */
    async exportOccupancyPDF(req, res) {
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
            const filters = validation.data;
            if (filters.dateFrom > filters.dateTo) {
                res.status(400).json({
                    success: false,
                    message: 'dateFrom must be before or equal to dateTo',
                });
                return;
            }
            // Get report data
            const report = await reportsService.getOccupancyReport(filters);
            // Generate PDF file
            const buffer = await reportsExportService.exportOccupancyToPDF(report);
            // Set headers for file download
            const filename = `raport_zajetosc_${filters.dateFrom}_${filters.dateTo}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(buffer);
        }
        catch (error) {
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
//# sourceMappingURL=reports.controller.js.map