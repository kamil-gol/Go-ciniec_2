/**
 * Unit tests for ArchiveSchedulerService (#144)
 *
 * Tests cover:
 * - Happy path: archiving CANCELLED reservations older than cutoff
 * - Empty result: no candidates to archive
 * - ARCHIVE_AFTER_DAYS env variable: default, custom, invalid
 * - Batch limit: max 100 per run
 * - Transaction: updateMany + history entries
 * - Audit logging: fire-and-forget logChange calls
 */

// ─── Mocks ───────────────────────────────────────────────

const mockFindMany = jest.fn();
const mockUpdateMany = jest.fn();
const mockHistoryCreate = jest.fn();
const mockTransaction = jest.fn();
const mockLogChange = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    reservation: {
      findMany: (...args: any[]) => mockFindMany(...args),
    },
    $transaction: (fn: any) => mockTransaction(fn),
  },
}));

jest.mock('../../utils/audit-logger', () => ({
  logChange: (...args: any[]) => mockLogChange(...args),
}));

jest.mock('@utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { ArchiveSchedulerService } from '@services/archive-scheduler.service';

// ─── Helpers ─────────────────────────────────────────────

function makeCandidates(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `res-${i + 1}`,
    client: { firstName: 'Jan', lastName: `Kowalski-${i + 1}` },
    hall: { name: `Sala ${i + 1}` },
  }));
}

function setupTransaction() {
  mockTransaction.mockImplementation(async (fn: any) => {
    const tx = {
      reservation: { updateMany: mockUpdateMany },
      reservationHistory: { create: mockHistoryCreate },
    };
    return fn(tx);
  });
}

// ─── Tests ───────────────────────────────────────────────

