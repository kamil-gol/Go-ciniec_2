/**
 * Stats Routes
 * Dashboard statistics API
 */

import { Router } from 'express';
import statsController from '../controllers/stats.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireStaff } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

/**
 * @route   GET /api/stats/overview
 * @desc    Get dashboard overview statistics (11 metrics)
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/overview',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await statsController.getOverview(req, res);
  })
);

/**
 * @route   GET /api/stats/upcoming
 * @desc    Get upcoming reservations for dashboard
 * @access  Staff (ADMIN + EMPLOYEE)
 * @query   limit — max results (default 10, max 20)
 */
router.get(
  '/upcoming',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await statsController.getUpcoming(req, res);
  })
);

export default router;
