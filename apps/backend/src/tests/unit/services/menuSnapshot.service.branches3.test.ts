/**
 * MenuSnapshotService — Branch coverage phase 3
 * Covers:
 *   - line 53: empty allDishIds (ternary false branch in Promise.all)
 *   - line 226: duplicate option counting in getPopularOptions
 *   - line 239: duplicate package counting in getPopularPackages
 */
const mockPrisma = {
  menuPackage: { findUnique: jest.fn() },
  menuOption: { findMany: jest.fn() },
  dish: { findMany: jest.fn() },
  dishCategory: { findMany: jest.fn() },
  reservationMenuSnapshot: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { MenuSnapshotService } from '../../../services/menuSnapshot.service';

const service = new MenuSnapshotService();

beforeEach(() => jest.clearAllMocks());

describe('MenuSnapshotService — branch coverage phase 3', () => {
  describe('createSnapshot — empty allDishIds (line 53)', () => {
    it('should skip dish.findMany when dishSelections have no dishes', async () => {
      const mockPkg = {
        id: 'pkg-1',
        menuTemplateId: 'tmpl-1',
        name: 'Package A',
        description: 'Desc',
        pricePerAdult: { toNumber: () => 100 },
        pricePerChild: { toNumber: () => 50 },
        pricePerToddler: { toNumber: () => 0 },
        includedItems: ['item1'],
        color: '#fff',
        icon: 'star',
        menuTemplate: {
          name: 'Template A',
          variant: 'STANDARD',
          eventType: { name: 'Wedding' },
        },
      };

      mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPkg);
      mockPrisma.menuOption.findMany.mockResolvedValue([]);
      mockPrisma.dishCategory.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Zupy', icon: '🍲' },
      ]);
      mockPrisma.reservationMenuSnapshot.create.mockResolvedValue({
        id: 'snap-1',
        reservationId: 'res-1',
        menuData: {},
        adultsCount: 10,
        childrenCount: 2,
        toddlersCount: 1,
      });

      await service.createSnapshot({
        reservationId: 'res-1',
        packageId: 'pkg-1',
        selectedOptions: [],
        dishSelections: [
          { categoryId: 'cat-1', dishes: [] },
        ],
        adultsCount: 10,
        childrenCount: 2,
        toddlersCount: 1,
      });

      // dish.findMany should NOT be called — allDishIds is empty
      expect(mockPrisma.dish.findMany).not.toHaveBeenCalled();
      // dishCategory.findMany SHOULD be called — allCategoryIds is non-empty
      expect(mockPrisma.dishCategory.findMany).toHaveBeenCalled();
      expect(mockPrisma.reservationMenuSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reservationId: 'res-1',
          }),
        })
      );
    });
  });

  describe('getPopularOptions — duplicate option counting (line 226)', () => {
    it('should increment count for options appearing in multiple snapshots', async () => {
      const makeSnapshot = (optionId: string, optionName: string) => ({
        menuData: {
          packageId: 'pkg-1',
          packageName: 'Pkg',
          selectedOptions: [{ optionId, name: optionName }],
        },
      });

      mockPrisma.reservationMenuSnapshot.findMany.mockResolvedValue([
        makeSnapshot('opt-1', 'Dekoracje'),
        makeSnapshot('opt-1', 'Dekoracje'), // same option → triggers existing-key branch
        makeSnapshot('opt-2', 'DJ'),
      ]);

      const result = await service.getPopularOptions(10);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ optionId: 'opt-1', count: 2 }),
          expect.objectContaining({ optionId: 'opt-2', count: 1 }),
        ])
      );
      // opt-1 should be first (sorted by count desc)
      expect(result[0].optionId).toBe('opt-1');
    });
  });

  describe('getPopularPackages — duplicate package counting (line 239)', () => {
    it('should increment count for packages appearing in multiple snapshots', async () => {
      mockPrisma.reservationMenuSnapshot.findMany.mockResolvedValue([
        { menuData: { packageId: 'pkg-A', packageName: 'Gold', selectedOptions: [] } },
        { menuData: { packageId: 'pkg-A', packageName: 'Gold', selectedOptions: [] } }, // duplicate → triggers existing-key branch
        { menuData: { packageId: 'pkg-B', packageName: 'Silver', selectedOptions: [] } },
      ]);

      const result = await service.getPopularPackages(10);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ packageId: 'pkg-A', count: 2 }),
          expect.objectContaining({ packageId: 'pkg-B', count: 1 }),
        ])
      );
      expect(result[0].packageId).toBe('pkg-A');
    });
  });
});
