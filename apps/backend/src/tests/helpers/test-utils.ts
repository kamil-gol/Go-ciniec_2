/**
 * Test Utilities
 * 
 * Provides helpers for integration testing with Supertest.
 * Uses the exported Express app from server.ts.
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

/**
 * JWT secret — MUST match the one used by auth middleware.
 * In test mode (NODE_ENV=test), auth.ts falls back to:
 * 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION'
 * But we set JWT_SECRET in integration-setup.ts, so use that.
 */
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-integration-tests';

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
 * Generate a valid JWT token for testing.
 */
export function generateTestToken(user: Partial<TestUser> = {}): string {
  const payload = {
    id: user.id || '00000000-0000-0000-0000-000000000001',
    email: user.email || 'admin@test.pl',
    role: user.role || 'ADMIN',
    ...(user.roleId && { roleId: user.roleId }),
    ...(user.roleSlug && { roleSlug: user.roleSlug }),
  };

  return jwt.sign(payload, TEST_JWT_SECRET, {
    expiresIn: '1h',
  });
}

/**
 * Generate an expired JWT token for testing 401 responses.
 */
export function generateExpiredToken(): string {
  return jwt.sign(
    { id: '00000000-0000-0000-0000-000000000001', email: 'expired@test.pl', role: 'ADMIN' },
    TEST_JWT_SECRET,
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
 * Returns auth header with a specific user ID (for createdById matching).
 */
export function authHeaderForUser(userId: string, role: string = 'ADMIN'): { Authorization: string } {
  return {
    Authorization: `Bearer ${generateTestToken({ id: userId, role })}`,
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
 * Field names match the Prisma schema:
 *   firstName, lastName, legacyRole (mapped to "role" column)
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
 */
export async function createTestClient(overrides: Record<string, any> = {}) {
  return prismaTest.client.create({
    data: {
      firstName: 'Test',
      lastName: 'Klient',
      phone: '+48123456789',
      email: `client-${Date.now()}@test.pl`,
      ...overrides,
    },
  });
}

/**
 * Create a test hall directly in the database.
 */
export async function createTestHall(overrides: Record<string, any> = {}) {
  return prismaTest.hall.create({
    data: {
      name: `Sala Testowa ${Date.now()}`,
      capacity: 100,
      isActive: true,
      ...overrides,
    },
  });
}

/**
 * Create a test event type directly in the database.
 */
export async function createTestEventType(overrides: Record<string, any> = {}) {
  return prismaTest.eventType.create({
    data: {
      name: `Typ ${Date.now()}`,
      isActive: true,
      ...overrides,
    },
  });
}

/**
 * Create a test reservation directly in the database.
 * Requires clientId and createdById at minimum.
 */
export async function createTestReservation(overrides: Record<string, any> = {}) {
  return prismaTest.reservation.create({
    data: {
      clientId: overrides.clientId,
      createdById: overrides.createdById,
      guests: 50,
      totalPrice: 5000,
      date: '2026-06-15',
      status: 'CONFIRMED',
      ...overrides,
    },
  });
}

export { prismaTest };
