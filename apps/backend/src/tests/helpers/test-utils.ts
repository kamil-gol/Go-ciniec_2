/**
 * Test Utilities
 *
 * Provides helpers for integration testing with Supertest.
 * Uses the exported Express app from server.ts.
 *
 * IMPORTANT: JWT secret MUST match auth middleware fallback.
 * integration-setup.ts sets process.env.JWT_SECRET before this loads.
 */
import supertest from 'supertest';
import app from '@/server';
import prismaTest from './prisma-test-client';
import jwt from 'jsonwebtoken';

// ========================================
// Supertest App Instance
// ========================================

/**
 * Pre-configured Supertest agent for API testing.
 * Usage: const res = await api.get('/api/health');
 */
export const api = supertest(app);

// ========================================
// Auth Helpers
// ========================================

interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleId?: string;
  roleSlug?: string;
}

/**
 * Get JWT secret — must match auth middleware.
 * Auth middleware uses: process.env.JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION'
 * integration-setup.ts sets JWT_SECRET before modules load.
 */
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION';
}

/**
 * Generate a valid JWT token for testing.
 * Payload structure matches JwtPayload from @types/index.ts
 */
export function generateTestToken(user: Partial<TestUser> = {}): string {
  const payload = {
    id: user.id || '00000000-0000-0000-0000-000000000001',
    email: user.email || 'admin@test.pl',
    role: user.role || 'ADMIN',
    ...(user.roleId && { roleId: user.roleId }),
    ...(user.roleSlug && { roleSlug: user.roleSlug }),
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '1h',
  });
}

/**
 * Generate an expired JWT token for testing 401 responses.
 */
export function generateExpiredToken(): string {
  return jwt.sign(
    { id: '00000000-0000-0000-0000-000000000001', email: 'expired@test.pl', role: 'ADMIN' },
    getJwtSecret(),
    { expiresIn: '-1h' }
  );
}

/**
 * Returns authorization header object.
 */
export function authHeader(role: string = 'ADMIN'): { Authorization: string } {
  return {
    Authorization: `Bearer ${generateTestToken({ role })}`,
  };
}

/**
 * Generate auth header for a specific seeded user (uses real DB id).
 * Use this when the test needs req.user.id to match a real user in DB.
 */
export function authHeaderForUser(user: { id: string; email: string; role?: string }): { Authorization: string } {
  return {
    Authorization: `Bearer ${generateTestToken({
      id: user.id,
      email: user.email,
      role: user.role || 'ADMIN',
    })}`,
  };
}

// ========================================
// Response Assertions
// ========================================

/**
 * Assert a successful JSON response.
 */
export function expectSuccess(res: supertest.Response, statusCode: number = 200): void {
  expect(res.status).toBe(statusCode);
  expect(res.headers['content-type']).toMatch(/json/);
}

/**
 * Assert an error JSON response.
 */
export function expectError(res: supertest.Response, statusCode: number): void {
  expect(res.status).toBe(statusCode);
  expect(res.body).toHaveProperty('success', false);
}

// ========================================
// Database Helpers
// ========================================

/**
 * Create a test user directly in the database.
 * Field names match Prisma schema: firstName, lastName, legacyRole.
 */
export async function createTestUser(overrides: Record<string, any> = {}) {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  return prismaTest.user.create({
    data: {
      email: `test-${Date.now()}@test.pl`,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      legacyRole: 'ADMIN',
      isActive: true,
      ...overrides,
    },
  });
}

/**
 * Create a test client directly in the database.
 * Field names match Prisma schema: firstName, lastName.
 */
export async function createTestClient(overrides: Record<string, any> = {}) {
  return prismaTest.client.create({
    data: {
      firstName: 'Test',
      lastName: 'Client',
      phone: '+48000000000',
      ...overrides,
    },
  });
}

export { prismaTest };
