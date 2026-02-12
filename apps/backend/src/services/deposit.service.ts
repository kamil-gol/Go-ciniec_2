/**
 * Deposit Service
 * Full CRUD + business logic for deposit/advance payment management
 */

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type DepositStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'BLIK' | 'CARD';

export interface CreateDepositInput {
  reservationId: string;
  amount: number;
  dueDate: string; // ISO date
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
  paidAt: string; // ISO date
  amountPaid?: number; // for partial payments
  notes?: string;
}

export interface DepositFilters {
  reservationId?: string;
  status?: DepositStatus;
  overdue?: boolean;
  dateFrom?: string;
  dateTo?: string;
  paid?: boolean;
  search?: string; // search by client name
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'amount' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ═══════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════

const depositService = {
  /**
   * Create a new deposit for a reservation
   */
  async create(input: CreateDepositInput) {
    const { reservationId, amount, dueDate, notes } = input;

    // 1. Verify reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { deposits: true, client: true },
    });

    if (!reservation) {
      throw AppError.notFound('Reservation');
    }

    // 2. Validate: sum of deposits cannot exceed totalPrice
    const existingDepositsSum = reservation.deposits
      .filter(d => d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalPrice = Number(reservation.totalPrice);

    if (existingDepositsSum + amount > totalPrice) {
      throw AppError.badRequest(
        `Suma zaliczek (${existingDepositsSum + amount} PLN) przekracza całkowitą cenę rezerwacji (${totalPrice} PLN). ` +
        `Dostępne do zaliczki: ${(totalPrice - existingDepositsSum).toFixed(2)} PLN`
      );
    }

    if (amount <= 0) {
      throw AppError.badRequest('Kwota zaliczki musi być większa od 0');
    }

    // 3. Create deposit
    const deposit = await prisma.deposit.create({
      data: {
        reservationId,
        amount: new Prisma.Decimal(amount),
        remainingAmount: new Prisma.Decimal(amount),
        dueDate: new Date(dueDate),
        status: 'PENDING',
        paid: false,
      },
      include: {
        reservation: {
          include: { client: true },
        },
      },
    });

    return deposit;
  },

