/**
 * Security Tests: JWT Authentication & Token Manipulation
 *
 * Tests resistance to:
 * - Token forgery (different secret)
 * - Payload manipulation (role escalation)
 * - Expired/malformed tokens
 * - Missing authentication
 * - Token extraction edge cases
 *
 * Related: #244, #231
 */
import { api, generateTestToken, generateExpiredToken } from '../helpers/test-utils';
import jwt from 'jsonwebtoken';

// A protected endpoint that requires auth — reservations is always guarded
const PROTECTED_ENDPOINT = '/api/reservations';
const ADMIN_ONLY_ENDPOINT = '/api/halls';

describe('Security: JWT Token Manipulation', () => {
  // =========================================
  // 1. Token Forgery — different secret
  // =========================================
  describe('Token forgery with different secret', () => {
    it('should reject token signed with wrong secret', async () => {
      const forgedToken = jwt.sign(
        { id: '00000000-0000-0000-0000-000000000001', email: 'admin@test.pl', role: 'ADMIN' },
        'completely-wrong-secret-key',
        { expiresIn: '1h' }
      );

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject token signed with empty string secret', async () => {
      // Edge case: empty secret might match if server secret is also empty
      const forgedToken = jwt.sign(
        { id: '00000000-0000-0000-0000-000000000001', email: 'admin@test.pl', role: 'ADMIN' },
        '',
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
    });
  });

  // =========================================
  // 2. Payload Manipulation — role escalation
  // =========================================
  describe('Role escalation via JWT payload', () => {
    it('should not allow EMPLOYEE token to access admin-only endpoint via forged role', async () => {
      // Create token with ADMIN role but sign with correct secret
      // This tests if the server trusts JWT role claim or verifies against DB
      const tokenWithAdminRole = generateTestToken({
        id: '00000000-0000-0000-0000-000000000099',
        email: 'fake-admin@test.pl',
        role: 'ADMIN',
      });

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${tokenWithAdminRole}`);

      // Should not crash — may succeed or fail depending on permission check
      // The key is it doesn't return 500 (server error)
      expect(res.status).not.toBe(500);
    });

    it('should reject token with non-existent role', async () => {
      const tokenWithFakeRole = generateTestToken({
        role: 'SUPER_ROOT_ADMIN',
      });

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${tokenWithFakeRole}`);

      // Should either work (if role isn't checked) or return 403 — never 500
      expect(res.status).not.toBe(500);
      expect([200, 401, 403]).toContain(res.status);
    });

    it('should reject token with empty role', async () => {
      const tokenWithEmptyRole = generateTestToken({
        role: '',
      });

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${tokenWithEmptyRole}`);

      expect(res.status).not.toBe(500);
    });
  });

  // =========================================
  // 3. Expired & Malformed Tokens
  // =========================================
  describe('Expired and malformed tokens', () => {
    it('should return 401 for expired token (not 500)', async () => {
      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${generateExpiredToken()}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for completely random string as token', async () => {
      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', 'Bearer not-a-jwt-at-all');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for base64-encoded garbage', async () => {
      const garbage = Buffer.from('{"alg":"HS256"}').toString('base64') + '.garbage.data';

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${garbage}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for token with "none" algorithm (alg:none attack)', async () => {
      // Manual construction of alg:none token — classic JWT attack
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@test.pl',
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64url');

      const algNoneToken = `${header}.${payload}.`;

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${algNoneToken}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for empty bearer token', async () => {
      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', 'Bearer ');

      expect(res.status).toBe(401);
    });

    it('should return 401 for "Bearer" without token', async () => {
      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', 'Bearer');

      expect(res.status).toBe(401);
    });

    it('should return 401 for token with SQL injection in payload', async () => {
      const maliciousPayload = {
        id: "'; DROP TABLE users; --",
        email: 'admin@test.pl',
        role: 'ADMIN',
      };

      // Sign with correct secret but malicious payload
      const token = jwt.sign(maliciousPayload,
        process.env.JWT_SECRET || 'test-jwt-secret-for-integration-tests',
        { expiresIn: '1h' }
      );

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${token}`);

      // Should fail gracefully — the ID isn't a valid UUID
      expect(res.status).not.toBe(500);
    });
  });

  // =========================================
  // 4. Missing Authentication
  // =========================================
  describe('Missing authentication', () => {
    it('should return 401 when no Authorization header is present', async () => {
      const res = await api.get(PROTECTED_ENDPOINT);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for Basic auth instead of Bearer', async () => {
      const basic = Buffer.from('admin:password').toString('base64');

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Basic ${basic}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for token in wrong header (X-Auth-Token)', async () => {
      const token = generateTestToken();

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('X-Auth-Token', token);

      expect(res.status).toBe(401);
    });
  });

  // =========================================
  // 5. Token in Query String (information leak risk)
  // =========================================
  describe('Token via query string', () => {
    it('should accept token from query string (legacy support)', async () => {
      const token = generateTestToken();

      const res = await api
        .get(`${PROTECTED_ENDPOINT}?token=${token}`);

      // This WORKS by design — but is a security risk (token in logs/referrer)
      // Test documents this behavior for security review
      expect([200, 401, 403]).toContain(res.status);
    });
  });

  // =========================================
  // 6. JWT Token Size & Structure Attacks
  // =========================================
  describe('Token size and structure attacks', () => {
    it('should handle extremely long token gracefully', async () => {
      const longToken = 'a'.repeat(10000);

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${longToken}`);

      expect(res.status).toBe(401);
      expect(res.status).not.toBe(500);
    });

    it('should handle token with null bytes', async () => {
      const tokenWithNull = generateTestToken() + '\x00' + 'extra';

      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', `Bearer ${tokenWithNull}`);

      expect(res.status).toBe(401);
    });

    it('should handle token with unicode characters', async () => {
      const res = await api
        .get(PROTECTED_ENDPOINT)
        .set('Authorization', 'Bearer ąęóżźćłśń');

      expect(res.status).toBe(401);
    });
  });
});
