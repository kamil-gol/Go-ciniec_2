import { prisma } from '../lib/prisma';
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
export async function logChange(params) {
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
    }
    catch (error) {
        // Nie rzucaj błędu jeśli logowanie się nie powiedzie - to nie powinno blokować biznesowej operacji
        console.error('[Audit Logger] Failed to log change:', error);
    }
}
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
export function diffObjects(oldObj, newObj) {
    const changes = {};
    // Pola do ignorowania
    const ignoredFields = ['createdAt', 'updatedAt', 'id'];
    // Sprawdź wszystkie klucze z nowego obiektu
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
    for (const key of allKeys) {
        // Ignoruj system fields
        if (ignoredFields.includes(key))
            continue;
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
function isEqual(a, b) {
    // Null/undefined check
    if (a === b)
        return true;
    if (a == null || b == null)
        return false;
    // Date
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    // Array
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length)
            return false;
        return a.every((val, idx) => isEqual(val, b[idx]));
    }
    // Object (plain)
    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length)
            return false;
        return keysA.every((key) => isEqual(a[key], b[key]));
    }
    // Primitives
    return false;
}
/**
 * Serializuje wartość do JSON-friendly formatu
 */
function serializeValue(value) {
    if (value === null || value === undefined)
        return value;
    if (value instanceof Date)
        return value.toISOString();
    if (typeof value === 'bigint')
        return value.toString();
    if (typeof value === 'object' && 'toJSON' in value)
        return value.toJSON();
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
export function formatChanges(changes) {
    return Object.entries(changes)
        .map(([field, { old, new: newVal }]) => {
        const oldStr = formatValue(old);
        const newStr = formatValue(newVal);
        return `${field}: ${oldStr} → ${newStr}`;
    })
        .join(', ');
}
/**
 * Formatuje wartość do czytelnego stringa
 */
function formatValue(value) {
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'string')
        return `'${value}'`;
    if (typeof value === 'boolean')
        return value.toString();
    if (typeof value === 'number')
        return value.toString();
    if (value instanceof Date)
        return value.toISOString().split('T')[0];
    if (Array.isArray(value))
        return `[${value.length} items]`;
    if (typeof value === 'object')
        return JSON.stringify(value);
    return String(value);
}
//# sourceMappingURL=audit-logger.js.map