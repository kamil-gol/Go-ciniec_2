/**
 * AuditLogService — Branch Coverage
 * getAuditLogs: all filter branches (entityType ALL, action ALL, userId, entityId,
 *   dateFrom only, dateTo only, both dates)
 * getEntityTypes: filter null types
 * getRecentActivity: default limit
 * getStatistics: date filters, entityType fallback, userId ternary
 * getActions: basic
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    activityLog: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    user: { findMany: jest.fn() },
  },
}));

import auditLogService from '../../../services/audit-log.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;

beforeEach(() => jest.resetAllMocks());

describe('AuditLogService — branches', () => {

  // ═══ getAuditLogs ═══
  describe('getAuditLogs()', () => {
    const setup = () => {
      db.activityLog.count.mockResolvedValue(0);
      db.activityLog.findMany.mockResolvedValue([]);
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
      expect(db.activityLog.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ entityType: 'RESERVATION' }) })
      );
    });

    it('should skip entityType filter when ALL', async () => {
      setup();
      await auditLogService.getAuditLogs({ entityType: 'ALL' });
      const where = db.activityLog.count.mock.calls[0][0].where;
      expect(where.entityType).toBeUndefined();
    });

    it('should filter by action (not ALL)', async () => {
      setup();
      await auditLogService.getAuditLogs({ action: 'CREATE' });
      expect(db.activityLog.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ action: 'CREATE' }) })
      );
    });

    it('should skip action filter when ALL', async () => {
      setup();
      await auditLogService.getAuditLogs({ action: 'ALL' });
      const where = db.activityLog.count.mock.calls[0][0].where;
      expect(where.action).toBeUndefined();
    });

    it('should filter by userId', async () => {
      setup();
      await auditLogService.getAuditLogs({ userId: 'u-1' });
      expect(db.activityLog.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'u-1' }) })
      );
    });

    it('should filter by entityId', async () => {
      setup();
      await auditLogService.getAuditLogs({ entityId: 'e-1' });
      expect(db.activityLog.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ entityId: 'e-1' }) })
      );
    });

    it('should filter by dateFrom only', async () => {
      setup();
      await auditLogService.getAuditLogs({ dateFrom: '2027-01-01' });
      const where = db.activityLog.count.mock.calls[0][0].where;
      expect(where.createdAt.gte).toBeInstanceOf(Date);
      expect(where.createdAt.lte).toBeUndefined();
    });

    it('should filter by dateTo only', async () => {
      setup();
      await auditLogService.getAuditLogs({ dateTo: '2027-12-31' });
      const where = db.activityLog.count.mock.calls[0][0].where;
      expect(where.createdAt.lte).toBeInstanceOf(Date);
      expect(where.createdAt.gte).toBeUndefined();
    });

    it('should filter by both dates', async () => {
      setup();
      await auditLogService.getAuditLogs({ dateFrom: '2027-01-01', dateTo: '2027-12-31' });
      const where = db.activityLog.count.mock.calls[0][0].where;
      expect(where.createdAt.gte).toBeInstanceOf(Date);
      expect(where.createdAt.lte).toBeInstanceOf(Date);
    });

    it('should not add createdAt when no dates', async () => {
      setup();
      await auditLogService.getAuditLogs({});
      const where = db.activityLog.count.mock.calls[0][0].where;
      expect(where.createdAt).toBeUndefined();
    });

    it('should calculate totalPages', async () => {
      db.activityLog.count.mockResolvedValue(150);
      db.activityLog.findMany.mockResolvedValue([]);
      const result = await auditLogService.getAuditLogs({ pageSize: 50 });
      expect(result.totalPages).toBe(3);
    });
  });

  // ═══ getEntityTypes ═══
  describe('getEntityTypes()', () => {
    it('should filter out null types and sort', async () => {
      db.activityLog.findMany.mockResolvedValue([
        { entityType: 'RESERVATION' },
        { entityType: null },
        { entityType: 'DEPOSIT' },
      ]);
      const result = await auditLogService.getEntityTypes();
      expect(result).toEqual(['DEPOSIT', 'RESERVATION']);
    });

    it('should return empty when no types', async () => {
      db.activityLog.findMany.mockResolvedValue([]);
      const result = await auditLogService.getEntityTypes();
      expect(result).toEqual([]);
    });
  });

  // ═══ getRecentActivity ═══
  describe('getRecentActivity()', () => {
    it('should use default limit of 10', async () => {
      db.activityLog.findMany.mockResolvedValue([]);
      await auditLogService.getRecentActivity();
      expect(db.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });

    it('should use custom limit', async () => {
      db.activityLog.findMany.mockResolvedValue([]);
      await auditLogService.getRecentActivity(5);
      expect(db.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  // ═══ getActions ═══
  describe('getActions()', () => {
    it('should return sorted actions', async () => {
      db.activityLog.findMany.mockResolvedValue([
        { action: 'DELETE' },
        { action: 'CREATE' },
      ]);
      const result = await auditLogService.getActions();
      expect(result).toEqual(['CREATE', 'DELETE']);
    });
  });

  // ═══ getStatistics ═══
  describe('getStatistics()', () => {
    const setupStats = () => {
      db.activityLog.count.mockResolvedValue(100);
      db.activityLog.groupBy.mockResolvedValue([]);
      db.user.findMany.mockResolvedValue([]);
    };

    it('should return stats without date filter', async () => {
      setupStats();
      const result = await auditLogService.getStatistics();
      expect(result.totalLogs).toBe(100);
    });

    it('should filter by dateFrom', async () => {
      setupStats();
      await auditLogService.getStatistics('2027-01-01');
      const countWhere = db.activityLog.count.mock.calls[0][0].where;
      expect(countWhere.createdAt.gte).toBeInstanceOf(Date);
    });

    it('should filter by dateTo', async () => {
      setupStats();
      await auditLogService.getStatistics(undefined, '2027-12-31');
      const countWhere = db.activityLog.count.mock.calls[0][0].where;
      expect(countWhere.createdAt.lte).toBeInstanceOf(Date);
    });

    it('should filter by both dates', async () => {
      setupStats();
      await auditLogService.getStatistics('2027-01-01', '2027-12-31');
      const countWhere = db.activityLog.count.mock.calls[0][0].where;
      expect(countWhere.createdAt.gte).toBeInstanceOf(Date);
      expect(countWhere.createdAt.lte).toBeInstanceOf(Date);
    });

    it('should handle entityType null fallback (Unknown)', async () => {
      db.activityLog.count.mockResolvedValue(10);
      db.activityLog.groupBy
        .mockResolvedValueOnce([{ entityType: null, _count: { entityType: 5 } }])  // byEntityType
        .mockResolvedValueOnce([{ action: 'CREATE', _count: { action: 10 } }])      // byAction
        .mockResolvedValueOnce([]);                                                   // byUser
      db.user.findMany.mockResolvedValue([]);

      const result = await auditLogService.getStatistics();
      expect(result.byEntityType[0].entityType).toBe('Unknown');
    });

    it('should map userId to user details', async () => {
      db.activityLog.count.mockResolvedValue(10);
      db.activityLog.groupBy
        .mockResolvedValueOnce([])  // byEntityType
        .mockResolvedValueOnce([])  // byAction
        .mockResolvedValueOnce([{ userId: 'u-1', _count: { userId: 5 } }]); // byUser
      db.user.findMany.mockResolvedValue([
        { id: 'u-1', email: 'a@b.pl', firstName: 'Jan', lastName: 'K' },
      ]);

      const result = await auditLogService.getStatistics();
      expect(result.byUser[0].user).toBeDefined();
      expect(result.byUser[0].user!.email).toBe('a@b.pl');
    });

    it('should handle null userId in byUser', async () => {
      db.activityLog.count.mockResolvedValue(10);
      db.activityLog.groupBy
        .mockResolvedValueOnce([])  // byEntityType
        .mockResolvedValueOnce([])  // byAction
        .mockResolvedValueOnce([{ userId: null, _count: { userId: 2 } }]); // byUser
      db.user.findMany.mockResolvedValue([]);

      const result = await auditLogService.getStatistics();
      expect(result.byUser[0].user).toBeNull();
    });
  });

  // ═══ getEntityLogs ═══
  describe('getEntityLogs()', () => {
    it('should return logs for entity', async () => {
      db.activityLog.findMany.mockResolvedValue([{ id: 'log-1' }]);
      const result = await auditLogService.getEntityLogs('RESERVATION', 'r-1');
      expect(result).toHaveLength(1);
    });
  });
});
