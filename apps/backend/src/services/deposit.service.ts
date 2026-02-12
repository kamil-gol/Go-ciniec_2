/**
 * Deposit Service
 * Full CRUD + business logic for deposit/advance payment management
 */

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';

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

/** Standard include for deposit queries */
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
      .filter(d => d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + Number(d.amount), 0);

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

    // Create deposit - use plain values, let DB handle defaults for status/paid
    const created = await prisma.deposit.create({
      data: {
        reservation: { connect: { id: reservationId } },
        amount: amount,
        remainingAmount: amount,
        dueDate: new Date(dueDate),
      },
    });

    // Fetch with full relations separately to avoid null byte in composite query
    const deposit = await prisma.deposit.findUnique({
      where: { id: created.id },
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
      .filter(d => d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + Number(d.amount), 0);
    const paidAmount = deposits
      .filter(d => d.paid)
      .reduce((sum, d) => sum + Number(d.amount), 0);
    const pendingAmount = totalAmount - paidAmount;
    const reservationTotal = Number(reservation.totalPrice);

    return {
      deposits,
      summary: {
        totalDeposits: deposits.length,
        activeDeposits: deposits.filter(d => d.status !== 'CANCELLED').length,
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
      where.dueDate = { lt: new Date() };
    }

    if (dateFrom || dateTo) {
      where.dueDate = {
        ...(where.dueDate as any || {}),
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
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
   * Update deposit (amount, dueDate, notes)
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
          .filter(d => d.id !== id && d.status !== 'CANCELLED')
          .reduce((sum, d) => sum + Number(d.amount), 0);

        const totalPrice = Number(reservation.totalPrice);

        if (otherDepositsSum + input.amount > totalPrice) {
          throw AppError.badRequest(
            'Suma zaliczek (' + (otherDepositsSum + input.amount) + ' PLN) przekracza cene rezerwacji (' + totalPrice + ' PLN).'
          );
        }
      }
    }

    // Build update data with plain values
    const updateData: any = {};
    if (input.amount !== undefined) {
      updateData.amount = input.amount;
      updateData.remainingAmount = input.amount;
    }
    if (input.dueDate) {
      updateData.dueDate = new Date(input.dueDate);
    }

    await prisma.deposit.update({
      where: { id },
      data: updateData,
    });

    // Fetch with relations separately
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

    await prisma.deposit.delete({ where: { id } });

    return { success: true, message: 'Zaliczka zostala usunieta' };
  },

  /**
   * Mark deposit as paid
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

    await prisma.deposit.update({
      where: { id },
      data: {
        paid: isPaid,
        status: newStatus,
        paidAt: new Date(input.paidAt),
        paymentMethod: input.paymentMethod,
        remainingAmount: Math.max(0, remaining),
      },
    });

    const updated = await prisma.deposit.findUnique({
      where: { id },
      include: DEPOSIT_INCLUDE,
    });

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

    await prisma.deposit.update({
      where: { id },
      data: {
        paid: false,
        status: 'PENDING',
        paidAt: null,
        paymentMethod: null,
        remainingAmount: Number(deposit.amount),
      },
    });

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

    await prisma.deposit.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        remainingAmount: 0,
      },
    });

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
    const now = new Date();

    const allDeposits = await prisma.deposit.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
      },
      select: { amount: true, remainingAmount: true, status: true, paid: true, dueDate: true },
    });

    const pending = allDeposits.filter(d => d.status === 'PENDING').length;
    const paid = allDeposits.filter(d => d.status === 'PAID').length;
    const overdue = allDeposits.filter(d => d.status === 'PENDING' && d.dueDate < now).length;
    const partiallyPaid = allDeposits.filter(d => d.status === 'PARTIALLY_PAID').length;

    const cancelledCount = await prisma.deposit.count({
      where: { status: { equals: 'CANCELLED' } },
    });

    const totalAmount = allDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
    const paidAmount = allDeposits.filter(d => d.paid).reduce((sum, d) => sum + Number(d.amount), 0);
    const pendingAmount = totalAmount - paidAmount;
    const overdueAmount = allDeposits
      .filter(d => d.status === 'PENDING' && d.dueDate < now)
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingCount = allDeposits.filter(
      d => d.status === 'PENDING' && d.dueDate >= now && d.dueDate <= nextWeek
    ).length;

    return {
      counts: {
        total: allDeposits.length,
        pending,
        paid,
        overdue,
        partiallyPaid,
        cancelled: cancelledCount,
        upcomingIn7Days: upcomingCount,
      },
      amounts: {
        total: Number(totalAmount.toFixed(2)),
        paid: Number(paidAmount.toFixed(2)),
        pending: Number(pendingAmount.toFixed(2)),
        overdue: Number(overdueAmount.toFixed(2)),
      },
    };
  },

  /**
   * Get overdue deposits
   */
  async getOverdue() {
    const now = new Date();

    const deposits = await prisma.deposit.findMany({
      where: {
        status: { equals: 'PENDING' },
        dueDate: { lt: now },
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
    const now = new Date();

    const result = await prisma.deposit.updateMany({
      where: {
        status: { equals: 'PENDING' },
        paid: false,
        dueDate: { lt: now },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    return {
      markedOverdueCount: result.count,
    };
  },
};

export default depositService;
