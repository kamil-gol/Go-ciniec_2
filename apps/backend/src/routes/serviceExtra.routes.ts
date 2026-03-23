/**
 * Service Extras Routes
 * Full CRUD for categories & items + reservation extras assignment
 */

import { Router } from 'express';
import serviceExtraController from '../controllers/serviceExtra.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';
import { validateBody } from '../middlewares/validateBody';
import {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  reorderCategoriesSchema,
  createServiceItemSchema,
  updateServiceItemSchema,
  assignExtraSchema,
  bulkAssignExtrasSchema,
  updateReservationExtraSchema,
} from '../validation/serviceExtra.validation';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// CATEGORIES (admin manages catalog)
// ═══════════════════════════════════════════════════════════════

// List all categories (with items)
router.get(
  '/categories',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await serviceExtraController.getCategories(req, res);
  })
);

// Reorder categories (must be before /:id)
router.post(
  '/categories/reorder',
  authMiddleware,
  requireAdmin,
  validateBody(reorderCategoriesSchema),
  asyncHandler(async (req, res) => {
    await serviceExtraController.reorderCategories(req, res);
  })
);

// Get single category
router.get(
  '/categories/:id',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await serviceExtraController.getCategoryById(req, res);
  })
);

// Create category
router.post(
  '/categories',
  authMiddleware,
  requireAdmin,
  validateBody(createServiceCategorySchema),
  asyncHandler(async (req, res) => {
    await serviceExtraController.createCategory(req, res);
  })
);

// Update category
router.put(
  '/categories/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  validateBody(updateServiceCategorySchema),
  asyncHandler(async (req, res) => {
    await serviceExtraController.updateCategory(req, res);
  })
);

// Delete category
router.delete(
  '/categories/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await serviceExtraController.deleteCategory(req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// ITEMS (admin manages catalog)
// ═══════════════════════════════════════════════════════════════

// List all items (optional filter by categoryId)
router.get(
  '/items',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await serviceExtraController.getItems(req, res);
  })
);

// Get single item
router.get(
  '/items/:id',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await serviceExtraController.getItemById(req, res);
  })
);

// Create item
router.post(
  '/items',
  authMiddleware,
  requireAdmin,
  validateBody(createServiceItemSchema),
  asyncHandler(async (req, res) => {
    await serviceExtraController.createItem(req, res);
  })
);

// Update item
router.put(
  '/items/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  validateBody(updateServiceItemSchema),
  asyncHandler(async (req, res) => {
    await serviceExtraController.updateItem(req, res);
  })
);

// Delete item
router.delete(
  '/items/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await serviceExtraController.deleteItem(req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// RESERVATION EXTRAS (user assigns to reservation)
// ═══════════════════════════════════════════════════════════════

// Get extras for a reservation
router.get(
  '/reservations/:reservationId/extras',
  authMiddleware,
  validateUUID('reservationId'),
  asyncHandler(async (req, res) => {
    await serviceExtraController.getReservationExtras(req, res);
  })
);

// Add single extra to reservation
router.post(
  '/reservations/:reservationId/extras',
  authMiddleware,
  validateUUID('reservationId'),
  validateBody(assignExtraSchema),
  asyncHandler(async (req, res) => {
    await serviceExtraController.assignExtra(req, res);
  })
);

// Bulk set extras on reservation (replace all)
router.put(
  '/reservations/:reservationId/extras',
  authMiddleware,
  validateUUID('reservationId'),
  validateBody(bulkAssignExtrasSchema),
  asyncHandler(async (req, res) => {
    await serviceExtraController.bulkAssignExtras(req, res);
  })
);

// Update single extra
router.put(
  '/reservations/:reservationId/extras/:extraId',
  authMiddleware,
  validateUUID('reservationId'),
  validateUUID('extraId'),
  validateBody(updateReservationExtraSchema),
  asyncHandler(async (req, res) => {
    await serviceExtraController.updateReservationExtra(req, res);
  })
);

// Remove single extra
router.delete(
  '/reservations/:reservationId/extras/:extraId',
  authMiddleware,
  validateUUID('reservationId'),
  validateUUID('extraId'),
  asyncHandler(async (req, res) => {
    await serviceExtraController.removeReservationExtra(req, res);
  })
);

export default router;
