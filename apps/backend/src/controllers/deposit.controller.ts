import { Request, Response } from 'express';
import * as depositService from '../services/deposit.service';
import {
  CreateDepositRequest,
  UpdateDepositRequest,
  MarkDepositPaidRequest,
  AddDepositPaymentRequest,
  DepositQueryFilters,
} from '../types/deposit.types';

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/deposits
 * Create new deposit
 */
export async function createDeposit(req: Request, res: Response) {
  try {
    const data: CreateDepositRequest = req.body;

    if (!data.reservationId || !data.amount || !data.dueDate) {
      return res.status(400).json({
        error: 'Missing required fields: reservationId, amount, dueDate',
      });
    }

    const deposit = await depositService.createDeposit(data);
    res.status(201).json(deposit);
  } catch (error: any) {
    console.error('Error creating deposit:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * GET /api/deposits
 * List deposits with filters
 */
export async function listDeposits(req: Request, res: Response) {
  try {
    const filters: DepositQueryFilters = {
      status: req.query.status as any,
      paid: req.query.paid === 'true' ? true : req.query.paid === 'false' ? false : undefined,
      reservationId: req.query.reservationId as string,
      dueDateFrom: req.query.dueDateFrom as string,
      dueDateTo: req.query.dueDateTo as string,
      overdueOnly: req.query.overdueOnly === 'true',
      upcomingOnly: req.query.upcomingOnly === 'true',
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      perPage: req.query.perPage ? parseInt(req.query.perPage as string) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
    };

    const result = await depositService.listDeposits(filters);
    res.json(result);
  } catch (error: any) {
    console.error('Error listing deposits:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/deposits/:id
 * Get deposit by ID
 */
export async function getDeposit(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deposit = await depositService.getDepositById(id);

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    res.json(deposit);
  } catch (error: any) {
    console.error('Error getting deposit:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/deposits/:id
 * Update deposit
 */
export async function updateDeposit(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: UpdateDepositRequest = req.body;

    const deposit = await depositService.updateDeposit(id, data);
    res.json(deposit);
  } catch (error: any) {
    console.error('Error updating deposit:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * DELETE /api/deposits/:id
 * Delete deposit
 */
export async function deleteDeposit(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await depositService.deleteDeposit(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting deposit:', error);
    res.status(400).json({ error: error.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * PUT /api/deposits/:id/mark-paid
 * Mark deposit as paid
 */
export async function markDepositPaid(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: MarkDepositPaidRequest = req.body;

    if (!data.paymentMethod) {
      return res.status(400).json({
        error: 'paymentMethod is required',
      });
    }

    const deposit = await depositService.markDepositPaid(id, data);
    res.json(deposit);
  } catch (error: any) {
    console.error('Error marking deposit as paid:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * POST /api/deposits/:id/payments
 * Add partial payment to deposit
 */
export async function addDepositPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: AddDepositPaymentRequest = req.body;

    if (!data.amount || !data.paymentMethod) {
      return res.status(400).json({
        error: 'Missing required fields: amount, paymentMethod',
      });
    }

    const deposit = await depositService.addDepositPayment(id, data);
    res.json(deposit);
  } catch (error: any) {
    console.error('Error adding deposit payment:', error);
    res.status(400).json({ error: error.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// RESERVATIONS INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/reservations/:reservationId/deposits
 * Get all deposits for a reservation
 */
export async function getReservationDeposits(req: Request, res: Response) {
  try {
    const { reservationId } = req.params;
    const result = await depositService.listDeposits({ reservationId });
    res.json(result.deposits);
  } catch (error: any) {
    console.error('Error getting reservation deposits:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/reservations/:reservationId/deposits
 * Create deposit for reservation
 */
export async function createReservationDeposit(req: Request, res: Response) {
  try {
    const { reservationId } = req.params;
    const data: CreateDepositRequest = {
      ...req.body,
      reservationId,
    };

    const deposit = await depositService.createDeposit(data);
    res.status(201).json(deposit);
  } catch (error: any) {
    console.error('Error creating reservation deposit:', error);
    res.status(400).json({ error: error.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// STATISTICS & REMINDERS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/deposits/statistics
 * Get deposit statistics
 */
export async function getStatistics(req: Request, res: Response) {
  try {
    const stats = await depositService.getDepositStatistics();
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting deposit statistics:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/deposits/reminders/pending
 * Get deposits requiring reminders
 */
export async function getPendingReminders(req: Request, res: Response) {
  try {
    const deposits = await depositService.getDepositsForReminders();
    res.json(deposits);
  } catch (error: any) {
    console.error('Error getting pending reminders:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/deposits/:id/reminder-sent
 * Mark reminder as sent
 */
export async function markReminderSent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await depositService.markReminderSent(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error marking reminder as sent:', error);
    res.status(400).json({ error: error.message });
  }
}
