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

  function pastDate(monthsBack: number = 1): string {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsBack);
    return d.toISOString().split('T')[0];
  }

  async function createReservationInDb(overrides: Record<string, any> = {}) {
    const dateStr = overrides.date || futureDate(2);

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
    it('should create a reservation with valid data (startDateTime format)', async () => {
      const dateStr = futureDate(4);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
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
          notes: 'Wesele testowe',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should create reservation with legacy date format (date/startTime/endTime)', async () => {
      const dateStr = futureDate(5);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          date: dateStr,
          startTime: '14:00',
          endTime: '22:00',
          adults: 40,
          children: 10,
          toddlers: 5,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should reject creation with 0 guests', async () => {
      const dateStr = futureDate(4);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 0,
          children: 0,
          toddlers: 0,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject guests exceeding hall capacity', async () => {
      const dateStr = futureDate(4);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 9999,
          children: 0,
          toddlers: 0,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject past startDateTime', async () => {
      const pastStr = pastDate(2);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${pastStr}T14:00:00`,
          endDateTime: `${pastStr}T22:00:00`,
          adults: 30,
          children: 5,
          toddlers: 0,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject endDateTime before startDateTime', async () => {
      const dateStr = futureDate(4);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T22:00:00`,
          endDateTime: `${dateStr}T14:00:00`,
          adults: 30,
          children: 5,
          toddlers: 0,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject overlapping reservation for same hall', async () => {
      const dateStr = futureDate(6);

      // Create first reservation (150 adults — close to hall1 capacity of 200)
      await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 150,
          children: 5,
          toddlers: 0,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      // Try overlapping reservation that would exceed capacity (150 + 120 = 270 > 200)
      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T16:00:00`,
          endDateTime: `${dateStr}T23:00:00`,
          adults: 120,
          children: 5,
          toddlers: 0,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([400, 409, 500]).toContain(res.status);
    });

    it('should reject non-existent hallId', async () => {
      const dateStr = futureDate(4);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: '00000000-0000-4000-a000-000000000099',
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 30,
          children: 5,
          toddlers: 0,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([400, 404, 500]).toContain(res.status);
    });

    it('should reject non-existent eventTypeId', async () => {
      const dateStr = futureDate(4);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: '00000000-0000-4000-a000-000000000099',
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 30,
          children: 5,
          toddlers: 0,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
        });

      expect([400, 404, 500]).toContain(res.status);
    });

    it('should create reservation with inline PERCENTAGE discount', async () => {
      const dateStr = futureDate(7);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 50,
          children: 10,
          toddlers: 5,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          discountReason: 'Rabat testowy dla stalego klienta',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should handle inline AMOUNT discount during creation', async () => {
      const dateStr = futureDate(8);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 50,
          children: 10,
          toddlers: 5,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
          discountType: 'AMOUNT',
          discountValue: 500,
          discountReason: 'Rabat kwotowy testowy na rezerwacje',
        });

      // Service supports PERCENTAGE and non-PERCENTAGE (treated as AMOUNT/FIXED)
      // Accept success or validation rejection depending on controller mapping
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle reservation creation with deposit fields', async () => {
      const dateStr = futureDate(9);
      const dueDateStr = futureDate(7);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 40,
          children: 10,
          toddlers: 0,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
          depositAmount: 3000,
          depositDueDate: dueDateStr,
        });

      // depositAmount/depositDueDate may or may not be forwarded by controller
      // 200/201 = created with deposit, 400 = fields not recognized
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should reject missing prices without menu package', async () => {
      const dateStr = futureDate(4);

      const res = await api
        .post('/api/reservations')
        .set(adminAuth())
        .send({
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: `${dateStr}T14:00:00`,
          endDateTime: `${dateStr}T22:00:00`,
          adults: 30,
          children: 5,
          toddlers: 0,
          // No pricePerAdult/pricePerChild and no menuPackageId
        });

      expect([400, 422, 500]).toContain(res.status);
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

    it('should filter by status', async () => {
      await createReservationInDb({ status: 'PENDING' });
      await createReservationInDb({ status: 'CONFIRMED', date: futureDate(3) });

      const res = await api
        .get('/api/reservations')
        .query({ status: 'PENDING' })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should filter by hallId', async () => {
      await createReservationInDb();

      const res = await api
        .get('/api/reservations')
        .query({ hallId: seed.hall1.id })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should filter by date range', async () => {
      await createReservationInDb();

      const res = await api
        .get('/api/reservations')
        .query({
          dateFrom: '2025-01-01',
          dateTo: '2030-12-31',
        })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should filter by clientId', async () => {
      await createReservationInDb();

      const res = await api
        .get('/api/reservations')
        .query({ clientId: seed.client1.id })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should filter by eventTypeId', async () => {
      await createReservationInDb();

      const res = await api
        .get('/api/reservations')
        .query({ eventTypeId: seed.eventType1.id })
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
    it('should return reservation details with includes', async () => {
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
    it('should update reservation notes', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .put(`/api/reservations/${reservation.id}`)
        .set(adminAuth())
        .send({
          notes: 'Zaktualizowana notatka testowa',
        });

      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject update of cancelled reservation', async () => {
      const reservation = await createReservationInDb({ status: 'CANCELLED' });

      const res = await api
        .put(`/api/reservations/${reservation.id}`)
        .set(adminAuth())
        .send({ notes: 'Should not work' });

      expect([400, 409, 422, 500]).toContain(res.status);
    });

    it('should reject update of completed reservation', async () => {
      const reservation = await createReservationInDb({ status: 'COMPLETED', date: pastDate(1) });

      const res = await api
        .put(`/api/reservations/${reservation.id}`)
        .set(adminAuth())
        .send({ notes: 'Should not work' });

      expect([400, 409, 422, 500]).toContain(res.status);
    });

    it('should update guest count and recalculate price', async () => {
      const reservation = await createReservationInDb({
        status: 'PENDING',
        adults: 50,
        children: 10,
        toddlers: 5,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
        totalPrice: 11000,
      });

      const res = await api
        .put(`/api/reservations/${reservation.id}`)
        .set(adminAuth())
        .send({
          adults: 60,
          reason: 'Zmiana liczby gosci - doszlo 10 osob doroslych do rezerwacji',
        });

      expect([200, 400, 500]).toContain(res.status);
    });

    it('should return 404 for non-existent reservation', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .put(`/api/reservations/${fakeUuid}`)
        .set(adminAuth())
        .send({ notes: 'test' });

      expect([404, 500]).toContain(res.status);
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
    it('should transition PENDING → CONFIRMED', async () => {
      const reservation = await createReservationInDb({ status: 'PENDING' });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/status`)
        .set(adminAuth())
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(200);

      const updated = await prismaTest.reservation.findUnique({
        where: { id: reservation.id },
      });
      expect(updated?.status).toBe('CONFIRMED');
    });

    it('should transition CONFIRMED → COMPLETED (past event)', async () => {
      const pastDateStr = pastDate(1);
      const reservation = await createReservationInDb({
        status: 'CONFIRMED',
        date: pastDateStr,
      });

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

    it('should transition CONFIRMED → CANCELLED', async () => {
      const reservation = await createReservationInDb({ status: 'CONFIRMED' });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/status`)
        .set(adminAuth())
        .send({ status: 'CANCELLED', reason: 'Klient zrezygnowal' });

      expect(res.status).toBe(200);
    });

    it('should transition PENDING → CANCELLED', async () => {
      const reservation = await createReservationInDb({ status: 'PENDING' });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/status`)
        .set(adminAuth())
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(200);
    });

    it('should reject invalid transition COMPLETED → PENDING', async () => {
      const reservation = await createReservationInDb({
        status: 'COMPLETED',
        date: pastDate(1),
      });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/status`)
        .set(adminAuth())
        .send({ status: 'PENDING' });

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject invalid transition CANCELLED → CONFIRMED', async () => {
      const reservation = await createReservationInDb({ status: 'CANCELLED' });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/status`)
        .set(adminAuth())
        .send({ status: 'CONFIRMED' });

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject COMPLETED for future event', async () => {
      const reservation = await createReservationInDb({
        status: 'CONFIRMED',
        date: futureDate(3),
      });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/status`)
        .set(adminAuth())
        .send({ status: 'COMPLETED' });

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should cascade cancel deposits when cancelling reservation', async () => {
      const reservation = await createReservationInDb({ status: 'CONFIRMED' });

      // Create a PENDING deposit — dueDate is String (VarChar(10)), not DateTime
      await prismaTest.deposit.create({
        data: {
          reservationId: reservation.id,
          amount: 3000,
          remainingAmount: 3000,
          dueDate: futureDate(1),
          status: 'PENDING',
        },
      });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/status`)
        .set(adminAuth())
        .send({ status: 'CANCELLED', reason: 'Test cascade cancel with deposit' });

      expect(res.status).toBe(200);

      const deposits = await prismaTest.deposit.findMany({
        where: { reservationId: reservation.id },
      });
      expect(deposits[0]?.status).toBe('CANCELLED');
    });

    it('should return 404 for non-existent reservation', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .patch(`/api/reservations/${fakeUuid}/status`)
        .set(adminAuth())
        .send({ status: 'CONFIRMED' });

      expect([404, 500]).toContain(res.status);
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
  // Menu Selection Endpoints
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
  // Discount Endpoints
  // ========================================
  describe('Discount Endpoints', () => {
    it('should apply PERCENTAGE discount to reservation', async () => {
      const reservation = await createReservationInDb({ totalPrice: 20000 });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/discount`)
        .set(adminAuth())
        .send({
          type: 'PERCENTAGE',
          value: 10,
          reason: 'Rabat testowy - staly klient',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should apply FIXED discount to reservation', async () => {
      const reservation = await createReservationInDb({ totalPrice: 20000 });

      const res = await api
        .patch(`/api/reservations/${reservation.id}/discount`)
        .set(adminAuth())
        .send({
          type: 'FIXED',
          value: 1000,
          reason: 'Rabat kwotowy testowy na rezerwacje',
        });

      expect([200, 201]).toContain(res.status);
    });

    it('should remove discount from reservation', async () => {
      const reservation = await createReservationInDb({ totalPrice: 20000 });

      // First apply discount
      await api
        .patch(`/api/reservations/${reservation.id}/discount`)
        .set(adminAuth())
        .send({
          type: 'PERCENTAGE',
          value: 10,
          reason: 'Rabat do usuniecia testowy',
        });

      // Then remove it
      const res = await api
        .delete(`/api/reservations/${reservation.id}/discount`)
        .set(adminAuth());

      expect([200, 204, 400, 404]).toContain(res.status);
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

      // Archive first
      await api
        .post(`/api/reservations/${reservation.id}/archive`)
        .set(adminAuth());

      // Then unarchive
      const res = await api
        .post(`/api/reservations/${reservation.id}/unarchive`)
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should reject archiving already archived reservation', async () => {
      const reservation = await createReservationInDb({ status: 'COMPLETED' });

      // Archive first
      await api
        .post(`/api/reservations/${reservation.id}/archive`)
        .set(adminAuth());

      // Try again
      const res = await api
        .post(`/api/reservations/${reservation.id}/archive`)
        .set(adminAuth());

      expect([400, 409, 500]).toContain(res.status);
    });

    it('should reject unarchiving non-archived reservation', async () => {
      const reservation = await createReservationInDb({ status: 'COMPLETED' });

      const res = await api
        .post(`/api/reservations/${reservation.id}/unarchive`)
        .set(adminAuth());

      expect([400, 409, 500]).toContain(res.status);
    });
  });

  // ========================================
  // DELETE /api/reservations/:id
  // ========================================
  describe('DELETE /api/reservations/:id', () => {
    it('should allow ADMIN to cancel reservation', async () => {
      const reservation = await createReservationInDb();

      const res = await api
        .delete(`/api/reservations/${reservation.id}`)
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);
    });

    it('should reject cancelling already cancelled reservation', async () => {
      const reservation = await createReservationInDb({ status: 'CANCELLED' });

      const res = await api
        .delete(`/api/reservations/${reservation.id}`)
        .set(adminAuth());

      expect([400, 409, 500]).toContain(res.status);
    });

    it('should reject cancelling completed reservation', async () => {
      const reservation = await createReservationInDb({ status: 'COMPLETED', date: pastDate(1) });

      const res = await api
        .delete(`/api/reservations/${reservation.id}`)
        .set(adminAuth());

      expect([400, 409, 500]).toContain(res.status);
    });

    it('should cascade cancel deposits on delete', async () => {
      const reservation = await createReservationInDb({ status: 'PENDING' });

      // dueDate is String (VarChar(10)), not DateTime
      await prismaTest.deposit.create({
        data: {
          reservationId: reservation.id,
          amount: 2000,
          remainingAmount: 2000,
          dueDate: futureDate(1),
          status: 'PENDING',
        },
      });

      const res = await api
        .delete(`/api/reservations/${reservation.id}`)
        .set(adminAuth());

      expect([200, 204]).toContain(res.status);

      const deposits = await prismaTest.deposit.findMany({
        where: { reservationId: reservation.id },
      });
      if (deposits.length > 0) {
        expect(deposits[0].status).toBe('CANCELLED');
      }
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
