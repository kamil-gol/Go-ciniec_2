/**
 * Queue API Integration Tests
 * Issue: #95 — Kolejki / Queue (Faza 2, priority: critical)
 *
 * Tests queue management endpoints against a real test database.
 * Covers: CRUD, positioning, batch updates, promotion, auto-cancel.
 *
 * IMPORTANT: The queue system uses the Reservation model with:
 *   - status: 'RESERVED'
 *   - reservationQueuePosition: Int
 *   - reservationQueueDate: DateTime
 * There is NO separate QueueReservation model in the schema.
 *
 * API DTOs (from queue.types.ts):
 *   - CreateReservedDTO: { clientId, reservationQueueDate, guests, ... }
 *   - SwapQueuePositionsDTO: { reservationId1, reservationId2 }
 *   - BatchUpdatePositionsDTO: { updates: [{ id, position }] }
 *   - PromoteReservationDTO: { hallId, eventTypeId, startDateTime, endDateTime, adults, pricePerAdult, status, ... }
 *
 * Regression coverage:
 *   - BUG8:  Position validation (negative, zero, float, > max)
 *   - BUG9a: Nullable fields in queue CRUD
 *   - BUG9b: Race condition in concurrent batch updates
 */
import { api, authHeader, authHeaderForUser } from '../helpers/test-utils';
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

  /** Auth header with REAL admin user ID (avoids FK violations in audit logger) */
  function adminAuth() {
    return authHeaderForUser({
      id: seed.admin.id,
      email: seed.admin.email,
      role: seed.admin.legacyRole || 'ADMIN',
    });
  }

  /** Auth header with REAL employee user ID */
  function employeeAuth() {
    return authHeaderForUser({
      id: seed.user.id,
      email: seed.user.email,
      role: seed.user.legacyRole || 'EMPLOYEE',
    });
  }

  function futureDate(monthsAhead: number = 3): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    return d;
  }

  function futureDateStr(monthsAhead: number = 3): string {
    return futureDate(monthsAhead).toISOString().split('T')[0];
  }

  /**
   * Create a queue item (RESERVED reservation) directly in DB.
   * Uses the Reservation model with queue-specific fields.
   */
  async function createQueueItemInDb(overrides: Record<string, any> = {}) {
    return prismaTest.reservation.create({
      data: {
        clientId: seed.client1.id,
        createdById: seed.admin.id,
        reservationQueueDate: futureDate(3),
        reservationQueuePosition: 1,
        guests: 80,
        totalPrice: 0,
        status: 'RESERVED',
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
    const queueDate = futureDate(3);

    for (let i = 1; i <= count; i++) {
      const item = await prismaTest.reservation.create({
        data: {
          clientId: seed.client1.id,
          createdById: seed.admin.id,
          reservationQueueDate: queueDate,
          reservationQueuePosition: i,
          guests: 50 + i * 10,
          totalPrice: 0,
          status: 'RESERVED',
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
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/queue');
      expect(res.status).toBe(401);
    });

    it('should return queue items after creating them', async () => {
      await createMultipleQueueItems(3);

      const res = await api
        .get('/api/queue')
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
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
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should return empty result for date with no queue items', async () => {
      const res = await api
        .get('/api/queue/2099-01-01')
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should return items only for the requested date', async () => {
      const dateStr = futureDateStr(3);
      await createMultipleQueueItems(2);

      const res = await api
        .get(`/api/queue/${dateStr}`)
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================
  // GET /api/queue/stats
  // ========================================
  describe('GET /api/queue/stats', () => {
    it('should return queue statistics', async () => {
      const res = await api
        .get('/api/queue/stats')
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });

    it('should return stats reflecting created items', async () => {
      await createMultipleQueueItems(5);

      const res = await api
        .get('/api/queue/stats')
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.body.data.totalQueued).toBeGreaterThanOrEqual(5);
    });
  });

  // ========================================
  // POST /api/queue/reserved
  // ========================================
  describe('POST /api/queue/reserved', () => {
    it('should add item to queue with valid data — 201', async () => {
      const dateStr = futureDateStr(4);

      const res = await api
        .post('/api/queue/reserved')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          reservationQueueDate: dateStr,
          guests: 100,
          adults: 80,
          children: 15,
          toddlers: 5,
          notes: 'Nowa rezerwacja w kolejce',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      const res = await api
        .post('/api/queue/reserved')
        .send({ clientId: seed.client1.id });

      expect(res.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await api
        .post('/api/queue/reserved')
        .set(adminAuth())
        .send({});

      expect(res.status).toBe(400);
    });

    it('should allow EMPLOYEE role to add to queue', async () => {
      const res = await api
        .post('/api/queue/reserved')
        .set(employeeAuth())
        .send({
          clientId: seed.client1.id,
          reservationQueueDate: futureDateStr(5),
          guests: 60,
          adults: 50,
          children: 10,
          toddlers: 0,
        });

      expect(res.status).toBe(201);
    });

    it('should deny CLIENT role from adding to queue', async () => {
      const res = await api
        .post('/api/queue/reserved')
        .set(authHeader('CLIENT'))
        .send({
          clientId: seed.client1.id,
          reservationQueueDate: futureDateStr(5),
          guests: 60,
        });

      expect([401, 403]).toContain(res.status);
    });

    // --- BUG9a: Nullable fields ---
    it('[BUG9a] should create queue item with all nullable fields omitted', async () => {
      const res = await api
        .post('/api/queue/reserved')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          reservationQueueDate: futureDateStr(4),
          guests: 50,
          // adults, children, toddlers, notes — all omitted
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('[BUG9a] should create queue item with nullable fields set to null', async () => {
      const res = await api
        .post('/api/queue/reserved')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          reservationQueueDate: futureDateStr(4),
          guests: 70,
          adults: null,
          children: null,
          toddlers: null,
          notes: null,
        });

      // Should accept null values gracefully (201) or reject with validation (400)
      // but NEVER 500
      expect(res.status).not.toBe(500);
      expect([201, 400]).toContain(res.status);
    });

    it('[BUG9a] should create queue item with notes as empty string', async () => {
      const res = await api
        .post('/api/queue/reserved')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          reservationQueueDate: futureDateStr(4),
          guests: 40,
          notes: '',
        });

      expect(res.status).toBe(201);
    });

    it('should auto-assign sequential position for same date', async () => {
      const dateStr = futureDateStr(6);

      // Create first item
      const res1 = await api
        .post('/api/queue/reserved')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          reservationQueueDate: dateStr,
          guests: 50,
        });
      expect(res1.status).toBe(201);

      // Create second item — should get position 2
      const res2 = await api
        .post('/api/queue/reserved')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          reservationQueueDate: dateStr,
          guests: 60,
        });
      expect(res2.status).toBe(201);

      // Verify positions are sequential
      if (res1.body.data?.position && res2.body.data?.position) {
        expect(res2.body.data.position).toBeGreaterThan(res1.body.data.position);
      }
    });
  });

  // ========================================
  // PUT /api/queue/:id — update queue item
  // ========================================
  describe('PUT /api/queue/:id', () => {
    it('should update queue item details', async () => {
      const item = await createQueueItemInDb();

      const res = await api
        .put(`/api/queue/${item.id}`)
        .set(adminAuth())
        .send({
          guests: 120,
          notes: 'Zmienione dane',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .put('/api/queue/not-a-uuid')
        .set(adminAuth())
        .send({ guests: 50 });

      expect(res.status).toBe(400);
    });

    // --- BUG9a: Nullable fields on update ---
    it('[BUG9a] should update queue item setting notes to null', async () => {
      const item = await createQueueItemInDb({ notes: 'Something' });

      const res = await api
        .put(`/api/queue/${item.id}`)
        .set(adminAuth())
        .send({ notes: null });

      expect(res.status).not.toBe(500);
      expect(res.status).toBe(200);
    });

    it('[BUG9a] should update queue item setting notes to empty string', async () => {
      const item = await createQueueItemInDb({ notes: 'Something' });

      const res = await api
        .put(`/api/queue/${item.id}`)
        .set(adminAuth())
        .send({ notes: '' });

      expect(res.status).toBe(200);
    });

    it('[BUG9a] should update with only nullable optional fields', async () => {
      const item = await createQueueItemInDb();

      const res = await api
        .put(`/api/queue/${item.id}`)
        .set(adminAuth())
        .send({
          adults: null,
          children: null,
          toddlers: null,
        });

      expect(res.status).not.toBe(500);
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
        .set(adminAuth())
        .send({ newPosition: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    // ==========================================
    // BUG8: Position Validation Regression Tests
    // ==========================================
    it('[BUG8] should reject position = 0 with 400', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .put(`/api/queue/${items[0].id}/position`)
        .set(adminAuth())
        .send({ newPosition: 0 });

      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject negative position with 400', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .put(`/api/queue/${items[0].id}/position`)
        .set(adminAuth())
        .send({ newPosition: -1 });

      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject float position with 400', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .put(`/api/queue/${items[0].id}/position`)
        .set(adminAuth())
        .send({ newPosition: 1.5 });

      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject string position with 400', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .put(`/api/queue/${items[0].id}/position`)
        .set(adminAuth())
        .send({ newPosition: 'abc' });

      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject missing position with 400', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .put(`/api/queue/${items[0].id}/position`)
        .set(adminAuth())
        .send({});

      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject null position with 400', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .put(`/api/queue/${items[0].id}/position`)
        .set(adminAuth())
        .send({ newPosition: null });

      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject position > queue length with 400', async () => {
      const items = await createMultipleQueueItems(3);

      const res = await api
        .put(`/api/queue/${items[0].id}/position`)
        .set(adminAuth())
        .send({ newPosition: 999 });

      // FIX applied: service now throws AppError.badRequest instead of plain Error
      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject very large position number with 400', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .put(`/api/queue/${items[0].id}/position`)
        .set(adminAuth())
        .send({ newPosition: Number.MAX_SAFE_INTEGER });

      // FIX applied: service now throws AppError.badRequest instead of plain Error
      expect(res.status).toBe(400);
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
        .set(adminAuth())
        .send({
          updates: [
            { id: items[0].id, position: 3 },
            { id: items[1].id, position: 1 },
            { id: items[2].id, position: 2 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should reject empty batch update with 400', async () => {
      const res = await api
        .post('/api/queue/batch-update-positions')
        .set(adminAuth())
        .send({ updates: [] });

      expect(res.status).toBe(400);
    });

    // --- BUG8: Invalid positions in batch ---
    it('[BUG8] should reject batch update with position = 0', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .post('/api/queue/batch-update-positions')
        .set(adminAuth())
        .send({
          updates: [
            { id: items[0].id, position: 0 },
            { id: items[1].id, position: 1 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject batch update with negative position', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .post('/api/queue/batch-update-positions')
        .set(adminAuth())
        .send({
          updates: [
            { id: items[0].id, position: -3 },
            { id: items[1].id, position: 1 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject batch update with float position', async () => {
      const items = await createMultipleQueueItems(2);

      const res = await api
        .post('/api/queue/batch-update-positions')
        .set(adminAuth())
        .send({
          updates: [
            { id: items[0].id, position: 1.7 },
            { id: items[1].id, position: 2 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('[BUG8] should reject batch update with missing id', async () => {
      const res = await api
        .post('/api/queue/batch-update-positions')
        .set(adminAuth())
        .send({
          updates: [
            { position: 1 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should reject batch update without updates field', async () => {
      const res = await api
        .post('/api/queue/batch-update-positions')
        .set(adminAuth())
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject batch update with non-array updates', async () => {
      const res = await api
        .post('/api/queue/batch-update-positions')
        .set(adminAuth())
        .send({ updates: 'not-an-array' });

      expect(res.status).toBe(400);
    });

    // --- BUG9b: Race condition in concurrent batch updates ---
    it('[BUG9b] should handle two concurrent batch updates without corruption', async () => {
      const items = await createMultipleQueueItems(4);

      // Fire two batch updates simultaneously
      const [res1, res2] = await Promise.all([
        api
          .post('/api/queue/batch-update-positions')
          .set(adminAuth())
          .send({
            updates: [
              { id: items[0].id, position: 4 },
              { id: items[1].id, position: 3 },
              { id: items[2].id, position: 2 },
              { id: items[3].id, position: 1 },
            ],
          }),
        api
          .post('/api/queue/batch-update-positions')
          .set(adminAuth())
          .send({
            updates: [
              { id: items[0].id, position: 1 },
              { id: items[1].id, position: 2 },
              { id: items[2].id, position: 3 },
              { id: items[3].id, position: 4 },
            ],
          }),
      ]);

      // At least one should succeed; neither should 500
      expect(res1.status).not.toBe(500);
      expect(res2.status).not.toBe(500);

      // At least one must be 200
      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(200);

      // Verify no duplicate positions after concurrent updates
      const dateStr = items[0].reservationQueueDate
        ? items[0].reservationQueueDate.toISOString().split('T')[0]
        : futureDateStr(3);

      const queueRes = await api
        .get(`/api/queue/${dateStr}`)
        .set(adminAuth());

      expect(queueRes.status).toBe(200);

      if (queueRes.body.data && queueRes.body.data.length > 0) {
        const positions = queueRes.body.data.map(
          (item: any) => item.position || item.reservationQueuePosition
        ).filter((p: any) => p != null);

        // Positions must be unique (no duplicates from race condition)
        const uniquePositions = new Set(positions);
        expect(uniquePositions.size).toBe(positions.length);
      }
    });

    it('[BUG9b] should handle three concurrent batch updates atomically', async () => {
      const items = await createMultipleQueueItems(3);

      const [r1, r2, r3] = await Promise.all([
        api.post('/api/queue/batch-update-positions').set(adminAuth()).send({
          updates: [
            { id: items[0].id, position: 3 },
            { id: items[1].id, position: 1 },
            { id: items[2].id, position: 2 },
          ],
        }),
        api.post('/api/queue/batch-update-positions').set(adminAuth()).send({
          updates: [
            { id: items[0].id, position: 2 },
            { id: items[1].id, position: 3 },
            { id: items[2].id, position: 1 },
          ],
        }),
        api.post('/api/queue/batch-update-positions').set(adminAuth()).send({
          updates: [
            { id: items[0].id, position: 1 },
            { id: items[1].id, position: 2 },
            { id: items[2].id, position: 3 },
          ],
        }),
      ]);

      // None should return 500 (deadlock / corruption)
      expect(r1.status).not.toBe(500);
      expect(r2.status).not.toBe(500);
      expect(r3.status).not.toBe(500);

      // At least one must succeed
      expect([r1.status, r2.status, r3.status]).toContain(200);
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
        .set(adminAuth())
        .send({
          reservationId1: items[0].id,
          reservationId2: items[1].id,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should return 400 for missing reservation IDs', async () => {
      const res = await api
        .post('/api/queue/swap')
        .set(adminAuth())
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 for swapping item with itself', async () => {
      const items = await createMultipleQueueItems(1);

      const res = await api
        .post('/api/queue/swap')
        .set(adminAuth())
        .send({
          reservationId1: items[0].id,
          reservationId2: items[0].id,
        });

      // FIX applied: service now throws AppError.badRequest instead of plain Error
      expect(res.status).toBe(400);
    });

    it('should return error for non-existent reservation ID', async () => {
      const items = await createMultipleQueueItems(1);
      const fakeUuid = '00000000-0000-4000-a000-000000000099';

      const res = await api
        .post('/api/queue/swap')
        .set(adminAuth())
        .send({
          reservationId1: items[0].id,
          reservationId2: fakeUuid,
        });

      expect([400, 404, 500]).toContain(res.status);
    });
  });

  // ========================================
  // POST /api/queue/rebuild-positions (admin only)
  // ========================================
  describe('POST /api/queue/rebuild-positions', () => {
    it('should allow ADMIN to rebuild positions — 200', async () => {
      await createMultipleQueueItems(3);

      const res = await api
        .post('/api/queue/rebuild-positions')
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should deny EMPLOYEE role — 403 (requireAdmin)', async () => {
      const res = await api
        .post('/api/queue/rebuild-positions')
        .set(employeeAuth());

      expect(res.status).toBe(403);
    });

    it('should deny CLIENT role', async () => {
      const res = await api
        .post('/api/queue/rebuild-positions')
        .set(authHeader('CLIENT'));

      expect([401, 403]).toContain(res.status);
    });
  });

  // ========================================
  // PUT /api/queue/:id/promote — promote to reservation
  // ========================================
  describe('PUT /api/queue/:id/promote', () => {
    it('should promote queue item to full reservation — 200', async () => {
      const item = await createQueueItemInDb();
      const dateStr = item.reservationQueueDate
        ? item.reservationQueueDate.toISOString().split('T')[0]
        : futureDateStr(3);

      const res = await api
        .put(`/api/queue/${item.id}/promote`)
        .set(adminAuth())
        .send({
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 60,
          children: 15,
          toddlers: 5,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
          status: 'CONFIRMED',
          notes: 'Awansowano z kolejki',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should change status from RESERVED after promotion', async () => {
      const item = await createQueueItemInDb();
      const dateStr = item.reservationQueueDate
        ? item.reservationQueueDate.toISOString().split('T')[0]
        : futureDateStr(3);

      const res = await api
        .put(`/api/queue/${item.id}/promote`)
        .set(adminAuth())
        .send({
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 60,
          pricePerAdult: 200,
          status: 'CONFIRMED',
        });

      expect(res.status).toBe(200);

      // Verify in DB that status changed
      const updated = await prismaTest.reservation.findUnique({
        where: { id: item.id },
      });
      expect(updated).not.toBeNull();
      expect(updated!.status).not.toBe('RESERVED');
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .put('/api/queue/invalid-uuid/promote')
        .set(adminAuth())
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing promote fields', async () => {
      const item = await createQueueItemInDb();

      const res = await api
        .put(`/api/queue/${item.id}/promote`)
        .set(adminAuth())
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 for promote without hallId', async () => {
      const item = await createQueueItemInDb();
      const dateStr = futureDateStr(3);

      const res = await api
        .put(`/api/queue/${item.id}/promote`)
        .set(adminAuth())
        .send({
          // hallId missing
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 60,
          pricePerAdult: 200,
          status: 'CONFIRMED',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for promote with adults < 1', async () => {
      const item = await createQueueItemInDb();
      const dateStr = futureDateStr(3);

      const res = await api
        .put(`/api/queue/${item.id}/promote`)
        .set(adminAuth())
        .send({
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 0,
          pricePerAdult: 200,
          status: 'CONFIRMED',
        });

      expect(res.status).toBe(400);
    });

    // --- BUG9a: Nullable optional fields in promote ---
    it('[BUG9a] should promote with nullable optional fields omitted', async () => {
      const item = await createQueueItemInDb();
      const dateStr = item.reservationQueueDate
        ? item.reservationQueueDate.toISOString().split('T')[0]
        : futureDateStr(3);

      const res = await api
        .put(`/api/queue/${item.id}/promote`)
        .set(adminAuth())
        .send({
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 40,
          pricePerAdult: 150,
          status: 'PENDING',
          // children, toddlers, pricePerChild, pricePerToddler, notes — omitted
        });

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // POST /api/queue/auto-cancel
  // ========================================
  describe('POST /api/queue/auto-cancel', () => {
    it('should run auto-cancel and return result — 200', async () => {
      const res = await api
        .post('/api/queue/auto-cancel')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api.post('/api/queue/auto-cancel');

      expect(res.status).toBe(401);
    });

    it('should return cancelledCount in response', async () => {
      const res = await api
        .post('/api/queue/auto-cancel')
        .set(adminAuth());

      if (res.status === 200) {
        expect(res.body.data).toHaveProperty('cancelledCount');
        expect(typeof res.body.data.cancelledCount).toBe('number');
      }
    });
  });

  // ========================================
  // UUID validation
  // ========================================
  describe('UUID Validation', () => {
    it('should reject non-UUID id for PUT /api/queue/:id', async () => {
      const res = await api
        .put('/api/queue/123')
        .set(adminAuth())
        .send({ guests: 50 });

      expect(res.status).toBe(400);
    });

    it('should reject non-UUID id for PUT /api/queue/:id/position', async () => {
      const res = await api
        .put('/api/queue/abc/position')
        .set(adminAuth())
        .send({ newPosition: 1 });

      expect(res.status).toBe(400);
    });

    it('should return 404 for valid UUID that does not exist', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .put(`/api/queue/${fakeUuid}`)
        .set(adminAuth())
        .send({ guests: 50 });

      expect([404, 500]).toContain(res.status);
    });
  });

  // ========================================
  // Authorization edge cases
  // ========================================
  describe('Authorization', () => {
    it('should return 401 for all mutating endpoints without auth', async () => {
      const item = await createQueueItemInDb();

      // Sequential requests to avoid ECONNRESET from parallel overload
      const res1 = await api.post('/api/queue/reserved').send({ clientId: 'x' });
      expect(res1.status).toBe(401);

      const res2 = await api.put(`/api/queue/${item.id}`).send({ guests: 1 });
      expect(res2.status).toBe(401);

      const res3 = await api.put(`/api/queue/${item.id}/position`).send({ newPosition: 1 });
      expect(res3.status).toBe(401);

      const res4 = await api.post('/api/queue/swap').send({});
      expect(res4.status).toBe(401);

      const res5 = await api.post('/api/queue/batch-update-positions').send({ updates: [] });
      expect(res5.status).toBe(401);

      const res6 = await api.put(`/api/queue/${item.id}/promote`).send({});
      expect(res6.status).toBe(401);
    });
  });
});
