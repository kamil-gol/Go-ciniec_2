/**
 * DepositService — Unit Tests: CRUD
 * Część 1/2 testów modułu Zaliczki
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

const mockPrisma = prisma as any;

const TEST_USER_ID = 'user-uuid-001';

const TEST_RESERVATION = {
  id: 'res-uuid-001',
  totalPrice: '10000',
  status: 'PENDING',
  deposits: [],
  client: { id: 'cl-1', firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.pl', phone: '+48123' },
};

const TEST_DEPOSIT = {
  id: 'dep-uuid-001',
  reservationId: 'res-uuid-001',
  amount: '2000',
  remainingAmount: '2000',
  paidAmount: '0',
  dueDate: '2026-06-01',
  status: 'PENDING',
  paid: false,
  paidAt: null,
  paymentMethod: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  reservation: {
    id: 'res-uuid-001',
    client: TEST_RESERVATION.client,
    hall: { name: 'Sala' },
    eventType: { name: 'Wesele' },
  },
};

beforeEach(() => {
  jest.clearAllMocks();

  mockPrisma.reservation.findUnique.mockResolvedValue(TEST_RESERVATION);
  mockPrisma.deposit.findUnique.mockResolvedValue(TEST_DEPOSIT);
  mockPrisma.deposit.findMany.mockResolvedValue([]);
  mockPrisma.deposit.count.mockResolvedValue(0);
  mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 'dep-new-001' }]);
  mockPrisma.reservationHistory.create.mockResolvedValue({});
});

describe('DepositService', () => {

  // ══════════════════════════════════════════════════════════════
  // create
  // ══════════════════════════════════════════════════════════════
  describe('create()', () => {

    it('should create deposit via raw SQL and return it', async () => {
      const result = await depositService.create({
        reservationId: 'res-uuid-001',
        amount: 2000,
        dueDate: '2026-06-01T00:00:00.000Z',
      }, TEST_USER_ID);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
      expect(mockPrisma.deposit.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(depositService.create({
        reservationId: 'nonexistent',
        amount: 500,
        dueDate: '2026-06-01',
      }, TEST_USER_ID)).rejects.toThrow();
    });

    it('should throw when amount is 0 or negative', async () => {
      await expect(depositService.create({
        reservationId: 'res-uuid-001',
        amount: 0,
        dueDate: '2026-06-01',
      }, TEST_USER_ID)).rejects.toThrow(/większa od 0/);
    });

    it('should throw when sum of deposits exceeds reservation total', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...TEST_RESERVATION,
        totalPrice: '10000',
        deposits: [
          { id: 'd1', amount: '8000', status: 'PENDING' },
        ],
      });

      await expect(depositService.create({
        reservationId: 'res-uuid-001',
        amount: 3000, // 8000 + 3000 = 11000 > 10000
        dueDate: '2026-06-01',
      }, TEST_USER_ID)).rejects.toThrow(/przekracza/);
    });

    it('should call logChange with CREATE action', async () => {
      await depositService.create({
        reservationId: 'res-uuid-001',
        amount: 1000,
        dueDate: '2026-06-01',
      }, TEST_USER_ID);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          action: 'CREATE',
          entityType: 'DEPOSIT',
        })
      );
    });
  });

  // ══════════════════════════════════════════════════════════════
  // getById
  // ══════════════════════════════════════════════════════════════
  describe('getById()', () => {

    it('should return deposit with reservation include', async () => {
      const result = await depositService.getById('dep-uuid-001');
      expect(result.id).toBe('dep-uuid-001');
      expect(result.reservation).toBeDefined();
    });

    it('should throw when deposit not found', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(null);
      await expect(depositService.getById('nonexistent')).rejects.toThrow();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // getByReservation
  // ══════════════════════════════════════════════════════════════
  describe('getByReservation()', () => {

    it('should calculate summary correctly', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({ ...TEST_RESERVATION, totalPrice: '10000' });
      mockPrisma.deposit.findMany.mockResolvedValue([
        { id: 'd1', amount: '3000', status: 'PAID', paid: true, reservation: { client: {} } },
        { id: 'd2', amount: '2000', status: 'PENDING', paid: false, reservation: { client: {} } },
        { id: 'd3', amount: '1000', status: 'CANCELLED', paid: false, reservation: { client: {} } },
      ]);

      const result = await depositService.getByReservation('res-uuid-001');

      expect(result.deposits).toHaveLength(3);
      expect(result.summary.totalAmount).toBe(5000);       // 3000 + 2000 (no cancelled)
      expect(result.summary.paidAmount).toBe(3000);         // only paid
      expect(result.summary.pendingAmount).toBe(2000);      // 5000 - 3000
      expect(result.summary.remainingToDeposit).toBe(5000); // 10000 - 5000
      expect(result.summary.percentPaid).toBe(30);          // 3000/10000 * 100
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(depositService.getByReservation('nonexistent')).rejects.toThrow();
    });

    it('should exclude cancelled deposits from totalAmount', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({ ...TEST_RESERVATION, totalPrice: '5000' });
      mockPrisma.deposit.findMany.mockResolvedValue([
        { id: 'd1', amount: '2000', status: 'CANCELLED', paid: false, reservation: { client: {} } },
        { id: 'd2', amount: '1000', status: 'PENDING', paid: false, reservation: { client: {} } },
      ]);

      const result = await depositService.getByReservation('res-uuid-001');

      expect(result.summary.totalAmount).toBe(1000);       // only non-cancelled
      expect(result.summary.activeDeposits).toBe(1);        // 1 active
      expect(result.summary.totalDeposits).toBe(2);         // total count
    });
  });

  // ══════════════════════════════════════════════════════════════
  // list
  // ══════════════════════════════════════════════════════════════
  describe('list()', () => {

    it('should return paginated results', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([TEST_DEPOSIT]);
      mockPrisma.deposit.count.mockResolvedValue(1);

      const result = await depositService.list({ page: 1, limit: 20 });

      expect(result.deposits).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalCount).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should apply status filter', async () => {
      await depositService.list({ status: 'PAID' });

      const call = mockPrisma.deposit.findMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ equals: 'PAID' });
    });

    it('should apply overdue filter', async () => {
      await depositService.list({ overdue: true });

      const call = mockPrisma.deposit.findMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ equals: 'PENDING' });
      expect(call.where.dueDate).toBeDefined();
      expect(call.where.dueDate.lt).toBeDefined();
    });

    it('should apply search filter on client name', async () => {
      await depositService.list({ search: 'Kowalski' });

      const call = mockPrisma.deposit.findMany.mock.calls[0][0];
      expect(call.where.reservation.client.OR).toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // update
  // ══════════════════════════════════════════════════════════════
  describe('update()', () => {

    it('should update amount and dueDate via raw SQL', async () => {
      await depositService.update('dep-uuid-001', {
        amount: 2500,
        dueDate: '2026-07-01',
      }, TEST_USER_ID);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
      const sqlCall = mockPrisma.$queryRawUnsafe.mock.calls[0];
      expect(sqlCall[0]).toContain('amount');
      expect(sqlCall[0]).toContain('dueDate');
    });

    it('should throw when deposit is paid', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue({
        ...TEST_DEPOSIT,
        paid: true,
      });

      await expect(depositService.update('dep-uuid-001', { amount: 3000 }, TEST_USER_ID))
        .rejects.toThrow(/opłaconej/);
    });

    it('should throw when amount is 0', async () => {
      await expect(depositService.update('dep-uuid-001', { amount: 0 }, TEST_USER_ID))
        .rejects.toThrow(/większa od 0/);
    });

    it('should throw when new amount exceeds reservation total', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...TEST_RESERVATION,
        totalPrice: '5000',
        deposits: [
          { id: 'dep-uuid-001', amount: '2000', status: 'PENDING' },
          { id: 'dep-other', amount: '3000', status: 'PENDING' },
        ],
      });

      // Trying to set dep-uuid-001 to 3000, other is 3000 => 6000 > 5000
      await expect(depositService.update('dep-uuid-001', { amount: 3000 }, TEST_USER_ID))
        .rejects.toThrow(/przekracza/);
    });

    it('should update dueDate only when no amount provided', async () => {
      await depositService.update('dep-uuid-001', {
        dueDate: '2026-07-15',
      }, TEST_USER_ID);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
      const sqlCall = mockPrisma.$queryRawUnsafe.mock.calls[0];
      expect(sqlCall[0]).toContain('dueDate');
      expect(sqlCall[0]).not.toContain('amount = $1');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // delete
  // ══════════════════════════════════════════════════════════════
  describe('delete()', () => {

    it('should delete via raw SQL and return success', async () => {
      const result = await depositService.delete('dep-uuid-001', TEST_USER_ID);

      expect(result.success).toBe(true);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
      const sqlCall = mockPrisma.$queryRawUnsafe.mock.calls[0];
      expect(sqlCall[0]).toContain('DELETE');
    });

    it('should throw when deposit not found', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(null);
      await expect(depositService.delete('nonexistent', TEST_USER_ID)).rejects.toThrow();
    });

    it('should throw when deposit is paid', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue({ ...TEST_DEPOSIT, paid: true });
      await expect(depositService.delete('dep-uuid-001', TEST_USER_ID))
        .rejects.toThrow(/opłaconej/);
    });
  });
});
