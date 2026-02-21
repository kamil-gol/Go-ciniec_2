/**
 * Prisma Test Client
 *
 * Provides an isolated Prisma client for integration tests
 * with automatic cleanup between tests.
 *
 * IMPORTANT: Integration tests run with --runInBand (single process,
 * serial execution). There is NO concurrency between suites, so
 * TRUNCATE ALL is safe — no other worker can interfere.
 *
 * Flow per test:
 *   beforeEach → cleanDatabase() → seedTestData() → test runs
 */
import { PrismaClient } from '@prisma/client';
declare const prismaTest: PrismaClient<{
    datasources: {
        db: {
            url: string;
        };
    };
    log: ("error" | "query")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
/**
 * Clean ALL tables in the test database.
 *
 * Truncates every public table except _prisma_migrations.
 * Safe because --runInBand guarantees no concurrent workers.
 * After cleanup, beforeEach calls seedTestData() to recreate
 * all necessary seed data (users, halls, event types, clients).
 *
 * Retries on deadlock (PostgreSQL 40P01) as a safety net.
 */
export declare function cleanDatabase(retries?: number): Promise<void>;
/**
 * Connect to test database.
 */
export declare function connectTestDb(): Promise<void>;
/**
 * Disconnect from test database.
 */
export declare function disconnectTestDb(): Promise<void>;
export default prismaTest;
//# sourceMappingURL=prisma-test-client.d.ts.map