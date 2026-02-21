/**
 * DishService — Branch Coverage
 * findAll filter combos, create allergens/isActive defaults, update name/categoryId validation,
 * update no-changes audit skip, toggleActive ternary, remove guard
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        dish: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        dishCategory: { findUnique: jest.fn() },
    },
}));
jest.mock('../../../utils/audit-logger', () => ({
    logChange: jest.fn().mockResolvedValue(undefined),
    diffObjects: jest.fn(),
}));
jest.mock('../../../utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
import dishService from '../../../services/dish.service';
import { prisma } from '../../../lib/prisma';
import { diffObjects } from '../../../utils/audit-logger';
const db = prisma;
const mockDiff = diffObjects;
const makeDish = (o = {}) => ({
    id: 'd-1', name: 'Rosół', description: 'Zupa', categoryId: 'cat-1',
    allergens: ['gluten'], isActive: true,
    category: { id: 'cat-1', name: 'Zupy', displayOrder: 1 },
    ...o,
});
beforeEach(() => jest.resetAllMocks());
describe('DishService — branches', () => {
    // ═══ findAll ═══
    describe('findAll()', () => {
        it('should apply no filters when none provided', async () => {
            db.dish.findMany.mockResolvedValue([]);
            await dishService.findAll();
            expect(db.dish.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
        });
        it('should apply categoryId filter', async () => {
            db.dish.findMany.mockResolvedValue([]);
            await dishService.findAll({ categoryId: 'cat-1' });
            expect(db.dish.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { categoryId: 'cat-1' } }));
        });
        it('should apply isActive filter', async () => {
            db.dish.findMany.mockResolvedValue([]);
            await dishService.findAll({ isActive: false });
            expect(db.dish.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: false } }));
        });
        it('should apply search filter (OR)', async () => {
            db.dish.findMany.mockResolvedValue([]);
            await dishService.findAll({ search: 'Ros' });
            const where = db.dish.findMany.mock.calls[0][0].where;
            expect(where.OR).toBeDefined();
            expect(where.OR).toHaveLength(2);
        });
        it('should apply all filters at once', async () => {
            db.dish.findMany.mockResolvedValue([]);
            await dishService.findAll({ categoryId: 'cat-1', isActive: true, search: 'Ros' });
            const where = db.dish.findMany.mock.calls[0][0].where;
            expect(where.categoryId).toBe('cat-1');
            expect(where.isActive).toBe(true);
            expect(where.OR).toBeDefined();
        });
        it('should not apply isActive filter when undefined', async () => {
            db.dish.findMany.mockResolvedValue([]);
            await dishService.findAll({ categoryId: 'cat-1' });
            const where = db.dish.findMany.mock.calls[0][0].where;
            expect(where.isActive).toBeUndefined();
        });
    });
    // ═══ create ═══
    describe('create()', () => {
        it('should throw when name already exists', async () => {
            db.dish.findFirst.mockResolvedValue({ id: 'existing' });
            await expect(dishService.create({ name: 'Rosół', categoryId: 'cat-1' }, 'u-1'))
                .rejects.toThrow('already exists');
        });
        it('should throw when category not found', async () => {
            db.dish.findFirst.mockResolvedValue(null);
            db.dishCategory.findUnique.mockResolvedValue(null);
            await expect(dishService.create({ name: 'New', categoryId: 'bad' }, 'u-1'))
                .rejects.toThrow('not found');
        });
        it('should default allergens to [] when not provided', async () => {
            db.dish.findFirst.mockResolvedValue(null);
            db.dishCategory.findUnique.mockResolvedValue({ id: 'cat-1', name: 'Zupy' });
            db.dish.create.mockResolvedValue(makeDish({ allergens: [] }));
            await dishService.create({ name: 'New', categoryId: 'cat-1' }, 'u-1');
            expect(db.dish.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ allergens: [] }) }));
        });
        it('should default isActive to true when not provided', async () => {
            db.dish.findFirst.mockResolvedValue(null);
            db.dishCategory.findUnique.mockResolvedValue({ id: 'cat-1', name: 'Zupy' });
            db.dish.create.mockResolvedValue(makeDish());
            await dishService.create({ name: 'New', categoryId: 'cat-1' }, 'u-1');
            expect(db.dish.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: true }) }));
        });
        it('should use provided isActive=false', async () => {
            db.dish.findFirst.mockResolvedValue(null);
            db.dishCategory.findUnique.mockResolvedValue({ id: 'cat-1', name: 'Zupy' });
            db.dish.create.mockResolvedValue(makeDish({ isActive: false }));
            await dishService.create({ name: 'New', categoryId: 'cat-1', isActive: false }, 'u-1');
            expect(db.dish.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }));
        });
        it('should use provided allergens', async () => {
            db.dish.findFirst.mockResolvedValue(null);
            db.dishCategory.findUnique.mockResolvedValue({ id: 'cat-1', name: 'Zupy' });
            db.dish.create.mockResolvedValue(makeDish());
            await dishService.create({ name: 'New', categoryId: 'cat-1', allergens: ['milk'] }, 'u-1');
            expect(db.dish.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ allergens: ['milk'] }) }));
        });
    });
    // ═══ update ═══
    describe('update()', () => {
        it('should throw when dish not found', async () => {
            db.dish.findUnique.mockResolvedValue(null);
            await expect(dishService.update('bad', { name: 'X' }, 'u-1'))
                .rejects.toThrow('not found');
        });
        it('should check name uniqueness when name changes', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish());
            db.dish.findFirst.mockResolvedValue({ id: 'other' }); // conflict
            await expect(dishService.update('d-1', { name: 'Taken' }, 'u-1'))
                .rejects.toThrow('already exists');
        });
        it('should skip name check when name not provided', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish());
            db.dish.update.mockResolvedValue(makeDish());
            mockDiff.mockReturnValue({});
            await dishService.update('d-1', { description: 'New desc' }, 'u-1');
            expect(db.dish.findFirst).not.toHaveBeenCalled();
        });
        it('should validate categoryId when provided', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish());
            db.dishCategory.findUnique.mockResolvedValue(null); // not found
            await expect(dishService.update('d-1', { categoryId: 'bad' }, 'u-1'))
                .rejects.toThrow('not found');
        });
        it('should skip categoryId validation when not provided', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish());
            db.dish.update.mockResolvedValue(makeDish());
            mockDiff.mockReturnValue({});
            await dishService.update('d-1', { description: 'X' }, 'u-1');
            expect(db.dishCategory.findUnique).not.toHaveBeenCalled();
        });
        it('should accept valid categoryId', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish());
            db.dishCategory.findUnique.mockResolvedValue({ id: 'cat-2', name: 'Główne' });
            db.dish.update.mockResolvedValue(makeDish({ categoryId: 'cat-2' }));
            mockDiff.mockReturnValue({ categoryId: { old: 'cat-1', new: 'cat-2' } });
            await dishService.update('d-1', { categoryId: 'cat-2' }, 'u-1');
            expect(db.dish.update).toHaveBeenCalled();
        });
        it('should audit when changes exist', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish());
            db.dish.update.mockResolvedValue(makeDish({ name: 'New' }));
            mockDiff.mockReturnValue({ name: { old: 'Rosół', new: 'New' } });
            await dishService.update('d-1', { name: 'New' }, 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalled();
        });
        it('should skip audit when no changes', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish());
            db.dish.update.mockResolvedValue(makeDish());
            mockDiff.mockReturnValue({});
            await dishService.update('d-1', { name: 'Rosół' }, 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).not.toHaveBeenCalled();
        });
    });
    // ═══ toggleActive ═══
    describe('toggleActive()', () => {
        it('should throw when not found', async () => {
            db.dish.findUnique.mockResolvedValue(null);
            await expect(dishService.toggleActive('bad', 'u-1')).rejects.toThrow('not found');
        });
        it('should deactivate active dish', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish({ isActive: true }));
            db.dish.update.mockResolvedValue(makeDish({ isActive: false }));
            const result = await dishService.toggleActive('d-1', 'u-1');
            expect(db.dish.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: false } }));
        });
        it('should activate inactive dish', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish({ isActive: false }));
            db.dish.update.mockResolvedValue(makeDish({ isActive: true }));
            await dishService.toggleActive('d-1', 'u-1');
            expect(db.dish.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: true } }));
        });
        it('should log Aktywowano for true', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish({ isActive: false }));
            db.dish.update.mockResolvedValue(makeDish({ isActive: true }));
            await dishService.toggleActive('d-1', 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                details: expect.objectContaining({
                    description: expect.stringContaining('Aktywowano'),
                }),
            }));
        });
        it('should log Dezaktywowano for false', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish({ isActive: true }));
            db.dish.update.mockResolvedValue(makeDish({ isActive: false }));
            await dishService.toggleActive('d-1', 'u-1');
            const { logChange } = require('../../../utils/audit-logger');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                details: expect.objectContaining({
                    description: expect.stringContaining('Dezaktywowano'),
                }),
            }));
        });
    });
    // ═══ remove ═══
    describe('remove()', () => {
        it('should throw when not found', async () => {
            db.dish.findUnique.mockResolvedValue(null);
            await expect(dishService.remove('bad', 'u-1')).rejects.toThrow('not found');
        });
        it('should delete and audit', async () => {
            db.dish.findUnique.mockResolvedValue(makeDish());
            db.dish.delete.mockResolvedValue(undefined);
            await dishService.remove('d-1', 'u-1');
            expect(db.dish.delete).toHaveBeenCalledWith({ where: { id: 'd-1' } });
        });
    });
});
//# sourceMappingURL=dish.service.branches.test.js.map