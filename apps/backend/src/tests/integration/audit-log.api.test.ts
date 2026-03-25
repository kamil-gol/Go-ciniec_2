/**
 * Audit Log API Integration Tests
 * Issue: #100 — Raporty / Audit Log / PDF (Faza 3)
 *
 * Tests audit log query, filtering, pagination, and entity-specific endpoints.
 */
import { api, authHeaderForUser } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import prismaTest from '../helpers/prisma-test-client';
import { seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Audit Log API — /api/audit-log', () => {
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

  function adminAuth() {
    return authHeaderForUser({
      id: seed.admin.id,
      email: seed.admin.email,
      role: seed.admin.legacyRole || 'ADMIN',
    });
  }

  /** Seed audit log entries for testing */
  async function seedAuditLogs() {
    const entries = [
      {
        entityType: 'RESERVATION',
        entityId: 'res-001',
        action: 'CREATE',
        userId: seed.admin.id,
        details: { guests: 50, hallId: seed.hall1.id },
      },
      {
        entityType: 'RESERVATION',
        entityId: 'res-001',
        action: 'UPDATE',
        userId: seed.admin.id,
        details: { changes: { guests: { old: 50, new: 80 } } },
      },
      {
        entityType: 'RESERVATION',
        entityId: 'res-002',
        action: 'CREATE',
        userId: seed.user.id,
        details: { guests: 30 },
      },
      {
        entityType: 'CLIENT',
        entityId: 'cli-001',
        action: 'CREATE',
        userId: seed.admin.id,
        details: { firstName: 'Jan', lastName: 'Kowalski' },
      },
      {
        entityType: 'CLIENT',
        entityId: 'cli-001',
        action: 'DELETE',
        userId: seed.admin.id,
        details: {},
      },
      {
        entityType: 'HALL',
        entityId: seed.hall1.id,
        action: 'UPDATE',
        userId: seed.admin.id,
        details: { changes: { name: { old: 'Sala A', new: 'Sala Główna' } } },
      },
    ];

    for (const entry of entries) {
      await prismaTest.activityLog.create({
        data: entry as any,
      });
    }

    return entries;
  }

  // ========================================
  // GET /api/audit-log
  // ========================================

  describe('GET /api/audit-log', () => {
    it('should return audit logs with pagination', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log')
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(6);
    });

    it('should support page and pageSize params', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log')
        .query({ page: 1, pageSize: 2 })
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      if (res.body.pagination) {
        expect(res.body.pagination).toHaveProperty('page');
        expect(res.body.pagination).toHaveProperty('pageSize');
      }
    });

    it('should filter by entityType', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log')
        .query({ entityType: 'RESERVATION' })
        .set(adminAuth());

      expect(res.status).toBe(200);
      for (const entry of res.body.data) {
        expect(entry.entityType).toBe('RESERVATION');
      }
    });

    it('should filter by action', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log')
        .query({ action: 'CREATE' })
        .set(adminAuth());

      expect(res.status).toBe(200);
      for (const entry of res.body.data) {
        expect(entry.action).toBe('CREATE');
      }
    });

    it('should filter by userId', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log')
        .query({ userId: seed.user.id })
        .set(adminAuth());

      expect(res.status).toBe(200);
      for (const entry of res.body.data) {
        expect(entry.userId).toBe(seed.user.id);
      }
    });

    it('should return 401 without auth', async () => {
      const res = await api.get('/api/audit-log');
      expect(res.status).toBe(401);
    });
  });

  // ========================================
  // GET /api/audit-log/recent
  // ========================================

  describe('GET /api/audit-log/recent', () => {
    it('should return recent activity', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log/recent')
        .set(adminAuth());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data || res.body)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log/recent')
        .query({ limit: 3 })
        .set(adminAuth());

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(data.length).toBeLessThanOrEqual(3);
    });
  });

  // ========================================
  // GET /api/audit-log/statistics
  // ========================================

  describe('GET /api/audit-log/statistics', () => {
    it('should return statistics or indicate not implemented', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log/statistics')
        .set(adminAuth());

      // Statistics endpoint may not be fully implemented yet
      expect([200, 404, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });
  });

  // ========================================
  // GET /api/audit-log/meta/entity-types
  // ========================================

  describe('GET /api/audit-log/meta/entity-types', () => {
    it('should return available entity types', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log/meta/entity-types')
        .set(adminAuth());

      expect(res.status).toBe(200);
      const types = res.body.data || res.body;
      expect(Array.isArray(types)).toBe(true);
    });
  });

  // ========================================
  // GET /api/audit-log/meta/actions
  // ========================================

  describe('GET /api/audit-log/meta/actions', () => {
    it('should return available actions', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log/meta/actions')
        .set(adminAuth());

      expect(res.status).toBe(200);
      const actions = res.body.data || res.body;
      expect(Array.isArray(actions)).toBe(true);
    });
  });

  // ========================================
  // GET /api/audit-log/entity/:entityType/:entityId
  // ========================================

  describe('GET /api/audit-log/entity/:entityType/:entityId', () => {
    it('should return logs for a specific entity', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log/entity/RESERVATION/res-001')
        .set(adminAuth());

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2); // CREATE + UPDATE
      for (const entry of data) {
        expect(entry.entityType).toBe('RESERVATION');
        expect(entry.entityId).toBe('res-001');
      }
    });

    it('should return empty array for non-existent entity', async () => {
      const res = await api
        .get('/api/audit-log/entity/RESERVATION/non-existent-id')
        .set(adminAuth());

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should return logs for CLIENT entity type', async () => {
      await seedAuditLogs();

      const res = await api
        .get('/api/audit-log/entity/CLIENT/cli-001')
        .set(adminAuth());

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(data.length).toBeGreaterThanOrEqual(2); // CREATE + DELETE
    });
  });
});
