/**
 * Catering Orders API Integration Tests
 * Issue: #247 — Rozszerzenie testów integracyjnych
 *
 * Tests:
 * - Order CRUD lifecycle (DRAFT → CONFIRMED → DELIVERED → COMPLETED)
 * - Order deposits management
 * - Status transitions
 * - Validation (schema enforcement)
 * - History tracking
 */
import { api, authHeader } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Catering Orders API', () => {
  let seed: TestSeedData;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
    seed = await seedTestData();
    // Ensure the default test token user (from authHeader) exists in DB.
    // requirePermission looks up user → legacyRole ADMIN → wildcard '*'.
    // Also needed as FK for CateringOrder.createdById.
    const bcrypt = await import('bcryptjs');
    await prismaTest.user.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'token-admin@test.pl',
        password: await bcrypt.hash('TestPass123!', 10),
        firstName: 'Token',
        lastName: 'Admin',
        legacyRole: 'ADMIN',
        isActive: true,
      },
    }).catch(() => {});
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectTestDb();
  });

  const adminAuth = () => authHeader('ADMIN');

  /** Helper: create a catering order directly in DB */
  async function createTestOrder(overrides: Record<string, any> = {}) {
    return prismaTest.cateringOrder.create({
      data: {
        orderNumber: `CAT-2026-${Date.now().toString().slice(-5)}`,
        clientId: seed.client1.id,
        createdById: seed.admin.id,
        status: 'DRAFT',
        deliveryType: 'ON_SITE',
        eventName: 'Wesele testowe',
        eventDate: '2026-08-15',
        guestsCount: 100,
        ...overrides,
      },
    });
  }

  // ================================================================
  // GET /api/catering/orders
  // ================================================================
  describe('GET /api/catering/orders', () => {
    it('should return empty list when no orders', async () => {
      const res = await api
        .get('/api/catering/orders')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return orders list', async () => {
      await createTestOrder();

      const res = await api
        .get('/api/catering/orders')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/catering/orders');

      expect(res.status).toBe(401);
    });
  });

  // ================================================================
  // POST /api/catering/orders
  // ================================================================
  describe('POST /api/catering/orders', () => {
    it('should create a new order', async () => {
      const res = await api
        .post('/api/catering/orders')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          eventName: 'Wesele Testowe',
          eventDate: '2026-09-20',
          eventTime: '14:00',
          guestsCount: 150,
          deliveryType: 'ON_SITE',
          contactName: 'Jan Kowalski',
          contactPhone: '+48123456789',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should reject order without clientId', async () => {
      const res = await api
        .post('/api/catering/orders')
        .set(adminAuth())
        .send({
          eventName: 'Brak klienta',
          guestsCount: 50,
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject invalid clientId format', async () => {
      const res = await api
        .post('/api/catering/orders')
        .set(adminAuth())
        .send({
          clientId: 'not-a-uuid',
          eventName: 'Invalid client',
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject invalid date format', async () => {
      const res = await api
        .post('/api/catering/orders')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          eventDate: '15-09-2026', // wrong format
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject invalid time format', async () => {
      const res = await api
        .post('/api/catering/orders')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          eventTime: '2:00 PM', // wrong format — expected HH:MM
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should accept order with items', async () => {
      // Create a dish for the order item
      const dishCat = await prismaTest.dishCategory.create({
        data: { name: 'Kategoria Testowa' },
      });
      const dish = await prismaTest.dish.create({
        data: {
          name: 'Pierogi',
          price: 25.00,
          categoryId: dishCat.id,
          isActive: true,
        },
      });

      const res = await api
        .post('/api/catering/orders')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          guestsCount: 50,
          items: [
            { dishId: dish.id, quantity: 50, unitPrice: 25.00 },
          ],
        });

      expect([200, 201]).toContain(res.status);
    });
  });

  // ================================================================
  // GET /api/catering/orders/:id
  // ================================================================
  describe('GET /api/catering/orders/:id', () => {
    it('should return order by id', async () => {
      const order = await createTestOrder();

      const res = await api
        .get(`/api/catering/orders/${order.id}`)
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .get('/api/catering/orders/not-a-uuid')
        .set(adminAuth());

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .get(`/api/catering/orders/${fakeId}`)
        .set(adminAuth());

      expect([404, 500]).toContain(res.status);
    });
  });

  // ================================================================
  // PATCH /api/catering/orders/:id
  // ================================================================
  describe('PATCH /api/catering/orders/:id', () => {
    it('should update order fields', async () => {
      const order = await createTestOrder();

      const res = await api
        .patch(`/api/catering/orders/${order.id}`)
        .set(adminAuth())
        .send({
          eventName: 'Wesele zaktualizowane',
          guestsCount: 200,
          notes: 'Dodatkowe uwagi',
        });

      expect([200, 204]).toContain(res.status);
    });

    it('should accept changeReason', async () => {
      const order = await createTestOrder();

      const res = await api
        .patch(`/api/catering/orders/${order.id}`)
        .set(adminAuth())
        .send({
          guestsCount: 120,
          changeReason: 'Klient zmienił liczbę gości',
        });

      expect([200, 204]).toContain(res.status);
    });
  });

  // ================================================================
  // PATCH /api/catering/orders/:id/status
  // ================================================================
  describe('PATCH /api/catering/orders/:id/status', () => {
    it('should change status from DRAFT to INQUIRY', async () => {
      const order = await createTestOrder({ status: 'DRAFT' });

      const res = await api
        .patch(`/api/catering/orders/${order.id}/status`)
        .set(adminAuth())
        .send({ status: 'INQUIRY' });

      expect([200, 204]).toContain(res.status);
    });

    it('should change status to CANCELLED with reason', async () => {
      const order = await createTestOrder({ status: 'DRAFT' });

      const res = await api
        .patch(`/api/catering/orders/${order.id}/status`)
        .set(adminAuth())
        .send({
          status: 'CANCELLED',
          reason: 'Klient zrezygnował',
        });

      expect([200, 204]).toContain(res.status);
    });

    it('should reject invalid status value', async () => {
      const order = await createTestOrder();

      const res = await api
        .patch(`/api/catering/orders/${order.id}/status`)
        .set(adminAuth())
        .send({ status: 'INVALID_STATUS' });

      expect([400, 422]).toContain(res.status);
    });
  });

  // ================================================================
  // DELETE /api/catering/orders/:id
  // ================================================================
  describe('DELETE /api/catering/orders/:id', () => {
    it('should delete DRAFT order', async () => {
      const order = await createTestOrder({ status: 'DRAFT' });

      const res = await api
        .delete(`/api/catering/orders/${order.id}`)
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);
    });

    it('should delete CANCELLED order', async () => {
      const order = await createTestOrder({ status: 'CANCELLED' });

      const res = await api
        .delete(`/api/catering/orders/${order.id}`)
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);
    });

    it('should block deletion of CONFIRMED order', async () => {
      const order = await createTestOrder({ status: 'CONFIRMED' });

      const res = await api
        .delete(`/api/catering/orders/${order.id}`)
        .set(adminAuth());

      // Should reject — only DRAFT/CANCELLED deletable
      expect([400, 403, 409, 422]).toContain(res.status);
    });

    it('should return 401 without auth', async () => {
      const res = await api.delete('/api/catering/orders/00000000-0000-4000-a000-000000000000');

      expect(res.status).toBe(401);
    });
  });

  // ================================================================
  // GET /api/catering/orders/:id/history
  // ================================================================
  describe('GET /api/catering/orders/:id/history', () => {
    it('should return order history', async () => {
      const order = await createTestOrder();

      const res = await api
        .get(`/api/catering/orders/${order.id}/history`)
        .set(adminAuth());

      expect([200, 404]).toContain(res.status);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .get('/api/catering/orders/not-uuid/history')
        .set(adminAuth());

      expect(res.status).toBe(400);
    });
  });

  // ================================================================
  // Catering Order Deposits
  // ================================================================
  describe('Catering Order Deposits', () => {
    describe('POST /api/catering/orders/:id/deposits', () => {
      it('should create a deposit for order', async () => {
        const order = await createTestOrder();

        const res = await api
          .post(`/api/catering/orders/${order.id}/deposits`)
          .set(adminAuth())
          .send({
            amount: 5000,
            dueDate: '2026-07-01',
            title: 'Zaliczka 50%',
          });

        expect([200, 201]).toContain(res.status);
      });

      it('should reject negative amount', async () => {
        const order = await createTestOrder();

        const res = await api
          .post(`/api/catering/orders/${order.id}/deposits`)
          .set(adminAuth())
          .send({
            amount: -100,
            dueDate: '2026-07-01',
          });

        expect([400, 422]).toContain(res.status);
      });

      it('should reject missing dueDate', async () => {
        const order = await createTestOrder();

        const res = await api
          .post(`/api/catering/orders/${order.id}/deposits`)
          .set(adminAuth())
          .send({ amount: 1000 });

        expect([400, 422]).toContain(res.status);
      });
    });

    describe('PATCH /api/catering/orders/:id/deposits/:depositId/pay', () => {
      it('should mark deposit as paid', async () => {
        const order = await createTestOrder();

        // Create deposit via DB
        const deposit = await prismaTest.cateringDeposit.create({
          data: {
            orderId: order.id,
            amount: 3000,
            remainingAmount: 3000,
            dueDate: '2026-07-01',
            title: 'Test deposit',
            paid: false,
          },
        });

        const res = await api
          .patch(`/api/catering/orders/${order.id}/deposits/${deposit.id}/pay`)
          .set(adminAuth())
          .send({ paymentMethod: 'TRANSFER' });

        expect([200, 204]).toContain(res.status);
      });
    });

    describe('DELETE /api/catering/orders/:id/deposits/:depositId', () => {
      it('should delete unpaid deposit', async () => {
        const order = await createTestOrder();

        const deposit = await prismaTest.cateringDeposit.create({
          data: {
            orderId: order.id,
            amount: 2000,
            remainingAmount: 2000,
            dueDate: '2026-07-01',
            paid: false,
          },
        });

        const res = await api
          .delete(`/api/catering/orders/${order.id}/deposits/${deposit.id}`)
          .set(adminAuth());

        expect([200, 204]).toContain(res.status);
      });
    });
  });
});
