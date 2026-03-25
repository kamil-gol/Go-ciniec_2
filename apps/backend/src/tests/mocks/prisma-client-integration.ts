/**
 * Integration-test mock for Prisma 7 generated client.
 *
 * The generated client uses ESM-only features (import.meta.url, .mjs WASM
 * runtime) that Jest CJS cannot handle. This mock provides:
 *   1. All enums matching schema.prisma (same as unit mock)
 *   2. A PrismaClient class that creates real DB connections via pg Pool
 *      with Proxy-based model access for CRUD operations
 *   3. Include support for loading relations
 *   4. Compound unique key handling
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

/* ═══ Relation metadata ═══ */

interface RelationInfo {
  model: string;   // PascalCase related table name
  fk: string | null; // FK column on THIS model (for 'one') or null (for 'many')
  type: 'one' | 'many';
}

// For 'many' relations, we need to know which FK on the CHILD table points back.
// This is derived by looking at the child model's 'one' relation to the parent.
// childFk stores that info: parentTable.relationField → { childTable, childFk }
interface ChildFkInfo {
  childTable: string;
  childFk: string;
}

const RELATIONS: Record<string, Record<string, RelationInfo>> = {
  Role: {
    permissions: { model: 'RolePermission', fk: null, type: 'many' },
    users: { model: 'User', fk: null, type: 'many' },
  },
  Permission: {
    roles: { model: 'RolePermission', fk: null, type: 'many' },
  },
  RolePermission: {
    role: { model: 'Role', fk: 'roleId', type: 'one' },
    permission: { model: 'Permission', fk: 'permissionId', type: 'one' },
  },
  User: {
    assignedRole: { model: 'Role', fk: 'roleId', type: 'one' },
    createdReservations: { model: 'Reservation', fk: null, type: 'many' },
    activityLogs: { model: 'ActivityLog', fk: null, type: 'many' },
    uploadedAttachments: { model: 'Attachment', fk: null, type: 'many' },
    passwordResetTokens: { model: 'PasswordResetToken', fk: null, type: 'many' },
    refreshTokens: { model: 'RefreshToken', fk: null, type: 'many' },
    notifications: { model: 'Notification', fk: null, type: 'many' },
  },
  PasswordResetToken: {
    user: { model: 'User', fk: 'userId', type: 'one' },
  },
  RefreshToken: {
    user: { model: 'User', fk: 'userId', type: 'one' },
  },
  Hall: {
    reservations: { model: 'Reservation', fk: null, type: 'many' },
  },
  EventType: {
    reservations: { model: 'Reservation', fk: null, type: 'many' },
    menuTemplates: { model: 'MenuTemplate', fk: null, type: 'many' },
  },
  Client: {
    reservations: { model: 'Reservation', fk: null, type: 'many' },
    contacts: { model: 'ClientContact', fk: null, type: 'many' },
    cateringOrders: { model: 'CateringOrder', fk: null, type: 'many' },
  },
  ClientContact: {
    client: { model: 'Client', fk: 'clientId', type: 'one' },
  },
  Reservation: {
    hall: { model: 'Hall', fk: 'hallId', type: 'one' },
    client: { model: 'Client', fk: 'clientId', type: 'one' },
    eventType: { model: 'EventType', fk: 'eventTypeId', type: 'one' },
    createdBy: { model: 'User', fk: 'createdById', type: 'one' },
    history: { model: 'ReservationHistory', fk: null, type: 'many' },
    deposits: { model: 'Deposit', fk: null, type: 'many' },
    menuSnapshot: { model: 'ReservationMenuSnapshot', fk: null, type: 'many' },
    extras: { model: 'ReservationExtra', fk: null, type: 'many' },
    categoryExtras: { model: 'ReservationCategoryExtra', fk: null, type: 'many' },
  },
  ReservationHistory: {
    reservation: { model: 'Reservation', fk: 'reservationId', type: 'one' },
    changedByUser: { model: 'User', fk: 'changedByUserId', type: 'one' },
  },
  Deposit: {
    reservation: { model: 'Reservation', fk: 'reservationId', type: 'one' },
    payments: { model: 'DepositPayment', fk: null, type: 'many' },
  },
  DepositPayment: {
    deposit: { model: 'Deposit', fk: 'depositId', type: 'one' },
  },
  ActivityLog: {
    user: { model: 'User', fk: 'userId', type: 'one' },
  },
  MenuTemplate: {
    eventType: { model: 'EventType', fk: 'eventTypeId', type: 'one' },
    packages: { model: 'MenuPackage', fk: null, type: 'many' },
    priceHistory: { model: 'MenuPriceHistory', fk: null, type: 'many' },
  },
  MenuPackage: {
    menuTemplate: { model: 'MenuTemplate', fk: 'menuTemplateId', type: 'one' },
    categorySettings: { model: 'PackageCategorySettings', fk: null, type: 'many' },
    courses: { model: 'MenuCourse', fk: null, type: 'many' },
    priceHistory: { model: 'MenuPriceHistory', fk: null, type: 'many' },
  },
  MenuCourse: {
    package: { model: 'MenuPackage', fk: 'packageId', type: 'one' },
    options: { model: 'MenuCourseOption', fk: null, type: 'many' },
  },
  MenuCourseOption: {
    course: { model: 'MenuCourse', fk: 'courseId', type: 'one' },
    dish: { model: 'Dish', fk: 'dishId', type: 'one' },
  },
  DishCategory: {
    dishes: { model: 'Dish', fk: null, type: 'many' },
    categorySettings: { model: 'PackageCategorySettings', fk: null, type: 'many' },
    cateringSections: { model: 'CateringPackageSection', fk: null, type: 'many' },
  },
  Dish: {
    category: { model: 'DishCategory', fk: 'categoryId', type: 'one' },
    courseOptions: { model: 'MenuCourseOption', fk: null, type: 'many' },
    cateringOptions: { model: 'CateringSectionOption', fk: null, type: 'many' },
    orderItems: { model: 'CateringOrderItem', fk: null, type: 'many' },
  },
  PackageCategorySettings: {
    package: { model: 'MenuPackage', fk: 'packageId', type: 'one' },
    category: { model: 'DishCategory', fk: 'categoryId', type: 'one' },
    reservationExtras: { model: 'ReservationCategoryExtra', fk: null, type: 'many' },
  },
  ReservationCategoryExtra: {
    reservation: { model: 'Reservation', fk: 'reservationId', type: 'one' },
    packageCategory: { model: 'PackageCategorySettings', fk: 'packageCategoryId', type: 'one' },
  },
  ReservationMenuSnapshot: {
    reservation: { model: 'Reservation', fk: 'reservationId', type: 'one' },
  },
  MenuPriceHistory: {
    menuTemplate: { model: 'MenuTemplate', fk: 'menuTemplateId', type: 'one' },
    package: { model: 'MenuPackage', fk: 'packageId', type: 'one' },
  },
  Attachment: {
    uploadedBy: { model: 'User', fk: 'uploadedById', type: 'one' },
  },
  ServiceCategory: {
    items: { model: 'ServiceItem', fk: null, type: 'many' },
  },
  ServiceItem: {
    category: { model: 'ServiceCategory', fk: 'categoryId', type: 'one' },
    reservationExtras: { model: 'ReservationExtra', fk: null, type: 'many' },
    cateringExtras: { model: 'CateringOrderExtra', fk: null, type: 'many' },
  },
  ReservationExtra: {
    reservation: { model: 'Reservation', fk: 'reservationId', type: 'one' },
    serviceItem: { model: 'ServiceItem', fk: 'serviceItemId', type: 'one' },
  },
  DocumentTemplate: {
    history: { model: 'DocumentTemplateHistory', fk: null, type: 'many' },
  },
  DocumentTemplateHistory: {
    template: { model: 'DocumentTemplate', fk: 'templateId', type: 'one' },
    changedBy: { model: 'User', fk: 'changedById', type: 'one' },
  },
  CateringTemplate: {
    packages: { model: 'CateringPackage', fk: null, type: 'many' },
    orders: { model: 'CateringOrder', fk: null, type: 'many' },
  },
  CateringPackage: {
    template: { model: 'CateringTemplate', fk: 'templateId', type: 'one' },
    sections: { model: 'CateringPackageSection', fk: null, type: 'many' },
    orders: { model: 'CateringOrder', fk: null, type: 'many' },
  },
  CateringPackageSection: {
    package: { model: 'CateringPackage', fk: 'packageId', type: 'one' },
    category: { model: 'DishCategory', fk: 'categoryId', type: 'one' },
    options: { model: 'CateringSectionOption', fk: null, type: 'many' },
  },
  CateringSectionOption: {
    section: { model: 'CateringPackageSection', fk: 'sectionId', type: 'one' },
    dish: { model: 'Dish', fk: 'dishId', type: 'one' },
  },
  CateringOrder: {
    client: { model: 'Client', fk: 'clientId', type: 'one' },
    createdBy: { model: 'User', fk: 'createdById', type: 'one' },
    template: { model: 'CateringTemplate', fk: 'templateId', type: 'one' },
    package: { model: 'CateringPackage', fk: 'packageId', type: 'one' },
    items: { model: 'CateringOrderItem', fk: null, type: 'many' },
    extras: { model: 'CateringOrderExtra', fk: null, type: 'many' },
    history: { model: 'CateringOrderHistory', fk: null, type: 'many' },
    deposits: { model: 'CateringDeposit', fk: null, type: 'many' },
  },
  CateringOrderItem: {
    order: { model: 'CateringOrder', fk: 'orderId', type: 'one' },
    dish: { model: 'Dish', fk: 'dishId', type: 'one' },
  },
  CateringOrderExtra: {
    order: { model: 'CateringOrder', fk: 'orderId', type: 'one' },
    serviceItem: { model: 'ServiceItem', fk: 'serviceItemId', type: 'one' },
  },
  CateringOrderHistory: {
    order: { model: 'CateringOrder', fk: 'orderId', type: 'one' },
    changedBy: { model: 'User', fk: 'changedById', type: 'one' },
  },
  CateringDeposit: {
    order: { model: 'CateringOrder', fk: 'orderId', type: 'one' },
  },
  Notification: {
    user: { model: 'User', fk: 'userId', type: 'one' },
  },
};

