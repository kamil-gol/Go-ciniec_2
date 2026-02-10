/**
 * Dish Routes
 * Define routes for dish management
 */

import { Router } from 'express';
import dishController from '../controllers/dish.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';

const router = Router();

/**
 * @route   GET /api/dishes
 * @desc    Get all dishes with optional filters
 * @access  Authenticated (all roles)
 */
router.get('/', authMiddleware, (req, res) => {
  dishController.getDishes(req, res);
});

/**
 * @route   GET /api/dishes/:id
 * @desc    Get dish by ID
 * @access  Authenticated (all roles)
 */
router.get('/:id', authMiddleware, (req, res) => {
  dishController.getDishById(req, res);
});

/**
 * @route   GET /api/dishes/category/:category
 * @desc    Get dishes by category
 * @access  Authenticated (all roles)
 */
router.get('/category/:category', authMiddleware, (req, res) => {
  dishController.getDishesByCategory(req, res);
});

/**
 * @route   POST /api/dishes
 * @desc    Create a new dish
 * @access  Admin only
 */
router.post('/', authMiddleware, requireAdmin, (req, res) => {
  dishController.createDish(req, res);
});

/**
 * @route   PUT /api/dishes/:id
 * @desc    Update dish
 * @access  Admin only
 */
router.put('/:id', authMiddleware, requireAdmin, (req, res) => {
  dishController.updateDish(req, res);
});

/**
 * @route   DELETE /api/dishes/:id
 * @desc    Delete dish
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  dishController.deleteDish(req, res);
});

export default router;
