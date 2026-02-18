/**
 * DishCategoryController — Branch Coverage Tests
 * Target: 54.16% → ~90%+ branches
 * Covers: updateCategory (all branches), createCategory defaults
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

const req = (overrides: any = {}): any => ({ body: {}, params: {}, query: {}, ...overrides });
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('DishCategoryController — branches', () => {

  // ═══════════════════════════════════
  // updateCategory — ALL branches
  // ═══════════════════════════════════
  describe('updateCategory()', () => {
    const EXISTING = { id: 'c-1', slug: 'ZUPY', name: 'Zupy', icon: '🍲', color: '#f00', displayOrder: 0, isActive: true };

    it('should throw 404 when category not found', async () => {
      db.findUnique.mockResolvedValue(null);
      await expect(dishCategoryController.updateCategory(req({ params: { id: 'x' }, body: {} }), res()))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('should update all fields when provided', async () => {
      db.findUnique.mockResolvedValue(EXISTING);
      db.findFirst.mockResolvedValue(null); // no slug conflict
      db.update.mockResolvedValue({ ...EXISTING, slug: 'DESERY', name: 'Desery' });
      const response = res();
      await dishCategoryController.updateCategory(
        req({ params: { id: 'c-1' }, body: { slug: 'desery', name: 'Desery', icon: '🍰', color: '#0f0', displayOrder: 5, isActive: false } }),
        response
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(db.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ slug: 'DESERY', name: 'Desery', icon: '🍰', color: '#0f0', displayOrder: 5, isActive: false })
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
        req({ params: { id: 'c-1' }, body: { icon: '🥗', color: '#00f' } }), res()
      );
      const updateCall = db.update.mock.calls[0][0];
      expect(updateCall.data).toEqual({ icon: '🥗', color: '#00f' });
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

  // ═══════════════════════════════════
  // createCategory — default values
  // ═══════════════════════════════════
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
        req({ body: { slug: 'test', name: 'Test', icon: '🍕', color: '#abc' } }), res()
      );
      const createCall = db.create.mock.calls[0][0];
      expect(createCall.data.icon).toBe('🍕');
      expect(createCall.data.color).toBe('#abc');
    });
  });
});
