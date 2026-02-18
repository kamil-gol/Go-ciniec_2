/**
 * ReportsService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    reservation: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

import reportsService from '../../../services/reports.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;

const RESERVATIONS = [
  {
    id: 'r-001', date: '2026-01-15', startTime: '16:00', totalPrice: 15000,
    status: 'COMPLETED', guests: 80,
    hall: { id: 'h-001', name: 'Sala Główna' },
    eventType: { id: 'et-001', name: 'Wesele' },
  },
  {
    id: 'r-002', date: '2026-01-22', startTime: '18:00', totalPrice: 8000,
    status: 'CONFIRMED', guests: 40,
    hall: { id: 'h-002', name: 'Sala Kameralna' },
    eventType: { id: 'et-002', name: 'Komunia' },
  },
  {
    id: 'r-003', date: '2026-01-22', startTime: '12:00', totalPrice: 12000,
    status: 'COMPLETED', guests: 60,
    hall: { id: 'h-001', name: 'Sala Główna' },
    eventType: { id: 'et-001', name: 'Wesele' },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.reservation.findMany.mockResolvedValue(RESERVATIONS);
  mockPrisma.reservation.count.mockResolvedValue(2); // completed count
  mockPrisma.reservation.aggregate.mockResolvedValue({ _sum: { totalPrice: 30000 } });
});

describe('ReportsService', () => {
  describe('getRevenueReport()', () => {
    const FILTERS = { dateFrom: '2026-01-01', dateTo: '2026-01-31', groupBy: 'month' as const };

    it('should calculate total revenue', async () => {
      const result = await reportsService.getRevenueReport(FILTERS);
      expect(result.summary.totalRevenue).toBe(35000);
      expect(result.summary.totalReservations).toBe(3);
    });

    it('should calculate avg revenue per reservation', async () => {
      const result = await reportsService.getRevenueReport(FILTERS);
      expect(result.summary.avgRevenuePerReservation).toBeCloseTo(11666.67, 0);
    });

    it('should break down by hall', async () => {
      const result = await reportsService.getRevenueReport(FILTERS);
      expect(result.byHall).toHaveLength(2);
      // Sala Główna should be first (higher revenue)
      expect(result.byHall[0].hallName).toBe('Sala Główna');
      expect(result.byHall[0].revenue).toBe(27000);
    });

    it('should break down by event type', async () => {
      const result = await reportsService.getRevenueReport(FILTERS);
      expect(result.byEventType).toHaveLength(2);
      expect(result.byEventType[0].eventTypeName).toBe('Wesele');
    });

    it('should calculate growth from previous period', async () => {
      // Previous period aggregate returns 30000
      const result = await reportsService.getRevenueReport(FILTERS);
      // Growth: ((35000 - 30000) / 30000) * 100 ≈ 17%
      expect(result.summary.growthPercent).toBe(17);
    });
  });

  describe('getOccupancyReport()', () => {
    const FILTERS = { dateFrom: '2026-01-01', dateTo: '2026-01-31' };

    it('should calculate occupancy summary', async () => {
      const result = await reportsService.getOccupancyReport(FILTERS);
      expect(result.summary.totalReservations).toBe(3);
      expect(result.summary.totalDaysInPeriod).toBe(31);
      // 2 unique dates out of 31 days
      expect(result.summary.avgOccupancy).toBeCloseTo(6.5, 0);
    });

    it('should analyze by hall', async () => {
      const result = await reportsService.getOccupancyReport(FILTERS);
      expect(result.halls).toHaveLength(2);
    });

    it('should analyze peak days of week', async () => {
      const result = await reportsService.getOccupancyReport(FILTERS);
      expect(result.peakDaysOfWeek.length).toBeGreaterThan(0);
      expect(result.summary.peakDay).toBeDefined();
    });
  });
});