/* ═══ Compound unique keys ═══ */

const COMPOUND_UNIQUE: Record<string, Record<string, string[]>> = {
  Permission: { module_action: ['module', 'action'] },
  RolePermission: { roleId_permissionId: ['roleId', 'permissionId'] },
  MenuCourseOption: { courseId_dishId: ['courseId', 'dishId'] },
  PackageCategorySettings: { packageId_categoryId: ['packageId', 'categoryId'] },
  ReservationCategoryExtra: { reservationId_packageCategoryId: ['reservationId', 'packageCategoryId'] },
  ReservationExtra: { reservationId_serviceItemId: ['reservationId', 'serviceItemId'] },
  CateringPackageSection: { packageId_categoryId: ['packageId', 'categoryId'] },
  CateringSectionOption: { sectionId_dishId: ['sectionId', 'dishId'] },
};

/**
 * For 'many' relations, find the FK on the child table that references the parent.
 * E.g., Reservation.deposits → Deposit has relation back to Reservation with fk='reservationId'
 */
function getChildFk(parentTable: string, relationField: string): ChildFkInfo | null {
  const rel = RELATIONS[parentTable]?.[relationField];
  if (!rel || rel.type !== 'many') return null;

  const childTable = rel.model;
  const childRels = RELATIONS[childTable];
  if (!childRels) return null;

  // Find the child's 'one' relation pointing back to parentTable
  for (const childRel of Object.values(childRels)) {
    if (childRel.type === 'one' && childRel.model === parentTable && childRel.fk) {
      return { childTable, childFk: childRel.fk };
    }
  }
  return null;
}

