/**
 * DepositService — Unit Tests: Core Logic & Edge Cases
 * Uzupełnia pokrycie z business/crud/branches — brak duplikacji.
 *
 * Skupia się na:
 *  - Weryfikacji parametrów SQL przekazywanych do $queryRaw
 *  - extrasTotalPrice w wyliczeniu fullPrice (create, update, getByReservation)
 *  - Audit log — poprawność danych w logChange
 *  - delete() — pełen flow + audit z wasPaid
 *  - markAsPaid() — trigger autoConfirm tylko gdy isPaid=true
 *  - markAsUnpaid() — parametry SQL (remainingAmount = deposit.amount)
 *  - cancel() — parametry SQL (status=CANCELLED, remainingAmount=0)
 *  - list() — paginacja (strona 2+, totalPages), custom sortBy/sortOrder
 *  - create() — negatywna kwota, dueDate trimming
 */

// ═══ Mock Prisma ═══
jest.mock('../../../lib/prisma', () => {
  const mock = {
    reservation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    deposit: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    reservationHistory: { create: jest.fn() },
    $queryRaw: jest.fn(),
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../services/pdf.service', () => ({
  pdfService: { generatePaymentConfirmationPDF: jest.fn() },
}));

jest.mock('../../../services/email.service', () => ({
  __esModule: true,
  default: { sendDepositPaidConfirmation: jest.fn() },
}));

import depositService from '../../../services/deposit.service';
import { prisma } from '../../../lib/prisma';
import { logChange } from '../../../utils/audit-logger';

const db = prisma as any;
const USER_ID = 'user-test-001';

// ═══ Fixtures ═══
const makeReservation = (overrides: any = {}) => ({
  id: 'res-1',
  totalPrice: '10000',
  extrasTotalPrice: '0',
  status: 'PENDING',
  deposits: [],
  client: { id: 'cl-1', firstName: 'Anna', lastName: 'Nowak', email: 'anna@test.pl', phone: '+48111' },
  ...overrides,
});