describe('ArchiveSchedulerService', () => {
  let service: ArchiveSchedulerService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T02:00:00.000Z'));
    process.env = { ...originalEnv };
    delete process.env.ARCHIVE_AFTER_DAYS;
    service = new ArchiveSchedulerService();
    mockLogChange.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  // ═══════════════════════════════════════════════════════
  // Happy path
  // ═══════════════════════════════════════════════════════

  describe('archiveCancelled() — happy path', () => {
    it('should archive CANCELLED reservations older than 30 days (default)', async () => {
      const candidates = makeCandidates(3);
      mockFindMany.mockResolvedValue(candidates);
      setupTransaction();

      const result = await service.archiveCancelled();

      // Verify findMany query
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'CANCELLED',
            archivedAt: null,
            updatedAt: { lt: expect.any(Date) },
          }),
          take: 100,
          orderBy: { updatedAt: 'asc' },
        })
      );

      // Verify cutoff date is ~30 days before now
      const callArgs = mockFindMany.mock.calls[0][0];
      const cutoff = callArgs.where.updatedAt.lt as Date;
      const expectedCutoff = new Date('2026-02-13T02:00:00.000Z'); // 30 days before Mar 15
      expect(cutoff.toISOString()).toBe(expectedCutoff.toISOString());

      // Verify transaction: updateMany called with correct IDs
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ['res-1', 'res-2', 'res-3'] } },
        data: {
          status: 'ARCHIVED',
          archivedAt: expect.any(Date),
        },
      });

      // Verify history entries created for each candidate
      expect(mockHistoryCreate).toHaveBeenCalledTimes(3);
      expect(mockHistoryCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reservationId: 'res-1',
          changedByUserId: 'SYSTEM',
          changeType: 'AUTO_ARCHIVED',
          fieldName: 'status',
          oldValue: 'CANCELLED',
          newValue: 'ARCHIVED',
        }),
      });

      // Verify result
      expect(result).toEqual({
        archivedCount: 3,
        archivedIds: ['res-1', 'res-2', 'res-3'],
      });
    });

    it('should call logChange for each archived reservation', async () => {
      const candidates = makeCandidates(2);
      mockFindMany.mockResolvedValue(candidates);
      setupTransaction();

      await service.archiveCancelled();

      // Wait for fire-and-forget audit logs
      await new Promise(resolve => setTimeout(resolve, 0));
      jest.runAllTimers();

      expect(mockLogChange).toHaveBeenCalledTimes(2);
      expect(mockLogChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'SYSTEM',
          action: 'AUTO_ARCHIVED',
          entityType: 'RESERVATION',
          entityId: 'res-1',
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  // No candidates
  // ═══════════════════════════════════════════════════════

  describe('archiveCancelled() — no candidates', () => {
    it('should return zeros when no CANCELLED reservations found', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await service.archiveCancelled();

      expect(result).toEqual({ archivedCount: 0, archivedIds: [] });
      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockLogChange).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════
  // ARCHIVE_AFTER_DAYS env variable
  // ═══════════════════════════════════════════════════════

  describe('ARCHIVE_AFTER_DAYS configuration', () => {
    it('should use custom ARCHIVE_AFTER_DAYS value from env', async () => {
      process.env.ARCHIVE_AFTER_DAYS = '7';
      mockFindMany.mockResolvedValue([]);

      await service.archiveCancelled();

      const callArgs = mockFindMany.mock.calls[0][0];
      const cutoff = callArgs.where.updatedAt.lt as Date;
      const expectedCutoff = new Date('2026-03-08T02:00:00.000Z'); // 7 days before Mar 15
      expect(cutoff.toISOString()).toBe(expectedCutoff.toISOString());
    });

    it('should fall back to 30 days when ARCHIVE_AFTER_DAYS is invalid', async () => {
      process.env.ARCHIVE_AFTER_DAYS = 'abc';
      mockFindMany.mockResolvedValue([]);

      await service.archiveCancelled();

      const callArgs = mockFindMany.mock.calls[0][0];
      const cutoff = callArgs.where.updatedAt.lt as Date;
      const expectedCutoff = new Date('2026-02-13T02:00:00.000Z'); // 30 days (default)
      expect(cutoff.toISOString()).toBe(expectedCutoff.toISOString());
    });

    it('should fall back to 30 days when ARCHIVE_AFTER_DAYS is negative', async () => {
      process.env.ARCHIVE_AFTER_DAYS = '-5';
      mockFindMany.mockResolvedValue([]);

      await service.archiveCancelled();

      const callArgs = mockFindMany.mock.calls[0][0];
      const cutoff = callArgs.where.updatedAt.lt as Date;
      const expectedCutoff = new Date('2026-02-13T02:00:00.000Z');
      expect(cutoff.toISOString()).toBe(expectedCutoff.toISOString());
    });

    it('should fall back to 30 days when ARCHIVE_AFTER_DAYS is zero', async () => {
      process.env.ARCHIVE_AFTER_DAYS = '0';
      mockFindMany.mockResolvedValue([]);

      await service.archiveCancelled();

      const callArgs = mockFindMany.mock.calls[0][0];
      const cutoff = callArgs.where.updatedAt.lt as Date;
      const expectedCutoff = new Date('2026-02-13T02:00:00.000Z');
      expect(cutoff.toISOString()).toBe(expectedCutoff.toISOString());
    });
  });

  // ═══════════════════════════════════════════════════════
  // Batch limit
  // ═══════════════════════════════════════════════════════

  describe('archiveCancelled() — batch limit', () => {
    it('should request at most 100 candidates (BATCH_SIZE)', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.archiveCancelled();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  // History entries
  // ═══════════════════════════════════════════════════════

  describe('archiveCancelled() — history entries', () => {
    it('should create history with Polish reason including days count', async () => {
      process.env.ARCHIVE_AFTER_DAYS = '14';
      const candidates = makeCandidates(1);
      mockFindMany.mockResolvedValue(candidates);
      setupTransaction();

      await service.archiveCancelled();

      expect(mockHistoryCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: expect.stringContaining('14 dni'),
        }),
      });
    });
  });

  // ═══════════════════════════════════════════════════════
  // Audit log failure resilience
  // ═══════════════════════════════════════════════════════

  describe('archiveCancelled() — audit log failure', () => {
    it('should not throw when logChange fails (fire-and-forget)', async () => {
      const candidates = makeCandidates(1);
      mockFindMany.mockResolvedValue(candidates);
      setupTransaction();
      mockLogChange.mockRejectedValue(new Error('Audit DB down'));

      // Should NOT throw despite audit failure
      await expect(service.archiveCancelled()).resolves.toEqual({
        archivedCount: 1,
        archivedIds: ['res-1'],
      });
    });
  });

  // ═══════════════════════════════════════════════════════
  // Client/hall null safety
  // ═══════════════════════════════════════════════════════

  describe('archiveCancelled() — null safety', () => {
    it('should handle missing client/hall gracefully in audit logs', async () => {
      const candidates = [{
        id: 'res-orphan',
        client: null,
        hall: null,
      }];
      mockFindMany.mockResolvedValue(candidates);
      setupTransaction();

      const result = await service.archiveCancelled();

      expect(result.archivedCount).toBe(1);

      // Wait for audit logs
      await new Promise(resolve => setTimeout(resolve, 0));
      jest.runAllTimers();

      expect(mockLogChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            description: expect.stringContaining('Nieznany klient'),
          }),
        })
      );
    });
  });
});
