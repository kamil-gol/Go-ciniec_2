/**
 * Prisma Test Client — pg Pool with Model Proxy
 *
 * Provides database access for integration tests using raw `pg` Pool
 * wrapped in a Prisma-like model API (create, findUnique, findFirst,
 * findMany, update, deleteMany) so test files and db-seed.ts can use
 * the familiar `prismaTest.user.create({ data })` syntax.
 *
 * WHY pg Pool instead of real PrismaClient?
 * Jest runs in CJS mode, but Prisma 7 generated client uses import.meta.url
 * (ESM-only). The moduleNameMapper mock for `@/prisma-client` provides enums
 * and type stubs for service code, but lacks model methods and raw queries.
 * Using pg directly bypasses the mock/real client conflict entirely.
 *
 * IMPORTANT: Integration tests run with --runInBand (single process,
 * serial execution). There is NO concurrency between suites, so
 * TRUNCATE ALL is safe — no other worker can interfere.
 *
 * Flow per test:
 *   beforeEach → cleanDatabase() → seedTestData() → test runs
 */
import { Pool } from 'pg';

const testDbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/rezerwacje_test';
const pool = new Pool({ connectionString: testDbUrl });

// ─── Model Proxy ───────────────────────────────────────────────
// Lightweight Prisma-like wrapper over pg Pool.
// Supports: create, findUnique, findFirst, findMany, update, deleteMany.
// Only handles flat where clauses + { in: [...] } operator.

interface WhereClause {
  [key: string]: any;
}

interface CreateArgs {
  data: Record<string, any>;
}

interface FindArgs {
  where?: WhereClause;
  select?: Record<string, boolean>;
}

interface UpdateArgs {
  where: WhereClause;
  data: Record<string, any>;
}

interface DeleteManyArgs {
  where?: WhereClause;
}

/**
 * Build WHERE clause from a Prisma-like where object.
 * Handles flat values and { in: [...] } operator.
 * Returns [sql, values, nextParamIndex].
 */
function buildWhere(where: WhereClause, startIdx = 1): [string, any[], number] {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = startIdx;

  for (const [key, val] of Object.entries(where)) {
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && 'in' in val) {
      // { in: [...] } operator
      const arr = val.in as any[];
      if (arr.length === 0) {
        conditions.push('FALSE');
      } else {
        const placeholders = arr.map(() => `$${idx++}`);
        conditions.push(`"${key}" IN (${placeholders.join(', ')})`);
        values.push(...arr);
      }
    } else {
      conditions.push(`"${key}" = $${idx++}`);
      values.push(val);
    }
  }

  return [conditions.join(' AND '), values, idx];
}

function createModelProxy(tableName: string) {
  return {
    create: async ({ data }: CreateArgs) => {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`);
      const result = await pool.query(
        `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
        values,
      );
      return result.rows[0];
    },

    findUnique: async ({ where }: FindArgs) => {
      if (!where) return null;
      const [whereSql, values] = buildWhere(where);
      const result = await pool.query(
        `SELECT * FROM "${tableName}" WHERE ${whereSql} LIMIT 1`,
        values,
      );
      return result.rows[0] || null;
    },

    findFirst: async ({ where }: FindArgs = {}) => {
      if (!where || Object.keys(where).length === 0) {
        const result = await pool.query(`SELECT * FROM "${tableName}" LIMIT 1`);
        return result.rows[0] || null;
      }
      const [whereSql, values] = buildWhere(where);
      const result = await pool.query(
        `SELECT * FROM "${tableName}" WHERE ${whereSql} LIMIT 1`,
        values,
      );
      return result.rows[0] || null;
    },

    findMany: async ({ where }: FindArgs = {}) => {
      if (!where || Object.keys(where).length === 0) {
        const result = await pool.query(`SELECT * FROM "${tableName}"`);
        return result.rows;
      }
      const [whereSql, values] = buildWhere(where);
      const result = await pool.query(
        `SELECT * FROM "${tableName}" WHERE ${whereSql}`,
        values,
      );
      return result.rows;
    },

    update: async ({ where, data }: UpdateArgs) => {
      const dataEntries = Object.entries(data);
      let idx = 1;
      const setClauses = dataEntries.map(([k]) => `"${k}" = $${idx++}`);
      const dataValues = dataEntries.map(([, v]) => v);

      const [whereSql, whereValues] = buildWhere(where, idx);

      const result = await pool.query(
        `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE ${whereSql} RETURNING *`,
        [...dataValues, ...whereValues],
      );
      return result.rows[0];
    },

    deleteMany: async ({ where }: DeleteManyArgs = {}) => {
      if (!where || Object.keys(where).length === 0) {
        const result = await pool.query(`DELETE FROM "${tableName}"`);
        return { count: result.rowCount ?? 0 };
      }
      const [whereSql, values] = buildWhere(where);
      const result = await pool.query(
        `DELETE FROM "${tableName}" WHERE ${whereSql}`,
        values,
      );
      return { count: result.rowCount ?? 0 };
    },
  };
}

// ─── Prisma-like client ────────────────────────────────────────

const prismaTest = {
  // Model accessors
  user: createModelProxy('User'),
  hall: createModelProxy('Hall'),
  client: createModelProxy('Client'),
  eventType: createModelProxy('EventType'),
  reservation: createModelProxy('Reservation'),
  deposit: createModelProxy('Deposit'),
  dishCategory: createModelProxy('DishCategory'),
  dish: createModelProxy('Dish'),
  menuTemplate: createModelProxy('MenuTemplate'),
  menuPackage: createModelProxy('MenuPackage'),
  role: createModelProxy('Role'),
  permission: createModelProxy('Permission'),
  rolePermission: createModelProxy('RolePermission'),
  serviceExtra: createModelProxy('ServiceExtra'),
  portionTarget: createModelProxy('PortionTarget'),
  cateringOrder: createModelProxy('CateringOrder'),

  // Raw query methods
  $connect: async () => { /* pool connects lazily */ },
  $disconnect: async () => { await pool.end(); },
  $queryRaw: async <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T> => {
    // Tagged template literal → parameterized query
    let query = '';
    strings.forEach((str, i) => {
      query += str;
      if (i < values.length) query += `$${i + 1}`;
    });
    const result = await pool.query(query, values);
    return result.rows as T;
  },
  $executeRawUnsafe: async (query: string, ...values: any[]): Promise<number> => {
    const result = await pool.query(query, values);
    return result.rowCount ?? 0;
  },
  $transaction: async (fn: any) => {
    if (typeof fn === 'function') {
      return fn(prismaTest);
    }
    // Array of promises
    return Promise.all(fn);
  },
} as any;

// ─── Database utilities ────────────────────────────────────────

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
      const result = await pool.query(
        "SELECT tablename FROM pg_tables WHERE schemaname='public'"
      );

      const tables = result.rows
        .map(({ tablename }: { tablename: string }) => tablename)
        .filter((name: string) => name !== '_prisma_migrations')
        .map((name: string) => `"public"."${name}"`);

      if (tables.length > 0) {
        await pool.query(`TRUNCATE TABLE ${tables.join(', ')} CASCADE;`);
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
  // Verify connection works
  await pool.query('SELECT 1');

  // Ensure swap_queue_positions() exists (from migration 0002)
  await pool.query(`
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
  await pool.query(`
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
  await pool.end();
}

export default prismaTest;
