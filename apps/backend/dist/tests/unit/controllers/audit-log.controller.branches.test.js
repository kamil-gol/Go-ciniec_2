/**
 * AuditLogController — Branch coverage: error paths for remaining methods
 * Covers catch blocks: getEntityLogs (ln 60-61), getRecentActivity (ln 81-82),
 * getEntityTypes (ln 98-99), getActions (ln 115-116), getStatistics (ln 138-139)
 */
jest.mock('../../../services/audit-log.service', () => ({
    __esModule: true,
    default: {
        getAuditLogs: jest.fn(),
        getEntityLogs: jest.fn(),
        getRecentActivity: jest.fn(),
        getEntityTypes: jest.fn(),
        getActions: jest.fn(),
        getStatistics: jest.fn(),
    },
}));
import auditLogController from '../../../controllers/audit-log.controller';
import auditLogService from '../../../services/audit-log.service';
const svc = auditLogService;
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
describe('AuditLogController — error branches', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    afterAll(() => consoleSpy.mockRestore());
    it('getEntityLogs — returns 500 on error', async () => {
        svc.getEntityLogs.mockRejectedValue(new Error('DB error'));
        const response = res();
        await auditLogController.getEntityLogs(req({ params: { entityType: 'RESERVATION', entityId: 'r-1' } }), response);
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String), message: 'DB error' }));
    });
    it('getRecentActivity — returns 500 on error', async () => {
        svc.getRecentActivity.mockRejectedValue(new Error('timeout'));
        const response = res();
        await auditLogController.getRecentActivity(req({ query: {} }), response);
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'timeout' }));
    });
    it('getEntityTypes — returns 500 on error', async () => {
        svc.getEntityTypes.mockRejectedValue(new Error('fail'));
        const response = res();
        await auditLogController.getEntityTypes(req(), response);
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'fail' }));
    });
    it('getActions — returns 500 on error', async () => {
        svc.getActions.mockRejectedValue(new Error('oops'));
        const response = res();
        await auditLogController.getActions(req(), response);
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'oops' }));
    });
    it('getStatistics — returns 500 on error', async () => {
        svc.getStatistics.mockRejectedValue(new Error('stats fail'));
        const response = res();
        await auditLogController.getStatistics(req({ query: { dateFrom: '2026-01-01', dateTo: '2026-02-01' } }), response);
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'stats fail' }));
    });
});
//# sourceMappingURL=audit-log.controller.branches.test.js.map