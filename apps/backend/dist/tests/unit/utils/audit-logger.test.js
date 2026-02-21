/**
 * audit-logger.test.ts
 *
 * logChange() wymaga mocka prisma.
 * diffObjects(), formatChanges() — czyste funkcje, testujemy bezpośrednio.
 * Prywatne helpery (isEqual, serializeValue, formatValue) testujemy pośrednio.
 */
// Mock prisma BEFORE imports
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        activityLog: {
            create: jest.fn(),
        },
    },
}));
import { logChange, diffObjects, formatChanges } from '../../../utils/audit-logger';
import { prisma } from '../../../lib/prisma';
const mockCreate = prisma.activityLog.create;
describe('audit-logger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterEach(() => {
        console.error.mockRestore();
    });
    // ─── logChange ───
    describe('logChange', () => {
        const baseParams = {
            userId: 'user-1',
            action: 'CREATE',
            entityType: 'CLIENT',
            entityId: 'client-1',
        };
        it('should call prisma.activityLog.create with correct data', async () => {
            mockCreate.mockResolvedValueOnce({});
            await logChange(baseParams);
            expect(mockCreate).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    action: 'CREATE',
                    entityType: 'CLIENT',
                    entityId: 'client-1',
                    details: {},
                    ipAddress: undefined,
                    userAgent: undefined,
                },
            });
        });
        it('should pass optional details, ipAddress, userAgent', async () => {
            mockCreate.mockResolvedValueOnce({});
            await logChange({
                ...baseParams,
                details: { description: 'Created client' },
                ipAddress: '127.0.0.1',
                userAgent: 'Jest',
            });
            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    details: { description: 'Created client' },
                    ipAddress: '127.0.0.1',
                    userAgent: 'Jest',
                }),
            }));
        });
        it('should NOT throw when prisma.create fails (silent catch)', async () => {
            mockCreate.mockRejectedValueOnce(new Error('DB down'));
            await expect(logChange(baseParams)).resolves.toBeUndefined();
            expect(console.error).toHaveBeenCalledWith('[Audit Logger] Failed to log change:', expect.any(Error));
        });
    });
    // ─── diffObjects ───
    describe('diffObjects', () => {
        it('should return empty object when values are identical', () => {
            const obj = { name: 'Jan', email: 'jan@test.pl' };
            expect(diffObjects(obj, { ...obj })).toEqual({});
        });
        it('should detect changed primitive fields', () => {
            const old = { name: 'Jan', age: 30 };
            const updated = { name: 'Jan Kowalski', age: 30 };
            const result = diffObjects(old, updated);
            expect(result).toEqual({ name: { old: 'Jan', new: 'Jan Kowalski' } });
        });
        it('should detect multiple changes', () => {
            const old = { name: 'Jan', email: 'a@b.pl', age: 30 };
            const updated = { name: 'Jan', email: 'new@b.pl', age: 31 };
            const result = diffObjects(old, updated);
            expect(Object.keys(result)).toEqual(['email', 'age']);
        });
        it('should ignore createdAt, updatedAt, id fields', () => {
            const old = { id: '1', createdAt: 'old', updatedAt: 'old', name: 'A' };
            const updated = { id: '2', createdAt: 'new', updatedAt: 'new', name: 'B' };
            const result = diffObjects(old, updated);
            expect(result).toEqual({ name: { old: 'A', new: 'B' } });
            expect(result).not.toHaveProperty('id');
            expect(result).not.toHaveProperty('createdAt');
            expect(result).not.toHaveProperty('updatedAt');
        });
        it('should detect added fields (present in newObj only)', () => {
            const old = { name: 'Jan' };
            const updated = { name: 'Jan', phone: '123456' };
            const result = diffObjects(old, updated);
            expect(result).toEqual({ phone: { old: undefined, new: '123456' } });
        });
        it('should detect removed fields (present in oldObj only)', () => {
            const old = { name: 'Jan', phone: '123456' };
            const updated = { name: 'Jan' };
            const result = diffObjects(old, updated);
            expect(result).toEqual({ phone: { old: '123456', new: undefined } });
        });
        it('should handle Date comparison correctly', () => {
            const date = new Date('2025-06-15');
            const old = { eventDate: date };
            const updated = { eventDate: new Date('2025-06-15') };
            expect(diffObjects(old, updated)).toEqual({});
        });
        it('should detect different Dates', () => {
            const old = { eventDate: new Date('2025-06-15') };
            const updated = { eventDate: new Date('2025-07-20') };
            const result = diffObjects(old, updated);
            expect(result).toHaveProperty('eventDate');
        });
        it('should serialize Date values to ISO string', () => {
            const old = { start: new Date('2025-01-01T10:00:00Z') };
            const updated = { start: new Date('2025-02-01T10:00:00Z') };
            const result = diffObjects(old, updated);
            expect(result.start.old).toBe('2025-01-01T10:00:00.000Z');
            expect(result.start.new).toBe('2025-02-01T10:00:00.000Z');
        });
        it('should compare arrays element-by-element', () => {
            const old = { tags: ['a', 'b'] };
            const same = { tags: ['a', 'b'] };
            const different = { tags: ['a', 'c'] };
            expect(diffObjects(old, same)).toEqual({});
            expect(diffObjects(old, different)).toHaveProperty('tags');
        });
        it('should compare nested objects recursively', () => {
            const old = { meta: { color: 'red', size: 10 } };
            const same = { meta: { color: 'red', size: 10 } };
            const different = { meta: { color: 'blue', size: 10 } };
            expect(diffObjects(old, same)).toEqual({});
            expect(diffObjects(old, different)).toHaveProperty('meta');
        });
        it('should handle null vs undefined', () => {
            const old = { field: null };
            const updated = { field: undefined };
            const result = diffObjects(old, updated);
            expect(result).toHaveProperty('field');
        });
        it('should handle empty objects gracefully', () => {
            expect(diffObjects({}, {})).toEqual({});
        });
        it('should handle null/undefined oldObj', () => {
            const result = diffObjects(null, { name: 'Jan' });
            expect(result).toHaveProperty('name');
        });
    });
    // ─── formatChanges ───
    describe('formatChanges', () => {
        it('should format single change', () => {
            const result = formatChanges({ name: { old: 'Jan', new: 'Adam' } });
            expect(result).toBe("name: 'Jan' → 'Adam'");
        });
        it('should format multiple changes separated by comma', () => {
            const result = formatChanges({
                name: { old: 'Jan', new: 'Adam' },
                age: { old: 30, new: 31 },
            });
            expect(result).toContain("name: 'Jan' → 'Adam'");
            expect(result).toContain('age: 30 → 31');
            expect(result).toContain(', ');
        });
        it('should format null values as "null"', () => {
            const result = formatChanges({ phone: { old: null, new: '123' } });
            expect(result).toContain('null');
        });
        it('should format undefined values as "undefined"', () => {
            const result = formatChanges({ phone: { old: undefined, new: '123' } });
            expect(result).toContain('undefined');
        });
        it('should format boolean values', () => {
            const result = formatChanges({ active: { old: true, new: false } });
            expect(result).toBe('active: true → false');
        });
        it('should return empty string for empty changes', () => {
            const result = formatChanges({});
            expect(result).toBe('');
        });
    });
});
//# sourceMappingURL=audit-logger.test.js.map