/**
 * Hall Routes
 * MIGRATED: asyncHandler + validateUUID
 * UPDATED: #165 — GET /:id/available-capacity endpoint
 */

import { Router } from 'express';
import hallController from '../controllers/hall.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';
import { validateBody } from '../middlewares/validateBody';
import { createHallSchema, updateHallSchema } from '../validation/hall.validation';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validateBody(createHallSchema),
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

// #165: Available capacity for a hall in a given time range
router.get(
  '/:id/available-capacity',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await hallController.getAvailableCapacity(req, res, next);
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
  validateBody(updateHallSchema),
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
