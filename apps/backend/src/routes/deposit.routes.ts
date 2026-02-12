/**
 * Deposit Routes
 * Full CRUD + mark-paid/unpaid + cancel + stats + overdue
 *
 * Routes:
 *   GET    /api/deposits              - List all (filters: status, overdue, search, dateRange)
 *   GET    /api/deposits/stats        - Global statistics
 *   GET    /api/deposits/overdue      - All overdue deposits
 *   GET    /api/deposits/:id          - Single deposit details
 *   PUT    /api/deposits/:id          - Update deposit (amount, dueDate)
 *   DELETE /api/deposits/:id          - Delete deposit
 *   PATCH  /api/deposits/:id/mark-paid   - Mark as paid
 *   PATCH  /api/deposits/:id/mark-unpaid - Revert payment
 *   PATCH  /api/deposits/:id/cancel      - Cancel deposit
 *
 * Nested under reservations:
 *   GET    /api/reservations/:reservationId/deposits  - Deposits for reservation
 *   POST   /api/reservations/:reservationId/deposits  - Create deposit for reservation
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listDeposits,
  getDepositStats,
  getOverdueDeposits,
  getDeposit,
  updateDeposit,
  deleteDeposit,
  markDepositAsPaid,
  markDepositAsUnpaid,
  cancelDeposit,
} from '../controllers/deposit.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// Collection endpoints (put BEFORE :id to avoid conflicts)
// ═══════════════════════════════════════════════════════════════

router.get(
  '/stats',
  authMiddleware,
  asyncHandler(getDepositStats)
);

router.get(
  '/overdue',
  authMiddleware,
  asyncHandler(getOverdueDeposits)
);

router.get(
  '/',
  authMiddleware,
  asyncHandler(listDeposits)
);

// ═══════════════════════════════════════════════════════════════
// Single deposit endpoints
// ═══════════════════════════════════════════════════════════════

router.get(
  '/:id',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(getDeposit)
);

router.put(
  '/:id',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(updateDeposit)
);

router.delete(
  '/:id',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(deleteDeposit)
);

router.patch(
  '/:id/mark-paid',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(markDepositAsPaid)
);

router.patch(
  '/:id/mark-unpaid',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(markDepositAsUnpaid)
);

router.patch(
  '/:id/cancel',
  authMiddleware,
  validateUUID('id'),
  asyncHandler(cancelDeposit)
);

export default router;
