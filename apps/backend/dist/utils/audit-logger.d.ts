/**
 * Parametry logowania zmian w systemie
 */
export interface LogChangeParams {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: {
        fieldName?: string;
        oldValue?: any;
        newValue?: any;
        description?: string;
        changes?: Record<string, {
            old: any;
            new: any;
        }>;
        [key: string]: any;
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
export declare function logChange(params: LogChangeParams): Promise<void>;
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
export declare function diffObjects(oldObj: Record<string, any>, newObj: Record<string, any>): Record<string, {
    old: any;
    new: any;
}>;
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
export declare function formatChanges(changes: Record<string, {
    old: any;
    new: any;
}>): string;
//# sourceMappingURL=audit-logger.d.ts.map