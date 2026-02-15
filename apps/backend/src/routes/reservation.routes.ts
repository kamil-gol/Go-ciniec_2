/**
 * Reservation Routes
 * MIGRATED: asyncHandler + validateUUID
 */

import { Router } from 'express';
import reservationController from '../controllers/reservation.controller';
import { reservationMenuController } from '../controllers/reservationMenu.controller';
import { discountController } from '../controllers/discount.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin, requireStaff } from '../middlewares/roles';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

/**
 * @route   POST /api/reservations
 * @desc    Create a new reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post(
  '/',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await reservationController.createReservation(req, res);
  })
);

/**
 * @route   GET /api/reservations
 * @desc    Get all reservations with optional filters
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await reservationController.getReservations(req, res);
  })
);

/**
 * @route   GET /api/reservations/check-availability
 * @desc    Check hall availability for a given time range
 * @access  Staff (ADMIN + EMPLOYEE)
 * @query   hallId, startDateTime, endDateTime, excludeReservationId (optional)
 */
router.get(
  '/check-availability',
  authMiddleware,
  requireStaff,
  asyncHandler(async (req, res) => {
    await reservationController.checkAvailability(req, res);
  })
);

/**
 * @route   GET /api/reservations/:id
 * @desc    Get reservation by ID
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationController.getReservationById(req, res);
  })
);


/**
 * @route   GET /api/reservations/:id/pdf
 * @desc    Download reservation as PDF
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/:id/pdf',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationController.downloadPDF(req, res);
  })
);

/**
 * @route   PUT /api/reservations/:id
 * @desc    Update reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.put(
  '/:id',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationController.updateReservation(req, res);
  })
);

/**
 * @route   PATCH /api/reservations/:id/status
 * @desc    Update reservation status
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.patch(
  '/:id/status',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationController.updateStatus(req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// MENU SELECTION ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/reservations/:id/menu
 * @desc    Select menu for reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post(
  '/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.selectMenu(req, res);
  })
);

/**
 * @route   GET /api/reservations/:id/menu
 * @desc    Get menu selection for reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get(
  '/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.getMenu(req, res);
  })
);

/**
 * @route   PUT /api/reservations/:id/menu
 * @desc    Update menu selection for reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.put(
  '/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.updateMenu(req, res);
  })
);

/**
 * @route   DELETE /api/reservations/:id/menu
 * @desc    Remove menu selection from reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.delete(
  '/:id/menu',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationMenuController.deleteMenu(req, res);
  })
);

// ═══════════════════════════════════════════════════════════════
// 💰 DISCOUNT ENDPOINTS (Sprint 7)
// ═══════════════════════════════════════════════════════════════

/**
 * @route   PATCH /api/reservations/:id/discount
 * @desc    Apply or update discount on reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.patch(
  '/:id/discount',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await discountController.applyDiscount(req, res);
  })
);

/**
 * @route   DELETE /api/reservations/:id/discount
 * @desc    Remove discount from reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.delete(
  '/:id/discount',
  authMiddleware,
  requireStaff,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await discountController.removeDiscount(req, res);
  })
);

// ═══════════════════════════════════════════════════════════════

/**
 * @route   DELETE /api/reservations/:id
 * @desc    Cancel reservation
 * @access  Admin only
 */
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateUUID('id'),
  asyncHandler(async (req, res) => {
    await reservationController.cancelReservation(req, res);
  })
);

export default router;