/* ═══ SQL helpers ═══ */

interface WhereClause { [key: string]: any; }

/** Check if a field is a relation (not a DB column) on this table */
function isRelationField(tableName: string, field: string): boolean {
  return RELATIONS[tableName]?.[field] !== undefined;
}

/**
 * Build SQL WHERE clause from Prisma-like where object.
 * Handles: flat values, { in: [...] }, { contains: str }, { gte/lte/gt/lt },
 * { not: val }, compound unique keys, and nested AND/OR/NOT.
 * Skips relation fields (they need special handling via JOINs).
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

    // Check for compound unique keys: e.g., packageId_categoryId: { packageId: 'x', categoryId: 'y' }
    const compoundKeys = COMPOUND_UNIQUE[tableName]?.[key];
    if (compoundKeys && val && typeof val === 'object' && !Array.isArray(val)) {
      for (const ck of compoundKeys) {
        if (ck in val) {
          const dbCol = col(ck);
          if (val[ck] === null) {
            conditions.push(`"${dbCol}" IS NULL`);
          } else {
            conditions.push(`"${dbCol}" = $${idx++}`);
            values.push(val[ck]);
          }
        }
      }
      continue;
    }

    // Skip relation fields — they can't be used directly in SQL
    // Relation where filters like { category: { id: 'x' } } need JOIN support
    if (tableName && isRelationField(tableName, key)) {
      // For simple relation filter { relationField: { id: 'value' } },
      // try to resolve via FK if it's a 'one' relation
      const relInfo = RELATIONS[tableName]?.[key];
      if (relInfo?.type === 'one' && relInfo.fk && val && typeof val === 'object') {
        // e.g., { category: { id: 'abc' } } → check if it filters by the FK
        if ('id' in val) {
          const dbCol = col(relInfo.fk);
          conditions.push(`"${dbCol}" = $${idx++}`);
          values.push(val.id);
          continue;
        }
      }
      // Skip relation filters we can't handle
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
      } else if ('notIn' in val) {
        const arr = val.notIn as any[];
        if (arr.length === 0) { /* no constraint */ }
        else {
          const ph = arr.map(() => `$${idx++}`);
          conditions.push(`"${dbCol}" NOT IN (${ph.join(', ')})`);
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
      } else if ('gte' in val || 'lte' in val || 'gt' in val || 'lt' in val) {
        // Handle combined range filters: { gte: x, lte: y }
        if ('gte' in val) { conditions.push(`"${dbCol}" >= $${idx++}`); values.push(val.gte); }
        if ('lte' in val) { conditions.push(`"${dbCol}" <= $${idx++}`); values.push(val.lte); }
        if ('gt' in val) { conditions.push(`"${dbCol}" > $${idx++}`); values.push(val.gt); }
        if ('lt' in val) { conditions.push(`"${dbCol}" < $${idx++}`); values.push(val.lt); }
      } else if ('not' in val) {
        if (val.not === null) {
          conditions.push(`"${dbCol}" IS NOT NULL`);
        } else {
          conditions.push(`"${dbCol}" != $${idx++}`);
          values.push(val.not);
        }
      } else if ('path' in val && ('equals' in val || 'not' in val)) {
        // JSON path filter: { path: ['field1', 'field2'], equals: value }
        const pathArr = val.path as string[];
        let jsonAccess = `"${dbCol}"`;
        for (let pi = 0; pi < pathArr.length - 1; pi++) {
          jsonAccess += `->'${pathArr[pi]}'`;
        }
        jsonAccess += `->>'${pathArr[pathArr.length - 1]}'`;
        if ('equals' in val) {
          if (val.equals === null) {
            conditions.push(`${jsonAccess} IS NULL`);
          } else {
            conditions.push(`${jsonAccess} = $${idx++}`);
            values.push(String(val.equals));
          }
        }
      } else if ('equals' in val) {
        if (val.equals === null) {
          conditions.push(`"${dbCol}" IS NULL`);
        } else {
          conditions.push(`"${dbCol}" = $${idx++}`);
          values.push(val.equals);
        }
      } else if ('some' in val || 'every' in val || 'none' in val || 'is' in val || 'isNot' in val) {
        // Skip relation aggregate filters — these need sub-queries
        continue;
      } else {
        // Unknown operator object — treat as exact match (JSON column?)
        conditions.push(`"${dbCol}" = $${idx++}`);
        values.push(JSON.stringify(val));
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
  const processEntry = (key: string, dir: any): string | null => {
    // Skip relation-based orderBy (e.g., { category: { name: 'asc' } })
    if (tableName && isRelationField(tableName, key)) return null;
    // Skip _count, _relevance etc.
    if (key.startsWith('_')) return null;
    return `"${col(key)}" ${extractDirection(dir)}`;
  };
  if (Array.isArray(orderBy)) {
    const parts = orderBy.map((o: any) => {
      const [key, dir] = Object.entries(o)[0];
      return processEntry(key, dir);
    }).filter(Boolean);
    return parts.length ? ` ORDER BY ${parts.join(', ')}` : '';
  }
  const entries = Object.entries(orderBy);
  if (entries.length === 0) return '';
  const parts = entries.map(([key, dir]) => processEntry(key, dir)).filter(Boolean);
  return parts.length ? ` ORDER BY ${parts.join(', ')}` : '';
}

