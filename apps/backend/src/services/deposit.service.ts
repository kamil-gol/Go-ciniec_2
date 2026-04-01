/**
 * Deposit Service - with Audit Logging
 * Full CRUD + business logic for deposit/advance payment management
 * Phase 4.2: Auto-confirm reservation when all deposits are paid
 * Phase 4.3: Block cancellation of reservations with paid deposits
 * Updated: Deposit limits include extrasTotalPrice (#6)
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts + poprawione diakrytyki
 */

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { Prisma, Deposit } from '@/prisma-client';
import { logChange } from '../utils/audit-logger';
import { DEPOSIT } from '../i18n/pl';
import { depositStatsService } from './deposits/deposit-stats.service';
import { depositNotificationsService } from './deposits/deposit-notifications.service';
import { DEPOSIT_INCLUDE, getFullReservationPrice } from './deposits/deposit.helpers';
import { getTodayISO } from '../utils/date.utils';

export type DepositStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'BLIK' | 'CARD' | 'BANK_TRANSFER';

export interface CreateDepositInput {
  reservationId: string;
  amount: number;
  dueDate: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
}

export interface UpdateDepositInput {
  amount?: number;
  dueDate?: string;
  notes?: string;
}

export interface MarkPaidInput {
  paymentMethod: PaymentMethod;
  paidAt: string;
  amountPaid?: number;
  notes?: string;
}

export interface DepositFilters {
  reservationId?: string;
  status?: DepositStatus;
  overdue?: boolean;
  dateFrom?: string;
  dateTo?: string;
  paid?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'amount' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

const depositService = {
  async create(input: CreateDepositInput, userId: string) {
    const { reservationId, amount, dueDate } = input;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { deposits: true, client: true },
    });

    if (!reservation) throw AppError.notFound('Rezerwacja');

    const existingDepositsSum = reservation.deposits
      .filter((d: Deposit) => d.status !== 'CANCELLED')
      .reduce((sum: number, d: Deposit) => sum + Number(d.amount), 0);

    const fullPrice = getFullReservationPrice(reservation);

    if (existingDepositsSum + amount > fullPrice) {
      throw AppError.badRequest(
        DEPOSIT.EXCEEDS_PRICE(existingDepositsSum + amount, fullPrice, fullPrice - existingDepositsSum)
      );
    }

    if (amount <= 0) throw AppError.badRequest(DEPOSIT.AMOUNT_POSITIVE);

    const dueDateStr = dueDate.substring(0, 10);

