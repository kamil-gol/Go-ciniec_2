/**
 * Deposit API Integration Tests
 * Tests for /api/deposits and /api/reservations/:reservationId/deposits
 *
 * Issue: #97
 *
 * Endpoints covered:
 *   POST   /api/reservations/:reservationId/deposits  (create)
 *   GET    /api/reservations/:reservationId/deposits  (list + summary)
 *   GET    /api/deposits                              (list with filters)
 *   GET    /api/deposits/stats                        (statistics)
 *   GET    /api/deposits/overdue                      (overdue list)
 *   GET    /api/deposits/:id                          (details)
 *   PUT    /api/deposits/:id                          (update)
 *   DELETE /api/deposits/:id                          (delete)
 *   PATCH  /api/deposits/:id/mark-paid                (mark as paid)
 *   PATCH  /api/deposits/:id/mark-unpaid              (revert payment)
 *   PATCH  /api/deposits/:id/cancel                   (cancel)
 */
import { api, authHeaderForUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Deposit API', () => {
  let seed: TestSeedData;
  let reservationId: string;
  let reservationId2: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
    seed = await seedTestData();

    // Create two reservations with known totalPrice for deposit tests
    const reservation1 = await prismaTest.reservation.create({
      data: {
        clientId: seed.client1.id,
        hallId: seed.hall1.id,
        eventTypeId: seed.eventType1.id,
        createdById: seed.admin.id,
        date: '2026-08-15',
        startTime: '14:00',
        endTime: '22:00',
        guests: 100,
        adults: 80,
        children: 15,
        toddlers: 5,
        totalPrice: 20000,
        status: 'PENDING',
      },
    });

    const reservation2 = await prismaTest.reservation.create({
      data: {
        clientId: seed.client2.id,
        hallId: seed.hall2.id,
        eventTypeId: seed.eventType2.id,
        createdById: seed.admin.id,
        date: '2026-09-20',
        startTime: '12:00',
        endTime: '20:00',
        guests: 40,
        adults: 30,
        children: 8,
        toddlers: 2,
        totalPrice: 10000,
        status: 'PENDING',
      },
    });

    reservationId = reservation1.id;
    reservationId2 = reservation2.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectTestDb();
  });

  // ── Auth helper ──
  function adminAuth() {
    return authHeaderForUser({
      id: seed.admin.id,
      email: seed.admin.email,
      role: seed.admin.legacyRole || 'ADMIN',
    });
  }

  // ── API helpers ──
  async function createDeposit(
    resId: string,
    amount: number,
    dueDate: string = '2026-06-01',
  ) {
    return api
      .post(`/api/reservations/${resId}/deposits`)
      .set(adminAuth())
      .send({ amount, dueDate });
  }

  async function markPaid(
    depositId: string,
    paymentMethod: string = 'TRANSFER',
    paidAt: string = '2026-02-20',
  ) {
    return api
      .patch(`/api/deposits/${depositId}/mark-paid`)
      .set(adminAuth())
      .send({ paymentMethod, paidAt });
  }

  // ═══════════════════════════════════════════════════════════════
  // POST /api/reservations/:reservationId/deposits (Create)
  // ═══════════════════════════════════════════════════════════════

  describe('POST /api/reservations/:reservationId/deposits', () => {
    it('should create a deposit for a reservation', async () => {
      const res = await createDeposit(reservationId, 500);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(Number(res.body.data.amount)).toBe(500);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.paid).toBe(false);
    });

    it('should reject deposit with amount <= 0', async () => {
      const res = await createDeposit(reservationId, 0);
      expect(res.status).toBe(400);
    });

    it('should reject deposit with negative amount', async () => {
      const res = await createDeposit(reservationId, -100);
      expect(res.status).toBe(400);
    });

    it('should reject deposit exceeding reservation totalPrice', async () => {
      const res = await createDeposit(reservationId, 99999);
      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error || '').toMatch(/przekracza|cen/i);
    });

    it('should reject deposit for non-existent reservation', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await createDeposit(fakeId, 100);
      expect(res.status).toBe(404);
    });

    it('should reject invalid reservationId (not UUID)', async () => {
      const res = await api
        .post('/api/reservations/not-a-uuid/deposits')
        .set(adminAuth())
        .send({ amount: 100, dueDate: '2026-06-01' });
      expect(res.status).toBe(400);
    });

    it('should reject deposit without dueDate', async () => {
      const res = await api
        .post(`/api/reservations/${reservationId}/deposits`)
        .set(adminAuth())
        .send({ amount: 100 });
      expect(res.status).toBe(400);
    });

    it('should reject deposit with invalid dueDate format', async () => {
      const res = await createDeposit(reservationId, 100, 'not-a-date');
      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/reservations/:reservationId/deposits
  // ═══════════════════════════════════════════════════════════════

  describe('GET /api/reservations/:reservationId/deposits', () => {
    it('should return deposits with summary', async () => {
      await createDeposit(reservationId, 500);

      const res = await api
        .get(`/api/reservations/${reservationId}/deposits`)
        .set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary).toHaveProperty('totalAmount');
      expect(res.body.summary).toHaveProperty('paidAmount');
      expect(res.body.summary).toHaveProperty('pendingAmount');
      expect(res.body.summary).toHaveProperty('percentPaid');
    });

    it('should return 404 for non-existent reservation', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await api
        .get(`/api/reservations/${fakeId}/deposits`)
        .set(adminAuth());
      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/deposits (List with filters)
  // ═══════════════════════════════════════════════════════════════

  describe('GET /api/deposits', () => {
    it('should return paginated deposits', async () => {
      const res = await api.get('/api/deposits').set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('totalCount');
    });

    it('should filter by status', async () => {
      await createDeposit(reservationId, 500);

      const res = await api
        .get('/api/deposits?status=PENDING')
        .set(adminAuth());
      expect(res.status).toBe(200);
      for (const dep of res.body.data) {
        expect(dep.status).toBe('PENDING');
      }
    });

    it('should filter by reservationId', async () => {
      await createDeposit(reservationId, 500);

      const res = await api
        .get(`/api/deposits?reservationId=${reservationId}`)
        .set(adminAuth());
      expect(res.status).toBe(200);
      for (const dep of res.body.data) {
        expect(dep.reservationId).toBe(reservationId);
      }
    });

    it('should support pagination params', async () => {
      await createDeposit(reservationId, 100);
      await createDeposit(reservationId, 200, '2026-07-01');
      await createDeposit(reservationId, 300, '2026-08-01');

      const res = await api
        .get('/api/deposits?page=1&limit=2')
        .set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should support sorting by amount desc', async () => {
      await createDeposit(reservationId, 100);
      await createDeposit(reservationId, 500, '2026-07-01');
      await createDeposit(reservationId, 300, '2026-08-01');

      const res = await api
        .get('/api/deposits?sortBy=amount&sortOrder=desc')
        .set(adminAuth());
      expect(res.status).toBe(200);
      const amounts = res.body.data.map((d: any) => Number(d.amount));
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i]).toBeLessThanOrEqual(amounts[i - 1]);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/deposits/stats
  // ═══════════════════════════════════════════════════════════════

  describe('GET /api/deposits/stats', () => {
    it('should return deposit statistics', async () => {
      const res = await api.get('/api/deposits/stats').set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.counts).toBeDefined();
      expect(res.body.data.amounts).toBeDefined();
      expect(typeof res.body.data.counts.total).toBe('number');
      expect(typeof res.body.data.counts.pending).toBe('number');
      expect(typeof res.body.data.counts.paid).toBe('number');
      expect(typeof res.body.data.amounts.total).toBe('number');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/deposits/overdue
  // ═══════════════════════════════════════════════════════════════

  describe('GET /api/deposits/overdue', () => {
    it('should return overdue deposits array', async () => {
      const res = await api.get('/api/deposits/overdue').set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/deposits/:id
  // ═══════════════════════════════════════════════════════════════

  describe('GET /api/deposits/:id', () => {
    it('should return deposit details with reservation', async () => {
      const createRes = await createDeposit(reservationId, 200, '2026-07-01');
      const depositId = createRes.body.data.id;

      const res = await api
        .get(`/api/deposits/${depositId}`)
        .set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(depositId);
      expect(res.body.data.reservation).toBeDefined();
      expect(res.body.data.reservation.client).toBeDefined();
    });

    it('should return 404 for non-existent deposit', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await api
        .get(`/api/deposits/${fakeId}`)
        .set(adminAuth());
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .get('/api/deposits/not-a-uuid')
        .set(adminAuth());
      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PUT /api/deposits/:id (Update)
  // ═══════════════════════════════════════════════════════════════

  describe('PUT /api/deposits/:id', () => {
    it('should update deposit amount', async () => {
      const createRes = await createDeposit(reservationId, 300, '2026-08-01');
      const depositId = createRes.body.data.id;

      const res = await api
        .put(`/api/deposits/${depositId}`)
        .set(adminAuth())
        .send({ amount: 350 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.amount)).toBe(350);
    });

    it('should update deposit dueDate', async () => {
      const createRes = await createDeposit(reservationId, 300, '2026-08-01');
      const depositId = createRes.body.data.id;

      const res = await api
        .put(`/api/deposits/${depositId}`)
        .set(adminAuth())
        .send({ dueDate: '2026-09-15' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update amount and dueDate together', async () => {
      const createRes = await createDeposit(reservationId, 300, '2026-08-01');
      const depositId = createRes.body.data.id;

      const res = await api
        .put(`/api/deposits/${depositId}`)
        .set(adminAuth())
        .send({ amount: 400, dueDate: '2026-10-01' });
      expect(res.status).toBe(200);
      expect(Number(res.body.data.amount)).toBe(400);
    });

    it('should reject update with no fields', async () => {
      const createRes = await createDeposit(reservationId, 300, '2026-08-01');
      const depositId = createRes.body.data.id;

      const res = await api
        .put(`/api/deposits/${depositId}`)
        .set(adminAuth())
        .send({});
      expect(res.status).toBe(400);
    });

    it('should reject update with amount <= 0', async () => {
      const createRes = await createDeposit(reservationId, 300, '2026-08-01');
      const depositId = createRes.body.data.id;

      const res = await api
        .put(`/api/deposits/${depositId}`)
        .set(adminAuth())
        .send({ amount: -50 });
      expect(res.status).toBe(400);
    });

    it('should reject update of paid deposit', async () => {
      const createRes = await createDeposit(reservationId, 100, '2026-11-01');
      const depositId = createRes.body.data.id;
      await markPaid(depositId);

      const res = await api
        .put(`/api/deposits/${depositId}`)
        .set(adminAuth())
        .send({ amount: 200 });
      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DELETE /api/deposits/:id
  // ═══════════════════════════════════════════════════════════════

  describe('DELETE /api/deposits/:id', () => {
    it('should delete a pending deposit', async () => {
      const createRes = await createDeposit(reservationId, 50, '2026-12-01');
      const depositId = createRes.body.data.id;

      const res = await api
        .delete(`/api/deposits/${depositId}`)
        .set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's gone
      const getRes = await api
        .get(`/api/deposits/${depositId}`)
        .set(adminAuth());
      expect(getRes.status).toBe(404);
    });

    it('should reject deleting a paid deposit', async () => {
      const createRes = await createDeposit(reservationId, 75, '2026-12-15');
      const depositId = createRes.body.data.id;
      await markPaid(depositId);

      const res = await api
        .delete(`/api/deposits/${depositId}`)
        .set(adminAuth());
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent deposit', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await api
        .delete(`/api/deposits/${fakeId}`)
        .set(adminAuth());
      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PATCH /api/deposits/:id/mark-paid
  // ═══════════════════════════════════════════════════════════════

  describe('PATCH /api/deposits/:id/mark-paid', () => {
    it('should mark deposit as paid (full payment)', async () => {
      const createRes = await createDeposit(reservationId, 150, '2026-06-15');
      const depositId = createRes.body.data.id;

      const res = await markPaid(depositId, 'BLIK', '2026-02-20');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paid).toBe(true);
      expect(res.body.data.status).toBe('PAID');
      expect(res.body.data.paymentMethod).toBe('BLIK');
    });

    it('should support partial payment → PARTIALLY_PAID', async () => {
      const createRes = await createDeposit(reservationId, 200, '2026-06-20');
      const depositId = createRes.body.data.id;

      const res = await api
        .patch(`/api/deposits/${depositId}/mark-paid`)
        .set(adminAuth())
        .send({ paymentMethod: 'CASH', paidAt: '2026-02-20', amountPaid: 100 });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PARTIALLY_PAID');
      expect(res.body.data.paid).toBe(false);
    });

    it('should reject marking already paid deposit', async () => {
      const createRes = await createDeposit(reservationId, 80, '2026-07-01');
      const depositId = createRes.body.data.id;
      await markPaid(depositId);

      const res = await markPaid(depositId);
      expect(res.status).toBe(400);
    });

    it('should reject without paymentMethod', async () => {
      const createRes = await createDeposit(reservationId, 60, '2026-07-05');
      const depositId = createRes.body.data.id;

      const res = await api
        .patch(`/api/deposits/${depositId}/mark-paid`)
        .set(adminAuth())
        .send({ paidAt: '2026-02-20' });
      expect(res.status).toBe(400);
    });

    it('should reject without paidAt', async () => {
      const createRes = await createDeposit(reservationId, 60, '2026-07-10');
      const depositId = createRes.body.data.id;

      const res = await api
        .patch(`/api/deposits/${depositId}/mark-paid`)
        .set(adminAuth())
        .send({ paymentMethod: 'TRANSFER' });
      expect(res.status).toBe(400);
    });

    it('should accept all payment methods', async () => {
      const methods = ['CASH', 'TRANSFER', 'BLIK', 'CARD'];
      for (const method of methods) {
        const createRes = await createDeposit(reservationId, 30, '2026-08-01');
        const depositId = createRes.body.data.id;
        const res = await markPaid(depositId, method);
        expect(res.status).toBe(200);
        expect(res.body.data.paymentMethod).toBe(method);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PATCH /api/deposits/:id/mark-unpaid
  // ═══════════════════════════════════════════════════════════════

  describe('PATCH /api/deposits/:id/mark-unpaid', () => {
    it('should revert paid deposit back to pending', async () => {
      const createRes = await createDeposit(reservationId, 120, '2026-09-01');
      const depositId = createRes.body.data.id;
      await markPaid(depositId);

      const res = await api
        .patch(`/api/deposits/${depositId}/mark-unpaid`)
        .set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.data.paid).toBe(false);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.paymentMethod).toBeNull();
      expect(res.body.data.paidAt).toBeNull();
    });

    it('should reject mark-unpaid on already pending deposit', async () => {
      const createRes = await createDeposit(reservationId, 90, '2026-09-05');
      const depositId = createRes.body.data.id;

      const res = await api
        .patch(`/api/deposits/${depositId}/mark-unpaid`)
        .set(adminAuth());
      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PATCH /api/deposits/:id/cancel
  // ═══════════════════════════════════════════════════════════════

  describe('PATCH /api/deposits/:id/cancel', () => {
    it('should cancel a pending deposit', async () => {
      const createRes = await createDeposit(reservationId, 110, '2026-10-01');
      const depositId = createRes.body.data.id;

      const res = await api
        .patch(`/api/deposits/${depositId}/cancel`)
        .set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('should reject cancelling a paid deposit', async () => {
      const createRes = await createDeposit(reservationId, 100, '2026-10-05');
      const depositId = createRes.body.data.id;
      await markPaid(depositId);

      const res = await api
        .patch(`/api/deposits/${depositId}/cancel`)
        .set(adminAuth());
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent deposit', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await api
        .patch(`/api/deposits/${fakeId}/cancel`)
        .set(adminAuth());
      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Business Logic: Deposit lifecycle
  // ═══════════════════════════════════════════════════════════════

  describe('Deposit lifecycle (business logic)', () => {
    it('should track summary correctly after create + pay + cancel', async () => {
      const dep1 = await createDeposit(reservationId2, 500, '2026-06-01');
      const dep2 = await createDeposit(reservationId2, 300, '2026-07-01');
      expect(dep1.status).toBe(201);
      expect(dep2.status).toBe(201);

      // Pay first one
      await markPaid(dep1.body.data.id);

      // Cancel second one
      await api
        .patch(`/api/deposits/${dep2.body.data.id}/cancel`)
        .set(adminAuth());

      // Check summary
      const summaryRes = await api
        .get(`/api/reservations/${reservationId2}/deposits`)
        .set(adminAuth());
      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.summary.paidAmount).toBe(500);
      expect(summaryRes.body.summary.totalAmount).toBe(500);
    });

    it('full cycle: create → pay → unpay → update → pay again', async () => {
      const createRes = await createDeposit(reservationId2, 250, '2026-06-15');
      const depositId = createRes.body.data.id;

      // Pay
      let res = await markPaid(depositId, 'CARD');
      expect(res.body.data.status).toBe('PAID');

      // Unpay
      res = await api
        .patch(`/api/deposits/${depositId}/mark-unpaid`)
        .set(adminAuth());
      expect(res.body.data.status).toBe('PENDING');

      // Update amount
      res = await api
        .put(`/api/deposits/${depositId}`)
        .set(adminAuth())
        .send({ amount: 300 });
      expect(Number(res.body.data.amount)).toBe(300);

      // Pay again with different method
      res = await markPaid(depositId, 'BLIK');
      expect(res.body.data.status).toBe('PAID');
      expect(res.body.data.paymentMethod).toBe('BLIK');
    });

    it('should not allow sum of deposits to exceed totalPrice', async () => {
      // reservationId2 has totalPrice = 10000
      await createDeposit(reservationId2, 6000, '2026-06-01');
      await createDeposit(reservationId2, 3000, '2026-07-01');

      // This would make total = 6000 + 3000 + 2000 = 11000 > 10000
      const res = await createDeposit(reservationId2, 2000, '2026-08-01');
      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error || '').toMatch(/przekracza|cen/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // UUID validation
  // ═══════════════════════════════════════════════════════════════

  describe('UUID validation', () => {
    const invalidUUIDs = ['abc', '123', 'not-uuid', '12345678-1234-1234-1234'];

    for (const badId of invalidUUIDs) {
      it(`should reject invalid UUID: ${badId}`, async () => {
        const res = await api
          .get(`/api/deposits/${badId}`)
          .set(adminAuth());
        expect(res.status).toBe(400);
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // Authorization
  // ═══════════════════════════════════════════════════════════════

  describe('Authorization — all endpoints require auth', () => {
    it('should return 401 for all endpoints without token', async () => {
      const depositId = '00000000-0000-0000-0000-000000000001';

      const endpoints = [
        { method: 'get' as const, url: '/api/deposits' },
        { method: 'get' as const, url: '/api/deposits/stats' },
        { method: 'get' as const, url: '/api/deposits/overdue' },
        { method: 'get' as const, url: `/api/deposits/${depositId}` },
        { method: 'put' as const, url: `/api/deposits/${depositId}` },
        { method: 'delete' as const, url: `/api/deposits/${depositId}` },
        { method: 'patch' as const, url: `/api/deposits/${depositId}/mark-paid` },
        { method: 'patch' as const, url: `/api/deposits/${depositId}/mark-unpaid` },
        { method: 'patch' as const, url: `/api/deposits/${depositId}/cancel` },
        { method: 'get' as const, url: `/api/reservations/${reservationId}/deposits` },
        { method: 'post' as const, url: `/api/reservations/${reservationId}/deposits` },
      ];

      for (const ep of endpoints) {
        const res = await api[ep.method](ep.url);
        expect(res.status).toBe(401);
      }
    });
  });
});
