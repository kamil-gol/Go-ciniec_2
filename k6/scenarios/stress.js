// k6/scenarios/stress.js — Stress test: ramp to 200 VU, find breaking points
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getAuthHeaders } from '../helpers/auth.js';
import { buildUrl, stages, ENDPOINTS } from '../config.js';

const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration', true);

export const options = {
  stages: stages.stress,
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // more lenient under stress
    http_req_failed: ['rate<0.10'],     // allow up to 10% errors
  },
};

function hit(name, url, params) {
  group(name, () => {
    const res = http.get(url, params);
    check(res, { [`${name} ok`]: (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });
}

export default function () {
  const headers = getAuthHeaders();
  const params = { headers };

  hit('Reservations', buildUrl(ENDPOINTS.reservations), params);
  sleep(0.2);

  hit('Revenue Report', buildUrl(ENDPOINTS.revenueReport, { dateFrom: '2024-01-01', dateTo: '2026-12-31' }), params);
  sleep(0.2);

  hit('Occupancy Report', buildUrl(ENDPOINTS.occupancyReport, { dateFrom: '2024-01-01', dateTo: '2026-12-31' }), params);
  sleep(0.2);

  hit('Search', buildUrl(ENDPOINTS.search, { q: 'test' }), params);
  sleep(0.2);

  hit('Stats Overview', buildUrl(ENDPOINTS.statsOverview), params);
  sleep(0.2);

  hit('Queue', buildUrl(ENDPOINTS.queue), params);
  sleep(0.2);

  hit('Deposits', buildUrl(ENDPOINTS.deposits), params);
  sleep(0.2);

  hit('Clients', buildUrl(ENDPOINTS.clients), params);
  sleep(0.3);
}
