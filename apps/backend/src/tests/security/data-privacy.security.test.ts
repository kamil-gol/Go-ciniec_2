/**
 * Security Tests: Data Privacy & Information Leakage
 *
 * Tests:
 * - Error responses never contain stack traces in production mode
 * - Error responses never contain database connection strings
 * - Password fields never returned in user responses
 * - JWT secret never leaked in responses
 * - Audit log entries cannot be modified via API
 * - Archive data not accessible without proper auth
 *
 * Related: #244, #248
 */
import { api, generateTestToken, authHeader } from '../helpers/test-utils';

const auth = authHeader('ADMIN');

describe('Security: Data Privacy & Information Leakage', () => {
  // =========================================
  // 1. No Stack Traces in Error Responses
  // =========================================
  describe('Error responses never contain stack traces (production-like)', () => {
    it('should not include stack trace in 404 response', async () => {
      const res = await api.get('/api/nonexistent-endpoint-xyz');

      expect(res.status).toBe(404);
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('at Function');
      expect(body).not.toContain('at Module');
      expect(body).not.toContain('at Object');
      expect(body).not.toContain('.js:');
      expect(body).not.toContain('.ts:');
    });

    it('should not include file paths in validation error response', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .send({});

      const body = JSON.stringify(res.body);
      // Should not contain absolute file paths
      expect(body).not.toMatch(/\/Users\//);
      expect(body).not.toMatch(/\/home\//);
      expect(body).not.toMatch(/C:\\/);
      expect(body).not.toMatch(/node_modules/);
    });

    it('should not include internal function names in error responses', async () => {
      // Trigger an error by sending invalid data to a protected endpoint
      const res = await api
        .get('/api/reservations/not-a-valid-uuid')
        .set(auth);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('at Layer.handle');
      expect(body).not.toContain('at Router');
      expect(body).not.toContain('at next');
    });
  });

  // =========================================
  // 2. No Database Connection Strings
  // =========================================
  describe('Error responses never contain database connection strings', () => {
    it('should not leak DB connection info in error responses', async () => {
      // Trigger errors with various invalid inputs
      const res = await api
        .post('/api/clients')
        .set(auth)
        .send({
          firstName: 'Test',
          lastName: 'Privacy',
          phone: '+48123456789',
          // Send an ID that might cause a DB error
          id: 'invalid-will-cause-error',
        });

      const body = JSON.stringify(res.body).toLowerCase();
      expect(body).not.toContain('postgresql://');
      expect(body).not.toContain('postgres://');
      expect(body).not.toContain('mysql://');
      expect(body).not.toContain('mongodb://');
      expect(body).not.toContain('redis://');
      expect(body).not.toContain('database_url');
    });

    it('should not leak Prisma internal details in error responses', async () => {
      // Try to create with duplicate or invalid data
      const res = await api
        .put('/api/reservations/00000000-0000-0000-0000-000000000999')
        .set(auth)
        .send({
          guestCount: -1,
          startDateTime: 'not-a-date',
        });

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('prisma');
      expect(body).not.toContain('PrismaClient');
      expect(body).not.toMatch(/invocation:[\s\S]*prisma/i);
    });
  });

  // =========================================
  // 3. Password Fields Never Returned
  // =========================================
  describe('Password fields never returned in user responses', () => {
    it('should not include password in user list from settings', async () => {
      const res = await api
        .get('/api/settings/users')
        .set(auth);

      if (res.status === 200 && res.body.data) {
        const body = JSON.stringify(res.body);
        expect(body).not.toContain('"password"');
        expect(body).not.toContain('"hashedPassword"');
        expect(body).not.toMatch(/\$2[aby]\$/); // bcrypt hash pattern
      }
    });

    it('should not include password hash in login response', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.pl',
          password: 'SomePassword123!',
        });

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('"password"');
      expect(body).not.toContain('"hashedPassword"');
      expect(body).not.toMatch(/\$2[aby]\$/);
    });

    it('should not include password in auth error responses', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({
          email: 'admin@test.pl',
          password: 'WrongPassword123!',
        });

      const body = JSON.stringify(res.body);
      // Should not echo back the attempted password
      expect(body).not.toContain('WrongPassword123!');
      expect(body).not.toContain('"password"');
    });
  });

  // =========================================
  // 4. JWT Secret Never Leaked
  // =========================================
  describe('JWT secret never leaked in responses', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';

    it('should not expose JWT secret in error responses', async () => {
      // Send an invalid token to trigger auth error
      const res = await api
        .get('/api/reservations')
        .set('Authorization', 'Bearer invalid-token');

      const body = JSON.stringify(res.body);
      expect(body).not.toContain(JWT_SECRET);
      expect(body).not.toContain('JWT_SECRET');
      expect(body).not.toContain('secret');
    });

    it('should not expose JWT secret in health check', async () => {
      const res = await api.get('/api/health');

      const body = JSON.stringify(res.body);
      expect(body).not.toContain(JWT_SECRET);
      expect(body).not.toContain('JWT_SECRET');
    });

    it('should not expose environment variables in any error response', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({}); // empty body should cause validation error

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('process.env');
      expect(body).not.toContain('DATABASE_URL');
      expect(body).not.toContain('JWT_SECRET');
      expect(body).not.toContain('CORS_ORIGIN');
    });
  });

  // =========================================
  // 5. Audit Log Immutability
  // =========================================
  describe('Audit log entries cannot be modified via API', () => {
    it('should not support PUT on audit log endpoint', async () => {
      const res = await api
        .put('/api/audit-log')
        .set(auth)
        .send({ action: 'MODIFIED', entityType: 'HACKED' });

      // Should be 404 (no PUT route defined) or 405 (Method Not Allowed)
      expect([404, 405]).toContain(res.status);
    });

    it('should not support PATCH on audit log endpoint', async () => {
      const res = await api
        .patch('/api/audit-log')
        .set(auth)
        .send({ action: 'MODIFIED' });

      expect([404, 405]).toContain(res.status);
    });

    it('should not support DELETE on audit log endpoint', async () => {
      const res = await api
        .delete('/api/audit-log')
        .set(auth);

      expect([404, 405]).toContain(res.status);
    });

    it('should not support POST on audit log endpoint (no manual creation)', async () => {
      const res = await api
        .post('/api/audit-log')
        .set(auth)
        .send({
          action: 'FAKE_ACTION',
          entityType: 'INJECTED',
          entityId: '00000000-0000-0000-0000-000000000001',
          details: { injected: true },
        });

      // Should be 404 — no POST route on audit-log
      expect([404, 405]).toContain(res.status);
    });

    it('should not allow modifying individual audit log entries', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000001';

      const res = await api
        .put(`/api/audit-log/${fakeId}`)
        .set(auth)
        .send({ action: 'HACKED' });

      expect([404, 405]).toContain(res.status);
    });

    it('should not allow deleting individual audit log entries', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000001';

      const res = await api
        .delete(`/api/audit-log/${fakeId}`)
        .set(auth);

      expect([404, 405]).toContain(res.status);
    });
  });

  // =========================================
  // 6. Archive Data Access Control
  // =========================================
  describe('Archive data not accessible without proper auth', () => {
    it('should require authentication for archive settings', async () => {
      const res = await api.get('/api/settings/archive');

      expect(res.status).toBe(401);
    });

    it('should require authentication for archive run-now', async () => {
      const res = await api.post('/api/settings/archive/run-now');

      expect(res.status).toBe(401);
    });

    it('should require authentication for archive settings update', async () => {
      const res = await api
        .put('/api/settings/archive')
        .send({ archiveAfterDays: 1 });

      expect(res.status).toBe(401);
    });

    it('should reject expired token for archive endpoints', async () => {
      const { generateExpiredToken } = await import('../helpers/test-utils');
      const expiredToken = generateExpiredToken();

      const res = await api
        .get('/api/settings/archive')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('should not expose archive data in error responses', async () => {
      // Try accessing with no auth — error should not leak archive info
      const res = await api.get('/api/settings/archive');

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('archiveAfterDays');
      expect(body).not.toContain('archivedTotalCount');
      expect(body).not.toContain('cutoffDate');
    });
  });

  // =========================================
  // 7. Sensitive Data in Query Parameters
  // =========================================
  describe('Sensitive data handling in query parameters', () => {
    it('should not expose user data in URL-based endpoints', async () => {
      const res = await api
        .get('/api/settings/users')
        .set(auth);

      if (res.status === 200) {
        // Verify no password data in the response
        const body = JSON.stringify(res.body);
        expect(body).not.toContain('"password"');
        expect(body).not.toMatch(/\$2[aby]\$/);
      }
    });

    it('should not leak tokens in error messages', async () => {
      const token = generateTestToken();

      const res = await api
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain(token);
    });
  });
});
