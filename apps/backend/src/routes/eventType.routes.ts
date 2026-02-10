/**
 * EventType Routes
 * Define routes for event type management
 */

import { Router } from 'express';
import eventTypeController from '../controllers/eventType.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roles';

const router = Router();

/**
 * @route   POST /api/event-types
 * @desc    Create a new event type
 * @access  Admin only
 */
router.post('/', authMiddleware, requireAdmin, (req, res) => {
  eventTypeController.createEventType(req, res);
});

/**
 * @route   GET /api/event-types
 * @desc    Get all event types
 * @access  Public (no auth required)
 */
router.get('/', (req, res) => {
  eventTypeController.getEventTypes(req, res);
});

/**
 * @route   GET /api/event-types/:id
 * @desc    Get event type by ID
 * @access  Public (no auth required)
 */
router.get('/:id', (req, res) => {
  eventTypeController.getEventTypeById(req, res);
});

/**
 * @route   PUT /api/event-types/:id
 * @desc    Update event type
 * @access  Admin only
 */
router.put('/:id', authMiddleware, requireAdmin, (req, res) => {
  eventTypeController.updateEventType(req, res);
});

/**
 * @route   DELETE /api/event-types/:id
 * @desc    Delete event type
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  eventTypeController.deleteEventType(req, res);
});

export default router;
