/**
 * Security Tests: HTTP Headers & CORS
 *
 * Tests:
 * - Helmet.js security headers (X-Content-Type-Options, X-Frame-Options, etc.)
 * - CORS headers on cross-origin requests
 * - No server version disclosure
 * - Content-Security-Policy header
 *
 * Related: #244, #248
 */
import { api, authHeader } from '../helpers/test-utils';

const auth = authHeader('ADMIN');

// Use /api/health as a simple unauthenticated endpoint for header checks
const HEALTH_ENDPOINT = '/api/health';

describe('Security: HTTP Headers & CORS', () => {
  // =========================================
  // 1. Helmet.js Security Headers
  // =========================================
  describe('Helmet.js security headers', () => {
    it('should include X-Content-Type-Options: nosniff', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header to prevent clickjacking', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      // Helmet default is SAMEORIGIN; some configs use DENY
      const xFrameOptions = res.headers['x-frame-options'];
      expect(xFrameOptions).toBeDefined();
      expect(['DENY', 'SAMEORIGIN', 'deny', 'sameorigin']).toContain(
        xFrameOptions?.toUpperCase()
      );
    });

    it('should include X-DNS-Prefetch-Control header', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      // Helmet sets this to 'off' by default
      expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    });

    it('should include X-Download-Options header (IE protection)', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      // Helmet sets x-download-options: noopen
      expect(res.headers['x-download-options']).toBe('noopen');
    });

    it('should disable X-Powered-By header', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      // Helmet removes X-Powered-By by default
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('should include Strict-Transport-Security for HTTPS enforcement', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      // Helmet includes HSTS header
      const hsts = res.headers['strict-transport-security'];
      expect(hsts).toBeDefined();
      expect(hsts).toMatch(/max-age=/);
    });

    it('should include X-XSS-Protection or rely on CSP', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      // Modern Helmet (v5+) sets X-XSS-Protection: 0 (disables browser XSS filter
      // in favor of CSP) or omits it. Both are acceptable.
      const xssProtection = res.headers['x-xss-protection'];
      if (xssProtection !== undefined) {
        // If present, should be '0' (recommended) or '1; mode=block' (legacy)
        expect(['0', '1; mode=block']).toContain(xssProtection);
      }
    });

    it('should have security headers on authenticated endpoints too', async () => {
      const res = await api
        .get('/api/reservations')
        .set(auth);

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('should have security headers on 404 responses', async () => {
      const res = await api.get('/api/nonexistent-route-12345');

      expect(res.status).toBe(404);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  // =========================================
  // 2. CORS Headers
  // =========================================
  describe('CORS headers', () => {
    it('should block requests from unauthorized origins', async () => {
      const res = await api
        .get(HEALTH_ENDPOINT)
        .set('Origin', 'https://evil-site.com');

      // CORS middleware should not reflect back the unauthorized origin
      const allowOrigin = res.headers['access-control-allow-origin'];
      if (allowOrigin) {
        expect(allowOrigin).not.toBe('https://evil-site.com');
        expect(allowOrigin).not.toBe('*');
      }
    });

    it('should not use wildcard (*) for Access-Control-Allow-Origin', async () => {
      const res = await api
        .get(HEALTH_ENDPOINT)
        .set('Origin', 'http://localhost:3000');

      const allowOrigin = res.headers['access-control-allow-origin'];
      if (allowOrigin) {
        expect(allowOrigin).not.toBe('*');
      }
    });

    it('should include Access-Control-Allow-Credentials when origin is allowed', async () => {
      const res = await api
        .get(HEALTH_ENDPOINT)
        .set('Origin', 'http://localhost:3000');

      // If origin is allowed, credentials should be true
      if (res.headers['access-control-allow-origin']) {
        expect(res.headers['access-control-allow-credentials']).toBe('true');
      }
    });

    it('should handle preflight OPTIONS request', async () => {
      const res = await api
        .options(HEALTH_ENDPOINT)
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      // Should respond with 204 (No Content) or 200
      expect([200, 204]).toContain(res.status);
    });

    it('should restrict allowed methods in CORS', async () => {
      const res = await api
        .options(HEALTH_ENDPOINT)
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      const allowMethods = res.headers['access-control-allow-methods'];
      if (allowMethods) {
        // Should list specific methods, not just '*'
        expect(allowMethods).not.toBe('*');
      }
    });
  });

  // =========================================
  // 3. Server Version Disclosure
  // =========================================
  describe('No server version disclosure', () => {
    it('should not expose Express version via X-Powered-By', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('should not expose server software in Server header', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      const serverHeader = res.headers['server'];
      if (serverHeader) {
        // Should not contain version numbers
        expect(serverHeader).not.toMatch(/express/i);
        expect(serverHeader).not.toMatch(/\d+\.\d+/);
      }
    });

    it('should not leak server info in error responses', async () => {
      const res = await api.get('/api/nonexistent-route-12345');

      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/express/i);
      expect(body).not.toMatch(/node\.js/i);
      // Version patterns like "4.18.2"
      expect(body).not.toMatch(/\d+\.\d+\.\d+/);
    });
  });

  // =========================================
  // 4. Content-Security-Policy
  // =========================================
  describe('Content-Security-Policy', () => {
    it('should include Content-Security-Policy header', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      const csp = res.headers['content-security-policy'];
      expect(csp).toBeDefined();
    });

    it('should restrict default-src in CSP', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      const csp = res.headers['content-security-policy'];
      if (csp) {
        // Should contain some form of default-src restriction
        expect(csp).toMatch(/default-src/);
      }
    });

    it('should include CSP on all response types', async () => {
      // Check on 404 response
      const res404 = await api.get('/api/nonexistent-12345');
      expect(res404.headers['content-security-policy']).toBeDefined();

      // Check on authenticated endpoint
      const resAuth = await api
        .get('/api/reservations')
        .set(auth);
      expect(resAuth.headers['content-security-policy']).toBeDefined();
    });
  });

  // =========================================
  // 5. Content-Type Enforcement
  // =========================================
  describe('Content-Type enforcement', () => {
    it('should return JSON content type with charset on API responses', async () => {
      const res = await api.get(HEALTH_ENDPOINT);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return JSON content type on error responses', async () => {
      const res = await api.get('/api/nonexistent-12345');

      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
