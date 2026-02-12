/**
 * Reservation Routes
 * Define routes for reservation management
 */

import { Router } from 'express';
import reservationController from '../controllers/reservation.controller';
import reservationMenuService from '../services/reservation-menu.service';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin, requireStaff } from '../middlewares/roles';

const router = Router();

/**
 * @route   POST /api/reservations
 * @desc    Create a new reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post('/', authMiddleware, requireStaff, (req, res) => {
  reservationController.createReservation(req, res);
});

/**
 * @route   GET /api/reservations
 * @desc    Get all reservations with optional filters
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/', authMiddleware, requireStaff, (req, res) => {
  reservationController.getReservations(req, res);
});

/**
 * @route   GET /api/reservations/:id
 * @desc    Get reservation by ID
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/:id', authMiddleware, requireStaff, (req, res) => {
  reservationController.getReservationById(req, res);
});

/**
 * @route   GET /api/reservations/:id/pdf
 * @desc    Download reservation as PDF
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/:id/pdf', authMiddleware, requireStaff, (req, res) => {
  reservationController.downloadPDF(req, res);
});

/**
 * @route   PUT /api/reservations/:id
 * @desc    Update reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.put('/:id', authMiddleware, requireStaff, (req, res) => {
  reservationController.updateReservation(req, res);
});

/**
 * @route   PATCH /api/reservations/:id/status
 * @desc    Update reservation status
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.patch('/:id/status', authMiddleware, requireStaff, (req, res) => {
  reservationController.updateStatus(req, res);
});

// ═══════════════════════════════════════════════════════════════
// 🍽️ MENU SELECTION ENDPOINTS (using service directly)
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/reservations/:id/menu
 * @desc    Select menu for reservation (supports dishSelections)
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.post('/:id/menu', authMiddleware, requireStaff, async (req, res) => {
  try {
    const result = await reservationMenuService.selectMenu(req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/reservations/:id/menu
 * @desc    Get menu selection for reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.get('/:id/menu', authMiddleware, requireStaff, async (req, res) => {
  try {
    const result = await reservationMenuService.getReservationMenu(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message?.includes('not found') || error.message?.includes('not selected') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/reservations/:id/menu
 * @desc    Update menu selection for reservation (supports dishSelections)
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.put('/:id/menu', authMiddleware, requireStaff, async (req, res) => {
  try {
    const result = await reservationMenuService.updateMenu(req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/reservations/:id/menu
 * @desc    Remove menu selection from reservation
 * @access  Staff (ADMIN + EMPLOYEE)
 */
router.delete('/:id/menu', authMiddleware, requireStaff, async (req, res) => {
  try {
    await reservationMenuService.removeMenu(req.params.id);
    res.status(200).json({ success: true, message: 'Menu selection removed' });
  } catch (error: any) {
    const status = error.message?.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════

/**
 * @route   DELETE /api/reservations/:id
 * @desc    Cancel reservation
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  reservationController.cancelReservation(req, res);
});

export default router;
