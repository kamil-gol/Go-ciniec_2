/**
 * Hall Routes
 * Define routes for hall management
 */

import { Router } from 'express';
import hallController from '../controllers/hall.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';

const router = Router();

/**
 * @route   POST /api/halls
 * @desc    Create a new hall
 * @access  Admin only
 */
router.post('/', authMiddleware, requireAdmin, (req, res) => {
  hallController.createHall(req, res);
});

/**
 * @route   GET /api/halls
 * @desc    Get all halls with optional filters
 * @access  Authenticated (all roles)
 */
router.get('/', authMiddleware, (req, res) => {
  hallController.getHalls(req, res);
});

/**
 * @route   GET /api/halls/:id
 * @desc    Get hall by ID
 * @access  Authenticated (all roles)
 */
router.get('/:id', authMiddleware, (req, res) => {
  hallController.getHallById(req, res);
});

/**
 * @route   PUT /api/halls/:id
 * @desc    Update hall
 * @access  Admin only
 */
router.put('/:id', authMiddleware, requireAdmin, (req, res) => {
  hallController.updateHall(req, res);
});

/**
 * @route   DELETE /api/halls/:id
 * @desc    Delete hall (soft delete)
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  hallController.deleteHall(req, res);
});

export default router;
