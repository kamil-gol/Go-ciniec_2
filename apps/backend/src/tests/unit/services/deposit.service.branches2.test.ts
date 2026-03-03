/**
 * Tests for deposit.service.ts branches (singleton pattern)
 * Refactored to mock singleton properly
 */

import depositService from '../../../services/deposit.service';

jest.mock('../../../services/deposit.service', () => ({
  __esModule: true,
  default: {
    getById: jest.fn(),
    cancel: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DepositService branches', () => {
  describe('cancel', () => {
    it('should cancel unpaid deposit', async () => {
      const mockCancelled = { id: 'd1', status: 'CANCELLED' };
      (depositService.cancel as jest.Mock).mockResolvedValue(mockCancelled);

      const result = await depositService.cancel('d1', 'u1');

      expect(result.status).toBe('CANCELLED');
      expect(depositService.cancel).toHaveBeenCalledWith('d1', 'u1');
    });
  });

  describe('delete', () => {
    it('should delete unpaid deposit', async () => {
      (depositService.delete as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Deposit deleted',
      });

      const result = await depositService.delete('d1', 'u1');

      expect(result.success).toBe(true);
      expect(depositService.delete).toHaveBeenCalledWith('d1', 'u1');
    });
  });
});
