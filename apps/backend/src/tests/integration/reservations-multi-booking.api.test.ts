/**
 * Reservations Multi-Booking API Integration Tests
 * Issue: #165 — Multiple reservations per hall
 *
 * Safe to run on existing dev/prod database:
 * - Does NOT call cleanDatabase()
 * - Tracks created reservation IDs and deletes ONLY those in afterEach
 * - seedTestData() uses find-or-create — idempotent, no data loss
 * - Uses far-future dates (24-29 months) to avoid conflicts with existing data
 */
import { api, authHeaderForUser } from '../helpers/test-utils';
import { connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Reservations Multi-Booking — #165', () => {
  let seed: TestSeedData;
  let createdReservationIds: string[] = [];

  beforeAll(async () => {
    await connectTestDb();
    seed = await seedTestData();
  });

  afterEach(async () => {
    // Delete ONLY reservations created during this test — no other data touched
    if (createdReservationIds.length > 0) {
      await prismaTest.reservation.deleteMany({
        where: { id: { in: createdReservationIds } },
      });
      createdReservationIds = [];
    }
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  function adminAuth() {
    return authHeaderForUser({
      id: seed.admin.id,
      email: seed.admin.email,
      role: seed.admin.legacyRole || 'ADMIN',
    });
  }

  /**
   * Returns a date N months in the future.
   * Uses months 24-29 to avoid conflicts with existing dev data.
   */
  function futureDate(monthsAhead: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    d.setDate(15); // Fixed day to avoid month-end edge cases
    return d.toISOString().split('T')[0];
  }

  /** POST a reservation via API and track its ID for afterEach cleanup */
  async function postReservation(body: Record<string, any>): Promise<any> {
    const res = await api
      .post('/api/reservations')
      .set(adminAuth())
      .send(body);
    const id = res.body?.id ?? res.body?.data?.id;
    if (id) createdReservationIds.push(id);
    return res;
  }

  // ========================================
  // Scenario 1: First reservation on multi-booking hall succeeds
  // ========================================
  it('should allow creating a reservation on a multi-booking hall', async () => {
    const dateStr = futureDate(24);

    const res = await postReservation({
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
    const dateStr = futureDate(25);

    // First reservation: 100 guests
    await postReservation({
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
    const res = await postReservation({
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
    const dateStr = futureDate(26);

    // First reservation: 250 guests
    await postReservation({
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
    const res = await postReservation({
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
    const dateStr = futureDate(27);

    // Seed a confirmed reservation for 100 guests directly in DB
    const reservation = await prismaTest.reservation.create({
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
    createdReservationIds.push(reservation.id);

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
    const dateStr = futureDate(28);

    // First reservation: 250 guests (leaves only 50 free)
    const firstRes = await postReservation({
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
    const firstId = firstRes.body?.id ?? firstRes.body?.data?.id;

    // Cancel the first reservation
    if (firstId) {
      await api
        .patch(`/api/reservations/${firstId}/status`)
        .set(adminAuth())
        .send({ status: 'CANCELLED', reason: 'Test #165: freeing capacity' });
    }

    // Now 100-guest reservation should succeed (capacity fully freed)
    const res = await postReservation({
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
    const dateStr = futureDate(29);

    // First reservation on normal hall
    await postReservation({
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
    const res = await postReservation({
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
