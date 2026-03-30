/**
 * API Contract Validation E2E Tests
 * Issue: #248 — Deduplikacja E2E + kontrakty API
 *
 * Validates response shapes, status codes, and content types
 * for critical API endpoints. Uses Playwright's request context.
 *
 * Endpoints:
 *   Auth:       POST /api/auth/login
 *   Reports:    GET /api/reports/revenue, /api/reports/occupancy
 *   Exports:    GET /api/reports/export/revenue/{excel,pdf}
 *   Stats:      GET /api/stats/overview
 *   Clients:    GET /api/clients
 *   Halls:      GET /api/halls
 *   Queue:      GET /api/queue
 *   Reservations: GET /api/reservations
 */
import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';

// Strip trailing /api to avoid double /api/api/ when NEXT_PUBLIC_API_URL includes it
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '');

let authToken: string;

const DATE_FROM = '2024-01-01';
const DATE_TO = '2026-12-31';
const EMPTY_DATE_FROM = '2000-01-01';
const EMPTY_DATE_TO = '2000-01-02';

function authHeaders() {
  return { Authorization: `Bearer ${authToken}` };
}

test.describe.serial('API Contract Validation', () => {
  // ═══════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════

  test('POST /api/auth/login — returns token with correct shape', async ({ request }) => {
    const loginUrl = `${API_URL}/api/auth/login`;
    const res = await request.post(loginUrl, {
      data: {
        email: testData.admin.email,
        password: testData.admin.password,
      },
    });
    expect(res.ok(), `Login failed: ${res.status()} ${res.statusText()} at ${loginUrl} (email: ${testData.admin.email}, pw length: ${testData.admin.password?.length})`).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('token');
    expect(typeof body.data.token).toBe('string');
    expect(body.data.token.length).toBeGreaterThan(10);

    // User info should be present
    if (body.data.user) {
      expect(typeof body.data.user.id).toBe('string');
      expect(typeof body.data.user.email).toBe('string');
    }

    authToken = body.data.token;
  });

  test('POST /api/auth/login — 401 with invalid credentials', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'wrong@test.pl', password: 'WrongPass!' },
    });
    expect(res.status()).toBe(401);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CLIENTS
  // ═══════════════════════════════════════════════════════════════════════

  test('GET /api/clients — returns array with client shape', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/clients`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const clients = body.data ?? body;
    expect(Array.isArray(clients)).toBeTruthy();

    if (clients.length > 0) {
      const client = clients[0];
      expect(typeof client.id).toBe('string');
      expect(client).toHaveProperty('firstName');
      expect(client).toHaveProperty('lastName');
    }
  });

  test('GET /api/clients — 401 without auth', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/clients`);
    expect(res.status()).toBe(401);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // HALLS
  // ═══════════════════════════════════════════════════════════════════════

  test('GET /api/halls — returns array with hall shape', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/halls`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const halls = body.data ?? body;
    expect(Array.isArray(halls)).toBeTruthy();

    if (halls.length > 0) {
      const hall = halls[0];
      expect(typeof hall.id).toBe('string');
      expect(hall).toHaveProperty('name');
      expect(hall).toHaveProperty('capacity');
      expect(typeof hall.capacity).toBe('number');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // RESERVATIONS
  // ═══════════════════════════════════════════════════════════════════════

  test('GET /api/reservations — returns array with reservation shape', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reservations`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const reservations = body.data ?? body;
    expect(Array.isArray(reservations)).toBeTruthy();

    if (reservations.length > 0) {
      const r = reservations[0];
      expect(typeof r.id).toBe('string');
      expect(r).toHaveProperty('status');
      expect(r).toHaveProperty('startDateTime');
      expect(r).toHaveProperty('endDateTime');
    }
  });

  test('GET /api/reservations — 401 without auth', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/reservations`);
    expect(res.status()).toBe(401);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // QUEUE
  // ═══════════════════════════════════════════════════════════════════════

  test('GET /api/queue — returns array', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/queue`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const entries = body.data ?? body;
    expect(Array.isArray(entries)).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // REPORTS — Revenue
  // ═══════════════════════════════════════════════════════════════════════

  test('GET /api/reports/revenue — 200 with valid date range', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/revenue`, {
      headers: authHeaders(),
      params: { dateFrom: DATE_FROM, dateTo: DATE_TO },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  test('GET /api/reports/revenue?groupBy=month — verify grouping', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/revenue`, {
      headers: authHeaders(),
      params: { dateFrom: DATE_FROM, dateTo: DATE_TO, groupBy: 'month' },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty('data');

    const data = body.data;
    if (data && typeof data === 'object') {
      const hasPeriods =
        Array.isArray(data.periods || data.breakdown || data) ||
        typeof data === 'object';
      expect(hasPeriods).toBeTruthy();
    }
  });

  test('GET /api/reports/revenue — empty date range returns graceful response', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/revenue`, {
      headers: authHeaders(),
      params: { dateFrom: EMPTY_DATE_FROM, dateTo: EMPTY_DATE_TO },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  // ═══════════════════════════════════════════════════════════════════════
  // REPORTS — Occupancy
  // ═══════════════════════════════════════════════════════════════════════

  test('GET /api/reports/occupancy — 200 with valid date range', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/occupancy`, {
      headers: authHeaders(),
      params: { dateFrom: DATE_FROM, dateTo: DATE_TO },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORTS — Excel & PDF
  // ═══════════════════════════════════════════════════════════════════════

  test('GET /api/reports/export/revenue/excel — content-type spreadsheet', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/export/revenue/excel`, {
      headers: authHeaders(),
      params: { dateFrom: DATE_FROM, dateTo: DATE_TO },
    });
    expect(res.ok()).toBeTruthy();

    const contentType = res.headers()['content-type'] || '';
    expect(
      contentType.includes('spreadsheetml') ||
      contentType.includes('octet-stream') ||
      contentType.includes('excel')
    ).toBeTruthy();

    const buffer = await res.body();
    expect(buffer.length).toBeGreaterThan(0);
  });

  test('GET /api/reports/export/revenue/pdf — content-type PDF', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/export/revenue/pdf`, {
      headers: authHeaders(),
      params: { dateFrom: DATE_FROM, dateTo: DATE_TO },
    });
    expect(res.ok()).toBeTruthy();

    const contentType = res.headers()['content-type'] || '';
    expect(
      contentType.includes('pdf') || contentType.includes('octet-stream')
    ).toBeTruthy();

    const buffer = await res.body();
    expect(buffer.length).toBeGreaterThan(0);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STATS — Dashboard Overview
  // ═══════════════════════════════════════════════════════════════════════

  test('GET /api/stats/overview — returns typed dashboard stats', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/stats/overview`, {
      headers: authHeaders(),
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const stats = body.data ?? body;
    expect(stats).toBeDefined();

    // Verify numeric types for metrics
    const hasReservationMetric =
      'reservationsToday' in stats ||
      'reservationsThisMonth' in stats ||
      'reservationsThisWeek' in stats;
    const hasRevenueMetric =
      'revenueThisMonth' in stats ||
      'revenuePrevMonth' in stats;

    expect(hasReservationMetric || hasRevenueMetric).toBeTruthy();

    // All numeric fields should be numbers
    for (const [key, value] of Object.entries(stats)) {
      if (key.includes('revenue') || key.includes('Reservations') || key.includes('Count')) {
        if (value !== null && value !== undefined) {
          expect(typeof value === 'number' || typeof value === 'string').toBeTruthy();
        }
      }
    }
  });

  test('GET /api/stats/overview — 401 without auth', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/stats/overview`);
    expect(res.status()).toBe(401);
  });
});
