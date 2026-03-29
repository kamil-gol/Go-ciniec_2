/**
 * ArchiveSchedulerService — Unit Tests (#445)
 * Tests business logic: config resolution, batch archiving, audit logging.
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    companySettings: { findFirst: jest.fn() },
    reservation: { findMany: jest.fn(), updateMany: jest.fn() },
    reservationHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { ArchiveSchedulerService } from '../../../services/archive-scheduler.service';
import { prisma } from '../../../lib/prisma';
import { logChange } from '../../../utils/audit-logger';

const db = prisma as any;
const service = new ArchiveSchedulerService();

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ARCHIVE_AFTER_DAYS;
});

describe('ArchiveSchedulerService', () => {
  // ═══ Config resolution ═══

  describe('config resolution (archiveAfterDays)', () => {
    it('should use DB value when available', async () => {
      db.companySettings.findFirst.mockResolvedValue({ archiveAfterDays: 60 });
      db.reservation.findMany.mockResolvedValue([]);

      const result = await service.archiveCancelled();

      expect(result.archiveAfterDays).toBe(60);
      expect(result.archivedCount).toBe(0);
    });

    it('should fall back to env var when DB returns null', async () => {
      db.companySettings.findFirst.mockResolvedValue(null);
      process.env.ARCHIVE_AFTER_DAYS = '45';
      db.reservation.findMany.mockResolvedValue([]);

      const result = await service.archiveCancelled();

      expect(result.archiveAfterDays).toBe(45);
    });

    it('should fall back to env var when DB throws', async () => {
      db.companySettings.findFirst.mockRejectedValue(new Error('DB down'));
      process.env.ARCHIVE_AFTER_DAYS = '15';
      db.reservation.findMany.mockResolvedValue([]);

      const result = await service.archiveCancelled();

      expect(result.archiveAfterDays).toBe(15);
    });

    it('should use default 30 when DB and env are both unavailable', async () => {
      db.companySettings.findFirst.mockResolvedValue(null);
      db.reservation.findMany.mockResolvedValue([]);

      const result = await service.archiveCancelled();

      expect(result.archiveAfterDays).toBe(30);
    });

    it('should use default 30 when env var is invalid', async () => {
      db.companySettings.findFirst.mockResolvedValue(null);
      process.env.ARCHIVE_AFTER_DAYS = 'not-a-number';
      db.reservation.findMany.mockResolvedValue([]);

      const result = await service.archiveCancelled();

      expect(result.archiveAfterDays).toBe(30);
    });

    it('should use default 30 when DB archiveAfterDays is 0', async () => {
      db.companySettings.findFirst.mockResolvedValue({ archiveAfterDays: 0 });
      db.reservation.findMany.mockResolvedValue([]);

      const result = await service.archiveCancelled();

      expect(result.archiveAfterDays).toBe(30);
    });
  });

  // ═══ archiveCancelled ═══

  describe('archiveCancelled()', () => {
    const candidates = [
      {
        id: 'res-1',
        client: { firstName: 'Jan', lastName: 'Kowalski' },
        hall: { name: 'Sala A' },
      },
      {
        id: 'res-2',
        client: { firstName: 'Anna', lastName: 'Nowak' },
        hall: { name: 'Sala B' },
      },
    ];

    beforeEach(() => {
      db.companySettings.findFirst.mockResolvedValue({ archiveAfterDays: 30 });
    });

    it('should return empty result when no candidates found', async () => {
      db.reservation.findMany.mockResolvedValue([]);

      const result = await service.archiveCancelled();

      expect(result).toEqual({
        archivedCount: 0,
        archivedIds: [],
        archiveAfterDays: 30,
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('should archive candidates in a transaction', async () => {
      db.reservation.findMany.mockResolvedValue(candidates);
      db.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          reservation: { updateMany: jest.fn() },
          reservationHistory: { create: jest.fn() },
        };
        await fn(tx);
        return tx;
      });

      const result = await service.archiveCancelled();

      expect(result.archivedCount).toBe(2);
      expect(result.archivedIds).toEqual(['res-1', 'res-2']);
      expect(result.archiveAfterDays).toBe(30);
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should call updateMany with correct status and IDs', async () => {
      db.reservation.findMany.mockResolvedValue(candidates);

      let capturedTx: any;
      db.$transaction.mockImplementation(async (fn: Function) => {
        capturedTx = {
          reservation: { updateMany: jest.fn() },
          reservationHistory: { create: jest.fn() },
        };
        await fn(capturedTx);
      });

      await service.archiveCancelled();

      expect(capturedTx.reservation.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['res-1', 'res-2'] } },
        data: expect.objectContaining({
          status: 'ARCHIVED',
          archivedAt: expect.any(Date),
        }),
      });
    });

    it('should create history entries for each candidate', async () => {
      db.reservation.findMany.mockResolvedValue(candidates);

      let capturedTx: any;
      db.$transaction.mockImplementation(async (fn: Function) => {
        capturedTx = {
          reservation: { updateMany: jest.fn() },
          reservationHistory: { create: jest.fn() },
        };
        await fn(capturedTx);
      });

      await service.archiveCancelled();

      expect(capturedTx.reservationHistory.create).toHaveBeenCalledTimes(2);
      expect(capturedTx.reservationHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reservationId: 'res-1',
          changedByUserId: 'SYSTEM',
          changeType: 'AUTO_ARCHIVED',
          fieldName: 'status',
          oldValue: 'CANCELLED',
          newValue: 'ARCHIVED',
        }),
      });
    });

    it('should fire audit logs for each archived reservation', async () => {
      db.reservation.findMany.mockResolvedValue(candidates);
      db.$transaction.mockImplementation(async (fn: Function) => {
        await fn({
          reservation: { updateMany: jest.fn() },
          reservationHistory: { create: jest.fn() },
        });
      });

      await service.archiveCancelled();

      expect(logChange).toHaveBeenCalledTimes(2);
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'SYSTEM',
          action: 'AUTO_ARCHIVED',
          entityType: 'RESERVATION',
          entityId: 'res-1',
          details: expect.objectContaining({
            description: 'Auto-archiwizacja rezerwacji: Jan Kowalski | Sala A',
          }),
        })
      );
    });

    it('should handle missing client gracefully in audit log', async () => {
      db.reservation.findMany.mockResolvedValue([
        { id: 'res-3', client: null, hall: null },
      ]);
      db.$transaction.mockImplementation(async (fn: Function) => {
        await fn({
          reservation: { updateMany: jest.fn() },
          reservationHistory: { create: jest.fn() },
        });
      });

      await service.archiveCancelled();

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'res-3',
          details: expect.objectContaining({
            description: 'Auto-archiwizacja rezerwacji: Nieznany klient | Brak sali',
          }),
        })
      );
    });

    it('should not throw when audit log fails', async () => {
      db.reservation.findMany.mockResolvedValue([candidates[0]]);
      db.$transaction.mockImplementation(async (fn: Function) => {
        await fn({
          reservation: { updateMany: jest.fn() },
          reservationHistory: { create: jest.fn() },
        });
      });
      (logChange as jest.Mock).mockRejectedValue(new Error('Audit failed'));

      // Should not throw
      const result = await service.archiveCancelled();
      expect(result.archivedCount).toBe(1);
    });

    it('should query only CANCELLED reservations with null archivedAt', async () => {
      db.reservation.findMany.mockResolvedValue([]);

      await service.archiveCancelled();

      expect(db.reservation.findMany).toHaveBeenCalledWith(
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
    });
  });
});
