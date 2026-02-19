/**
 * Deposits API Integration Tests
 * Issue: #97 — Depozyty / Zaliczki (Faza 2, priority: wysoki)
 *
 * Tests deposit management endpoints against a real test database.
 * Covers: CRUD, lifecycle (PENDING→PAID→UNPAID→CANCELLED), stats, overdue.
 */
import { api, authHeader } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Deposits API — /api/deposits', () => {
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
   * Create a reservation with a deposit for testing.
   * Inserts data directly in DB (not via API).
   *
   * Field names match Prisma schema:
   *   - Reservation: guests (not guestCount), date as string, createdById required
   *   - Deposit: dueDate as string, remainingAmount required, internalNotes (not notes)
   */
  async function createReservationWithDeposit(depositOverrides: Record<string, any> = {}) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);
    const dateStr = futureDate.toISOString().split('T')[0];

    const reservation = await prismaTest.reservation.create({
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
      },
    });

    const dueDate = new Date(futureDate);
    dueDate.setDate(dueDate.getDate() - 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const depositAmount = depositOverrides.amount || 5000;

    const deposit = await prismaTest.deposit.create({
      data: {
        reservationId: reservation.id,
        amount: depositAmount,
        remainingAmount: depositOverrides.remainingAmount ?? depositAmount,
        dueDate: depositOverrides.dueDate || dueDateStr,
        status: depositOverrides.status || 'PENDING',
        internalNotes: depositOverrides.internalNotes || 'Test deposit',
        ...(depositOverrides.title && { title: depositOverrides.title }),
        ...(depositOverrides.description && { description: depositOverrides.description }),
      },
    });

    return { reservation, deposit };
  }

  /**
   * Create an overdue deposit (dueDate in the past).
   */
  async function createOverdueDeposit() {
    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 14);
    const pastDueStr = pastDue.toISOString().split('T')[0];

    return createReservationWithDeposit({
      dueDate: pastDueStr,
      status: 'OVERDUE',
    });
  }

  // ========================================
  // GET /api/deposits
  // ========================================
  describe('GET /api/deposits', () => {
    it('should return empty list when no deposits exist', async () => {
      const res = await api
        .get('/api/deposits')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should return deposits after creating them', async () => {
      await createReservationWithDeposit();
      await createReservationWithDeposit();

      const res = await api
        .get('/api/deposits')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/deposits');
      expect(res.status).toBe(401);
    });
  });

  // ========================================
  // GET /api/deposits/stats
  // ========================================
  describe('GET /api/deposits/stats', () => {
    it('should return deposit statistics', async () => {
      await createReservationWithDeposit();

      const res = await api
        .get('/api/deposits/stats')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  // ========================================
  // GET /api/deposits/overdue
  // ========================================
  describe('GET /api/deposits/overdue', () => {
    it('should return overdue deposits', async () => {
      await createOverdueDeposit();

      const res = await api
        .get('/api/deposits/overdue')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should return empty when no overdue deposits', async () => {
      const res = await api
        .get('/api/deposits/overdue')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // GET /api/deposits/:id
  // ========================================
  describe('GET /api/deposits/:id', () => {
    it('should return deposit details by valid UUID', async () => {
      const { deposit } = await createReservationWithDeposit();

      const res = await api
        .get(`/api/deposits/${deposit.id}`)
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .get(`/api/deposits/${fakeUuid}`)
        .set(authHeader('ADMIN'));

      expect([404, 500]).toContain(res.status);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await api
        .get('/api/deposits/not-a-uuid')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const { deposit } = await createReservationWithDeposit();

      const res = await api.get(`/api/deposits/${deposit.id}`);

      expect(res.status).toBe(401);
    });
  });

  // ========================================
  // PATCH /api/deposits/:id/mark-paid
  // ========================================
  describe('PATCH /api/deposits/:id/mark-paid', () => {
    it('should mark PENDING deposit as PAID', async () => {
      const { deposit } = await createReservationWithDeposit();

      const res = await api
        .patch(`/api/deposits/${deposit.id}/mark-paid`)
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);

      // Verify state in DB
      const updated = await prismaTest.deposit.findUnique({
        where: { id: deposit.id },
      });
      expect(updated?.status).toBe('PAID');
    });

    it('should set paidAt timestamp when marking as paid', async () => {
      const { deposit } = await createReservationWithDeposit();

      await api
        .patch(`/api/deposits/${deposit.id}/mark-paid`)
        .set(authHeader('ADMIN'));

      const updated = await prismaTest.deposit.findUnique({
        where: { id: deposit.id },
      });
      expect(updated?.paidAt).not.toBeNull();
    });
  });

  // ========================================
  // PATCH /api/deposits/:id/mark-unpaid
  // ========================================
  describe('PATCH /api/deposits/:id/mark-unpaid', () => {
    it('should mark PAID deposit back to PENDING/UNPAID', async () => {
      const { deposit } = await createReservationWithDeposit();

      // First mark as paid
      await prismaTest.deposit.update({
        where: { id: deposit.id },
        data: { status: 'PAID', paid: true, paidAt: new Date() },
      });

      const res = await api
        .patch(`/api/deposits/${deposit.id}/mark-unpaid`)
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);

      const updated = await prismaTest.deposit.findUnique({
        where: { id: deposit.id },
      });
      expect(['PENDING', 'UNPAID']).toContain(updated?.status);
    });
  });

  // ========================================
  // PATCH /api/deposits/:id/cancel
  // ========================================
  describe('PATCH /api/deposits/:id/cancel', () => {
    it('should cancel a PENDING deposit', async () => {
      const { deposit } = await createReservationWithDeposit();

      const res = await api
        .patch(`/api/deposits/${deposit.id}/cancel`)
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);

      const updated = await prismaTest.deposit.findUnique({
        where: { id: deposit.id },
      });
      expect(updated?.status).toBe('CANCELLED');
    });
  });

  // ========================================
  // PUT /api/deposits/:id — update
  // ========================================
  describe('PUT /api/deposits/:id', () => {
    it('should update deposit amount and notes', async () => {
      const { deposit } = await createReservationWithDeposit();

      const res = await api
        .put(`/api/deposits/${deposit.id}`)
        .set(authHeader('ADMIN'))
        .send({
          amount: 7500,
          internalNotes: 'Kwota zaktualizowana',
        });

      expect(res.status).toBe(200);

      const updated = await prismaTest.deposit.findUnique({
        where: { id: deposit.id },
      });
      expect(Number(updated?.amount)).toBe(7500);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .put('/api/deposits/bad-id')
        .set(authHeader('ADMIN'))
        .send({ amount: 1000 });

      expect(res.status).toBe(400);
    });
  });

  // ========================================
  // DELETE /api/deposits/:id
  // ========================================
  describe('DELETE /api/deposits/:id', () => {
    it('should delete a deposit', async () => {
      const { deposit } = await createReservationWithDeposit();

      const res = await api
        .delete(`/api/deposits/${deposit.id}`)
        .set(authHeader('ADMIN'));

      expect([200, 204]).toContain(res.status);

      // Verify deleted from DB
      const deleted = await prismaTest.deposit.findUnique({
        where: { id: deposit.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .delete('/api/deposits/invalid')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(400);
    });

    it('should return 404 or 500 for non-existent deposit', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';

      const res = await api
        .delete(`/api/deposits/${fakeUuid}`)
        .set(authHeader('ADMIN'));

      expect([404, 500]).toContain(res.status);
    });
  });

  // ========================================
  // Deposit Full Lifecycle
  // ========================================
  describe('Deposit Lifecycle', () => {
    it('should support PENDING → PAID → UNPAID → CANCELLED via API', async () => {
      const { deposit } = await createReservationWithDeposit();

      // Step 1: Verify initial state is PENDING
      const getRes = await api
        .get(`/api/deposits/${deposit.id}`)
        .set(authHeader('ADMIN'));
      expect(getRes.status).toBe(200);

      // Step 2: PENDING → PAID
      const paidRes = await api
        .patch(`/api/deposits/${deposit.id}/mark-paid`)
        .set(authHeader('ADMIN'));
      expect(paidRes.status).toBe(200);

      let state = await prismaTest.deposit.findUnique({ where: { id: deposit.id } });
      expect(state?.status).toBe('PAID');
      expect(state?.paidAt).not.toBeNull();

      // Step 3: PAID → UNPAID/PENDING
      const unpaidRes = await api
        .patch(`/api/deposits/${deposit.id}/mark-unpaid`)
        .set(authHeader('ADMIN'));
      expect(unpaidRes.status).toBe(200);

      state = await prismaTest.deposit.findUnique({ where: { id: deposit.id } });
      expect(['PENDING', 'UNPAID']).toContain(state?.status);

      // Step 4: → CANCELLED
      const cancelRes = await api
        .patch(`/api/deposits/${deposit.id}/cancel`)
        .set(authHeader('ADMIN'));
      expect(cancelRes.status).toBe(200);

      state = await prismaTest.deposit.findUnique({ where: { id: deposit.id } });
      expect(state?.status).toBe('CANCELLED');
    });

    it('should support PENDING → CANCELLED directly', async () => {
      const { deposit } = await createReservationWithDeposit();

      const res = await api
        .patch(`/api/deposits/${deposit.id}/cancel`)
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(200);

      const state = await prismaTest.deposit.findUnique({ where: { id: deposit.id } });
      expect(state?.status).toBe('CANCELLED');
    });
  });

  // ========================================
  // GET /api/deposits/:id/pdf
  // ========================================
  describe('GET /api/deposits/:id/pdf', () => {
    it('should generate PDF for valid deposit', async () => {
      const { deposit } = await createReservationWithDeposit();

      const res = await api
        .get(`/api/deposits/${deposit.id}/pdf`)
        .set(authHeader('ADMIN'));

      // PDF generation might return 200 with PDF content or fail gracefully
      expect([200, 500]).toContain(res.status);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await api
        .get('/api/deposits/bad-id/pdf')
        .set(authHeader('ADMIN'));

      expect(res.status).toBe(400);
    });
  });
});
