import prisma from '@lib/prisma';
import { badRequest } from './catering-order.helpers';
import type { CreateDepositInput, UpdateDepositInput } from './catering-order.types';

// ─── Depozyty ────────────────────────────────────────────────────────────────────────────────────

export async function createDeposit(
  orderId: string,
  input: CreateDepositInput,
  changedById?: string,
) {
  if (input.amount <= 0) {
    badRequest('Kwota zaliczki musi być większa od 0.');
  }

  // Walidacja: suma zaliczek nie może przekroczyć wartości zamówienia
  const order = await prisma.cateringOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { deposits: true },
  });

  const existingTotal = order.deposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalPrice = Number(order.totalPrice);
  const newTotal = existingTotal + input.amount;

  if (newTotal > totalPrice) {
    const remaining = Math.max(0, totalPrice - existingTotal);
    badRequest(
      `Suma zaliczek (${newTotal.toFixed(2)} PLN) przekracza wartość zamówienia (${totalPrice.toFixed(2)} PLN). Możesz dodać maksymalnie ${remaining.toFixed(2)} PLN.`,
    );
  }

  const deposit = await prisma.cateringDeposit.create({
    data: {
      orderId,
      amount: input.amount,
      remainingAmount: input.amount,
      dueDate: input.dueDate,
      title: input.title ?? null,
      description: input.description ?? null,
      internalNotes: input.internalNotes ?? null,
    },
  });

  if (changedById) {
    await prisma.cateringOrderHistory.create({
      data: {
        orderId,
        changedById,
        changeType: 'DEPOSIT_CREATED',
        fieldName: 'deposit',
        newValue: `${input.title ?? 'Zaliczka'} — ${input.amount} PLN`,
      },
    });

    // #217: logChange removed — cateringOrderHistory entry already covers DEPOSIT_CREATED
  }

  return deposit;
}

export async function updateDeposit(
  depositId: string,
  input: UpdateDepositInput,
  changedById?: string,
  orderId?: string,
) {
  const deposit = await prisma.cateringDeposit.findUniqueOrThrow({ where: { id: depositId } });

  // Walidacja kwoty: suma pozostałych zaliczek + nowa kwota ≤ totalPrice
  if (input.amount !== undefined) {
    if (input.amount <= 0) {
      badRequest('Kwota zaliczki musi być większa od 0.');
    }

    const order = await prisma.cateringOrder.findUniqueOrThrow({
      where: { id: deposit.orderId },
      include: { deposits: true },
    });

    const otherTotal = order.deposits
      .filter(d => d.id !== depositId)
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalPrice = Number(order.totalPrice);
    const newTotal = otherTotal + input.amount;

    if (newTotal > totalPrice) {
      const maxAllowed = Math.max(0, totalPrice - otherTotal);
      badRequest(
        `Suma zaliczek (${newTotal.toFixed(2)} PLN) przekracza wartość zamówienia (${totalPrice.toFixed(2)} PLN). Maksymalna kwota tej zaliczki to ${maxAllowed.toFixed(2)} PLN.`,
      );
    }
  }

  const updated = await prisma.cateringDeposit.update({
    where: { id: depositId },
    data: {
      ...(input.amount !== undefined && {
        amount: input.amount,
        remainingAmount: deposit.paid ? 0 : input.amount,
      }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...('title' in input && { title: input.title ?? null }),
      ...('description' in input && { description: input.description ?? null }),
      ...('internalNotes' in input && { internalNotes: input.internalNotes ?? null }),
    },
  });

  if (changedById && orderId) {
    await prisma.cateringOrderHistory.create({
      data: {
        orderId,
        changedById,
        changeType: 'DEPOSIT_UPDATED',
        fieldName: 'deposit',
        newValue: `${updated.title ?? 'Zaliczka'} — ${updated.amount} PLN`,
      },
    });
  }

  return updated;
}

export async function deleteDeposit(
  depositId: string,
  changedById?: string,
  orderId?: string,
) {
  const deposit = await prisma.cateringDeposit.findUniqueOrThrow({ where: { id: depositId } });

  // Usuwanie opłaconych zaliczek jest dozwolone (korekta błędu, rezygnacja klienta).
  // Operacja rejestrowana jest w logu audytowym z flagą wasPaid.
  const wasPaid = deposit.paid;

  await prisma.cateringDeposit.delete({ where: { id: depositId } });

  if (changedById && orderId) {
    await prisma.cateringOrderHistory.create({
      data: {
        orderId,
        changedById,
        changeType: 'DEPOSIT_DELETED',
        fieldName: 'deposit',
        oldValue: `${deposit.title ?? 'Zaliczka'} — ${deposit.amount} PLN`,
        newValue: wasPaid ? `wasPaid:true paymentMethod:${deposit.paymentMethod ?? 'N/A'}` : null,
      },
    });

    // #217: logChange removed — cateringOrderHistory entry already covers DEPOSIT_DELETED
  }
}

export async function markDepositPaid(
  depositId: string,
  paymentMethod?: string,
  changedById?: string,
  orderId?: string,
) {
  const deposit = await prisma.cateringDeposit.findUniqueOrThrow({
    where: { id: depositId },
  });

  const result = await prisma.cateringDeposit.update({
    where: { id: depositId },
    data: {
      paid: true,
      paidAt: new Date(),
      paidAmount: deposit.amount,
      remainingAmount: 0,
      status: 'PAID',
      paymentMethod: paymentMethod ?? null,
    },
  });

  if (changedById && orderId) {
    await prisma.cateringOrderHistory.create({
      data: {
        orderId,
        changedById,
        changeType: 'DEPOSIT_PAID',
        fieldName: 'deposit',
        newValue: `${deposit.title ?? 'Zaliczka'} — ${deposit.amount} PLN (${paymentMethod ?? 'bez metody'})`,
      },
    });

    // #217: logChange removed — cateringOrderHistory entry already covers DEPOSIT_PAID
  }

  return result;
}
