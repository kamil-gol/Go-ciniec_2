/**
 * Queue Routes
 * MIGRATED: asyncHandler + validateUUID
 */

import { Router } from 'express';
import queueController from '../controllers/queue.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireStaff, requireAdmin } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

router.post(
  '/reserved',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await queueController.addToQueue(req, res);
  })
);

router.get(
  '/stats',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await queueController.getStats(req, res);
  })
);

router.post(
  '/rebuild-positions',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await queueController.rebuildPositions(req, res);
  })
);

router.post(
  '/batch-update-positions',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await queueController.batchUpdatePositions(req, res);
  })
);

router.get(
  '/:date',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await queueController.getQueueForDate(req, res);
  })
);

router.get(
  '/',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await queueController.getAllQueues(req, res);
  })
);

router.post(
  '/swap',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await queueController.swapPositions(req, res);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await queueController.updateQueueReservation(req, res);
  })
);

router.put(
  '/:id/position',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await queueController.moveToPosition(req, res);
  })
);

router.put(
  '/:id/promote',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await queueController.promoteReservation(req, res);
  })
);

router.post(
  '/auto-cancel',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await queueController.autoCancelExpired(req, res);
  })
);

export default router;
