/**
 * Queue Routes
 * Define routes for reservation queue management
 */
import { Router } from 'express';
import queueController from '../controllers/queue.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireStaff } from '../middlewares/roles';
const router = Router();
/**
 * @route   POST /api/queue/reserved
 * @desc    Add reservation to queue (create RESERVED)
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post('/reserved', authMiddleware, requireStaff, (req, res) => {
    queueController.addToQueue(req, res);
});
/**
 * @route   GET /api/queue/stats
 * @desc    Get queue statistics
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/stats', authMiddleware, requireStaff, (req, res) => {
    queueController.getStats(req, res);
});
/**
 * @route   POST /api/queue/rebuild-positions
 * @desc    Rebuild queue positions for all dates (renumber per date)
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post('/rebuild-positions', authMiddleware, requireStaff, (req, res) => {
    queueController.rebuildPositions(req, res);
});
/**
 * @route   GET /api/queue/:date
 * @desc    Get queue for specific date (YYYY-MM-DD)
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/:date', authMiddleware, requireStaff, (req, res) => {
    queueController.getQueueForDate(req, res);
});
/**
 * @route   GET /api/queue
 * @desc    Get all queues
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/', authMiddleware, requireStaff, (req, res) => {
    queueController.getAllQueues(req, res);
});
/**
 * @route   POST /api/queue/swap
 * @desc    Swap two queue positions
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post('/swap', authMiddleware, requireStaff, (req, res) => {
    queueController.swapPositions(req, res);
});
/**
 * @route   PUT /api/queue/:id
 * @desc    Update queue reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.put('/:id', authMiddleware, requireStaff, (req, res) => {
    queueController.updateQueueReservation(req, res);
});
/**
 * @route   PUT /api/queue/:id/position
 * @desc    Move reservation to specific position
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.put('/:id/position', authMiddleware, requireStaff, (req, res) => {
    queueController.moveToPosition(req, res);
});
/**
 * @route   PUT /api/queue/:id/promote
 * @desc    Promote RESERVED to PENDING/CONFIRMED
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.put('/:id/promote', authMiddleware, requireStaff, (req, res) => {
    queueController.promoteReservation(req, res);
});
/**
 * @route   POST /api/queue/auto-cancel
 * @desc    Manually trigger auto-cancel expired reservations
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post('/auto-cancel', authMiddleware, requireStaff, (req, res) => {
    queueController.autoCancelExpired(req, res);
});
export default router;
//# sourceMappingURL=queue.routes.js.map