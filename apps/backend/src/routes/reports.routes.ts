// apps/backend/src/routes/reports.routes.ts

import { Router } from 'express';
import reportsController from '@/controllers/reports.controller';
import { authMiddleware } from '@middlewares/auth';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authMiddleware);

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

export default router;
