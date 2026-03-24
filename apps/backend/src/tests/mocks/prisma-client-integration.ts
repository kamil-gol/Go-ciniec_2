/**
 * Integration-test mock for Prisma 7 generated client.
 *
 * The generated client uses ESM-only features (import.meta.url, .mjs WASM
 * runtime) that Jest CJS cannot handle. This mock provides:
 *   1. All enums matching schema.prisma (same as unit mock)
 *   2. A PrismaClient class that creates real DB connections via pg Pool
 *      with Proxy-based model access for CRUD operations
 *
 * Unlike the unit mock (stub-only PrismaClient), this mock's PrismaClient
 * actually queries the test database so integration tests exercise real
 * service code paths.
 */
import { Pool } from 'pg';

/* ═══ Re-export all enums from the unit mock ═══ */
export {
  ClientType,
  ReservationStatus,
  CateringPriceType,
  CateringOrderStatus,
  CateringDeliveryType,
  CateringDiscountType,
} from './prisma-client-jest';

/* ═══ Re-export Prisma utilities from the unit mock ═══ */
export {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  Decimal,
  Prisma,
} from './prisma-client-jest';

export type { JsonValue, JsonObject, JsonArray } from './prisma-client-jest';
export type { Dish, DishCategory, MenuTemplate, MenuPackage } from './prisma-client-jest';

/* ═══ SQL helpers ═══ */

interface WhereClause { [key: string]: any; }

/**
 * Build SQL WHERE clause from Prisma-like where object.
 * Handles: flat values, { in: [...] }, { contains: str }, { gte/lte/gt/lt },
 * { not: val }, and nested AND/OR/NOT.
 */
function buildWhere(where: WhereClause, startIdx = 1, tableName = ''): [string, any[], number] {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = startIdx;
  const col = (field: string) => tableName ? mapFieldName(tableName, field) : field;

  for (const [key, val] of Object.entries(where)) {
    // Logical operators
    if (key === 'AND' && Array.isArray(val)) {
      const parts: string[] = [];
      for (const sub of val) {
        const [sql, vals, nextIdx] = buildWhere(sub, idx, tableName);
        if (sql) { parts.push(`(${sql})`); values.push(...vals); idx = nextIdx; }
      }
      if (parts.length) conditions.push(parts.join(' AND '));
      continue;
    }
    if (key === 'OR' && Array.isArray(val)) {
      const parts: string[] = [];
      for (const sub of val) {
        const [sql, vals, nextIdx] = buildWhere(sub, idx, tableName);
        if (sql) { parts.push(`(${sql})`); values.push(...vals); idx = nextIdx; }
      }
      if (parts.length) conditions.push(`(${parts.join(' OR ')})`);
      continue;
    }
    if (key === 'NOT') {
      const sub = Array.isArray(val) ? val : [val];
      const parts: string[] = [];
      for (const s of sub) {
        const [sql, vals, nextIdx] = buildWhere(s, idx, tableName);
        if (sql) { parts.push(`NOT (${sql})`); values.push(...vals); idx = nextIdx; }
      }
      if (parts.length) conditions.push(parts.join(' AND '));
      continue;
    }

    const dbCol = col(key);

    // Operator objects
    if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if ('in' in val) {
        const arr = val.in as any[];
        if (arr.length === 0) { conditions.push('FALSE'); }
        else {
          const ph = arr.map(() => `$${idx++}`);
          conditions.push(`"${dbCol}" IN (${ph.join(', ')})`);
          values.push(...arr);
        }
      } else if ('contains' in val) {
        const mode = val.mode === 'insensitive' ? 'ILIKE' : 'LIKE';
        conditions.push(`"${dbCol}" ${mode} $${idx++}`);
        values.push(`%${val.contains}%`);
      } else if ('startsWith' in val) {
        conditions.push(`"${dbCol}" LIKE $${idx++}`);
        values.push(`${val.startsWith}%`);
      } else if ('endsWith' in val) {
        conditions.push(`"${dbCol}" LIKE $${idx++}`);
        values.push(`%${val.endsWith}`);
      } else if ('gte' in val) {
        conditions.push(`"${dbCol}" >= $${idx++}`);
        values.push(val.gte);
      } else if ('lte' in val) {
        conditions.push(`"${dbCol}" <= $${idx++}`);
        values.push(val.lte);
      } else if ('gt' in val) {
        conditions.push(`"${dbCol}" > $${idx++}`);
        values.push(val.gt);
      } else if ('lt' in val) {
        conditions.push(`"${dbCol}" < $${idx++}`);
        values.push(val.lt);
      } else if ('not' in val) {
        if (val.not === null) {
          conditions.push(`"${dbCol}" IS NOT NULL`);
        } else {
          conditions.push(`"${dbCol}" != $${idx++}`);
          values.push(val.not);
        }
      } else if ('equals' in val) {
        if (val.equals === null) {
          conditions.push(`"${dbCol}" IS NULL`);
        } else {
          conditions.push(`"${dbCol}" = $${idx++}`);
          values.push(val.equals);
        }
      } else {
        // Unknown operator object — treat as exact match (JSON column?)
        conditions.push(`"${dbCol}" = $${idx++}`);
        values.push(val);
      }
      continue;
    }

    // Null check
    if (val === null) {
      conditions.push(`"${dbCol}" IS NULL`);
      continue;
    }

    // Simple equality
    conditions.push(`"${dbCol}" = $${idx++}`);
    values.push(val);
  }

  return [conditions.join(' AND '), values, idx];
}

