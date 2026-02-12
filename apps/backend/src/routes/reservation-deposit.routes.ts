/**
 * Reservation Deposit Routes (nested)
 * 
 * Routes:
 *   GET    /api/reservations/:reservationId/deposits  - Get deposits for reservation + summary
 *   POST   /api/reservations/:reservationId/deposits  - Create new deposit for reservation
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getReservationDeposits,
  createDeposit,
} from '../controllers/deposit.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { validateUUID } from '../middlewares/validateUUID';

const router = Router({ mergeParams: true });

router.get(
  '/',
  authMiddleware,
  validateUUID('reservationId'),
  asyncHandler(getReservationDeposits)
);

router.post(
  '/',
  authMiddleware,
  validateUUID('reservationId'),
  asyncHandler(createDeposit)
);

export default router;
