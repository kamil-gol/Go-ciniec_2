/**
 * ReportsService — Branch Coverage
 * getRevenueReport: hallId/eventTypeId/status filters, groupBy day/week/month/year,
 *   null hall, null eventType, totalPrice null, empty reservations, maxRevenueDay null,
 *   previousPeriodRevenue=0 (growthPercent=0)
 * getOccupancyReport: hallId filter, null hall, null startTime, invalid hour,
 *   peakHall null, peakDay N/A, empty reservations, guests null
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservation: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

import reportsService from '../../../services/reports.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;

const makeReservation = (o: any = {}) => ({
  id: 'r-1', date: '2026-02-16', startTime: '15:00',
  totalPrice: 5000, status: 'COMPLETED', guests: 100,
  hall: { id: 'h-1', name: 'Sala A' },
  eventType: { id: 'et-1', name: 'Wesele' },
  ...o,
});

const setupRevenue = (reservations: any[] = [makeReservation()]) => {
  db.reservation.findMany.mockResolvedValue(reservations);
  db.reservation.count.mockResolvedValue(reservations.filter((r: any) => r.status === 'COMPLETED').length);
  db.reservation.aggregate.mockResolvedValue({ _sum: { totalPrice: 0 } });
};

beforeEach(() => jest.resetAllMocks());

describe('ReportsService — branches', () => {

  // ═══ getRevenueReport ═══
  describe('getRevenueReport()', () => {
    const baseFilters = { dateFrom: '2026-01-01', dateTo: '2026-12-31' };

    it('should return report with default groupBy=month', async () => {
      setupRevenue();
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.summary.totalRevenue).toBe(5000);
      expect(result.summary.totalReservations).toBe(1);
    });

    it('should filter by hallId', async () => {
      setupRevenue();
      await reportsService.getRevenueReport({ ...baseFilters, hallId: 'h-1' } as any);
      const where = db.reservation.findMany.mock.calls[0][0].where;
      expect(where.hallId).toBe('h-1');
    });

    it('should filter by eventTypeId', async () => {
      setupRevenue();
      await reportsService.getRevenueReport({ ...baseFilters, eventTypeId: 'et-1' } as any);
      const where = db.reservation.findMany.mock.calls[0][0].where;
      expect(where.eventTypeId).toBe('et-1');
    });

    it('should filter by status', async () => {
      setupRevenue();
      await reportsService.getRevenueReport({ ...baseFilters, status: 'COMPLETED' } as any);
      const where = db.reservation.findMany.mock.calls[0][0].where;
      expect(where.status).toBe('COMPLETED');
    });

    it('should not filter when no optional filters', async () => {
      setupRevenue();
      await reportsService.getRevenueReport(baseFilters as any);
      const where = db.reservation.findMany.mock.calls[0][0].where;
      expect(where.hallId).toBeUndefined();
      expect(where.eventTypeId).toBeUndefined();
    });

    it('should group by day', async () => {
      setupRevenue([makeReservation({ date: '2026-02-16' })]);
      const result = await reportsService.getRevenueReport({ ...baseFilters, groupBy: 'day' } as any);
      expect(result.breakdown[0].period).toBe('2026-02-16');
    });

    it('should group by week', async () => {
      setupRevenue([makeReservation({ date: '2026-02-16' })]);
      const result = await reportsService.getRevenueReport({ ...baseFilters, groupBy: 'week' } as any);
      expect(result.breakdown[0].period).toMatch(/2026-W/);
    });

    it('should group by month', async () => {
      setupRevenue([makeReservation({ date: '2026-02-16' })]);
      const result = await reportsService.getRevenueReport({ ...baseFilters, groupBy: 'month' } as any);
      expect(result.breakdown[0].period).toBe('2026-02');
    });

    it('should group by year', async () => {
      setupRevenue([makeReservation({ date: '2026-02-16' })]);
      const result = await reportsService.getRevenueReport({ ...baseFilters, groupBy: 'year' } as any);
      expect(result.breakdown[0].period).toBe('2026');
    });

    it('should handle null totalPrice', async () => {
      setupRevenue([makeReservation({ totalPrice: null })]);
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.summary.totalRevenue).toBe(0);
    });

    it('should handle empty reservations', async () => {
      setupRevenue([]);
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.summary.totalRevenue).toBe(0);
      expect(result.summary.avgRevenuePerReservation).toBe(0);
      expect(result.summary.maxRevenueDay).toBeNull();
      expect(result.summary.maxRevenueDayAmount).toBe(0);
    });

    it('should skip null hall in groupRevenueByHall', async () => {
      setupRevenue([makeReservation({ hall: null })]);
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.byHall).toHaveLength(0);
    });

    it('should skip null eventType in groupRevenueByEventType', async () => {
      setupRevenue([makeReservation({ eventType: null })]);
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.byEventType).toHaveLength(0);
    });

    it('should calculate growth when previous period has revenue', async () => {
      db.reservation.findMany.mockResolvedValue([makeReservation({ totalPrice: 10000 })]);
      db.reservation.count.mockResolvedValue(1);
      db.reservation.aggregate.mockResolvedValue({ _sum: { totalPrice: 5000 } }); // previous = 5000
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.summary.growthPercent).toBe(100); // (10000-5000)/5000 * 100
    });

    it('should return 0 growth when no previous revenue', async () => {
      setupRevenue();
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.summary.growthPercent).toBe(0);
    });

    it('should separate completed and pending revenue', async () => {
      setupRevenue([
        makeReservation({ totalPrice: 3000, status: 'COMPLETED' }),
        makeReservation({ id: 'r-2', totalPrice: 2000, status: 'PENDING' }),
      ]);
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.summary.pendingRevenue).toBe(2000);
    });

    it('should handle aggregate null totalPrice (previous period)', async () => {
      db.reservation.findMany.mockResolvedValue([makeReservation()]);
      db.reservation.count.mockResolvedValue(1);
      db.reservation.aggregate.mockResolvedValue({ _sum: { totalPrice: null } });
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.summary.growthPercent).toBe(0);
    });

    it('should aggregate multiple reservations per hall', async () => {
      setupRevenue([
        makeReservation({ totalPrice: 3000 }),
        makeReservation({ id: 'r-2', totalPrice: 2000 }),
      ]);
      const result = await reportsService.getRevenueReport(baseFilters as any);
      expect(result.byHall[0].revenue).toBe(5000);
      expect(result.byHall[0].count).toBe(2);
    });
  });

  // ═══ getOccupancyReport ═══
  describe('getOccupancyReport()', () => {
    const baseFilters = { dateFrom: '2026-01-01', dateTo: '2026-01-31' };

    const setupOccupancy = (reservations: any[] = [makeReservation()]) => {
      db.reservation.findMany.mockResolvedValue(reservations);
    };

    it('should return basic occupancy report', async () => {
      setupOccupancy();
      const result = await reportsService.getOccupancyReport(baseFilters as any);
      expect(result.summary.totalReservations).toBe(1);
      expect(result.summary.totalDaysInPeriod).toBe(31);
    });

    it('should filter by hallId', async () => {
      setupOccupancy();
      await reportsService.getOccupancyReport({ ...baseFilters, hallId: 'h-1' } as any);
      const where = db.reservation.findMany.mock.calls[0][0].where;
      expect(where.hallId).toBe('h-1');
    });

    it('should handle empty reservations', async () => {
      setupOccupancy([]);
      const result = await reportsService.getOccupancyReport(baseFilters as any);
      expect(result.summary.avgOccupancy).toBe(0);
      expect(result.summary.peakDay).toBe('Brak danych');
      expect(result.summary.peakHall).toBeNull();
      expect(result.summary.peakHallId).toBeNull();
    });

    it('should handle null hall in occupancy (skip)', async () => {
      setupOccupancy([makeReservation({ hall: null })]);
      const result = await reportsService.getOccupancyReport(baseFilters as any);
      expect(result.halls).toHaveLength(0);
    });

    it('should handle null startTime in peak hours (skip)', async () => {
      setupOccupancy([makeReservation({ startTime: null })]);
      const result = await reportsService.getOccupancyReport(baseFilters as any);
      expect(result.peakHours).toHaveLength(0);
    });

    it('should handle invalid hour (NaN) in peak hours', async () => {
      setupOccupancy([makeReservation({ startTime: 'invalid:00' })]);
      const result = await reportsService.getOccupancyReport(baseFilters as any);
      expect(result.peakHours).toHaveLength(0);
    });

    it('should handle valid startTime', async () => {
      setupOccupancy([makeReservation({ startTime: '15:00' })]);
      const result = await reportsService.getOccupancyReport(baseFilters as any);
      expect(result.peakHours).toHaveLength(1);
      expect(result.peakHours[0].hour).toBe(15);
    });

    it('should handle null guests (|| 0)', async () => {
      setupOccupancy([makeReservation({ guests: null })]);
      const result = await reportsService.getOccupancyReport(baseFilters as any);
      expect(result.halls[0].avgGuestsPerReservation).toBe(0);
    });

    it('should calculate peak day of week', async () => {
      // 2026-02-16 is Monday
      setupOccupancy([
        makeReservation({ date: '2026-02-16' }),
        makeReservation({ id: 'r-2', date: '2026-02-16' }),
        makeReservation({ id: 'r-3', date: '2026-02-17' }), // Tuesday
      ]);
      const result = await reportsService.getOccupancyReport(baseFilters as any);
      expect(result.peakDaysOfWeek.length).toBeGreaterThan(0);
    });

    it('should limit peakHours to top 10', async () => {
      const reservations = Array.from({ length: 15 }, (_, i) =>
        makeReservation({ id: `r-${i}`, startTime: `${(i % 24).toString().padStart(2, '0')}:00` })
      );
      setupOccupancy(reservations);
      const result = await reportsService.getOccupancyReport(baseFilters as any);
      expect(result.peakHours.length).toBeLessThanOrEqual(10);
    });
  });
});