/* ═══ Prisma @map field → DB column mapping ═══ */

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

// Build reverse map: DB column → Prisma field name (lazy, per-table)
const REVERSE_FIELD_MAP: Record<string, Record<string, string>> = {};
function getReverseMap(tableName: string): Record<string, string> {
  if (!REVERSE_FIELD_MAP[tableName]) {
    const forward = FIELD_MAP[tableName];
    if (!forward) return {};
    const rev: Record<string, string> = {};
    for (const [prismaName, dbCol] of Object.entries(forward)) {
      rev[dbCol] = prismaName;
    }
    REVERSE_FIELD_MAP[tableName] = rev;
  }
  return REVERSE_FIELD_MAP[tableName];
}

/** Reverse-map DB column names back to Prisma field names in query results */
function reverseMapRows(tableName: string, rows: any[]): void {
  const rev = getReverseMap(tableName);
  if (!Object.keys(rev).length) return;
  for (const row of rows) {
    for (const [dbCol, prismaName] of Object.entries(rev)) {
      if (dbCol in row && !(prismaName in row)) {
        row[prismaName] = row[dbCol];
        delete row[dbCol];
      }
    }
  }
}

/* ═══ Decimal field wrapping ═══ */
// Import Decimal class from unit mock
import { Decimal as DecimalClass } from './prisma-client-jest';

const DECIMAL_FIELDS: Record<string, Set<string>> = {
  EventType: new Set(['extraHourRate']),
  Reservation: new Set(['pricePerAdult', 'pricePerChild', 'pricePerToddler', 'totalPrice', 'discountValue', 'discountAmount', 'priceBeforeDiscount', 'venueSurcharge', 'extraHoursCost', 'extrasTotalPrice']),
  Deposit: new Set(['amount', 'remainingAmount', 'paidAmount']),
  DepositPayment: new Set(['amount']),
  MenuPackage: new Set(['pricePerAdult', 'pricePerChild', 'pricePerToddler']),
  MenuCourseOption: new Set(['customPrice']),
  PackageCategorySettings: new Set(['minSelect', 'maxSelect', 'extraItemPrice', 'maxExtra']),
  ReservationCategoryExtra: new Set(['quantity', 'pricePerItem', 'totalPrice']),
  ReservationMenuSnapshot: new Set(['packagePrice', 'optionsPrice', 'totalMenuPrice']),
  MenuPriceHistory: new Set(['oldValue', 'newValue']),
  ServiceItem: new Set(['basePrice']),
  ReservationExtra: new Set(['unitPrice', 'totalPrice']),
  CateringPackage: new Set(['basePrice']),
  CateringPackageSection: new Set(['minSelect', 'maxSelect']),
  CateringSectionOption: new Set(['customPrice']),
  CateringOrder: new Set(['subtotal', 'extrasTotalPrice', 'discountValue', 'discountAmount', 'totalPrice']),
  CateringOrderItem: new Set(['unitPrice', 'totalPrice']),
  CateringOrderExtra: new Set(['unitPrice', 'totalPrice']),
  CateringDeposit: new Set(['amount', 'paidAmount', 'remainingAmount']),
};

/**
 * Wrap Decimal columns in query results with Prisma-compatible Decimal objects.
 * PostgreSQL pg driver returns numeric as strings; Prisma returns Decimal objects.
 */
function wrapDecimalFields(tableName: string, rows: any[]): any[] {
  if (rows.length === 0) return rows;
  // Reverse-map DB column names → Prisma field names (e.g. "role" → "legacyRole")
  reverseMapRows(tableName, rows);
  const decimalFields = DECIMAL_FIELDS[tableName];
  if (!decimalFields) return rows;
  for (const row of rows) {
    for (const field of decimalFields) {
      if (field in row && row[field] !== null && row[field] !== undefined) {
        // Only wrap if not already a Decimal instance
        if (!(row[field] instanceof DecimalClass) && typeof row[field]?.toNumber !== 'function') {
          row[field] = new DecimalClass(row[field]);
        }
      }
    }
  }
  return rows;
}

/* ═══ Auto-timestamp & data cleanup helpers ═══ */

const NO_UPDATED_AT = new Set([
  'Permission', 'RolePermission', 'PasswordResetToken', 'RefreshToken',
  'ReservationHistory', 'ActivityLog', 'MenuPriceHistory',
  'DocumentTemplateHistory', 'CateringOrderHistory', 'Notification',
]);

const NO_CREATED_AT = new Set(['ReservationMenuSnapshot']);

/** Unwrap Decimal instances to plain numbers for SQL parameters */
function unwrapDecimal(val: any): any {
  if (val && typeof val === 'object' && typeof val.toNumber === 'function' && !(val instanceof Date)) {
    return val.toNumber();
  }
  return val;
}

function prepareInsertData(tableName: string, data: Record<string, any>): Record<string, any> {
  const now = new Date();
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    // Skip undefined values
    if (val === undefined) continue;
    // Skip relation fields entirely (they're not DB columns)
    if (isRelationField(tableName, key)) continue;

    // Skip relation objects (nested creates/connects)
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if ('create' in val || 'connect' in val || 'connectOrCreate' in val || 'createMany' in val) {
        continue;
      }
    }
    cleaned[key] = unwrapDecimal(val);
  }
  if (!NO_CREATED_AT.has(tableName) && !('createdAt' in cleaned)) cleaned['createdAt'] = now;
  if (!NO_UPDATED_AT.has(tableName) && !('updatedAt' in cleaned)) cleaned['updatedAt'] = now;
  return mapDataKeys(tableName, cleaned);
}

