/**
 * ArchiveAdminController — Unit Tests
 *
 * Covers: getArchiveSettings, updateArchiveSettings, runArchiveNow
 */

// ─── Mocks ───────────────────────────────────────────────
const mockFindFirst = jest.fn();
const mockCount = jest.fn();
const mockUpdate = jest.fn();
const mockLogChange = jest.fn().mockResolvedValue(undefined);
const mockArchiveCancelled = jest.fn();

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    companySettings: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
    reservation: {
      count: (...args: any[]) => mockCount(...args),
    },
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: (...args: any[]) => mockLogChange(...args),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../services/archive-scheduler.service', () => ({
  __esModule: true,
  default: {
    archiveCancelled: (...args: any[]) => mockArchiveCancelled(...args),
  },
}));

import { ArchiveAdminController } from '../../../controllers/archive-admin.controller';

// ─── Helpers ─────────────────────────────────────────────
const controller = new ArchiveAdminController();

const req = (overrides: any = {}): any => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'user-1' },
  ...overrides,
});

const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

// ─── Tests ───────────────────────────────────────────────
describe('ArchiveAdminController', () => {
  // ═══════════════════════════════════════════════════════
  // getArchiveSettings
  // ═══════════════════════════════════════════════════════
  describe('getArchiveSettings()', () => {
    it('should return settings with counts and default archiveAfterDays=30 when no settings', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCount
        .mockResolvedValueOnce(5)   // pendingCandidatesCount
        .mockResolvedValueOnce(10)  // totalCancelledCount
        .mockResolvedValueOnce(20); // archivedTotalCount

      const response = res();
      await controller.getArchiveSettings(req(), response);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            archiveAfterDays: 30,
            pendingCandidatesCount: 5,
            totalCancelledCount: 10,
            archivedTotalCount: 20,
            cutoffDate: expect.any(String),
          }),
        })
      );
    });

    it('should use archiveAfterDays from settings when present', async () => {
      mockFindFirst.mockResolvedValue({ archiveAfterDays: 60 });
      mockCount.mockResolvedValue(0);

      const response = res();
      await controller.getArchiveSettings(req(), response);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ archiveAfterDays: 60 }),
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  // updateArchiveSettings
  // ═══════════════════════════════════════════════════════
  describe('updateArchiveSettings()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.updateArchiveSettings(req({ user: undefined }), res())
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when archiveAfterDays missing', async () => {
      await expect(
        controller.updateArchiveSettings(req({ body: {} }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when archiveAfterDays is 0', async () => {
      await expect(
        controller.updateArchiveSettings(req({ body: { archiveAfterDays: 0 } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when archiveAfterDays > 365', async () => {
      await expect(
        controller.updateArchiveSettings(req({ body: { archiveAfterDays: 400 } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when archiveAfterDays is NaN', async () => {
      await expect(
        controller.updateArchiveSettings(req({ body: { archiveAfterDays: 'abc' } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 404 when companySettings not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      await expect(
        controller.updateArchiveSettings(req({ body: { archiveAfterDays: 45 } }), res())
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should update settings and log change on valid input', async () => {
      mockFindFirst.mockResolvedValue({ id: 'cs-1', archiveAfterDays: 30 });
      mockUpdate.mockResolvedValue({ archiveAfterDays: 45 });

      const response = res();
      await controller.updateArchiveSettings(
        req({ body: { archiveAfterDays: 45 } }), response
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cs-1' },
          data: { archiveAfterDays: 45 },
        })
      );
      expect(mockLogChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          action: 'ARCHIVE_SETTINGS_UPDATED',
          entityType: 'CompanySettings',
          entityId: 'cs-1',
        })
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { archiveAfterDays: 45 },
        })
      );
    });

    it('should parse string archiveAfterDays to number', async () => {
      mockFindFirst.mockResolvedValue({ id: 'cs-1', archiveAfterDays: 30 });
      mockUpdate.mockResolvedValue({ archiveAfterDays: 90 });

      const response = res();
      await controller.updateArchiveSettings(
        req({ body: { archiveAfterDays: '90' } }), response
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { archiveAfterDays: 90 } })
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  // runArchiveNow
  // ═══════════════════════════════════════════════════════
  describe('runArchiveNow()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.runArchiveNow(req({ user: undefined }), res())
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should run archive and return result with message (archivedCount > 0)', async () => {
      const archiveResult = {
        archivedCount: 3,
        archivedIds: ['r-1', 'r-2', 'r-3'],
        archiveAfterDays: 30,
      };
      mockArchiveCancelled.mockResolvedValue(archiveResult);

      const response = res();
      await controller.runArchiveNow(req(), response);

      expect(mockArchiveCancelled).toHaveBeenCalled();
      expect(mockLogChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MANUAL_ARCHIVE_RUN',
          entityType: 'RESERVATION',
          entityId: 'BATCH',
          details: expect.objectContaining({
            archivedCount: 3,
            triggeredBy: 'ADMIN_PANEL',
          }),
        })
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: archiveResult,
        })
      );
    });

    it('should return appropriate message when no reservations archived', async () => {
      const archiveResult = {
        archivedCount: 0,
        archivedIds: [],
        archiveAfterDays: 30,
      };
      mockArchiveCancelled.mockResolvedValue(archiveResult);

      const response = res();
      await controller.runArchiveNow(req(), response);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Brak rezerwacji do archiwizacji',
        })
      );
    });
  });
});
