/**
 * Deposit Controller
 * MIGRATED: AppError + Prisma singleton (was using new PrismaClient()!)
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

export const markDepositAsPaid = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { paymentMethod, paidAt } = req.body;

  if (!paymentMethod || !paidAt) {
    throw AppError.badRequest('Payment method and paid date are required');
  }

  const deposit = await prisma.deposit.findUnique({
    where: { id },
  });

  if (!deposit) throw AppError.notFound('Deposit');

  const updatedDeposit = await prisma.deposit.update({
    where: { id },
    data: {
      paid: true,
      status: 'PAID',
      paidAt: new Date(paidAt),
      paymentMethod: paymentMethod,
    },
  });

  res.json({ success: true, data: updatedDeposit });
};

export const markDepositAsUnpaid = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const deposit = await prisma.deposit.findUnique({
    where: { id },
  });

  if (!deposit) throw AppError.notFound('Deposit');

  const updatedDeposit = await prisma.deposit.update({
    where: { id },
    data: {
      paid: false,
      status: 'PENDING',
      paidAt: null,
      paymentMethod: null,
    },
  });

  res.json({ success: true, data: updatedDeposit });
};
