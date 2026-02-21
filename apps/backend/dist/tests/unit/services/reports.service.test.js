/**
 * ReportsService — Comprehensive Unit Tests
 * Targets 50% branches. Covers: getRevenueReport all filters,
 * all 4 groupBy periods (day/week/month/year), growthPercent branches,
 * null hall/eventType guards, getOccupancyReport branches,
 * peakHours startTime guards, peakDay N/A fallback.
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        reservation: { findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    },
}));
import ReportsService from '../../../services/reports.service';
import { prisma } from '../../../lib/prisma';
const db = prisma;
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
        function mockRevenue(reservations = RESERVATIONS, prevRevenue = 10000) {
            db.reservation.findMany.mockResolvedValue(reservations);
            db.reservation.count.mockResolvedValue(reservations.filter((r) => r.status === 'COMPLETED').length);
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
        function mockOccupancy(reservations = RESERVATIONS) {
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
        it('should return N/A for peakDay when no reservations', async () => {
            mockOccupancy([]);
            const result = await svc.getOccupancyReport({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
            expect(result.summary.peakDay).toBe('N/A');
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
});
//# sourceMappingURL=reports.service.test.js.map