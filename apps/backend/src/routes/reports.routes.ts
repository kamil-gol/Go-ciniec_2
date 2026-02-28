// apps/backend/src/routes/reports.routes.ts

import { Router } from 'express';
import reportsController from '@/controllers/reports.controller';
import { authMiddleware } from '@middlewares/auth';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authMiddleware);

// ============================================
// REPORT DATA ENDPOINTS
// ============================================

/**
 * GET /api/reports/revenue
 * Get revenue report with breakdown by period, hall, event type
 * @query dateFrom - Start date (YYYY-MM-DD) [required]
 * @query dateTo - End date (YYYY-MM-DD) [required]
 * @query groupBy - Period aggregation (day/week/month/year) [optional, default: month]
 * @query hallId - Filter by hall UUID [optional]
 * @query eventTypeId - Filter by event type UUID [optional]
 * @query status - Filter by status (CONFIRMED/COMPLETED) [optional]
 */
router.get('/revenue', reportsController.getRevenueReport.bind(reportsController));

/**
 * GET /api/reports/occupancy
 * Get occupancy report with hall rankings and peak times
 * @query dateFrom - Start date (YYYY-MM-DD) [required]
 * @query dateTo - End date (YYYY-MM-DD) [required]
 * @query hallId - Filter by hall UUID [optional]
 */
router.get('/occupancy', reportsController.getOccupancyReport.bind(reportsController));

/**
 * GET /api/reports/preparations
 * Get preparations report — what service extras need to be prepared
 * @query dateFrom - Start date (YYYY-MM-DD) [required]
 * @query dateTo - End date (YYYY-MM-DD) [required]
 * @query categoryId - Filter by ServiceCategory UUID [optional]
 * @query view - 'detailed' (per reservation) or 'summary' (aggregated) [optional, default: detailed]
 */
router.get('/preparations', reportsController.getPreparationsReport.bind(reportsController));

/**
 * GET /api/reports/menu-preparations
 * Get menu preparations report — what dishes/courses need to be prepared
 * @query dateFrom - Start date (YYYY-MM-DD) [required]
 * @query dateTo - End date (YYYY-MM-DD) [required]
 * @query view - 'detailed' (per reservation) or 'summary' (aggregated per dish) [optional, default: detailed]
 */
router.get('/menu-preparations', reportsController.getMenuPreparationsReport.bind(reportsController));

// ============================================
// EXPORT ENDPOINTS
// ============================================

/**
 * GET /api/reports/export/revenue/excel
 * Export revenue report to Excel (XLSX)
 * @query Same parameters as /revenue endpoint
 * @returns XLSX file download
 */
router.get('/export/revenue/excel', reportsController.exportRevenueExcel.bind(reportsController));

/**
 * GET /api/reports/export/revenue/pdf
 * Export revenue report to PDF
 * @query Same parameters as /revenue endpoint
 * @returns PDF file download
 */
router.get('/export/revenue/pdf', reportsController.exportRevenuePDF.bind(reportsController));

/**
 * GET /api/reports/export/occupancy/excel
 * Export occupancy report to Excel (XLSX)
 * @query Same parameters as /occupancy endpoint
 * @returns XLSX file download
 */
router.get('/export/occupancy/excel', reportsController.exportOccupancyExcel.bind(reportsController));

/**
 * GET /api/reports/export/occupancy/pdf
 * Export occupancy report to PDF
 * @query Same parameters as /occupancy endpoint
 * @returns PDF file download
 */
router.get('/export/occupancy/pdf', reportsController.exportOccupancyPDF.bind(reportsController));

/**
 * GET /api/reports/export/preparations/excel
 * Export preparations report to Excel (XLSX)
 * @query Same parameters as /preparations endpoint
 * @returns XLSX file download
 */
router.get('/export/preparations/excel', reportsController.exportPreparationsExcel.bind(reportsController));

/**
 * GET /api/reports/export/preparations/pdf
 * Export preparations report to PDF (premium design)
 * @query Same parameters as /preparations endpoint
 * @returns PDF file download
 */
router.get('/export/preparations/pdf', reportsController.exportPreparationsPDF.bind(reportsController));

/**
 * GET /api/reports/export/menu-preparations/excel
 * Export menu preparations report to Excel (XLSX)
 * @query dateFrom - Start date (YYYY-MM-DD) [required]
 * @query dateTo - End date (YYYY-MM-DD) [required]
 * @query view - 'detailed' or 'summary' [optional, default: detailed]
 * @returns XLSX file download
 */
router.get('/export/menu-preparations/excel', reportsController.exportMenuPreparationsExcel.bind(reportsController));

/**
 * GET /api/reports/export/menu-preparations/pdf
 * Export menu preparations report to PDF (premium design)
 * @query dateFrom - Start date (YYYY-MM-DD) [required]
 * @query dateTo - End date (YYYY-MM-DD) [required]
 * @query view - 'detailed' or 'summary' [optional, default: detailed]
 * @returns PDF file download
 */
router.get('/export/menu-preparations/pdf', reportsController.exportMenuPreparationsPDF.bind(reportsController));

export default router;
