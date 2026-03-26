// k6/scenarios/load.js — Load test: 50 VU, 30s plateau
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getAuthHeaders } from '../helpers/auth.js';
import { buildUrl, thresholds, stages, ENDPOINTS } from '../config.js';

const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration', true);

export const options = {
  stages: stages.load,
  thresholds,
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

  sleep(0.3);

  group('Stats Overview', () => {
    const res = http.get(buildUrl(ENDPOINTS.statsOverview), params);
    check(res, { 'GET stats overview 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.3);

  group('Queue', () => {
    const res = http.get(buildUrl(ENDPOINTS.queue), params);
    check(res, { 'GET queue 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.3);

  group('Clients', () => {
    const res = http.get(buildUrl(ENDPOINTS.clients), params);
    check(res, { 'GET clients 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);
}
