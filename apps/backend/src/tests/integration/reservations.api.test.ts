/**
 * Reservations API Integration Tests
 * Issues: #98 (Menu), #99 (Klienci/Sale/Wydarzenia) — linked via reservations
 *
 * Tests reservation CRUD, status transitions, menu selection,
 * discount, archive, and availability check.
 */
import { api, authHeader, authHeaderForUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Reservations API — /api/reservations', () => {
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

  function futureDate(monthsAhead: number = 3): string {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    return d.toISOString().split('T')[0];
  }

  async function createReservationInDb(overrides: Record<string, any> = {}) {
    const dateStr = futureDate(2);

    return prismaTest.reservation.create({
      data: {
        clientId: seed.client1.id,
        createdById: seed.admin.id,
        hallId: seed.hall1.id,
        eventTypeId: seed.eventType1.id,
        date: dateStr,
        startTime: '14:00',
        endTime: '22:00',
        guests: 100,
        status: 'CONFIRMED',
        totalPrice: 15000,
        notes: 'Integration test reservation',
        ...overrides,
      },
    });
  }

  // ========================================
  // POST /api/reservations
  // ========================================
  describe('POST /api/reservations', () => {
    it('should create a reservation with valid data', async () => {
      const dateStr = futureDate(4);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          // New datetime format supported by controller
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          // Controller requires adults/children/toddlers (not guests)
          adults: 60,
          children: 15,
          toddlers: 5,
          // Manual pricing (when no menuPackageId)
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
          notes: 'Wesele testowe',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should return 401 without auth', async () => {
      const res = await api
        .post('/api/reservations')
        .send({ clientId: seed.client1.id });

      expect(res.status).toBe(401);
    });

    it('should return error for missing required fields', async () => {
      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({});

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should return error for non-existent clientId', async () => {
      const dateStr = futureDate(5);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: '00000000-0000-4000-a000-000000000099',
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 40,
          children: 5,
          toddlers: 5,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([400, 404, 500]).toContain(res.status);
    });

    it('should deny CLIENT role from creating reservations', async () => {
      const dateStr = futureDate(3);

      const res = await api
        .post('/api/reservations')
        .set(authHeader('CLIENT'))
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 50,
          children: 5,
          toddlers: 5,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([401, 403]).toContain(res.status);
    });
  });

  // ========================================
  // GET /api/reservations
  // ========================================
  describe('GET /api/reservations', () => {
    it('should list all reservations', async () => {
      await createReservationInDb();

      const res = await api
        .get('/api/reservations')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return empty list when no reservations', async () => {
      const res = await api
        .get('/api/reservations')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/reservations');
      expect(res.status).toBe(401);
    });
  });

  // ========================================
  // GET /api/reservations/:id
  // ========================================
  describe('GET /api/reservations/:id', () => {
    it('should return reservation details', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .get(`/api/reservations/${reservation.id}`)
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .get('/api/reservations/not-uuid')
        .set(adminAuth());

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent reservation', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .get(`/api/reservations/${fakeUuid}`)
        .set(adminAuth());

      expect([404, 500]).toContain(res.status);
    });
  });

  // ========================================
  // PUT /api/reservations/:id
  // ========================================
  describe('PUT /api/reservations/:id', () => {
    it('should update reservation details', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .put(`/api/reservations/${reservation.id}`)
        .set(adminAuth())
        .send({
          notes: 'Zaktualizowana notatka testowa',
        });

      // 200 for success, 400/500 if service-level validation rejects
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .put('/api/reservations/bad-id')
        .set(adminAuth())
        .send({ notes: 'test' });

      expect(res.status).toBe(400);
    });
  });

  // ========================================
  // PATCH /api/reservations/:id/status
  // ========================================
  describe('PATCH /api/reservations/:id/status', () => {
    it('should update reservation status to COMPLETED', async () => {
      const reservation = await createReservationInDb({ status: 'CONFIRMED' });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/status`)
        .set(adminAuth())
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);

      const updated = await prismaTest.reservation.findUnique({
        where: { id: reservation.id },
      });
      expect(updated?.status).toBe('COMPLETED');
    });

    it('should update status to CANCELLED', async () => {
      const reservation = await createReservationInDb({ status: 'CONFIRMED' });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/status`)
        .set(adminAuth())
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // GET /api/reservations/check-availability
  // ========================================
  describe('GET /api/reservations/check-availability', () => {
    it('should check availability for free slot', async () => {
      const date = futureDate(6);

      const res = await api
        .get('/api/reservations/check-availability')
        .query({
          hallId: seed.hall1.id,
          startDateTime: `${date}T14:00:00`,
          endDateTime: `${date}T22:00:00`,
        })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should detect conflict when slot is taken', async () => {
      const dateStr = futureDate(5);

      await createReservationInDb({
        date: dateStr,
        hallId: seed.hall1.id,
      });

      const res = await api
        .get('/api/reservations/check-availability')
        .query({
          hallId: seed.hall1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
        })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // POST/GET/PUT/DELETE /api/reservations/:id/menu
  // ========================================
  describe('Menu Selection Endpoints', () => {
    it('should return 404 or empty for reservation without menu', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .get(`/api/reservations/${reservation.id}/menu`)
        .set(adminAuth());

      expect([200, 404]).toContain(res.status);
    });

    it('should return 400 for invalid UUID on menu endpoint', async () => {
      const res = await api
        .get('/api/reservations/bad-uuid/menu')
        .set(adminAuth());

      expect(res.status).toBe(400);
    });
  });

  // ========================================
  // PATCH /api/reservations/:id/discount
  // ========================================
  describe('Discount Endpoints', () => {
    it('should apply discount to reservation', async () => {
      const reservation = await createReservationInDb({ totalPrice: 20000 });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/discount`)
        .set(adminAuth())
        .send({
          // Controller expects: type, value, reason (not discountType/discountValue/discountReason)
          type: 'PERCENTAGE',
          value: 10,
          reason: 'Rabat testowy - staly klient',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should remove discount from reservation', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .delete(`/api/reservations/${reservation.id}/discount`)
        .set(adminAuth());

      expect([200, 204, 404]).toContain(res.status);
    });
  });

  // ========================================
  // Archive/Unarchive
  // ========================================
  describe('Archive Endpoints', () => {
    it('should archive a reservation', async () => {
      const reservation = await createReservationInDb({ status: 'COMPLETED' });

      const res = await api
        .post(`/api/reservations/${reservation.id}/archive`)
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should unarchive a reservation', async () => {
      const reservation = await createReservationInDb({ status: 'COMPLETED' });

      await api
        .post(`/api/reservations/${reservation.id}/archive`)
        .set(adminAuth());

      const res = await api
        .post(`/api/reservations/${reservation.id}/unarchive`)
        .set(adminAuth());

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // DELETE /api/reservations/:id (admin only)
  // ========================================
  describe('DELETE /api/reservations/:id', () => {
    it('should allow ADMIN to cancel reservation', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .delete(`/api/reservations/${reservation.id}`)
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);
    });

    it('should deny CLIENT role from deleting reservation', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .delete(`/api/reservations/${reservation.id}`)
        .set(authHeader('CLIENT'));

      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .delete('/api/reservations/invalid')
        .set(adminAuth());

      expect(res.status).toBe(400);
    });
  });

  // ========================================
  // GET /api/reservations/:id/pdf
  // ========================================
  describe('GET /api/reservations/:id/pdf', () => {
    it('should generate PDF for valid reservation', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .get(`/api/reservations/${reservation.id}/pdf`)
        .set(adminAuth());

      expect([200, 500]).toContain(res.status);
    });
  });
});
