/**
 * audit-logger.ts — Unit Tests
 * Tests: logChange, diffObjects
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

import { logChange, diffObjects } from '../../../utils/audit-logger';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('audit-logger', () => {
  describe('logChange', () => {
    it('should log a change', async () => {
      db.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      await logChange({
        userId: 'user-123',
        action: 'UPDATE',
        entityType: 'RESERVATION',
        entityId: 'res-456',
        details: {
          description: 'Status changed',
          changes: {
            status: {
              old: 'PENDING',
              new: 'CONFIRMED',
            },
          },
        },
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: 'UPDATE',
          entityType: 'RESERVATION',
          entityId: 'res-456',
          details: {
            description: 'Status changed',
            changes: {
              status: {
                old: 'PENDING',
                new: 'CONFIRMED',
              },
            },
          },
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
    });

    it('should handle missing userId (system action)', async () => {
      db.auditLog.create.mockResolvedValue({ id: 'audit-2' });

      await logChange({
        userId: null,
        action: 'QUEUE_AUTO_CANCEL',
        entityType: 'RESERVATION',
        entityId: 'system',
        details: {
          description: 'Auto-cancelled 5 expired reservations',
        },
      });

      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it('should not throw when database fails', async () => {
      db.auditLog.create.mockRejectedValue(new Error('Database error'));

      await expect(
        logChange({
          userId: 'user-123',
          action: 'UPDATE',
          entityType: 'RESERVATION',
          entityId: 'res-456',
          details: { description: 'Test' },
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('diffObjects', () => {
    it('should detect changed fields', () => {
      const old = { status: 'PENDING', totalPrice: 5000, notes: 'Old' };
      const updated = { status: 'CONFIRMED', totalPrice: 5000, notes: 'New' };

      const diff = diffObjects(old, updated);

      expect(diff).toEqual({
        status: { old: 'PENDING', new: 'CONFIRMED' },
        notes: { old: 'Old', new: 'New' },
      });
    });

    it('should ignore unchanged fields', () => {
      const old = { status: 'PENDING', totalPrice: 5000 };
      const updated = { status: 'PENDING', totalPrice: 5000 };

      const diff = diffObjects(old, updated);

      expect(diff).toEqual({});
    });
  });
});
