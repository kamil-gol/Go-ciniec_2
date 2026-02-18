/**
 * DiscountService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    user: { findUnique: jest.fn() },
    reservation: { findUnique: jest.fn(), update: jest.fn() },
    reservationHistory: { create: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

import { DiscountService } from '../../../services/discount.service';
import { prisma } from '../../../lib/prisma';
import { logChange } from '../../../utils/audit-logger';

const mockPrisma = prisma as any;
const USER = 'user-001';

const RESERVATION = {
  id: 'res-001',
  status: 'CONFIRMED',
  totalPrice: { toString: () => '10000' },
  priceBeforeDiscount: null,
  discountType: null,
  discountValue: null,
  discountAmount: null,
  discountReason: null,
  client: { firstName: 'Jan', lastName: 'Kowalski' },
};

// Numeric proxy for Number() calls
Object.defineProperty(RESERVATION, 'totalPrice', {
  get: () => 10000,
});

const RES_WITH_DISCOUNT = {
  ...RESERVATION,
  discountType: 'PERCENTAGE',
  discountValue: 10,
  discountAmount: 1000,
  discountReason: 'Stały klient',
  priceBeforeDiscount: 10000,
};

let service: DiscountService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new DiscountService();
  mockPrisma.user.findUnique.mockResolvedValue({ id: USER, email: 'admin@test.pl' });
  mockPrisma.reservation.findUnique.mockResolvedValue(RESERVATION);
  mockPrisma.reservation.update.mockImplementation(({ data }: any) => Promise.resolve({ ...RESERVATION, ...data }));
  mockPrisma.reservationHistory.create.mockResolvedValue({});
});

describe('DiscountService', () => {

  describe('applyDiscount()', () => {
    it('should apply PERCENTAGE discount and calculate amount', async () => {
      const result = await service.applyDiscount('res-001', {
        type: 'PERCENTAGE', value: 15, reason: 'Stały klient',
      }, USER);

      expect(result.discountType).toBe('PERCENTAGE');
      expect(result.discountAmount).toBe(1500); // 10000 * 15%
      expect(result.totalPrice).toBe(8500); // 10000 - 1500
      expect(result.priceBeforeDiscount).toBe(10000);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DISCOUNT_APPLIED' }));
      expect(mockPrisma.reservationHistory.create).toHaveBeenCalledTimes(1);
    });

    it('should apply FIXED discount', async () => {
      const result = await service.applyDiscount('res-001', {
        type: 'FIXED', value: 2000, reason: 'Rabat specjalny',
      }, USER);

      expect(result.discountAmount).toBe(2000);
      expect(result.totalPrice).toBe(8000);
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.applyDiscount('res-001', {
        type: 'PERCENTAGE', value: 10, reason: 'Test',
      }, USER)).rejects.toThrow(/wygasła/);
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.applyDiscount('nonexistent', {
        type: 'PERCENTAGE', value: 10, reason: 'Test',
      }, USER)).rejects.toThrow('Reservation not found');
    });

    it('should throw when reservation is CANCELLED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({ ...RESERVATION, status: 'CANCELLED' });
      await expect(service.applyDiscount('res-001', {
        type: 'PERCENTAGE', value: 10, reason: 'Test',
      }, USER)).rejects.toThrow(/anulowanej/);
    });

    it('should throw when percentage > 100', async () => {
      await expect(service.applyDiscount('res-001', {
        type: 'PERCENTAGE', value: 150, reason: 'Too much',
      }, USER)).rejects.toThrow(/100%/);
    });

    it('should throw when fixed discount > price', async () => {
      await expect(service.applyDiscount('res-001', {
        type: 'FIXED', value: 15000, reason: 'Too much',
      }, USER)).rejects.toThrow(/przekroczyć ceny/);
    });

    it('should throw when value <= 0', async () => {
      await expect(service.applyDiscount('res-001', {
        type: 'FIXED', value: 0, reason: 'Zero',
      }, USER)).rejects.toThrow(/większa od 0/);
    });

    it('should throw when reason is too short', async () => {
      await expect(service.applyDiscount('res-001', {
        type: 'FIXED', value: 100, reason: 'ab',
      }, USER)).rejects.toThrow(/min. 3/);
    });
  });

  describe('removeDiscount()', () => {
    it('should remove discount and restore price', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_WITH_DISCOUNT);

      const result = await service.removeDiscount('res-001', USER);

      expect(result.discountType).toBeNull();
      expect(result.totalPrice).toBe(10000);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DISCOUNT_REMOVED' }));
    });

    it('should throw when no discount exists', async () => {
      await expect(service.removeDiscount('res-001', USER)).rejects.toThrow(/nie ma rabatu/);
    });
  });
});
