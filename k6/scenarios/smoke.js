// k6/scenarios/smoke.js — Smoke test: 1 VU, all critical endpoints once
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getAuthHeaders } from '../helpers/auth.js';
import { buildUrl, ENDPOINTS } from '../config.js';

const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration', true);

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    errors: ['rate<0.1'],
    http_req_duration: ['p(95)<2000'], // smoke is lenient
  },
};

export default function () {
  const headers = getAuthHeaders();
  const params = { headers };

  group('Reservations', () => {
    const res = http.get(buildUrl(ENDPOINTS.reservations), params);
    check(res, { 'GET reservations 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('Revenue Report', () => {
    const res = http.get(
      buildUrl(ENDPOINTS.revenueReport, { dateFrom: '2024-01-01', dateTo: '2026-12-31' }),
      params,
    );
    check(res, { 'GET revenue report 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('Occupancy Report', () => {
    const res = http.get(
      buildUrl(ENDPOINTS.occupancyReport, { dateFrom: '2024-01-01', dateTo: '2026-12-31' }),
      params,
    );
    check(res, { 'GET occupancy report 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('Search', () => {
    const res = http.get(buildUrl(ENDPOINTS.search, { q: 'test' }), params);
    check(res, { 'GET search 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('Stats Overview', () => {
    const res = http.get(buildUrl(ENDPOINTS.statsOverview), params);
    check(res, { 'GET stats overview 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('Queue', () => {
    const res = http.get(buildUrl(ENDPOINTS.queue), params);
    check(res, { 'GET queue 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('Deposits', () => {
    const res = http.get(buildUrl(ENDPOINTS.deposits), params);
    check(res, { 'GET deposits 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('Clients', () => {
    const res = http.get(buildUrl(ENDPOINTS.clients), params);
    check(res, { 'GET clients 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });
}