    const result: Array<{ id: string }> = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "Deposit" (
        id, "reservationId", amount, "remainingAmount", "paidAmount",
        "dueDate", status, paid, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), ${reservationId}::uuid, ${amount}, ${amount}, 0,
        ${dueDateStr}, 'PENDING', false, NOW(), NOW()
      ) RETURNING id::text as id`;

    const newId = result[0].id;

    const deposit = await prisma.deposit.findUnique({
      where: { id: newId },
      include: DEPOSIT_INCLUDE,
    });

    // Audit log
    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'DEPOSIT',
      entityId: newId,
      details: {
        description: `Utworzono zaliczk\u0119: ${amount} PLN (termin: ${dueDateStr})`,
        data: { amount, dueDate: dueDateStr, reservationId }
      }
    });

    return deposit;
  },

  async getById(id: string) {
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });
    if (!deposit) throw AppError.notFound('Zaliczka');
    return deposit;
  },

  async getByReservation(reservationId: string) {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw AppError.notFound('Rezerwacja');

    const deposits = await prisma.deposit.findMany({
      where: { reservationId },
      orderBy: { dueDate: 'asc' },
      include: { reservation: { include: { client: true } } },
    });

    const totalAmount = deposits
      .filter((d) => d.status !== 'CANCELLED')
      .reduce((sum: number, d) => sum + Number(d.amount), 0);
    const paidAmount = deposits
      .filter((d) => d.paid)
      .reduce((sum: number, d) => sum + Number(d.amount), 0);
    const pendingAmount = totalAmount - paidAmount;
    const reservationTotal = getFullReservationPrice(reservation);

    return {
      deposits,
      summary: {
        totalDeposits: deposits.length,
        activeDeposits: deposits.filter((d) => d.status !== 'CANCELLED').length,
        totalAmount: Number(totalAmount.toFixed(2)),
        paidAmount: Number(paidAmount.toFixed(2)),
        pendingAmount: Number(pendingAmount.toFixed(2)),
        reservationTotal: Number(reservationTotal.toFixed(2)),
        remainingToDeposit: Number((reservationTotal - totalAmount).toFixed(2)),
        percentPaid: reservationTotal > 0 ? Number(((paidAmount / reservationTotal) * 100).toFixed(1)) : 0,
      },
    };
  },

  async list(filters: DepositFilters) {
    const {
      reservationId, status, overdue, dateFrom, dateTo, paid, search,
      page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc',
    } = filters;

    const where: Prisma.DepositWhereInput = {};

    if (reservationId) where.reservationId = reservationId;
    if (status) where.status = { equals: status };
    if (paid !== undefined) where.paid = paid;

    if (overdue) {
      where.status = { equals: 'PENDING' };
      const todayStr = getTodayISO();
      where.dueDate = { lt: todayStr };
    }

    if (dateFrom || dateTo) {
      const dueDateFilter: Prisma.StringFilter = {};
      if (dateFrom) dueDateFilter.gte = dateFrom.substring(0, 10);
      if (dateTo) dueDateFilter.lte = dateTo.substring(0, 10);
      where.dueDate = dueDateFilter;
    }

    if (search) {
      where.reservation = {
        client: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        },
      };
    }

    const skip = (page - 1) * limit;

    const [deposits, totalCount] = await Promise.all([
      prisma.deposit.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: DEPOSIT_INCLUDE,
      }),
      prisma.deposit.count({ where }),
    ]);

    return {
      deposits,
      pagination: {
        page, limit, totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + deposits.length < totalCount,
      },
    };
  },

  async update(id: string, input: UpdateDepositInput, userId: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw AppError.notFound('Zaliczka');

    if (deposit.paid) {
      throw AppError.badRequest(DEPOSIT.CANNOT_EDIT_PAID);
    }

    if (input.amount !== undefined) {
      if (input.amount <= 0) throw AppError.badRequest(DEPOSIT.AMOUNT_POSITIVE);

      const reservation = await prisma.reservation.findUnique({
        where: { id: deposit.reservationId },
        include: { deposits: true },
      });

      if (reservation) {
        const otherDepositsSum = reservation.deposits
          .filter((d: Deposit) => d.id !== id && d.status !== 'CANCELLED')
          .reduce((sum: number, d: Deposit) => sum + Number(d.amount), 0);

        const fullPrice = getFullReservationPrice(reservation);

        if (otherDepositsSum + input.amount > fullPrice) {
          throw AppError.badRequest(
            DEPOSIT.EXCEEDS_PRICE(otherDepositsSum + input.amount, fullPrice, fullPrice - otherDepositsSum)
          );
        }
      }
    }

    if (input.amount !== undefined && input.dueDate) {
      const dueDateStr = input.dueDate.substring(0, 10);
      await prisma.$queryRaw`UPDATE "Deposit" SET amount = ${input.amount}, "remainingAmount" = ${input.amount}, "dueDate" = ${dueDateStr}, "updatedAt" = NOW() WHERE id = ${id}::uuid`;
    } else if (input.amount !== undefined) {
      await prisma.$queryRaw`UPDATE "Deposit" SET amount = ${input.amount}, "remainingAmount" = ${input.amount}, "updatedAt" = NOW() WHERE id = ${id}::uuid`;
    } else if (input.dueDate) {
      const dueDateStr = input.dueDate.substring(0, 10);
      await prisma.$queryRaw`UPDATE "Deposit" SET "dueDate" = ${dueDateStr}, "updatedAt" = NOW() WHERE id = ${id}::uuid`;
    }

    const updated = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

    // Audit log
    await logChange({
      userId,
      action: 'UPDATE',
      entityType: 'DEPOSIT',
      entityId: id,
      details: {
        description: `Zaktualizowano zaliczk\u0119`,
        changes: input as Record<string, unknown>
      }
    });

    return updated;
  },

  async delete(id: string, userId: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw AppError.notFound('Zaliczka');

    // Usunięcie opłaconej zaliczki jest dozwolone (np. błąd lub rezygnacja klienta).
    // Operacja jest w pełni auditowana — pole wasPaid zapisywane w logu.

    await prisma.$queryRaw`DELETE FROM "Deposit" WHERE id = ${id}::uuid`;

    // Audit log
    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'DEPOSIT',
      entityId: id,
      details: {
        description: `Usuni\u0119to zaliczk\u0119: ${Number(deposit.amount)} PLN${deposit.paid ? ' [BY\u0141A OP\u0141ACONA]' : ''}`,
        deletedData: {
          amount: Number(deposit.amount),
          dueDate: deposit.dueDate,
          wasPaid: deposit.paid,
          paymentMethod: deposit.paymentMethod,
        }
      }
    });

    return { success: true, message: DEPOSIT.DELETED };
  },

  async markAsPaid(id: string, input: MarkPaidInput, userId: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw AppError.notFound('Zaliczka');

    if (deposit.paid) throw AppError.badRequest(DEPOSIT.ALREADY_PAID);

    const amountPaid = input.amountPaid || Number(deposit.amount);
    const remaining = Number(deposit.amount) - amountPaid;
    const isPaid = remaining <= 0;
    const newStatus = isPaid ? 'PAID' : 'PARTIALLY_PAID';
    const remainingAmount = Math.max(0, remaining);

    await prisma.$queryRaw`UPDATE "Deposit" SET paid = ${isPaid}, status = ${newStatus}, "paidAt" = ${input.paidAt}::timestamp, "paymentMethod" = ${input.paymentMethod}, "remainingAmount" = ${remainingAmount}, "paidAmount" = ${amountPaid}, "updatedAt" = NOW() WHERE id = ${id}::uuid`;

    const updated = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

    // Audit log
    await logChange({
      userId,
      action: 'MARK_PAID',
      entityType: 'DEPOSIT',
      entityId: id,
      details: {
        description: `Oznaczono zaliczk\u0119 jako op\u0142acon\u0105: ${amountPaid} PLN (${input.paymentMethod})`,
        data: { amountPaid, paymentMethod: input.paymentMethod, status: newStatus }
      }
    });

    // Phase 4.2: Auto-confirm reservation when all deposits are paid
    if (isPaid) {
      await depositNotificationsService.checkAndAutoConfirmReservation(deposit.reservationId, userId);
    }

    return updated;
  },

  /** Delegate to depositNotificationsService */
  async checkAndAutoConfirmReservation(reservationId: string, userId: string) {
    return depositNotificationsService.checkAndAutoConfirmReservation(reservationId, userId);
  },

  /** Delegate to depositNotificationsService */
  async checkPaidDepositsBeforeCancel(reservationId: string): Promise<{ hasPaidDeposits: boolean; paidCount: number; paidTotal: number }> {
    return depositNotificationsService.checkPaidDepositsBeforeCancel(reservationId);
  },

  /** Delegate to depositNotificationsService */
  async sendConfirmationEmail(id: string) {
    return depositNotificationsService.sendConfirmationEmail(id);
  },

  async markAsUnpaid(id: string, userId: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw AppError.notFound('Zaliczka');

    if (!deposit.paid && deposit.status === 'PENDING') {
      throw AppError.badRequest(DEPOSIT.NOT_PAID);
    }

    const depositAmount = Number(deposit.amount);

    await prisma.$queryRaw`UPDATE "Deposit" SET paid = false, status = 'PENDING', "paidAt" = NULL, "paymentMethod" = NULL, "remainingAmount" = ${depositAmount}, "paidAmount" = 0, "updatedAt" = NOW() WHERE id = ${id}::uuid`;

    const updated = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

    // Audit log
    await logChange({
      userId,
      action: 'MARK_UNPAID',
      entityType: 'DEPOSIT',
      entityId: id,
      details: {
        description: `Cofni\u0119to oznaczenie p\u0142atno\u015bci dla zaliczki`,
        oldStatus: deposit.status,
        newStatus: 'PENDING'
      }
    });

    return updated;
  },

  async cancel(id: string, userId: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw AppError.notFound('Zaliczka');

    if (deposit.paid) {
      throw AppError.badRequest(DEPOSIT.CANNOT_CANCEL_PAID);
    }

    await prisma.$queryRaw`UPDATE "Deposit" SET status = 'CANCELLED', "remainingAmount" = 0, "updatedAt" = NOW() WHERE id = ${id}::uuid`;

    const updated = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

    // Audit log
    await logChange({
      userId,
      action: 'CANCEL',
      entityType: 'DEPOSIT',
      entityId: id,
      details: {
        description: `Anulowano zaliczk\u0119: ${Number(deposit.amount)} PLN`
      }
    });

    return updated;
  },

  async getStats() {
    return depositStatsService.getStats();
  },

  async getOverdue() {
    return depositStatsService.getOverdue();
  },

  async autoMarkOverdue() {
    return depositStatsService.autoMarkOverdue();
  },
};

export default depositService;
