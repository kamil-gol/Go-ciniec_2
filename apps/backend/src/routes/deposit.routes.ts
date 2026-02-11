import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as depositController from '../controllers/deposit.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════
// STATISTICS & REMINDERS (must be before :id routes)
// ═══════════════════════════════════════════════════════════════

router.get('/statistics', depositController.getStatistics);
router.get('/reminders/pending', depositController.getPendingReminders);

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

router.post('/', depositController.createDeposit);
router.get('/', depositController.listDeposits);
router.get('/:id', depositController.getDeposit);
router.put('/:id', depositController.updateDeposit);
router.delete('/:id', depositController.deleteDeposit);

// ═══════════════════════════════════════════════════════════════
// PAYMENT OPERATIONS
// ═══════════════════════════════════════════════════════════════

router.put('/:id/mark-paid', depositController.markDepositPaid);
router.post('/:id/payments', depositController.addDepositPayment);
router.put('/:id/reminder-sent', depositController.markReminderSent);

// ═══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY - Aliases for old endpoint names
// ═══════════════════════════════════════════════════════════════
// These are maintained for backward compatibility with old client code

router.patch('/:id/mark-paid', depositController.markDepositPaid);

export default router;
