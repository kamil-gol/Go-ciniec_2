/**
 * PackageCategoryController — Unit Tests
 * Uses new PrismaClient() directly — mock @prisma/client.
 */
const mockPrisma = {
  menuPackage: {
    findUnique: jest.fn(),
  },
  dishCategory: {
    findUnique: jest.fn(),
  },
  packageCategorySettings: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('@/validation/menu.validation', () => ({
  bulkUpdateCategorySettingsSchema: {
    safeParse: jest.fn((d: any) => ({ success: true, data: d })),
  },
}));

import { packageCategoryController } from '../../../controllers/packageCategory.controller';

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

describe('PackageCategoryController', () => {
  describe('getByPackage()', () => {
    it('should return 404 when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      const response = res();
      await packageCategoryController.getByPackage(req({ params: { packageId: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return categories', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        id: 'p-1', name: 'Gold',
        categorySettings: [{
          id: 'cs-1', categoryId: 'cat-1', minSelect: 1, maxSelect: 3,
          isRequired: true, customLabel: null, displayOrder: 0,
          category: { name: 'Zupy', slug: 'ZUPY', icon: '🍲', color: '#f00',
            dishes: [{ id: 'd-1', name: 'Pomidorowa', description: null, allergens: [], displayOrder: 0 }]
          },
        }],
      });
      const response = res();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await packageCategoryController.getByPackage(req({ params: { packageId: 'p-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getById()', () => {
    it('should return 404', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      const response = res();
      await packageCategoryController.getById(req({ params: { id: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create()', () => {
    it('should return 400 when missing fields', async () => {
      const response = res();
      await packageCategoryController.create(req({ body: {} }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      const response = res();
      await packageCategoryController.create(
        req({ body: { packageId: 'x', categoryId: 'cat-1', minSelect: 1, maxSelect: 3 } }), response
      );
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 201 on success', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrisma.dishCategory.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      mockPrisma.packageCategorySettings.create.mockResolvedValue({ id: 'cs-new' });
      const response = res();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await packageCategoryController.create(
        req({ body: { packageId: 'p-1', categoryId: 'cat-1', minSelect: 1, maxSelect: 3 } }), response
      );
      expect(response.status).toHaveBeenCalledWith(201);
      consoleSpy.mockRestore();
    });
  });

  describe('update()', () => {
    it('should return 400 when min > max', async () => {
      const response = res();
      await packageCategoryController.update(
        req({ params: { id: 'cs-1' }, body: { minSelect: 5, maxSelect: 2 } }), response
      );
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      const response = res();
      await packageCategoryController.update(
        req({ params: { id: 'x' }, body: { minSelect: 1, maxSelect: 5 } }), response
      );
      expect(response.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete()', () => {
    it('should return 404 when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      const response = res();
      await packageCategoryController.delete(req({ params: { id: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 200', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs-1' });
      mockPrisma.packageCategorySettings.delete.mockResolvedValue(undefined);
      const response = res();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await packageCategoryController.delete(req({ params: { id: 'cs-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      consoleSpy.mockRestore();
    });
  });
});
