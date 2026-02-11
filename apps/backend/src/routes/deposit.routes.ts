import { Router } from 'express';
import * as depositController from '../controllers/deposit.controller';

const router = Router();

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

export default router;
