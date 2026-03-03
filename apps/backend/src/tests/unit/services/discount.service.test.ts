import { DiscountService } from '../../../services/discount.service';
import { PrismaClient } from '@prisma/client';
import { recalculateReservationTotalPrice } from '../../../utils/recalculate-total';

jest.mock('../../../utils/recalculate-total');

const mockPrisma = {
  reservation: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  discount: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

let svc: DiscountService;

describe('DiscountService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    svc = new DiscountService(mockPrisma);
  });

  describe('applyDiscount', () => {
    it('should apply discount to reservation', async () => {
      mockPrisma.reservation.findUnique = jest.fn().mockResolvedValue({
        id: 'r1',
        totalPrice: 5000,
        discountId: null,
      });
      mockPrisma.discount.findUnique = jest.fn().mockResolvedValue({
        id: 'd1',
        code: 'SAVE10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: true,
      });
      (recalculateReservationTotalPrice as jest.Mock).mockResolvedValue(4500);
      mockPrisma.reservation.update = jest.fn().mockResolvedValue({
        id: 'r1',
        totalPrice: 4500,
        discountAmount: 500,
        discountId: 'd1',
      });

      const result = await svc.applyDiscount('r1', 'd1', 'u1');
      expect(result.totalPrice).toBe(4500);
      expect(result.discountAmount).toBe(500);
    });

    it('should throw if discount not found', async () => {
      mockPrisma.reservation.findUnique = jest.fn().mockResolvedValue({ id: 'r1' });
      mockPrisma.discount.findUnique = jest.fn().mockResolvedValue(null);

      await expect(svc.applyDiscount('r1', 'invalid', 'u1')).rejects.toThrow(
        /nie znaleziono|not found/i
      );
    });

    it('should throw if discount is inactive', async () => {
      mockPrisma.reservation.findUnique = jest.fn().mockResolvedValue({ id: 'r1' });
      mockPrisma.discount.findUnique = jest.fn().mockResolvedValue({
        id: 'd1',
        isActive: false,
      });

      await expect(svc.applyDiscount('r1', 'd1', 'u1')).rejects.toThrow(
        /nieaktywny|inactive/i
      );
    });
  });

  describe('removeDiscount', () => {
    it('should remove discount and restore original price', async () => {
      mockPrisma.reservation.findUnique = jest.fn().mockResolvedValue({
        id: 'r1',
        totalPrice: 4500,
        discountAmount: 500,
        discountId: 'd1',
      });
      // Mock recalculateReservationTotalPrice to return 5000 (original price)
      (recalculateReservationTotalPrice as jest.Mock).mockResolvedValue(5000);
      mockPrisma.reservation.update = jest.fn().mockResolvedValue({
        id: 'r1',
        totalPrice: 5000,
        discountAmount: null,
        discountId: null,
      });

      const result = await svc.removeDiscount('r1', 'u1');

      expect(result.totalPrice).toBe(5000);
      expect(result.discountAmount).toBeNull();
    });
  });
});
