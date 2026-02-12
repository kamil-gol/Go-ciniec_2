/**
 * Deposit Routes
 * Full CRUD + mark-paid/unpaid + cancel + stats + overdue + PDF + send-email
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
  downloadDepositPdf,
  sendDepositEmail,
} from '../controllers/deposit.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

// Collection endpoints (before :id to avoid conflicts)
router.get('/stats', authMiddleware, asyncHandler(getDepositStats));
router.get('/overdue', authMiddleware, asyncHandler(getOverdueDeposits));
router.get('/', authMiddleware, asyncHandler(listDeposits));

// Single deposit endpoints
router.get('/:id', authMiddleware, validateUUID('id'), asyncHandler(getDeposit));
router.get('/:id/pdf', authMiddleware, validateUUID('id'), asyncHandler(downloadDepositPdf));
router.post('/:id/send-email', authMiddleware, validateUUID('id'), asyncHandler(sendDepositEmail));
router.put('/:id', authMiddleware, validateUUID('id'), asyncHandler(updateDeposit));
router.delete('/:id', authMiddleware, validateUUID('id'), asyncHandler(deleteDeposit));
router.patch('/:id/mark-paid', authMiddleware, validateUUID('id'), asyncHandler(markDepositAsPaid));
router.patch('/:id/mark-unpaid', authMiddleware, validateUUID('id'), asyncHandler(markDepositAsUnpaid));
router.patch('/:id/cancel', authMiddleware, validateUUID('id'), asyncHandler(cancelDeposit));

export default router;
