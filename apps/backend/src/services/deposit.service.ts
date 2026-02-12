/**
 * Deposit Service
 * Full CRUD + business logic for deposit/advance payment management
 *
 * IMPORTANT: The actual DB schema differs from Prisma schema.
 * - dueDate is varchar(10) in DB (not timestamp)
 * - paidAmount column exists in DB (not in Prisma schema)
 * - Extra columns: title, description, receiptNumber, etc.
 * All writes use raw SQL to match the actual DB structure.
 * Reads use Prisma ORM (works fine for SELECT).
 */

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';
import pdfService from './pdf.service';
import emailService from './email.service';
import logger from '../utils/logger';

// Types

export type DepositStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'BLIK' | 'CARD';

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

const ACTIVE_STATUSES = ['PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID'];

const DEPOSIT_INCLUDE = {
  reservation: {
    include: {
      client: true,
      hall: true,
      eventType: true,
    },
  },
} as const;

const depositService = {
  /**
   * Create a new deposit for a reservation
   */
  async create(input: CreateDepositInput) {
    const { reservationId, amount, dueDate } = input;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { deposits: true, client: true },
    });

    if (!reservation) {
      throw AppError.notFound('Reservation');
    }

    const existingDepositsSum = reservation.deposits
      .filter((d: any) => d.status !== 'CANCELLED')
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

    const totalPrice = Number(reservation.totalPrice);

    if (existingDepositsSum + amount > totalPrice) {
      throw AppError.badRequest(
        'Suma zaliczek (' + (existingDepositsSum + amount) + ' PLN) przekracza cene rezerwacji (' + totalPrice + ' PLN). ' +
        'Dostepne do zaliczki: ' + (totalPrice - existingDepositsSum).toFixed(2) + ' PLN'
      );
    }

    if (amount <= 0) {
      throw AppError.badRequest('Kwota zaliczki musi byc wieksza od 0');
    }

    // dueDate must be YYYY-MM-DD format, max 10 chars (DB column is varchar(10))
    const dueDateStr = dueDate.substring(0, 10); // ensure max 10 chars

    // Raw SQL matching actual DB schema:
    // - dueDate is varchar(10), NOT timestamp
    // - paidAmount is numeric(10,2) NOT NULL with default 0
    // - remainingAmount is numeric(10,2) NOT NULL
    // - status is varchar(20) with default 'PENDING'
    const result: any[] = await prisma.$queryRawUnsafe(
      `INSERT INTO "Deposit" (
        id, "reservationId", amount, "remainingAmount", "paidAmount",
        "dueDate", status, paid, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2, $3, 0,
        $4, 'PENDING', false, NOW(), NOW()
      ) RETURNING id::text as id`,
      reservationId,
      amount,
      amount,
      dueDateStr
    );

    const newId = result[0].id;

    const deposit = await prisma.deposit.findUnique({
      where: { id: newId },
      include: DEPOSIT_INCLUDE,
    });

    return deposit;
  },

  /**
   * Get single deposit by ID
   */
  async getById(id: string) {
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

    if (!deposit) {
      throw AppError.notFound('Deposit');
    }

    return deposit;
  },

  /**
   * Get deposits for a specific reservation
   */
  async getByReservation(reservationId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw AppError.notFound('Reservation');
    }

    const deposits = await prisma.deposit.findMany({
      where: { reservationId },
      orderBy: { dueDate: 'asc' },
      include: {
        reservation: {
          include: { client: true },
        },
      },
    });

    const totalAmount = deposits
      .filter((d: any) => d.status !== 'CANCELLED')
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    const paidAmount = deposits
      .filter((d: any) => d.paid)
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    const pendingAmount = totalAmount - paidAmount;
    const reservationTotal = Number(reservation.totalPrice);

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

  /**
   * List all deposits with filters
   */
  async list(filters: DepositFilters) {
    const {
      reservationId,
      status,
      overdue,
      dateFrom,
      dateTo,
      paid,
      search,
      page = 1,
      limit = 20,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = filters;

    const where: Prisma.DepositWhereInput = {};

    if (reservationId) where.reservationId = reservationId;
    if (status) where.status = { equals: status };
    if (paid !== undefined) where.paid = paid;

    if (overdue) {
      where.status = { equals: 'PENDING' };
      // dueDate is varchar(10) in DB, compare as string (YYYY-MM-DD format sorts correctly)
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
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: DEPOSIT_INCLUDE,
      }),
      prisma.deposit.count({ where }),
    ]);

    return {
      deposits,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + deposits.length < totalCount,
      },
    };
  },

  /**
   * Update deposit (amount, dueDate)
   */
  async update(id: string, input: UpdateDepositInput) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });

    if (!deposit) throw AppError.notFound('Deposit');

    if (deposit.paid) {
      throw AppError.badRequest(
        'Nie mozna edytowac oplaconej zaliczki. Najpierw cofnij oznaczenie platnosci.'
      );
    }

    if (input.amount !== undefined) {
      if (input.amount <= 0) {
        throw AppError.badRequest('Kwota zaliczki musi byc wieksza od 0');
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id: deposit.reservationId },
        include: { deposits: true },
      });

      if (reservation) {
        const otherDepositsSum = reservation.deposits
          .filter((d: any) => d.id !== id && d.status !== 'CANCELLED')
          .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

        const totalPrice = Number(reservation.totalPrice);

        if (otherDepositsSum + input.amount > totalPrice) {
          throw AppError.badRequest(
            'Suma zaliczek (' + (otherDepositsSum + input.amount) + ' PLN) przekracza cene rezerwacji (' + totalPrice + ' PLN).'
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

    return updated;
  },

  /**
   * Delete a deposit
   */
  async delete(id: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });

    if (!deposit) throw AppError.notFound('Deposit');

    if (deposit.paid) {
      throw AppError.badRequest(
        'Nie mozna usunac oplaconej zaliczki. Najpierw cofnij oznaczenie platnosci.'
      );
    }

    await prisma.$queryRawUnsafe(
      `DELETE FROM "Deposit" WHERE id = $1::uuid`,
      id
    );

    return { success: true, message: 'Zaliczka zostala usunieta' };
  },

  /**
   * Mark deposit as paid
   * 1. Update DB status
   * 2. Generate PDF confirmation
   * 3. Send email with PDF attachment
   */
  async markAsPaid(id: string, input: MarkPaidInput) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });

    if (!deposit) throw AppError.notFound('Deposit');

    if (deposit.paid) {
      throw AppError.badRequest('Ta zaliczka jest juz oznaczona jako oplacona');
    }

    const amountPaid = input.amountPaid || Number(deposit.amount);
    const remaining = Number(deposit.amount) - amountPaid;
    const isPaid = remaining <= 0;
    const newStatus = isPaid ? 'PAID' : 'PARTIALLY_PAID';
    const remainingAmount = Math.max(0, remaining);

    // Update database
    await prisma.$queryRawUnsafe(
      `UPDATE "Deposit" SET paid = $1, status = $2, "paidAt" = $3::timestamp, "paymentMethod" = $4, "remainingAmount" = $5, "paidAmount" = $6, "updatedAt" = NOW() WHERE id = $7::uuid`,
      isPaid, newStatus, input.paidAt, input.paymentMethod, remainingAmount, amountPaid, id
    );

    const updated = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

    if (!updated) {
      throw AppError.notFound('Updated deposit');
    }

    // Generate PDF confirmation
    try {
      const pdfBuffer = await pdfService.generateDepositConfirmation({
        depositId: updated.id,
        clientName: `${updated.reservation.client.firstName} ${updated.reservation.client.lastName}`,
        depositAmount: Number(updated.amount).toFixed(2),
        paidAt: new Date(input.paidAt).toLocaleDateString('pl-PL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        paymentMethod: input.paymentMethod,
        reservationDate: new Date(updated.reservation.eventDate).toLocaleDateString('pl-PL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        }),
        hallName: updated.reservation.hall.name,
        eventType: updated.reservation.eventType.name,
      });

      logger.info(`[Deposit] PDF confirmation generated for deposit ${id}`);

      // Send email with PDF attachment
      const clientEmail = updated.reservation.client.email;
      if (clientEmail) {
        await emailService.sendDepositPaidConfirmation(
          clientEmail,
          {
            clientName: `${updated.reservation.client.firstName} ${updated.reservation.client.lastName}`,
            depositAmount: `${Number(updated.amount).toFixed(2)} zł`,
            paidAt: new Date(input.paidAt).toLocaleDateString('pl-PL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            paymentMethod: input.paymentMethod,
            reservationDate: new Date(updated.reservation.eventDate).toLocaleDateString('pl-PL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            hallName: updated.reservation.hall.name,
            eventType: updated.reservation.eventType.name,
          },
          pdfBuffer
        );

        logger.info(`[Deposit] Email confirmation sent to ${clientEmail}`);
      } else {
        logger.warn(`[Deposit] No client email found for deposit ${id} — skipping email`);
      }
    } catch (error: any) {
      logger.error(`[Deposit] Failed to generate PDF or send email: ${error.message}`);
      // Don't fail the entire operation if PDF/email fails
    }

    return updated;
  },

  /**
   * Mark deposit as unpaid (revert payment)
   */
  async markAsUnpaid(id: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });

    if (!deposit) throw AppError.notFound('Deposit');

    if (!deposit.paid && deposit.status === 'PENDING') {
      throw AppError.badRequest('Ta zaliczka nie jest oznaczona jako oplacona');
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

    return updated;
  },

  /**
   * Cancel a deposit
   */
  async cancel(id: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });

    if (!deposit) throw AppError.notFound('Deposit');

    if (deposit.paid) {
      throw AppError.badRequest(
        'Nie mozna anulowac oplaconej zaliczki. Najpierw cofnij platnosc.'
      );
    }

    await prisma.$queryRawUnsafe(
      `UPDATE "Deposit" SET status = 'CANCELLED', "remainingAmount" = 0, "updatedAt" = NOW() WHERE id = $1::uuid`,
      id
    );

    const updated = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

    return updated;
  },

  /**
   * Get global deposit statistics
   */
  async getStats() {
    const todayStr = new Date().toISOString().substring(0, 10);

    // Use raw SQL for stats to avoid Prisma schema mismatch issues
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

  /**
   * Get overdue deposits
   */
  async getOverdue() {
    const todayStr = new Date().toISOString().substring(0, 10);

    // dueDate is varchar(10) in YYYY-MM-DD format, string comparison works
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

  /**
   * Auto-mark overdue deposits (called by cron)
   */
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

    return {
      markedOverdueCount: Number(result[0]?.count || 0),
    };
  },
};

/** Helper: get date string YYYY-MM-DD for today + N days */
function getDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

export default depositService;
