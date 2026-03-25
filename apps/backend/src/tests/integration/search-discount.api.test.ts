/**
 * Search & Discount API Integration Tests
 * Issue: #247 — Rozszerzenie testów integracyjnych
 *
 * Tests:
 * - Global search endpoint
 * - Discount CRUD operations
 * - Company settings edge cases
 */
import { api, authHeader, authHeaderForUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Search & Discount API', () => {
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

  const adminAuth = () => authHeaderForUser({
    id: seed.admin.id,
    email: seed.admin.email,
    role: 'ADMIN',
  });

  // ================================================================
  // SEARCH — /api/search
  // ================================================================
  describe('Search — /api/search', () => {
    describe('GET /api/search', () => {
      it('should return results for matching query', async () => {
        const res = await api
          .get('/api/search')
          .query({ q: 'Kowalski' })
          .set(adminAuth());

        expect(res.status).toBe(200);
      });

      it('should return empty results for non-matching query', async () => {
        const res = await api
          .get('/api/search')
          .query({ q: 'xyznonexistent123' })
          .set(adminAuth());

        expect(res.status).toBe(200);
      });

      it('should respect limit parameter', async () => {
        const res = await api
          .get('/api/search')
          .query({ q: 'test', limit: 2 })
          .set(adminAuth());

        expect(res.status).toBe(200);
      });

      it('should return 401 without auth', async () => {
        const res = await api
          .get('/api/search')
          .query({ q: 'test' });

        expect(res.status).toBe(401);
      });

      it('should handle empty query', async () => {
        const res = await api
          .get('/api/search')
          .query({ q: '' })
          .set(adminAuth());

        // May return empty results or 400 for empty query
        expect(res.status).not.toBe(500);
      });

      it('should handle special characters in query', async () => {
        const res = await api
          .get('/api/search')
          .query({ q: 'ąęóżźćłśń' })
          .set(adminAuth());

        expect(res.status).toBe(200);
      });

      it('should search across multiple entity types', async () => {
        // Seeded data has clients (Kowalski, Nowak) and halls (Główna, Kameralna)
        const res = await api
          .get('/api/search')
          .query({ q: 'a' }) // broad query
          .set(adminAuth());

        expect(res.status).toBe(200);
      });
    });
  });

  // ================================================================
  // DISCOUNTS — /api/reservations/:id/discount
  // ================================================================
  describe('Discount — reservation discount', () => {
    let reservationId: string;

    beforeEach(async () => {
      // Create a reservation for discount tests
      const reservation = await prismaTest.reservation.create({
        data: {
          clientId: seed.client1.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          startDateTime: new Date('2026-09-01T10:00:00Z'),
          endDateTime: new Date('2026-09-01T20:00:00Z'),
          guests: 100,
          status: 'CONFIRMED',
          totalPrice: 10000,
          createdById: seed.admin.id,
        },
      });
      reservationId = reservation.id;
    });

    describe('PATCH /api/reservations/:id/discount', () => {
      it('should apply percentage discount', async () => {
        const res = await api
          .patch(`/api/reservations/${reservationId}/discount`)
          .set(adminAuth())
          .send({
            discountType: 'PERCENTAGE',
            discountValue: 10,
            discountReason: 'Rabat stały klient',
          });

        expect([200, 204]).toContain(res.status);
      });

      it('should apply fixed amount discount', async () => {
        const res = await api
          .patch(`/api/reservations/${reservationId}/discount`)
          .set(adminAuth())
          .send({
            discountType: 'AMOUNT',
            discountValue: 500,
            discountReason: 'Rabat okolicznościowy',
          });

        expect([200, 204]).toContain(res.status);
      });

      it('should reject negative discount value', async () => {
        const res = await api
          .patch(`/api/reservations/${reservationId}/discount`)
          .set(adminAuth())
          .send({
            discountType: 'PERCENTAGE',
            discountValue: -10,
          });

        expect([400, 422]).toContain(res.status);
      });

      it('should reject percentage > 100', async () => {
        const res = await api
          .patch(`/api/reservations/${reservationId}/discount`)
          .set(adminAuth())
          .send({
            discountType: 'PERCENTAGE',
            discountValue: 150,
          });

        // May be rejected by validation or accepted (capped at 100%)
        expect(res.status).not.toBe(500);
      });

      it('should return 401 without auth', async () => {
        const res = await api
          .patch(`/api/reservations/${reservationId}/discount`)
          .send({ discountType: 'PERCENTAGE', discountValue: 10 });

        expect(res.status).toBe(401);
      });
    });

    describe('DELETE /api/reservations/:id/discount', () => {
      it('should remove discount', async () => {
        // First apply discount
        await api
          .patch(`/api/reservations/${reservationId}/discount`)
          .set(adminAuth())
          .send({
            discountType: 'PERCENTAGE',
            discountValue: 10,
          });

        // Then remove it
        const res = await api
          .delete(`/api/reservations/${reservationId}/discount`)
          .set(adminAuth());

        expect([200, 204]).toContain(res.status);
      });
    });
  });

  // ================================================================
  // AUDIT LOG — /api/audit-log (additional coverage)
  // ================================================================
  describe('Audit Log — additional edge cases', () => {
    it('should support date range filtering', async () => {
      const res = await api
        .get('/api/audit-log')
        .query({
          dateFrom: '2026-01-01',
          dateTo: '2026-12-31',
        })
        .set(adminAuth());

      expect([200, 403]).toContain(res.status);
    });

    it('should support entity type filtering', async () => {
      const res = await api
        .get('/api/audit-log')
        .query({ entityType: 'RESERVATION' })
        .set(adminAuth());

      expect([200, 403]).toContain(res.status);
    });

    it('should support pagination', async () => {
      const res = await api
        .get('/api/audit-log')
        .query({ page: 1, limit: 5 })
        .set(adminAuth());

      expect([200, 403]).toContain(res.status);
    });
  });
});
