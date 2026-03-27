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

  describe('edge cases / branch coverage', () => {
    // ═══ getAuditLogs — branch filters ═══
    describe('getAuditLogs() — branch filters', () => {
      const setup = () => {
        mockPrisma.activityLog.count.mockResolvedValue(0);
        mockPrisma.activityLog.findMany.mockResolvedValue([]);
      };

      it('should use default page and pageSize', async () => {
        setup();
        const result = await auditLogService.getAuditLogs({});
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(50);
      });

      it('should filter by entityType (not ALL)', async () => {
        setup();
        await auditLogService.getAuditLogs({ entityType: 'RESERVATION' });
        expect(mockPrisma.activityLog.count).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ entityType: 'RESERVATION' }) })
        );
      });

      it('should filter by action (not ALL)', async () => {
        setup();
        await auditLogService.getAuditLogs({ action: 'CREATE' });
        expect(mockPrisma.activityLog.count).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ action: 'CREATE' }) })
        );
      });

      it('should filter by userId', async () => {
        setup();
        await auditLogService.getAuditLogs({ userId: 'u-1' });
        expect(mockPrisma.activityLog.count).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ userId: 'u-1' }) })
        );
      });

      it('should filter by entityId', async () => {
        setup();
        await auditLogService.getAuditLogs({ entityId: 'e-1' });
        expect(mockPrisma.activityLog.count).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ entityId: 'e-1' }) })
        );
      });

      it('should filter by dateFrom only', async () => {
        setup();
        await auditLogService.getAuditLogs({ dateFrom: '2027-01-01' });
        const where = mockPrisma.activityLog.count.mock.calls[0][0].where;
        expect(where.createdAt.gte).toBeInstanceOf(Date);
        expect(where.createdAt.lte).toBeUndefined();
      });

      it('should filter by dateTo only', async () => {
        setup();
        await auditLogService.getAuditLogs({ dateTo: '2027-12-31' });
        const where = mockPrisma.activityLog.count.mock.calls[0][0].where;
        expect(where.createdAt.lte).toBeInstanceOf(Date);
        expect(where.createdAt.gte).toBeUndefined();
      });

      it('should filter by both dates', async () => {
        setup();
        await auditLogService.getAuditLogs({ dateFrom: '2027-01-01', dateTo: '2027-12-31' });
        const where = mockPrisma.activityLog.count.mock.calls[0][0].where;
        expect(where.createdAt.gte).toBeInstanceOf(Date);
        expect(where.createdAt.lte).toBeInstanceOf(Date);
      });

      it('should not add createdAt when no dates', async () => {
        setup();
        await auditLogService.getAuditLogs({});
        const where = mockPrisma.activityLog.count.mock.calls[0][0].where;
        expect(where.createdAt).toBeUndefined();
      });

      it('should calculate totalPages', async () => {
        mockPrisma.activityLog.count.mockResolvedValue(150);
        mockPrisma.activityLog.findMany.mockResolvedValue([]);
        const result = await auditLogService.getAuditLogs({ pageSize: 50 });
        expect(result.totalPages).toBe(3);
      });
    });

    // ═══ getEntityTypes — filter nulls ═══
    describe('getEntityTypes() — filter nulls', () => {
      it('should filter out null types and sort', async () => {
        mockPrisma.activityLog.findMany.mockResolvedValue([
          { entityType: 'RESERVATION' },
          { entityType: null },
          { entityType: 'DEPOSIT' },
        ]);
        const result = await auditLogService.getEntityTypes();
        expect(result).toEqual(['DEPOSIT', 'RESERVATION']);
      });

      it('should return empty when no types', async () => {
        mockPrisma.activityLog.findMany.mockResolvedValue([]);
        const result = await auditLogService.getEntityTypes();
        expect(result).toEqual([]);
      });
    });

    // ═══ getRecentActivity — default limit ═══
    describe('getRecentActivity() — default limit', () => {
      it('should use default limit of 10', async () => {
        mockPrisma.activityLog.findMany.mockResolvedValue([]);
        await auditLogService.getRecentActivity();
        expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 10 })
        );
      });
    });

    // ═══ getStatistics — date filters, fallbacks ═══
    describe('getStatistics() — date filters & fallbacks', () => {
      const setupStats = () => {
        mockPrisma.activityLog.count.mockResolvedValue(100);
        mockPrisma.activityLog.groupBy.mockResolvedValue([]);
        mockPrisma.user.findMany.mockResolvedValue([]);
      };

      it('should return stats without date filter', async () => {
        setupStats();
        const result = await auditLogService.getStatistics();
        expect(result.totalLogs).toBe(100);
      });

      it('should filter by dateFrom', async () => {
        setupStats();
        await auditLogService.getStatistics('2027-01-01');
        const countWhere = mockPrisma.activityLog.count.mock.calls[0][0].where;
        expect(countWhere.createdAt.gte).toBeInstanceOf(Date);
      });

      it('should filter by dateTo', async () => {
        setupStats();
        await auditLogService.getStatistics(undefined, '2027-12-31');
        const countWhere = mockPrisma.activityLog.count.mock.calls[0][0].where;
        expect(countWhere.createdAt.lte).toBeInstanceOf(Date);
      });

      it('should filter by both dates', async () => {
        setupStats();
        await auditLogService.getStatistics('2027-01-01', '2027-12-31');
        const countWhere = mockPrisma.activityLog.count.mock.calls[0][0].where;
        expect(countWhere.createdAt.gte).toBeInstanceOf(Date);
        expect(countWhere.createdAt.lte).toBeInstanceOf(Date);
      });

      it('should handle entityType null fallback (Unknown)', async () => {
        mockPrisma.activityLog.count.mockResolvedValue(10);
        mockPrisma.activityLog.groupBy
          .mockResolvedValueOnce([{ entityType: null, _count: { entityType: 5 } }])
          .mockResolvedValueOnce([{ action: 'CREATE', _count: { action: 10 } }])
          .mockResolvedValueOnce([]);
        mockPrisma.user.findMany.mockResolvedValue([]);

        const result = await auditLogService.getStatistics();
        expect(result.byEntityType[0].entityType).toBe('Unknown');
      });

      it('should map userId to user details', async () => {
        mockPrisma.activityLog.count.mockResolvedValue(10);
        mockPrisma.activityLog.groupBy
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ userId: 'u-1', _count: { userId: 5 } }]);
        mockPrisma.user.findMany.mockResolvedValue([
          { id: 'u-1', email: 'a@b.pl', firstName: 'Jan', lastName: 'K' },
        ]);

        const result = await auditLogService.getStatistics();
        expect(result.byUser[0].user).toBeDefined();
        expect(result.byUser[0].user!.email).toBe('a@b.pl');
      });

      it('should handle null userId in byUser', async () => {
        mockPrisma.activityLog.count.mockResolvedValue(10);
        mockPrisma.activityLog.groupBy
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ userId: null, _count: { userId: 2 } }]);
        mockPrisma.user.findMany.mockResolvedValue([]);

        const result = await auditLogService.getStatistics();
        expect(result.byUser[0].user).toBeNull();
      });
    });
  });
});