function prepareUpdateData(tableName: string, data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    // Skip undefined values — don't overwrite existing DB values with null
    if (val === undefined) continue;
    // Skip relation fields entirely
    if (isRelationField(tableName, key)) continue;

    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if ('create' in val || 'connect' in val || 'connectOrCreate' in val || 'createMany' in val ||
          'set' in val || 'disconnect' in val || 'delete' in val || 'update' in val || 'updateMany' in val || 'deleteMany' in val) {
        continue;
      }
      if ('increment' in val || 'decrement' in val || 'multiply' in val || 'divide' in val) {
        continue;
      }
    }
    cleaned[key] = unwrapDecimal(val);
  }
  if (!NO_UPDATED_AT.has(tableName) && !('updatedAt' in cleaned)) cleaned['updatedAt'] = new Date();
  return mapDataKeys(tableName, cleaned);
}

/* ═══ Include / relation loading helpers ═══ */

/**
 * Load relations for rows based on Prisma `include` or `select` option.
 * Supports:
 * - include: { relation: true }  → load all related rows
 * - include: { relation: { include: {...}, where: {...}, orderBy: {...} } }  → nested includes
 * - select: { field: true, relation: true }  → also triggers relation loading
 */
async function loadRelations(
  pool: Pool,
  tableName: string,
  rows: any[],
  include?: any,
  select?: any,
): Promise<any[]> {
  if ((!include && !select) || rows.length === 0) return rows;

  const modelRels = RELATIONS[tableName] || {};
  const fieldsToLoad: Record<string, any> = include ? { ...include } : {};

  // If using select, also load relations mentioned in select
  if (select) {
    for (const [key, val] of Object.entries(select)) {
      if (val && modelRels[key]) {
        fieldsToLoad[key] = val === true ? true : val;
      }
    }
  }

  // Handle _count in include: { _count: { select: { dishes: true } } }
  if (include && include._count) {
    const countSelect = include._count.select || include._count;
    if (typeof countSelect === 'object') {
      for (const [countField, countVal] of Object.entries(countSelect)) {
        if (!countVal) continue;
        const relInfo = modelRels[countField];
        if (!relInfo || relInfo.type !== 'many') continue;

        const childFkInfo = getChildFk(tableName, countField);
        if (!childFkInfo) {
          for (const row of rows) {
            if (!row._count) row._count = {};
            row._count[countField] = 0;
          }
          continue;
        }

        const parentIds = rows.map((r: any) => r.id).filter((v: any) => v != null);
        if (parentIds.length === 0) {
          for (const row of rows) {
            if (!row._count) row._count = {};
            row._count[countField] = 0;
          }
          continue;
        }

        const uniqueIds = [...new Set(parentIds)];
        const placeholders = uniqueIds.map((_: any, i: number) => `$${i + 1}`);
        const countResult = await pool.query(
          `SELECT "${childFkInfo.childFk}", COUNT(*)::int as cnt FROM "${childFkInfo.childTable}" WHERE "${childFkInfo.childFk}" IN (${placeholders.join(', ')}) GROUP BY "${childFkInfo.childFk}"`,
          uniqueIds,
        );
        const countMap = new Map(countResult.rows.map((r: any) => [r[childFkInfo.childFk], r.cnt]));
        for (const row of rows) {
          if (!row._count) row._count = {};
          row._count[countField] = countMap.get(row.id) || 0;
        }
      }
    }
  }

  for (const [relField, relOpts] of Object.entries(fieldsToLoad) as [string, any][]) {
    const relInfo = modelRels[relField];
    if (!relInfo) continue;
    if (!relOpts) continue; // false or undefined
    if (relField === '_count') continue; // Already handled above

    if (relInfo.type === 'one' && relInfo.fk) {
      // belongs-to: fetch related row by FK
      const fkValues = rows.map((r: any) => r[relInfo.fk!]).filter((v: any) => v != null);
      if (fkValues.length === 0) {
        for (const row of rows) row[relField] = null;
        continue;
      }
      const uniqueFks = [...new Set(fkValues)];
      const placeholders = uniqueFks.map((_: any, i: number) => `$${i + 1}`);
      const relResult = await pool.query(
        `SELECT * FROM "${relInfo.model}" WHERE "id" IN (${placeholders.join(', ')})`,
        uniqueFks,
      );
      wrapDecimalFields(relInfo.model, relResult.rows);
      const relMap = new Map(relResult.rows.map((r: any) => [r.id, r]));

      // Handle nested includes
      if (relOpts && typeof relOpts === 'object' && relOpts !== true) {
        const nestedInclude = relOpts.include || relOpts.select;
        if (nestedInclude) {
          await loadRelations(pool, relInfo.model, relResult.rows, relOpts.include, relOpts.select);
        }
      }

      for (const row of rows) {
        row[relField] = relMap.get(row[relInfo.fk!]) || null;
      }
    } else if (relInfo.type === 'many') {
      // has-many: find child FK that points back to this table
      const childFkInfo = getChildFk(tableName, relField);
      if (!childFkInfo) {
        for (const row of rows) row[relField] = [];
        continue;
      }

      const parentIds = rows.map((r: any) => r.id).filter((v: any) => v != null);
      if (parentIds.length === 0) {
        for (const row of rows) row[relField] = [];
        continue;
      }

      const uniqueIds = [...new Set(parentIds)];
      const placeholders = uniqueIds.map((_: any, i: number) => `$${i + 1}`);
      let childQuery = `SELECT * FROM "${childFkInfo.childTable}" WHERE "${childFkInfo.childFk}" IN (${placeholders.join(', ')})`;
      const childValues: any[] = [...uniqueIds];

      // Apply where filter from include options
      if (relOpts && typeof relOpts === 'object' && relOpts !== true && relOpts.where) {
        const [whereSql, whereVals] = buildWhere(relOpts.where, childValues.length + 1, childFkInfo.childTable);
        if (whereSql) {
          childQuery += ` AND ${whereSql}`;
          childValues.push(...whereVals);
        }
      }

      // Apply orderBy from include options
      if (relOpts && typeof relOpts === 'object' && relOpts !== true && relOpts.orderBy) {
        childQuery += buildOrderBy(relOpts.orderBy, childFkInfo.childTable);
      }

      const childResult = await pool.query(childQuery, childValues);
      wrapDecimalFields(childFkInfo.childTable, childResult.rows);

      // Handle nested includes on child rows
      if (relOpts && typeof relOpts === 'object' && relOpts !== true) {
        const nestedInclude = relOpts.include || relOpts.select;
        if (nestedInclude) {
          await loadRelations(pool, childFkInfo.childTable, childResult.rows, relOpts.include, relOpts.select);
        }
      }

      // Group children by parent FK
      const childMap = new Map<string, any[]>();
      for (const child of childResult.rows) {
        const parentId = child[childFkInfo.childFk];
        if (!childMap.has(parentId)) childMap.set(parentId, []);
        childMap.get(parentId)!.push(child);
      }

      for (const row of rows) {
        row[relField] = childMap.get(row.id) || [];
      }
    }
  }

  // If using select, strip non-selected fields (except relations and id)
  if (select) {
    const selectKeys = new Set(Object.keys(select).filter((k: string) => (select as any)[k]));
    // Always keep 'id' for internal use
    selectKeys.add('id');
    return rows.map((row: any) => {
      const filtered: any = {};
      for (const key of selectKeys) {
        if (key in row) filtered[key] = row[key];
      }
      return filtered;
    });
  }

  return rows;
}

