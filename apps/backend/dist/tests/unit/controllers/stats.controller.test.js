/**
 * StatsController — Unit Tests
 */
jest.mock('../../../services/stats.service', () => ({
    __esModule: true,
    default: {
        getOverview: jest.fn(),
        getUpcoming: jest.fn(),
    },
}));
import { StatsController } from '../../../controllers/stats.controller';
import statsService from '../../../services/stats.service';
const controller = new StatsController();
const svc = statsService;
const req = (overrides = {}) => ({
    body: {}, params: {}, query: {},
    ...overrides,
});
const res = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
};
beforeEach(() => jest.clearAllMocks());
describe('StatsController', () => {
    it('getOverview — returns 200 with overview data', async () => {
        svc.getOverview.mockResolvedValue({ totalReservations: 50, revenue: 120000 });
        const response = res();
        await controller.getOverview(req(), response);
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.objectContaining({ totalReservations: 50 }) }));
    });
    it('getUpcoming — returns 200 with default limit (10)', async () => {
        svc.getUpcoming.mockResolvedValue([{ id: 'r-1' }, { id: 'r-2' }]);
        const response = res();
        await controller.getUpcoming(req({ query: {} }), response);
        expect(svc.getUpcoming).toHaveBeenCalledWith(10);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ count: 2 }));
    });
    it('getUpcoming — caps limit at 20', async () => {
        svc.getUpcoming.mockResolvedValue([]);
        await controller.getUpcoming(req({ query: { limit: '999' } }), res());
        expect(svc.getUpcoming).toHaveBeenCalledWith(20);
    });
});
//# sourceMappingURL=stats.controller.test.js.map