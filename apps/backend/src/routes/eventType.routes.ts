/**
 * EventType Routes
 * Full CRUD + stats + predefined colors
 */

import { Router } from 'express';
import eventTypeController from '../controllers/eventType.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

// Stats endpoint (must be before /:id to avoid UUID conflict)
router.get(
  '/stats',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await eventTypeController.getEventTypeStats(req, res);
  })
);

// Predefined colors for color picker
router.get(
  '/colors',
  asyncHandler(async (req, res) => {
    await eventTypeController.getPredefinedColors(req, res);
  })
);

router.post(
  '/',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await eventTypeController.createEventType(req, res);
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    await eventTypeController.getEventTypes(req, res);
  })
);

router.get(
  '/:id',
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await eventTypeController.getEventTypeById(req, res);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await eventTypeController.updateEventType(req, res);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await eventTypeController.deleteEventType(req, res);
  })
);

export default router;
