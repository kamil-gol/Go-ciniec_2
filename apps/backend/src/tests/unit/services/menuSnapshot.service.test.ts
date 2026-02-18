/**
 * MenuSnapshotService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    dish: { findMany: jest.fn() },
    dishCategory: { findMany: jest.fn() },
    reservationMenuSnapshot: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

import { menuSnapshotService } from '../../../services/menuSnapshot.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;

const MENU_DATA = {
  templateId: 'tpl-001', templateName: 'Wesele Classic', templateVariant: 'STANDARD',
  eventTypeName: 'Wesele', packageId: 'pkg-001', packageName: 'Gold',
  packageDescription: 'Pakiet Gold', pricePerAdult: 250, pricePerChild: 150,
  pricePerToddler: 0, includedItems: ['Alkohol', 'Deser'],
  packageColor: '#FFD700', packageIcon: null,
  selectedOptions: [
    { optionId: 'opt-001', name: 'Fontanna', description: null, category: 'DECORATION',
      priceType: 'FLAT', priceAmount: 500, quantity: 1, icon: null },
    { optionId: 'opt-002', name: 'DJ', description: null, category: 'MUSIC',
      priceType: 'PER_PERSON', priceAmount: 20, quantity: 1, icon: null },
  ],
  dishSelections: [],
};

const SNAPSHOT = {
  id: 'snap-001', reservationId: 'res-001', menuTemplateId: 'tpl-001', packageId: 'pkg-001',
  menuData: MENU_DATA, packagePrice: 25000, optionsPrice: 2500,
  totalMenuPrice: 27500, adultsCount: 80, childrenCount: 20, toddlersCount: 5,
  selectedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(SNAPSHOT);
  mockPrisma.reservationMenuSnapshot.create.mockResolvedValue(SNAPSHOT);
  mockPrisma.reservationMenuSnapshot.update.mockResolvedValue(SNAPSHOT);
  mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue(SNAPSHOT);
  mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(5);
  mockPrisma.reservationMenuSnapshot.aggregate.mockResolvedValue({
    _avg: { totalMenuPrice: { toNumber: () => 27500 }, packagePrice: { toNumber: () => 25000 }, optionsPrice: { toNumber: () => 2500 } },
  });
  mockPrisma.reservationMenuSnapshot.findMany.mockResolvedValue([SNAPSHOT]);
});

describe('MenuSnapshotService', () => {
  describe('calculatePriceBreakdown()', () => {
    it('should calculate correct breakdown with FLAT and PER_PERSON options', () => {
      const result = menuSnapshotService.calculatePriceBreakdown(MENU_DATA as any, 80, 20, 5);
      // Package: 80*250 + 20*150 + 5*0 = 20000+3000+0 = 23000
      expect(result.packageCost.subtotal).toBe(23000);
      // Options: FLAT 500*1 + PER_PERSON 20*105*1 = 500+2100 = 2600
      expect(result.optionsSubtotal).toBe(2600);
      expect(result.totalMenuPrice).toBe(25600);
    });
  });

  describe('getSnapshotByReservationId()', () => {
    it('should return snapshot with breakdown', async () => {
      const result = await menuSnapshotService.getSnapshotByReservationId('res-001');
      expect(result.snapshot.id).toBe('snap-001');
      expect(result.priceBreakdown).toBeDefined();
    });

    it('should throw when not found', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      await expect(menuSnapshotService.getSnapshotByReservationId('x')).rejects.toThrow(/not found/);
    });
  });

  describe('updateSnapshot()', () => {
    it('should recalculate prices on guest count change', async () => {
      const result = await menuSnapshotService.updateSnapshot('res-001', { adultsCount: 100 });
      expect(mockPrisma.reservationMenuSnapshot.update).toHaveBeenCalledTimes(1);
      expect(result.priceBreakdown).toBeDefined();
    });

    it('should throw when snapshot not found', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      await expect(menuSnapshotService.updateSnapshot('x', {})).rejects.toThrow(/not found/);
    });
  });

  describe('deleteSnapshot()', () => {
    it('should delete snapshot', async () => {
      await menuSnapshotService.deleteSnapshot('res-001');
      expect(mockPrisma.reservationMenuSnapshot.delete).toHaveBeenCalledWith({ where: { reservationId: 'res-001' } });
    });
  });

  describe('hasSnapshot()', () => {
    it('should return true when count > 0', async () => {
      expect(await menuSnapshotService.hasSnapshot('res-001')).toBe(true);
    });

    it('should return false when count is 0', async () => {
      mockPrisma.reservationMenuSnapshot.count.mockResolvedValue(0);
      expect(await menuSnapshotService.hasSnapshot('res-001')).toBe(false);
    });
  });

  describe('getPopularPackages()', () => {
    it('should aggregate packages from snapshots', async () => {
      const result = await menuSnapshotService.getPopularPackages(5);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Gold');
      expect(result[0].count).toBe(1);
    });
  });
});
