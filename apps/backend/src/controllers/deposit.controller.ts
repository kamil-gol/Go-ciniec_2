/**
 * Deposit Controller - with userId for audit
 */

import { Request, Response } from 'express';
import depositService from '../services/deposit.service';
import { pdfService } from '../services/pdf.service';
import {
  createDepositSchema,
  updateDepositSchema,
  markPaidSchema,
  depositFiltersSchema,
} from '../validation/deposit.validation';
import { AppError } from '../utils/AppError';

export const listDeposits = async (req: Request, res: Response): Promise<void> => {
  const filters = depositFiltersSchema.parse(req.query);
  const result = await depositService.list(filters);
  res.json({ success: true, data: result.deposits, pagination: result.pagination });
};

export const getDepositStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await depositService.getStats();
  res.json({ success: true, data: stats });
};

export const getOverdueDeposits = async (_req: Request, res: Response): Promise<void> => {
  const deposits = await depositService.getOverdue();
  res.json({ success: true, data: deposits });
};

export const getDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deposit = await depositService.getById(id);
  res.json({ success: true, data: deposit });
};

export const downloadDepositPdf = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deposit = await depositService.getById(id);

  if (!deposit.paid) {
    throw AppError.badRequest('PDF potwierdzenia dostepny tylko dla oplaconych zaliczek');
  }

  const reservation = deposit.reservation as {
    id: string;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    guests: number;
    totalPrice: number | { toNumber(): number };
    hall?: { name: string } | null;
    eventType?: { name: string } | null;
    client?: {
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string;
    } | null;
  } | null;
  const client = reservation?.client;

  if (!reservation || !client) {
    throw AppError.badRequest('Brak danych rezerwacji lub klienta');
  }

  const pdfBuffer = await pdfService.generatePaymentConfirmationPDF({
    depositId: deposit.id,
    amount: Number(deposit.amount),
    paidAt: deposit.paidAt ? new Date(deposit.paidAt) : new Date(),
    paymentMethod: deposit.paymentMethod || 'TRANSFER',
    client: {
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || undefined,
      phone: client.phone,
    },
    reservation: {
      id: reservation.id,
      date: reservation.date || '',
      startTime: reservation.startTime || '',
      endTime: reservation.endTime || '',
      hall: reservation.hall?.name,
      eventType: reservation.eventType?.name,
      guests: reservation.guests,
      totalPrice: Number(reservation.totalPrice),
    },
  });

  const filename = `Potwierdzenie_wplaty_${deposit.id.substring(0, 8)}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
};

export const sendDepositEmail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = await depositService.sendConfirmationEmail(id);
  res.json(result);
};

export const getReservationDeposits = async (req: Request, res: Response): Promise<void> => {
  const { reservationId } = req.params;
  const result = await depositService.getByReservation(reservationId);
  res.json({ success: true, data: result.deposits, summary: result.summary });
};

export const createDeposit = async (req: Request, res: Response): Promise<void> => {
  const { reservationId } = req.params;
  const body = createDepositSchema.parse(req.body);
  const userId = req.user?.id;

  if (!userId) throw AppError.unauthorized('User not authenticated');

  const deposit = await depositService.create({
    reservationId,
    amount: body.amount,
    dueDate: body.dueDate,
    notes: body.notes,
  }, userId);

  res.status(201).json({ success: true, data: deposit });
};

export const updateDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = updateDepositSchema.parse(req.body);
  const userId = req.user?.id;

  if (!userId) throw AppError.unauthorized('User not authenticated');

  const deposit = await depositService.update(id, body, userId);
  res.json({ success: true, data: deposit });
};

export const deleteDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) throw AppError.unauthorized('User not authenticated');

  const result = await depositService.delete(id, userId);
  res.json(result);
};

export const markDepositAsPaid = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = markPaidSchema.parse(req.body);
  const userId = req.user?.id;

  if (!userId) throw AppError.unauthorized('User not authenticated');

  const deposit = await depositService.markAsPaid(id, body, userId);
  res.json({ success: true, data: deposit });
};

export const markDepositAsUnpaid = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) throw AppError.unauthorized('User not authenticated');

  const deposit = await depositService.markAsUnpaid(id, userId);
  res.json({ success: true, data: deposit });
};

export const cancelDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) throw AppError.unauthorized('User not authenticated');

  const deposit = await depositService.cancel(id, userId);
  res.json({ success: true, data: deposit });
};
