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
import { Prisma } from '@/generated/prisma';
import { pdfService } from './pdf.service';
import emailService from './email.service';
import logger from '../utils/logger';
import { logChange } from '../utils/audit-logger';
import { DEPOSIT } from '../i18n/pl';
import notificationService from './notification.service';

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

const DEPOSIT_INCLUDE = {
  reservation: {
    include: {
      client: true,
      hall: true,
      eventType: true,
    },
  },
} as const;

/**
 * Calculate full reservation price including extras.
 * Used as the deposit ceiling — sum of base totalPrice + extrasTotalPrice.
 */
function getFullReservationPrice(reservation: any): number {
  return Number(reservation.totalPrice || 0) + Number(reservation.extrasTotalPrice || 0);
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
      .filter((d: any) => d.status !== 'CANCELLED')
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

    const fullPrice = getFullReservationPrice(reservation);

    if (existingDepositsSum + amount > fullPrice) {
      throw AppError.badRequest(
        DEPOSIT.EXCEEDS_PRICE(existingDepositsSum + amount, fullPrice, fullPrice - existingDepositsSum)
      );
    }

    if (amount <= 0) throw AppError.badRequest(DEPOSIT.AMOUNT_POSITIVE);

    const dueDateStr = dueDate.substring(0, 10);

    const result: any[] = await prisma.$queryRawUnsafe(
      `INSERT INTO "Deposit" (
        id, "reservationId", amount, "remainingAmount", "paidAmount",
        "dueDate", status, paid, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2, $3, 0,
        $4, 'PENDING', false, NOW(), NOW()
      ) RETURNING id::text as id`,
      reservationId, amount, amount, dueDateStr
    );

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
      .filter((d: any) => d.status !== 'CANCELLED')
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    const paidAmount = deposits
      .filter((d: any) => d.paid)
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    const pendingAmount = totalAmount - paidAmount;
    const reservationTotal = getFullReservationPrice(reservation);

    return {
      deposits,
      summary: {
        totalDeposits: deposits.length,
        activeDeposits: deposits.filter((d: any) => d.status !== 'CANCELLED').length,
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
      const todayStr = new Date().toISOString().substring(0, 10);
      where.dueDate = { lt: todayStr as any };
    }

    if (dateFrom || dateTo) {
      const dueDateFilter: any = {};
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
          .filter((d: any) => d.id !== id && d.status !== 'CANCELLED')
          .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

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
      await prisma.$queryRawUnsafe(
        `UPDATE "Deposit" SET amount = $1, "remainingAmount" = $2, "dueDate" = $3, "updatedAt" = NOW() WHERE id = $4::uuid`,
        input.amount, input.amount, dueDateStr, id
      );
    } else if (input.amount !== undefined) {
      await prisma.$queryRawUnsafe(
        `UPDATE "Deposit" SET amount = $1, "remainingAmount" = $2, "updatedAt" = NOW() WHERE id = $3::uuid`,
        input.amount, input.amount, id
      );
    } else if (input.dueDate) {
      const dueDateStr = input.dueDate.substring(0, 10);
      await prisma.$queryRawUnsafe(
        `UPDATE "Deposit" SET "dueDate" = $1, "updatedAt" = NOW() WHERE id = $2::uuid`,
        dueDateStr, id
      );
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
        changes: input as any
      }
    });

    return updated;
  },

  async delete(id: string, userId: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw AppError.notFound('Zaliczka');

    // Usunięcie opłaconej zaliczki jest dozwolone (np. błąd lub rezygnacja klienta).
    // Operacja jest w pełni auditowana — pole wasPaid zapisywane w logu.

    await prisma.$queryRawUnsafe(`DELETE FROM "Deposit" WHERE id = $1::uuid`, id);

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

    await prisma.$queryRawUnsafe(
      `UPDATE "Deposit" SET paid = $1, status = $2, "paidAt" = $3::timestamp, "paymentMethod" = $4, "remainingAmount" = $5, "paidAmount" = $6, "updatedAt" = NOW() WHERE id = $7::uuid`,
      isPaid, newStatus, input.paidAt, input.paymentMethod, remainingAmount, amountPaid, id
    );

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
      await depositService.checkAndAutoConfirmReservation(deposit.reservationId, userId);
    }

    return updated;
  },

  /**
   * Phase 4.2: Check if all active deposits for a reservation are paid.
   * If yes and reservation is PENDING → auto-confirm it.
   */
  async checkAndAutoConfirmReservation(reservationId: string, userId: string) {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { deposits: true, client: true },
      });

      if (!reservation) return;
      // Only auto-confirm PENDING reservations
      if (reservation.status !== 'PENDING') return;

      const activeDeposits = reservation.deposits.filter(
        (d: any) => d.status !== 'CANCELLED'
      );

      // Need at least one active deposit
      if (activeDeposits.length === 0) return;

      const allPaid = activeDeposits.every((d: any) => d.status === 'PAID');

      if (allPaid) {
        await prisma.reservation.update({
          where: { id: reservationId },
          data: { status: 'CONFIRMED' },
        });

        // Create reservation history entry
        await prisma.reservationHistory.create({
          data: {
            reservationId,
            changedByUserId: userId,
            changeType: 'STATUS_CHANGED',
            fieldName: 'status',
            oldValue: 'PENDING',
            newValue: 'CONFIRMED',
            reason: 'Automatyczne potwierdzenie \u2014 wszystkie zaliczki op\u0142acone',
          },
        });

        // #217: logChange removed — reservationHistory entry above already covers AUTO_CONFIRM

        logger.info(`[Deposit] Auto-confirmed reservation ${reservationId} \u2014 all ${activeDeposits.length} deposits paid`);
      }
    } catch (error) {
      // Don't fail the payment operation if auto-confirm fails
      logger.error(`[Deposit] Error in auto-confirm check for reservation ${reservationId}:`, error);
    }
  },

  /**
   * Phase 4.3: Check if a reservation has paid deposits (used before cancel/delete).
   * Returns info about paid deposits for the guard check.
   */
  async checkPaidDepositsBeforeCancel(reservationId: string): Promise<{ hasPaidDeposits: boolean; paidCount: number; paidTotal: number }> {
    const deposits = await prisma.deposit.findMany({
      where: { reservationId, status: 'PAID' },
    });

    const paidCount = deposits.length;
    const paidTotal = deposits.reduce((sum: number, d: any) => sum + Number(d.amount), 0);

    return { hasPaidDeposits: paidCount > 0, paidCount, paidTotal };
  },

  async sendConfirmationEmail(id: string) {
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

    if (!deposit) throw AppError.notFound('Zaliczka');
    if (!deposit.paid) throw AppError.badRequest(DEPOSIT.EMAIL_ONLY_PAID);

    const reservation = deposit.reservation as any;
    const client = reservation?.client;

    if (!client?.email) throw AppError.badRequest(DEPOSIT.CLIENT_NO_EMAIL);

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
        totalPrice: getFullReservationPrice(reservation),
      },
    });

    await emailService.sendDepositPaidConfirmation(
      client.email,
      {
        clientName: `${client.firstName} ${client.lastName}`,
        depositAmount: Number(deposit.amount).toFixed(2),
        paidAt: (deposit.paidAt ? new Date(deposit.paidAt) : new Date()).toLocaleDateString('pl-PL', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        paymentMethod: deposit.paymentMethod || 'TRANSFER',
        reservationDate: reservation.date || '',
        hallName: reservation.hall?.name || 'Nie przypisano',
        eventType: reservation.eventType?.name || 'Wydarzenie',
      },
      pdfBuffer
    );

    logger.info(`[Deposit] Email confirmation sent to ${client.email} for deposit ${id}`);

    return { success: true, message: `Email wys\u0142any do ${client.email}` };
  },

  async markAsUnpaid(id: string, userId: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw AppError.notFound('Zaliczka');

    if (!deposit.paid && deposit.status === 'PENDING') {
      throw AppError.badRequest(DEPOSIT.NOT_PAID);
    }

    const depositAmount = Number(deposit.amount);

    await prisma.$queryRawUnsafe(
      `UPDATE "Deposit" SET paid = false, status = 'PENDING', "paidAt" = NULL, "paymentMethod" = NULL, "remainingAmount" = $1, "paidAmount" = 0, "updatedAt" = NOW() WHERE id = $2::uuid`,
      depositAmount, id
    );

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

    await prisma.$queryRawUnsafe(
      `UPDATE "Deposit" SET status = 'CANCELLED', "remainingAmount" = 0, "updatedAt" = NOW() WHERE id = $1::uuid`,
      id
    );

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
    const todayStr = new Date().toISOString().substring(0, 10);

    const stats: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('PENDING','PAID','OVERDUE','PARTIALLY_PAID'))::int as total,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending,
        COUNT(*) FILTER (WHERE status = 'PAID')::int as paid,
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" < $1)::int as overdue,
        COUNT(*) FILTER (WHERE status = 'PARTIALLY_PAID')::int as "partiallyPaid",
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int as cancelled,
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" >= $1 AND "dueDate" <= $2)::int as "upcomingIn7Days",
        COALESCE(SUM(amount) FILTER (WHERE status IN ('PENDING','PAID','OVERDUE','PARTIALLY_PAID')), 0)::numeric as "totalAmount",
        COALESCE(SUM(amount) FILTER (WHERE paid = true), 0)::numeric as "paidAmountSum",
        COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING' AND "dueDate" < $1), 0)::numeric as "overdueAmount"
      FROM "Deposit"
    `, todayStr, getDatePlusDays(7));

    const row = stats[0] || {};
    const totalAmt = Number(row.totalAmount || 0);
    const paidAmt = Number(row.paidAmountSum || 0);

    return {
      counts: {
        total: Number(row.total || 0),
        pending: Number(row.pending || 0),
        paid: Number(row.paid || 0),
        overdue: Number(row.overdue || 0),
        partiallyPaid: Number(row.partiallyPaid || 0),
        cancelled: Number(row.cancelled || 0),
        upcomingIn7Days: Number(row.upcomingIn7Days || 0),
      },
      amounts: {
        total: Number(totalAmt.toFixed(2)),
        paid: Number(paidAmt.toFixed(2)),
        pending: Number((totalAmt - paidAmt).toFixed(2)),
        overdue: Number(Number(row.overdueAmount || 0).toFixed(2)),
      },
    };
  },

  async getOverdue() {
    const todayStr = new Date().toISOString().substring(0, 10);

    const deposits = await prisma.deposit.findMany({
      where: {
        status: { equals: 'PENDING' },
        dueDate: { lt: todayStr as any },
      },
      orderBy: { dueDate: 'asc' },
      include: DEPOSIT_INCLUDE,
    });

    return deposits;
  },

  async autoMarkOverdue() {
    const todayStr = new Date().toISOString().substring(0, 10);

    const result: any[] = await prisma.$queryRawUnsafe(
      `WITH updated AS (
        UPDATE "Deposit" SET status = 'OVERDUE', "updatedAt" = NOW()
        WHERE status = 'PENDING' AND paid = false AND "dueDate" < $1
        RETURNING id
      ) SELECT count(*)::int as count FROM updated`,
      todayStr
    );

    const count = Number(result[0]?.count || 0);

    // #128: Notification — overdue deposits
    if (count > 0) {
      notificationService.createForAll({
        type: 'DEPOSIT_OVERDUE',
        title: 'Przeterminowane zaliczki',
        message: `${count} ${count === 1 ? 'zaliczka przekroczyła' : 'zaliczek przekroczyło'} termin płatności`,
        entityType: 'DEPOSIT',
      });
    }

    return { markedOverdueCount: count };
  },
};

function getDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

export default depositService;
