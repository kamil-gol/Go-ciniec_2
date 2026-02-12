/**
 * Deposit Controller
 * Full CRUD + mark-paid/unpaid + stats + overdue
 */

import { Request, Response } from 'express';
import depositService from '../services/deposit.service';
import {
  createDepositSchema,
  updateDepositSchema,
  markPaidSchema,
  depositFiltersSchema,
} from '../validation/deposit.validation';
import { AppError } from '../utils/AppError';

/**
 * GET /api/deposits
 * List all deposits with filters
 */
export const listDeposits = async (req: Request, res: Response): Promise<void> => {
  const filters = depositFiltersSchema.parse(req.query);
  const result = await depositService.list(filters);
  res.json({ success: true, data: result.deposits, pagination: result.pagination });
};

/**
 * GET /api/deposits/stats
 * Get global deposit statistics
 */
export const getDepositStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await depositService.getStats();
  res.json({ success: true, data: stats });
};

/**
 * GET /api/deposits/overdue
 * Get all overdue deposits
 */
export const getOverdueDeposits = async (_req: Request, res: Response): Promise<void> => {
  const deposits = await depositService.getOverdue();
  res.json({ success: true, data: deposits });
};

/**
 * GET /api/deposits/:id
 * Get single deposit by ID
 */
export const getDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deposit = await depositService.getById(id);
  res.json({ success: true, data: deposit });
};

/**
 * GET /api/reservations/:reservationId/deposits
 * Get all deposits for a reservation
 */
export const getReservationDeposits = async (req: Request, res: Response): Promise<void> => {
  const { reservationId } = req.params;
  const result = await depositService.getByReservation(reservationId);
  res.json({ success: true, data: result.deposits, summary: result.summary });
};

/**
 * POST /api/reservations/:reservationId/deposits
 * Create a new deposit for a reservation
 */
export const createDeposit = async (req: Request, res: Response): Promise<void> => {
  const { reservationId } = req.params;
  const body = createDepositSchema.parse(req.body);

  const deposit = await depositService.create({
    reservationId,
    amount: body.amount,
    dueDate: body.dueDate,
    notes: body.notes,
  });

  res.status(201).json({ success: true, data: deposit });
};

/**
 * PUT /api/deposits/:id
 * Update a deposit
 */
export const updateDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = updateDepositSchema.parse(req.body);

  const deposit = await depositService.update(id, body);
  res.json({ success: true, data: deposit });
};

/**
 * DELETE /api/deposits/:id
 * Delete a deposit
 */
export const deleteDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = await depositService.delete(id);
  res.json(result);
};

/**
 * PATCH /api/deposits/:id/mark-paid
 * Mark a deposit as paid
 */
export const markDepositAsPaid = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = markPaidSchema.parse(req.body);

  const deposit = await depositService.markAsPaid(id, body);
  res.json({ success: true, data: deposit });
};

/**
 * PATCH /api/deposits/:id/mark-unpaid
 * Revert paid status
 */
export const markDepositAsUnpaid = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deposit = await depositService.markAsUnpaid(id);
  res.json({ success: true, data: deposit });
};

/**
 * PATCH /api/deposits/:id/cancel
 * Cancel a deposit
 */
export const cancelDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deposit = await depositService.cancel(id);
  res.json({ success: true, data: deposit });
};
