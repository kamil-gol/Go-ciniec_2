/**
 * MenuSnapshotService — Comprehensive Unit Tests
 * Targets: all branches including dishSelections enrichment,
 * price types (FLAT/PER_PERSON/FREE), replaceSnapshot existing/not,
 * and statistics/popular aggregations.
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    dish: { findMany: jest.fn() },
    dishCategory: { findMany: jest.fn() },
    reservationMenuSnapshot: {
      create: jest.fn(), findUnique: jest.fn(), update: jest.fn(),
      delete: jest.fn(), count: jest.fn(), findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

import { MenuSnapshotService, menuSnapshotService } from '../../../services/menuSnapshot.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;

// Decimal-like mock
const dec = (v: number) => ({ toNumber: () => v });

const PKG = {
  id: 'pkg-1', name: 'Gold', description: 'Premium', color: '#gold', icon: 'star',
  menuTemplateId: 'tmpl-1', includedItems: ['DJ', 'Dekoracje'],
  pricePerAdult: dec(200), pricePerChild: dec(100), pricePerToddler: dec(0),
  menuTemplate: {
    name: 'Wesele 2026', variant: 'STANDARD',
    eventType: { name: 'Wesele' },
  },
};

const OPT_FLAT = { id: 'opt-1', name: 'DJ Pro', description: 'Desc', category: 'MUSIC', priceType: 'FLAT', priceAmount: dec(500), icon: 'dj' };
const OPT_PP = { id: 'opt-2', name: 'Drink bar', description: null, category: 'DRINK', priceType: 'PER_PERSON', priceAmount: dec(50), icon: null };
const OPT_FREE = { id: 'opt-3', name: 'Parkingi', description: null, category: 'OTHER', priceType: 'FREE', priceAmount: dec(0), icon: null };

const BASE_INPUT = {
  reservationId: 'res-1',
  packageId: 'pkg-1',
  selectedOptions: [{ optionId: 'opt-1', quantity: 1 }],
  dishSelections: [],
  adultsCount: 50, childrenCount: 10, toddlersCount: 5,
};

const SNAPSHOT_ROW = {
  id: 'snap-1', reservationId: 'res-1',
  menuData: {
    templateId: 'tmpl-1', templateName: 'Wesele 2026', templateVariant: 'STANDARD',
    eventTypeName: 'Wesele', packageId: 'pkg-1', packageName: 'Gold',
    packageDescription: 'Premium', pricePerAdult: 200, pricePerChild: 100,
    pricePerToddler: 0, includedItems: ['DJ'], packageColor: '#gold', packageIcon: 'star',
    selectedOptions: [
      { optionId: 'opt-1', name: 'DJ Pro', description: 'Desc', category: 'MUSIC', priceType: 'FLAT', priceAmount: 500, quantity: 1, icon: 'dj' },
    ],
    dishSelections: [],
  },
  adultsCount: 50, childrenCount: 10, toddlersCount: 5,
  packagePrice: 11000, optionsPrice: 500, totalMenuPrice: 11500,
};

beforeEach(() => jest.clearAllMocks());

describe('MenuSnapshotService', () => {
  // ========== createSnapshot ==========
  describe('createSnapshot()', () => {
    it('should throw when package not found', async () => {
      db.menuPackage.findUnique.mockResolvedValue(null);
      await expect(menuSnapshotService.createSnapshot(BASE_INPUT)).rejects.toThrow('Package not found');
    });

    it('should throw when some options not found', async () => {
      db.menuPackage.findUnique.mockResolvedValue(PKG);
      db.menuOption.findMany.mockResolvedValue([]);  // 0 returned, expected 1
      await expect(menuSnapshotService.createSnapshot(BASE_INPUT)).rejects.toThrow('Some options not found');
    });

    it('should create snapshot with FLAT option (no dishSelections)', async () => {
      db.menuPackage.findUnique.mockResolvedValue(PKG);
      db.menuOption.findMany.mockResolvedValue([OPT_FLAT]);
      db.reservationMenuSnapshot.create.mockResolvedValue({ id: 'snap-new' });
      const result = await menuSnapshotService.createSnapshot(BASE_INPUT);
      expect(result.snapshot).toEqual({ id: 'snap-new' });
      expect(result.priceBreakdown.packageCost.subtotal).toBe(11000); // 50*200+10*100+5*0
      expect(result.priceBreakdown.optionsSubtotal).toBe(500); // FLAT 500*1
    });

    it('should handle empty selectedOptions', async () => {
      db.menuPackage.findUnique.mockResolvedValue(PKG);
      db.menuOption.findMany.mockResolvedValue([]);
      db.reservationMenuSnapshot.create.mockResolvedValue({ id: 'snap-new' });
      const input = { ...BASE_INPUT, selectedOptions: [] };
      const result = await menuSnapshotService.createSnapshot(input);
      expect(result.priceBreakdown.optionsSubtotal).toBe(0);
    });

    it('should enrich dishSelections with names from DB', async () => {
      db.menuPackage.findUnique.mockResolvedValue(PKG);
      db.menuOption.findMany.mockResolvedValue([]);
      db.dish.findMany.mockResolvedValue([
        { id: 'd-1', name: 'Pomidorowa', description: 'Opis', allergens: ['gluten'] },
      ]);
      db.dishCategory.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Zupy', icon: 'soup' },
      ]);
      db.reservationMenuSnapshot.create.mockResolvedValue({ id: 'snap-new' });

      const input = {
        ...BASE_INPUT,
        selectedOptions: [],
        dishSelections: [
          { categoryId: 'cat-1', dishes: [{ dishId: 'd-1', quantity: 1 }] },
        ],
      };
      const result = await menuSnapshotService.createSnapshot(input);
      const createCall = db.reservationMenuSnapshot.create.mock.calls[0][0];
      const snap = createCall.data.menuData;
      expect(snap.dishSelections[0].categoryName).toBe('Zupy');
      expect(snap.dishSelections[0].categoryIcon).toBe('soup');
      expect(snap.dishSelections[0].dishes[0].dishName).toBe('Pomidorowa');
      expect(snap.dishSelections[0].dishes[0].allergens).toEqual(['gluten']);
    });

    it('should use fallback names when dish/category not in DB', async () => {
      db.menuPackage.findUnique.mockResolvedValue(PKG);
      db.menuOption.findMany.mockResolvedValue([]);
      db.dish.findMany.mockResolvedValue([]);  // no dishes found
      db.dishCategory.findMany.mockResolvedValue([]);  // no categories found
      db.reservationMenuSnapshot.create.mockResolvedValue({ id: 'snap-new' });

      const input = {
        ...BASE_INPUT,
        selectedOptions: [],
        dishSelections: [
          { categoryId: 'cat-missing', dishes: [{ dishId: 'd-missing', quantity: 1 }] },
        ],
      };
      const result = await menuSnapshotService.createSnapshot(input);
      const snap = db.reservationMenuSnapshot.create.mock.calls[0][0].data.menuData;
      expect(snap.dishSelections[0].categoryName).toBe('Nieznana kategoria');
      expect(snap.dishSelections[0].categoryIcon).toBeNull();
      expect(snap.dishSelections[0].dishes[0].dishName).toBe('Nieznane danie');
      expect(snap.dishSelections[0].dishes[0].description).toBeNull();
      expect(snap.dishSelections[0].dishes[0].allergens).toEqual([]);
    });

    it('should handle null dishSelections', async () => {
      db.menuPackage.findUnique.mockResolvedValue(PKG);
      db.menuOption.findMany.mockResolvedValue([]);
      db.reservationMenuSnapshot.create.mockResolvedValue({ id: 'snap-new' });
      const input = { ...BASE_INPUT, selectedOptions: [], dishSelections: null as any };
      const result = await menuSnapshotService.createSnapshot(input);
      const snap = db.reservationMenuSnapshot.create.mock.calls[0][0].data.menuData;
      expect(snap.dishSelections).toEqual([]);
    });
  });

  // ========== replaceSnapshot ==========
  describe('replaceSnapshot()', () => {
    it('should delete existing and create new', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue({ id: 'old' });
      db.reservationMenuSnapshot.delete.mockResolvedValue(undefined);
      db.menuPackage.findUnique.mockResolvedValue(PKG);
      db.menuOption.findMany.mockResolvedValue([]);
      db.reservationMenuSnapshot.create.mockResolvedValue({ id: 'snap-new' });
      const input = { ...BASE_INPUT, selectedOptions: [] };
      await menuSnapshotService.replaceSnapshot(input);
      expect(db.reservationMenuSnapshot.delete).toHaveBeenCalled();
      expect(db.reservationMenuSnapshot.create).toHaveBeenCalled();
    });

    it('should skip delete when no existing snapshot', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      db.menuPackage.findUnique.mockResolvedValue(PKG);
      db.menuOption.findMany.mockResolvedValue([]);
      db.reservationMenuSnapshot.create.mockResolvedValue({ id: 'snap-new' });
      const input = { ...BASE_INPUT, selectedOptions: [] };
      await menuSnapshotService.replaceSnapshot(input);
      expect(db.reservationMenuSnapshot.delete).not.toHaveBeenCalled();
      expect(db.reservationMenuSnapshot.create).toHaveBeenCalled();
    });
  });

  // ========== calculatePriceBreakdown ==========
  describe('calculatePriceBreakdown()', () => {
    const menuData = (options: any[]) => ({
      pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
      selectedOptions: options,
    });

    it('should calculate FLAT price correctly', () => {
      const result = menuSnapshotService.calculatePriceBreakdown(
        menuData([{ name: 'DJ', priceType: 'FLAT', priceAmount: 500, quantity: 2 }]) as any,
        10, 5, 2
      );
      expect(result.optionsCost[0].total).toBe(1000); // 500 * 2
      expect(result.packageCost.adults.total).toBe(2000); // 10*200
      expect(result.packageCost.children.total).toBe(500); // 5*100
      expect(result.packageCost.toddlers.total).toBe(0);
    });

    it('should calculate PER_PERSON price correctly', () => {
      const result = menuSnapshotService.calculatePriceBreakdown(
        menuData([{ name: 'Bar', priceType: 'PER_PERSON', priceAmount: 50, quantity: 1 }]) as any,
        10, 5, 2
      );
      expect(result.optionsCost[0].total).toBe(850); // 50 * 17 guests * 1
      expect(result.optionsCost[0].quantity).toBe(17); // totalGuests
    });

    it('should calculate FREE option as 0', () => {
      const result = menuSnapshotService.calculatePriceBreakdown(
        menuData([{ name: 'Parking', priceType: 'FREE', priceAmount: 0, quantity: 1 }]) as any,
        10, 0, 0
      );
      expect(result.optionsCost[0].total).toBe(0);
    });

    it('should handle mixed option types', () => {
      const result = menuSnapshotService.calculatePriceBreakdown(
        menuData([
          { name: 'DJ', priceType: 'FLAT', priceAmount: 500, quantity: 1 },
          { name: 'Bar', priceType: 'PER_PERSON', priceAmount: 50, quantity: 1 },
          { name: 'Park', priceType: 'FREE', priceAmount: 0, quantity: 1 },
        ]) as any,
        10, 0, 0
      );
      expect(result.optionsSubtotal).toBe(1000); // 500 + 50*10 + 0
      expect(result.totalMenuPrice).toBe(3000); // 2000 pkg + 1000 opts
    });
  });

  // ========== getSnapshotByReservationId ==========
  describe('getSnapshotByReservationId()', () => {
    it('should throw when not found', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      await expect(menuSnapshotService.getSnapshotByReservationId('x')).rejects.toThrow('Menu snapshot not found');
    });

    it('should return snapshot with priceBreakdown', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(SNAPSHOT_ROW);
      const result = await menuSnapshotService.getSnapshotByReservationId('res-1');
      expect(result.snapshot).toBe(SNAPSHOT_ROW);
      expect(result.priceBreakdown.totalMenuPrice).toBe(11500);
    });
  });

  // ========== updateSnapshot ==========
  describe('updateSnapshot()', () => {
    it('should throw when not found', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      await expect(menuSnapshotService.updateSnapshot('x', {})).rejects.toThrow('Snapshot not found');
    });

    it('should use existing counts as defaults', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(SNAPSHOT_ROW);
      db.reservationMenuSnapshot.update.mockResolvedValue({ ...SNAPSHOT_ROW });
      const result = await menuSnapshotService.updateSnapshot('res-1', {});
      expect(db.reservationMenuSnapshot.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ adultsCount: 50, childrenCount: 10, toddlersCount: 5 }) })
      );
    });

    it('should override with provided counts', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(SNAPSHOT_ROW);
      db.reservationMenuSnapshot.update.mockResolvedValue({ ...SNAPSHOT_ROW });
      await menuSnapshotService.updateSnapshot('res-1', { adultsCount: 80 });
      expect(db.reservationMenuSnapshot.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ adultsCount: 80, childrenCount: 10 }) })
      );
    });
  });

  // ========== deleteSnapshot ==========
  describe('deleteSnapshot()', () => {
    it('should delete', async () => {
      db.reservationMenuSnapshot.delete.mockResolvedValue(undefined);
      await menuSnapshotService.deleteSnapshot('res-1');
      expect(db.reservationMenuSnapshot.delete).toHaveBeenCalledWith({ where: { reservationId: 'res-1' } });
    });
  });

  // ========== hasSnapshot ==========
  describe('hasSnapshot()', () => {
    it('should return true when count > 0', async () => {
      db.reservationMenuSnapshot.count.mockResolvedValue(1);
      expect(await menuSnapshotService.hasSnapshot('res-1')).toBe(true);
    });

    it('should return false when count === 0', async () => {
      db.reservationMenuSnapshot.count.mockResolvedValue(0);
      expect(await menuSnapshotService.hasSnapshot('res-1')).toBe(false);
    });
  });

  // ========== getSnapshotStatistics ==========
  describe('getSnapshotStatistics()', () => {
    it('should return stats with values', async () => {
      db.reservationMenuSnapshot.count.mockResolvedValue(42);
      db.reservationMenuSnapshot.aggregate.mockResolvedValue({
        _avg: { totalMenuPrice: dec(15000), packagePrice: dec(12000), optionsPrice: dec(3000) },
      });
      const stats = await menuSnapshotService.getSnapshotStatistics();
      expect(stats.totalSnapshots).toBe(42);
      expect(stats.averageMenuPrice).toBe(15000);
    });

    it('should fallback to 0 when aggregates are null', async () => {
      db.reservationMenuSnapshot.count.mockResolvedValue(0);
      db.reservationMenuSnapshot.aggregate.mockResolvedValue({
        _avg: { totalMenuPrice: null, packagePrice: null, optionsPrice: null },
      });
      const stats = await menuSnapshotService.getSnapshotStatistics();
      expect(stats.averageMenuPrice).toBe(0);
      expect(stats.averagePackagePrice).toBe(0);
      expect(stats.averageOptionsPrice).toBe(0);
    });
  });

  // ========== getPopularOptions ==========
  describe('getPopularOptions()', () => {
    it('should count and sort options across snapshots', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([
        { menuData: { selectedOptions: [
          { optionId: 'opt-1', name: 'DJ' },
          { optionId: 'opt-2', name: 'Bar' },
        ] } },
        { menuData: { selectedOptions: [
          { optionId: 'opt-1', name: 'DJ' },
        ] } },
      ]);
      const popular = await menuSnapshotService.getPopularOptions(10);
      expect(popular[0]).toEqual({ optionId: 'opt-1', name: 'DJ', count: 2 });
      expect(popular[1]).toEqual({ optionId: 'opt-2', name: 'Bar', count: 1 });
    });

    it('should respect limit', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([
        { menuData: { selectedOptions: [
          { optionId: 'opt-1', name: 'A' },
          { optionId: 'opt-2', name: 'B' },
          { optionId: 'opt-3', name: 'C' },
        ] } },
      ]);
      const popular = await menuSnapshotService.getPopularOptions(2);
      expect(popular).toHaveLength(2);
    });
  });

  // ========== getPopularPackages ==========
  describe('getPopularPackages()', () => {
    it('should count and sort packages across snapshots', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([
        { menuData: { packageId: 'pkg-1', packageName: 'Gold' } },
        { menuData: { packageId: 'pkg-1', packageName: 'Gold' } },
        { menuData: { packageId: 'pkg-2', packageName: 'Silver' } },
      ]);
      const popular = await menuSnapshotService.getPopularPackages(10);
      expect(popular[0]).toEqual({ packageId: 'pkg-1', name: 'Gold', count: 2 });
      expect(popular[1]).toEqual({ packageId: 'pkg-2', name: 'Silver', count: 1 });
    });

    it('should respect limit', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([
        { menuData: { packageId: 'pkg-1', packageName: 'A' } },
        { menuData: { packageId: 'pkg-2', packageName: 'B' } },
        { menuData: { packageId: 'pkg-3', packageName: 'C' } },
      ]);
      const popular = await menuSnapshotService.getPopularPackages(1);
      expect(popular).toHaveLength(1);
    });
  });
});
