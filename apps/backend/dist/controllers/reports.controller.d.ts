/**
 * Reports Controller
 * Endpoints for revenue, occupancy, and other analytics
 */
import { Request, Response } from 'express';
export declare class ReportsController {
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
    getRevenueReport(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/occupancy
     * Get occupancy report with hall rankings and peak times
     * @query dateFrom - Start date (YYYY-MM-DD)
     * @query dateTo - End date (YYYY-MM-DD)
     * @query hallId - Filter by hall (optional)
     */
    getOccupancyReport(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/export/revenue/excel
     * Export revenue report to Excel (XLSX)
     * @query Same as getRevenueReport
     */
    exportRevenueExcel(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/export/revenue/pdf
     * Export revenue report to PDF
     * @query Same as getRevenueReport
     */
    exportRevenuePDF(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/export/occupancy/excel
     * Export occupancy report to Excel (XLSX)
     * @query Same as getOccupancyReport
     */
    exportOccupancyExcel(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/reports/export/occupancy/pdf
     * Export occupancy report to PDF
     * @query Same as getOccupancyReport
     */
    exportOccupancyPDF(req: Request, res: Response): Promise<void>;
}
declare const _default: ReportsController;
export default _default;
//# sourceMappingURL=reports.controller.d.ts.map