import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { markDepositAsPaid, markDepositAsUnpaid } from '../controllers/deposit.controller';
const router = Router();
// Mark deposit as paid
router.patch('/:id/mark-paid', authMiddleware, markDepositAsPaid);
// Mark deposit as unpaid (revert)
router.patch('/:id/mark-unpaid', authMiddleware, markDepositAsUnpaid);
export default router;
//# sourceMappingURL=deposit.routes.js.map