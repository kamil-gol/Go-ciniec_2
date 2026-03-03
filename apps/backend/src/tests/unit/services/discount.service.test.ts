/**
 * DiscountService — Unit Tests
 * Tests: applyDiscount, removeDiscount
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    reservation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/recalculate-price', () => ({
  computeReservationBasePrice: jest.fn().mockResolvedValue({
    basePrice: 5000,
    breakdown: {
      menuPrice: 4000,
      extrasPrice: 500,
      extraHoursSurcharge: 500,
    },
  }),
  recalculateReservationPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

import { DiscountService } from '../../../services/discount.service';
import { prisma } from '../../../lib/prisma';
import { computeReservationBasePrice } from '../../../utils/recalculate-price';

const db = prisma as any;
const svc = new DiscountService();

const RESERVATION = {
  id: 'r1',
  totalPrice: 5000,
  discountAmount: null,
  discountType: null,
  priceBeforeDiscount: null,
  client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski' },
};

beforeEach(() => {
  jest.clearAllMocks();
  db.user.findUnique.mockResolvedValue({ id: 'u1' });
});

describe('DiscountService', () => {
  describe('applyDiscount', () => {
    it('should apply PERCENTAGE discount correctly', async () => {
      db.reservation.findUnique.mockResolvedValue(RESERVATION);
      db.reservation.update.mockResolvedValue({ ...RESERVATION, discountAmount: 500, totalPrice: 4500 });

      const result = await svc.applyDiscount('r1', { type: 'PERCENTAGE', value: 10 }, 'u1');

      expect(result.discountAmount).toBe(500);
      expect(db.reservation.update).toHaveBeenCalled();
    });

    it('should apply FIXED discount correctly', async () => {
      db.reservation.findUnique.mockResolvedValue(RESERVATION);
      db.reservation.update.mockResolvedValue({ ...RESERVATION, discountAmount: 500, totalPrice: 4500 });

      const result = await svc.applyDiscount('r1', { type: 'FIXED', value: 500 }, 'u1');

      expect(result.discountAmount).toBe(500);
      expect(db.reservation.update).toHaveBeenCalled();
    });
  });

  describe('removeDiscount', () => {
    it('should remove discount and restore original price', async () => {
      db.reservation.findUnique.mockResolvedValue({
        ...RESERVATION,
        discountAmount: 500,
        priceBeforeDiscount: 5000,
        totalPrice: 4500,
      });
      db.reservation.update.mockResolvedValue({
        ...RESERVATION,
        discountAmount: null,
        priceBeforeDiscount: null,
        totalPrice: 5000,
      });

      const result = await svc.removeDiscount('r1', 'u1');

      expect(result.totalPrice).toBe(5000);
      expect(result.discountAmount).toBeNull();
    });
  });
});
