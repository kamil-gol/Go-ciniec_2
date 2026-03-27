/**
 * Tests for discount.service.ts
 * Combined: singleton mock tests + branch coverage tests
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
    reservationHistory: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/recalculate-price', () => ({
  computeReservationBasePrice: jest.fn().mockResolvedValue({
    basePrice: 1000,
    breakdown: {
      menuPrice: 800,
      extrasPrice: 100,
      extraHoursSurcharge: 100,
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
  totalPrice: 1000,
  discountAmount: null,
  discountType: null,
  priceBeforeDiscount: null,
  client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski' },
};

beforeEach(() => {
  jest.clearAllMocks();
  db.user.findUnique.mockResolvedValue({ id: 'u1' });
  db.reservationHistory.create.mockResolvedValue({ id: 'hist-1' });
  (computeReservationBasePrice as jest.Mock).mockResolvedValue({
    basePrice: 1000,
    breakdown: {},
  });
});

describe('DiscountService', () => {
  describe('applyDiscount()', () => {
    it('should apply PERCENTAGE discount', async () => {
      db.reservation.findUnique.mockResolvedValue(RESERVATION);
      db.reservation.update.mockResolvedValue({ ...RESERVATION, discountAmount: 100 });

      await svc.applyDiscount('r1', { type: 'PERCENTAGE', value: 10, reason: 'Test discount' }, 'u1');
      expect(db.reservation.update).toHaveBeenCalled();
    });

    it('should apply FIXED discount', async () => {
      db.reservation.findUnique.mockResolvedValue(RESERVATION);
      db.reservation.update.mockResolvedValue({ ...RESERVATION, discountAmount: 200 });

      await svc.applyDiscount('r1', { type: 'FIXED', value: 200, reason: 'Loyalty discount' }, 'u1');

      expect(db.reservation.update).toHaveBeenCalled();
    });
  });

  describe('edge cases / branch coverage', () => {
    it('should throw when percentage > 100', async () => {
      db.reservation.findUnique.mockResolvedValue(RESERVATION);

      await expect(
        svc.applyDiscount('r1', { type: 'PERCENTAGE', value: 150, reason: 'Test' }, 'u1')
      ).rejects.toThrow(/100%/);
    });

    it('should throw when fixed exceeds price', async () => {
      db.reservation.findUnique.mockResolvedValue(RESERVATION);

      await expect(
        svc.applyDiscount('r1', { type: 'FIXED', value: 2000, reason: 'Test' }, 'u1')
      ).rejects.toThrow(/przekroczyć/);
    });

    it('should use priceBeforeDiscount when editing existing discount', async () => {
      db.reservation.findUnique.mockResolvedValue({
        ...RESERVATION,
        discountAmount: 50,
        priceBeforeDiscount: 1000,
      });
      db.reservation.update.mockResolvedValue({ ...RESERVATION, discountAmount: 200 });

      await svc.applyDiscount('r1', { type: 'PERCENTAGE', value: 20, reason: 'Updated discount' }, 'u1');
      expect(db.reservation.update).toHaveBeenCalled();
    });

    it('should handle null client (N/A)', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...RESERVATION, client: null });
      db.reservation.update.mockResolvedValue({ ...RESERVATION, discountAmount: 100 });

      await svc.applyDiscount('r1', { type: 'PERCENTAGE', value: 10, reason: 'Discount' }, 'u1');
      expect(db.reservation.update).toHaveBeenCalled();
    });
  });
});
