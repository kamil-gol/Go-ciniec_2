/**
 * Search Routes
 * Issue #128: Szukaj globalnie
 */

import { Router } from 'express';
import searchController from '../controllers/search.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireStaff } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// GET /api/search?q=...&limit=5
router.get(
  '/',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await searchController.globalSearch(req, res);
  })
);

export default router;
