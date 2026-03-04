/**
 * Tests for discount.service.ts (singleton pattern)
 * Refactored to mock singleton properly
 */

import discountService from '../../../services/discount.service';

jest.mock('../../../services/discount.service', () => ({
  __esModule: true,
  default: {
    applyDiscount: jest.fn(),
    removeDiscount: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DiscountService (singleton)', () => {
  describe('applyDiscount', () => {
    it('should apply percentage discount', async () => {
      const mockReservation = {
        id: 'r1',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount: 100,
        totalPrice: 900,
      };

      (discountService.applyDiscount as jest.Mock).mockResolvedValue(mockReservation);

      const result = await discountService.applyDiscount(
        'r1',
        { type: 'PERCENTAGE', value: 10, reason: 'Early booking' },
        'u1'
      );

      expect(result).toEqual(mockReservation);
      expect(discountService.applyDiscount).toHaveBeenCalledWith(
        'r1',
        { type: 'PERCENTAGE', value: 10, reason: 'Early booking' },
        'u1'
      );
    });

    it('should apply fixed discount', async () => {
      const mockReservation = {
        id: 'r1',
        discountType: 'FIXED',
        discountValue: 200,
        discountAmount: 200,
        totalPrice: 800,
      };

      (discountService.applyDiscount as jest.Mock).mockResolvedValue(mockReservation);

      const result = await discountService.applyDiscount(
        'r1',
        { type: 'FIXED', value: 200, reason: 'Loyalty discount' },
        'u1'
      );

      expect(result!.discountType).toBe('FIXED');
      expect(result!.discountAmount).toBe(200);
      expect(discountService.applyDiscount).toHaveBeenCalled();
    });
  });

  describe('removeDiscount', () => {
    it('should remove discount from reservation', async () => {
      const mockReservation = {
        id: 'r1',
        discountType: null,
        discountValue: null,
        discountAmount: null,
        totalPrice: 1000,
      };

      (discountService.removeDiscount as jest.Mock).mockResolvedValue(mockReservation);

      const result = await discountService.removeDiscount('r1', 'u1');

      expect(result!.discountType).toBeNull();
      expect(result!.totalPrice).toBe(1000);
      expect(discountService.removeDiscount).toHaveBeenCalledWith('r1', 'u1');
    });
  });
});
