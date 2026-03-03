import { logChange } from '@/utils/audit-logger';
import db from '@/utils/db';

jest.mock('@/utils/db', () => ({
  __esModule: true,
  default: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('audit-logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logChange', () => {
    it('should log a change', async () => {
      (db.auditLog.create as jest.Mock).mockResolvedValue({
        id: 'audit-1',
        userId: 'user-123',
        action: 'UPDATE',
      });

      await logChange({
        userId: 'user-123',
        action: 'UPDATE',
        entityType: 'RESERVATION',
        entityId: 'res-456',
        changes: {
          status: { old: 'PENDING', new: 'CONFIRMED' },
        },
        description: 'Status changed',
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: 'UPDATE',
          entityType: 'RESERVATION',
          entityId: 'res-456',
          details: {
            changes: {
              status: { old: 'PENDING', new: 'CONFIRMED' },
            },
            description: 'Status changed',
          },
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
    });

    it('should handle missing userId (system action)', async () => {
      (db.auditLog.create as jest.Mock).mockResolvedValue({
        id: 'audit-2',
        userId: null,
        action: 'CREATE',
      });

      await logChange({
        userId: undefined,
        action: 'CREATE',
        entityType: 'RESERVATION',
        entityId: 'res-789',
      });

      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it('should not throw when database fails', async () => {
      (db.auditLog.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        logChange({
          userId: 'user-123',
          action: 'DELETE',
          entityType: 'CLIENT',
          entityId: 'client-1',
        })
      ).resolves.not.toThrow();
    });
  });
});
