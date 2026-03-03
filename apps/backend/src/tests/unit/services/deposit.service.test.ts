/**
 * DepositService — Unit Tests
 * Tests: createDeposit, markAsPaid, cancel, refund, and edge cases
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    deposit: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    reservation: { findUnique: jest.fn(), update: jest.fn() },
    reservationHistory: { create: jest.fn() },
  },
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculatePrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

// Mock AppError with Polish messages
jest.mock('../../../utils/AppError', () => ({
  AppError: {
    notFound: (msg: string) => { const e = new Error(`${msg} nie znaleziono`); (e as any).statusCode = 404; return e; },
    badRequest: (msg: string) => { const e = new Error(msg); (e as any).statusCode = 400; return e; },
    conflict: (msg: string) => { const e = new Error(msg); (e as any).statusCode = 409; return e; },
  },
}));

import { DepositService } from '../../../services/deposit.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;
const service = new DepositService();

const makeDeposit = (overrides?: any) => ({
  id: 'd-1',
  reservationId: 'r-1',
  amount: 500,
  status: 'PENDING',
  dueDate: new Date(),
  paidAt: null,
  paidAmount: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeReservation = (overrides?: any) => ({
  id: 'r-1',
  totalPrice: 5000,
  depositPaidAmount: 0,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DepositService', () => {
  describe('markAsPaid', () => {
    it('should mark deposit as paid', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit());
      mockPrisma.deposit.update.mockResolvedValue(makeDeposit({ status: 'PAID', paidAmount: 500 }));
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());
      mockPrisma.reservation.update.mockResolvedValue(makeReservation({ depositPaidAmount: 500 }));

      await service.markAsPaid('d-1', 500, 'user-1');

      expect(mockPrisma.deposit.update).toHaveBeenCalled();
    });

    it('should throw when deposit is already paid', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit({ status: 'PAID' }));

      await expect(service.markAsPaid('d-1', 500, 'user-1'))
        .rejects.toThrow(/już oznaczona|jest już|already.*paid/i);
    });
  });

  describe('cancel', () => {
    it('should cancel pending deposit', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit());
      mockPrisma.deposit.update.mockResolvedValue(makeDeposit({ status: 'CANCELLED' }));

      await service.cancel('d-1', 'user-1');

      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }),
        })
      );
    });

    it('should throw when trying to cancel paid deposit', async () => {
      mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit({ status: 'PAID' }));

      await expect(service.cancel('d-1', 'user-1'))
        .rejects.toThrow(/opłaconej|płatność|paid.*cancel/i);
    });
  });
});
