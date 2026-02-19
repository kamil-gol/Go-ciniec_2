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

const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/rezerwacje_test',
    },
  },
  log: process.env.DEBUG_PRISMA ? ['query', 'error'] : ['error'],
});

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
export async function cleanDatabase(retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const tablenames = await prismaTest.$queryRaw<
        Array<{ tablename: string }>
      >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

      const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`);

      if (tables.length > 0) {
        await prismaTest.$executeRawUnsafe(
          `TRUNCATE TABLE ${tables.join(', ')} CASCADE;`
        );
      }
      return; // Success — exit retry loop
    } catch (error: any) {
      const isDeadlock = error?.code === 'P2010' ||
        error?.code === '40P01' ||
        error?.message?.includes('deadlock') ||
        error?.meta?.code === '40P01';

      if (isDeadlock && attempt < retries) {
        // Exponential backoff: 200ms, 400ms, ...
        await new Promise((r) => setTimeout(r, 200 * attempt));
        continue;
      }
      throw error; // Not a deadlock or out of retries
    }
  }
}

/**
 * Connect to test database.
 */
export async function connectTestDb(): Promise<void> {
  await prismaTest.$connect();
}

/**
 * Disconnect from test database.
 */
export async function disconnectTestDb(): Promise<void> {
  await prismaTest.$disconnect();
}

export default prismaTest;