/* ═══ Model proxy factory ═══ */

function createModelProxy(pool: Pool, tableName: string) {
  return {
    create: async ({ data, include, select }: any) => {
      const mapped = prepareInsertData(tableName, data);
      const columns = Object.keys(mapped);
      const values = Object.values(mapped);
      const ph = values.map((_: any, i: number) => `$${i + 1}`);
      const result = await pool.query(
        `INSERT INTO "${tableName}" (${columns.map((c: string) => `"${c}"`).join(', ')}) VALUES (${ph.join(', ')}) RETURNING *`,
        values,
      );
      const rows = result.rows;
      wrapDecimalFields(tableName, rows);
      if (include || select) {
        await loadRelations(pool, tableName, rows, include, select);
      }
      return rows[0];
    },

    createMany: async ({ data }: any) => {
      const rows = Array.isArray(data) ? data : [data];
      let count = 0;
      for (const row of rows) {
        const mapped = prepareInsertData(tableName, row);
        const columns = Object.keys(mapped);
        const values = Object.values(mapped);
        const ph = values.map((_: any, i: number) => `$${i + 1}`);
        await pool.query(
          `INSERT INTO "${tableName}" (${columns.map((c: string) => `"${c}"`).join(', ')}) VALUES (${ph.join(', ')})`,
          values,
        );
        count++;
      }
      return { count };
    },

    findUnique: async ({ where, include, select }: any = {}) => {
      if (!where) return null;
      const [sql, values] = buildWhere(where, 1, tableName);
      if (!sql) return null;
      const result = await pool.query(`SELECT * FROM "${tableName}" WHERE ${sql} LIMIT 1`, values);
      if (result.rows.length === 0) return null;
      wrapDecimalFields(tableName, result.rows);
      if (include || select) {
        await loadRelations(pool, tableName, result.rows, include, select);
      }
      return result.rows[0] || null;
    },

    findFirst: async ({ where, orderBy, include, select }: any = {}) => {
      let query: string;
      let values: any[] = [];

      if (!where || Object.keys(where).length === 0) {
        const ob = buildOrderBy(orderBy, tableName);
        query = `SELECT * FROM "${tableName}"${ob} LIMIT 1`;
      } else {
        const [sql, vals] = buildWhere(where, 1, tableName);
        const ob = buildOrderBy(orderBy, tableName);
        query = sql
          ? `SELECT * FROM "${tableName}" WHERE ${sql}${ob} LIMIT 1`
          : `SELECT * FROM "${tableName}"${ob} LIMIT 1`;
        values = vals;
      }
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return null;
      wrapDecimalFields(tableName, result.rows);
      if (include || select) {
        await loadRelations(pool, tableName, result.rows, include, select);
      }
      return result.rows[0] || null;
    },

    findMany: async ({ where, orderBy, skip, take, include, select, distinct }: any = {}) => {
      let query = `SELECT * FROM "${tableName}"`;
      let values: any[] = [];

      if (where && Object.keys(where).length > 0) {
        const [sql, vals] = buildWhere(where, 1, tableName);
        if (sql) {
          query += ` WHERE ${sql}`;
          values = vals;
        }
      }

      query += buildOrderBy(orderBy, tableName);

      if (take !== undefined) {
        query += ` LIMIT ${Number(take)}`;
      }
      if (skip !== undefined) {
        query += ` OFFSET ${Number(skip)}`;
      }

      const result = await pool.query(query, values);
      let rows = result.rows;
      wrapDecimalFields(tableName, rows);

      if (distinct) {
        // Simple distinct on specified fields
        const seen = new Set();
        const distinctFields = Array.isArray(distinct) ? distinct : [distinct];
        rows = rows.filter((row: any) => {
          const key = distinctFields.map((f: string) => row[f]).join('|');
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      if (include || select) {
        await loadRelations(pool, tableName, rows, include, select);
      }
      return rows;
    },

    update: async ({ where, data, include, select }: any) => {
      const mapped = prepareUpdateData(tableName, data);
      const dataEntries = Object.entries(mapped);
      if (dataEntries.length === 0) {
        // No data to update — just return the existing row
        const [sql, values] = buildWhere(where, 1, tableName);
        const result = await pool.query(`SELECT * FROM "${tableName}" WHERE ${sql} LIMIT 1`, values);
        wrapDecimalFields(tableName, result.rows);
        if (include || select) await loadRelations(pool, tableName, result.rows, include, select);
        return result.rows[0];
      }
      let idx = 1;
      const setClauses = dataEntries.map(([k]) => `"${k}" = $${idx++}`);
      const dataValues = dataEntries.map(([, v]) => v);
      const [whereSql, whereValues] = buildWhere(where, idx, tableName);
      const result = await pool.query(
        `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE ${whereSql} RETURNING *`,
        [...dataValues, ...whereValues],
      );
      wrapDecimalFields(tableName, result.rows);
      if (include || select) {
        await loadRelations(pool, tableName, result.rows, include, select);
      }
      return result.rows[0];
    },

    updateMany: async ({ where, data }: any) => {
      const mapped = prepareUpdateData(tableName, data);
      const dataEntries = Object.entries(mapped);
      if (dataEntries.length === 0) return { count: 0 };
      let idx = 1;
      const setClauses = dataEntries.map(([k]) => `"${k}" = $${idx++}`);
      const dataValues = dataEntries.map(([, v]) => v);
      let query = `UPDATE "${tableName}" SET ${setClauses.join(', ')}`;
      let values = [...dataValues];
      if (where && Object.keys(where).length > 0) {
        const [whereSql, whereValues] = buildWhere(where, idx, tableName);
        if (whereSql) {
          query += ` WHERE ${whereSql}`;
          values.push(...whereValues);
        }
      }
      const result = await pool.query(query, values);
      return { count: result.rowCount ?? 0 };
    },

    delete: async ({ where, include }: any) => {
      // First fetch with relations if needed
      if (include) {
        const [selSql, selValues] = buildWhere(where, 1, tableName);
        const selResult = await pool.query(`SELECT * FROM "${tableName}" WHERE ${selSql} LIMIT 1`, selValues);
        wrapDecimalFields(tableName, selResult.rows);
        if (selResult.rows.length > 0) {
          await loadRelations(pool, tableName, selResult.rows, include);
        }
        const [sql, values] = buildWhere(where, 1, tableName);
        await pool.query(`DELETE FROM "${tableName}" WHERE ${sql}`, values);
        return selResult.rows[0];
      }
      const [sql, values] = buildWhere(where, 1, tableName);
      const result = await pool.query(
        `DELETE FROM "${tableName}" WHERE ${sql} RETURNING *`,
        values,
      );
      wrapDecimalFields(tableName, result.rows);
      return result.rows[0];
    },

    deleteMany: async ({ where }: any = {}) => {
      if (!where || Object.keys(where).length === 0) {
        const result = await pool.query(`DELETE FROM "${tableName}"`);
        return { count: result.rowCount ?? 0 };
      }
      const [sql, values] = buildWhere(where, 1, tableName);
      if (!sql) {
        const result = await pool.query(`DELETE FROM "${tableName}"`);
        return { count: result.rowCount ?? 0 };
      }
      const result = await pool.query(`DELETE FROM "${tableName}" WHERE ${sql}`, values);
      return { count: result.rowCount ?? 0 };
    },

    count: async ({ where }: any = {}) => {
      let query = `SELECT COUNT(*)::int as count FROM "${tableName}"`;
      let values: any[] = [];
      if (where && Object.keys(where).length > 0) {
        const [sql, vals] = buildWhere(where, 1, tableName);
        if (sql) {
          query += ` WHERE ${sql}`;
          values = vals;
        }
      }
      const result = await pool.query(query, values);
      return result.rows[0]?.count ?? 0;
    },

    upsert: async ({ where, create, update: updateData, include, select }: any) => {
      const [sql, values] = buildWhere(where, 1, tableName);
      const existing = sql
        ? await pool.query(`SELECT * FROM "${tableName}" WHERE ${sql} LIMIT 1`, values)
        : { rows: [] };
      if (existing.rows[0]) {
        const mapped = prepareUpdateData(tableName, updateData);
        const dataEntries = Object.entries(mapped);
        if (dataEntries.length === 0) {
          wrapDecimalFields(tableName, existing.rows);
          if (include || select) await loadRelations(pool, tableName, existing.rows, include, select);
          return existing.rows[0];
        }
        let idx = 1;
        const setClauses = dataEntries.map(([k]) => `"${k}" = $${idx++}`);
        const dataValues = dataEntries.map(([, v]) => v);
        const [wSql, wValues] = buildWhere(where, idx, tableName);
        const result = await pool.query(
          `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE ${wSql} RETURNING *`,
          [...dataValues, ...wValues],
        );
        wrapDecimalFields(tableName, result.rows);
        if (include || select) await loadRelations(pool, tableName, result.rows, include, select);
        return result.rows[0];
      } else {
        const mapped = prepareInsertData(tableName, create);
        const columns = Object.keys(mapped);
        const vals = Object.values(mapped);
        const ph = vals.map((_: any, i: number) => `$${i + 1}`);
        const result = await pool.query(
          `INSERT INTO "${tableName}" (${columns.map((c: string) => `"${c}"`).join(', ')}) VALUES (${ph.join(', ')}) RETURNING *`,
          vals,
        );
        wrapDecimalFields(tableName, result.rows);
        if (include || select) await loadRelations(pool, tableName, result.rows, include, select);
        return result.rows[0];
      }
    },

    aggregate: async ({ where, _count, _sum, _avg, _min, _max }: any = {}) => {
      const parts: string[] = [];
      if (_count === true || _count?._all) {
        parts.push('COUNT(*)::int as "_count_all"');
      } else if (_count && typeof _count === 'object') {
        for (const [k, v] of Object.entries(_count)) {
          if (v) {
            const dbCol = k === '_all' ? '*' : `"${mapFieldName(tableName, k)}"`;
            parts.push(`COUNT(${dbCol})::int as "_count_${k}"`);
          }
        }
      }

      if (_sum) {
        for (const [k, v] of Object.entries(_sum)) {
          if (v) {
            const dbCol = mapFieldName(tableName, k);
            parts.push(`SUM("${dbCol}")::numeric as "_sum_${k}"`);
          }
        }
      }

      if (_avg) {
        for (const [k, v] of Object.entries(_avg)) {
          if (v) {
            const dbCol = mapFieldName(tableName, k);
            parts.push(`AVG("${dbCol}")::numeric as "_avg_${k}"`);
          }
        }
      }

      if (_min) {
        for (const [k, v] of Object.entries(_min)) {
          if (v) {
            const dbCol = mapFieldName(tableName, k);
            parts.push(`MIN("${dbCol}") as "_min_${k}"`);
          }
        }
      }

      if (_max) {
        for (const [k, v] of Object.entries(_max)) {
          if (v) {
            const dbCol = mapFieldName(tableName, k);
            parts.push(`MAX("${dbCol}") as "_max_${k}"`);
          }
        }
      }

      if (!parts.length) parts.push('COUNT(*)::int as "_count_all"');

      let query = `SELECT ${parts.join(', ')} FROM "${tableName}"`;
      let values: any[] = [];
      if (where && Object.keys(where).length > 0) {
        const [sql, vals] = buildWhere(where, 1, tableName);
        if (sql) {
          query += ` WHERE ${sql}`;
          values = vals;
        }
      }
      const qResult = await pool.query(query, values);
      const raw = qResult.rows[0] ?? {};

      // Reformat to Prisma aggregate result shape
      const formatted: any = {};
      if (_count === true) {
        formatted._count = { _all: raw['_count_all'] ?? 0 };
      } else if (_count) {
        formatted._count = {};
        for (const k of Object.keys(_count)) {
          formatted._count[k] = raw[`_count_${k}`] ?? 0;
        }
      }
      if (_sum) {
        formatted._sum = {};
        for (const k of Object.keys(_sum)) {
          formatted._sum[k] = raw[`_sum_${k}`] != null ? new DecimalClass(raw[`_sum_${k}`]) : null;
        }
      }
      if (_avg) {
        formatted._avg = {};
        for (const k of Object.keys(_avg)) {
          formatted._avg[k] = raw[`_avg_${k}`] != null ? new DecimalClass(raw[`_avg_${k}`]) : null;
        }
      }
      if (_min) {
        formatted._min = {};
        for (const k of Object.keys(_min)) {
          formatted._min[k] = raw[`_min_${k}`] ?? null;
        }
      }
      if (_max) {
        formatted._max = {};
        for (const k of Object.keys(_max)) {
          formatted._max[k] = raw[`_max_${k}`] ?? null;
        }
      }
      return formatted;
    },

    groupBy: async ({ by, where, _count, _sum, orderBy }: any = {}) => {
      if (!by || (Array.isArray(by) && by.length === 0)) return [];
      const groupFields = Array.isArray(by) ? by : [by];
      const selectParts = groupFields.map((f: string) => `"${mapFieldName(tableName, f)}" as "${f}"`);

      if (_count === true || _count?._all) {
        selectParts.push('COUNT(*)::int as "_count"');
      }
      if (_sum) {
        for (const [k, v] of Object.entries(_sum)) {
          if (v) selectParts.push(`SUM("${mapFieldName(tableName, k)}")::numeric as "_sum_${k}"`);
        }
      }

      let query = `SELECT ${selectParts.join(', ')} FROM "${tableName}"`;
      let values: any[] = [];

      if (where && Object.keys(where).length > 0) {
        const [sql, vals] = buildWhere(where, 1, tableName);
        if (sql) { query += ` WHERE ${sql}`; values = vals; }
      }

      query += ` GROUP BY ${groupFields.map((f: string) => `"${mapFieldName(tableName, f)}"`).join(', ')}`;

      if (orderBy) {
        query += buildOrderBy(orderBy, tableName);
      }

      const result = await pool.query(query, values);

      // Reformat rows to match Prisma groupBy shape
      return result.rows.map((row: any) => {
        const formatted: any = {};
        for (const f of groupFields) formatted[f] = row[f];
        if (_count === true) formatted._count = { _all: row['_count'] ?? 0 };
        else if (_count?._all) formatted._count = { _all: row['_count'] ?? 0 };
        if (_sum) {
          formatted._sum = {};
          for (const k of Object.keys(_sum)) {
            formatted._sum[k] = row[`_sum_${k}`] != null ? Number(row[`_sum_${k}`]) : null;
          }
        }
        return formatted;
      });
    },
  };
}

/* ═══ PrismaClient class ═══ */

function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

    return new Proxy(this, {
      get: (target, prop: string) => {
        if (prop in target) return (target as any)[prop];
        if (prop.startsWith('$') || prop.startsWith('_')) return (target as any)[prop];
        if (typeof prop === 'symbol') return (target as any)[prop];

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
    strings.forEach((str: string, i: number) => {
      query += str;
      if (i < values.length) query += `$${i + 1}`;
    });
    const result = await this._pool.query(query, values);
    return result.rows;
  }

  async $queryRawUnsafe(query: string, ...values: any[]) {
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
    return Promise.all(fn);
  }
}
