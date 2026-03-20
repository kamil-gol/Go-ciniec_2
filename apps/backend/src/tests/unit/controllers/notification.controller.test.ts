/**
 * NotificationController — Unit Tests
 * Tests auth checks, validation, response formatting.
 * Service layer is fully mocked.
 */

jest.mock('../../../services/notification.service', () => ({
  __esModule: true,
  default: {
    getByUser: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    createForAll: jest.fn(),
    createForUser: jest.fn(),
  },
}));

import { NotificationController } from '../../../controllers/notification.controller';
import notificationService from '../../../services/notification.service';

const controller = new NotificationController();
const svc = notificationService as any;

const req = (overrides: any = {}): any => ({
  query: {},
  params: {},
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

describe('NotificationController', () => {
  // ═══ getNotifications ═══

  describe('getNotifications()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.getNotifications(req({ user: undefined }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return paginated notifications', async () => {
      const mockData = {
        data: [{ id: 'n1', title: 'Test' }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      };
      svc.getByUser.mockResolvedValue(mockData);

      const r = res();
      await controller.getNotifications(req(), r);

      expect(svc.getByUser).toHaveBeenCalledWith('user-1', {
        page: 1,
        pageSize: 20,
        unreadOnly: false,
      });
      expect(r.json).toHaveBeenCalledWith({ success: true, ...mockData });
    });

    it('should pass query params (page, pageSize, unreadOnly)', async () => {
      svc.getByUser.mockResolvedValue({ data: [], pagination: {} });

      const r = res();
      await controller.getNotifications(
        req({ query: { page: '3', pageSize: '10', unreadOnly: 'true' } }),
        r
      );

      expect(svc.getByUser).toHaveBeenCalledWith('user-1', {
        page: 3,
        pageSize: 10,
        unreadOnly: true,
      });
    });

    it('should cap pageSize at 50', async () => {
      svc.getByUser.mockResolvedValue({ data: [], pagination: {} });

      const r = res();
      await controller.getNotifications(
        req({ query: { pageSize: '200' } }),
        r
      );

      expect(svc.getByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
        pageSize: 50,
      }));
    });
  });

  // ═══ getUnreadCount ═══

  describe('getUnreadCount()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.getUnreadCount(req({ user: undefined }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return unread count', async () => {
      svc.getUnreadCount.mockResolvedValue(5);

      const r = res();
      await controller.getUnreadCount(req(), r);

      expect(svc.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(r.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 5 },
      });
    });
  });

  // ═══ markAsRead ═══

  describe('markAsRead()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.markAsRead(req({ user: undefined, params: { id: 'n1' } }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should mark notification as read', async () => {
      svc.markAsRead.mockResolvedValue({ count: 1 });

      const r = res();
      await controller.markAsRead(req({ params: { id: 'n1' } }), r);

      expect(svc.markAsRead).toHaveBeenCalledWith('n1', 'user-1');
      expect(r.json).toHaveBeenCalledWith({
        success: true,
        message: 'Powiadomienie oznaczone jako przeczytane',
      });
    });
  });

  // ═══ markAllAsRead ═══

  describe('markAllAsRead()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.markAllAsRead(req({ user: undefined }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should mark all as read', async () => {
      svc.markAllAsRead.mockResolvedValue({ count: 3 });

      const r = res();
      await controller.markAllAsRead(req(), r);

      expect(svc.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(r.json).toHaveBeenCalledWith({
        success: true,
        message: 'Wszystkie powiadomienia oznaczone jako przeczytane',
      });
    });
  });
});
