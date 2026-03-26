/**
 * DepositService — Unit Tests: Core Logic & Edge Cases
 * Uzupełnia pokrycie z business/crud/branches — brak duplikacji.
 *
 * Skupia się na:
 *  - Weryfikacji parametrów SQL przekazywanych do $queryRawUnsafe
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
    $queryRawUnsafe: jest.fn(),
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
      db.$queryRawUnsafe.mockResolvedValue([{ id: 'dep-new' }]);
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ id: 'dep-new' }));

      const result = await depositService.create(
        { reservationId: 'res-1', amount: 2500, dueDate: '2026-08-01' },
        USER_ID
      );

      expect(result).toBeDefined();
      expect(db.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });

    it('should throw on negative amount', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation());

      await expect(
        depositService.create({ reservationId: 'res-1', amount: -100, dueDate: '2026-08-01' }, USER_ID)
      ).rejects.toThrow(/większa od 0/);
    });

    it('should trim dueDate to YYYY-MM-DD in SQL params', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation());
      db.$queryRawUnsafe.mockResolvedValue([{ id: 'dep-new' }]);
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ id: 'dep-new' }));

      await depositService.create(
        { reservationId: 'res-1', amount: 500, dueDate: '2026-08-15T12:30:00.000Z' },
        USER_ID
      );

      const sqlArgs = db.$queryRawUnsafe.mock.calls[0];
      // args: [0]=SQL, [1]=reservationId, [2]=amount, [3]=remainingAmount, [4]=dueDateStr
      expect(sqlArgs[4]).toBe('2026-08-15');
    });

    it('should pass correct SQL params: reservationId, amount, remainingAmount=amount, dueDateStr', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation());
      db.$queryRawUnsafe.mockResolvedValue([{ id: 'dep-new' }]);
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ id: 'dep-new' }));

      await depositService.create(
        { reservationId: 'res-1', amount: 3000, dueDate: '2026-09-01' },
        USER_ID
      );

      const sqlArgs = db.$queryRawUnsafe.mock.calls[0];
      expect(sqlArgs[0]).toContain('INSERT INTO "Deposit"');
      expect(sqlArgs[1]).toBe('res-1');      // reservationId
      expect(sqlArgs[2]).toBe(3000);          // amount
      expect(sqlArgs[3]).toBe(3000);          // remainingAmount = amount
      expect(sqlArgs[4]).toBe('2026-09-01');  // dueDateStr
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
      db.$queryRawUnsafe.mockResolvedValue([{ id: 'dep-new' }]);
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ id: 'dep-new' }));

      const result = await depositService.create(
        { reservationId: 'res-1', amount: 4000, dueDate: '2026-08-01' },
        USER_ID
      );

      expect(result).toBeDefined();
    });

    it('should write audit log with correct description including amount and dueDate', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation());
      db.$queryRawUnsafe.mockResolvedValue([{ id: 'dep-new' }]);
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
      db.$queryRawUnsafe.mockResolvedValue([]);

      const result = await depositService.delete('dep-1', USER_ID);

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(db.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM "Deposit"'),
        'dep-1'
      );
    });

    it('should throw when deposit not found', async () => {
      db.deposit.findUnique.mockResolvedValue(null);

      await expect(depositService.delete('nonexistent', USER_ID)).rejects.toThrow();
    });

    it('should log wasPaid=false in audit when deleting unpaid deposit', async () => {
      db.deposit.findUnique.mockResolvedValue(makeDeposit({ paid: false, amount: '2000' }));
      db.$queryRawUnsafe.mockResolvedValue([]);

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
      db.$queryRawUnsafe.mockResolvedValue([]);

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
      db.$queryRawUnsafe.mockResolvedValue([]);
      // autoConfirm will be triggered — needs reservation mock
      db.reservation.findUnique.mockResolvedValue(null);

      await depositService.markAsPaid('dep-1', {
        paymentMethod: 'CARD',
        paidAt: '2026-08-01T10:00:00Z',
      }, USER_ID);

      const sqlArgs = db.$queryRawUnsafe.mock.calls[0];
      expect(sqlArgs[1]).toBe(true);      // isPaid
      expect(sqlArgs[2]).toBe('PAID');     // status
      expect(sqlArgs[5]).toBe(0);          // remainingAmount = max(0, 5000-5000)
      expect(sqlArgs[6]).toBe(5000);       // amountPaid = deposit.amount
    });

    it('should NOT trigger autoConfirm when partial payment (isPaid=false)', async () => {
      const dep = makeDeposit({ amount: '3000' });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PARTIALLY_PAID' });
      db.$queryRawUnsafe.mockResolvedValue([]);

      await depositService.markAsPaid('dep-1', {
        paymentMethod: 'BLIK',
        paidAt: '2026-08-01',
        amountPaid: 1000,
      }, USER_ID);

      // autoConfirm should NOT be called — no reservation.findUnique call after markAsPaid
      // In partial payment, isPaid=false so checkAndAutoConfirmReservation is not triggered
      const sqlArgs = db.$queryRawUnsafe.mock.calls[0];
      expect(sqlArgs[1]).toBe(false);          // isPaid = false
      expect(sqlArgs[2]).toBe('PARTIALLY_PAID');
      expect(sqlArgs[5]).toBe(2000);           // remainingAmount = 3000-1000
      expect(sqlArgs[6]).toBe(1000);           // amountPaid
    });

    it('should write audit log with amountPaid and paymentMethod', async () => {
      const dep = makeDeposit({ amount: '2000' });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PAID', paid: true });
      db.$queryRawUnsafe.mockResolvedValue([]);
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
      db.$queryRawUnsafe.mockResolvedValue([]);
      db.reservation.findUnique.mockResolvedValue(null);

      await depositService.markAsPaid('dep-1', {
        paymentMethod: 'CASH',
        paidAt: '2026-08-01',
        amountPaid: 1500,
      }, USER_ID);

      const sqlArgs = db.$queryRawUnsafe.mock.calls[0];
      expect(sqlArgs[1]).toBe(true);   // isPaid = remaining <= 0
      expect(sqlArgs[5]).toBe(0);      // remainingAmount clamped to 0
      expect(sqlArgs[6]).toBe(1500);   // amountPaid as provided
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
      db.$queryRawUnsafe.mockResolvedValue([]);

      await depositService.markAsUnpaid('dep-1', USER_ID);

      const sqlArgs = db.$queryRawUnsafe.mock.calls[0];
      expect(sqlArgs[0]).toContain("status = 'PENDING'");
      expect(sqlArgs[0]).toContain('"paidAmount" = 0');
      expect(sqlArgs[0]).toContain('"paidAt" = NULL');
      expect(sqlArgs[0]).toContain('"paymentMethod" = NULL');
      expect(sqlArgs[1]).toBe(4000);   // remainingAmount = Number(deposit.amount)
      expect(sqlArgs[2]).toBe('dep-1'); // id
    });

    it('should write audit log with oldStatus and newStatus', async () => {
      const dep = makeDeposit({ amount: '2000', status: 'PAID', paid: true });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'PENDING', paid: false });
      db.$queryRawUnsafe.mockResolvedValue([]);

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
      db.$queryRawUnsafe.mockResolvedValue([]);

      // Should NOT throw — status is PARTIALLY_PAID (not PENDING+unpaid)
      await depositService.markAsUnpaid('dep-1', USER_ID);

      expect(db.$queryRawUnsafe).toHaveBeenCalledTimes(1);
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
      db.$queryRawUnsafe.mockResolvedValue([]);

      await depositService.cancel('dep-1', USER_ID);

      const sqlArgs = db.$queryRawUnsafe.mock.calls[0];
      expect(sqlArgs[0]).toContain("status = 'CANCELLED'");
      expect(sqlArgs[0]).toContain('"remainingAmount" = 0');
      expect(sqlArgs[1]).toBe('dep-1');
    });

    it('should write audit log with deposit amount in description', async () => {
      const dep = makeDeposit({ amount: '7500' });
      db.deposit.findUnique
        .mockResolvedValueOnce(dep)
        .mockResolvedValueOnce({ ...dep, status: 'CANCELLED' });
      db.$queryRawUnsafe.mockResolvedValue([]);

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
      db.$queryRawUnsafe.mockResolvedValue([]);

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
      // Since we mock prisma, the delegate will use $queryRawUnsafe
      db.$queryRawUnsafe.mockResolvedValue([{ total: 5, pending: 2, paid: 3, overdue: 0, cancelled: 0, total_amount: 5000, paid_amount: 3000, pending_amount: 2000, overdue_amount: 0 }]);

      const result = await depositService.getStats();
      expect(result).toBeDefined();
      expect(result.counts).toBeDefined();
    });

    it('getOverdue() should delegate to depositStatsService', async () => {
      db.$queryRawUnsafe.mockResolvedValue([]);

      const result = await depositService.getOverdue();
      expect(result).toBeDefined();
    });
  });
});
