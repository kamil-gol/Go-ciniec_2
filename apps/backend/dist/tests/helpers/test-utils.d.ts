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
import prismaTest from './prisma-test-client';
/**
 * Pre-configured Supertest agent for API testing.
 * Usage: const res = await api.get('/api/health');
 */
export declare const api: import("supertest/lib/agent")<supertest.SuperTestStatic.Test>;
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
 * Payload structure matches JwtPayload from @types/index.ts
 */
export declare function generateTestToken(user?: Partial<TestUser>): string;
/**
 * Generate an expired JWT token for testing 401 responses.
 */
export declare function generateExpiredToken(): string;
/**
 * Returns authorization header object.
 */
export declare function authHeader(role?: string): {
    Authorization: string;
};
/**
 * Generate auth header for a specific seeded user (uses real DB id).
 * Use this when the test needs req.user.id to match a real user in DB.
 */
export declare function authHeaderForUser(user: {
    id: string;
    email: string;
    role?: string;
}): {
    Authorization: string;
};
/**
 * Assert a successful JSON response.
 */
export declare function expectSuccess(res: supertest.Response, statusCode?: number): void;
/**
 * Assert an error JSON response.
 */
export declare function expectError(res: supertest.Response, statusCode: number): void;
/**
 * Create a test user directly in the database.
 * Field names match Prisma schema: firstName, lastName, legacyRole.
 */
export declare function createTestUser(overrides?: Record<string, any>): Promise<{
    password: string;
    id: string;
    email: string;
    roleId: string | null;
    firstName: string;
    lastName: string;
    legacyRole: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Create a test client directly in the database.
 * Field names match Prisma schema: firstName, lastName.
 */
export declare function createTestClient(overrides?: Record<string, any>): Promise<{
    id: string;
    email: string | null;
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    notes: string | null;
}>;
export { prismaTest };
//# sourceMappingURL=test-utils.d.ts.map