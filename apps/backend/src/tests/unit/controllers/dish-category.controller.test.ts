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

const db = prisma.dishCategory as any;
const tx = prisma.$transaction as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
  ...overrides,
});
const res = () => {
  const r: any = {};
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
      await expect(dishCategoryController.createCategory(
        req({ body: { slug: 'zupy', name: 'Zupy' } }), res()
      )).rejects.toMatchObject({ statusCode: 409 });
    });

    it('should return 201 on success', async () => {
      db.findUnique.mockResolvedValue(null);
      db.create.mockResolvedValue({ id: 'c-new', slug: 'ZUPY', name: 'Zupy' });
      const response = res();
      await dishCategoryController.createCategory(
        req({ body: { slug: 'zupy', name: 'Zupy' } }), response
      );
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

  describe('edge cases / branch coverage', () => {
    describe('updateCategory()', () => {
      const EXISTING = { id: 'c-1', slug: 'ZUPY', name: 'Zupy', icon: '\uD83C\uDF72', color: '#f00', displayOrder: 0, isActive: true };

      it('should throw 404 when category not found', async () => {
        db.findUnique.mockResolvedValue(null);
        await expect(dishCategoryController.updateCategory(req({ params: { id: 'x' }, body: {} }), res()))
          .rejects.toMatchObject({ statusCode: 404 });
      });

      it('should update all fields when provided', async () => {
        db.findUnique.mockResolvedValue(EXISTING);
        db.findFirst.mockResolvedValue(null);
        db.update.mockResolvedValue({ ...EXISTING, slug: 'DESERY', name: 'Desery' });
        const response = res();
        await dishCategoryController.updateCategory(
          req({ params: { id: 'c-1' }, body: { slug: 'desery', name: 'Desery', icon: '\uD83C\uDF70', color: '#0f0', displayOrder: 5, isActive: false } }),
          response
        );
        expect(response.status).toHaveBeenCalledWith(200);
        expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({ slug: 'DESERY', name: 'Desery', icon: '\uD83C\uDF70', color: '#0f0', displayOrder: 5, isActive: false })
        }));
      });

      it('should throw 409 when new slug conflicts with another category', async () => {
        db.findUnique.mockResolvedValue(EXISTING);
        db.findFirst.mockResolvedValue({ id: 'c-2', slug: 'DESERY' });
        await expect(dishCategoryController.updateCategory(
          req({ params: { id: 'c-1' }, body: { slug: 'desery' } }), res()
        )).rejects.toMatchObject({ statusCode: 409 });
      });

      it('should skip slug conflict check when slug unchanged', async () => {
        db.findUnique.mockResolvedValue(EXISTING);
        db.update.mockResolvedValue(EXISTING);
        const response = res();
        await dishCategoryController.updateCategory(
          req({ params: { id: 'c-1' }, body: { slug: 'ZUPY' } }), response
        );
        expect(db.findFirst).not.toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(200);
      });

      it('should skip slug conflict check when slug not provided', async () => {
        db.findUnique.mockResolvedValue(EXISTING);
        db.update.mockResolvedValue({ ...EXISTING, name: 'Updated' });
        const response = res();
        await dishCategoryController.updateCategory(
          req({ params: { id: 'c-1' }, body: { name: 'Updated' } }), response
        );
        expect(db.findFirst).not.toHaveBeenCalled();
      });

      it('should update only name when only name provided', async () => {
        db.findUnique.mockResolvedValue(EXISTING);
        db.update.mockResolvedValue({ ...EXISTING, name: 'New Name' });
        await dishCategoryController.updateCategory(
          req({ params: { id: 'c-1' }, body: { name: 'New Name' } }), res()
        );
        const updateCall = db.update.mock.calls[0][0];
        expect(updateCall.data).toEqual({ name: 'New Name' });
      });

      it('should update only icon and color when provided', async () => {
        db.findUnique.mockResolvedValue(EXISTING);
        db.update.mockResolvedValue(EXISTING);
        await dishCategoryController.updateCategory(
          req({ params: { id: 'c-1' }, body: { icon: '\uD83E\uDD57', color: '#00f' } }), res()
        );
        const updateCall = db.update.mock.calls[0][0];
        expect(updateCall.data).toEqual({ icon: '\uD83E\uDD57', color: '#00f' });
      });

      it('should update displayOrder alone', async () => {
        db.findUnique.mockResolvedValue(EXISTING);
        db.update.mockResolvedValue(EXISTING);
        await dishCategoryController.updateCategory(
          req({ params: { id: 'c-1' }, body: { displayOrder: 10 } }), res()
        );
        expect(db.update.mock.calls[0][0].data).toEqual({ displayOrder: 10 });
      });

      it('should update isActive alone', async () => {
        db.findUnique.mockResolvedValue(EXISTING);
        db.update.mockResolvedValue(EXISTING);
        await dishCategoryController.updateCategory(
          req({ params: { id: 'c-1' }, body: { isActive: false } }), res()
        );
        expect(db.update.mock.calls[0][0].data).toEqual({ isActive: false });
      });
    });

    describe('createCategory() — defaults', () => {
      it('should use default displayOrder=0 and isActive=true', async () => {
        db.findUnique.mockResolvedValue(null);
        db.create.mockResolvedValue({ id: 'c-new', slug: 'TEST', name: 'Test' });
        const response = res();
        await dishCategoryController.createCategory(
          req({ body: { slug: 'test', name: 'Test' } }), response
        );
        const createCall = db.create.mock.calls[0][0];
        expect(createCall.data.displayOrder).toBe(0);
        expect(createCall.data.isActive).toBe(true);
      });

      it('should use provided displayOrder and isActive', async () => {
        db.findUnique.mockResolvedValue(null);
        db.create.mockResolvedValue({ id: 'c-new', slug: 'TEST', name: 'Test' });
        const response = res();
        await dishCategoryController.createCategory(
          req({ body: { slug: 'test', name: 'Test', displayOrder: 5, isActive: false } }), response
        );
        const createCall = db.create.mock.calls[0][0];
        expect(createCall.data.displayOrder).toBe(5);
        expect(createCall.data.isActive).toBe(false);
      });

      it('should throw 400 when name missing', async () => {
        await expect(dishCategoryController.createCategory(req({ body: { slug: 'test' } }), res()))
          .rejects.toMatchObject({ statusCode: 400 });
      });

      it('should include icon and color in creation', async () => {
        db.findUnique.mockResolvedValue(null);
        db.create.mockResolvedValue({ id: 'c-new' });
        await dishCategoryController.createCategory(
          req({ body: { slug: 'test', name: 'Test', icon: '\uD83C\uDF55', color: '#abc' } }), res()
        );
        const createCall = db.create.mock.calls[0][0];
        expect(createCall.data.icon).toBe('\uD83C\uDF55');
        expect(createCall.data.color).toBe('#abc');
      });
    });
  });
});
