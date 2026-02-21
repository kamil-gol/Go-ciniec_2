/**
 * AuditLogController — Unit Tests
 * Uses try/catch pattern (errors return 500 directly).
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
describe('AuditLogController', () => {
    describe('getAuditLogs()', () => {
        it('should pass query filters with defaults', async () => {
            svc.getAuditLogs.mockResolvedValue({ logs: [], total: 0 });
            const response = res();
            await auditLogController.getAuditLogs(req({ query: { entityType: 'RESERVATION', page: '2', pageSize: '25' } }), response);
            expect(svc.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({ entityType: 'RESERVATION', page: 2, pageSize: 25 }));
            expect(response.json).toHaveBeenCalled();
        });
        it('should default page=1, pageSize=50', async () => {
            svc.getAuditLogs.mockResolvedValue({ logs: [] });
            await auditLogController.getAuditLogs(req({ query: {} }), res());
            expect(svc.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 50 }));
        });
        it('should return 500 on error', async () => {
            svc.getAuditLogs.mockRejectedValue(new Error('DB down'));
            const response = res();
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await auditLogController.getAuditLogs(req({ query: {} }), response);
            expect(response.status).toHaveBeenCalledWith(500);
            consoleSpy.mockRestore();
        });
    });
    describe('getEntityLogs()', () => {
        it('should return logs for entity', async () => {
            svc.getEntityLogs.mockResolvedValue([{ id: 'log-1' }]);
            const response = res();
            await auditLogController.getEntityLogs(req({ params: { entityType: 'RESERVATION', entityId: 'r-1' } }), response);
            expect(svc.getEntityLogs).toHaveBeenCalledWith('RESERVATION', 'r-1');
            expect(response.json).toHaveBeenCalled();
        });
    });
    describe('getRecentActivity()', () => {
        it('should use custom limit', async () => {
            svc.getRecentActivity.mockResolvedValue([]);
            await auditLogController.getRecentActivity(req({ query: { limit: '5' } }), res());
            expect(svc.getRecentActivity).toHaveBeenCalledWith(5);
        });
        it('should default to limit 10', async () => {
            svc.getRecentActivity.mockResolvedValue([]);
            await auditLogController.getRecentActivity(req({ query: {} }), res());
            expect(svc.getRecentActivity).toHaveBeenCalledWith(10);
        });
    });
    it('getEntityTypes — returns types', async () => {
        svc.getEntityTypes.mockResolvedValue(['RESERVATION', 'CLIENT']);
        const response = res();
        await auditLogController.getEntityTypes(req(), response);
        expect(response.json).toHaveBeenCalledWith(['RESERVATION', 'CLIENT']);
    });
    it('getActions — returns actions', async () => {
        svc.getActions.mockResolvedValue(['CREATE', 'UPDATE', 'DELETE']);
        const response = res();
        await auditLogController.getActions(req(), response);
        expect(response.json).toHaveBeenCalledWith(['CREATE', 'UPDATE', 'DELETE']);
    });
    it('getStatistics — passes date range', async () => {
        svc.getStatistics.mockResolvedValue({ totalLogs: 100 });
        const response = res();
        await auditLogController.getStatistics(req({ query: { dateFrom: '2026-01-01', dateTo: '2026-02-01' } }), response);
        expect(svc.getStatistics).toHaveBeenCalledWith('2026-01-01', '2026-02-01');
    });
});
//# sourceMappingURL=audit-log.controller.test.js.map