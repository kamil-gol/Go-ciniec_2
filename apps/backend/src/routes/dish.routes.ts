/**
 * Dish Routes
 * MIGRATED: asyncHandler + validateUUID
 */

import { Router } from 'express';
import dishController from '../controllers/dish.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

// GET /api/dishes
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await dishController.getDishes(req, res);
  })
);

// GET /api/dishes/category/:categoryId
// NOTE: must be registered BEFORE /:id to prevent route shadowing by Express
router.get(
  '/category/:categoryId',
  validateUUID('categoryId'),
  asyncHandler(async (req, res) => {
    await dishController.getDishesByCategory(req, res);
  })
);

// GET /api/dishes/:id
router.get(
  '/:id',
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishController.getDishById(req, res);
  })
);

// POST /api/dishes
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await dishController.createDish(req, res);
  })
);

// PUT /api/dishes/:id
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishController.updateDish(req, res);
  })
);

// DELETE /api/dishes/:id
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishController.deleteDish(req, res);
  })
);

export default router;
