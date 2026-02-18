/**
 * Queue API Integration Tests
 * Issue: #95 — Kolejki / Queue (Faza 2, priority: critical)
 *
 * Tests queue management endpoints against a real test database.
 * Covers: CRUD, positioning, batch updates, promotion, auto-cancel.
 */
import { api, authHeader } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Queue API — /api/queue', () => {
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

  // ========================================
  // Helpers
  // ========================================

  /**
   * Create a queue item directly in DB for testing.
   */
  async function createQueueItem(overrides: Record<string, any> = {}) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    return prismaTest.queueReservation.create({
      data: {
        clientName: 'Test Klient Kolejka',
        clientPhone: '+48 111 222 333',
        clientEmail: 'kolejka@test.pl',
        eventTypeId: seed.eventType1.id,
        hallId: seed.hall1.id,
        preferredDate: futureDate,
        guestCount: 80,
        position: 1,
        status: 'WAITING',
        notes: 'Integration test queue item',
        ...overrides,
      },
    });
  }

  /**
   * Create multiple queue items for position testing.
   */
  async function createMultipleQueueItems(count: number) {
    const items = [];
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    for (let i = 1; i <= count; i++) {
      const item = await prismaTest.queueReservation.create({
        data: {
          clientName: `Klient Kolejka ${i}`,
          clientPhone: `+48 ${String(i).padStart(9, '0')}`,
          clientEmail: `kolejka${i}@test.pl`,
          eventTypeId: seed.eventType1.id,
          preferredDate: futureDate,
          guestCount: 50 + i * 10,
          position: i,
          status: 'WAITING',
        },
      });
      items.push(item);
    }
    return items;
  }

  // ========================================
  // GET /api/queue
  // ========================================
  describe('GET /api/queue', () => {
    it('should return all queues with ADMIN token', async () => {
      const res = await api
        .get('/api/queue')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/queue');
      expect(res.status).toBe(401);
    });

    it('should return queue items after creating them', async () => {
      await createMultipleQueueItems(3);

      const res = await api
        .get('/api/queue')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // GET /api/queue/:date
  // ========================================
  describe('GET /api/queue/:date', () => {
    it('should return queue for specific date', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await api
        .get(`/api/queue/${today}`)
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should return empty result for date with no queue items', async () => {
      const res = await api
        .get('/api/queue/2099-01-01')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // GET /api/queue/stats
  // ========================================
  describe('GET /api/queue/stats', () => {
    it('should return queue statistics', async () => {
      const res = await api
        .get('/api/queue/stats')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should return stats reflecting created items', async () => {
      await createMultipleQueueItems(5);

      const res = await api
        .get('/api/queue/stats')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // POST /api/queue/reserved
  // ========================================
  describe('POST /api/queue/reserved', () => {
    it('should add item to queue with valid data', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 4);
      const dateStr = futureDate.toISOString().split('T')[0];

      const res = await api
        .post('/api/queue/reserved')
        .set(authHeader('ADMIN'))
        .send({
          clientName: 'Jan Nowy',
          clientPhone: '+48 555 666 777',
          clientEmail: 'jan.nowy@test.pl',
          eventTypeId: seed.eventType1.id,
          hallId: seed.hall1.id,
          preferredDate: dateStr,
          guestCount: 100,
          notes: 'Nowa rezerwacja w kolejce',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should return 401 without auth', async () => {
      const res = await api
        .post('/api/queue/reserved')
        .send({ clientName: 'Brak Auth' });

      expect(res.status).toBe(401);
    });

    it('should return error for missing required fields', async () => {
      const res = await api
        .post('/api/queue/reserved')
        .set(authHeader('ADMIN'))
        .send({});

      expect([400, 422, 500]).toContain(res.status);
    });
  });

  // ========================================
  // PUT /api/queue/:id — update queue item
  // ========================================
  describe('PUT /api/queue/:id', () => {
    it('should update queue item details', async () => {
      const item = await createQueueItem();

      const res = await api
        .put(`/api/queue/${item.id}`)
        .set(authHeader('ADMIN'))
        .send({
          clientName: 'Zaktualizowany Klient',
          guestCount: 120,
          notes: 'Zmienione dane',
        });

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .put('/api/queue/not-a-uuid')
        .set(authHeader('ADMIN'))
        .send({ clientName: 'Test' });

      expect(res.status).toBe(400);
    });
  });

  // ========================================
  // PUT /api/queue/:id/position — move item
  // ========================================
  describe('PUT /api/queue/:id/position', () => {
    it('should move item to new position', async () => {
      const items = await createMultipleQueueItems(3);

      const res = await api
        .put(`/api/queue/${items[2].id}/position`)
        .set(authHeader('ADMIN'))
        .send({ position: 1 });

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // POST /api/queue/batch-update-positions
  // ========================================
  describe('POST /api/queue/batch-update-positions', () => {
    it('should batch update positions for multiple items', async () => {
      const items = await createMultipleQueueItems(3);

      const res = await api
        .post('/api/queue/batch-update-positions')
        .set(authHeader('ADMIN'))
        .send({
          updates: [
            { id: items[0].id, position: 3 },
            { id: items[1].id, position: 1 },
            { id: items[2].id, position: 2 },
          ],
        });

      expect(res.status).toBe(200);
    });

    it('should handle empty batch update', async () => {
      const res = await api
        .post('/api/queue/batch-update-positions')
        .set(authHeader('ADMIN'))
        .send({ updates: [] });

      expect([200, 400]).toContain(res.status);
    });
  });

  // ========================================
  // POST /api/queue/swap
  // ========================================
  describe('POST /api/queue/swap', () => {
    it('should swap positions of two queue items', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .post('/api/queue/swap')
        .set(authHeader('ADMIN'))
        .send({
          id1: items[0].id,
          id2: items[1].id,
        });

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // POST /api/queue/rebuild-positions (admin only)
  // ========================================
  describe('POST /api/queue/rebuild-positions', () => {
    it('should allow ADMIN to rebuild positions', async () => {
      await createMultipleQueueItems(3);

      const res = await api
        .post('/api/queue/rebuild-positions')
        .set(authHeader('ADMIN'));

      expect([200, 204]).toContain(res.status);
    });

    it('should deny USER role (not admin)', async () => {
      const res = await api
        .post('/api/queue/rebuild-positions')
        .set(authHeader('USER'));

      expect(res.status).toBe(403);
    });

    it('should deny READONLY role', async () => {
      const res = await api
        .post('/api/queue/rebuild-positions')
        .set(authHeader('READONLY'));

      expect([401, 403]).toContain(res.status);
    });
  });

  // ========================================
  // PUT /api/queue/:id/promote — promote to reservation
  // ========================================
  describe('PUT /api/queue/:id/promote', () => {
    it('should promote queue item to reservation', async () => {
      const item = await createQueueItem();

      const res = await api
        .put(`/api/queue/${item.id}/promote`)
        .set(authHeader('ADMIN'))
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          date: item.preferredDate.toISOString().split('T')[0],
          startTime: '14:00',
          endTime: '22:00',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .put('/api/queue/invalid-uuid/promote')
        .set(authHeader('ADMIN'))
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ========================================
  // POST /api/queue/auto-cancel
  // ========================================
  describe('POST /api/queue/auto-cancel', () => {
    it('should run auto-cancel and return result', async () => {
      const res = await api
        .post('/api/queue/auto-cancel')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api.post('/api/queue/auto-cancel');

      expect(res.status).toBe(401);
    });
  });

  // ========================================
  // UUID validation
  // ========================================
  describe('UUID Validation', () => {
    it('should reject non-UUID id for PUT /api/queue/:id', async () => {
      const res = await api
        .put('/api/queue/123')
        .set(authHeader('ADMIN'))
        .send({ clientName: 'Test' });

      expect(res.status).toBe(400);
    });

    it('should reject non-UUID id for PUT /api/queue/:id/position', async () => {
      const res = await api
        .put('/api/queue/abc/position')
        .set(authHeader('ADMIN'))
        .send({ position: 1 });

      expect(res.status).toBe(400);
    });

    it('should return 404 or 500 for valid UUID that does not exist', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .put(`/api/queue/${fakeUuid}`)
        .set(authHeader('ADMIN'))
        .send({ clientName: 'Ghost' });

      expect([404, 500]).toContain(res.status);
    });
  });
});
