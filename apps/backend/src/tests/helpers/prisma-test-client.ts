/**
 * Prisma Test Client
 *
 * Provides an isolated Prisma client for integration tests
 * with automatic cleanup between tests.
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
 * Tables containing seed data (users, halls, clients, event types).
 * These are preserved during beforeEach cleanup to prevent FK violations
 * when test helpers reference seed.admin.id, seed.client1.id, etc.
 *
 * Seed data is created once in beforeAll via seedTestData() (find-or-create)
 * and must persist across all tests in the suite.
 */
const SEED_TABLES = ['User', 'Client', 'Hall', 'EventType'];

/**
 * Clean transactional tables in the test database.
 * Preserves seed tables (User, Client, Hall, EventType) so that
 * seed data from beforeAll → seedTestData() survives between tests.
 *
 * Uses TRUNCATE CASCADE for fast cleanup.
 * Retries on deadlock (PostgreSQL 40P01).
 */
export async function cleanDatabase(retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const tablenames = await prismaTest.$queryRaw<
        Array<{ tablename: string }>
      >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

      const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations' && !SEED_TABLES.includes(name))
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
 * Full cleanup including seed tables.
 * Use in afterAll when you want to leave the DB completely clean.
 */
export async function cleanDatabaseFull(retries = 3): Promise<void> {
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
      return;
    } catch (error: any) {
      const isDeadlock = error?.code === 'P2010' ||
        error?.code === '40P01' ||
        error?.message?.includes('deadlock') ||
        error?.meta?.code === '40P01';

      if (isDeadlock && attempt < retries) {
        await new Promise((r) => setTimeout(r, 200 * attempt));
        continue;
      }
      throw error;
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
