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

router.get(
  '/',
  asyncHandler(async (req, res) => {
    await dishController.getDishes(req, res);
  })
);

router.get(
  '/:id',
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishController.getDishById(req, res);
  })
);

router.get(
  '/category/:categoryId',
  validateUUID('categoryId'),
  asyncHandler(async (req, res) => {
    await dishController.getDishesByCategory(req, res);
  })
);

router.post(
  '/',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await dishController.createDish(req, res);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishController.updateDish(req, res);
  })
);

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
