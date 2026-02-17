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
 * Clean all tables in the test database.
 * Uses TRUNCATE CASCADE for fast cleanup.
 */
export async function cleanDatabase(): Promise<void> {
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
