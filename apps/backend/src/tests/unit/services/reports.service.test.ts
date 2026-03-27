/**
 * ReportsService — Comprehensive Unit Tests
 * Targets 50% branches. Covers: getRevenueReport all filters,
 * all 4 groupBy periods (day/week/month/year), growthPercent branches,
 * null hall/eventType guards, getOccupancyReport branches,
 * peakHours startTime guards, peakDay N/A fallback.
 * FIX: spolonizowane komunikaty
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservation: { findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
  },
}));

import ReportsService from '../../../services/reports';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const svc = ReportsService;

const RESERVATIONS = [
  { id: 'r1', date: '2026-02-10', startTime: '14:00', totalPrice: 5000, status: 'COMPLETED', guests: 80, hall: { id: 'h1', name: 'Sala A' }, eventType: { id: 'et1', name: 'Wesele' } },
  { id: 'r2', date: '2026-02-15', startTime: '16:00', totalPrice: 3000, status: 'CONFIRMED', guests: 50, hall: { id: 'h1', name: 'Sala A' }, eventType: { id: 'et2', name: 'Komunia' } },
  { id: 'r3', date: '2026-02-20', startTime: '18:00', totalPrice: 7000, status: 'COMPLETED', guests: 120, hall: { id: 'h2', name: 'Sala B' }, eventType: { id: 'et1', name: 'Wesele' } },
];

beforeEach(() => jest.clearAllMocks());

describe('ReportsService', () => {
  // ========== getRevenueReport ==========
  describe('getRevenueReport()', () => {
    function mockRevenue(reservations: any[] = RESERVATIONS, prevRevenue = 10000) {
      db.reservation.findMany.mockResolvedValue(reservations);
      db.reservation.count.mockResolvedValue(
        reservations.filter((r: any) => r.status === 'COMPLETED').length
      );
      db.reservation.aggregate.mockResolvedValue({ _sum: { totalPrice: prevRevenue } });
    }

    it('should return full revenue report with defaults (groupBy month)', async () => {
      mockRevenue();
      const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.summary.totalRevenue).toBe(15000);
      expect(result.summary.totalReservations).toBe(3);
      expect(result.summary.completedReservations).toBe(2);
      expect(result.breakdown.length).toBeGreaterThan(0);
      expect(result.byHall.length).toBe(2);
      expect(result.byEventType.length).toBe(2);
    });

    it('should apply hallId filter', async () => {
      mockRevenue();
      await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28', hallId: 'h1' });
      const call = db.reservation.findMany.mock.calls[0][0];
      expect(call.where.hallId).toBe('h1');
    });

    it('should apply eventTypeId filter', async () => {
      mockRevenue();
      await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28', eventTypeId: 'et1' });
      const call = db.reservation.findMany.mock.calls[0][0];
      expect(call.where.eventTypeId).toBe('et1');
    });

    it('should apply status filter', async () => {
      mockRevenue();
      await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28', status: 'COMPLETED' });
      const call = db.reservation.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('COMPLETED');
    });

    it('should calculate growthPercent when prev > 0', async () => {
      mockRevenue(RESERVATIONS, 10000);
      const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.summary.growthPercent).toBe(50); // (15000-10000)/10000*100
    });

    it('should return 0 growthPercent when prev = 0', async () => {
      mockRevenue(RESERVATIONS, 0);
      const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.summary.growthPercent).toBe(0);
    });

    it('should handle 0 reservations', async () => {
      mockRevenue([], 0);
      const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.summary.totalRevenue).toBe(0);
      expect(result.summary.avgRevenuePerReservation).toBe(0);
      expect(result.summary.maxRevenueDay).toBeNull();
    });

    it('should group by day', async () => {
      mockRevenue();
      const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28', groupBy: 'day' });
      expect(result.breakdown.length).toBe(3);
      expect(result.breakdown[0].period).toMatch(/^2026-02/);
    });

    it('should group by week', async () => {
      mockRevenue();
      const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28', groupBy: 'week' });
      expect(result.breakdown[0].period).toMatch(/^2026-W/);
    });

    it('should group by year', async () => {
      mockRevenue();
      const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28', groupBy: 'year' });
      expect(result.breakdown[0].period).toBe('2026');
    });

    it('should handle reservation with null hall', async () => {
      const noHall = [{ ...RESERVATIONS[0], hall: null }];
      mockRevenue(noHall);
      const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.byHall).toHaveLength(0);
    });

    it('should handle reservation with null eventType', async () => {
      const noET = [{ ...RESERVATIONS[0], eventType: null }];
      mockRevenue(noET);
      const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.byEventType).toHaveLength(0);
    });
  });

  // ========== getOccupancyReport ==========
  describe('getOccupancyReport()', () => {
    function mockOccupancy(reservations: any[] = RESERVATIONS) {
      db.reservation.findMany.mockResolvedValue(reservations);
    }

    it('should return full occupancy report', async () => {
      mockOccupancy();
      const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.summary.totalReservations).toBe(3);
      expect(result.summary.totalDaysInPeriod).toBe(28);
      expect(result.summary.avgOccupancy).toBeGreaterThan(0);
      expect(result.halls.length).toBe(2);
      expect(result.peakDaysOfWeek.length).toBeGreaterThan(0);
    });

    it('should apply hallId filter', async () => {
      mockOccupancy();
      await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28', hallId: 'h1' });
      const call = db.reservation.findMany.mock.calls[0][0];
      expect(call.where.hallId).toBe('h1');
    });

    it('should return Brak danych for peakDay when no reservations', async () => {
      mockOccupancy([]);
      const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.summary.peakDay).toBe('Brak danych');
      expect(result.summary.peakHall).toBeNull();
    });

    it('should handle reservations with null startTime', async () => {
      const noTime = [{ ...RESERVATIONS[0], startTime: null }];
      mockOccupancy(noTime);
      const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.peakHours).toHaveLength(0);
    });

    it('should handle reservations with invalid startTime', async () => {
      const badTime = [{ ...RESERVATIONS[0], startTime: 'abc' }];
      mockOccupancy(badTime);
      const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.peakHours).toHaveLength(0);
    });

    it('should handle reservation with null hall in occupancy', async () => {
      const noHall = [{ ...RESERVATIONS[0], hall: null }];
      mockOccupancy(noHall);
      const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
      expect(result.halls).toHaveLength(0);
    });

    it('should handle 0 totalDaysInPeriod', async () => {
      mockOccupancy([]);
      const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-01' });
      expect(result.summary.avgOccupancy).toBeDefined();
    });
  });

  describe('edge cases / branch coverage', () => {

    // --- getRevenueReport extra branches ---
    describe('getRevenueReport() — extra branches', () => {
      function mockRevenue(reservations: any[] = RESERVATIONS, prevRevenue = 10000) {
        db.reservation.findMany.mockResolvedValue(reservations);
        db.reservation.count.mockResolvedValue(
          reservations.filter((r: any) => r.status === 'COMPLETED').length
        );
        db.reservation.aggregate.mockResolvedValue({ _sum: { totalPrice: prevRevenue } });
      }

      it('should not add hallId/eventTypeId to where when no optional filters', async () => {
        mockRevenue();
        await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        const where = db.reservation.findMany.mock.calls[0][0].where;
        expect(where.hallId).toBeUndefined();
        expect(where.eventTypeId).toBeUndefined();
      });

      it('should group by month explicitly', async () => {
        mockRevenue([RESERVATIONS[0]]);
        const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28', groupBy: 'month' });
        expect(result.breakdown[0].period).toBe('2026-02');
      });

      it('should handle null totalPrice', async () => {
        mockRevenue([{ ...RESERVATIONS[0], totalPrice: null }]);
        const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        expect(result.summary.totalRevenue).toBe(0);
      });

      it('should separate completed and pending revenue', async () => {
        mockRevenue([
          { ...RESERVATIONS[0], totalPrice: 3000, status: 'COMPLETED' },
          { ...RESERVATIONS[1], totalPrice: 2000, status: 'PENDING' },
        ]);
        const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        expect(result.summary.pendingRevenue).toBe(2000);
      });

      it('should handle aggregate null totalPrice (previous period)', async () => {
        db.reservation.findMany.mockResolvedValue([RESERVATIONS[0]]);
        db.reservation.count.mockResolvedValue(1);
        db.reservation.aggregate.mockResolvedValue({ _sum: { totalPrice: null } });
        const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        expect(result.summary.growthPercent).toBe(0);
      });

      it('should aggregate multiple reservations per hall', async () => {
        mockRevenue([
          RESERVATIONS[0],
          { ...RESERVATIONS[1], hall: RESERVATIONS[0].hall, totalPrice: 2000 },
        ]);
        const result = await svc.getRevenueReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        expect(result.byHall[0].revenue).toBe(7000);
        expect(result.byHall[0].count).toBe(2);
      });
    });

    // --- getOccupancyReport extra branches ---
    describe('getOccupancyReport() — extra branches', () => {
      function mockOccupancy(reservations: any[] = RESERVATIONS) {
        db.reservation.findMany.mockResolvedValue(reservations);
      }

      it('should handle valid startTime and return correct hour', async () => {
        mockOccupancy([{ ...RESERVATIONS[0], startTime: '15:00' }]);
        const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        expect(result.peakHours).toHaveLength(1);
        expect(result.peakHours[0].hour).toBe(15);
      });

      it('should handle null guests (|| 0)', async () => {
        mockOccupancy([{ ...RESERVATIONS[0], guests: null }]);
        const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        expect(result.halls[0].avgGuestsPerReservation).toBe(0);
      });

      it('should calculate peak day of week', async () => {
        mockOccupancy([
          { ...RESERVATIONS[0], date: '2026-02-16' },
          { ...RESERVATIONS[1], date: '2026-02-16' },
          { ...RESERVATIONS[2], date: '2026-02-17' },
        ]);
        const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        expect(result.peakDaysOfWeek.length).toBeGreaterThan(0);
      });

      it('should limit peakHours to top 10', async () => {
        const reservations = Array.from({ length: 15 }, (_, i) =>
          ({ ...RESERVATIONS[0], id: `r-${i}`, startTime: `${(i % 24).toString().padStart(2, '0')}:00` })
        );
        mockOccupancy(reservations);
        const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        expect(result.peakHours.length).toBeLessThanOrEqual(10);
      });
    });
  });
});