function extractDirection(dir: any): string {
  if (typeof dir === 'string') return dir.toUpperCase();
  if (dir && typeof dir === 'object' && 'sort' in dir) return (dir.sort as string).toUpperCase();
  return 'ASC';
}

function buildOrderBy(orderBy: any, tableName = ''): string {
  if (!orderBy) return '';
  const col = (field: string) => tableName ? mapFieldName(tableName, field) : field;
  if (Array.isArray(orderBy)) {
    const parts = orderBy.map((o: any) => {
      const [key, dir] = Object.entries(o)[0];
      return `"${col(key)}" ${extractDirection(dir)}`;
    });
    return parts.length ? ` ORDER BY ${parts.join(', ')}` : '';
  }
  const entries = Object.entries(orderBy);
  if (entries.length === 0) return '';
  const parts = entries.map(([key, dir]) => `"${col(key)}" ${extractDirection(dir)}`);
  return ` ORDER BY ${parts.join(', ')}`;
}

/* ═══ Prisma @map field → DB column mapping ═══ */

// Maps Prisma field names to actual DB column names (from @map directives in schema.prisma).
// Key: "TableName.prismaField", Value: "dbColumn"
const FIELD_MAP: Record<string, Record<string, string>> = {
  User: { legacyRole: 'role' },
};

function mapFieldName(tableName: string, field: string): string {
  return FIELD_MAP[tableName]?.[field] ?? field;
}

/** Map all keys in an object from Prisma field names to DB column names */
function mapDataKeys(tableName: string, data: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    mapped[mapFieldName(tableName, key)] = val;
  }
  return mapped;
}

/* ═══ Auto-timestamp & data cleanup helpers ═══ */

/**
 * Strip relation objects from data (Prisma handles relations via nested writes,
 * but our raw SQL proxy only handles flat column values).
 * Also auto-set createdAt/updatedAt timestamps like Prisma does.
 */
function prepareInsertData(tableName: string, data: Record<string, any>): Record<string, any> {
  const now = new Date();
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    // Skip relation objects (nested creates/connects) — they're objects but not Date/null/array
    if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      // Allow plain JSON-like objects that might be JSONB columns
      // But skip Prisma relation syntax: { create: ... }, { connect: ... }, { connectOrCreate: ... }
      if ('create' in val || 'connect' in val || 'connectOrCreate' in val || 'createMany' in val) {
        continue;
      }
    }
    cleaned[key] = val;
  }
  // Auto-set timestamps if not provided
  if (!('createdAt' in cleaned)) cleaned['createdAt'] = now;
  if (!('updatedAt' in cleaned)) cleaned['updatedAt'] = now;
  return mapDataKeys(tableName, cleaned);
}

