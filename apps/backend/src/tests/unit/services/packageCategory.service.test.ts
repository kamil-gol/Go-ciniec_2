/**
 * Unit tests for packageCategory.service.ts
 * Covers: getByPackageId, getById, create (duplicate guard), update, bulkUpdate, delete
 * Issue: #98
 * FIX: spolonizowane komunikaty błędów
 */

const mockPrisma = {
  packageCategorySettings: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  menuPackage: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { packageCategoryService } from '@services/packageCategory.service';

const mockSetting = {
  id: 'pcs-1', packageId: 'pkg-1', category: 'SOUP',
  minSelect: 1, maxSelect: 2, isRequired: true, isEnabled: true,
  displayOrder: 0, customLabel: null,
};

describe('PackageCategoryService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getByPackageId', () => {
    it('should return settings for package', async () => {
      mockPrisma.packageCategorySettings.findMany.mockResolvedValue([mockSetting]);
      const result = await packageCategoryService.getByPackageId('pkg-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.packageCategorySettings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { packageId: 'pkg-1' }, orderBy: { displayOrder: 'asc' } })
      );
    });
  });

  describe('getById', () => {
    it('should return setting', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(mockSetting);
      const result = await packageCategoryService.getById('pcs-1');
      expect(result.id).toBe('pcs-1');
    });

    it('should throw when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.getById('x')).rejects.toThrow('Nie znaleziono ustawień kategorii');
    });
  });

  describe('create', () => {
    it('should create category setting', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      mockPrisma.packageCategorySettings.create.mockResolvedValue(mockSetting);
      const result = await packageCategoryService.create({
        packageId: 'pkg-1', category: 'SOUP' as any,
      });
      expect(result.id).toBe('pcs-1');
    });

    it('should throw when duplicate category for package', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(mockSetting);
      await expect(packageCategoryService.create({ packageId: 'pkg-1', category: 'SOUP' as any }))
        .rejects.toThrow(/już istnieją/);
    });
  });

  describe('update', () => {
    it('should update existing setting', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(mockSetting);
      mockPrisma.packageCategorySettings.update.mockResolvedValue({ ...mockSetting, maxSelect: 5 });
      const result = await packageCategoryService.update('pcs-1', { maxSelect: 5 });
      expect(result.maxSelect).toBe(5);
    });

    it('should throw when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.update('x', { maxSelect: 5 }))
        .rejects.toThrow('Nie znaleziono ustawień kategorii');
    });
  });

  describe('bulkUpdate', () => {
    it('should update existing category settings for package', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(mockSetting);
      mockPrisma.packageCategorySettings.update.mockResolvedValue({ ...mockSetting, maxSelect: 3 });

      const result = await packageCategoryService.bulkUpdate('pkg-1', {
        settings: [{ category: 'SOUP' as any, maxSelect: 3 }],
      });

      expect(result).toHaveLength(1);
      expect(mockPrisma.packageCategorySettings.update).toHaveBeenCalled();
    });

    it('should skip non-existing categories (no upsert)', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);

      const result = await packageCategoryService.bulkUpdate('pkg-1', {
        settings: [{ category: 'NONEXISTENT' as any, maxSelect: 3 }],
      });

      expect(result).toHaveLength(0);
      expect(mockPrisma.packageCategorySettings.update).not.toHaveBeenCalled();
    });

    it('should throw when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.bulkUpdate('x', { settings: [] }))
        .rejects.toThrow('Nie znaleziono pakietu menu');
    });
  });

  describe('delete', () => {
    it('should delete setting', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(mockSetting);
      mockPrisma.packageCategorySettings.delete.mockResolvedValue(undefined);
      const result = await packageCategoryService.delete('pcs-1');
      expect(result.success).toBe(true);
    });

    it('should throw when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.delete('x')).rejects.toThrow('Nie znaleziono ustawień kategorii');
    });
  });
});
