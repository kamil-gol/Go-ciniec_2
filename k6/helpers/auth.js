// k6/helpers/auth.js — Login helper for k6 tests
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../config.js';

const TEST_USER = {
  email: __ENV.TEST_USER_EMAIL || 'admin@test.com',
  password: __ENV.TEST_USER_PASSWORD || 'admin123',
};

let cachedToken = null;

/**
 * Authenticate and return JWT token.
 * Caches the token per VU so login is called once.
 */
export function login() {
  if (cachedToken) return cachedToken;

  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(TEST_USER),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'login status 200': (r) => r.status === 200,
    'login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !!body.token || !!body.accessToken;
      } catch {
        return false;
      }
    },
  });

  try {
    const body = JSON.parse(res.body);
    cachedToken = body.token || body.accessToken;
  } catch {
    cachedToken = null;
  }

  return cachedToken;
}

/**
 * Returns headers object with Authorization bearer token.
 */
export function getAuthHeaders() {
  const token = login();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