  /**
   * Get single deposit by ID
   */
  async getById(id: string) {
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            client: true,
            hall: true,
            eventType: true,
          },
        },
      },
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
    // Verify reservation exists
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

    // Calculate summary
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
    if (status) where.status = status;
    if (paid !== undefined) where.paid = paid;

    // Overdue filter: PENDING + dueDate < now
    if (overdue) {
      where.status = 'PENDING';
      where.dueDate = { lt: new Date() };
    }

    // Date range filter on dueDate
    if (dateFrom || dateTo) {
      where.dueDate = {
        ...(where.dueDate as any || {}),
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    // Search by client name
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
        include: {
          reservation: {
            include: {
              client: true,
              hall: true,
              eventType: true,
            },
          },
        },
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
   * Cannot update a PAID deposit
   */
  async update(id: string, input: UpdateDepositInput) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });

    if (!deposit) throw AppError.notFound('Deposit');

    if (deposit.paid) {
      throw AppError.badRequest(
        'Nie można edytować opłaconej zaliczki. Najpierw cofnij oznaczenie płatności.'
      );
    }

    // If amount changed, validate against reservation total
    if (input.amount !== undefined) {
      if (input.amount <= 0) {
        throw AppError.badRequest('Kwota zaliczki musi być większa od 0');
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
            `Suma zaliczek (${otherDepositsSum + input.amount} PLN) przekracza cenę rezerwacji (${totalPrice} PLN).`
          );
        }
      }
    }

    const updateData: Prisma.DepositUpdateInput = {};
    if (input.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(input.amount);
      updateData.remainingAmount = new Prisma.Decimal(input.amount);
    }
    if (input.dueDate) {
      updateData.dueDate = new Date(input.dueDate);
    }

    const updated = await prisma.deposit.update({
      where: { id },
      data: updateData,
      include: {
        reservation: {
          include: { client: true },
        },
      },
    });

    return updated;
  },

  /**
   * Delete a deposit
   * Cannot delete a PAID deposit
   */
  async delete(id: string) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });

    if (!deposit) throw AppError.notFound('Deposit');

    if (deposit.paid) {
      throw AppError.badRequest(
        'Nie można usunąć opłaconej zaliczki. Najpierw cofnij oznaczenie płatności.'
      );
    }

    await prisma.deposit.delete({ where: { id } });

    return { success: true, message: 'Zaliczka została usunięta' };
  },

  /**
   * Mark deposit as paid
   */
  async markAsPaid(id: string, input: MarkPaidInput) {
    const deposit = await prisma.deposit.findUnique({ where: { id } });

    if (!deposit) throw AppError.notFound('Deposit');

    if (deposit.paid) {
      throw AppError.badRequest('Ta zaliczka jest już oznaczona jako opłacona');
    }

    const amountPaid = input.amountPaid || Number(deposit.amount);
    const remaining = Number(deposit.amount) - amountPaid;

    let newStatus: string;
    let isPaid: boolean;

    if (remaining <= 0) {
      newStatus = 'PAID';
      isPaid = true;
    } else {
      newStatus = 'PARTIALLY_PAID';
      isPaid = false;
    }

    const updated = await prisma.deposit.update({
      where: { id },
      data: {
        paid: isPaid,
        status: newStatus,
        paidAt: new Date(input.paidAt),
        paymentMethod: input.paymentMethod,
        remainingAmount: new Prisma.Decimal(Math.max(0, remaining)),
      },
      include: {
        reservation: {
          include: { client: true },
        },
      },
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
      throw AppError.badRequest('Ta zaliczka nie jest oznaczona jako opłacona');
    }

    const updated = await prisma.deposit.update({
      where: { id },
      data: {
        paid: false,
        status: 'PENDING',
        paidAt: null,
        paymentMethod: null,
        remainingAmount: deposit.amount,
      },
      include: {
        reservation: {
          include: { client: true },
        },
      },
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
        'Nie można anulować opłaconej zaliczki. Najpierw cofnij płatność.'
      );
    }

    const updated = await prisma.deposit.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        remainingAmount: new Prisma.Decimal(0),
      },
      include: {
        reservation: {
          include: { client: true },
        },
      },
    });

    return updated;
  },

  /**
   * Get global deposit statistics
   */
  async getStats() {
    const now = new Date();

    const [all, pending, paid, overdue, cancelled] = await Promise.all([
      prisma.deposit.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { amount: true, remainingAmount: true, status: true, paid: true },
      }),
      prisma.deposit.count({ where: { status: 'PENDING' } }),
      prisma.deposit.count({ where: { status: 'PAID' } }),
      prisma.deposit.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: now },
        },
      }),
      prisma.deposit.count({ where: { status: 'CANCELLED' } }),
    ]);

    const totalAmount = all.reduce((sum, d) => sum + Number(d.amount), 0);
    const paidAmount = all.filter(d => d.paid).reduce((sum, d) => sum + Number(d.amount), 0);
    const pendingAmount = totalAmount - paidAmount;

    // Overdue amount
    const overdueDeposits = await prisma.deposit.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
      },
      select: { amount: true },
    });
    const overdueAmount = overdueDeposits.reduce((sum, d) => sum + Number(d.amount), 0);

    // Upcoming in 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingCount = await prisma.deposit.count({
      where: {
        status: 'PENDING',
        dueDate: { gte: now, lte: nextWeek },
      },
    });

    return {
      counts: {
        total: all.length,
        pending,
        paid,
        overdue,
        cancelled,
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
        status: 'PENDING',
        dueDate: { lt: now },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        reservation: {
          include: {
            client: true,
            hall: true,
            eventType: true,
          },
        },
      },
    });

    return deposits;
  },

  /**
   * Auto-mark overdue deposits (called by cron)
   * Changes PENDING → OVERDUE if dueDate has passed
   */
  async autoMarkOverdue() {
    const now = new Date();

    const result = await prisma.deposit.updateMany({
      where: {
        status: 'PENDING',
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
