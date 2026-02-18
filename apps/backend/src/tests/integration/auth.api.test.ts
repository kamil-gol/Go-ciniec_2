/**
 * Auth API Integration Tests
 * Issue: #96 — Autoryzacja i Uprawnienia (Faza 2, priority: critical)
 *
 * Tests authentication endpoints against a real test database.
 * Uses supertest + prisma-test-client infrastructure.
 */
import { api, authHeader, generateTestToken, generateExpiredToken } from '../helpers/test-utils';
import { cleanDatabase, connectTestDb, disconnectTestDb } from '../helpers/prisma-test-client';
import { seedUsersOnly, seedTestData, TestSeedData } from '../helpers/db-seed';

describe('Auth API — /api/auth', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectTestDb();
  });

  // ========================================
  // POST /api/auth/login
  // ========================================
  describe('POST /api/auth/login', () => {
    it('should return 200 + token for valid admin credentials', async () => {
      await seedUsersOnly();

      const res = await api
        .post('/api/auth/login')
        .send({ email: 'admin@test.pl', password: 'TestPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.length).toBeGreaterThan(10);
    });

    it('should return 200 + token for valid regular user credentials', async () => {
      await seedTestData();

      const res = await api
        .post('/api/auth/login')
        .send({ email: 'user@test.pl', password: 'TestPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for wrong password', async () => {
      await seedUsersOnly();

      const res = await api
        .post('/api/auth/login')
        .send({ email: 'admin@test.pl', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({ email: 'ghost@test.pl', password: 'AnyPassword123!' });

      expect(res.status).toBe(401);
    });

    it('should return 400 or 401 for missing email', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({ password: 'TestPassword123!' });

      expect([400, 401]).toContain(res.status);
    });

    it('should return 400 or 401 for missing password', async () => {
      const res = await api
        .post('/api/auth/login')
        .send({ email: 'admin@test.pl' });

      expect([400, 401]).toContain(res.status);
    });

    it('should return 401 or 403 for inactive/blocked account', async () => {
      const { admin } = await seedUsersOnly();
      // Deactivate directly in DB
      const prismaTest = (await import('../helpers/prisma-test-client')).default;
      await prismaTest.user.update({
        where: { id: admin.id },
        data: { isActive: false },
      });

      const res = await api
        .post('/api/auth/login')
        .send({ email: 'admin@test.pl', password: 'TestPassword123!' });

      expect([401, 403]).toContain(res.status);
    });

    it('should return JSON content-type', async () => {
      await seedUsersOnly();

      const res = await api
        .post('/api/auth/login')
        .send({ email: 'admin@test.pl', password: 'TestPassword123!' });

      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  // ========================================
  // POST /api/auth/register
  // ========================================
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await api.post('/api/auth/register').send({
        email: 'nowy.user@test.pl',
        password: 'StrongPassword123!',
        firstName: 'Nowy',
        lastName: 'Uzytkownik',
      });

      expect([200, 201]).toContain(res.status);
    });

    it('should reject duplicate email registration', async () => {
      await seedUsersOnly();

      const res = await api.post('/api/auth/register').send({
        email: 'admin@test.pl',
        password: 'StrongPassword123!',
        firstName: 'Duplikat',
        lastName: 'User',
      });

      expect([400, 409]).toContain(res.status);
    });

    it('should reject weak password', async () => {
      const res = await api.post('/api/auth/register').send({
        email: 'weak@test.pl',
        password: '123',
        firstName: 'Weak',
        lastName: 'Pass',
      });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject missing required fields', async () => {
      const res = await api.post('/api/auth/register').send({
        email: 'incomplete@test.pl',
      });

      expect([400, 422]).toContain(res.status);
    });
  });

  // ========================================
  // GET /api/auth/me
  // ========================================
  describe('GET /api/auth/me', () => {
    it('should return current user data with valid token', async () => {
      const seed = await seedTestData();
      const token = generateTestToken({
        id: seed.admin.id,
        email: seed.admin.email,
        role: seed.admin.role,
      });

      const res = await api
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 without any token', async () => {
      const res = await api.get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
      const res = await api
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${generateExpiredToken()}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 with malformed token', async () => {
      const res = await api
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.valid.jwt.token');

      expect(res.status).toBe(401);
    });

    it('should return 401 when Bearer prefix is missing', async () => {
      const res = await api
        .get('/api/auth/me')
        .set('Authorization', generateTestToken());

      expect(res.status).toBe(401);
    });

    it('should return correct user data for different roles', async () => {
      const seed = await seedTestData();

      // Test with regular user
      const userToken = generateTestToken({
        id: seed.user.id,
        email: seed.user.email,
        role: seed.user.role,
      });

      const res = await api
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ========================================
  // GET /api/auth/password-requirements
  // ========================================
  describe('GET /api/auth/password-requirements', () => {
    it('should return password requirements without auth', async () => {
      const res = await api.get('/api/auth/password-requirements');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  // ========================================
  // Authorization Matrix — protected endpoints
  // ========================================
  describe('Authorization Matrix', () => {
    const protectedGetEndpoints = [
      '/api/halls',
      '/api/clients',
      '/api/reservations',
      '/api/queue',
      '/api/deposits',
      '/api/stats',
      '/api/audit-log',
    ];

    it('should block all protected GET endpoints without token', async () => {
      for (const path of protectedGetEndpoints) {
        const res = await api.get(path);
        expect(res.status).toBe(401);
      }
    });

    it('should block all protected GET endpoints with expired token', async () => {
      for (const path of protectedGetEndpoints) {
        const res = await api
          .get(path)
          .set('Authorization', `Bearer ${generateExpiredToken()}`);
        expect(res.status).toBe(401);
      }
    });

    it('should allow ADMIN access to all protected endpoints', async () => {
      await seedTestData();

      for (const path of protectedGetEndpoints) {
        const res = await api.get(path).set(authHeader('ADMIN'));
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
      }
    });

    it('should deny READONLY user from admin-only queue operations', async () => {
      await seedTestData();

      const res = await api
        .post('/api/queue/rebuild-positions')
        .set(authHeader('READONLY'));

      expect([401, 403]).toContain(res.status);
    });

    it('should deny USER from admin-only queue rebuild', async () => {
      await seedTestData();

      const res = await api
        .post('/api/queue/rebuild-positions')
        .set(authHeader('USER'));

      expect(res.status).toBe(403);
    });
  });

  // ========================================
  // Health check (smoke test)
  // ========================================
  describe('GET /api/health', () => {
    it('should return 200 without auth', async () => {
      const res = await api.get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // ========================================
  // 404 handler
  // ========================================
  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await api.get('/api/nonexistent-route');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
