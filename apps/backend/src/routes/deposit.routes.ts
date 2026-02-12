/**
 * Deposit Routes
 * MIGRATED: asyncHandler + validateUUID
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { markDepositAsPaid, markDepositAsUnpaid } from '../controllers/deposit.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router();

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

export default router;
