/**
 * Dish Category Routes
 * Express routes for dish category management
 */

import { Router } from 'express';
import dishCategoryController from '../controllers/dish-category.controller';
import { authenticateToken } from '../middlewares/auth';

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
router.post('/', authenticateToken, dishCategoryController.createCategory);
router.put('/:id', authenticateToken, dishCategoryController.updateCategory);
router.delete('/:id', authenticateToken, dishCategoryController.deleteCategory);
router.post('/reorder', authenticateToken, dishCategoryController.reorderCategories);

export default router;
