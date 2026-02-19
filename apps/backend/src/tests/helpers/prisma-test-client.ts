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
 * Tables preserved during beforeEach cleanup.
 *
 * Includes:
 * - Seed data tables: User, Client, Hall, EventType
 * - RBAC tables: Role, Permission, RolePermission
 *
 * IMPORTANT: Role MUST be skipped because TRUNCATE TABLE "Role" CASCADE
 * cascades to User (via User.roleId FK), which would destroy seed data.
 * Cascade chain: Role → User → Reservation → everything.
 */
const PRESERVED_TABLES = [
  'User', 'Client', 'Hall', 'EventType',
  'Role', 'Permission', 'RolePermission',
];

/**
 * Clean transactional tables in the test database.
 * Preserves seed + RBAC tables to prevent FK cascade destroying seed data.
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
        .filter((name) => name !== '_prisma_migrations' && !PRESERVED_TABLES.includes(name))
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
 * Full cleanup including ALL tables.
 * Use only in afterAll to leave the DB completely clean.
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
