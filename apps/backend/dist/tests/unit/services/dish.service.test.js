/**
 * Unit tests for dish.service.ts
 * Covers: findAll, findOne, getByIds, findByCategory, create, update, toggleActive, remove
 * Issue: #98
 */
const mockPrisma = {
    dish: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    dishCategory: {
        findUnique: jest.fn(),
    },
};
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@utils/audit-logger', () => ({
    logChange: jest.fn(),
    diffObjects: jest.fn().mockReturnValue({ name: { old: 'A', new: 'B' } }),
}));
import dishService from '@services/dish.service';
import { logChange } from '@utils/audit-logger';
const userId = 'user-1';
const mockCategory = { id: 'cat-1', name: 'Zupy', displayOrder: 0, icon: 'soup' };
const mockDish = {
    id: 'dish-1', name: 'Rosół', description: 'Tradycyjny rosół',
    categoryId: 'cat-1', allergens: ['gluten'], isActive: true,
    priceModifier: 0, imageUrl: null, thumbnailUrl: null,
    category: mockCategory,
};
describe('DishService', () => {
    beforeEach(() => jest.clearAllMocks());
    describe('findAll', () => {
        it('should return all dishes with filters', async () => {
            mockPrisma.dish.findMany.mockResolvedValue([mockDish]);
            const result = await dishService.findAll({ categoryId: 'cat-1', isActive: true });
            expect(result).toHaveLength(1);
            expect(mockPrisma.dish.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ categoryId: 'cat-1', isActive: true }) }));
        });
        it('should apply search filter with OR', async () => {
            mockPrisma.dish.findMany.mockResolvedValue([]);
            await dishService.findAll({ search: 'ros' });
            expect(mockPrisma.dish.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }));
        });
    });
    describe('findOne', () => {
        it('should return dish with category', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(mockDish);
            const result = await dishService.findOne('dish-1');
            expect(result.id).toBe('dish-1');
        });
        it('should return null when not found', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(null);
            const result = await dishService.findOne('x');
            expect(result).toBeNull();
        });
    });
    describe('getByIds', () => {
        it('should return dishes by IDs', async () => {
            mockPrisma.dish.findMany.mockResolvedValue([mockDish]);
            const result = await dishService.getByIds(['dish-1']);
            expect(result).toHaveLength(1);
        });
    });
    describe('findByCategory', () => {
        it('should return dishes for category', async () => {
            mockPrisma.dish.findMany.mockResolvedValue([mockDish]);
            const result = await dishService.findByCategory('cat-1');
            expect(result).toHaveLength(1);
        });
    });
    describe('create', () => {
        it('should create dish and log activity', async () => {
            mockPrisma.dish.findFirst.mockResolvedValue(null);
            mockPrisma.dishCategory.findUnique.mockResolvedValue(mockCategory);
            mockPrisma.dish.create.mockResolvedValue(mockDish);
            const result = await dishService.create({ name: 'Rosół', categoryId: 'cat-1' }, userId);
            expect(result.id).toBe('dish-1');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'DISH' }));
        });
        it('should throw when dish name already exists', async () => {
            mockPrisma.dish.findFirst.mockResolvedValue(mockDish);
            await expect(dishService.create({ name: 'Rosół', categoryId: 'cat-1' }, userId))
                .rejects.toThrow(/already exists/);
        });
        it('should throw when category not found', async () => {
            mockPrisma.dish.findFirst.mockResolvedValue(null);
            mockPrisma.dishCategory.findUnique.mockResolvedValue(null);
            await expect(dishService.create({ name: 'Nowe', categoryId: 'x' }, userId))
                .rejects.toThrow(/Category.*not found/);
        });
    });
    describe('update', () => {
        it('should update dish and log changes', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(mockDish);
            mockPrisma.dish.findFirst.mockResolvedValue(null);
            mockPrisma.dish.update.mockResolvedValue({ ...mockDish, name: 'Żurek' });
            const result = await dishService.update('dish-1', { name: 'Żurek' }, userId);
            expect(result.name).toBe('Żurek');
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entityType: 'DISH' }));
        });
        it('should throw when dish not found', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(null);
            await expect(dishService.update('x', { name: 'Y' }, userId)).rejects.toThrow(/not found/);
        });
        it('should throw on name conflict with another dish', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(mockDish);
            mockPrisma.dish.findFirst.mockResolvedValue({ id: 'dish-2', name: 'Żurek' });
            await expect(dishService.update('dish-1', { name: 'Żurek' }, userId))
                .rejects.toThrow(/already exists/);
        });
        it('should throw when new category not found', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(mockDish);
            mockPrisma.dishCategory.findUnique.mockResolvedValue(null);
            await expect(dishService.update('dish-1', { categoryId: 'x' }, userId))
                .rejects.toThrow(/Category.*not found/);
        });
    });
    describe('toggleActive', () => {
        it('should toggle active state and log', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(mockDish);
            mockPrisma.dish.update.mockResolvedValue({ ...mockDish, isActive: false });
            const result = await dishService.toggleActive('dish-1', userId);
            expect(result.isActive).toBe(false);
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'TOGGLE_ACTIVE', entityType: 'DISH' }));
        });
        it('should throw when dish not found', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(null);
            await expect(dishService.toggleActive('x', userId)).rejects.toThrow(/not found/);
        });
    });
    describe('remove', () => {
        it('should delete dish and log', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(mockDish);
            mockPrisma.dish.delete.mockResolvedValue(undefined);
            await dishService.remove('dish-1', userId);
            expect(mockPrisma.dish.delete).toHaveBeenCalledWith({ where: { id: 'dish-1' } });
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE', entityType: 'DISH' }));
        });
        it('should throw when dish not found', async () => {
            mockPrisma.dish.findUnique.mockResolvedValue(null);
            await expect(dishService.remove('x', userId)).rejects.toThrow(/not found/);
        });
    });
});
//# sourceMappingURL=dish.service.test.js.map