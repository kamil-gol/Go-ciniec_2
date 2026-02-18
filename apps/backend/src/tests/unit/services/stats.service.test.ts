/**
 * StatsService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    reservation: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    client: { count: jest.fn() },
    deposit: { aggregate: jest.fn() },
    hall: { count: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

import statsService from '../../../services/stats.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
  // reservation.count — called 5 times in getOverview
  mockPrisma.reservation.count.mockResolvedValue(10);
  mockPrisma.reservation.aggregate.mockResolvedValue({ _sum: { totalPrice: 50000 } });
  mockPrisma.reservation.findMany.mockResolvedValue([]);
  mockPrisma.client.count.mockResolvedValue(100);
  mockPrisma.deposit.aggregate.mockResolvedValue({ _count: 3, _sum: { remainingAmount: 5000 } });
  mockPrisma.hall.count.mockResolvedValue(4);
});

describe('StatsService', () => {
  describe('getOverview()', () => {
    it('should return all dashboard stats via parallel queries', async () => {
      const result = await statsService.getOverview();
      expect(result.reservationsToday).toBe(10);
      expect(result.reservationsThisWeek).toBe(10);
      expect(result.reservationsThisMonth).toBe(10);
      expect(result.queueCount).toBe(10);
      expect(result.revenueThisMonth).toBe(50000);
      expect(result.totalClients).toBe(100);
      expect(result.pendingDepositsCount).toBe(3);
      expect(result.activeHalls).toBe(4);
      // revenue change: same both months → 0%
      expect(result.revenueChangePercent).toBe(0);
    });

    it('should calculate revenue change percent', async () => {
      mockPrisma.reservation.aggregate
        .mockResolvedValueOnce({ _sum: { totalPrice: 60000 } })  // this month
        .mockResolvedValueOnce({ _sum: { totalPrice: 50000 } }); // prev month
      const result = await statsService.getOverview();
      expect(result.revenueChangePercent).toBe(20); // (60000-50000)/50000 * 100
    });
  });

  describe('getUpcoming()', () => {
    it('should return upcoming reservations with relations', async () => {
      await statsService.getUpcoming(5);
      expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });
});
