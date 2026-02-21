/**
 * StatsService — Comprehensive Unit Tests
 * Targets ~46% branches. Covers: getOverview with all parallel queries,
 * revenue change percent (positive, zero prev month), null aggregates,
 * pendingDeposits null _count/_sum, getUpcoming.
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        reservation: { count: jest.fn(), aggregate: jest.fn(), findMany: jest.fn() },
        client: { count: jest.fn() },
        deposit: { aggregate: jest.fn() },
        hall: { count: jest.fn() },
    },
}));
import StatsService from '../../../services/stats.service';
import { prisma } from '../../../lib/prisma';
const db = prisma;
const svc = StatsService;
beforeEach(() => jest.clearAllMocks());
describe('StatsService', () => {
    describe('getOverview()', () => {
        function mockAll(overrides = {}) {
            const defaults = {
                resToday: 3, resWeek: 15, resMonth: 40, queue: 5, confirmed: 20,
                revenueThis: { _sum: { totalPrice: 50000 } },
                revenuePrev: { _sum: { totalPrice: 40000 } },
                totalClients: 200, newClients: 10,
                deposits: { _count: 8, _sum: { remainingAmount: 15000 } },
                activeHalls: 4,
            };
            const m = { ...defaults, ...overrides };
            db.reservation.count
                .mockResolvedValueOnce(m.resToday)
                .mockResolvedValueOnce(m.resWeek)
                .mockResolvedValueOnce(m.resMonth)
                .mockResolvedValueOnce(m.queue)
                .mockResolvedValueOnce(m.confirmed);
            db.reservation.aggregate
                .mockResolvedValueOnce(m.revenueThis)
                .mockResolvedValueOnce(m.revenuePrev);
            db.client.count
                .mockResolvedValueOnce(m.totalClients)
                .mockResolvedValueOnce(m.newClients);
            db.deposit.aggregate.mockResolvedValue(m.deposits);
            db.hall.count.mockResolvedValue(m.activeHalls);
        }
        it('should return all overview fields', async () => {
            mockAll();
            const result = await svc.getOverview();
            expect(result.reservationsToday).toBe(3);
            expect(result.reservationsThisWeek).toBe(15);
            expect(result.reservationsThisMonth).toBe(40);
            expect(result.queueCount).toBe(5);
            expect(result.confirmedThisMonth).toBe(20);
            expect(result.revenueThisMonth).toBe(50000);
            expect(result.revenuePrevMonth).toBe(40000);
            expect(result.totalClients).toBe(200);
            expect(result.newClientsThisMonth).toBe(10);
            expect(result.pendingDepositsCount).toBe(8);
            expect(result.pendingDepositsAmount).toBe(15000);
            expect(result.activeHalls).toBe(4);
        });
        it('should calculate positive revenueChangePercent', async () => {
            mockAll({
                revenueThis: { _sum: { totalPrice: 60000 } },
                revenuePrev: { _sum: { totalPrice: 40000 } },
            });
            const result = await svc.getOverview();
            expect(result.revenueChangePercent).toBe(50); // (60k-40k)/40k*100
        });
        it('should return 0 revenueChangePercent when prev month is 0', async () => {
            mockAll({
                revenueThis: { _sum: { totalPrice: 50000 } },
                revenuePrev: { _sum: { totalPrice: 0 } },
            });
            const result = await svc.getOverview();
            expect(result.revenueChangePercent).toBe(0);
        });
        it('should handle null revenue aggregates', async () => {
            mockAll({
                revenueThis: { _sum: { totalPrice: null } },
                revenuePrev: { _sum: { totalPrice: null } },
            });
            const result = await svc.getOverview();
            expect(result.revenueThisMonth).toBe(0);
            expect(result.revenuePrevMonth).toBe(0);
            expect(result.revenueChangePercent).toBe(0);
        });
        it('should handle null deposit aggregates', async () => {
            mockAll({
                deposits: { _count: 0, _sum: { remainingAmount: null } },
            });
            const result = await svc.getOverview();
            expect(result.pendingDepositsCount).toBe(0);
            expect(result.pendingDepositsAmount).toBe(0);
        });
        it('should handle zero _count in deposits', async () => {
            mockAll({
                deposits: { _count: null, _sum: { remainingAmount: 0 } },
            });
            const result = await svc.getOverview();
            expect(result.pendingDepositsCount).toBe(0);
        });
    });
    describe('getUpcoming()', () => {
        it('should return upcoming reservations with default limit', async () => {
            db.reservation.findMany.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
            const result = await svc.getUpcoming();
            expect(result).toHaveLength(2);
            expect(db.reservation.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
        });
        it('should use custom limit', async () => {
            db.reservation.findMany.mockResolvedValue([]);
            await svc.getUpcoming(5);
            expect(db.reservation.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
        });
    });
});
//# sourceMappingURL=stats.service.test.js.map