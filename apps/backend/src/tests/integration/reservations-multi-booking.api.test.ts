/**
 * Reservations Multi-Booking API Integration Tests
 * Issue: #165 — Multiple reservations per hall
 *
 * Tests multi-booking behavior:
 * - allowMultipleReservations=true allows overlapping reservations up to capacity
 * - GET /api/halls/:id/available-capacity returns correct occupancy data
 * - Cancelling a reservation frees capacity
 * - Normal (single-booking) halls still block overlapping reservations
 */
import { api, authHeaderForUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Reservations Multi-Booking — #165', () => {
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

  // ========================================
  // Scenario 1: First reservation on multi-booking hall succeeds
  // ========================================
  it('should allow creating a reservation on a multi-booking hall', async () => {
    const dateStr = futureDate(4);

    const res = await api
      .post('/api/reservations')
      .set(adminAuth())
      .send({
        clientId: seed.client1.id,
        hallId: seed.hallMultiBooking.id,
        eventTypeId: seed.eventType1.id,
        startDateTime: `${dateStr}T14:00:00`,
        endDateTime: `${dateStr}T22:00:00`,
        adults: 100,
        children: 20,
        toddlers: 0,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
      });

    expect([200, 201]).toContain(res.status);
  });

  // ========================================
  // Scenario 2: Two overlapping reservations succeed when total guests <= capacity
  // ========================================
  it('should allow a second overlapping reservation on multi-booking hall when total guests ≤ capacity', async () => {
    const dateStr = futureDate(5);

    // First reservation: 100 guests
    await api
      .post('/api/reservations')
      .set(adminAuth())
      .send({
        clientId: seed.client1.id,
        hallId: seed.hallMultiBooking.id,
        eventTypeId: seed.eventType1.id,
        startDateTime: `${dateStr}T14:00:00`,
        endDateTime: `${dateStr}T22:00:00`,
        adults: 80,
        children: 20,
        toddlers: 0,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
      });

    // Second reservation: 100 guests — total 200 <= 300 capacity
    const res = await api
      .post('/api/reservations')
      .set(adminAuth())
      .send({
        clientId: seed.client2.id,
        hallId: seed.hallMultiBooking.id,
        eventTypeId: seed.eventType2.id,
        startDateTime: `${dateStr}T15:00:00`,
        endDateTime: `${dateStr}T21:00:00`,
        adults: 80,
        children: 20,
        toddlers: 0,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
      });

    expect([200, 201]).toContain(res.status);
  });

  // ========================================
  // Scenario 3: Reservation rejected when total guests exceed capacity
  // ========================================
  it('should reject reservation when total guests would exceed multi-booking hall capacity', async () => {
    const dateStr = futureDate(6);

    // First reservation: 250 guests
    await api
      .post('/api/reservations')
      .set(adminAuth())
      .send({
        clientId: seed.client1.id,
        hallId: seed.hallMultiBooking.id,
        eventTypeId: seed.eventType1.id,
        startDateTime: `${dateStr}T14:00:00`,
        endDateTime: `${dateStr}T22:00:00`,
        adults: 230,
        children: 20,
        toddlers: 0,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
      });

    // Second reservation: 100 guests — total 350 > 300 capacity → must be rejected
    const res = await api
      .post('/api/reservations')
      .set(adminAuth())
      .send({
        clientId: seed.client2.id,
        hallId: seed.hallMultiBooking.id,
        eventTypeId: seed.eventType2.id,
        startDateTime: `${dateStr}T15:00:00`,
        endDateTime: `${dateStr}T21:00:00`,
        adults: 80,
        children: 20,
        toddlers: 0,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
      });

    expect([400, 409, 422, 500]).toContain(res.status);
  });

  // ========================================
  // Scenario 4: GET /api/halls/:id/available-capacity returns correct data
  // ========================================
  it('should return correct available capacity for multi-booking hall', async () => {
    const dateStr = futureDate(7);

    // Seed a confirmed reservation for 100 guests directly in DB
    await prismaTest.reservation.create({
      data: {
        clientId: seed.client1.id,
        createdById: seed.admin.id,
        hallId: seed.hallMultiBooking.id,
        eventTypeId: seed.eventType1.id,
        date: dateStr,
        startTime: '14:00',
        endTime: '22:00',
        guests: 100,
        status: 'CONFIRMED',
        totalPrice: 20000,
      },
    });

    const res = await api
      .get(`/api/halls/${seed.hallMultiBooking.id}/available-capacity`)
      .query({
        startDateTime: `${dateStr}T14:00:00`,
        endDateTime: `${dateStr}T22:00:00`,
      })
      .set(adminAuth());

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalCapacity: 300,
      occupiedCapacity: 100,
      availableCapacity: 200,
    });
  });

  // ========================================
  // Scenario 5: Cancelling a reservation frees capacity
  // ========================================
  it('should free capacity after cancelling a reservation on multi-booking hall', async () => {
    const dateStr = futureDate(8);

    // First reservation: 250 guests (leaves only 50 free)
    const firstRes = await api
      .post('/api/reservations')
      .set(adminAuth())
      .send({
        clientId: seed.client1.id,
        hallId: seed.hallMultiBooking.id,
        eventTypeId: seed.eventType1.id,
        startDateTime: `${dateStr}T14:00:00`,
        endDateTime: `${dateStr}T22:00:00`,
        adults: 230,
        children: 20,
        toddlers: 0,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
      });

    expect([200, 201]).toContain(firstRes.status);
    const firstReservationId = firstRes.body?.id ?? firstRes.body?.data?.id;

    // Cancel the first reservation
    if (firstReservationId) {
      await api
        .patch(`/api/reservations/${firstReservationId}/status`)
        .set(adminAuth())
        .send({ status: 'CANCELLED', reason: 'Test: freeing capacity for multi-booking' });
    }

    // Now a 100-guest reservation should succeed (capacity fully freed)
    const res = await api
      .post('/api/reservations')
      .set(adminAuth())
      .send({
        clientId: seed.client2.id,
        hallId: seed.hallMultiBooking.id,
        eventTypeId: seed.eventType2.id,
        startDateTime: `${dateStr}T15:00:00`,
        endDateTime: `${dateStr}T21:00:00`,
        adults: 80,
        children: 20,
        toddlers: 0,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
      });

    expect([200, 201]).toContain(res.status);
  });

  // ========================================
  // Scenario 6: Normal single-booking hall still rejects overlapping reservations
  // ========================================
  it('should reject overlapping reservation on a standard (non-multi-booking) hall', async () => {
    const dateStr = futureDate(9);

    // First reservation on normal hall
    await api
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
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
      });

    // Second overlapping reservation on same hall — must be rejected
    const res = await api
      .post('/api/reservations')
      .set(adminAuth())
      .send({
        clientId: seed.client2.id,
        hallId: seed.hall1.id,
        eventTypeId: seed.eventType2.id,
        startDateTime: `${dateStr}T16:00:00`,
        endDateTime: `${dateStr}T23:00:00`,
        adults: 20,
        children: 5,
        toddlers: 0,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
      });

    expect([400, 409, 422, 500]).toContain(res.status);
  });
});
