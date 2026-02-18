/**
 * PackageCategoryService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    packageCategorySettings: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    menuPackage: { findUnique: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

import { packageCategoryService } from '../../../services/packageCategory.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;

const SETTING = {
  id: 'pcs-001', packageId: 'pkg-001', category: 'APPETIZER',
  minSelect: 1, maxSelect: 3, isRequired: true, isEnabled: true,
  displayOrder: 0, customLabel: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.packageCategorySettings.findMany.mockResolvedValue([SETTING]);
  mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(SETTING);
  mockPrisma.packageCategorySettings.create.mockResolvedValue(SETTING);
  mockPrisma.packageCategorySettings.update.mockResolvedValue(SETTING);
  mockPrisma.packageCategorySettings.delete.mockResolvedValue(SETTING);
  mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'pkg-001' });
});

describe('PackageCategoryService', () => {
  describe('getByPackageId()', () => {
    it('should return settings for package', async () => {
      const result = await packageCategoryService.getByPackageId('pkg-001');
      expect(result).toHaveLength(1);
    });
  });

  describe('getById()', () => {
    it('should return setting', async () => {
      const result = await packageCategoryService.getById('pcs-001');
      expect(result.category).toBe('APPETIZER');
    });

    it('should throw when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.getById('x')).rejects.toThrow(/not found/);
    });
  });

  describe('create()', () => {
    it('should create with defaults', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null); // no existing
      await packageCategoryService.create({ packageId: 'pkg-001', category: 'SOUP' as any, priceType: 'FIXED' } as any);
      const data = mockPrisma.packageCategorySettings.create.mock.calls[0][0].data;
      expect(data.minSelect).toBe(1);
      expect(data.isRequired).toBe(true);
    });

    it('should throw when already exists', async () => {
      await expect(packageCategoryService.create({
        packageId: 'pkg-001', category: 'APPETIZER' as any,
      } as any)).rejects.toThrow(/already exists/);
    });
  });

  describe('update()', () => {
    it('should update setting', async () => {
      await packageCategoryService.update('pcs-001', { maxSelect: 5 });
      expect(mockPrisma.packageCategorySettings.update).toHaveBeenCalledTimes(1);
    });

    it('should throw when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.update('x', { maxSelect: 5 })).rejects.toThrow(/not found/);
    });
  });

  describe('bulkUpdate()', () => {
    it('should update existing settings', async () => {
      const result = await packageCategoryService.bulkUpdate('pkg-001', {
        settings: [{ category: 'APPETIZER' as any, maxSelect: 5 }],
      });
      expect(mockPrisma.packageCategorySettings.update).toHaveBeenCalled();
    });
  });

  describe('delete()', () => {
    it('should delete and return success', async () => {
      const result = await packageCategoryService.delete('pcs-001');
      expect(result.success).toBe(true);
    });
  });
});
