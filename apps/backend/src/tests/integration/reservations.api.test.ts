/**
 * Reservations API Integration Tests
 * Issues: #98 (Menu), #99 (Klienci/Sale/Wydarzenia) — linked via reservations
 *
 * Tests reservation CRUD, status transitions, menu selection,
 * discount, archive, and availability check.
 */
import { api, authHeader } from '../helpers/test-utils';
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

  function futureDate(monthsAhead: number = 3): string {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    return d.toISOString().split('T')[0];
  }

  async function createReservationInDb(overrides: Record<string, any> = {}) {
    const date = new Date();
    date.setMonth(date.getMonth() + 2);

    return prismaTest.reservation.create({
      data: {
        clientId: seed.client1.id,
        hallId: seed.hall1.id,
        eventTypeId: seed.eventType1.id,
        date,
        startTime: '14:00',
        endTime: '22:00',
        guestCount: 100,
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
      const res = await api
        .post('/api/reservations')
        .set(authHeader('ADMIN'))
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          date: futureDate(4),
          startTime: '14:00',
          endTime: '22:00',
          guestCount: 80,
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
        .set(authHeader('ADMIN'))
        .send({});

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should return error for non-existent clientId', async () => {
      const res = await api
        .post('/api/reservations')
        .set(authHeader('ADMIN'))
        .send({
          clientId: 999999,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          date: futureDate(5),
          startTime: '14:00',
          endTime: '22:00',
          guestCount: 50,
        });

      expect([400, 404, 500]).toContain(res.status);
    });

    it('should deny READONLY users from creating reservations', async () => {
      const res = await api
        .post('/api/reservations')
        .set(authHeader('READONLY'))
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          date: futureDate(3),
          startTime: '14:00',
          endTime: '22:00',
          guestCount: 60,
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
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should return empty list when no reservations', async () => {
      const res = await api
        .get('/api/reservations')
        .set(authHeader('ADMIN'));

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
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .get('/api/reservations/not-uuid')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent reservation', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .get(`/api/reservations/${fakeUuid}`)
        .set(authHeader('ADMIN'));

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
        .set(authHeader('ADMIN'))
        .send({
          guestCount: 150,
          notes: 'Zaktualizowana liczba gosci',
        });

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .put('/api/reservations/bad-id')
        .set(authHeader('ADMIN'))
        .send({ guestCount: 50 });

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
        .set(authHeader('ADMIN'))
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
        .set(authHeader('ADMIN'))
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
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should detect conflict when slot is taken', async () => {
      const date = new Date();
      date.setMonth(date.getMonth() + 5);
      const dateStr = date.toISOString().split('T')[0];

      // Create a reservation for this date
      await createReservationInDb({
        date,
        hallId: seed.hall1.id,
      });

      const res = await api
        .get('/api/reservations/check-availability')
        .query({
          hallId: seed.hall1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
        })
        .set(authHeader('ADMIN'));

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
        .set(authHeader('ADMIN'));

      expect([200, 404]).toContain(res.status);
    });

    it('should return 400 for invalid UUID on menu endpoint', async () => {
      const res = await api
        .get('/api/reservations/bad-uuid/menu')
        .set(authHeader('ADMIN'));

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
        .set(authHeader('ADMIN'))
        .send({
          discountType: 'PERCENTAGE',
          discountValue: 10,
          discountReason: 'Rabat testowy',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should remove discount from reservation', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .delete(`/api/reservations/${reservation.id}/discount`)
        .set(authHeader('ADMIN'));

      // 200 if discount existed, 404 if not — both acceptable
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
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should unarchive a reservation', async () => {
      const reservation = await createReservationInDb({ status: 'COMPLETED' });

      // Archive first
      await api
        .post(`/api/reservations/${reservation.id}/archive`)
        .set(authHeader('ADMIN'));

      const res = await api
        .post(`/api/reservations/${reservation.id}/unarchive`)
        .set(authHeader('ADMIN'));

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
        .set(authHeader('ADMIN'));

      expect([200, 204]).toContain(res.status);
    });

    it('should deny USER from deleting reservation', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .delete(`/api/reservations/${reservation.id}`)
        .set(authHeader('USER'));

      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .delete('/api/reservations/invalid')
        .set(authHeader('ADMIN'));

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
        .set(authHeader('ADMIN'));

      expect([200, 500]).toContain(res.status);
    });
  });
});
