import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const markDepositAsPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paidAt } = req.body;

    if (!paymentMethod || !paidAt) {
      return res.status(400).json({ error: 'Payment method and paid date are required' });
    }

    // Check if deposit exists
    const deposit = await prisma.deposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Update deposit as paid
    const updatedDeposit = await prisma.deposit.update({
      where: { id },
      data: {
        paid: true,
        status: 'PAID',
        paidAt: new Date(paidAt),
        paymentMethod: paymentMethod,
      },
    });

    res.json(updatedDeposit);
  } catch (error: any) {
    console.error('Error marking deposit as paid:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

export const markDepositAsUnpaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if deposit exists
    const deposit = await prisma.deposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Update deposit as unpaid
    const updatedDeposit = await prisma.deposit.update({
      where: { id },
      data: {
        paid: false,
        status: 'PENDING',
        paidAt: null,
        paymentMethod: null,
      },
    });

    res.json(updatedDeposit);
  } catch (error: any) {
    console.error('Error marking deposit as unpaid:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
