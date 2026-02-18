/**
 * AuditLogService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    activityLog: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    user: { findMany: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

import auditLogService from '../../../services/audit-log.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;

const LOG_ENTRY = {
  id: 'log-001', action: 'CREATE', entityType: 'RESERVATION', entityId: 'res-001',
  userId: 'u-001', details: {}, createdAt: new Date(),
  user: { id: 'u-001', email: 'admin@test.pl', firstName: 'Jan', lastName: 'Admin' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.activityLog.count.mockResolvedValue(42);
  mockPrisma.activityLog.findMany.mockResolvedValue([LOG_ENTRY]);
  mockPrisma.activityLog.groupBy.mockResolvedValue([]);
  mockPrisma.user.findMany.mockResolvedValue([]);
});

describe('AuditLogService', () => {
  describe('getAuditLogs()', () => {
    it('should return paginated logs', async () => {
      const result = await auditLogService.getAuditLogs({ page: 1, pageSize: 50 });
      expect(result.total).toBe(42);
      expect(result.data).toHaveLength(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply all filters', async () => {
      await auditLogService.getAuditLogs({
        entityType: 'RESERVATION', action: 'CREATE', userId: 'u-001',
        entityId: 'res-001', dateFrom: '2026-01-01', dateTo: '2026-12-31',
      });
      const whereCall = mockPrisma.activityLog.findMany.mock.calls[0][0].where;
      expect(whereCall.entityType).toBe('RESERVATION');
      expect(whereCall.action).toBe('CREATE');
      expect(whereCall.userId).toBe('u-001');
      expect(whereCall.createdAt.gte).toBeDefined();
    });

    it('should skip ALL filter values', async () => {
      await auditLogService.getAuditLogs({ entityType: 'ALL', action: 'ALL' });
      const whereCall = mockPrisma.activityLog.findMany.mock.calls[0][0].where;
      expect(whereCall.entityType).toBeUndefined();
      expect(whereCall.action).toBeUndefined();
    });
  });

  describe('getEntityLogs()', () => {
    it('should return logs for specific entity', async () => {
      const result = await auditLogService.getEntityLogs('RESERVATION', 'res-001');
      expect(result).toHaveLength(1);
      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { entityType: 'RESERVATION', entityId: 'res-001' } })
      );
    });
  });

  describe('getRecentActivity()', () => {
    it('should return limited recent logs', async () => {
      await auditLogService.getRecentActivity(5);
      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  describe('getEntityTypes()', () => {
    it('should return distinct entity types sorted', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([
        { entityType: 'RESERVATION' }, { entityType: 'CLIENT' },
      ]);
      const result = await auditLogService.getEntityTypes();
      expect(result).toEqual(['CLIENT', 'RESERVATION']);
    });
  });

  describe('getActions()', () => {
    it('should return distinct actions sorted', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([
        { action: 'UPDATE' }, { action: 'CREATE' },
      ]);
      const result = await auditLogService.getActions();
      expect(result).toEqual(['CREATE', 'UPDATE']);
    });
  });

  describe('getStatistics()', () => {
    it('should return aggregated stats', async () => {
      mockPrisma.activityLog.groupBy.mockResolvedValue([]);
      const result = await auditLogService.getStatistics();
      expect(result.totalLogs).toBe(42);
      expect(result.byEntityType).toBeDefined();
      expect(result.byAction).toBeDefined();
      expect(result.byUser).toBeDefined();
    });
  });
});
