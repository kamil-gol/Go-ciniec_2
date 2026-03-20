/**
 * NotificationService — Unit Tests
 * Tests business logic with mocked Prisma.
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn() },
    notification: {
      createMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { NotificationService } from '../../../services/notification.service';
import { prisma } from '../../../lib/prisma';

const service = new NotificationService();
const db = prisma as any;

beforeEach(() => jest.clearAllMocks());

describe('NotificationService', () => {
  // ═══ createForAll ═══

  describe('createForAll()', () => {
    it('should create notifications for all active users', async () => {
      db.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }]);
      db.notification.createMany.mockResolvedValue({ count: 3 });

      const result = await service.createForAll({
        type: 'RESERVATION_CREATED',
        title: 'Nowa rezerwacja',
        message: 'Jan Kowalski — Sala A',
      });

      expect(result).toBe(3);
      expect(db.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { id: true },
      });
      expect(db.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'u1', type: 'RESERVATION_CREATED' }),
          expect.objectContaining({ userId: 'u2' }),
          expect.objectContaining({ userId: 'u3' }),
        ]),
      });
    });

    it('should exclude the triggering user', async () => {
      db.user.findMany.mockResolvedValue([{ id: 'u2' }]);
      db.notification.createMany.mockResolvedValue({ count: 1 });

      await service.createForAll({
        type: 'RESERVATION_CREATED',
        title: 'Test',
        message: 'Test msg',
        excludeUserId: 'u1',
      });

      expect(db.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true, id: { not: 'u1' } },
        select: { id: true },
      });
    });

    it('should return 0 when no active users found', async () => {
      db.user.findMany.mockResolvedValue([]);

      const result = await service.createForAll({
        type: 'TEST',
        title: 'Test',
        message: 'Msg',
      });

      expect(result).toBe(0);
      expect(db.notification.createMany).not.toHaveBeenCalled();
    });

    it('should return 0 and log error on failure', async () => {
      db.user.findMany.mockRejectedValue(new Error('DB down'));

      const result = await service.createForAll({
        type: 'TEST',
        title: 'Test',
        message: 'Msg',
      });

      expect(result).toBe(0);
    });

    it('should pass entityType and entityId', async () => {
      db.user.findMany.mockResolvedValue([{ id: 'u1' }]);
      db.notification.createMany.mockResolvedValue({ count: 1 });

      await service.createForAll({
        type: 'RESERVATION_CREATED',
        title: 'Test',
        message: 'Msg',
        entityType: 'RESERVATION',
        entityId: 'res-123',
      });

      expect(db.notification.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({
          entityType: 'RESERVATION',
          entityId: 'res-123',
        })],
      });
    });
  });

  // ═══ createForUser ═══

  describe('createForUser()', () => {
    it('should create notification for specific user', async () => {
      const mockNotif = { id: 'n1', userId: 'u1', type: 'TEST' };
      db.notification.create.mockResolvedValue(mockNotif);

      const result = await service.createForUser('u1', {
        type: 'TEST',
        title: 'Test',
        message: 'Msg',
      });

      expect(result).toEqual(mockNotif);
      expect(db.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 'u1', type: 'TEST' }),
      });
    });

    it('should return null on error', async () => {
      db.notification.create.mockRejectedValue(new Error('DB error'));

      const result = await service.createForUser('u1', {
        type: 'TEST',
        title: 'Test',
        message: 'Msg',
      });

      expect(result).toBeNull();
    });
  });

  // ═══ getByUser ═══

  describe('getByUser()', () => {
    it('should return paginated results with defaults', async () => {
      db.notification.findMany.mockResolvedValue([{ id: 'n1' }]);
      db.notification.count.mockResolvedValue(1);

      const result = await service.getByUser('u1');

      expect(result.data).toEqual([{ id: 'n1' }]);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
      expect(db.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'u1' },
        skip: 0,
        take: 20,
      }));
    });

    it('should filter by unread when unreadOnly=true', async () => {
      db.notification.findMany.mockResolvedValue([]);
      db.notification.count.mockResolvedValue(0);

      await service.getByUser('u1', { unreadOnly: true });

      expect(db.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'u1', read: false },
      }));
    });

    it('should paginate correctly', async () => {
      db.notification.findMany.mockResolvedValue([]);
      db.notification.count.mockResolvedValue(45);

      const result = await service.getByUser('u1', { page: 3, pageSize: 10 });

      expect(db.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 20,
        take: 10,
      }));
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  // ═══ getUnreadCount ═══

  describe('getUnreadCount()', () => {
    it('should return count of unread notifications', async () => {
      db.notification.count.mockResolvedValue(7);

      const result = await service.getUnreadCount('u1');

      expect(result).toBe(7);
      expect(db.notification.count).toHaveBeenCalledWith({
        where: { userId: 'u1', read: false },
      });
    });
  });

  // ═══ markAsRead ═══

  describe('markAsRead()', () => {
    it('should update notification read status', async () => {
      db.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('n1', 'u1');

      expect(db.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'n1', userId: 'u1' },
        data: { read: true },
      });
    });
  });

  // ═══ markAllAsRead ═══

  describe('markAllAsRead()', () => {
    it('should mark all unread as read for user', async () => {
      db.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead('u1');

      expect(db.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', read: false },
        data: { read: true },
      });
    });
  });
});
