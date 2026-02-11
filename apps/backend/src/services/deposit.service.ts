import { PrismaClient, Decimal } from '@prisma/client';
import {
  DepositStatus,
  PaymentMethod,
  CreateDepositRequest,
  UpdateDepositRequest,
  MarkDepositPaidRequest,
  AddDepositPaymentRequest,
  DepositWithRelations,
  DepositListResponse,
  DepositStatistics,
  DepositQueryFilters,
} from '../types/deposit.types';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate deposit status based on current state
 */
function calculateDepositStatus(deposit: {
  paid: boolean;
  dueDate: string;
  paidAmount: Decimal;
  amount: Decimal;
}): DepositStatus {
  if (deposit.paid) {
    return DepositStatus.PAID;
  }

  const paidAmountNum = Number(deposit.paidAmount);
  const totalAmountNum = Number(deposit.amount);

  if (paidAmountNum > 0 && paidAmountNum < totalAmountNum) {
    return DepositStatus.PARTIAL;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(deposit.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate < today) {
    return DepositStatus.OVERDUE;
  }

  return DepositStatus.PENDING;
}

/**
 * Generate unique receipt number
 */
async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ZAL-${year}-`;

  // Find last receipt number for this year
  const lastDeposit = await prisma.deposit.findFirst({
    where: {
      receiptNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      receiptNumber: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastDeposit?.receiptNumber) {
    const lastNumber = parseInt(lastDeposit.receiptNumber.split('-')[2]);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create new deposit
 */
export async function createDeposit(
  data: CreateDepositRequest
): Promise<DepositWithRelations> {
  // Verify reservation exists
  const reservation = await prisma.reservation.findUnique({
    where: { id: data.reservationId },
  });

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  // Validate amount
  if (data.amount <= 0) {
    throw new Error('Deposit amount must be greater than 0');
  }

  const totalReservationPrice = Number(reservation.totalPrice);
  if (data.amount > totalReservationPrice) {
    throw new Error(
      `Deposit amount (${data.amount}) cannot exceed total reservation price (${totalReservationPrice})`
    );
  }

  const deposit = await prisma.deposit.create({
    data: {
      reservationId: data.reservationId,
      amount: new Decimal(data.amount),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(data.amount),
      dueDate: data.dueDate,
      status: DepositStatus.PENDING,
      title: data.title,
      description: data.description,
      internalNotes: data.internalNotes,
    },
    include: {
      reservation: {
        include: {
          client: true,
          hall: true,
          eventType: true,
        },
      },
      paymentHistory: true,
    },
  });

  return deposit as DepositWithRelations;
}

/**
 * Get deposit by ID
 */
export async function getDepositById(
  id: string
): Promise<DepositWithRelations | null> {
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
      paymentHistory: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
  });

  if (!deposit) {
    return null;
  }

  // Update status if needed
  const calculatedStatus = calculateDepositStatus(deposit);
  if (deposit.status !== calculatedStatus) {
    await prisma.deposit.update({
      where: { id },
      data: { status: calculatedStatus },
    });
    deposit.status = calculatedStatus;
  }

  return deposit as DepositWithRelations;
}

/**
 * List deposits with filters and pagination
 */
export async function listDeposits(
  filters: DepositQueryFilters = {}
): Promise<DepositListResponse> {
  const page = filters.page || 1;
  const perPage = filters.perPage || 20;
  const skip = (page - 1) * perPage;

  // Build where clause
  const where: any = {};

  if (filters.reservationId) {
    where.reservationId = filters.reservationId;
  }

  if (filters.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status;
  }

  if (filters.paid !== undefined) {
    where.paid = filters.paid;
  }

  if (filters.dueDateFrom || filters.dueDateTo) {
    where.dueDate = {};
    if (filters.dueDateFrom) {
      where.dueDate.gte = filters.dueDateFrom;
    }
    if (filters.dueDateTo) {
      where.dueDate.lte = filters.dueDateTo;
    }
  }

  if (filters.overdueOnly) {
    const today = new Date().toISOString().split('T')[0];
    where.dueDate = { lt: today };
    where.paid = false;
  }

  if (filters.upcomingOnly) {
    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    where.dueDate = {
      gte: today.toISOString().split('T')[0],
      lte: in7Days.toISOString().split('T')[0],
    };
    where.paid = false;
  }

  if (filters.search) {
    where.OR = [
      {
        receiptNumber: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        reservation: {
          client: {
            OR: [
              {
                firstName: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      },
    ];
  }

  // Build orderBy
  const orderBy: any = {};
  const sortBy = filters.sortBy || 'dueDate';
  const sortOrder = filters.sortOrder || 'asc';
  orderBy[sortBy] = sortOrder;

  const [deposits, total] = await Promise.all([
    prisma.deposit.findMany({
      where,
      include: {
        reservation: {
          include: {
            client: true,
            hall: true,
            eventType: true,
          },
        },
        paymentHistory: true,
      },
      orderBy,
      skip,
      take: perPage,
    }),
    prisma.deposit.count({ where }),
  ]);

  return {
    deposits: deposits as DepositWithRelations[],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/**
 * Update deposit
 */
export async function updateDeposit(
  id: string,
  data: UpdateDepositRequest
): Promise<DepositWithRelations> {
  const existing = await prisma.deposit.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Deposit not found');
  }

  const updateData: any = {};

  if (data.amount !== undefined) {
    updateData.amount = new Decimal(data.amount);
    // Recalculate remaining amount
    const paidAmount = Number(existing.paidAmount);
    updateData.remainingAmount = new Decimal(data.amount - paidAmount);
  }

  if (data.dueDate) updateData.dueDate = data.dueDate;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status) updateData.status = data.status;
  if (data.internalNotes !== undefined)
    updateData.internalNotes = data.internalNotes;

  const updated = await prisma.deposit.update({
    where: { id },
    data: updateData,
    include: {
      reservation: {
        include: {
          client: true,
          hall: true,
          eventType: true,
        },
      },
      paymentHistory: true,
    },
  });

  return updated as DepositWithRelations;
}

/**
 * Delete deposit
 */
export async function deleteDeposit(id: string): Promise<void> {
  await prisma.deposit.delete({
    where: { id },
  });
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Mark deposit as paid (full payment)
 */
export async function markDepositPaid(
  id: string,
  data: MarkDepositPaidRequest
): Promise<DepositWithRelations> {
  const deposit = await prisma.deposit.findUnique({
    where: { id },
  });

  if (!deposit) {
    throw new Error('Deposit not found');
  }

  if (deposit.paid) {
    throw new Error('Deposit is already marked as paid');
  }

  const paymentAmount = data.amount || Number(deposit.remainingAmount);
  const newPaidAmount = Number(deposit.paidAmount) + paymentAmount;
  const totalAmount = Number(deposit.amount);
  const newRemainingAmount = totalAmount - newPaidAmount;

  const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();
  const isPaid = newRemainingAmount <= 0.01; // Allow small rounding errors

  // Generate receipt number if not provided
  let receiptNumber = data.receiptNumber;
  if (!receiptNumber && isPaid) {
    receiptNumber = await generateReceiptNumber();
  }

  // Start transaction
  const [updated] = await prisma.$transaction([
    prisma.deposit.update({
      where: { id },
      data: {
        paidAmount: new Decimal(newPaidAmount),
        remainingAmount: new Decimal(Math.max(0, newRemainingAmount)),
        paid: isPaid,
        paidAt: isPaid ? paidAt : null,
        paymentMethod: data.paymentMethod,
        status: isPaid ? DepositStatus.PAID : DepositStatus.PARTIAL,
        receiptNumber: receiptNumber || deposit.receiptNumber,
      },
      include: {
        reservation: {
          include: {
            client: true,
            hall: true,
            eventType: true,
          },
        },
        paymentHistory: true,
      },
    }),
    // Add payment to history
    prisma.depositPayment.create({
      data: {
        depositId: id,
        amount: new Decimal(paymentAmount),
        paymentMethod: data.paymentMethod,
        paymentDate: paidAt,
        notes: data.notes,
        receiptNumber,
      },
    }),
  ]);

  return updated as DepositWithRelations;
}

/**
 * Add partial payment to deposit
 */
export async function addDepositPayment(
  id: string,
  data: AddDepositPaymentRequest
): Promise<DepositWithRelations> {
  const deposit = await prisma.deposit.findUnique({
    where: { id },
  });

  if (!deposit) {
    throw new Error('Deposit not found');
  }

  if (deposit.paid) {
    throw new Error('Deposit is already fully paid');
  }

  const remainingAmount = Number(deposit.remainingAmount);
  if (data.amount > remainingAmount) {
    throw new Error(
      `Payment amount (${data.amount}) exceeds remaining amount (${remainingAmount})`
    );
  }

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
  const newPaidAmount = Number(deposit.paidAmount) + data.amount;
  const newRemainingAmount = Number(deposit.amount) - newPaidAmount;
  const isPaid = newRemainingAmount <= 0.01;

  // Generate receipt number if fully paid
  let receiptNumber = data.receiptNumber;
  if (!receiptNumber && isPaid) {
    receiptNumber = await generateReceiptNumber();
  }

  const [updated] = await prisma.$transaction([
    prisma.deposit.update({
      where: { id },
      data: {
        paidAmount: new Decimal(newPaidAmount),
        remainingAmount: new Decimal(Math.max(0, newRemainingAmount)),
        paid: isPaid,
        paidAt: isPaid ? paymentDate : deposit.paidAt,
        status: isPaid ? DepositStatus.PAID : DepositStatus.PARTIAL,
        receiptNumber: receiptNumber || deposit.receiptNumber,
      },
      include: {
        reservation: {
          include: {
            client: true,
            hall: true,
            eventType: true,
          },
        },
        paymentHistory: true,
      },
    }),
    prisma.depositPayment.create({
      data: {
        depositId: id,
        amount: new Decimal(data.amount),
        paymentMethod: data.paymentMethod,
        paymentDate,
        notes: data.notes,
        receiptNumber,
      },
    }),
  ]);

  return updated as DepositWithRelations;
}

// ═══════════════════════════════════════════════════════════════
// STATISTICS & REMINDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get deposit statistics
 */
export async function getDepositStatistics(): Promise<DepositStatistics> {
  const today = new Date();
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const todayStr = today.toISOString().split('T')[0];
  const in7DaysStr = in7Days.toISOString().split('T')[0];

  const [totalStats, pendingCount, paidCount, overdueCount, partialCount, upcomingCount] =
    await Promise.all([
      prisma.deposit.aggregate({
        _sum: {
          amount: true,
          paidAmount: true,
          remainingAmount: true,
        },
        _count: true,
      }),
      prisma.deposit.count({
        where: { status: DepositStatus.PENDING },
      }),
      prisma.deposit.count({
        where: { status: DepositStatus.PAID },
      }),
      prisma.deposit.count({
        where: { status: DepositStatus.OVERDUE },
      }),
      prisma.deposit.count({
        where: { status: DepositStatus.PARTIAL },
      }),
      prisma.deposit.count({
        where: {
          dueDate: {
            gte: todayStr,
            lte: in7DaysStr,
          },
          paid: false,
        },
      }),
    ]);

  return {
    totalDeposits: totalStats._count,
    totalAmount: Number(totalStats._sum.amount || 0),
    totalPaid: Number(totalStats._sum.paidAmount || 0),
    totalRemaining: Number(totalStats._sum.remainingAmount || 0),
    pendingCount,
    paidCount,
    overdueCount,
    partialCount,
    upcomingDueCount: upcomingCount,
  };
}

/**
 * Get deposits requiring reminders
 */
export async function getDepositsForReminders(): Promise<DepositWithRelations[]> {
  const today = new Date();
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const todayStr = today.toISOString().split('T')[0];
  const in7DaysStr = in7Days.toISOString().split('T')[0];

  // Get deposits due in next 7 days or overdue
  const deposits = await prisma.deposit.findMany({
    where: {
      paid: false,
      OR: [
        // Overdue
        {
          dueDate: { lt: todayStr },
        },
        // Due soon (next 7 days)
        {
          dueDate: {
            gte: todayStr,
            lte: in7DaysStr,
          },
        },
      ],
    },
    include: {
      reservation: {
        include: {
          client: true,
          hall: true,
          eventType: true,
        },
      },
      paymentHistory: true,
    },
    orderBy: {
      dueDate: 'asc',
    },
  });

  return deposits as DepositWithRelations[];
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(id: string): Promise<void> {
  await prisma.deposit.update({
    where: { id },
    data: {
      reminderSentAt: new Date(),
    },
  });
}
