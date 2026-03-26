// k6/scenarios/spike.js — Spike test: 0 -> 100 VU instant, test recovery
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getAuthHeaders } from '../helpers/auth.js';
import { buildUrl, stages, ENDPOINTS } from '../config.js';

const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration', true);

export const options = {
  stages: stages.spike,
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // lenient — spike scenario
    http_req_failed: ['rate<0.15'],     // allow up to 15% errors during spike
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
  sleep(0.1);

  hit('Stats Overview', buildUrl(ENDPOINTS.statsOverview), params);
  sleep(0.1);

  hit('Queue', buildUrl(ENDPOINTS.queue), params);
  sleep(0.1);

  hit('Clients', buildUrl(ENDPOINTS.clients), params);
  sleep(0.2);
}
