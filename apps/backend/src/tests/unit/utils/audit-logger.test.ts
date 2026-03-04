import { logChange } from '../../../utils/audit-logger';
import { prisma } from '../../../lib/prisma';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    activityLog: {
      create: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe('audit-logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logChange', () => {
    it('should log a change', async () => {
      mockPrisma.activityLog.create.mockResolvedValue({
        id: 'audit-1',
        userId: 'user-123',
        action: 'UPDATE',
      });

      await logChange({
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
      });

      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
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
      mockPrisma.activityLog.create.mockResolvedValue({
        id: 'audit-2',
        userId: null,
        action: 'CREATE',
      });

      await logChange({
        action: 'CREATE',
        entityType: 'RESERVATION',
        entityId: 'res-789',
      });

      expect(mockPrisma.activityLog.create).toHaveBeenCalled();
    });

    it('should not throw when database fails', async () => {
      mockPrisma.activityLog.create.mockRejectedValue(new Error('DB error'));

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