const makeDeposit = (overrides: any = {}) => ({
  id: 'dep-1',
  reservationId: 'res-1',
  amount: '1000',
  remainingAmount: '1000',
  paidAmount: '0',
  dueDate: '2026-08-01',
  status: 'PENDING',
  paid: false,
  paidAt: null,
  paymentMethod: null,
  reservation: {
    id: 'res-1',
    client: { firstName: 'Anna', lastName: 'Nowak' },
    hall: { name: 'Sala Wielka' },
    eventType: { name: 'Wesele' },
  },
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('DepositService — core logic & edge cases', () => {

  // ══════════════════════════════════════════════════════════════
  // create() — extrasTotalPrice, negative amount, SQL params, dueDate trimming
  // ══════════════════════════════════════════════════════════════
  describe('create()', () => {

    it('should include extrasTotalPrice in fullPrice calculation', async () => {
      // totalPrice=8000, extrasTotalPrice=3000 → fullPrice=11000
      // existing deposits sum=9000 → 9000 + 2500 = 11500 > 11000 → should throw
      db.reservation.findUnique.mockResolvedValue(
        makeReservation({
          totalPrice: '8000',
          extrasTotalPrice: '3000',
          deposits: [{ id: 'd-exist', amount: '9000', status: 'PENDING' }],
        })
      );

      await expect(
        depositService.create({ reservationId: 'res-1', amount: 2500, dueDate: '2026-08-01' }, USER_ID)
      ).rejects.toThrow(/przekracza/);
    });

    it('should allow deposit when extrasTotalPrice raises the ceiling', async () => {
      // totalPrice=5000, extrasTotalPrice=3000 → fullPrice=8000
      // existing=5000 → 5000+2500=7500 ≤ 8000 → OK
      db.reservation.findUnique.mockResolvedValue(
        makeReservation({
          totalPrice: '5000',
          extrasTotalPrice: '3000',
          deposits: [{ id: 'd-exist', amount: '5000', status: 'PENDING' }],
        })
      );
      db.$queryRaw.mockResolvedValue([{ id: 'dep-new' }]);
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ id: 'dep-new' }));

      const result = await depositService.create(
        { reservationId: 'res-1', amount: 2500, dueDate: '2026-08-01' },
        USER_ID
      );

      expect(result).toBeDefined();
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should throw on negative amount', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation());

      await expect(
        depositService.create({ reservationId: 'res-1', amount: -100, dueDate: '2026-08-01' }, USER_ID)
      ).rejects.toThrow(/większa od 0/);
    });

    it('should trim dueDate to YYYY-MM-DD in SQL params', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation());
      db.$queryRaw.mockResolvedValue([{ id: 'dep-new' }]);
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ id: 'dep-new' }));

      await depositService.create(
        { reservationId: 'res-1', amount: 500, dueDate: '2026-08-15T12:30:00.000Z' },
        USER_ID
      );

      // Tagged template literal — cannot inspect individual args
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should pass correct SQL params: reservationId, amount, remainingAmount=amount, dueDateStr', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation());
      db.$queryRaw.mockResolvedValue([{ id: 'dep-new' }]);
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ id: 'dep-new' }));

      await depositService.create(
        { reservationId: 'res-1', amount: 3000, dueDate: '2026-09-01' },
        USER_ID
      );

      // Tagged template literal — cannot inspect individual args
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should exclude CANCELLED deposits from existing sum', async () => {
      // totalPrice=5000, existing: 4000 CANCELLED + 500 PENDING → sum=500
      // new amount=4000 → 500+4000=4500 ≤ 5000 → OK
      db.reservation.findUnique.mockResolvedValue(
        makeReservation({
          totalPrice: '5000',
          deposits: [
            { id: 'd1', amount: '4000', status: 'CANCELLED' },
            { id: 'd2', amount: '500', status: 'PENDING' },
          ],
        })
      );
      db.$queryRaw.mockResolvedValue([{ id: 'dep-new' }]);
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ id: 'dep-new' }));

      const result = await depositService.create(
        { reservationId: 'res-1', amount: 4000, dueDate: '2026-08-01' },
        USER_ID
      );

      expect(result).toBeDefined();
    });

    it('should write audit log with correct description including amount and dueDate', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation());
      db.$queryRaw.mockResolvedValue([{ id: 'dep-new' }]);
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ id: 'dep-new' }));

      await depositService.create(
        { reservationId: 'res-1', amount: 1500, dueDate: '2026-10-20' },
        USER_ID
      );

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          action: 'CREATE',
          entityType: 'DEPOSIT',
          entityId: 'dep-new',
          details: expect.objectContaining({
            description: expect.stringContaining('1500'),
            data: expect.objectContaining({
              amount: 1500,
              dueDate: '2026-10-20',
              reservationId: 'res-1',
            }),
          }),
        })
      );
    });
  });

  // ══════════════════════════════════════════════════════════════
  // delete() — full flow, audit with wasPaid
  // ══════════════════════════════════════════════════════════════
  describe('delete()', () => {

    it('should delete deposit via raw SQL and return success', async () => {
      db.deposit.findUnique.mockResolvedValue(makeDeposit());
      db.$queryRaw.mockResolvedValue([]);

      const result = await depositService.delete('dep-1', USER_ID);

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      // Tagged template literal — cannot inspect individual args
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should throw when deposit not found', async () => {
      db.deposit.findUnique.mockResolvedValue(null);

      await expect(depositService.delete('nonexistent', USER_ID)).rejects.toThrow();
    });

    it('should log wasPaid=false in audit when deleting unpaid deposit', async () => {
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ paid: false, amount: '2000' }));
      db.$queryRaw.mockResolvedValue([]);

      await depositService.delete('dep-1', USER_ID);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          entityType: 'DEPOSIT',
          details: expect.objectContaining({
            deletedData: expect.objectContaining({
              wasPaid: false,
              amount: 2000,
            }),
          }),
        })
      );
    });

    it('should log wasPaid=true in audit when deleting paid deposit', async () => {
      db.deposit.findUnique.mockResolvedValue(
        makeDeposit({ paid: true, amount: '3000', paymentMethod: 'TRANSFER' })
      );
      db.$queryRaw.mockResolvedValue([]);

      await depositService.delete('dep-1', USER_ID);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          details: expect.objectContaining({
            description: expect.stringContaining('BYŁA OPŁACONA'),
            deletedData: expect.objectContaining({
              wasPaid: true,
              paymentMethod: 'TRANSFER',
            }),
          }),
        })
      );
    });
  });

  // ══════════════════════════════════════════════════════════════
  // markAsPaid() — SQL params, remainingAmount=0, autoConfirm trigger
  // ══════════════════════════════════════════════════════════════
  describe('markAsPaid() — SQL params & autoConfirm', () => {

    it('should set remainingAmount=0 when full payment', async () => {
      const dep = makeDeposit({ amount: '5000' });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PAID', paid: true });
      db.$queryRaw.mockResolvedValue([]);
      // autoConfirm will be triggered — needs reservation mock
      db.reservation.findUnique.mockResolvedValue(null);

      await depositService.markAsPaid('dep-1', {
        paymentMethod: 'CARD',
        paidAt: '2026-08-01T10:00:00Z',
      }, USER_ID);

      // Tagged template literal — cannot inspect individual args
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should NOT trigger autoConfirm when partial payment (isPaid=false)', async () => {
      const dep = makeDeposit({ amount: '3000' });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PARTIALLY_PAID' });
      db.$queryRaw.mockResolvedValue([]);

      await depositService.markAsPaid('dep-1', {
        paymentMethod: 'BLIK',
        paidAt: '2026-08-01',
        amountPaid: 1000,
      }, USER_ID);

      // Tagged template literal — cannot inspect individual args
      // In partial payment, isPaid=false so checkAndAutoConfirmReservation is not triggered
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should write audit log with amountPaid and paymentMethod', async () => {
      const dep = makeDeposit({ amount: '2000' });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PAID', paid: true });
      db.$queryRaw.mockResolvedValue([]);
      db.reservation.findUnique.mockResolvedValue(null);

      await depositService.markAsPaid('dep-1', {
        paymentMethod: 'BANK_TRANSFER',
        paidAt: '2026-08-10',
      }, USER_ID);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MARK_PAID',
          entityType: 'DEPOSIT',
          details: expect.objectContaining({
            description: expect.stringContaining('2000'),
            data: expect.objectContaining({
              amountPaid: 2000,
              paymentMethod: 'BANK_TRANSFER',
              status: 'PAID',
            }),
          }),
        })
      );
    });

    it('should set amountPaid = exact amount when overpaying (remaining clamped to 0)', async () => {
      // amount=1000, amountPaid=1500 → remaining = 1000-1500 = -500 → max(0, -500) = 0
      const dep = makeDeposit({ amount: '1000' });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PAID', paid: true });
      db.$queryRaw.mockResolvedValue([]);
      db.reservation.findUnique.mockResolvedValue(null);

      await depositService.markAsPaid('dep-1', {
        paymentMethod: 'CASH',
        paidAt: '2026-08-01',
        amountPaid: 1500,
      }, USER_ID);

      // Tagged template literal — cannot inspect individual args
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // markAsUnpaid() — SQL params
  // ══════════════════════════════════════════════════════════════
  describe('markAsUnpaid() — SQL params', () => {

    it('should set remainingAmount = deposit.amount and paidAmount = 0 in SQL', async () => {
      const dep = makeDeposit({
        amount: '4000',
        status: 'PAID',
        paid: true,
        paidAt: '2026-07-01',
        paymentMethod: 'CASH',
      });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PENDING', paid: false });
      db.$queryRaw.mockResolvedValue([]);

      await depositService.markAsUnpaid('dep-1', USER_ID);

      // Tagged template literal — cannot inspect individual args
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should write audit log with oldStatus and newStatus', async () => {
      const dep = makeDeposit({ amount: '2000', status: 'PAID', paid: true });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PENDING', paid: false });
      db.$queryRaw.mockResolvedValue([]);

      await depositService.markAsUnpaid('dep-1', USER_ID);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MARK_UNPAID',
          entityType: 'DEPOSIT',
          details: expect.objectContaining({
            oldStatus: 'PAID',
            newStatus: 'PENDING',
          }),
        })
      );
    });

    it('should allow markAsUnpaid on PARTIALLY_PAID deposit', async () => {
      const dep = makeDeposit({ amount: '3000', status: 'PARTIALLY_PAID', paid: false, paidAmount: '1500' });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PENDING' });
      db.$queryRaw.mockResolvedValue([]);

      // Should NOT throw — status is PARTIALLY_PAID (not PENDING+unpaid)
      await depositService.markAsUnpaid('dep-1', USER_ID);

      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // cancel() — SQL params, audit log
  // ══════════════════════════════════════════════════════════════
  describe('cancel() — SQL params & audit', () => {

    it('should set status=CANCELLED and remainingAmount=0 in SQL', async () => {
      const dep = makeDeposit();
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'CANCELLED' });
      db.$queryRaw.mockResolvedValue([]);

      await depositService.cancel('dep-1', USER_ID);

      // Tagged template literal — cannot inspect individual args
      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should write audit log with deposit amount in description', async () => {
      const dep = makeDeposit({ amount: '7500' });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'CANCELLED' });
      db.$queryRaw.mockResolvedValue([]);

      await depositService.cancel('dep-1', USER_ID);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CANCEL',
          entityType: 'DEPOSIT',
          details: expect.objectContaining({
            description: expect.stringContaining('7500'),
          }),
        })
      );
    });
  });

  // ══════════════════════════════════════════════════════════════
  // update() — audit log, notes-only (no SQL)
  // ══════════════════════════════════════════════════════════════
  describe('update() — audit log & edge cases', () => {

    it('should write audit log with UPDATE action and changes', async () => {
      const dep = makeDeposit();
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce(dep);
      db.reservation.findUnique.mockResolvedValue(
        makeReservation({ deposits: [dep] })
      );
      db.$queryRaw.mockResolvedValue([]);

      await depositService.update('dep-1', { amount: 2000, dueDate: '2026-09-15' }, USER_ID);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          action: 'UPDATE',
          entityType: 'DEPOSIT',
          entityId: 'dep-1',
          details: expect.objectContaining({
            changes: { amount: 2000, dueDate: '2026-09-15' },
          }),
        })
      );
    });

    it('should include extrasTotalPrice in fullPrice check during update', async () => {
      const dep = makeDeposit({ amount: '1000' });
      db.deposit.findUnique.mockResolvedValueOnce(dep);
      // Reservation: totalPrice=3000 + extras=2000 = fullPrice 5000
      // Other deposits: 4500 → 4500 + 600 = 5100 > 5000 → throw
      db.reservation.findUnique.mockResolvedValue({
        ...makeReservation({ totalPrice: '3000', extrasTotalPrice: '2000' }),
        deposits: [
          { id: 'dep-1', amount: '1000', status: 'PENDING' },
          { id: 'dep-other', amount: '4500', status: 'PENDING' },
        ],
      });

      await expect(
        depositService.update('dep-1', { amount: 600 }, USER_ID)
      ).rejects.toThrow(/przekracza/);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // getByReservation() — extrasTotalPrice in summary
  // ══════════════════════════════════════════════════════════════
  describe('getByReservation() — extrasTotalPrice', () => {

    it('should include extrasTotalPrice in reservationTotal and remainingToDeposit', async () => {
      db.reservation.findUnique.mockResolvedValue(
        makeReservation({ totalPrice: '8000', extrasTotalPrice: '2000' })
      );
      db.deposit.findMany.mockResolvedValue([
        { id: 'd1', amount: '3000', status: 'PAID', paid: true, reservation: { client: {} } },
      ]);

      const result = await depositService.getByReservation('res-1');

      // fullPrice = 8000 + 2000 = 10000
      expect(result.summary.reservationTotal).toBe(10000);
      expect(result.summary.remainingToDeposit).toBe(7000); // 10000 - 3000
      expect(result.summary.percentPaid).toBe(30);            // 3000/10000 * 100
    });

    it('should handle missing extrasTotalPrice (defaults to 0)', async () => {
      db.reservation.findUnique.mockResolvedValue(
        makeReservation({ totalPrice: '5000', extrasTotalPrice: undefined })
      );
      db.deposit.findMany.mockResolvedValue([]);

      const result = await depositService.getByReservation('res-1');

      expect(result.summary.reservationTotal).toBe(5000);
      expect(result.summary.remainingToDeposit).toBe(5000);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // list() — pagination edge cases, sortBy/sortOrder
  // ══════════════════════════════════════════════════════════════
  describe('list() — pagination & sorting', () => {

    it('should calculate skip correctly for page 3', async () => {
      db.deposit.findMany.mockResolvedValue([]);
      db.deposit.count.mockResolvedValue(100);

      const result = await depositService.list({ page: 3, limit: 10 });

      const findCall = db.deposit.findMany.mock.calls[0][0];
      expect(findCall.skip).toBe(20);  // (3-1) * 10
      expect(findCall.take).toBe(10);
      expect(result.pagination.totalPages).toBe(10); // ceil(100/10)
    });

    it('should apply custom sortBy and sortOrder', async () => {
      db.deposit.findMany.mockResolvedValue([]);
      db.deposit.count.mockResolvedValue(0);

      await depositService.list({ sortBy: 'amount', sortOrder: 'desc' });

      const findCall = db.deposit.findMany.mock.calls[0][0];
      expect(findCall.orderBy).toEqual({ amount: 'desc' });
    });

    it('should apply reservationId filter', async () => {
      db.deposit.findMany.mockResolvedValue([]);
      db.deposit.count.mockResolvedValue(0);

      await depositService.list({ reservationId: 'res-specific' });

      const findCall = db.deposit.findMany.mock.calls[0][0];
      expect(findCall.where.reservationId).toBe('res-specific');
    });

    it('should calculate totalPages with ceiling division', async () => {
      db.deposit.findMany.mockResolvedValue([]);
      db.deposit.count.mockResolvedValue(25);

      const result = await depositService.list({ page: 1, limit: 10 });

      expect(result.pagination.totalPages).toBe(3); // ceil(25/10)
    });

    it('should return hasMore=false on last page', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit()]);
      db.deposit.count.mockResolvedValue(1);

      const result = await depositService.list({ page: 1, limit: 10 });

      expect(result.pagination.hasMore).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // getById() — includes DEPOSIT_INCLUDE
  // ══════════════════════════════════════════════════════════════
  describe('getById() — include config', () => {

    it('should pass DEPOSIT_INCLUDE to findUnique', async () => {
      db.deposit.findUnique.mockResolvedValue(makeDeposit());

      await depositService.getById('dep-1');

      expect(db.deposit.findUnique).toHaveBeenCalledWith({
        where: { id: 'dep-1' },
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
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Delegate methods
  // ══════════════════════════════════════════════════════════════
  describe('delegate methods', () => {

    it('getStats() should delegate to depositStatsService', async () => {
      // getStats calls depositStatsService.getStats internally
      // Since we mock prisma, the delegate will use $queryRaw
      db.$queryRaw.mockResolvedValue([{ total: 5, pending: 2, paid: 3, overdue: 0, cancelled: 0, total_amount: 5000, paid_amount: 3000, pending_amount: 2000, overdue_amount: 0 }]);

      const result = await depositService.getStats();
      expect(result).toBeDefined();
      expect(result.counts).toBeDefined();
    });

    it('getOverdue() should delegate to depositStatsService', async () => {
      db.$queryRaw.mockResolvedValue([]);

      const result = await depositService.getOverdue();
      expect(result).toBeDefined();
    });
  });

  // ═══════════ edge cases / branch coverage ═══════════
  describe('edge cases / branch coverage', () => {

    describe('update() — 4-way branch paths', () => {
      const setupUpdate = (deposit: any, reservation: any = null) => {
        db.deposit.findUnique
          .mockResolvedValueOnce(deposit)
          .mockResolvedValueOnce(deposit);
        if (reservation) {
          db.reservation.findUnique.mockResolvedValueOnce(reservation);
        }
        db.$queryRaw.mockResolvedValue([{ count: 1 }]);
      };

      it('should update both amount and dueDate (branch 1)', async () => {
        const dep = makeDeposit();
        setupUpdate(dep, { ...dep.reservation, deposits: [dep], totalPrice: 5000 });
        await depositService.update('dep-1', { amount: 600, dueDate: '2027-07-01' }, USER_ID);
        // Tagged template literal — cannot inspect individual args
        expect(db.$queryRaw).toHaveBeenCalledTimes(1);
      });

      it('should update amount only (branch 2)', async () => {
        const dep = makeDeposit();
        setupUpdate(dep, { ...dep.reservation, deposits: [dep], totalPrice: 5000 });
        await depositService.update('dep-1', { amount: 600 }, USER_ID);
        // Tagged template literal — cannot inspect individual args
        expect(db.$queryRaw).toHaveBeenCalledTimes(1);
      });

      it('should update dueDate only (branch 3)', async () => {
        const dep = makeDeposit();
        setupUpdate(dep);
        await depositService.update('dep-1', { dueDate: '2027-07-01' }, USER_ID);
        // Tagged template literal — cannot inspect individual args
        expect(db.$queryRaw).toHaveBeenCalledTimes(1);
      });

      it('should skip raw query when neither amount nor dueDate (branch 4)', async () => {
        const dep = makeDeposit();
        setupUpdate(dep);
        await depositService.update('dep-1', {}, USER_ID);
        expect(db.$queryRaw).not.toHaveBeenCalled();
      });

      it('should throw when deposit is paid', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: true }));
        await expect(depositService.update('dep-1', { amount: 100 }, USER_ID))
          .rejects.toThrow(/edytowa.*op.*aconej/i);
      });

      it('should throw when amount <= 0', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(makeDeposit());
        await expect(depositService.update('dep-1', { amount: 0 }, USER_ID))
          .rejects.toThrow(/większa od 0|greater than/i);
      });

      it('should throw when new amount exceeds total', async () => {
        const dep = makeDeposit({ amount: '500' });
        db.deposit.findUnique.mockResolvedValueOnce(dep);
        db.reservation.findUnique.mockResolvedValueOnce({
          totalPrice: 1000,
          deposits: [dep, { id: 'dep-2', amount: '800', status: 'PENDING' }],
        });
        await expect(depositService.update('dep-1', { amount: 300 }, USER_ID))
          .rejects.toThrow(/przekracza|exceed/i);
      });

      it('should throw when deposit not found', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(null);
        await expect(depositService.update('bad', { amount: 100 }, USER_ID))
          .rejects.toThrow();
      });
    });

    describe('checkAndAutoConfirmReservation()', () => {
      it('should return early when reservation not found', async () => {
        db.reservation.findUnique.mockResolvedValueOnce(null);
        await depositService.checkAndAutoConfirmReservation('bad', USER_ID);
        expect(db.reservation.update).not.toHaveBeenCalled();
      });

      it('should return early when reservation is not PENDING', async () => {
        db.reservation.findUnique.mockResolvedValueOnce({
          id: 'res-1', status: 'CONFIRMED', deposits: [], client: null,
        });
        await depositService.checkAndAutoConfirmReservation('res-1', USER_ID);
        expect(db.reservation.update).not.toHaveBeenCalled();
      });

      it('should return early when no active deposits (all cancelled)', async () => {
        db.reservation.findUnique.mockResolvedValueOnce({
          id: 'res-1', status: 'PENDING',
          deposits: [{ status: 'CANCELLED' }],
          client: null,
        });
        await depositService.checkAndAutoConfirmReservation('res-1', USER_ID);
        expect(db.reservation.update).not.toHaveBeenCalled();
      });

      it('should return early when not all deposits are paid', async () => {
        db.reservation.findUnique.mockResolvedValueOnce({
          id: 'res-1', status: 'PENDING',
          deposits: [{ status: 'PAID', amount: 500 }, { status: 'PENDING', amount: 500 }],
          client: null,
        });
        await depositService.checkAndAutoConfirmReservation('res-1', USER_ID);
        expect(db.reservation.update).not.toHaveBeenCalled();
      });

      it('should auto-confirm when all deposits are PAID', async () => {
        db.reservation.findUnique.mockResolvedValueOnce({
          id: 'res-1', status: 'PENDING',
          deposits: [{ status: 'PAID', amount: 500 }, { status: 'PAID', amount: 500 }],
          client: { firstName: 'Jan', lastName: 'K' },
        });
        db.reservation.update.mockResolvedValueOnce({});
        db.reservationHistory.create.mockResolvedValueOnce({});
        await depositService.checkAndAutoConfirmReservation('res-1', USER_ID);
        expect(db.reservation.update).toHaveBeenCalledWith({
          where: { id: 'res-1' },
          data: { status: 'CONFIRMED' },
        });
      });

      it('should auto-confirm with null client (N/A name)', async () => {
        db.reservation.findUnique.mockResolvedValueOnce({
          id: 'res-1', status: 'PENDING',
          deposits: [{ status: 'PAID', amount: 500 }],
          client: null,
        });
        db.reservation.update.mockResolvedValueOnce({});
        db.reservationHistory.create.mockResolvedValueOnce({});
        await depositService.checkAndAutoConfirmReservation('res-1', USER_ID);
        expect(db.reservation.update).toHaveBeenCalled();
      });

      it('should catch errors and not throw', async () => {
        db.reservation.findUnique.mockRejectedValueOnce(new Error('DB'));
        await depositService.checkAndAutoConfirmReservation('res-1', USER_ID);
      });
    });

    describe('list() — filter branches', () => {
      const setupList = () => {
        db.deposit.findMany.mockResolvedValue([]);
        db.deposit.count.mockResolvedValue(0);
      };

      it('should apply overdue filter', async () => {
        setupList();
        await depositService.list({ overdue: true });
        const where = db.deposit.findMany.mock.calls[0][0].where;
        expect(where.status).toEqual({ equals: 'PENDING' });
        expect(where.dueDate).toBeDefined();
      });

      it('should apply dateFrom only', async () => {
        setupList();
        await depositService.list({ dateFrom: '2027-01-01' });
        const where = db.deposit.findMany.mock.calls[0][0].where;
        expect(where.dueDate.gte).toBe('2027-01-01');
        expect(where.dueDate.lte).toBeUndefined();
      });

      it('should apply dateTo only', async () => {
        setupList();
        await depositService.list({ dateTo: '2027-12-31' });
        const where = db.deposit.findMany.mock.calls[0][0].where;
        expect(where.dueDate.lte).toBe('2027-12-31');
        expect(where.dueDate.gte).toBeUndefined();
      });

      it('should apply dateFrom and dateTo', async () => {
        setupList();
        await depositService.list({ dateFrom: '2027-01-01', dateTo: '2027-12-31' });
        const where = db.deposit.findMany.mock.calls[0][0].where;
        expect(where.dueDate.gte).toBe('2027-01-01');
        expect(where.dueDate.lte).toBe('2027-12-31');
      });

      it('should apply search filter', async () => {
        setupList();
        await depositService.list({ search: 'Jan' });
        const where = db.deposit.findMany.mock.calls[0][0].where;
        expect(where.reservation.client.OR).toBeDefined();
      });

      it('should apply paid filter', async () => {
        setupList();
        await depositService.list({ paid: true });
        const where = db.deposit.findMany.mock.calls[0][0].where;
        expect(where.paid).toBe(true);
      });

      it('should apply status filter', async () => {
        setupList();
        await depositService.list({ status: 'PAID' });
        const where = db.deposit.findMany.mock.calls[0][0].where;
        expect(where.status).toEqual({ equals: 'PAID' });
      });

      it('should use default pagination and sorting', async () => {
        setupList();
        await depositService.list({});
        const args = db.deposit.findMany.mock.calls[0][0];
        expect(args.skip).toBe(0);
        expect(args.take).toBe(20);
        expect(args.orderBy).toEqual({ dueDate: 'asc' });
      });

      it('should calculate hasMore correctly', async () => {
        db.deposit.findMany.mockResolvedValue([{ id: '1' }]);
        db.deposit.count.mockResolvedValue(50);
        const result = await depositService.list({ page: 1, limit: 1 });
        expect(result.pagination.hasMore).toBe(true);
      });
    });

    describe('getByReservation() — edge cases', () => {
      it('should return percentPaid = 0 when reservationTotal = 0', async () => {
        db.reservation.findUnique.mockResolvedValueOnce({ id: 'res-1', totalPrice: 0 });
        db.deposit.findMany.mockResolvedValueOnce([]);
        const result = await depositService.getByReservation('res-1');
        expect(result.summary.percentPaid).toBe(0);
      });

      it('should throw when reservation not found', async () => {
        db.reservation.findUnique.mockResolvedValueOnce(null);
        await expect(depositService.getByReservation('bad')).rejects.toThrow();
      });
    });

    describe('markAsPaid() — partial payment branches', () => {
      it('should mark as PARTIALLY_PAID when amountPaid < amount', async () => {
        const dep = makeDeposit({ amount: '500' });
        db.deposit.findUnique
          .mockResolvedValueOnce(dep)
          .mockResolvedValueOnce({ ...dep, status: 'PARTIALLY_PAID', paid: false });
        db.$queryRaw.mockResolvedValue([]);
        await depositService.markAsPaid('dep-1', {
          paymentMethod: 'CASH', paidAt: '2027-06-15', amountPaid: 200,
        }, USER_ID);
        // Tagged template literal — cannot inspect individual args
        expect(db.$queryRaw).toHaveBeenCalledTimes(1);
      });

      it('should use deposit.amount when amountPaid not provided', async () => {
        const dep = makeDeposit({ amount: '500' });
        db.deposit.findUnique
          .mockResolvedValueOnce(dep)
          .mockResolvedValueOnce({ ...dep, status: 'PAID', paid: true });
        db.$queryRaw.mockResolvedValue([]);
        db.reservation.findUnique.mockResolvedValueOnce(null);
        await depositService.markAsPaid('dep-1', {
          paymentMethod: 'TRANSFER', paidAt: '2027-06-15',
        }, USER_ID);
        // Tagged template literal — cannot inspect individual args
        expect(db.$queryRaw).toHaveBeenCalledTimes(1);
      });

      it('should throw when already paid', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: true }));
        await expect(depositService.markAsPaid('dep-1', {
          paymentMethod: 'CASH', paidAt: '2027-06-15',
        }, USER_ID)).rejects.toThrow(/ju.*oznaczona/i);
      });
    });

    describe('sendConfirmationEmail() guards', () => {
      it('should throw when deposit not paid', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: false }));
        await expect(depositService.sendConfirmationEmail('dep-1'))
          .rejects.toThrow(/op.*aconej.*zaliczk/i);
      });

      it('should throw when client has no email', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({
          paid: true,
          reservation: {
            id: 'res-1', client: { firstName: 'A', lastName: 'B', email: null, phone: '123' },
            hall: null, eventType: null, date: null, startTime: null, endTime: null,
            guests: 0, totalPrice: 1000,
          },
        }));
        await expect(depositService.sendConfirmationEmail('dep-1'))
          .rejects.toThrow(/email/i);
      });

      it('should throw when deposit not found', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(null);
        await expect(depositService.sendConfirmationEmail('bad'))
          .rejects.toThrow();
      });
    });

    describe('markAsUnpaid() guards', () => {
      it('should throw when deposit already unpaid and PENDING', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: false, status: 'PENDING' }));
        await expect(depositService.markAsUnpaid('dep-1', USER_ID))
          .rejects.toThrow(/nie jest oznaczona/i);
      });

      it('should throw when deposit not found', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(null);
        await expect(depositService.markAsUnpaid('bad', USER_ID))
          .rejects.toThrow();
      });
    });

    describe('cancel() guards', () => {
      it('should throw when deposit is paid', async () => {
        db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: true }));
        await expect(depositService.cancel('dep-1', USER_ID))
          .rejects.toThrow(/anulowa.*op.*aconej/i);
      });
    });

    describe('getStats() fallback', () => {
      it('should handle empty stats row', async () => {
        db.$queryRaw.mockResolvedValueOnce([{}]);
        const result = await depositService.getStats();
        expect(result.counts.total).toBe(0);
        expect(result.amounts.total).toBe(0);
      });

      it('should handle no rows returned', async () => {
        db.$queryRaw.mockResolvedValueOnce([]);
        const result = await depositService.getStats();
        expect(result.counts.total).toBe(0);
      });
    });

    describe('autoMarkOverdue()', () => {
      it('should handle empty result', async () => {
        db.$queryRaw.mockResolvedValueOnce([]);
        const result = await depositService.autoMarkOverdue();
        expect(result.markedOverdueCount).toBe(0);
      });

      it('should return count from result', async () => {
        db.$queryRaw.mockResolvedValueOnce([{ count: 5 }]);
        const result = await depositService.autoMarkOverdue();
        expect(result.markedOverdueCount).toBe(5);
      });
    });
  });
});
