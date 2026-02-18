/**
 * MenuSnapshotService — Branch coverage phase 3
 * Covers:
 *   - line 53: empty allDishIds (ternary false branch in Promise.all)
 *   - line 226: duplicate option counting in getPopularOptions
 *   - line 239: duplicate package counting in getPopularPackages
 */
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    dish: { findMany: jest.fn() },
    dishCategory: { findMany: jest.fn() },
    reservationMenuSnapshot: {
      create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
      count: jest.fn(), aggregate: jest.fn(), delete: jest.fn(), update: jest.fn(),
    },
  },
}));

import { MenuSnapshotService } from '../../../services/menuSnapshot.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;
let service: MenuSnapshotService;

beforeEach(() => {
  jest.resetAllMocks();
  service = new MenuSnapshotService();
});

describe('MenuSnapshotService — createSnapshot empty allDishIds (line 53)', () => {
  it('should skip dish.findMany when dishSelections have no dishes', async () => {
    const mockPkg = {
      id: 'pkg-1', menuTemplateId: 'tmpl-1', name: 'Package A', description: 'Desc',
      pricePerAdult: { toNumber: () => 100 }, pricePerChild: { toNumber: () => 50 },
      pricePerToddler: { toNumber: () => 0 }, includedItems: ['item1'],
      color: '#fff', icon: 'star',
      menuTemplate: { name: 'Template A', variant: 'STANDARD', eventType: { name: 'Wedding' } },
    };

    mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPkg);
    mockPrisma.menuOption.findMany.mockResolvedValue([]);
    mockPrisma.dishCategory.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Zupy', icon: '🍲' },
    ]);
    mockPrisma.reservationMenuSnapshot.create.mockResolvedValue({
      id: 'snap-1', reservationId: 'res-1', menuData: {},
      adultsCount: 10, childrenCount: 2, toddlersCount: 1,
    });

    await service.createSnapshot({
      reservationId: 'res-1', packageId: 'pkg-1', selectedOptions: [],
      dishSelections: [{ categoryId: 'cat-1', dishes: [] }],
      adultsCount: 10, childrenCount: 2, toddlersCount: 1,
    });

    expect(mockPrisma.dish.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.dishCategory.findMany).toHaveBeenCalled();
    expect(mockPrisma.reservationMenuSnapshot.create).toHaveBeenCalled();
  });
});

describe('MenuSnapshotService — getPopularOptions duplicate counting (line 226)', () => {
  it('should increment count for options appearing in multiple snapshots', async () => {
    mockPrisma.reservationMenuSnapshot.findMany.mockResolvedValue([
      { menuData: { selectedOptions: [{ optionId: 'opt-1', name: 'Dekoracje' }] } },
      { menuData: { selectedOptions: [{ optionId: 'opt-1', name: 'Dekoracje' }] } },
      { menuData: { selectedOptions: [{ optionId: 'opt-2', name: 'DJ' }] } },
    ]);

    const result = await service.getPopularOptions(10);
    expect(result[0]).toEqual(expect.objectContaining({ optionId: 'opt-1', count: 2 }));
    expect(result[1]).toEqual(expect.objectContaining({ optionId: 'opt-2', count: 1 }));
  });
});

describe('MenuSnapshotService — getPopularPackages duplicate counting (line 239)', () => {
  it('should increment count for packages appearing in multiple snapshots', async () => {
    mockPrisma.reservationMenuSnapshot.findMany.mockResolvedValue([
      { menuData: { packageId: 'pkg-A', packageName: 'Gold', selectedOptions: [] } },
      { menuData: { packageId: 'pkg-A', packageName: 'Gold', selectedOptions: [] } },
      { menuData: { packageId: 'pkg-B', packageName: 'Silver', selectedOptions: [] } },
    ]);

    const result = await service.getPopularPackages(10);
    expect(result[0]).toEqual(expect.objectContaining({ packageId: 'pkg-A', count: 2 }));
    expect(result[1]).toEqual(expect.objectContaining({ packageId: 'pkg-B', count: 1 }));
  });
});
