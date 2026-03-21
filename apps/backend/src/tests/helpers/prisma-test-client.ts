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
import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const testDbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/rezerwacje_test';
const adapter = new PrismaPg({ connectionString: testDbUrl });

const prismaTest = new PrismaClient({ adapter });

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
 * Connect to test database and ensure SQL queue functions exist.
 *
 * The queue service uses two PostgreSQL functions for atomic
 * position operations (swap_queue_positions, move_to_queue_position).
 * These are normally created by migration 0002_queue_sql_functions,
 * but the test database may not have had migrations applied.
 *
 * CREATE OR REPLACE is idempotent — safe to run on every connect.
 */
export async function connectTestDb(): Promise<void> {
  await prismaTest.$connect();

  // Ensure swap_queue_positions() exists (from migration 0002)
  await prismaTest.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION swap_queue_positions(id1 UUID, id2 UUID)
    RETURNS VOID AS $$
    DECLARE
      pos1 INTEGER;
      pos2 INTEGER;
    BEGIN
      SELECT "reservationQueuePosition" INTO pos1
        FROM "Reservation" WHERE id = id1 FOR UPDATE;
      SELECT "reservationQueuePosition" INTO pos2
        FROM "Reservation" WHERE id = id2 FOR UPDATE;
      UPDATE "Reservation" SET "reservationQueuePosition" = -1,
        "queueOrderManual" = true WHERE id = id1;
      UPDATE "Reservation" SET "reservationQueuePosition" = pos1,
        "queueOrderManual" = true WHERE id = id2;
      UPDATE "Reservation" SET "reservationQueuePosition" = pos2,
        "queueOrderManual" = true WHERE id = id1;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Ensure move_to_queue_position() exists (from migration 0002)
  await prismaTest.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION move_to_queue_position(res_id UUID, new_pos INTEGER)
    RETURNS VOID AS $$
    DECLARE
      old_pos INTEGER;
      queue_date TIMESTAMP;
    BEGIN
      SELECT "reservationQueuePosition", "reservationQueueDate"
        INTO old_pos, queue_date
        FROM "Reservation" WHERE id = res_id FOR UPDATE;
      IF old_pos = new_pos THEN RETURN; END IF;
      IF new_pos < old_pos THEN
        UPDATE "Reservation"
        SET "reservationQueuePosition" = "reservationQueuePosition" + 1
        WHERE status = 'RESERVED'
          AND "reservationQueueDate"::date = queue_date::date
          AND "reservationQueuePosition" >= new_pos
          AND "reservationQueuePosition" < old_pos
          AND id != res_id;
      ELSE
        UPDATE "Reservation"
        SET "reservationQueuePosition" = "reservationQueuePosition" - 1
        WHERE status = 'RESERVED'
          AND "reservationQueueDate"::date = queue_date::date
          AND "reservationQueuePosition" > old_pos
          AND "reservationQueuePosition" <= new_pos
          AND id != res_id;
      END IF;
      UPDATE "Reservation"
      SET "reservationQueuePosition" = new_pos, "queueOrderManual" = true
      WHERE id = res_id;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

/**
 * Disconnect from test database.
 */
export async function disconnectTestDb(): Promise<void> {
  await prismaTest.$disconnect();
}

export default prismaTest;
