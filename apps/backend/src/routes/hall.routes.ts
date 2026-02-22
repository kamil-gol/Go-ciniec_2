/**
 * Hall Routes
 * MIGRATED: asyncHandler + validateUUID
 */

import { Router } from 'express';
import hallController from '../controllers/hall.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    await hallController.createHall(req, res, next);
  })
);

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res, next) => {
    await hallController.getHalls(req, res, next);
  })
);

router.get(
  '/:id',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await hallController.getHallById(req, res, next);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await hallController.updateHall(req, res, next);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await hallController.deleteHall(req, res, next);
  })
);

export default router;
