/**
 * Unit tests for menuSnapshot.service.ts
 * Covers: createSnapshot, replaceSnapshot, calculatePriceBreakdown,
 *         getSnapshotByReservationId, updateSnapshot, deleteSnapshot,
 *         hasSnapshot, getSnapshotStatistics, getPopularOptions, getPopularPackages
 * Issue: #98
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
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { menuSnapshotService } from '@services/menuSnapshot.service';

const mockPkg = {
  id: 'pkg-1', menuTemplateId: 'tmpl-1', name: 'Gold',
  description: 'Pakiet Gold', shortDescription: 'Gold',
  pricePerAdult: { toNumber: () => 250 },
  pricePerChild: { toNumber: () => 150 },
  pricePerToddler: { toNumber: () => 0 },
  includedItems: ['Zupa', 'Drugie'],
  color: '#gold', icon: 'star',
  menuTemplate: {
    id: 'tmpl-1', name: 'Menu 2026', variant: 'standard',
    eventType: { id: 'evt-1', name: 'Wesele' },
  },
};

const mockOption = {
  id: 'opt-1', name: 'Bar otwarty', description: 'Open bar',
  category: 'DRINKS', priceType: 'PER_PERSON' as const,
  priceAmount: { toNumber: () => 50 }, icon: 'wine',
};

const mockSnapshotData = {
  templateId: 'tmpl-1', templateName: 'Menu 2026', templateVariant: 'standard',
  eventTypeName: 'Wesele', packageId: 'pkg-1', packageName: 'Gold',
  packageDescription: 'Pakiet Gold',
  pricePerAdult: 250, pricePerChild: 150, pricePerToddler: 0,
  includedItems: ['Zupa', 'Drugie'], packageColor: '#gold', packageIcon: 'star',
  selectedOptions: [
    { optionId: 'opt-1', name: 'Bar otwarty', description: 'Open bar' as string | null,
      category: 'DRINKS', priceType: 'PER_PERSON' as const, priceAmount: 50, quantity: 1, icon: 'wine' as string | null }
  ],
  dishSelections: [],
};

const mockSnapshot = {
  id: 'snap-1', reservationId: 'res-1',
  menuTemplateId: 'tmpl-1', packageId: 'pkg-1',
  menuData: mockSnapshotData,
  packagePrice: 27500, optionsPrice: 5500, totalMenuPrice: 33000,
  adultsCount: 80, childrenCount: 20, toddlersCount: 10,
  selectedAt: new Date(),
};

describe('MenuSnapshotService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ═══════════ calculatePriceBreakdown ═══════════
  describe('calculatePriceBreakdown', () => {
    it('should calculate correct breakdown for PER_PERSON option', () => {
      const result = menuSnapshotService.calculatePriceBreakdown(mockSnapshotData, 80, 20, 10);

      expect(result.packageCost.adults.total).toBe(20000);   // 80*250
      expect(result.packageCost.children.total).toBe(3000);  // 20*150
      expect(result.packageCost.toddlers.total).toBe(0);     // 10*0
      expect(result.packageCost.subtotal).toBe(23000);
      // PER_PERSON: 50 * 110 guests * 1 qty = 5500
      expect(result.optionsCost[0].total).toBe(5500);
      expect(result.optionsSubtotal).toBe(5500);
      expect(result.totalMenuPrice).toBe(28500);
    });

    it('should calculate FLAT price options correctly', () => {
      const dataWithFlat = {
        ...mockSnapshotData,
        selectedOptions: [{
          optionId: 'opt-2', name: 'Dekoracja', description: null as string | null,
          category: 'DECOR', priceType: 'FLAT' as const, priceAmount: 1000, quantity: 2, icon: null as string | null,
        }],
      };
      const result = menuSnapshotService.calculatePriceBreakdown(dataWithFlat, 50, 0, 0);
      expect(result.optionsCost[0].total).toBe(2000);   // 1000 * 2 qty
    });

    it('should calculate FREE options as 0', () => {
      const dataWithFree = {
        ...mockSnapshotData,
        selectedOptions: [{
          optionId: 'opt-3', name: 'Parking', description: null as string | null,
          category: 'OTHER', priceType: 'FREE' as const, priceAmount: 0, quantity: 1, icon: null as string | null,
        }],
      };
      const result = menuSnapshotService.calculatePriceBreakdown(dataWithFree, 50, 0, 0);
      expect(result.optionsCost[0].total).toBe(0);
      expect(result.totalMenuPrice).toBe(12500);  // 50*250 + 0
    });

    it('should handle zero guests', () => {
      const result = menuSnapshotService.calculatePriceBreakdown(mockSnapshotData, 0, 0, 0);
      expect(result.packageCost.subtotal).toBe(0);
      expect(result.optionsCost[0].total).toBe(0);  // PER_PERSON * 0 guests
      expect(result.totalMenuPrice).toBe(0);
    });
  });

  // ═══════════ createSnapshot ═══════════
  describe('createSnapshot', () => {
    it('should create snapshot with enriched data', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPkg);
      mockPrisma.menuOption.findMany.mockResolvedValue([mockOption]);
      mockPrisma.dish.findMany.mockResolvedValue([]);
      mockPrisma.dishCategory.findMany.mockResolvedValue([]);
      mockPrisma.reservationMenuSnapshot.create.mockResolvedValue(mockSnapshot);

      const result = await menuSnapshotService.createSnapshot({
        reservationId: 'res-1', packageId: 'pkg-1',
        selectedOptions: [{ optionId: 'opt-1', quantity: 1 }],
        adultsCount: 80, childrenCount: 20, toddlersCount: 10,
      });

      expect(result.snapshot.id).toBe('snap-1');
      expect(result.priceBreakdown).toBeDefined();
      expect(mockPrisma.reservationMenuSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reservationId: 'res-1', menuTemplateId: 'tmpl-1', packageId: 'pkg-1',
          })
        })
      );
    });

    it('should throw when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      await expect(menuSnapshotService.createSnapshot({
        reservationId: 'res-1', packageId: 'x',
        selectedOptions: [], adultsCount: 50, childrenCount: 0, toddlersCount: 0,
      })).rejects.toThrow('Package not found');
    });

    it('should throw when some options not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPkg);
      mockPrisma.menuOption.findMany.mockResolvedValue([]);  // returns 0 but 1 requested

      await expect(menuSnapshotService.createSnapshot({
        reservationId: 'res-1', packageId: 'pkg-1',
        selectedOptions: [{ optionId: 'opt-missing', quantity: 1 }],
        adultsCount: 50, childrenCount: 0, toddlersCount: 0,
      })).rejects.toThrow('Some options not found');
    });

    it('should enrich dish selections with names from DB', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPkg);
      mockPrisma.menuOption.findMany.mockResolvedValue([]);
      mockPrisma.dish.findMany.mockResolvedValue([{ id: 'dish-1', name: 'Rosół', description: 'Zupa', allergens: [] }]);
      mockPrisma.dishCategory.findMany.mockResolvedValue([{ id: 'cat-1', name: 'Zupy', icon: 'soup' }]);
      mockPrisma.reservationMenuSnapshot.create.mockResolvedValue(mockSnapshot);

      await menuSnapshotService.createSnapshot({
        reservationId: 'res-1', packageId: 'pkg-1',
        selectedOptions: [], adultsCount: 50, childrenCount: 0, toddlersCount: 0,
        dishSelections: [{ categoryId: 'cat-1', dishes: [{ dishId: 'dish-1', quantity: 1 }] }],
      });

      expect(mockPrisma.dish.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: ['dish-1'] } } })
      );
    });
  });

  // ═══════════ replaceSnapshot ═══════════
  describe('replaceSnapshot', () => {
    it('should delete existing and create new snapshot', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(mockSnapshot);
      mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue({});
      mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPkg);
      mockPrisma.menuOption.findMany.mockResolvedValue([]);
      mockPrisma.reservationMenuSnapshot.create.mockResolvedValue(mockSnapshot);

      await menuSnapshotService.replaceSnapshot({
        reservationId: 'res-1', packageId: 'pkg-1',
        selectedOptions: [], adultsCount: 50, childrenCount: 0, toddlersCount: 0,
      });

      expect(mockPrisma.reservationMenuSnapshot.delete).toHaveBeenCalledWith(
        { where: { reservationId: 'res-1' } }
      );
      expect(mockPrisma.reservationMenuSnapshot.create).toHaveBeenCalled();
    });

    it('should create new even when no existing snapshot', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.menuPackage.findUnique.mockResolvedValue(mockPkg);
      mockPrisma.menuOption.findMany.mockResolvedValue([]);
      mockPrisma.reservationMenuSnapshot.create.mockResolvedValue(mockSnapshot);

      await menuSnapshotService.replaceSnapshot({
        reservationId: 'res-1', packageId: 'pkg-1',
        selectedOptions: [], adultsCount: 50, childrenCount: 0, toddlersCount: 0,
      });

      expect(mockPrisma.reservationMenuSnapshot.delete).not.toHaveBeenCalled();
      expect(mockPrisma.reservationMenuSnapshot.create).toHaveBeenCalled();
    });
  });

  // ═══════════ getSnapshotByReservationId ═══════════
  describe('getSnapshotByReservationId', () => {
    it('should return snapshot with recalculated breakdown', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(mockSnapshot);
      const result = await menuSnapshotService.getSnapshotByReservationId('res-1');
      expect(result.snapshot.id).toBe('snap-1');
      expect(result.priceBreakdown.totalMenuPrice).toBeDefined();
    });

    it('should throw when snapshot not found', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      await expect(menuSnapshotService.getSnapshotByReservationId('x'))
        .rejects.toThrow('Menu snapshot not found');
    });
  });

  // ═══════════ updateSnapshot ═══════════
  describe('updateSnapshot', () => {
    it('should update guest counts and recalculate prices', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(mockSnapshot);
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({ ...mockSnapshot, adultsCount: 100 });

      const result = await menuSnapshotService.updateSnapshot('res-1', { adultsCount: 100 });

      expect(mockPrisma.reservationMenuSnapshot.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reservationId: 'res-1' },
          data: expect.objectContaining({ adultsCount: 100 }),
        })
      );
    });

    it('should throw when snapshot not found', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      await expect(menuSnapshotService.updateSnapshot('x', { adultsCount: 50 }))
        .rejects.toThrow('Snapshot not found');
    });
  });

  // ═══════════ deleteSnapshot ═══════════
  describe('deleteSnapshot', () => {
    it('should delete snapshot', async () => {
      mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue(mockSnapshot);
      await menuSnapshotService.deleteSnapshot('res-1');
      expect(mockPrisma.reservationMenuSnapshot.delete).toHaveBeenCalledWith(
        { where: { reservationId: 'res-1' } }
      );
    });
  });

  // ═══════════ hasSnapshot ═══════════
  describe('hasSnapshot', () => {
    it('should return true when snapshot exists', async () => {
      mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(1);
      expect(await menuSnapshotService.hasSnapshot('res-1')).toBe(true);
    });

    it('should return false when no snapshot', async () => {
      mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(0);
      expect(await menuSnapshotService.hasSnapshot('res-1')).toBe(false);
    });
  });

  // ═══════════ getSnapshotStatistics ═══════════
  describe('getSnapshotStatistics', () => {
    it('should return aggregated statistics', async () => {
      mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(50);
      mockPrisma.reservationMenuSnapshot.aggregate.mockResolvedValue({
        _avg: { totalMenuPrice: { toNumber: () => 30000 }, packagePrice: { toNumber: () => 25000 }, optionsPrice: { toNumber: () => 5000 } }
      });

      const result = await menuSnapshotService.getSnapshotStatistics();
      expect(result.totalSnapshots).toBe(50);
      expect(result.averageMenuPrice).toBe(30000);
      expect(result.averagePackagePrice).toBe(25000);
      expect(result.averageOptionsPrice).toBe(5000);
    });
  });

  // ═══════════ getPopularOptions ═══════════
  describe('getPopularOptions', () => {
    it('should return options sorted by popularity', async () => {
      mockPrisma.reservationMenuSnapshot.findMany.mockResolvedValue([
        { menuData: { ...mockSnapshotData, selectedOptions: [{ optionId: 'opt-1', name: 'Bar' }, { optionId: 'opt-2', name: 'Dekor' }] } },
        { menuData: { ...mockSnapshotData, selectedOptions: [{ optionId: 'opt-1', name: 'Bar' }] } },
      ]);

      const result = await menuSnapshotService.getPopularOptions(10);
      expect(result[0].optionId).toBe('opt-1');
      expect(result[0].count).toBe(2);
      expect(result[1].optionId).toBe('opt-2');
      expect(result[1].count).toBe(1);
    });
  });

  // ═══════════ getPopularPackages ═══════════
  describe('getPopularPackages', () => {
    it('should return packages sorted by popularity', async () => {
      mockPrisma.reservationMenuSnapshot.findMany.mockResolvedValue([
        { menuData: { ...mockSnapshotData, packageId: 'pkg-1', packageName: 'Gold' } },
        { menuData: { ...mockSnapshotData, packageId: 'pkg-1', packageName: 'Gold' } },
        { menuData: { ...mockSnapshotData, packageId: 'pkg-2', packageName: 'Silver' } },
      ]);

      const result = await menuSnapshotService.getPopularPackages(10);
      expect(result[0].packageId).toBe('pkg-1');
      expect(result[0].count).toBe(2);
      expect(result[1].packageId).toBe('pkg-2');
      expect(result[1].count).toBe(1);
    });
  });
});
