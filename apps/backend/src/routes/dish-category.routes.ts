/**
 * Dish Category Routes
 * MIGRATED: asyncHandler + validateUUID
 */

import { Router } from 'express';
import dishCategoryController from '../controllers/dish-category.controller';
import { authMiddleware } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

// Public Routes
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await dishCategoryController.getCategories(req, res);
  })
);

router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    await dishCategoryController.getCategoryBySlug(req, res);
  })
);

router.get(
  '/:id',
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishCategoryController.getCategoryById(req, res);
  })
);

// Protected Routes
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await dishCategoryController.createCategory(req, res);
  })
);

router.put(
  '/:id',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishCategoryController.updateCategory(req, res);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await dishCategoryController.deleteCategory(req, res);
  })
);

router.post(
  '/reorder',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await dishCategoryController.reorderCategories(req, res);
  })
);

export default router;
