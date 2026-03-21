/**
 * Jest-compatible mock for Prisma 7 generated client.
 *
 * The generated client.ts uses `import.meta.url` (ESM-only),
 * which Jest in CJS mode cannot parse. This file provides all
 * the exports that the codebase needs without importing client.ts.
 *
 * Enums are defined manually (must match schema.prisma).
 * Model types are re-exported as `any` since tests mock them.
 */

/* ─── Enums (must match prisma/schema.prisma) ─── */

export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

export enum ReservationStatus {
  RESERVED = 'RESERVED',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

export enum CateringPriceType {
  PER_PERSON = 'PER_PERSON',
  FLAT = 'FLAT',
  TIERED = 'TIERED',
}

export enum CateringOrderStatus {
  DRAFT = 'DRAFT',
  INQUIRY = 'INQUIRY',
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CateringDeliveryType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  ON_SITE = 'ON_SITE',
}

export enum CateringDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  AMOUNT = 'AMOUNT',
}

/* ─── PrismaClient stub ─── */

export class PrismaClient {
  $connect() { return Promise.resolve(); }
  $disconnect() { return Promise.resolve(); }
  $transaction(arg: any) { return Promise.resolve(arg); }
}

/* ─── Prisma namespace ─── */

export class PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;
  clientVersion: string;
  constructor(
    message: string,
    opts: { code: string; clientVersion?: string; meta?: Record<string, unknown> },
  ) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
    this.code = opts.code;
    this.clientVersion = opts.clientVersion || '7.5.0';
    this.meta = opts.meta;
  }
}

export class PrismaClientValidationError extends Error {
  clientVersion: string;
  constructor(message: string) {
    super(message);
    this.name = 'PrismaClientValidationError';
    this.clientVersion = '7.5.0';
  }
}

export class Decimal {
  private _value: string;
  constructor(value: string | number | Decimal) {
    this._value = String(value instanceof Decimal ? value._value : value);
  }
  toNumber() { return Number(this._value); }
  toString() { return this._value; }
  toFixed(dp: number) { return Number(this._value).toFixed(dp); }
  static add(a: Decimal, b: Decimal) { return new Decimal(a.toNumber() + b.toNumber()); }
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export const Prisma = {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  Decimal,
  JsonNull: null as any,
  DbNull: null as any,
  AnyNull: null as any,
};

/* ─── Model types (re-exported as any for test compatibility) ─── */

export type Dish = any;
export type DishCategory = any;
export type MenuTemplate = any;
export type MenuPackage = any;
