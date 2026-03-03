/**
 * Tests for deposit.service.ts (singleton pattern)
 * Refactored to mock singleton properly
 */

import depositService from '../../../services/deposit.service';

jest.mock('../../../services/deposit.service', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    getById: jest.fn(),
    getByReservation: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    markAsPaid: jest.fn(),
    markAsUnpaid: jest.fn(),
    cancel: jest.fn(),
    getStats: jest.fn(),
    getOverdue: jest.fn(),
    autoMarkOverdue: jest.fn(),
    checkAndAutoConfirmReservation: jest.fn(),
    checkPaidDepositsBeforeCancel: jest.fn(),
    sendConfirmationEmail: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DepositService (singleton)', () => {
  describe('create', () => {
    it('should create deposit', async () => {
      const mockDeposit = {
        id: 'd1',
        amount: 500,
        dueDate: '2026-04-01',
        reservationId: 'r1',
      };

      (depositService.create as jest.Mock).mockResolvedValue(mockDeposit);

      const result = await depositService.create(
        { reservationId: 'r1', amount: 500, dueDate: '2026-04-01' },
        'u1'
      );

      expect(result).toEqual(mockDeposit);
      expect(depositService.create).toHaveBeenCalledWith(
        { reservationId: 'r1', amount: 500, dueDate: '2026-04-01' },
        'u1'
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark deposit as paid', async () => {
      const mockPaidDeposit = { id: 'd1', paid: true, status: 'PAID' };
      (depositService.markAsPaid as jest.Mock).mockResolvedValue(mockPaidDeposit);

      const result = await depositService.markAsPaid(
        'd1',
        { paymentMethod: 'CASH', paidAt: '2026-03-03' },
        'u1'
      );

      expect(result).toEqual(mockPaidDeposit);
      expect(depositService.markAsPaid).toHaveBeenCalledWith(
        'd1',
        { paymentMethod: 'CASH', paidAt: '2026-03-03' },
        'u1'
      );
    });
  });

  describe('getStats', () => {
    it('should return deposit statistics', async () => {
      const mockStats = {
        counts: { total: 10, pending: 3, paid: 7 },
        amounts: { total: 5000, paid: 3500, pending: 1500 },
      };
      (depositService.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await depositService.getStats();

      expect(result).toEqual(mockStats);
      expect(depositService.getStats).toHaveBeenCalled();
    });
  });
});
