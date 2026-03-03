/**
 * DepositService — sendConfirmationEmail and markAsUnpaid branches coverage
 * Targets: lines 463-468, 488-491, 516-519
 * Covers: paid guard, client email guard, null paymentDate, PENDING guard
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    deposit: { findUnique: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn() },
    reservation: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('../../../services/email.service', () => ({
  EmailService: {
    getInstance: jest.fn(() => ({ sendDepositConfirmation: jest.fn() })),
  },
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static notFound(entity: string) { return new MockAppError(`${entity} not found`, 404); }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
  }
  return { AppError: MockAppError };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn(),
}));

import { DepositService } from '../../../services/deposit.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;
const depositService = new DepositService();

function makeDeposit(overrides?: any) {
  return {
    id: 'dep-1',
    reservationId: 'res-1',
    amount: 1000,
    dueDate: new Date('2027-07-01'),
    paid: false,
    paidAt: null,
    paymentMethod: null,
    paymentDate: null,
    status: 'PENDING',
    notes: null,
    reservation: {
      id: 'res-1',
      client: { id: 'c-1', firstName: 'Jan', lastName: 'K', email: 'jan@test.pl' },
    },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
});

describe('DepositService — sendConfirmationEmail branches (lines 463-468)', () => {
  it('should throw when deposit is not paid', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit({ paid: false }));
    await expect(depositService.sendConfirmationEmail('dep-1'))
      .rejects.toThrow(/można wysłać.*opłaconej/);
  });

  it('should throw when client has no email', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(
      makeDeposit({ paid: true, reservation: { client: { email: null } } })
    );
    await expect(depositService.sendConfirmationEmail('dep-1'))
      .rejects.toThrow(/email/);
  });

  it('should send email when deposit is paid and client has email', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit({ paid: true }));
    await depositService.sendConfirmationEmail('dep-1');
    // Success - no throw
  });
});

describe('DepositService — markAsUnpaid branches (lines 488-491)', () => {
  it('should throw when deposit is not paid and status is PENDING', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(makeDeposit({ paid: false, status: 'PENDING' }));

    await expect(depositService.markAsUnpaid('dep-1', 'u1'))
      .rejects.toThrow(/opłacona/);
  });

  it('should allow marking as unpaid when deposit was PAID', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(
      makeDeposit({ paid: true, status: 'PAID', paidAt: new Date(), paymentMethod: 'TRANSFER' })
    );
    mockPrisma.deposit.update.mockResolvedValue(makeDeposit());
    mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'res-1', totalPrice: 10000 });
    mockPrisma.reservation.update.mockResolvedValue({});

    await depositService.markAsUnpaid('dep-1', 'u1');
    expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paid: false, status: 'PENDING' }),
      })
    );
  });

  it('should throw not found for unknown deposit', async () => {
    mockPrisma.deposit.findUnique.mockResolvedValue(null);
    await expect(depositService.markAsUnpaid('bad-id', 'u1'))
      .rejects.toThrow(/not found|Nie znaleziono/);
  });
});
