/**
 * PackageCategoryController — Comprehensive Unit Tests
 */
const mockPrisma: any = {
  menuPackage: { findUnique: jest.fn() },
  packageCategorySettings: {
    findUnique: jest.fn(), create: jest.fn(), update: jest.fn(),
    delete: jest.fn(), deleteMany: jest.fn(),
  },
  dishCategory: { findUnique: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

jest.mock('../../../validation/menu.validation', () => ({
  bulkUpdateCategorySettingsSchema: {
    safeParse: jest.fn(),
  },
}));

import { packageCategoryController as ctrl } from '../../../controllers/packageCategory.controller';
import { bulkUpdateCategorySettingsSchema } from '../../../validation/menu.validation';

const safeParse = (bulkUpdateCategorySettingsSchema as any).safeParse as jest.Mock;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
  ...overrides,
});
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn();
  r.send = jest.fn();
  return r;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('PackageCategoryController', () => {
  // ========== getByPackage ==========
  describe('getByPackage()', () => {
    it('should return 404 when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      const response = res();
      await ctrl.getByPackage(req({ params: { packageId: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return categories with dishes', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        id: 'pkg-1', name: 'Gold',
        categorySettings: [{
          id: 'cs-1', categoryId: 'cat-1',
          category: { name: 'Zupy', slug: 'zupy', icon: 'soup', color: '#f00',
            dishes: [{ id: 'd-1', name: 'Pomidorowa', description: 'Opis', allergens: ['gluten'], displayOrder: 1 }] },
          minSelect: { toString: () => '1' }, maxSelect: { toString: () => '3' },
          isRequired: true, customLabel: null, displayOrder: 0,
        }],
      });
      const response = res();
      await ctrl.getByPackage(req({ params: { packageId: 'pkg-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ packageName: 'Gold' }) })
      );
    });

    it('should use customLabel when set', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        id: 'pkg-1', name: 'Gold',
        categorySettings: [{
          id: 'cs-1', categoryId: 'cat-1',
          category: { name: 'Zupy', slug: 'zupy', icon: null, color: null, dishes: [] },
          minSelect: { toString: () => '1' }, maxSelect: { toString: () => '2' },
          isRequired: false, customLabel: 'Nasze zupy', displayOrder: 1,
        }],
      });
      const response = res();
      await ctrl.getByPackage(req({ params: { packageId: 'pkg-1' } }), response);
      const data = response.json.mock.calls[0][0].data;
      expect(data.categories[0].customLabel).toBe('Nasze zupy');
    });

    it('should return 500 on error', async () => {
      mockPrisma.menuPackage.findUnique.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.getByPackage(req({ params: { packageId: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== getById ==========
  describe('getById()', () => {
    it('should return 404', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      const response = res();
      await ctrl.getById(req({ params: { id: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return setting', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs-1' });
      const response = res();
      await ctrl.getById(req({ params: { id: 'cs-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 'cs-1' } })
      );
    });

    it('should return 500 on error', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.getById(req({ params: { id: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== create ==========
  describe('create()', () => {
    it('should return 400 when packageId missing', async () => {
      const response = res();
      await ctrl.create(req({ body: { categoryId: 'c-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when categoryId missing', async () => {
      const response = res();
      await ctrl.create(req({ body: { packageId: 'p-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when minSelect > maxSelect', async () => {
      const response = res();
      await ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 5, maxSelect: 2 } }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      const response = res();
      await ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 1, maxSelect: 3 } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when category not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrisma.dishCategory.findUnique.mockResolvedValue(null);
      const response = res();
      await ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 1, maxSelect: 3 } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 when duplicate', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrisma.dishCategory.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'existing' });
      const response = res();
      await ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 1, maxSelect: 3 } }), response);
      expect(response.status).toHaveBeenCalledWith(409);
    });

    it('should return 201 on success with defaults', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrisma.dishCategory.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      mockPrisma.packageCategorySettings.create.mockResolvedValue({ id: 'cs-new' });
      const response = res();
      await ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(201);
    });

    it('should return 201 with explicit values', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrisma.dishCategory.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      mockPrisma.packageCategorySettings.create.mockResolvedValue({ id: 'cs-new' });
      const response = res();
      await ctrl.create(req({ body: {
        packageId: 'p-1', categoryId: 'c-1',
        minSelect: 2, maxSelect: 5, isRequired: false, isEnabled: false,
        displayOrder: 3, customLabel: 'Custom',
      } }), response);
      expect(response.status).toHaveBeenCalledWith(201);
      expect(mockPrisma.packageCategorySettings.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isRequired: false, isEnabled: false, customLabel: 'Custom' }) })
      );
    });

    it('should return 500 on error', async () => {
      mockPrisma.menuPackage.findUnique.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 1, maxSelect: 2 } }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== update ==========
  describe('update()', () => {
    it('should return 400 when minSelect > maxSelect', async () => {
      const response = res();
      await ctrl.update(req({ params: { id: 'cs-1' }, body: { minSelect: 5, maxSelect: 2 } }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      const response = res();
      await ctrl.update(req({ params: { id: 'x' }, body: { minSelect: 1 } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 200 on success', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs-1' });
      mockPrisma.packageCategorySettings.update.mockResolvedValue({ id: 'cs-1', minSelect: 2 });
      const response = res();
      await ctrl.update(req({ params: { id: 'cs-1' }, body: { minSelect: 2 } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should skip minSelect>maxSelect check when only one provided', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs-1' });
      mockPrisma.packageCategorySettings.update.mockResolvedValue({ id: 'cs-1' });
      const response = res();
      await ctrl.update(req({ params: { id: 'cs-1' }, body: { minSelect: 5 } }), response);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 500 on error', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.update(req({ params: { id: 'x' }, body: {} }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== delete ==========
  describe('delete()', () => {
    it('should return 404 when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      const response = res();
      await ctrl.delete(req({ params: { id: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 200 on success', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs-1' });
      mockPrisma.packageCategorySettings.delete.mockResolvedValue(undefined);
      const response = res();
      await ctrl.delete(req({ params: { id: 'cs-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 500 on error', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.delete(req({ params: { id: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== bulkUpdate ==========
  describe('bulkUpdate()', () => {
    it('should return 400 on validation failure', async () => {
      safeParse.mockReturnValue({ success: false, error: { errors: [{ path: ['x'], message: 'bad' }] } });
      const response = res();
      await ctrl.bulkUpdate(req({ params: { packageId: 'pkg-1' }, body: {} }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when package not found', async () => {
      safeParse.mockReturnValue({ success: true, data: { settings: [] } });
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      const response = res();
      await ctrl.bulkUpdate(req({ params: { packageId: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 200 with empty settings', async () => {
      safeParse.mockReturnValue({ success: true, data: { settings: [] } });
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      const response = res();
      await ctrl.bulkUpdate(req({ params: { packageId: 'pkg-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [] })
      );
    });

    it('should create settings in transaction', async () => {
      const settings = [
        { categoryId: 'c-1', minSelect: 1, maxSelect: 3, isRequired: true, isEnabled: true, displayOrder: 0 },
      ];
      safeParse.mockReturnValue({ success: true, data: { settings } });
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        mockPrisma.packageCategorySettings.create.mockResolvedValue({ id: 'cs-new' });
        return fn(mockPrisma);
      });
      const response = res();
      await ctrl.bulkUpdate(req({ params: { packageId: 'pkg-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should use defaults for optional fields', async () => {
      const settings = [
        { categoryId: 'c-1', minSelect: 1, maxSelect: 2 },
      ];
      safeParse.mockReturnValue({ success: true, data: { settings } });
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        mockPrisma.packageCategorySettings.create.mockResolvedValue({ id: 'cs-new' });
        return fn(mockPrisma);
      });
      const response = res();
      await ctrl.bulkUpdate(req({ params: { packageId: 'pkg-1' } }), response);
      expect(mockPrisma.packageCategorySettings.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isRequired: true, isEnabled: true, displayOrder: 0, customLabel: null }) })
      );
    });

    it('should return 500 on error', async () => {
      safeParse.mockReturnValue({ success: true, data: { settings: [] } });
      mockPrisma.menuPackage.findUnique.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.bulkUpdate(req({ params: { packageId: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });
});
