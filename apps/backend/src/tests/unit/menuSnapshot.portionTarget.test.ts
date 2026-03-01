/**
 * Unit tests for #166: portionTarget enrichment in MenuSnapshotService.createSnapshot()
 * Mocks Prisma to verify portionTarget flows from PackageCategorySettings into snapshot JSONB.
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    menuPackage: { findUnique: jest.fn() },
    packageCategorySettings: { findMany: jest.fn() },
    dish: { findMany: jest.fn() },
    dishCategory: { findMany: jest.fn() },
    reservationMenuSnapshot: { create: jest.fn() },
  },
}));

jest.mock('@/i18n/pl', () => ({
  MENU_CRUD: { PACKAGE_NOT_FOUND: 'Pakiet nie znaleziony' },
}));

import { MenuSnapshotService } from '@services/menuSnapshot.service';
import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;

describe('MenuSnapshotService — portionTarget enrichment (#166)', () => {
  let service: MenuSnapshotService;

  const basePkg = {
    id: 'pkg-1',
    name: 'Pakiet Złoty',
    description: 'Pakiet premium',
    menuTemplateId: 'tpl-1',
    pricePerAdult: { toNumber: () => 150 },
    pricePerChild: { toNumber: () => 80 },
    pricePerToddler: { toNumber: () => 0 },
    includedItems: ['Przystawka', 'Deser'],
    color: '#gold',
    icon: 'star',
    menuTemplate: {
      id: 'tpl-1',
      name: 'Wesele 2026',
      variant: 'standard',
      eventType: { id: 'evt-1', name: 'Wesele' },
    },
  };

  const baseInput = {
    reservationId: 'res-1',
    packageId: 'pkg-1',
    selectedOptions: [],
    dishSelections: [
      { categoryId: 'cat-soup', dishes: [{ dishId: 'dish-1', quantity: 1 }] },
      { categoryId: 'cat-dessert', dishes: [{ dishId: 'dish-2', quantity: 2 }] },
    ],
    adultsCount: 40,
    childrenCount: 15,
    toddlersCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MenuSnapshotService();

    mockPrisma.menuPackage.findUnique.mockResolvedValue(basePkg);
    mockPrisma.dish.findMany.mockResolvedValue([
      { id: 'dish-1', name: 'Rosół', description: 'Klasyczny', allergens: [] },
      { id: 'dish-2', name: 'Szarlotka', description: 'Z lodami', allergens: ['gluten'] },
    ]);
    mockPrisma.dishCategory.findMany.mockResolvedValue([
      { id: 'cat-soup', name: 'Zupy', icon: '🍲' },
      { id: 'cat-dessert', name: 'Desery', icon: '🍰' },
    ]);
    mockPrisma.reservationMenuSnapshot.create.mockImplementation(async ({ data }: any) => ({
      id: 'snap-1',
      ...data,
    }));
  });

  it('should include portionTarget from PackageCategorySettings in snapshot', async () => {
    mockPrisma.packageCategorySettings.findMany.mockResolvedValue([
      { categoryId: 'cat-soup', portionTarget: 'ALL' },
      { categoryId: 'cat-dessert', portionTarget: 'ADULTS_ONLY' },
    ]);

    await service.createSnapshot(baseInput);

    const createCall = mockPrisma.reservationMenuSnapshot.create.mock.calls[0][0];
    const menuData = createCall.data.menuData;

    expect(menuData.dishSelections[0].portionTarget).toBe('ALL');
    expect(menuData.dishSelections[1].portionTarget).toBe('ADULTS_ONLY');
  });

  it('should default portionTarget to ALL when no settings exist', async () => {
    mockPrisma.packageCategorySettings.findMany.mockResolvedValue([]);

    await service.createSnapshot(baseInput);

    const createCall = mockPrisma.reservationMenuSnapshot.create.mock.calls[0][0];
    const menuData = createCall.data.menuData;

    expect(menuData.dishSelections[0].portionTarget).toBe('ALL');
    expect(menuData.dishSelections[1].portionTarget).toBe('ALL');
  });

  it('should handle CHILDREN_ONLY portionTarget', async () => {
    mockPrisma.packageCategorySettings.findMany.mockResolvedValue([
      { categoryId: 'cat-soup', portionTarget: 'CHILDREN_ONLY' },
      { categoryId: 'cat-dessert', portionTarget: 'CHILDREN_ONLY' },
    ]);

    await service.createSnapshot(baseInput);

    const createCall = mockPrisma.reservationMenuSnapshot.create.mock.calls[0][0];
    const menuData = createCall.data.menuData;

    expect(menuData.dishSelections[0].portionTarget).toBe('CHILDREN_ONLY');
    expect(menuData.dishSelections[1].portionTarget).toBe('CHILDREN_ONLY');
  });

  it('should default to ALL for categories missing from settings', async () => {
    // Only cat-soup has settings, cat-dessert is missing
    mockPrisma.packageCategorySettings.findMany.mockResolvedValue([
      { categoryId: 'cat-soup', portionTarget: 'ADULTS_ONLY' },
    ]);

    await service.createSnapshot(baseInput);

    const createCall = mockPrisma.reservationMenuSnapshot.create.mock.calls[0][0];
    const menuData = createCall.data.menuData;

    expect(menuData.dishSelections[0].portionTarget).toBe('ADULTS_ONLY');
    expect(menuData.dishSelections[1].portionTarget).toBe('ALL');
  });
});
