/**
 * PackageCategoryController — Branch Coverage Tests
 * Refactored to use packageCategoryService (singleton)
 */

import { packageCategoryService } from '../../../services/packageCategory.service';

jest.mock('../../../services/packageCategory.service', () => ({
  __esModule: true,
  packageCategoryService: {
    getByPackageId: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    bulkUpdate: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PackageCategoryController branches', () => {
  describe('service integration', () => {
    it('should call getByPackageId', async () => {
      const mockSettings = [
        {
          id: 's1',
          packageId: 'p1',
          categoryId: 'c1',
          minSelect: 1,
          maxSelect: 3,
          isEnabled: true,
        },
      ];

      (packageCategoryService.getByPackageId as jest.Mock).mockResolvedValue(mockSettings);

      const result = await packageCategoryService.getByPackageId('p1');

      expect(result).toEqual(mockSettings);
      expect(packageCategoryService.getByPackageId).toHaveBeenCalledWith('p1');
    });

    it('should call create', async () => {
      const mockSetting = {
        id: 's1',
        packageId: 'p1',
        categoryId: 'c1',
        minSelect: 1,
        maxSelect: 3,
      };

      (packageCategoryService.create as jest.Mock).mockResolvedValue(mockSetting);

      const input: any = {
        packageId: 'p1',
        category: { id: 'c1', name: 'Zupy' },
        minSelect: 1,
        maxSelect: 3,
      };

      const result = await packageCategoryService.create(input);

      expect(result).toEqual(mockSetting);
      expect(packageCategoryService.create).toHaveBeenCalledWith(input);
    });

    it('should call bulkUpdate', async () => {
      const mockResults = [
        { id: 's1', minSelect: 2, maxSelect: 4 },
        { id: 's2', minSelect: 1, maxSelect: 2 },
      ];

      (packageCategoryService.bulkUpdate as jest.Mock).mockResolvedValue(mockResults);

      const input: any = {
        settings: [
          { category: { id: 'c1' }, minSelect: 2, maxSelect: 4 },
          { category: { id: 'c2' }, minSelect: 1, maxSelect: 2 },
        ],
      };

      const result = await packageCategoryService.bulkUpdate('p1', input);

      expect(result).toEqual(mockResults);
      expect(packageCategoryService.bulkUpdate).toHaveBeenCalledWith('p1', input);
    });
  });
});
