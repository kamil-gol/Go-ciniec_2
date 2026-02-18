/**
 * PackageCategory Service — Branch coverage tests
 * Covers: update (not found, line 77), bulkUpdate (existing=null skip, line 101)
 */

const mockPrisma = {
  packageCategorySettings: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  menuPackage: { findUnique: jest.fn() },
};

jest.mock('../../../lib/prisma', () => ({ prisma: mockPrisma }));

import { packageCategoryService } from '../../../services/packageCategory.service';

describe('PackageCategoryService branches', () => {
  beforeEach(() => jest.clearAllMocks());

  // ===== update — not found =====
  describe('update', () => {
    it('should throw when setting not found (line 77)', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.update('x', { minSelect: 2 })).rejects.toThrow('not found');
    });

    it('should update when setting exists', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs1' });
      mockPrisma.packageCategorySettings.update.mockResolvedValue({ id: 'cs1', minSelect: 3 });
      const result = await packageCategoryService.update('cs1', { minSelect: 3 });
      expect(result.minSelect).toBe(3);
    });
  });

  // ===== bulkUpdate — non-existing setting skip =====
  describe('bulkUpdate', () => {
    it('should throw when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.bulkUpdate('p1', { settings: [] })).rejects.toThrow('not found');
    });

    it('should skip settings that do not exist (line 101 — existing=null)', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);  // no existing
      const results = await packageCategoryService.bulkUpdate('p1', {
        settings: [{ category: 'SOUP' as any, minSelect: 1, maxSelect: 3 }],
      });
      expect(results).toEqual([]);  // skipped, not updated
      expect(mockPrisma.packageCategorySettings.update).not.toHaveBeenCalled();
    });

    it('should update when setting exists', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs1' });
      mockPrisma.packageCategorySettings.update.mockResolvedValue({ id: 'cs1', minSelect: 2 });
      const results = await packageCategoryService.bulkUpdate('p1', {
        settings: [{ category: 'SOUP' as any, minSelect: 2 }],
      });
      expect(results).toHaveLength(1);
    });
  });

  // ===== getById — not found =====
  describe('getById', () => {
    it('should throw when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.getById('x')).rejects.toThrow('not found');
    });
  });

  // ===== delete — not found =====
  describe('delete', () => {
    it('should throw when not found', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      await expect(packageCategoryService.delete('x')).rejects.toThrow('not found');
    });
  });

  // ===== create — already exists =====
  describe('create', () => {
    it('should throw when already exists', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(packageCategoryService.create({
        packageId: 'p1', category: 'SOUP' as any,
      })).rejects.toThrow('already exists');
    });

    it('should create with default values', async () => {
      mockPrisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      mockPrisma.packageCategorySettings.create.mockResolvedValue({ id: 'new' });
      const result = await packageCategoryService.create({
        packageId: 'p1', category: 'SOUP' as any,
      });
      expect(mockPrisma.packageCategorySettings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          minSelect: 1, maxSelect: 1, isRequired: true, isEnabled: true, displayOrder: 0, customLabel: null,
        }),
      });
    });
  });
});
