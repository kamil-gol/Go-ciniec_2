/**
 * DepositService — Comprehensive Unit Tests
 * Targets ~46.22% branches. Covers: create validation, list filters,
 * update 3-way branch (amount+dueDate/amount/dueDate), markAsPaid
 * full/partial, checkAndAutoConfirmReservation all early returns,
 * sendConfirmationEmail guards, markAsUnpaid, cancel, getStats, getOverdue.
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservation: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    deposit: {
      findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(),
    },
    reservationHistory: { create: jest.fn() },
    $queryRawUnsafe: jest.fn(),
  },
}));

jest.mock('../../../utils/audit-logger', () => ({ logChange: jest.fn() }));
jest.mock('../../../utils/logger', () => ({ __esModule: true, default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../../../services/pdf.service', () => ({ pdfService: { generatePaymentConfirmationPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')) } }));
jest.mock('../../../services/email.service', () => ({ __esModule: true, default: { sendDepositPaidConfirmation: jest.fn().mockResolvedValue(true) } }));

import depositService from '../../../services/deposit.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;

const dec = (v: number) => ({ toNumber: () => v, toString: () => String(v) });

const DEPOSIT = {
  id: 'd1', reservationId: 'r1', amount: dec(1000), remainingAmount: dec(1000),
  paidAmount: dec(0), dueDate: '2026-03-01', status: 'PENDING', paid: false,
  paidAt: null, paymentMethod: null,
};

const DEPOSIT_PAID = {
  ...DEPOSIT, id: 'd2', paid: true, status: 'PAID', paidAt: '2026-02-18',
  paymentMethod: 'TRANSFER', paidAmount: dec(1000), remainingAmount: dec(0),
};

const RESERVATION = {
  id: 'r1', totalPrice: dec(5000), status: 'PENDING',
  deposits: [{ ...DEPOSIT, amount: 1000, status: 'PENDING' }],
  client: { firstName: 'Jan', lastName: 'K', email: 'j@t.pl', phone: '123456789' },
};

beforeEach(() => jest.clearAllMocks());

describe('depositService', () => {
  // ========== create ==========
  describe('create()', () => {
    it('should throw when reservation not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(depositService.create({ reservationId: 'x', amount: 100, dueDate: '2026-03-01' }, 'u1'))
        .rejects.toThrow();
    });

    it('should throw when sum exceeds total price', async () => {
      db.reservation.findUnique.mockResolvedValue({
        ...RESERVATION, totalPrice: dec(1000),
        deposits: [{ amount: 800, status: 'PENDING' }],
      });
      await expect(depositService.create({ reservationId: 'r1', amount: 300, dueDate: '2026-03-01' }, 'u1'))
        .rejects.toThrow('przekracza');
    });

    it('should throw when amount <= 0', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RESERVATION, deposits: [] });
      await expect(depositService.create({ reservationId: 'r1', amount: 0, dueDate: '2026-03-01' }, 'u1'))
        .rejects.toThrow('wieksza od 0');
    });

    it('should filter out CANCELLED deposits in sum', async () => {
      db.reservation.findUnique.mockResolvedValue({
        ...RESERVATION, totalPrice: dec(5000),
        deposits: [
          { amount: 3000, status: 'CANCELLED' },
          { amount: 1000, status: 'PENDING' },
        ],
      });
      db.$queryRawUnsafe.mockResolvedValue([{ id: 'd-new' }]);
      db.deposit.findUnique.mockResolvedValue({ id: 'd-new' });
      const result = await depositService.create({ reservationId: 'r1', amount: 3000, dueDate: '2026-03-01' }, 'u1');
      expect(result).toBeDefined();
    });
  });

  // ========== getById ==========
  describe('getById()', () => {
    it('should throw when not found', async () => {
      db.deposit.findUnique.mockResolvedValue(null);
      await expect(depositService.getById('x')).rejects.toThrow();
    });

    it('should return deposit', async () => {
      db.deposit.findUnique.mockResolvedValue({ id: 'd1' });
      expect(await depositService.getById('d1')).toEqual({ id: 'd1' });
    });
  });

  // ========== getByReservation ==========
  describe('getByReservation()', () => {
    it('should throw when reservation not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(depositService.getByReservation('x')).rejects.toThrow();
    });

    it('should calculate summary correctly', async () => {
      db.reservation.findUnique.mockResolvedValue({ id: 'r1', totalPrice: dec(5000) });
      db.deposit.findMany.mockResolvedValue([
        { amount: dec(2000), status: 'PAID', paid: true },
        { amount: dec(1000), status: 'PENDING', paid: false },
        { amount: dec(500), status: 'CANCELLED', paid: false },
      ]);
      const result = await depositService.getByReservation('r1');
      expect(result.summary.totalAmount).toBe(3000); // 2000+1000 (excl cancelled)
      expect(result.summary.paidAmount).toBe(2000);
      expect(result.summary.pendingAmount).toBe(1000);
      expect(result.summary.percentPaid).toBe(40); // 2000/5000*100
    });

    it('should return 0 percentPaid when reservationTotal is 0', async () => {
      db.reservation.findUnique.mockResolvedValue({ id: 'r1', totalPrice: dec(0) });
      db.deposit.findMany.mockResolvedValue([]);
      const result = await depositService.getByReservation('r1');
      expect(result.summary.percentPaid).toBe(0);
    });
  });

  // ========== list ==========
  describe('list()', () => {
    beforeEach(() => {
      db.deposit.findMany.mockResolvedValue([]);
      db.deposit.count.mockResolvedValue(0);
    });

    it('should use defaults for page/limit/sort', async () => {
      await depositService.list({});
      expect(db.deposit.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0, take: 20, orderBy: { dueDate: 'asc' },
      }));
    });

    it('should filter by reservationId', async () => {
      await depositService.list({ reservationId: 'r1' });
      const call = db.deposit.findMany.mock.calls[0][0];
      expect(call.where.reservationId).toBe('r1');
    });

    it('should filter by status', async () => {
      await depositService.list({ status: 'PAID' });
      const call = db.deposit.findMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ equals: 'PAID' });
    });

    it('should filter by paid', async () => {
      await depositService.list({ paid: true });
      const call = db.deposit.findMany.mock.calls[0][0];
      expect(call.where.paid).toBe(true);
    });

    it('should filter overdue deposits', async () => {
      await depositService.list({ overdue: true });
      const call = db.deposit.findMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ equals: 'PENDING' });
      expect(call.where.dueDate).toBeDefined();
    });

    it('should filter by dateFrom and dateTo', async () => {
      await depositService.list({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });
      const call = db.deposit.findMany.mock.calls[0][0];
      expect(call.where.dueDate.gte).toBe('2026-01-01');
      expect(call.where.dueDate.lte).toBe('2026-12-31');
    });

    it('should filter by dateFrom only', async () => {
      await depositService.list({ dateFrom: '2026-01-01' });
      const call = db.deposit.findMany.mock.calls[0][0];
      expect(call.where.dueDate.gte).toBe('2026-01-01');
      expect(call.where.dueDate.lte).toBeUndefined();
    });

    it('should filter by search (client name)', async () => {
      await depositService.list({ search: 'Jan' });
      const call = db.deposit.findMany.mock.calls[0][0];
      expect(call.where.reservation.client.OR).toHaveLength(3);
    });

    it('should calculate pagination correctly', async () => {
      db.deposit.findMany.mockResolvedValue([{ id: '1' }]);
      db.deposit.count.mockResolvedValue(50);
      const result = await depositService.list({ page: 2, limit: 10 });
      expect(result.pagination).toEqual({
        page: 2, limit: 10, totalCount: 50, totalPages: 5, hasMore: true,
      });
    });
  });

  // ========== update ==========
  describe('update()', () => {
    it('should throw when not found', async () => {
      db.deposit.findUnique.mockResolvedValue(null);
      await expect(depositService.update('x', {}, 'u1')).rejects.toThrow();
    });

    it('should throw when already paid', async () => {
      db.deposit.findUnique.mockResolvedValue(DEPOSIT_PAID);
      await expect(depositService.update('d2', { amount: 500 }, 'u1')).rejects.toThrow('oplaconej');
    });

    it('should throw when amount <= 0', async () => {
      db.deposit.findUnique.mockResolvedValueOnce(DEPOSIT);
      await expect(depositService.update('d1', { amount: -1 }, 'u1')).rejects.toThrow('wieksza od 0');
    });

    it('should throw when new amount exceeds total', async () => {
      db.deposit.findUnique.mockResolvedValueOnce(DEPOSIT);
      db.reservation.findUnique.mockResolvedValue({
        id: 'r1', totalPrice: dec(1000),
        deposits: [{ id: 'd1', amount: 500, status: 'PENDING' }, { id: 'd2', amount: 400, status: 'PENDING' }],
      });
      await expect(depositService.update('d1', { amount: 700 }, 'u1')).rejects.toThrow('przekracza');
    });

    it('should update both amount and dueDate', async () => {
      db.deposit.findUnique.mockResolvedValueOnce(DEPOSIT);
      db.reservation.findUnique.mockResolvedValue({ ...RESERVATION, deposits: [] });
      db.$queryRawUnsafe.mockResolvedValue(undefined);
      db.deposit.findUnique.mockResolvedValueOnce({ ...DEPOSIT, amount: 500 });
      await depositService.update('d1', { amount: 500, dueDate: '2026-04-01' }, 'u1');
      expect(db.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('amount'), 500, 500, '2026-04-01', 'd1'
      );
    });

    it('should update amount only', async () => {
      db.deposit.findUnique.mockResolvedValueOnce(DEPOSIT);
      db.reservation.findUnique.mockResolvedValue({ ...RESERVATION, deposits: [] });
      db.$queryRawUnsafe.mockResolvedValue(undefined);
      db.deposit.findUnique.mockResolvedValueOnce({ ...DEPOSIT, amount: 500 });
      await depositService.update('d1', { amount: 500 }, 'u1');
      const sql = db.$queryRawUnsafe.mock.calls[0][0];
      expect(sql).toContain('amount');
      expect(sql).not.toContain('dueDate');
    });

    it('should update dueDate only', async () => {
      db.deposit.findUnique.mockResolvedValueOnce(DEPOSIT);
      db.$queryRawUnsafe.mockResolvedValue(undefined);
      db.deposit.findUnique.mockResolvedValueOnce(DEPOSIT);
      await depositService.update('d1', { dueDate: '2026-05-01' }, 'u1');
      const sql = db.$queryRawUnsafe.mock.calls[0][0];
      expect(sql).toContain('dueDate');
      expect(sql).not.toContain('amount');
    });
  });

  // ========== delete ==========
  describe('delete()', () => {
    it('should throw when not found', async () => {
      db.deposit.findUnique.mockResolvedValue(null);
      await expect(depositService.delete('x', 'u1')).rejects.toThrow();
    });

    it('should throw when paid', async () => {
      db.deposit.findUnique.mockResolvedValue(DEPOSIT_PAID);
      await expect(depositService.delete('d2', 'u1')).rejects.toThrow('oplaconej');
    });

    it('should delete unpaid deposit', async () => {
      db.deposit.findUnique.mockResolvedValue(DEPOSIT);
      db.$queryRawUnsafe.mockResolvedValue(undefined);
      const result = await depositService.delete('d1', 'u1');
      expect(result.success).toBe(true);
    });
  });

  // ========== markAsPaid ==========
  describe('markAsPaid()', () => {
    it('should throw when not found', async () => {
      db.deposit.findUnique.mockResolvedValue(null);
      await expect(depositService.markAsPaid('x', { paymentMethod: 'CASH', paidAt: '2026-02-18' }, 'u1'))
        .rejects.toThrow();
    });

    it('should throw when already paid', async () => {
      db.deposit.findUnique.mockResolvedValue(DEPOSIT_PAID);
      await expect(depositService.markAsPaid('d2', { paymentMethod: 'CASH', paidAt: '2026-02-18' }, 'u1'))
        .rejects.toThrow('juz oznaczona');
    });

    it('should mark as fully PAID (default amountPaid)', async () => {
      db.deposit.findUnique
        .mockResolvedValueOnce(DEPOSIT)
        .mockResolvedValueOnce({ ...DEPOSIT_PAID });
      db.$queryRawUnsafe.mockResolvedValue(undefined);
      // Mock checkAndAutoConfirmReservation dependencies
      db.reservation.findUnique.mockResolvedValue(null); // no reservation → early return
      const result = await depositService.markAsPaid('d1', { paymentMethod: 'TRANSFER', paidAt: '2026-02-18' }, 'u1');
      expect(db.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String), true, 'PAID', '2026-02-18', 'TRANSFER', 0, 1000, 'd1'
      );
    });

    it('should mark as PARTIALLY_PAID with partial amount', async () => {
      db.deposit.findUnique
        .mockResolvedValueOnce(DEPOSIT)
        .mockResolvedValueOnce({ ...DEPOSIT, status: 'PARTIALLY_PAID' });
      db.$queryRawUnsafe.mockResolvedValue(undefined);
      const result = await depositService.markAsPaid('d1', {
        paymentMethod: 'CASH', paidAt: '2026-02-18', amountPaid: 500,
      }, 'u1');
      // remaining = 1000 - 500 = 500 > 0 → PARTIALLY_PAID, isPaid=false
      expect(db.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String), false, 'PARTIALLY_PAID', '2026-02-18', 'CASH', 500, 500, 'd1'
      );
    });
  });

  // ========== checkAndAutoConfirmReservation ==========
  describe('checkAndAutoConfirmReservation()', () => {
    it('should return when reservation not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await depositService.checkAndAutoConfirmReservation('r1', 'u1');
      expect(db.reservation.update).not.toHaveBeenCalled();
    });

    it('should return when status is not PENDING', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RESERVATION, status: 'CONFIRMED' });
      await depositService.checkAndAutoConfirmReservation('r1', 'u1');
      expect(db.reservation.update).not.toHaveBeenCalled();
    });

    it('should return when no active deposits', async () => {
      db.reservation.findUnique.mockResolvedValue({
        ...RESERVATION, deposits: [{ status: 'CANCELLED' }],
      });
      await depositService.checkAndAutoConfirmReservation('r1', 'u1');
      expect(db.reservation.update).not.toHaveBeenCalled();
    });

    it('should not confirm when not all deposits paid', async () => {
      db.reservation.findUnique.mockResolvedValue({
        ...RESERVATION, deposits: [
          { status: 'PAID', amount: 1000 },
          { status: 'PENDING', amount: 500 },
        ],
      });
      await depositService.checkAndAutoConfirmReservation('r1', 'u1');
      expect(db.reservation.update).not.toHaveBeenCalled();
    });

    it('should auto-confirm when all deposits paid', async () => {
      db.reservation.findUnique.mockResolvedValue({
        ...RESERVATION, deposits: [
          { status: 'PAID', amount: 1000 },
          { status: 'PAID', amount: 500 },
        ],
      });
      db.reservation.update.mockResolvedValue(undefined);
      db.reservationHistory.create.mockResolvedValue(undefined);
      await depositService.checkAndAutoConfirmReservation('r1', 'u1');
      expect(db.reservation.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: 'CONFIRMED' },
      }));
    });

    it('should handle clientName when no client', async () => {
      db.reservation.findUnique.mockResolvedValue({
        ...RESERVATION, client: null, deposits: [{ status: 'PAID', amount: 1000 }],
      });
      db.reservation.update.mockResolvedValue(undefined);
      db.reservationHistory.create.mockResolvedValue(undefined);
      await depositService.checkAndAutoConfirmReservation('r1', 'u1');
      expect(db.reservation.update).toHaveBeenCalled();
    });

    it('should catch and log errors', async () => {
      db.reservation.findUnique.mockRejectedValue(new Error('DB down'));
      await depositService.checkAndAutoConfirmReservation('r1', 'u1');
      // Should not throw
    });
  });

  // ========== checkPaidDepositsBeforeCancel ==========
  describe('checkPaidDepositsBeforeCancel()', () => {
    it('should return hasPaidDeposits true', async () => {
      db.deposit.findMany.mockResolvedValue([{ amount: dec(1000) }]);
      const result = await depositService.checkPaidDepositsBeforeCancel('r1');
      expect(result.hasPaidDeposits).toBe(true);
      expect(result.paidCount).toBe(1);
    });

    it('should return hasPaidDeposits false', async () => {
      db.deposit.findMany.mockResolvedValue([]);
      const result = await depositService.checkPaidDepositsBeforeCancel('r1');
      expect(result.hasPaidDeposits).toBe(false);
    });
  });

  // ========== sendConfirmationEmail ==========
  describe('sendConfirmationEmail()', () => {
    it('should throw when not found', async () => {
      db.deposit.findUnique.mockResolvedValue(null);
      await expect(depositService.sendConfirmationEmail('x')).rejects.toThrow();
    });

    it('should throw when not paid', async () => {
      db.deposit.findUnique.mockResolvedValue({ ...DEPOSIT, paid: false, reservation: RESERVATION });
      await expect(depositService.sendConfirmationEmail('d1')).rejects.toThrow('oplaconej');
    });

    it('should throw when client has no email', async () => {
      db.deposit.findUnique.mockResolvedValue({
        ...DEPOSIT_PAID, reservation: { ...RESERVATION, client: { firstName: 'J', lastName: 'K', email: null, phone: '123' } },
      });
      await expect(depositService.sendConfirmationEmail('d2')).rejects.toThrow('email');
    });

    it('should send email with PDF', async () => {
      db.deposit.findUnique.mockResolvedValue({
        ...DEPOSIT_PAID,
        reservation: {
          ...RESERVATION,
          date: '2026-06-15', startTime: '14:00', endTime: '22:00',
          hall: { name: 'Sala A' }, eventType: { name: 'Wesele' }, guests: 100,
        },
      });
      const result = await depositService.sendConfirmationEmail('d2');
      expect(result.success).toBe(true);
    });

    it('should use fallback names when hall/eventType missing', async () => {
      db.deposit.findUnique.mockResolvedValue({
        ...DEPOSIT_PAID,
        reservation: {
          ...RESERVATION, date: null, startTime: null, endTime: null,
          hall: null, eventType: null, guests: 50,
        },
      });
      const result = await depositService.sendConfirmationEmail('d2');
      expect(result.success).toBe(true);
    });
  });

  // ========== markAsUnpaid ==========
  describe('markAsUnpaid()', () => {
    it('should throw when not found', async () => {
      db.deposit.findUnique.mockResolvedValue(null);
      await expect(depositService.markAsUnpaid('x', 'u1')).rejects.toThrow();
    });

    it('should throw when not paid and PENDING', async () => {
      db.deposit.findUnique.mockResolvedValue(DEPOSIT);
      await expect(depositService.markAsUnpaid('d1', 'u1')).rejects.toThrow('nie jest oznaczona');
    });

    it('should unpaid a paid deposit', async () => {
      db.deposit.findUnique
        .mockResolvedValueOnce(DEPOSIT_PAID)
        .mockResolvedValueOnce({ ...DEPOSIT });
      db.$queryRawUnsafe.mockResolvedValue(undefined);
      const result = await depositService.markAsUnpaid('d2', 'u1');
      expect(db.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  // ========== cancel ==========
  describe('cancel()', () => {
    it('should throw when not found', async () => {
      db.deposit.findUnique.mockResolvedValue(null);
      await expect(depositService.cancel('x', 'u1')).rejects.toThrow();
    });

    it('should throw when paid', async () => {
      db.deposit.findUnique.mockResolvedValue(DEPOSIT_PAID);
      await expect(depositService.cancel('d2', 'u1')).rejects.toThrow('oplaconej');
    });

    it('should cancel unpaid deposit', async () => {
      db.deposit.findUnique
        .mockResolvedValueOnce(DEPOSIT)
        .mockResolvedValueOnce({ ...DEPOSIT, status: 'CANCELLED' });
      db.$queryRawUnsafe.mockResolvedValue(undefined);
      const result = await depositService.cancel('d1', 'u1');
      expect(db.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('CANCELLED'), 'd1'
      );
    });
  });

  // ========== getStats ==========
  describe('getStats()', () => {
    it('should return formatted stats', async () => {
      db.$queryRawUnsafe.mockResolvedValue([{
        total: 10, pending: 3, paid: 5, overdue: 1, partiallyPaid: 1, cancelled: 2,
        upcomingIn7Days: 2, totalAmount: 50000, paidAmountSum: 30000, overdueAmount: 5000,
      }]);
      const stats = await depositService.getStats();
      expect(stats.counts.total).toBe(10);
      expect(stats.amounts.total).toBe(50000);
      expect(stats.amounts.pending).toBe(20000);
    });

    it('should handle empty stats row', async () => {
      db.$queryRawUnsafe.mockResolvedValue([{}]);
      const stats = await depositService.getStats();
      expect(stats.counts.total).toBe(0);
      expect(stats.amounts.total).toBe(0);
    });
  });

  // ========== getOverdue ==========
  describe('getOverdue()', () => {
    it('should return overdue deposits', async () => {
      db.deposit.findMany.mockResolvedValue([{ id: 'd1' }]);
      const result = await depositService.getOverdue();
      expect(result).toHaveLength(1);
    });
  });

  // ========== autoMarkOverdue ==========
  describe('autoMarkOverdue()', () => {
    it('should return count', async () => {
      db.$queryRawUnsafe.mockResolvedValue([{ count: 3 }]);
      const result = await depositService.autoMarkOverdue();
      expect(result.markedOverdueCount).toBe(3);
    });

    it('should handle null count', async () => {
      db.$queryRawUnsafe.mockResolvedValue([{}]);
      const result = await depositService.autoMarkOverdue();
      expect(result.markedOverdueCount).toBe(0);
    });
  });
});
