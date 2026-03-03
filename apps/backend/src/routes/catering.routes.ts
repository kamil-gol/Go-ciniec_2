import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permissions';
import { validateUUID } from '../middlewares/validateUUID';
import * as ctrl from '../controllers/catering.controller';

const router = Router();

// ── Templates ──────────────────────────────────────────────────

// GET  /api/catering/templates
router.get(
  '/templates',
  authenticate,
  requirePermission('catering:read'),
  ctrl.getTemplates,
);

// GET  /api/catering/templates/:id
router.get(
  '/templates/:id',
  authenticate,
  requirePermission('catering:read'),
  validateUUID('id'),
  ctrl.getTemplateById,
);

// POST /api/catering/templates
router.post(
  '/templates',
  authenticate,
  requirePermission('catering:manage_catering_templates'),
  ctrl.createTemplate,
);

// PATCH /api/catering/templates/:id
router.patch(
  '/templates/:id',
  authenticate,
  requirePermission('catering:manage_catering_templates'),
  validateUUID('id'),
  ctrl.updateTemplate,
);

// DELETE /api/catering/templates/:id
router.delete(
  '/templates/:id',
  authenticate,
  requirePermission('catering:manage_catering_templates'),
  validateUUID('id'),
  ctrl.deleteTemplate,
);

// ── Packages ───────────────────────────────────────────────────

// GET  /api/catering/templates/:id/packages/:packageId
router.get(
  '/templates/:id/packages/:packageId',
  authenticate,
  requirePermission('catering:read'),
  validateUUID('id'),
  validateUUID('packageId'),
  ctrl.getPackageById,
);

// POST /api/catering/templates/:id/packages
router.post(
  '/templates/:id/packages',
  authenticate,
  requirePermission('catering:manage_catering_packages'),
  validateUUID('id'),
  ctrl.createPackage,
);

// PATCH /api/catering/templates/:id/packages/:packageId
router.patch(
  '/templates/:id/packages/:packageId',
  authenticate,
  requirePermission('catering:manage_catering_packages'),
  validateUUID('id'),
  validateUUID('packageId'),
  ctrl.updatePackage,
);

// DELETE /api/catering/templates/:id/packages/:packageId
router.delete(
  '/templates/:id/packages/:packageId',
  authenticate,
  requirePermission('catering:manage_catering_packages'),
  validateUUID('id'),
  validateUUID('packageId'),
  ctrl.deletePackage,
);

// ── Sections ───────────────────────────────────────────────────

// POST /api/catering/packages/:packageId/sections
router.post(
  '/packages/:packageId/sections',
  authenticate,
  requirePermission('catering:manage_catering_packages'),
  validateUUID('packageId'),
  ctrl.createSection,
);

// PATCH /api/catering/sections/:sectionId
router.patch(
  '/sections/:sectionId',
  authenticate,
  requirePermission('catering:manage_catering_packages'),
  validateUUID('sectionId'),
  ctrl.updateSection,
);

// DELETE /api/catering/sections/:sectionId
router.delete(
  '/sections/:sectionId',
  authenticate,
  requirePermission('catering:manage_catering_packages'),
  validateUUID('sectionId'),
  ctrl.deleteSection,
);

// ── Options ────────────────────────────────────────────────────

// POST /api/catering/sections/:sectionId/options
router.post(
  '/sections/:sectionId/options',
  authenticate,
  requirePermission('catering:manage_catering_packages'),
  validateUUID('sectionId'),
  ctrl.addOption,
);

// PATCH /api/catering/options/:optionId
router.patch(
  '/options/:optionId',
  authenticate,
  requirePermission('catering:manage_catering_packages'),
  validateUUID('optionId'),
  ctrl.updateOption,
);

// DELETE /api/catering/options/:optionId
router.delete(
  '/options/:optionId',
  authenticate,
  requirePermission('catering:manage_catering_packages'),
  validateUUID('optionId'),
  ctrl.removeOption,
);

export default router;