function prepareUpdateData(tableName: string, data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if ('create' in val || 'connect' in val || 'connectOrCreate' in val || 'createMany' in val ||
          'set' in val || 'disconnect' in val || 'delete' in val || 'update' in val || 'updateMany' in val || 'deleteMany' in val) {
        continue;
      }
      // Handle Prisma atomic operations: { increment, decrement, multiply, divide }
      if ('increment' in val || 'decrement' in val || 'multiply' in val || 'divide' in val) {
        continue; // Skip — these need special SQL handling we don't support yet
      }
    }
    cleaned[key] = val;
  }
  if (!('updatedAt' in cleaned)) cleaned['updatedAt'] = new Date();
  return mapDataKeys(tableName, cleaned);
}

/* ═══ Model proxy factory ═══ */

function createModelProxy(pool: Pool, tableName: string) {
  return {
    create: async ({ data }: any) => {
      const mapped = prepareInsertData(tableName, data);
      const columns = Object.keys(mapped);
      const values = Object.values(mapped);
      const ph = values.map((_, i) => `$${i + 1}`);
      const result = await pool.query(
        `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${ph.join(', ')}) RETURNING *`,
        values,
      );
      return result.rows[0];
    },

    createMany: async ({ data }: any) => {
      const rows = Array.isArray(data) ? data : [data];
      let count = 0;
      for (const row of rows) {
        const mapped = prepareInsertData(tableName, row);
        const columns = Object.keys(mapped);
        const values = Object.values(mapped);
        const ph = values.map((_, i) => `$${i + 1}`);
        await pool.query(
          `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${ph.join(', ')})`,
          values,
        );
        count++;
      }
      return { count };
    },

    findUnique: async ({ where }: any = {}) => {
      if (!where) return null;
      const [sql, values] = buildWhere(where, 1, tableName);
      const result = await pool.query(`SELECT * FROM "${tableName}" WHERE ${sql} LIMIT 1`, values);
      return result.rows[0] || null;
    },

    findFirst: async ({ where, orderBy }: any = {}) => {
      if (!where || Object.keys(where).length === 0) {
        const ob = buildOrderBy(orderBy, tableName);
        const result = await pool.query(`SELECT * FROM "${tableName}"${ob} LIMIT 1`);
        return result.rows[0] || null;
      }
      const [sql, values] = buildWhere(where, 1, tableName);
      const ob = buildOrderBy(orderBy, tableName);
      const result = await pool.query(`SELECT * FROM "${tableName}" WHERE ${sql}${ob} LIMIT 1`, values);
      return result.rows[0] || null;
    },

    findMany: async ({ where, orderBy, skip, take }: any = {}) => {
      let query = `SELECT * FROM "${tableName}"`;
      let values: any[] = [];

      if (where && Object.keys(where).length > 0) {
        const [sql, vals] = buildWhere(where, 1, tableName);
        query += ` WHERE ${sql}`;
        values = vals;
      }

      query += buildOrderBy(orderBy, tableName);

      if (take !== undefined) {
        query += ` LIMIT ${Number(take)}`;
      }
      if (skip !== undefined) {
        query += ` OFFSET ${Number(skip)}`;
      }

      const result = await pool.query(query, values);
      return result.rows;
    },

    update: async ({ where, data }: any) => {
      const mapped = prepareUpdateData(tableName, data);
      const dataEntries = Object.entries(mapped);
      let idx = 1;
      const setClauses = dataEntries.map(([k]) => `"${k}" = $${idx++}`);
      const dataValues = dataEntries.map(([, v]) => v);
      const [whereSql, whereValues] = buildWhere(where, idx, tableName);
      const result = await pool.query(
        `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE ${whereSql} RETURNING *`,
        [...dataValues, ...whereValues],
      );
      return result.rows[0];
    },

    updateMany: async ({ where, data }: any) => {
      const mapped = prepareUpdateData(tableName, data);
      const dataEntries = Object.entries(mapped);
      let idx = 1;
      const setClauses = dataEntries.map(([k]) => `"${k}" = $${idx++}`);
      const dataValues = dataEntries.map(([, v]) => v);
      let query = `UPDATE "${tableName}" SET ${setClauses.join(', ')}`;
      let values = [...dataValues];
      if (where && Object.keys(where).length > 0) {
        const [whereSql, whereValues] = buildWhere(where, idx, tableName);
        query += ` WHERE ${whereSql}`;
        values.push(...whereValues);
      }
      const result = await pool.query(query, values);
      return { count: result.rowCount ?? 0 };
    },

    delete: async ({ where }: any) => {
      const [sql, values] = buildWhere(where, 1, tableName);
      const result = await pool.query(
        `DELETE FROM "${tableName}" WHERE ${sql} RETURNING *`,
        values,
      );
      return result.rows[0];
    },

    deleteMany: async ({ where }: any = {}) => {
      if (!where || Object.keys(where).length === 0) {
        const result = await pool.query(`DELETE FROM "${tableName}"`);
        return { count: result.rowCount ?? 0 };
      }
      const [sql, values] = buildWhere(where, 1, tableName);
      const result = await pool.query(`DELETE FROM "${tableName}" WHERE ${sql}`, values);
      return { count: result.rowCount ?? 0 };
    },

    count: async ({ where }: any = {}) => {
      let query = `SELECT COUNT(*)::int as count FROM "${tableName}"`;
      let values: any[] = [];
      if (where && Object.keys(where).length > 0) {
        const [sql, vals] = buildWhere(where, 1, tableName);
        query += ` WHERE ${sql}`;
        values = vals;
      }
      const result = await pool.query(query, values);
      return result.rows[0]?.count ?? 0;
    },

    upsert: async ({ where, create, update: updateData }: any) => {
      const [sql, values] = buildWhere(where, 1, tableName);
      const existing = await pool.query(`SELECT * FROM "${tableName}" WHERE ${sql} LIMIT 1`, values);
      if (existing.rows[0]) {
        // Update
        const mapped = prepareUpdateData(tableName, updateData);
        const dataEntries = Object.entries(mapped);
        let idx = 1;
        const setClauses = dataEntries.map(([k]) => `"${k}" = $${idx++}`);
        const dataValues = dataEntries.map(([, v]) => v);
        const [wSql, wValues] = buildWhere(where, idx, tableName);
        const result = await pool.query(
          `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE ${wSql} RETURNING *`,
          [...dataValues, ...wValues],
        );
        return result.rows[0];
      } else {
        // Create
        const mapped = prepareInsertData(tableName, create);
        const columns = Object.keys(mapped);
        const vals = Object.values(mapped);
        const ph = vals.map((_, i) => `$${i + 1}`);
        const result = await pool.query(
          `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${ph.join(', ')}) RETURNING *`,
          vals,
        );
        return result.rows[0];
      }
    },

    aggregate: async ({ where, _count, _sum, _avg, _min, _max }: any = {}) => {
      const parts: string[] = [];
      if (_count === true || _count?._all) parts.push('COUNT(*)::int as "_count"');
      if (_sum) {
        for (const [k] of Object.entries(_sum).filter(([, v]) => v)) {
          const dbCol = mapFieldName(tableName, k);
          parts.push(`SUM("${dbCol}") as "_sum_${k}"`);
        }
      }
      if (!parts.length) parts.push('COUNT(*)::int as "_count"');

      let query = `SELECT ${parts.join(', ')} FROM "${tableName}"`;
      let values: any[] = [];
      if (where && Object.keys(where).length > 0) {
        const [sql, vals] = buildWhere(where, 1, tableName);
        query += ` WHERE ${sql}`;
        values = vals;
      }
      const result = await pool.query(query, values);
      return result.rows[0] ?? {};
    },

    groupBy: async () => {
      // Minimal stub — unlikely used in integration tests
      return [];
    },
  };
}

