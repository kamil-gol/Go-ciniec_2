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

interface TestUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

/**
 * Generate a valid JWT token for testing.
 */
export function generateTestToken(user: Partial<TestUser> = {}): string {
  const payload = {
    id: user.id || 1,
    email: user.email || 'admin@test.pl',
    name: user.name || 'Test Admin',
    role: user.role || 'ADMIN',
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret-key-do-not-use-in-production', {
    expiresIn: '1h',
  });
}

/**
 * Generate an expired JWT token for testing 401 responses.
 */
export function generateExpiredToken(): string {
  return jwt.sign(
    { id: 1, email: 'expired@test.pl', role: 'ADMIN' },
    process.env.JWT_SECRET || 'test-secret-key-do-not-use-in-production',
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
 */
export async function createTestUser(overrides: Record<string, any> = {}) {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  return prismaTest.user.create({
    data: {
      email: `test-${Date.now()}@test.pl`,
      password: hashedPassword,
      name: 'Test User',
      role: 'ADMIN',
      isActive: true,
      ...overrides,
    },
  });
}

export { prismaTest };
