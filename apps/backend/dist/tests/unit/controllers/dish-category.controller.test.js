/**
 * DishCategoryController — Unit Tests
 * This controller uses prisma directly, so we mock the prisma client.
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        dishCategory: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));
import dishCategoryController from '../../../controllers/dish-category.controller';
import { prisma } from '../../../lib/prisma';
const db = prisma.dishCategory;
const tx = prisma.$transaction;
const req = (overrides = {}) => ({
    body: {}, params: {}, query: {},
    ...overrides,
});
const res = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
};
beforeEach(() => jest.clearAllMocks());
describe('DishCategoryController', () => {
    describe('getCategories()', () => {
        it('should return categories', async () => {
            db.findMany.mockResolvedValue([{ id: 'c-1', name: 'Zupy' }]);
            const response = res();
            await dishCategoryController.getCategories(req(), response);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
    describe('getCategoryById()', () => {
        it('should return category', async () => {
            db.findUnique.mockResolvedValue({ id: 'c-1', name: 'Zupy' });
            const response = res();
            await dishCategoryController.getCategoryById(req({ params: { id: 'c-1' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
        });
        it('should throw 404 when not found', async () => {
            db.findUnique.mockResolvedValue(null);
            await expect(dishCategoryController.getCategoryById(req({ params: { id: 'x' } }), res()))
                .rejects.toMatchObject({ statusCode: 404 });
        });
    });
    describe('getCategoryBySlug()', () => {
        it('should return category by slug', async () => {
            db.findUnique.mockResolvedValue({ id: 'c-1', slug: 'ZUPY' });
            const response = res();
            await dishCategoryController.getCategoryBySlug(req({ params: { slug: 'zupy' } }), response);
            expect(db.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'ZUPY' } }));
        });
        it('should throw 404 when not found', async () => {
            db.findUnique.mockResolvedValue(null);
            await expect(dishCategoryController.getCategoryBySlug(req({ params: { slug: 'xxx' } }), res()))
                .rejects.toMatchObject({ statusCode: 404 });
        });
    });
    describe('createCategory()', () => {
        it('should throw 400 when slug missing', async () => {
            await expect(dishCategoryController.createCategory(req({ body: { name: 'Zupy' } }), res()))
                .rejects.toMatchObject({ statusCode: 400 });
        });
        it('should throw 409 on duplicate slug', async () => {
            db.findUnique.mockResolvedValue({ id: 'existing' });
            await expect(dishCategoryController.createCategory(req({ body: { slug: 'zupy', name: 'Zupy' } }), res())).rejects.toMatchObject({ statusCode: 409 });
        });
        it('should return 201 on success', async () => {
            db.findUnique.mockResolvedValue(null);
            db.create.mockResolvedValue({ id: 'c-new', slug: 'ZUPY', name: 'Zupy' });
            const response = res();
            await dishCategoryController.createCategory(req({ body: { slug: 'zupy', name: 'Zupy' } }), response);
            expect(response.status).toHaveBeenCalledWith(201);
        });
    });
    describe('deleteCategory()', () => {
        it('should throw 404 when not found', async () => {
            db.findUnique.mockResolvedValue(null);
            await expect(dishCategoryController.deleteCategory(req({ params: { id: 'x' } }), res()))
                .rejects.toMatchObject({ statusCode: 404 });
        });
        it('should throw 409 when has dishes', async () => {
            db.findUnique.mockResolvedValue({ id: 'c-1', name: 'Zupy', _count: { dishes: 5 } });
            await expect(dishCategoryController.deleteCategory(req({ params: { id: 'c-1' } }), res()))
                .rejects.toMatchObject({ statusCode: 409 });
        });
        it('should return 200 on success', async () => {
            db.findUnique.mockResolvedValue({ id: 'c-1', name: 'Zupy', _count: { dishes: 0 } });
            tx.mockResolvedValue(undefined);
            const response = res();
            await dishCategoryController.deleteCategory(req({ params: { id: 'c-1' } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
    describe('reorderCategories()', () => {
        it('should throw 400 when ids not array', async () => {
            await expect(dishCategoryController.reorderCategories(req({ body: { ids: 'bad' } }), res()))
                .rejects.toMatchObject({ statusCode: 400 });
        });
        it('should return 200 on success', async () => {
            tx.mockResolvedValue(undefined);
            const response = res();
            await dishCategoryController.reorderCategories(req({ body: { ids: ['c-1', 'c-2'] } }), response);
            expect(response.status).toHaveBeenCalledWith(200);
        });
    });
});
//# sourceMappingURL=dish-category.controller.test.js.map