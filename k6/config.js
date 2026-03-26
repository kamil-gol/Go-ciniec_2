// k6/config.js — Shared configuration for k6 performance tests
// Usage: import { BASE_URL, thresholds, buildUrl } from '../config.js';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// --- Thresholds ---
export const thresholds = {
  http_req_duration: ['p(95)<500'],   // 95% requests < 500ms
  http_req_failed: ['rate<0.01'],     // error rate < 1%
  http_reqs: ['rate>50'],             // throughput > 50 req/s
};

// --- Stage presets ---
export const stages = {
  smoke: [{ duration: '1s', target: 1 }],

  load: [
    { duration: '10s', target: 50 },  // ramp-up
    { duration: '30s', target: 50 },  // plateau
    { duration: '10s', target: 0 },   // ramp-down
  ],

  stress: [
    { duration: '10s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '10s', target: 0 },
  ],

  spike: [
    { duration: '1s', target: 100 },  // instant spike
    { duration: '10s', target: 100 }, // hold
    { duration: '5s', target: 0 },    // recovery
  ],
};

// --- URL helpers ---
export function buildUrl(path, params) {
  const url = `${BASE_URL}${path}`;
  if (!params) return url;

  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${url}?${qs}`;
}

// --- Endpoints ---
export const ENDPOINTS = {
  reservations: '/api/reservations',
  revenueReport: '/api/reports/revenue',
  occupancyReport: '/api/reports/occupancy',
  search: '/api/search',
  statsOverview: '/api/stats/overview',
  queue: '/api/queue',
  deposits: '/api/deposits',
  clients: '/api/clients',
};
