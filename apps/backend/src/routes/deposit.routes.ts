import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { markDepositAsPaid, markDepositAsUnpaid } from '../controllers/deposit.controller';

const router = Router();

// Mark deposit as paid
router.patch('/:id/mark-paid', authenticate, markDepositAsPaid);

// Mark deposit as unpaid (revert)
router.patch('/:id/mark-unpaid', authenticate, markDepositAsUnpaid);

export default router;
