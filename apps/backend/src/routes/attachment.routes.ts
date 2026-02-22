/**
 * Attachment Routes
 * File upload/download/management endpoints
 */

import { Router } from 'express';
import attachmentController from '../controllers/attachment.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireStaff } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';
import { uploadSingle } from '../middlewares/upload';

const router = Router();

/**
 * POST /api/attachments
 * Upload a file (multipart/form-data)
 * Body fields: entityType, entityId, category, label?, description?
 * File field: "file"
 */
router.post(
  '/',
  authMiddleware,
  requireStaff,
  uploadSingle,
  asyncHandler(async (req, res, next) => {
    await attachmentController.upload(req, res, next);
  })
);

/**
 * GET /api/attachments?entityType=X&entityId=Y&category=Z
 * List attachments for an entity
 */
router.get(
  '/',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res, next) => {
    await attachmentController.getByEntity(req, res, next);
  })
);

/**
 * GET /api/attachments/check?entityType=X&entityId=Y&category=Z
 * Check if entity has specific attachment category
 */
router.get(
  '/check',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res, next) => {
    await attachmentController.check(req, res, next);
  })
);

/**
 * POST /api/attachments/batch-check-rodo
 * Batch check RODO status for multiple clients
 */
router.post(
  '/batch-check-rodo',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res, next) => {
    await attachmentController.batchCheckRodo(req, res, next);
  })
);

/**
 * POST /api/attachments/batch-check-contract
 * Batch check contract status for multiple reservations
 */
router.post(
  '/batch-check-contract',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res, next) => {
    await attachmentController.batchCheckContract(req, res, next);
  })
);

/**
 * GET /api/attachments/:id/download
 * Download/stream a file
 */
router.get(
  '/:id/download',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await attachmentController.download(req, res, next);
  })
);

/**
 * PATCH /api/attachments/:id
 * Update attachment metadata (label, description, category)
 */
router.patch(
  '/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await attachmentController.update(req, res, next);
  })
);

/**
 * DELETE /api/attachments/:id
 * Soft-delete (archive) an attachment
 */
router.delete(
  '/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res, next) => {
    await attachmentController.delete(req, res, next);
  })
);

export default router;
