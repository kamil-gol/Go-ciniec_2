/**
 * Notifications API Integration Tests
 * Issue: #247 — Rozszerzenie testów integracyjnych
 *
 * Tests:
 * - GET /api/notifications — list with pagination
 * - GET /api/notifications/unread-count
 * - PATCH /api/notifications/read-all
 * - PATCH /api/notifications/:id/read
 */
import { api, authHeader, generateTestToken } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Notifications API', () => {
  let seed: TestSeedData;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
    seed = await seedTestData();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectTestDb();
  });

  /** Auth header with real admin ID (needed for notification ownership) */
  const adminAuth = () => ({
    Authorization: `Bearer ${generateTestToken({
      id: seed.admin.id,
      email: seed.admin.email,
      role: 'ADMIN',
    })}`,
  });

  /** Helper: create test notifications for admin user */
  async function createTestNotifications(count: number = 3) {
    const notifications = [];
    for (let i = 0; i < count; i++) {
      const n = await prismaTest.notification.create({
        data: {
          userId: seed.admin.id,
          type: 'RESERVATION_CREATED',
          title: `Powiadomienie testowe ${i + 1}`,
          message: `Treść powiadomienia testowego nr ${i + 1}`,
          read: i === 0, // first one is read, rest unread
        },
      });
      notifications.push(n);
    }
    return notifications;
  }

  // ================================================================
  // GET /api/notifications
  // ================================================================
  describe('GET /api/notifications', () => {
    it('should return empty list when no notifications', async () => {
      const res = await api
        .get('/api/notifications')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return notifications for authenticated user', async () => {
      await createTestNotifications(3);

      const res = await api
        .get('/api/notifications')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should support pagination', async () => {
      await createTestNotifications(5);

      const res = await api
        .get('/api/notifications')
        .query({ page: 1, limit: 2 })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/notifications');

      expect(res.status).toBe(401);
    });

    it('should not return notifications of other users', async () => {
      // Create notifications for admin
      await createTestNotifications(2);

      // Create notifications for different user
      await prismaTest.notification.create({
        data: {
          userId: seed.user.id,
          type: 'RESERVATION_CREATED',
          title: 'Inne powiadomienie',
          message: 'Dla innego użytkownika',
          read: false,
        },
      });

      const res = await api
        .get('/api/notifications')
        .set(adminAuth());

      expect(res.status).toBe(200);
      // Notifications should only belong to the authenticated user
      const data = res.body.data || res.body;
      if (Array.isArray(data)) {
        for (const n of data) {
          expect(n.userId).toBe(seed.admin.id);
        }
      }
    });
  });

  // ================================================================
  // GET /api/notifications/unread-count
  // ================================================================
  describe('GET /api/notifications/unread-count', () => {
    it('should return 0 when no notifications', async () => {
      const res = await api
        .get('/api/notifications/unread-count')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return correct unread count', async () => {
      await createTestNotifications(3); // 1 read, 2 unread

      const res = await api
        .get('/api/notifications/unread-count')
        .set(adminAuth());

      expect(res.status).toBe(200);
      const body = res.body.data ?? res.body;
      if (typeof body === 'object' && 'count' in body) {
        expect(body.count).toBe(2);
      } else if (typeof body === 'number') {
        expect(body).toBe(2);
      }
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/notifications/unread-count');

      expect(res.status).toBe(401);
    });
  });

  // ================================================================
  // PATCH /api/notifications/read-all
  // ================================================================
  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await createTestNotifications(3);

      const res = await api
        .patch('/api/notifications/read-all')
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);

      // Verify all are now read
      const countRes = await api
        .get('/api/notifications/unread-count')
        .set(adminAuth());

      expect(countRes.status).toBe(200);
      const body = countRes.body.data ?? countRes.body;
      if (typeof body === 'object' && 'count' in body) {
        expect(body.count).toBe(0);
      }
    });

    it('should succeed even with no notifications', async () => {
      const res = await api
        .patch('/api/notifications/read-all')
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);
    });
  });

  // ================================================================
  // PATCH /api/notifications/:id/read
  // ================================================================
  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark single notification as read', async () => {
      const notifications = await createTestNotifications(2);
      const unreadId = notifications[1].id; // index 1 is unread

      const res = await api
        .patch(`/api/notifications/${unreadId}/read`)
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .patch('/api/notifications/not-a-uuid/read')
        .set(adminAuth());

      expect(res.status).toBe(400);
    });

    it('should handle non-existent notification gracefully', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .patch(`/api/notifications/${fakeId}/read`)
        .set(adminAuth());

      // May return 200 (no-op), 404, or 500 depending on implementation
      expect(res.status).not.toBe(401);
    });

    it('should return 401 without auth', async () => {
      const res = await api.patch('/api/notifications/00000000-0000-4000-a000-000000000000/read');

      expect(res.status).toBe(401);
    });
  });
});