/* ═══ PrismaClient class ═══ */

// camelCase model name → PascalCase table name
function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Known model names (camelCase → PascalCase table name)
const MODEL_MAP: Record<string, string> = {
  role: 'Role',
  permission: 'Permission',
  rolePermission: 'RolePermission',
  companySettings: 'CompanySettings',
  user: 'User',
  passwordResetToken: 'PasswordResetToken',
  refreshToken: 'RefreshToken',
  hall: 'Hall',
  eventType: 'EventType',
  client: 'Client',
  clientContact: 'ClientContact',
  reservation: 'Reservation',
  reservationHistory: 'ReservationHistory',
  deposit: 'Deposit',
  depositPayment: 'DepositPayment',
  activityLog: 'ActivityLog',
  menuTemplate: 'MenuTemplate',
  menuPackage: 'MenuPackage',
  menuCourse: 'MenuCourse',
  menuCourseOption: 'MenuCourseOption',
  dishCategory: 'DishCategory',
  dish: 'Dish',
  packageCategorySettings: 'PackageCategorySettings',
  reservationCategoryExtra: 'ReservationCategoryExtra',
  reservationMenuSnapshot: 'ReservationMenuSnapshot',
  menuPriceHistory: 'MenuPriceHistory',
  attachment: 'Attachment',
  serviceCategory: 'ServiceCategory',
  serviceItem: 'ServiceItem',
  reservationExtra: 'ReservationExtra',
  documentTemplate: 'DocumentTemplate',
  documentTemplateHistory: 'DocumentTemplateHistory',
  cateringTemplate: 'CateringTemplate',
  cateringPackage: 'CateringPackage',
  cateringPackageSection: 'CateringPackageSection',
  cateringSectionOption: 'CateringSectionOption',
  cateringOrder: 'CateringOrder',
  cateringOrderItem: 'CateringOrderItem',
  cateringOrderExtra: 'CateringOrderExtra',
  cateringOrderHistory: 'CateringOrderHistory',
  cateringDeposit: 'CateringDeposit',
  notification: 'Notification',
};

