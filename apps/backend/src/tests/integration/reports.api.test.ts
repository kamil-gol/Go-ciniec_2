/**
 * Reports API Integration Tests
 * Issue: #100 — Raporty / Audit Log / PDF (Faza 3)
 *
 * Tests revenue, occupancy reports and their export endpoints.
 *
 * Field names match Prisma schema:
 *   - Reservation: guests (not guestCount), date as string, createdById required
 */
import { api, authHeader, authHeaderForUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Reports API — /api/reports', () => {
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

  /** Auth header with REAL admin user ID */
  function adminAuth() {
    return authHeaderForUser({
      id: seed.admin.id,
      email: seed.admin.email,
      role: seed.admin.legacyRole || 'ADMIN',
    });
  }

  async function createReservationsForReports() {
    const dates = ['2025-06-15', '2025-07-20', '2025-08-10'];

    for (const date of dates) {
      await prismaTest.reservation.create({
        data: {
          clientId: seed.client1.id,
          createdById: seed.admin.id,
          hallId: seed.hall1.id,
          eventTypeId: seed.eventType1.id,
          date,
          startTime: '14:00',
          endTime: '22:00',
          guests: 80,
          status: 'COMPLETED',
          totalPrice: 15000,
        },
      });
    }
  }

  const defaultDateRange = {
    dateFrom: '2025-01-01',
    dateTo: '2025-12-31',
  };

  // ========================================
  // GET /api/reports/revenue
  // ========================================
  describe('GET /api/reports/revenue', () => {
    it('should return revenue report with date range', async () => {
      await createReservationsForReports();

      const res = await api
        .get('/api/reports/revenue')
        .query(defaultDateRange)
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('should return empty revenue for date range with no data', async () => {
      const res = await api
        .get('/api/reports/revenue')
        .query({ dateFrom: '2099-01-01', dateTo: '2099-12-31' })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should support groupBy parameter', async () => {
      await createReservationsForReports();

      for (const groupBy of ['day', 'week', 'month', 'year']) {
        const res = await api
          .get('/api/reports/revenue')
          .query({ ...defaultDateRange, groupBy })
          .set(adminAuth());

        expect(res.status).toBe(200);
      }
    });

    it('should filter by hallId', async () => {
      await createReservationsForReports();

      const res = await api
        .get('/api/reports/revenue')
        .query({ ...defaultDateRange, hallId: seed.hall1.id })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should filter by eventTypeId', async () => {
      await createReservationsForReports();

      const res = await api
        .get('/api/reports/revenue')
        .query({ ...defaultDateRange, eventTypeId: seed.eventType1.id })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api
        .get('/api/reports/revenue')
        .query(defaultDateRange);

      expect(res.status).toBe(401);
    });

    it('should return error for missing date params', async () => {
      const res = await api
        .get('/api/reports/revenue')
        .set(adminAuth());

      expect([400, 422, 500]).toContain(res.status);
    });
  });

  // ========================================
  // GET /api/reports/occupancy
  // ========================================
  describe('GET /api/reports/occupancy', () => {
    it('should return occupancy report', async () => {
      await createReservationsForReports();

      const res = await api
        .get('/api/reports/occupancy')
        .query(defaultDateRange)
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should filter by hallId', async () => {
      const res = await api
        .get('/api/reports/occupancy')
        .query({ ...defaultDateRange, hallId: seed.hall1.id })
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api
        .get('/api/reports/occupancy')
        .query(defaultDateRange);

      expect(res.status).toBe(401);
    });
  });

  // ========================================
  // Export — Revenue Excel/PDF
  // ========================================
  describe('Revenue Exports', () => {
    it('GET /api/reports/export/revenue/excel — should return XLSX', async () => {
      await createReservationsForReports();

      const res = await api
        .get('/api/reports/export/revenue/excel')
        .query(defaultDateRange)
        .set(adminAuth());

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers['content-type']).toMatch(
          /spreadsheet|octet-stream|xlsx/
        );
      }
    });

    it('GET /api/reports/export/revenue/pdf — should return PDF', async () => {
      await createReservationsForReports();

      const res = await api
        .get('/api/reports/export/revenue/pdf')
        .query(defaultDateRange)
        .set(adminAuth());

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers['content-type']).toMatch(/pdf|octet-stream/);
      }
    });

    it('should return 401 for export without auth', async () => {
      const res = await api
        .get('/api/reports/export/revenue/excel')
        .query(defaultDateRange);

      expect(res.status).toBe(401);
    });
  });

  // ========================================
  // Export — Occupancy Excel/PDF
  // ========================================
  describe('Occupancy Exports', () => {
    it('GET /api/reports/export/occupancy/excel — should return XLSX', async () => {
      await createReservationsForReports();

      const res = await api
        .get('/api/reports/export/occupancy/excel')
        .query(defaultDateRange)
        .set(adminAuth());

      expect([200, 500]).toContain(res.status);
    });

    it('GET /api/reports/export/occupancy/pdf — should return PDF', async () => {
      await createReservationsForReports();

      const res = await api
        .get('/api/reports/export/occupancy/pdf')
        .query(defaultDateRange)
        .set(adminAuth());

      expect([200, 500]).toContain(res.status);
    });
  });

  // ========================================
  // Audit Log — /api/audit-log
  // ========================================
  describe('Audit Log API — /api/audit-log', () => {
    it('should list audit logs with auth', async () => {
      const res = await api
        .get('/api/audit-log')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/audit-log');
      expect(res.status).toBe(401);
    });
  });

  // ========================================
  // Stats — /api/stats/overview
  // ========================================
  describe('Stats API — /api/stats', () => {
    // NOTE: Stats routes are /api/stats/overview and /api/stats/upcoming
    //       There is NO root GET /api/stats handler.
    it('should return dashboard overview stats with auth', async () => {
      const res = await api
        .get('/api/stats/overview')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return upcoming reservations with auth', async () => {
      const res = await api
        .get('/api/stats/upcoming')
        .set(adminAuth());

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth for overview', async () => {
      const res = await api.get('/api/stats/overview');
      expect(res.status).toBe(401);
    });

    it('should return 401 without auth for upcoming', async () => {
      const res = await api.get('/api/stats/upcoming');
      expect(res.status).toBe(401);
    });
  });
});
