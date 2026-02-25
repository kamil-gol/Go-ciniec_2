/**
 * Document Template Routes
 *
 * Endpoints:
 *   GET    /                          → list (with optional ?category= filter)
 *   POST   /                          → create new template
 *   GET    /:slug                     → get by slug
 *   PUT    /:slug                     → update content (auto-versioning + history)
 *   DELETE /:slug                     → delete (blocked for isRequired)
 *   POST   /:slug/preview             → preview with {{variable}} substitution
 *   GET    /:slug/history             → paginated change history
 *   POST   /:slug/restore/:version    → restore historical version
 */

import { Router } from 'express';
import documentTemplateController from '../controllers/document-template.controller';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permissions';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// List all templates
router.get(
  '/',
  authMiddleware,
  requirePermission('templates:read'),
  asyncHandler(async (req, res, next) => {
    await documentTemplateController.list(req, res, next);
  })
);

// Create new template
router.post(
  '/',
  authMiddleware,
  requirePermission('templates:update'),
  asyncHandler(async (req, res, next) => {
    await documentTemplateController.create(req, res, next);
  })
);

// Preview template with variable substitution
router.post(
  '/:slug/preview',
  authMiddleware,
  requirePermission('templates:preview'),
  asyncHandler(async (req, res, next) => {
    await documentTemplateController.preview(req, res, next);
  })
);

// Get template change history
router.get(
  '/:slug/history',
  authMiddleware,
  requirePermission('templates:history'),
  asyncHandler(async (req, res, next) => {
    await documentTemplateController.getHistory(req, res, next);
  })
);

// Restore historical version
router.post(
  '/:slug/restore/:version',
  authMiddleware,
  requirePermission('templates:update'),
  asyncHandler(async (req, res, next) => {
    await documentTemplateController.restore(req, res, next);
  })
);

// Get single template by slug
router.get(
  '/:slug',
  authMiddleware,
  requirePermission('templates:read'),
  asyncHandler(async (req, res, next) => {
    await documentTemplateController.getBySlug(req, res, next);
  })
);

// Update template content
router.put(
  '/:slug',
  authMiddleware,
  requirePermission('templates:update'),
  asyncHandler(async (req, res, next) => {
    await documentTemplateController.update(req, res, next);
  })
);

// Delete template
router.delete(
  '/:slug',
  authMiddleware,
  requirePermission('templates:update'),
  asyncHandler(async (req, res, next) => {
    await documentTemplateController.delete(req, res, next);
  })
);

export default router;
