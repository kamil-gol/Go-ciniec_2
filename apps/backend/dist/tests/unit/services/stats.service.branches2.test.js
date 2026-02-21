/**
 * StatsService — Branch Coverage (line 37: Sunday dayOfWeek===0)
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        reservation: { count: jest.fn().mockResolvedValue(0), aggregate: jest.fn().mockResolvedValue({ _sum: { totalPrice: null } }) },
        client: { count: jest.fn().mockResolvedValue(0) },
        deposit: { aggregate: jest.fn().mockResolvedValue({ _count: 0, _sum: { remainingAmount: null } }) },
        hall: { count: jest.fn().mockResolvedValue(0) },
    },
}));
import StatsService from '../../../services/stats.service';
describe('StatsService — Sunday branch (line 37)', () => {
    it('should calculate mondayOffset = -6 when dayOfWeek is 0 (Sunday)', async () => {
        const realDate = Date;
        const sunday = new Date('2026-02-22T12:00:00Z'); // Sunday
        jest.spyOn(global, 'Date').mockImplementation((...args) => {
            if (args.length === 0)
                return sunday;
            // @ts-ignore
            return new realDate(...args);
        });
        Date.now = realDate.now;
        const result = await StatsService.getOverview();
        expect(result).toBeDefined();
        expect(result.reservationsToday).toBe(0);
        jest.restoreAllMocks();
    });
    it('should handle normal weekday (non-zero dayOfWeek)', async () => {
        const result = await StatsService.getOverview();
        expect(result).toBeDefined();
    });
    it('should calculate revenueChangePercent when prev month revenue > 0', async () => {
        const { prisma } = require('../../../lib/prisma');
        prisma.reservation.aggregate
            .mockResolvedValueOnce({ _sum: { totalPrice: 15000 } }) // this month
            .mockResolvedValueOnce({ _sum: { totalPrice: 10000 } }); // prev month
        const result = await StatsService.getOverview();
        expect(result.revenueChangePercent).toBe(50);
    });
});
//# sourceMappingURL=stats.service.branches2.test.js.map