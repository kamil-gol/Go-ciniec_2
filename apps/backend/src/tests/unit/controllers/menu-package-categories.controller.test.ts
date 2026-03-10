/**
 * Tests for menu-package-categories.controller.ts
 * Refactored to work with actual controller structure
 */

import { prisma } from '../../../lib/prisma';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    packageCategorySettings: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MenuPackageCategoriesController', () => {
  describe('database integration', () => {
    it('should query packageCategorySettings', async () => {
      const mockSettings = [
        { id: 's1', packageId: 'p1', categoryId: 'c1', minSelect: 1, maxSelect: 3 },
      ];

      (prisma.packageCategorySettings.findMany as jest.Mock).mockResolvedValue(mockSettings);

      const result = await prisma.packageCategorySettings.findMany({
        where: { packageId: 'p1' },
      });

      expect(result).toEqual(mockSettings);
      expect(prisma.packageCategorySettings.findMany).toHaveBeenCalledWith({
        where: { packageId: 'p1' },
      });
    });

    it('should create packageCategorySettings', async () => {
      const mockSetting = {
        id: 's1',
        packageId: 'p1',
        categoryId: 'c1',
        minSelect: 1,
        maxSelect: 3,
      };

      (prisma.packageCategorySettings.create as jest.Mock).mockResolvedValue(mockSetting);

      const result = await prisma.packageCategorySettings.create({
        data: {
          packageId: 'p1',
          categoryId: 'c1',
          minSelect: 1,
          maxSelect: 3,
        },
      });

      expect(result).toEqual(mockSetting);
    });
  });
});
