import { prisma } from '../lib/prisma';

/**
 * Parametry logowania zmian w systemie
 */
export interface LogChangeParams {
  userId: string | null;
  action: string; // CREATE, UPDATE, DELETE, TOGGLE, ARCHIVE, UNARCHIVE, PAYMENT, etc.
  entityType: string; // CLIENT, HALL, EVENT_TYPE, DISH, MENU_TEMPLATE, RESERVATION, etc.
  entityId: string;
  details?: {
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    description?: string;
    changes?: any; // Flexible: Record<string, { old, new }>, plain object, or string
    [key: string]: any; // Dodatkowe dane kontekstowe
  };
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Loguje zmianę w ActivityLog
 * 
 * @example
 * await logChange({
 *   userId: req.user.id,
 *   action: 'UPDATE',
 *   entityType: 'CLIENT',
 *   entityId: client.id,
 *   details: { changes: diffObjects(oldClient, updatedClient) }
 * });
 */
export async function logChange(params: LogChangeParams): Promise<void> {
  const { userId, action, entityType, entityId, details, ipAddress, userAgent } = params;

  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details || {},
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Nie rzucaj błędu jeśli logowanie się nie powiedzie - to nie powinno blokować biznesowej operacji
    console.error('[Audit Logger] Failed to log change:', error);
  }
}

/**
 * Backward-compatible alias for logChange.
 * @deprecated Use logChange instead.
 */
export const logActivity = logChange;

/**
 * Porównuje dwa obiekty i zwraca różnice
 * Ignoruje pola: createdAt, updatedAt, id (jeśli w obu obiektach są takie same)
 * 
 * @returns Record<fieldName, { old: value, new: value }>
 * 
 * @example
 * const changes = diffObjects(
 *   { name: 'Jan', email: 'jan@example.com', age: 30 },
 *   { name: 'Jan', email: 'jan.nowy@example.com', age: 31 }
 * );
 * // { email: { old: 'jan@example.com', new: 'jan.nowy@example.com' }, age: { old: 30, new: 31 } }
 */
export function diffObjects(
  oldObj: Record<string, any>,
  newObj: Record<string, any>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};

  // Pola do ignorowania
  const ignoredFields = ['createdAt', 'updatedAt', 'id'];

  // Sprawdź wszystkie klucze z nowego obiektu
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

  for (const key of allKeys) {
    // Ignoruj system fields
    if (ignoredFields.includes(key)) continue;

    const oldValue = oldObj?.[key];
    const newValue = newObj?.[key];

    // Porównaj wartości (obsługa null, undefined, daty, JSON)
    if (!isEqual(oldValue, newValue)) {
      changes[key] = {
        old: serializeValue(oldValue),
        new: serializeValue(newValue),
      };
    }
  }

  return changes;
}

/**
 * Porównuje dwie wartości (obsługuje Date, Array, Object, primitives)
 */
function isEqual(a: any, b: any): boolean {
  // Null/undefined check
  if (a === b) return true;
  if (a == null || b == null) return false;

  // Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Array
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => isEqual(val, b[idx]));
  }

  // Object (plain)
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  // Primitives
  return false;
}

/**
 * Serializuje wartość do JSON-friendly formatu
 */
function serializeValue(value: any): any {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object' && 'toJSON' in value) return value.toJSON();
  return value;
}

/**
 * Helper do budowania opisu zmian w czytelnym formacie
 * 
 * @example
 * const description = formatChanges({
 *   name: { old: 'Jan', new: 'Jan Kowalski' },
 *   email: { old: 'jan@example.com', new: 'jkowalski@example.com' }
 * });
 * // "name: 'Jan' → 'Jan Kowalski', email: 'jan@example.com' → 'jkowalski@example.com'"
 */
export function formatChanges(changes: Record<string, { old: any; new: any }>): string {
  return Object.entries(changes)
    .map(([field, { old, new: newVal }]) => {
      const oldStr = formatValue(old);
      const newStr = formatValue(newVal);
      return `${field}: ${oldStr} \u2192 ${newStr}`;
    })
    .join(', ');
}

/**
 * Formatuje wartość do czytelnego stringa
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `'${value}'`;
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
