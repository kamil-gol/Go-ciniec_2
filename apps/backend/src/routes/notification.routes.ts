/**
 * Notification Routes
 * Issue #128: System powiadomień
 */

import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

// GET /api/notifications — lista powiadomień usera (paginated)
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await notificationController.getNotifications(req, res);
  })
);

// GET /api/notifications/unread-count — liczba nieprzeczytanych
router.get(
  '/unread-count',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await notificationController.getUnreadCount(req, res);
  })
);

// PATCH /api/notifications/read-all — oznacz wszystkie jako przeczytane
router.patch(
  '/read-all',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await notificationController.markAllAsRead(req, res);
  })
);

// PATCH /api/notifications/:id/read — oznacz jako przeczytane
router.patch(
  '/:id/read',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await notificationController.markAsRead(req, res);
  })
);

export default router;
