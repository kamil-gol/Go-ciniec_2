/**
 * Document Template Routes
 *
 * Endpoints:
 *   GET    /                  → list (with optional ?category= filter)
 *   GET    /:slug             → get by slug
 *   PUT    /:slug             → update content (auto-versioning + history)
 *   POST   /:slug/preview     → preview with {{variable}} substitution
 *   GET    /:slug/history     → paginated change history
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

export default router;