export class PrismaClient {
  private _pool: Pool;
  private _models: Map<string, ReturnType<typeof createModelProxy>> = new Map();

  constructor(_opts?: any) {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/rezerwacje_test';
    this._pool = new Pool({ connectionString: dbUrl });

    // Use Proxy so any model name access (prisma.xyz) creates a model proxy
    return new Proxy(this, {
      get: (target, prop: string) => {
        // Built-in methods
        if (prop in target) return (target as any)[prop];
        // Known method names that aren't models
        if (prop.startsWith('$') || prop.startsWith('_')) return (target as any)[prop];

        // Model access
        if (!target._models.has(prop)) {
          const tableName = MODEL_MAP[prop] || toPascalCase(prop);
          target._models.set(prop, createModelProxy(target._pool, tableName));
        }
        return target._models.get(prop);
      },
    });
  }

  async $connect() { await this._pool.query('SELECT 1'); }
  async $disconnect() { await this._pool.end(); }

  async $queryRaw(strings: TemplateStringsArray, ...values: any[]) {
    let query = '';
    strings.forEach((str, i) => {
      query += str;
      if (i < values.length) query += `$${i + 1}`;
    });
    const result = await this._pool.query(query, values);
    return result.rows;
  }

  async $executeRawUnsafe(query: string, ...values: any[]) {
    const result = await this._pool.query(query, values);
    return result.rowCount ?? 0;
  }

  async $transaction(fn: any) {
    if (typeof fn === 'function') {
      return fn(this);
    }
    // Array of promises
    return Promise.all(fn);
  }
}
