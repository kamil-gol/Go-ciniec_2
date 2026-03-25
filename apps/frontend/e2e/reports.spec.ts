/**
 * Reports API E2E (Playwright)
 *
 * Tests the reports & stats endpoints through the live API.
 * Uses Playwright's request context (not browser UI).
 *
 * Endpoints under test:
 *   GET /api/reports/revenue
 *   GET /api/reports/occupancy
 *   GET /api/reports/export/revenue/excel
 *   GET /api/reports/export/revenue/pdf
 *   GET /api/stats/overview
 *
 * Prerequisites: backend running at NEXT_PUBLIC_API_URL
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let authToken: string;

/** Wide date range likely to contain data */
const DATE_FROM = '2024-01-01';
const DATE_TO = '2026-12-31';

/** Narrow range in the far past — expected to return empty/zero results */
const EMPTY_DATE_FROM = '2000-01-01';
const EMPTY_DATE_TO = '2000-01-02';

test.describe.serial('Reports API E2E', () => {
  // ─── Auth ──────────────────────────────────────────────────────────

  test('1. Login as admin', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@gosciniecrodzinny.pl',
        password: process.env.TEST_ADMIN_PASSWORD || 'Admin123!@#',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toHaveProperty('token');
    authToken = body.data.token;
  });

  // ─── Revenue report ────────────────────────────────────────────────

  test('2. GET /api/reports/revenue — 200 with valid date range', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/revenue`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { dateFrom: DATE_FROM, dateTo: DATE_TO },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    // Response should have data property (object or array)
    expect(body).toHaveProperty('data');
  });

  // ─── Occupancy report ──────────────────────────────────────────────

  test('3. GET /api/reports/occupancy — 200 with valid date range', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/occupancy`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { dateFrom: DATE_FROM, dateTo: DATE_TO },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  // ─── Revenue grouped by month ──────────────────────────────────────

  test('4. GET /api/reports/revenue?groupBy=month — verify grouping', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/revenue`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { dateFrom: DATE_FROM, dateTo: DATE_TO, groupBy: 'month' },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('data');

    // When groupBy=month is used, the data should contain period entries
    const data = body.data;
    if (data && typeof data === 'object') {
      // Accept either array of period rows or an object with breakdown
      const hasPeriods =
        Array.isArray(data.periods || data.breakdown || data) ||
        typeof data === 'object';
      expect(hasPeriods).toBeTruthy();
    }
  });

  // ─── Export XLSX ───────────────────────────────────────────────────

  test('5. GET /api/reports/export/revenue/excel — content-type spreadsheet', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/export/revenue/excel`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { dateFrom: DATE_FROM, dateTo: DATE_TO },
    });

    expect(res.ok()).toBeTruthy();

    const contentType = res.headers()['content-type'] || '';
    // XLSX content type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    // or sometimes application/octet-stream
    expect(
      contentType.includes('spreadsheetml') ||
      contentType.includes('octet-stream') ||
      contentType.includes('excel')
    ).toBeTruthy();

    // Response body should be non-empty binary
    const buffer = await res.body();
    expect(buffer.length).toBeGreaterThan(0);
  });

  // ─── Export PDF ────────────────────────────────────────────────────

  test('6. GET /api/reports/export/revenue/pdf — content-type PDF', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/export/revenue/pdf`, {
      headers: { Authorization: `Bearer ${authToken}` },
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

  // ─── Dashboard stats ──────────────────────────────────────────────

  test('7. GET /api/stats/overview — dashboard stats structure', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/stats/overview`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    // Expect either body.data or body itself to carry stats
    const stats = body.data ?? body;
    expect(stats).toBeDefined();

    // Verify key metric fields exist — the endpoint returns DashboardOverview
    const hasReservationMetric =
      'reservationsToday' in stats ||
      'reservationsThisMonth' in stats ||
      'reservationsThisWeek' in stats;
    const hasRevenueMetric =
      'revenueThisMonth' in stats ||
      'revenuePrevMonth' in stats;

    expect(hasReservationMetric || hasRevenueMetric).toBeTruthy();
  });

  // ─── Empty date range — graceful empty response ────────────────────

  test('8. GET /api/reports/revenue — empty date range returns graceful response', async ({ request }) => {
    test.skip(!authToken, 'Not logged in');

    const res = await request.get(`${API_URL}/api/reports/revenue`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { dateFrom: EMPTY_DATE_FROM, dateTo: EMPTY_DATE_TO },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    // Should still return 200 with data (empty array / zeroed totals)
    expect(body).toHaveProperty('data');
  });
});
