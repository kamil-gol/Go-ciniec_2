/**
 * Dish Category Routes
 * Auth: GET = public (no auth), POST/PUT/DELETE = requireAdmin
 */

import { Router } from 'express';
import dishCategoryController from '../controllers/dish-category.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES (read-only, used by menu selection UI)
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/dish-categories
 * @desc    List all dish categories
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await dishCategoryController.getCategories(req, res);
  })
);

/**
 * @route   GET /api/dish-categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    await dishCategoryController.getCategoryBySlug(req, res);
  })
);

/**
 * @route   GET /api/dish-categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get(
  '/:id',
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishCategoryController.getCategoryById(req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// PROTECTED ROUTES (Admin only)
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/dish-categories
 * @desc    Create new dish category
 * @access  Admin only
 */
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await dishCategoryController.createCategory(req, res);
  })
);

/**
 * @route   PUT /api/dish-categories/:id
 * @desc    Update dish category
 * @access  Admin only
 */
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishCategoryController.updateCategory(req, res);
  })
);

/**
 * @route   DELETE /api/dish-categories/:id
 * @desc    Delete dish category
 * @access  Admin only
 */
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishCategoryController.deleteCategory(req, res);
  })
);

/**
 * @route   POST /api/dish-categories/reorder
 * @desc    Reorder categories
 * @access  Admin only
 */
router.post(
  '/reorder',
  authMiddleware,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await dishCategoryController.reorderCategories(req, res);
  })
);

export default router;
