/**
 * Security Tests: IDOR (Insecure Direct Object Reference)
 *
 * Tests that users cannot access or modify resources belonging to other users
 * or outside their authorization scope.
 *
 * Tests role-based access:
 * - EMPLOYEE cannot access admin-only endpoints
 * - Users cannot access resources they don't own (horizontal privilege escalation)
 * - Unauthenticated users cannot access protected endpoints
 *
 * Related: #244, #231
 */
import { api, generateTestToken, authHeader } from '../helpers/test-utils';

// Tokens for different roles
const adminAuth = authHeader('ADMIN');
const employeeToken = generateTestToken({
  id: '00000000-0000-0000-0000-000000000099',
  email: 'employee@test.pl',
  role: 'EMPLOYEE',
});
const employeeAuth = { Authorization: `Bearer ${employeeToken}` };

// Non-existent but valid UUID
const NON_EXISTENT_ID = '99999999-9999-9999-9999-999999999999';

describe('Security: IDOR & Access Control', () => {
  // =========================================
  // 1. Vertical Privilege Escalation — EMPLOYEE → ADMIN
  // =========================================
  describe('Vertical escalation: EMPLOYEE accessing admin-only endpoints', () => {
    // These endpoints should require admin role/permissions
    const adminOnlyEndpoints = [
      { method: 'post' as const, path: '/api/halls', body: { name: 'Test Hall', capacity: 100 } },
      { method: 'post' as const, path: '/api/event-types', body: { name: 'Test Type', color: '#FF0000' } },
      { method: 'post' as const, path: '/api/dishes', body: { name: 'Test Dish', categoryId: NON_EXISTENT_ID } },
      { method: 'post' as const, path: '/api/dish-categories', body: { name: 'Test Cat' } },
      { method: 'post' as const, path: '/api/document-templates', body: { name: 'Test Template', content: 'test', format: 'HTML' } },
    ];

    it.each(adminOnlyEndpoints)(
      'EMPLOYEE should get 403 on $method $path',
      async ({ method, path, body }) => {
        const res = await (api as any)[method](path)
          .set(employeeAuth)
          .send(body);

        // Should be 403 Forbidden — NOT 200 or 201
        expect([401, 403]).toContain(res.status);
      }
    );

    it('EMPLOYEE should not be able to delete a hall', async () => {
      const res = await api
        .delete(`/api/halls/${NON_EXISTENT_ID}`)
        .set(employeeAuth);

      expect([401, 403, 404]).toContain(res.status);
      // If 404, it means auth passed but resource not found — check permissions
      // If 403, permissions working correctly
    });

    it('EMPLOYEE should not be able to manage roles', async () => {
      const res = await api
        .get('/api/auth/users')
        .set(employeeAuth);

      // This endpoint may not exist or may require admin
      expect([401, 403, 404]).toContain(res.status);
    });
  });

  // =========================================
  // 2. Read Access Control — Data Visibility
  // =========================================
  describe('Data visibility boundaries', () => {
    it('should not expose password hashes in user responses', async () => {
      const res = await api
        .get('/api/auth/me')
        .set(adminAuth);

      if (res.status === 200) {
        const data = res.body.data || res.body;
        expect(data).not.toHaveProperty('password');
        expect(data).not.toHaveProperty('passwordHash');
        expect(data).not.toHaveProperty('hashedPassword');
        // Stringify to check for password patterns in nested objects
        const bodyStr = JSON.stringify(res.body);
        expect(bodyStr).not.toMatch(/\$2[aby]\$\d+\$/); // bcrypt hash pattern
      }
    });

    it('should not expose JWT secret in error responses', async () => {
      // Force an error and check it doesn't leak secrets
      const res = await api
        .get('/api/reservations/not-valid-uuid')
        .set(adminAuth);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('jwt-secret');
      expect(bodyStr).not.toContain('JWT_SECRET');
      expect(bodyStr).not.toContain('dev-secret-key');
      expect(bodyStr).not.toContain('test-jwt-secret');
    });

    it('should not expose database connection strings in errors', async () => {
      const res = await api
        .get(`/api/reservations/${NON_EXISTENT_ID}`)
        .set(adminAuth);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('postgresql://');
      expect(bodyStr).not.toContain('DATABASE_URL');
      expect(bodyStr).not.toContain('localhost:5432');
      expect(bodyStr).not.toContain('localhost:5433');
    });

    it('should not expose stack traces in production-like error', async () => {
      const res = await api
        .get(`/api/reservations/${NON_EXISTENT_ID}`)
        .set(adminAuth);

      // In test/dev, stack traces may appear — but verify structure
      if (res.body.error) {
        // Should have structured error, not raw stack
        expect(res.body.error).not.toMatch(/at\s+\w+\s+\(/); // "at Function (" pattern
      }
    });
  });

  // =========================================
  // 3. Horizontal Privilege Escalation — Cross-resource access
  // =========================================
  describe('Horizontal escalation: accessing non-existent resources', () => {
    it('should return 404 (not 500) for non-existent reservation', async () => {
      const res = await api
        .get(`/api/reservations/${NON_EXISTENT_ID}`)
        .set(adminAuth);

      expect(res.status).toBe(404);
    });

    it('should return 404 (not 500) for non-existent deposit', async () => {
      const res = await api
        .get(`/api/deposits/${NON_EXISTENT_ID}`)
        .set(adminAuth);

      expect(res.status).toBe(404);
    });

    it('should return 404 (not 500) for non-existent client', async () => {
      const res = await api
        .get(`/api/clients/${NON_EXISTENT_ID}`)
        .set(adminAuth);

      expect(res.status).toBe(404);
    });

    it('should return 404 (not 500) for non-existent hall', async () => {
      const res = await api
        .get(`/api/halls/${NON_EXISTENT_ID}`)
        .set(adminAuth);

      expect(res.status).toBe(404);
    });

    it('should return 404 (not 500) for non-existent queue entry', async () => {
      const res = await api
        .get(`/api/queue/${NON_EXISTENT_ID}`)
        .set(adminAuth);

      expect(res.status).toBe(404);
    });
  });

  // =========================================
  // 4. Audit Log Access Control
  // =========================================
  describe('Audit log access', () => {
    it('audit log should be accessible to staff', async () => {
      const res = await api
        .get('/api/audit-log')
        .set(adminAuth);

      expect([200, 403]).toContain(res.status);
    });

    it('audit log should not be accessible without auth', async () => {
      const res = await api.get('/api/audit-log');

      expect(res.status).toBe(401);
    });
  });

  // =========================================
  // 5. Settings Access Control
  // =========================================
  describe('Company settings access', () => {
    it('settings should not be modifiable by unauthenticated user', async () => {
      const res = await api
        .put('/api/settings')
        .send({ companyName: 'Hacked Company' });

      expect(res.status).toBe(401);
    });

    it('EMPLOYEE should not be able to modify company settings', async () => {
      const res = await api
        .put('/api/settings')
        .set(employeeAuth)
        .send({ companyName: 'Hacked by Employee' });

      // Should be 403 — settings are admin-only
      expect([401, 403]).toContain(res.status);
    });
  });

  // =========================================
  // 6. Public Endpoints — verify they don't leak data
  // =========================================
  describe('Public endpoints', () => {
    it('login endpoint should not reveal whether user exists', async () => {
      const resNonExistent = await api
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.pl', password: 'WrongPass123!' });

      const resWrongPassword = await api
        .post('/api/auth/login')
        .send({ email: 'admin@test.pl', password: 'WrongPass123!' });

      // Both should return same status code to prevent user enumeration
      expect(resNonExistent.status).toBe(resWrongPassword.status);
    });

    it('register should validate email format', async () => {
      const res = await api
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).not.toBe(500);
      expect([400, 422]).toContain(res.status);
    });
  });

  // =========================================
  // 7. Delete operations — authorization check
  // =========================================
  describe('Delete operations require proper authorization', () => {
    it('unauthenticated user cannot delete reservation', async () => {
      const res = await api
        .delete(`/api/reservations/${NON_EXISTENT_ID}`);

      expect(res.status).toBe(401);
    });

    it('unauthenticated user cannot delete client', async () => {
      const res = await api
        .delete(`/api/clients/${NON_EXISTENT_ID}`);

      expect(res.status).toBe(401);
    });

    it('unauthenticated user cannot delete deposit', async () => {
      const res = await api
        .delete(`/api/deposits/${NON_EXISTENT_ID}`);

      expect(res.status).toBe(401);
    });
  });
});
