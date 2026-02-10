/**
 * Dish Category Routes
 * Express routes for dish category management
 */

import { Router } from 'express';
import dishCategoryController from '../controllers/dish-category.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

/**
 * Public Routes
 */
router.get('/', dishCategoryController.getCategories);
router.get('/:id', dishCategoryController.getCategoryById);
router.get('/slug/:slug', dishCategoryController.getCategoryBySlug);

/**
 * Protected Routes (require authentication)
 */
router.post('/', authMiddleware, dishCategoryController.createCategory);
router.put('/:id', authMiddleware, dishCategoryController.updateCategory);
router.delete('/:id', authMiddleware, dishCategoryController.deleteCategory);
router.post('/reorder', authMiddleware, dishCategoryController.reorderCategories);

export default router;
