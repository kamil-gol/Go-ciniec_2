/**
 * Unit tests for deposit.service.ts
 * Covers: create, getById, getByReservation, list, update, delete,
 *         markAsPaid, checkAndAutoConfirmReservation, checkPaidDepositsBeforeCancel,
 *         sendConfirmationEmail, markAsUnpaid, cancel, getStats, getOverdue, autoMarkOverdue
 * Issue: #97
 */

// ── Mocks ────────────────────────────────────────────
const mockPrisma = {
  reservation: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  deposit: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  reservationHistory: {
    create: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
};

const mockPdfService = {
  generatePaymentConfirmationPDF: jest.fn(),
};

const mockEmailService = {
  sendDepositPaidConfirmation: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@utils/AppError', () => ({
  AppError: {
    notFound: (msg: string) => { const e = new Error(`${msg} nie znaleziono`); (e as any).statusCode = 404; return e; },
    badRequest: (msg: string) => { const e = new Error(msg); (e as any).statusCode = 400; return e; },
    conflict: (msg: string) => { const e = new Error(msg); (e as any).statusCode = 409; return e; },
  },
}));
jest.mock('@utils/audit-logger', () => ({ logChange: jest.fn() }));
jest.mock('@utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));
jest.mock('@services/pdf.service', () => ({ pdfService: mockPdfService }));
jest.mock('@services/email.service', () => ({
  __esModule: true,
  default: mockEmailService,
}));

import depositService from '@services/deposit.service';
import { logChange } from '@utils/audit-logger';

// ── Fixtures ─────────────────────────────────────────
const mockClient = {
  id: 'client-1',
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan@test.pl',
  phone: '+48 123 456 789',
};

const mockHall = { id: 'hall-1', name: 'Sala Główna' };
const mockEventType = { id: 'evt-1', name: 'Wesele' };

const mockReservation = {
  id: 'res-1',
  totalPrice: 10000,
  status: 'PENDING',
  date: '2026-06-15',
  startTime: '14:00',
  endTime: '23:00',
  guests: 100,
  client: mockClient,
  hall: mockHall,
  eventType: mockEventType,
  deposits: [],
};

const mockDeposit = {
  id: 'dep-1',
  reservationId: 'res-1',
  amount: 2000,
  remainingAmount: 2000,
  paidAmount: 0,
  dueDate: '2026-05-01',
  status: 'PENDING',
  paid: false,
  paidAt: null,
  paymentMethod: null,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
  reservation: { ...mockReservation, client: mockClient, hall: mockHall, eventType: mockEventType },
};

const mockPaidDeposit = {
  ...mockDeposit,
  id: 'dep-paid',
  status: 'PAID',
  paid: true,
  paidAt: '2026-04-20T12:00:00Z',
  paymentMethod: 'TRANSFER',
  remainingAmount: 0,
  paidAmount: 2000,
};

const userId = 'user-1';

describe('DepositService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════ create ═══════════════
  describe('create', () => {
    const createInput = {
      reservationId: 'res-1',
      amount: 2000,
      dueDate: '2026-05-01',
    };

    it('should create deposit and log activity', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 'new-dep-1' }]);
      mockPrisma.deposit.findUnique.mockResolvedValue({ ...mockDeposit, id: 'new-dep-1' });

      const result = await depositService.create(createInput, userId);

      expect(result!.id).toBe('new-dep-1');
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO "Deposit"'),
        'res-1', 2000, 2000, '2026-05-01'
      );
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'DEPOSIT' })
      );
    });

    it('should throw 404 when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(depositService.create(createInput, userId))
        .rejects.toThrow(/nie znaleziono/);
    });

    it('should throw when deposit sum exceeds reservation totalPrice', async () => {
      const resWithDeposits = {
        ...mockReservation,
        deposits: [{ status: 'PENDING', amount: 9000 }],
      };
      mockPrisma.reservation.findUnique.mockResolvedValue(resWithDeposits);

      await expect(depositService.create(createInput, userId))
        .rejects.toThrow(/przekracza/);
    });

    it('should throw when amount is 0 or negative', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);

      await expect(depositService.create({ ...createInput, amount: 0 }, userId))
        .rejects.toThrow(/większa od 0/);

      await expect(depositService.create({ ...createInput, amount: -100 }, userId))
        .rejects.toThrow(/większa od 0/);
    });

    it('should exclude CANCELLED deposits from sum calculation', async () => {
      const resWithCancelled = {
        ...mockReservation,
        deposits: [{ status: 'CANCELLED', amount: 9000 }],
      };
      mockPrisma.reservation.findUnique.mockResolvedValue(resWithCancelled);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 'new-dep-2' }]);
      mockPrisma.deposit.findUnique.mockResolvedValue({ ...mockDeposit, id: 'new-dep-2' });

      const result = await depositService.create(createInput, userId);
      expect(result!.id).toBe('new-dep-2');
    });
  });

  // ═══════════════ getById ═══════════════
  describe('getById', () => {
    it('should return deposit with reservation data', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockDeposit);

      const result = await depositService.getById('dep-1');

      expect(result.id).toBe('dep-1');
      expect(result.reservation.client).toBeDefined();
    });

    it('should throw 404 when deposit not found', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(null);

      await expect(depositService.getById('nonexistent'))
        .rejects.toThrow(/nie znaleziono/);
    });
  });

  // ═══════════════ getByReservation ═══════════════
  describe('getByReservation', () => {
    it('should return deposits with correct summary', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      const deposits = [
        { ...mockDeposit, amount: 3000, status: 'PAID', paid: true },
        { ...mockDeposit, id: 'dep-2', amount: 2000, status: 'PENDING', paid: false },
        { ...mockDeposit, id: 'dep-3', amount: 1000, status: 'CANCELLED', paid: false },
      ];
      mockPrisma.deposit.findMany.mockResolvedValue(deposits);

      const result = await depositService.getByReservation('res-1');

      expect(result.deposits).toHaveLength(3);
      expect(result.summary.totalAmount).toBe(5000);
      expect(result.summary.paidAmount).toBe(3000);
      expect(result.summary.pendingAmount).toBe(2000);
      expect(result.summary.activeDeposits).toBe(2);
      expect(result.summary.remainingToDeposit).toBe(5000);
      expect(result.summary.percentPaid).toBe(30);
    });

    it('should throw 404 when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(depositService.getByReservation('nonexistent'))
        .rejects.toThrow(/nie znaleziono/);
    });
  });

  // ═══════════════ list ═══════════════
  describe('list', () => {
    it('should return paginated deposits', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([mockDeposit]);
      mockPrisma.deposit.count.mockResolvedValue(1);

      const result = await depositService.list({ page: 1, limit: 20 });

      expect(result.deposits).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalCount).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should apply status filter', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([]);
      mockPrisma.deposit.count.mockResolvedValue(0);

      await depositService.list({ status: 'PAID' });

      expect(mockPrisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: { equals: 'PAID' } }),
        })
      );
    });

    it('should apply search filter on client name/phone', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([]);
      mockPrisma.deposit.count.mockResolvedValue(0);

      await depositService.list({ search: 'Kowalski' });

      expect(mockPrisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reservation: expect.objectContaining({
              client: expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ lastName: { contains: 'Kowalski', mode: 'insensitive' } }),
                ]),
              }),
            }),
          }),
        })
      );
    });

    it('should apply date range filter', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([]);
      mockPrisma.deposit.count.mockResolvedValue(0);

      await depositService.list({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });

      expect(mockPrisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: { gte: '2026-01-01', lte: '2026-12-31' },
          }),
        })
      );
    });
  });

  // ═══════════════ update ═══════════════
  describe('update', () => {
    it('should update amount and dueDate together', async () => {
      mockPrisma.deposit.findUnique
        .mockResolvedValueOnce(mockDeposit)
        .mockResolvedValueOnce({ ...mockDeposit, amount: 3000, dueDate: '2026-06-01' });
      mockPrisma.reservation.findUnique.mockResolvedValue(mockReservation);
      mockPrisma.$queryRawUnsafe.mockResolvedValue(undefined);

      const result = await depositService.update('dep-1', { amount: 3000, dueDate: '2026-06-01' }, userId);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('amount'),
        3000, 3000, '2026-06-01', 'dep-1'
      );
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', entityType: 'DEPOSIT' })
      );
    });

    it('should update only dueDate when amount is not provided', async () => {
      mockPrisma.deposit.findUnique
        .mockResolvedValueOnce(mockDeposit)
        .mockResolvedValueOnce({ ...mockDeposit, dueDate: '2026-07-01' });
      mockPrisma.$queryRawUnsafe.mockResolvedValue(undefined);

      await depositService.update('dep-1', { dueDate: '2026-07-01' }, userId);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('dueDate'),
        '2026-07-01', 'dep-1'
      );
    });

    it('should throw when trying to edit paid deposit', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockPaidDeposit);

      await expect(depositService.update('dep-paid', { amount: 3000 }, userId))
        .rejects.toThrow(/opłaconej/);
    });

    it('should throw when amount <= 0', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockDeposit);

      await expect(depositService.update('dep-1', { amount: 0 }, userId))
        .rejects.toThrow(/większa od 0/);
    });

    it('should throw when new amount + other deposits > totalPrice', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockDeposit);
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        deposits: [
          { id: 'dep-1', status: 'PENDING', amount: 2000 },
          { id: 'dep-other', status: 'PAID', amount: 8000 },
        ],
      });

      await expect(depositService.update('dep-1', { amount: 3000 }, userId))
        .rejects.toThrow(/przekracza/);
    });
  });

  // ═══════════════ delete ═══════════════
  describe('delete', () => {
    it('should delete unpaid deposit and log activity', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockDeposit);
      mockPrisma.$queryRawUnsafe.mockResolvedValue(undefined);

      const result = await depositService.delete('dep-1', userId);

      expect(result.success).toBe(true);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        'dep-1'
      );
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', entityType: 'DEPOSIT' })
      );
    });

    it('should throw when trying to delete paid deposit', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockPaidDeposit);

      await expect(depositService.delete('dep-paid', userId))
        .rejects.toThrow(/opłaconej/);
    });

    it('should throw 404 when deposit not found', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(null);

      await expect(depositService.delete('nonexistent', userId))
        .rejects.toThrow(/nie znaleziono/);
    });
  });

  // ═══════════════ markAsPaid ═══════════════
  describe('markAsPaid', () => {
    const paidInput = {
      paymentMethod: 'TRANSFER' as const,
      paidAt: '2026-04-20T12:00:00Z',
    };

    it('should mark deposit as fully PAID', async () => {
      mockPrisma.deposit.findUnique
        .mockResolvedValueOnce(mockDeposit)
        .mockResolvedValueOnce(mockPaidDeposit);
      mockPrisma.$queryRawUnsafe.mockResolvedValue(undefined);
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        status: 'CONFIRMED',
        deposits: [{ ...mockPaidDeposit }],
      });

      const result = await depositService.markAsPaid('dep-1', paidInput, userId);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "Deposit"'),
        true, 'PAID', '2026-04-20T12:00:00Z', 'TRANSFER', 0, 2000, 'dep-1'
      );
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MARK_PAID' })
      );
    });

    it('should mark as PARTIALLY_PAID when amountPaid < total', async () => {
      mockPrisma.deposit.findUnique
        .mockResolvedValueOnce(mockDeposit)
        .mockResolvedValueOnce({ ...mockDeposit, status: 'PARTIALLY_PAID', paidAmount: 1000 });
      mockPrisma.$queryRawUnsafe.mockResolvedValue(undefined);

      await depositService.markAsPaid('dep-1', { ...paidInput, amountPaid: 1000 }, userId);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "Deposit"'),
        false, 'PARTIALLY_PAID', '2026-04-20T12:00:00Z', 'TRANSFER', 1000, 1000, 'dep-1'
      );
    });

    it('should throw when deposit is already paid', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockPaidDeposit);

      await expect(depositService.markAsPaid('dep-paid', paidInput, userId))
        .rejects.toThrow(/juz oznaczona/);
    });

    it('should throw 404 when deposit not found', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(null);

      await expect(depositService.markAsPaid('nonexistent', paidInput, userId))
        .rejects.toThrow(/nie znaleziono/);
    });
  });

  // ═══════════════ checkAndAutoConfirmReservation ═══════════════
  describe('checkAndAutoConfirmReservation', () => {
    it('should auto-confirm PENDING reservation when all deposits are PAID', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        status: 'PENDING',
        deposits: [
          { status: 'PAID', amount: 3000 },
          { status: 'PAID', amount: 2000 },
        ],
      });
      mockPrisma.reservation.update.mockResolvedValue({});
      mockPrisma.reservationHistory.create.mockResolvedValue({});

      await depositService.checkAndAutoConfirmReservation('res-1', userId);

      expect(mockPrisma.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'CONFIRMED' },
      });
      expect(mockPrisma.reservationHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'STATUS_CHANGED',
            oldValue: 'PENDING',
            newValue: 'CONFIRMED',
          }),
        })
      );
    });

    it('should NOT auto-confirm when reservation is not PENDING', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        status: 'CONFIRMED',
        deposits: [{ status: 'PAID', amount: 2000 }],
      });

      await depositService.checkAndAutoConfirmReservation('res-1', userId);

      expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
    });

    it('should NOT auto-confirm when not all deposits are paid', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        status: 'PENDING',
        deposits: [
          { status: 'PAID', amount: 3000 },
          { status: 'PENDING', amount: 2000 },
        ],
      });

      await depositService.checkAndAutoConfirmReservation('res-1', userId);

      expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
    });

    it('should NOT auto-confirm when there are no active deposits', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        status: 'PENDING',
        deposits: [{ status: 'CANCELLED', amount: 2000 }],
      });

      await depositService.checkAndAutoConfirmReservation('res-1', userId);

      expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully without throwing', async () => {
      mockPrisma.reservation.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(depositService.checkAndAutoConfirmReservation('res-1', userId))
        .resolves.toBeUndefined();
    });
  });

  // ═══════════════ checkPaidDepositsBeforeCancel ═══════════════
  describe('checkPaidDepositsBeforeCancel', () => {
    it('should return hasPaidDeposits=true when paid deposits exist', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([
        { amount: 2000 },
        { amount: 3000 },
      ]);

      const result = await depositService.checkPaidDepositsBeforeCancel('res-1');

      expect(result.hasPaidDeposits).toBe(true);
      expect(result.paidCount).toBe(2);
      expect(result.paidTotal).toBe(5000);
    });

    it('should return hasPaidDeposits=false when no paid deposits', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([]);

      const result = await depositService.checkPaidDepositsBeforeCancel('res-1');

      expect(result.hasPaidDeposits).toBe(false);
      expect(result.paidCount).toBe(0);
      expect(result.paidTotal).toBe(0);
    });
  });

  // ═══════════════ sendConfirmationEmail ═══════════════
  describe('sendConfirmationEmail', () => {
    it('should send email with PDF for paid deposit', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockPaidDeposit);
      mockPdfService.generatePaymentConfirmationPDF.mockResolvedValue(Buffer.from('pdf'));
      mockEmailService.sendDepositPaidConfirmation.mockResolvedValue(true);

      const result = await depositService.sendConfirmationEmail('dep-paid');

      expect(result.success).toBe(true);
      expect(result.message).toContain('jan@test.pl');
      expect(mockPdfService.generatePaymentConfirmationPDF).toHaveBeenCalled();
      expect(mockEmailService.sendDepositPaidConfirmation).toHaveBeenCalledWith(
        'jan@test.pl',
        expect.objectContaining({ clientName: 'Jan Kowalski' }),
        expect.any(Buffer)
      );
    });

    it('should throw when deposit is not paid', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockDeposit);

      await expect(depositService.sendConfirmationEmail('dep-1'))
        .rejects.toThrow(/opłaconej/);
    });

    it('should throw 404 when deposit not found', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(null);

      await expect(depositService.sendConfirmationEmail('nonexistent'))
        .rejects.toThrow(/nie znaleziono/);
    });

    it('should throw when client has no email', async () => {
      const noEmailDeposit = {
        ...mockPaidDeposit,
        reservation: {
          ...mockReservation,
          client: { ...mockClient, email: null },
        },
      };
      mockPrisma.deposit.findUnique.mockResolvedValue(noEmailDeposit);

      await expect(depositService.sendConfirmationEmail('dep-paid'))
        .rejects.toThrow(/email/);
    });
  });

  // ═══════════════ markAsUnpaid ═══════════════
  describe('markAsUnpaid', () => {
    it('should reset paid deposit to PENDING', async () => {
      mockPrisma.deposit.findUnique
        .mockResolvedValueOnce(mockPaidDeposit)
        .mockResolvedValueOnce({ ...mockDeposit });
      mockPrisma.$queryRawUnsafe.mockResolvedValue(undefined);

      const result = await depositService.markAsUnpaid('dep-paid', userId);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("status = 'PENDING'"),
        2000, 'dep-paid'
      );
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MARK_UNPAID' })
      );
    });

    it('should throw when deposit is already PENDING and not paid', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockDeposit);

      await expect(depositService.markAsUnpaid('dep-1', userId))
        .rejects.toThrow(/nie jest oznaczona/);
    });

    it('should throw 404 when deposit not found', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(null);

      await expect(depositService.markAsUnpaid('nonexistent', userId))
        .rejects.toThrow(/nie znaleziono/);
    });
  });

  // ═══════════════ cancel ═══════════════
  describe('cancel', () => {
    it('should cancel unpaid deposit', async () => {
      mockPrisma.deposit.findUnique
        .mockResolvedValueOnce(mockDeposit)
        .mockResolvedValueOnce({ ...mockDeposit, status: 'CANCELLED' });
      mockPrisma.$queryRawUnsafe.mockResolvedValue(undefined);

      const result = await depositService.cancel('dep-1', userId);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("'CANCELLED'"),
        'dep-1'
      );
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CANCEL', entityType: 'DEPOSIT' })
      );
    });

    it('should throw when trying to cancel paid deposit', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(mockPaidDeposit);

      await expect(depositService.cancel('dep-paid', userId))
        .rejects.toThrow(/oplaconej|platnosc/);
    });

    it('should throw 404 when deposit not found', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(null);

      await expect(depositService.cancel('nonexistent', userId))
        .rejects.toThrow(/nie znaleziono/);
    });
  });

  // ═══════════════ getStats ═══════════════
  describe('getStats', () => {
    it('should return aggregated stats from raw SQL', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{
        total: 10,
        pending: 4,
        paid: 3,
        overdue: 2,
        partiallyPaid: 1,
        cancelled: 0,
        upcomingIn7Days: 2,
        totalAmount: 50000,
        paidAmountSum: 30000,
        overdueAmount: 10000,
      }]);

      const result = await depositService.getStats();

      expect(result.counts.total).toBe(10);
      expect(result.counts.pending).toBe(4);
      expect(result.counts.paid).toBe(3);
      expect(result.counts.overdue).toBe(2);
      expect(result.amounts.total).toBe(50000);
      expect(result.amounts.paid).toBe(30000);
      expect(result.amounts.pending).toBe(20000);
      expect(result.amounts.overdue).toBe(10000);
    });

    it('should handle empty stats gracefully', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{}]);

      const result = await depositService.getStats();

      expect(result.counts.total).toBe(0);
      expect(result.amounts.total).toBe(0);
    });
  });

  // ═══════════════ getOverdue ═══════════════
  describe('getOverdue', () => {
    it('should return overdue deposits ordered by dueDate', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([mockDeposit]);

      const result = await depositService.getOverdue();

      expect(result).toHaveLength(1);
      expect(mockPrisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: { equals: 'PENDING' } }),
          orderBy: { dueDate: 'asc' },
        })
      );
    });
  });

  // ═══════════════ autoMarkOverdue ═══════════════
  describe('autoMarkOverdue', () => {
    it('should batch-update overdue deposits and return count', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 5 }]);

      const result = await depositService.autoMarkOverdue();

      expect(result.markedOverdueCount).toBe(5);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "Deposit"'),
        expect.any(String)
      );
    });

    it('should return 0 when no overdue deposits', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }]);

      const result = await depositService.autoMarkOverdue();

      expect(result.markedOverdueCount).toBe(0);
    });
  });
});
