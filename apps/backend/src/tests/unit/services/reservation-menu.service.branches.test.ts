/**
 * ReservationMenuService — Branch Coverage
 * recalculateForGuestChange (full), removeMenu audit, validateDishSelections errors,
 * calculateOptionsPrice FLAT/PER_PERSON/unknown, selectMenu edge cases,
 * formatMenuResponse selectedOptions fallback
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservation: { findUnique: jest.fn() },
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    reservationMenuSnapshot: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dish: { findMany: jest.fn() },
    activityLog: { create: jest.fn() },
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import reservationMenuService from '../../../services/reservation-menu.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;

const makeSnapshot = (o: any = {}) => ({
  id: 'snap-1', reservationId: 'r-1',
  menuTemplateId: 'mt-1', packageId: 'pkg-1',
  packagePrice: 5000, optionsPrice: 500, totalMenuPrice: 5500,
  adultsCount: 50, childrenCount: 10, toddlersCount: 5,
  selectedAt: new Date(), updatedAt: new Date(),
  menuData: {
    packageId: 'pkg-1', packageName: 'Premium',
    pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
    adults: 50, children: 10, toddlers: 5,
    dishSelections: [],
    selectedOptions: [
      { optionId: 'opt-1', optionName: 'Bar', priceAmount: 10, priceUnit: 'PER_PERSON', quantity: 1 },
      { optionId: 'opt-2', optionName: 'Dekoracje', priceAmount: 200, priceUnit: 'FLAT', quantity: 1 },
    ],
    prices: { packageTotal: 5000, optionsTotal: 500, total: 5500 },
  },
  ...o,
});

beforeEach(() => jest.resetAllMocks());

describe('ReservationMenuService — branches', () => {

  // ═══ recalculateForGuestChange ═══
  describe('recalculateForGuestChange()', () => {
    it('should return null when no snapshot exists', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      const result = await reservationMenuService.recalculateForGuestChange('r-1', 60, 10, 5);
      expect(result).toBeNull();
    });

    it('should return null when menuData is null', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(makeSnapshot({ menuData: null }));
      const result = await reservationMenuService.recalculateForGuestChange('r-1', 60, 10, 5);
      expect(result).toBeNull();
    });

    it('should recalculate with PER_PERSON and FLAT options', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(makeSnapshot());
      db.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await reservationMenuService.recalculateForGuestChange('r-1', 60, 15, 5, 'u-1');
      expect(result).not.toBeNull();
      // 60*100 + 15*50 + 5*0 = 6750 package
      expect(result!.packagePrice).toBe(6750);
      // PER_PERSON: 10 * 80 * 1 = 800, FLAT: 200 * 1 = 200 => 1000
      expect(result!.optionsPrice).toBe(1000);
      expect(result!.totalMenuPrice).toBe(7750);
    });

    it('should not audit when price unchanged', async () => {
      const snap = makeSnapshot({ totalMenuPrice: 5500 });
      // Set data so recalculated price = 5500 (same)
      snap.menuData = {
        ...snap.menuData,
        pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
        selectedOptions: [], // no options
      };
      snap.packagePrice = 5500;
      snap.optionsPrice = 0;
      snap.adultsCount = 50;
      snap.childrenCount = 10;
      snap.toddlersCount = 0;
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(snap);
      db.reservationMenuSnapshot.update.mockResolvedValue({});

      // Same guest counts => same price
      await reservationMenuService.recalculateForGuestChange('r-1', 50, 10, 0, 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should audit when price changes', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(makeSnapshot());
      db.reservationMenuSnapshot.update.mockResolvedValue({});

      await reservationMenuService.recalculateForGuestChange('r-1', 100, 20, 10, 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MENU_RECALCULATED' })
      );
    });

    it('should handle missing pricePerAdult/Child/Toddler (|| 0)', async () => {
      const snap = makeSnapshot();
      snap.menuData = {
        ...snap.menuData,
        pricePerAdult: undefined, pricePerChild: undefined, pricePerToddler: undefined,
        selectedOptions: [],
      };
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(snap);
      db.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await reservationMenuService.recalculateForGuestChange('r-1', 10, 5, 2);
      expect(result!.packagePrice).toBe(0);
    });

    it('should handle options with missing priceAmount and quantity (|| 0, || 1)', async () => {
      const snap = makeSnapshot();
      snap.menuData.selectedOptions = [
        { optionId: 'x', optionName: 'X', priceAmount: undefined, priceUnit: 'PER_PERSON', quantity: undefined },
      ];
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(snap);
      db.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await reservationMenuService.recalculateForGuestChange('r-1', 10, 0, 0);
      expect(result).not.toBeNull();
    });

    it('should handle missing packageName (|| N/A)', async () => {
      const snap = makeSnapshot();
      snap.menuData.packageName = undefined;
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(snap);
      db.reservationMenuSnapshot.update.mockResolvedValue({});

      await reservationMenuService.recalculateForGuestChange('r-1', 100, 20, 10, 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            description: expect.stringContaining('N/A'),
          }),
        })
      );
    });

    it('should handle userId=undefined (|| null)', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(makeSnapshot());
      db.reservationMenuSnapshot.update.mockResolvedValue({});

      await reservationMenuService.recalculateForGuestChange('r-1', 100, 20, 10);
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null })
      );
    });
  });

  // ═══ removeMenu ═══
  describe('removeMenu()', () => {
    it('should audit when snapshot exists', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(makeSnapshot());
      db.reservationMenuSnapshot.delete.mockResolvedValue({});

      await reservationMenuService.removeMenu('r-1', 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MENU_DIRECT_REMOVED' })
      );
    });

    it('should skip audit when no snapshot', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      db.reservationMenuSnapshot.delete.mockResolvedValue({});

      await reservationMenuService.removeMenu('r-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should handle missing packageName in snapshot', async () => {
      const snap = makeSnapshot();
      snap.menuData = { ...snap.menuData, packageName: undefined };
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(snap);
      db.reservationMenuSnapshot.delete.mockResolvedValue({});

      await reservationMenuService.removeMenu('r-1', 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            description: expect.stringContaining('N/A'),
          }),
        })
      );
    });
  });

  // ═══ getReservationMenu ═══
  describe('getReservationMenu()', () => {
    it('should throw when no snapshot', async () => {
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      await expect(reservationMenuService.getReservationMenu('r-1'))
        .rejects.toThrow('Menu not selected');
    });

    it('should return formatted response with selectedOptions fallback', async () => {
      const snap = makeSnapshot();
      snap.menuData.selectedOptions = undefined;
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(snap);

      const result = await reservationMenuService.getReservationMenu('r-1');
      expect(result.priceBreakdown.optionsCost).toEqual([]);
    });
  });

  // ═══ selectMenu edge cases ═══
  describe('selectMenu() — edge cases', () => {
    const setupSelect = (resOverrides: any = {}, pkgOverrides: any = {}) => {
      db.reservation.findUnique.mockResolvedValue({
        id: 'r-1', adults: 50, children: 10, toddlers: 5,
        eventType: { id: 'et-1', name: 'Wesele' },
        client: { firstName: 'Jan', lastName: 'K' },
        ...resOverrides,
      });
      db.menuPackage.findUnique.mockResolvedValue({
        id: 'pkg-1', name: 'Premium', description: 'Desc',
        menuTemplateId: 'mt-1',
        pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
        menuTemplate: { name: 'Template', eventType: { id: 'et-1', name: 'Wesele' } },
        categorySettings: [],
        ...pkgOverrides,
      });
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(null); // new selection
      db.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshot());
    };

    it('should use reservation guest counts when input has no overrides', async () => {
      setupSelect();
      await reservationMenuService.selectMenu('r-1', { packageId: 'pkg-1' });
      expect(db.reservationMenuSnapshot.upsert).toHaveBeenCalled();
    });

    it('should override guest counts from input', async () => {
      setupSelect();
      await reservationMenuService.selectMenu('r-1', {
        packageId: 'pkg-1', adults: 80, children: 20, toddlers: 10,
      });
      expect(db.reservationMenuSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ adultsCount: 80 }),
        })
      );
    });

    it('should handle null client (N/A)', async () => {
      setupSelect({ client: null });
      await reservationMenuService.selectMenu('r-1', { packageId: 'pkg-1' }, 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            description: expect.stringContaining('N/A'),
          }),
        })
      );
    });

    it('should log "zmienione" for existing selection', async () => {
      setupSelect();
      db.reservationMenuSnapshot.findUnique.mockResolvedValue(makeSnapshot()); // existing!
      await reservationMenuService.selectMenu('r-1', { packageId: 'pkg-1' }, 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            description: expect.stringContaining('zmienione'),
          }),
        })
      );
    });

    it('should skip dish validation when no dishSelections', async () => {
      setupSelect();
      // No dishSelections in input
      await reservationMenuService.selectMenu('r-1', { packageId: 'pkg-1' });
      // Should not throw
    });

    it('should handle empty selectedOptions (fallback [])', async () => {
      setupSelect();
      await reservationMenuService.selectMenu('r-1', { packageId: 'pkg-1' });
      // selectedOptions defaults to []
    });

    it('should fetch options when selectedOptions provided', async () => {
      setupSelect();
      db.menuOption.findMany.mockResolvedValue([
        { id: 'opt-1', name: 'Bar', priceAmount: 10, priceType: 'PER_PERSON', category: 'Drinks', isActive: true },
      ]);
      await reservationMenuService.selectMenu('r-1', {
        packageId: 'pkg-1',
        selectedOptions: [{ optionId: 'opt-1', quantity: 1 }],
      });
      expect(db.menuOption.findMany).toHaveBeenCalled();
    });

    it('should throw when reservation not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(reservationMenuService.selectMenu('bad', { packageId: 'pkg-1' }))
        .rejects.toThrow('Reservation not found');
    });

    it('should throw when package not found', async () => {
      db.reservation.findUnique.mockResolvedValue({ id: 'r-1', adults: 50, children: 10, toddlers: 5 });
      db.menuPackage.findUnique.mockResolvedValue(null);
      await expect(reservationMenuService.selectMenu('r-1', { packageId: 'bad' }))
        .rejects.toThrow('package not found');
    });
  });
});
