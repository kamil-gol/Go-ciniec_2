/**
 * ReservationMenuService — Unit Tests
 * NOTE: menuOption mock removed — MenuOption model no longer in Prisma.
 * Options are passed via input data, not looked up from DB.
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    reservation: { findUnique: jest.fn() },
    menuPackage: { findUnique: jest.fn() },
    reservationMenuSnapshot: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dish: { findMany: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

// Silence console.log in tests
jest.spyOn(console, 'log').mockImplementation(() => {});

import { prisma } from '../../../lib/prisma';
import { logChange } from '../../../utils/audit-logger';

// Import default instance
import reservationMenuService from '../../../services/reservation-menu.service';

const mockPrisma = prisma as any;
const TEST_USER = 'user-001';

const RESERVATION = {
  id: 'res-001',
  adults: 40,
  children: 5,
  toddlers: 3,
  eventType: { id: 'et-001', name: 'Wesele' },
  client: { firstName: 'Jan', lastName: 'Kowalski' },
};

const MENU_PACKAGE = {
  id: 'pkg-001',
  name: 'Złoty',
  description: 'Pakiet premium',
  menuTemplateId: 'tpl-001',
  pricePerAdult: { toString: () => '200' },
  pricePerChild: { toString: () => '100' },
  pricePerToddler: { toString: () => '0' },
  menuTemplate: { id: 'tpl-001', name: 'Wesele 2026', eventType: { id: 'et-001', name: 'Wesele' } },
  categorySettings: [
    {
      categoryId: 'cat-001',
      category: { name: 'Przystawki', dishes: [{ id: 'dish-001', name: 'Tartare', isActive: true }] },
      isRequired: true,
      minSelect: 1,
      maxSelect: 3,
      isEnabled: true,
      displayOrder: 0,
    },
  ],
};

const SNAPSHOT_DB = {
  id: 'snap-001',
  reservationId: 'res-001',
  menuTemplateId: 'tpl-001',
  packageId: 'pkg-001',
  packagePrice: { toString: () => '8500' },
  optionsPrice: { toString: () => '2900' },
  totalMenuPrice: { toString: () => '11400' },
  adultsCount: 40,
  childrenCount: 5,
  toddlersCount: 3,
  selectedAt: new Date(),
  updatedAt: new Date(),
  menuData: {
    packageId: 'pkg-001',
    packageName: 'Złoty',
    pricePerAdult: 200,
    pricePerChild: 100,
    pricePerToddler: 0,
    adults: 40,
    children: 5,
    toddlers: 3,
    dishSelections: [],
    selectedOptions: [
      { optionId: 'opt-001', optionName: 'Bar Premium', category: 'BAR', quantity: 1, priceAmount: 50, priceUnit: 'PER_PERSON' },
      { optionId: 'opt-002', optionName: 'Dekoracje', category: 'DECOR', quantity: 1, priceAmount: 500, priceUnit: 'FLAT' },
    ],
    prices: { packageTotal: 8500, optionsTotal: 2900, total: 11400 },
    createdAt: new Date().toISOString(),
  },
};

beforeEach(() => {
  jest.clearAllMocks();

  mockPrisma.reservation.findUnique.mockResolvedValue(RESERVATION);
  mockPrisma.menuPackage.findUnique.mockResolvedValue(MENU_PACKAGE);
  mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
  mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(SNAPSHOT_DB);
  mockPrisma.reservationMenuSnapshot.update.mockResolvedValue(SNAPSHOT_DB);
  mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue(SNAPSHOT_DB);
  mockPrisma.dish.findMany.mockResolvedValue([]);
});

describe('ReservationMenuService', () => {

  // ═══ selectMenu ═══
  describe('selectMenu()', () => {

    it('should create menu snapshot with correct prices', async () => {
      const result = await reservationMenuService.selectMenu('res-001', {
        packageId: 'pkg-001',
        selectedOptions: [
          { optionId: 'opt-001', quantity: 1, name: 'Bar Premium', category: 'BAR', priceAmount: 50, priceType: 'PER_PERSON' },
          { optionId: 'opt-002', quantity: 1, name: 'Dekoracje', category: 'DECOR', priceAmount: 500, priceType: 'FLAT' },
        ],
      }, TEST_USER);

      expect(result).toBeDefined();
      expect(result.snapshot).toBeDefined();
      expect(result.priceBreakdown).toBeDefined();
      expect(mockPrisma.reservationMenuSnapshot.upsert).toHaveBeenCalledTimes(1);

      // Verify pricing in upsert call:
      // packagePrice = 40*200 + 5*100 + 3*0 = 8500
      // optionsPrice = 50*48*1 (PER_PERSON) + 500*1 (FLAT) = 2400 + 500 = 2900
      // total = 11400
      const upsertCall = mockPrisma.reservationMenuSnapshot.upsert.mock.calls[0][0];
      expect(upsertCall.create.packagePrice).toBe(8500);
      expect(upsertCall.create.optionsPrice).toBe(2900);
      expect(upsertCall.create.totalMenuPrice).toBe(11400);
    });

    it('should audit as new selection when no existing snapshot', async () => {
      await reservationMenuService.selectMenu('res-001', {
        packageId: 'pkg-001', selectedOptions: [],
      }, TEST_USER);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MENU_SELECTED',
          details: expect.objectContaining({ isNewSelection: true }),
        })
      );
    });

    it('should audit as update when existing snapshot exists', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique
        .mockResolvedValueOnce(SNAPSHOT_DB)  // existingSnapshot check
        .mockResolvedValueOnce(SNAPSHOT_DB); // possible second call

      await reservationMenuService.selectMenu('res-001', {
        packageId: 'pkg-001', selectedOptions: [],
      }, TEST_USER);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ isNewSelection: false }),
        })
      );
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(reservationMenuService.selectMenu('nonexistent', {
        packageId: 'pkg-001', selectedOptions: [],
      })).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should throw when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);

      await expect(reservationMenuService.selectMenu('res-001', {
        packageId: 'nonexistent', selectedOptions: [],
      })).rejects.toThrow(/Nie znaleziono.*pakietu menu/);
    });

    it('should throw on dish validation errors', async () => {
      await expect(reservationMenuService.selectMenu('res-001', {
        packageId: 'pkg-001',
        selectedOptions: [],
        dishSelections: [
          { categoryId: 'cat-001', dishes: [] }, // 0 selected, min is 1
        ],
      })).rejects.toThrow(/Błąd walidacji wyboru menu.*minimum 1/);
    });
  });

  // ═══ recalculateForGuestChange ═══
  describe('recalculateForGuestChange()', () => {

    it('should recalculate prices with new guest counts', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(SNAPSHOT_DB);

      const result = await reservationMenuService.recalculateForGuestChange(
        'res-001', 60, 10, 5, TEST_USER
      );

      expect(result).not.toBeNull();
      // packagePrice = 60*200 + 10*100 + 5*0 = 13000
      expect(result!.packagePrice).toBe(13000);
      // optionsPrice: PER_PERSON 50*75*1=3750, FLAT 500*1=500 → 4250
      expect(result!.optionsPrice).toBe(4250);
      expect(result!.totalMenuPrice).toBe(17250);

      expect(mockPrisma.reservationMenuSnapshot.update).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MENU_RECALCULATED' })
      );
    });

    it('should return null when no snapshot exists', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);

      const result = await reservationMenuService.recalculateForGuestChange(
        'res-001', 60, 10, 5
      );

      expect(result).toBeNull();
      expect(mockPrisma.reservationMenuSnapshot.update).not.toHaveBeenCalled();
    });

    it('should NOT audit when total price unchanged', async () => {
      // Same guests = same price = no audit
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(SNAPSHOT_DB);

      await reservationMenuService.recalculateForGuestChange(
        'res-001', 40, 5, 3 // same as original
      );

      expect(logChange).not.toHaveBeenCalled();
    });

    it('should keep FLAT option prices unchanged regardless of guests', async () => {
      const snapshotOnlyFlat = {
        ...SNAPSHOT_DB,
        packagePrice: { toString: () => '8000' },
        optionsPrice: { toString: () => '500' },
        totalMenuPrice: { toString: () => '8500' },
        menuData: {
          ...SNAPSHOT_DB.menuData,
          selectedOptions: [
            { optionId: 'opt-002', optionName: 'Dekoracje', category: 'DECOR', quantity: 1, priceAmount: 500, priceUnit: 'FLAT' },
          ],
        },
      };
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(snapshotOnlyFlat);

      const result = await reservationMenuService.recalculateForGuestChange(
        'res-001', 100, 20, 10 // huge guest change
      );

      // FLAT stays 500 regardless of 130 guests
      expect(result!.optionsPrice).toBe(500);
    });
  });

  // ═══ getReservationMenu ═══
  describe('getReservationMenu()', () => {

    it('should return formatted menu response', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(SNAPSHOT_DB);

      const result = await reservationMenuService.getReservationMenu('res-001');

      expect(result.snapshot.reservationId).toBe('res-001');
      expect(result.priceBreakdown.totalMenuPrice).toBe(11400);
    });

    it('should throw when no menu selected', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);

      await expect(reservationMenuService.getReservationMenu('res-001'))
        .rejects.toThrow('Menu nie zostało wybrane dla tej rezerwacji');
    });
  });

  // ═══ removeMenu ═══
  describe('removeMenu()', () => {

    it('should delete snapshot and audit', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(SNAPSHOT_DB);

      await reservationMenuService.removeMenu('res-001', TEST_USER);

      expect(mockPrisma.reservationMenuSnapshot.delete).toHaveBeenCalledWith({ where: { reservationId: 'res-001' } });
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MENU_DIRECT_REMOVED' })
      );
    });

    it('should NOT audit when no snapshot existed', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);

      await reservationMenuService.removeMenu('res-001', TEST_USER);

      expect(logChange).not.toHaveBeenCalled();
    });
  });

  // ═══ updateMenu ═══
  describe('updateMenu()', () => {
    it('should delegate to selectMenu', async () => {
      const spy = jest.spyOn(reservationMenuService, 'selectMenu');

      await reservationMenuService.updateMenu('res-001', {
        packageId: 'pkg-001', selectedOptions: [],
      }, TEST_USER);

      expect(spy).toHaveBeenCalledWith('res-001', expect.objectContaining({ packageId: 'pkg-001' }), TEST_USER);
      spy.mockRestore();
    });
  });

  // ═══════════ edge cases / branch coverage ═══════════
  describe('edge cases / branch coverage', () => {

    const makeSnapshotResult = (overrides: any = {}) => ({
      id: 'snap1', reservationId: 'r1',
      menuData: {
        packageId: 'pkg-001', packageName: 'Gold',
        pricePerAdult: 150, pricePerChild: 80, pricePerToddler: 30,
        adults: 10, children: 5, toddlers: 2,
        dishSelections: [], selectedOptions: [],
        prices: { packageTotal: 1960, optionsTotal: 0, total: 1960 },
      },
      menuTemplateId: 'tpl-001', packageId: 'pkg-001',
      packagePrice: 1960, optionsPrice: 0, totalMenuPrice: 1960,
      adultsCount: 10, childrenCount: 5, toddlersCount: 2,
      selectedAt: new Date(), updatedAt: new Date(),
      ...overrides,
    });

    describe('selectMenu — additional branches', () => {
      it('should select as new with dishes and PER_PERSON option', async () => {
        mockPrisma.dish.findMany.mockResolvedValue([
          { id: 'dish-001', name: 'Pomidorowa', description: 'Klasyczna', allergens: ['gluten'], isActive: true },
        ]);
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
        mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult({
          menuData: {
            ...makeSnapshotResult().menuData,
            selectedOptions: [{ optionId: 'opt1', optionName: 'Woda', priceAmount: 10, priceUnit: 'PER_PERSON', quantity: 2 }],
          },
        }));

        const result = await reservationMenuService.selectMenu('res-001', {
          packageId: 'pkg-001',
          dishSelections: [{ categoryId: 'cat-001', dishes: [{ dishId: 'dish-001', quantity: 2 }] }],
          selectedOptions: [{ optionId: 'opt1', quantity: 2, name: 'Woda', priceAmount: 10, priceType: 'PER_PERSON', category: 'DRINK' }],
        }, TEST_USER);

        expect(result).toBeDefined();
        expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
          action: 'MENU_SELECTED',
          details: expect.objectContaining({ isNewSelection: true }),
        }));
      });

      it('should select as update with null client', async () => {
        mockPrisma.reservation.findUnique.mockResolvedValue({ ...RESERVATION, client: null });
        mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...MENU_PACKAGE, categorySettings: [] });
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({ id: 'existing' });
        mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

        const result = await reservationMenuService.selectMenu('res-001', { packageId: 'pkg-001' }, TEST_USER);

        expect(result).toBeDefined();
        expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
          details: expect.objectContaining({ isNewSelection: false }),
        }));
      });

      it('should select without userId (userId || null branch)', async () => {
        mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...MENU_PACKAGE, categorySettings: [] });
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
        mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

        await reservationMenuService.selectMenu('res-001', { packageId: 'pkg-001' });
        expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
      });

      it('should use input adults/children/toddlers when provided', async () => {
        mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...MENU_PACKAGE, categorySettings: [] });
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
        mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

        await reservationMenuService.selectMenu('res-001', { packageId: 'pkg-001', adults: 20, children: 10, toddlers: 5 });
        expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
          details: expect.objectContaining({ guests: { adults: 20, children: 10, toddlers: 5 } }),
        }));
      });

      it('should handle FLAT option in calculateOptionsPrice', async () => {
        mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...MENU_PACKAGE, categorySettings: [] });
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
        mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

        await reservationMenuService.selectMenu('res-001', {
          packageId: 'pkg-001',
          selectedOptions: [{ optionId: 'opt2', quantity: 1, name: 'DJ', priceAmount: 500, priceType: 'FLAT', category: 'ENTERTAINMENT' }],
        });

        expect(mockPrisma.reservationMenuSnapshot.upsert).toHaveBeenCalled();
      });

      it('should handle option with missing price fields (defaults to 0/FLAT)', async () => {
        mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...MENU_PACKAGE, categorySettings: [] });
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
        mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

        await reservationMenuService.selectMenu('res-001', {
          packageId: 'pkg-001',
          selectedOptions: [{ optionId: 'nonexistent', quantity: 1 }],
        });

        expect(mockPrisma.reservationMenuSnapshot.upsert).toHaveBeenCalled();
      });

      it('should handle dishSelection with unknown categoryId', async () => {
        mockPrisma.dish.findMany.mockResolvedValue([]);
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
        mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

        await reservationMenuService.selectMenu('res-001', {
          packageId: 'pkg-001',
          dishSelections: [
            { categoryId: 'cat-001', dishes: [{ dishId: 'dish-001', quantity: 1 }] },
            { categoryId: 'unknown_cat', dishes: [{ dishId: 'dx', quantity: 1 }] },
          ],
        });

        expect(mockPrisma.reservationMenuSnapshot.upsert).toHaveBeenCalled();
      });

      it('should use Unknown dish when dish not found in buildMenuSnapshot', async () => {
        mockPrisma.dish.findMany.mockResolvedValue([]);
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
        mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

        await reservationMenuService.selectMenu('res-001', {
          packageId: 'pkg-001',
          dishSelections: [{ categoryId: 'cat-001', dishes: [{ dishId: 'nonexistent', quantity: 1 }] }],
        });

        const upsertCall = mockPrisma.reservationMenuSnapshot.upsert.mock.calls[0][0];
        const menuData = upsertCall.create.menuData;
        const dishSel = menuData.dishSelections.find((s: any) => s !== null);
        if (dishSel) {
          expect(dishSel.dishes[0].dishName).toBe('Nieznane danie');
        }
      });
    });

    describe('validateDishSelections via selectMenu', () => {
      it('should throw when required category has less than minSelect', async () => {
        mockPrisma.menuPackage.findUnique.mockResolvedValue({
          ...MENU_PACKAGE,
          categorySettings: [{
            categoryId: 'cat-001', isEnabled: true, displayOrder: 1,
            minSelect: 2, maxSelect: 5, isRequired: true,
            category: { name: 'Zupy', dishes: [] },
          }],
        });

        await expect(reservationMenuService.selectMenu('res-001', {
          packageId: 'pkg-001',
          dishSelections: [{ categoryId: 'cat-001', dishes: [{ dishId: 'd1', quantity: 1 }] }],
        })).rejects.toThrow('minimum 2');
      });

      it('should throw when selections exceed maxSelect', async () => {
        mockPrisma.menuPackage.findUnique.mockResolvedValue({
          ...MENU_PACKAGE,
          categorySettings: [{
            categoryId: 'cat-001', isEnabled: true, displayOrder: 1,
            minSelect: 1, maxSelect: 2, isRequired: false,
            category: { name: 'Zupy', dishes: [] },
          }],
        });

        await expect(reservationMenuService.selectMenu('res-001', {
          packageId: 'pkg-001',
          dishSelections: [{ categoryId: 'cat-001', dishes: [{ dishId: 'd1', quantity: 5 }] }],
        })).rejects.toThrow('maksimum 2');
      });

      it('should pass when no selection for non-required category', async () => {
        mockPrisma.menuPackage.findUnique.mockResolvedValue({
          ...MENU_PACKAGE,
          categorySettings: [{
            categoryId: 'cat-001', isEnabled: true, displayOrder: 1,
            minSelect: 1, maxSelect: 3, isRequired: false,
            category: { name: 'Zupy', dishes: [] },
          }],
        });
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
        mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

        await reservationMenuService.selectMenu('res-001', {
          packageId: 'pkg-001',
          dishSelections: [],
        });

        expect(mockPrisma.reservationMenuSnapshot.upsert).toHaveBeenCalled();
      });
    });

    describe('recalculateForGuestChange — additional branches', () => {
      it('should return null when menuData is null', async () => {
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
          id: 's1', menuData: null, packagePrice: 0, optionsPrice: 0, totalMenuPrice: 0,
          adultsCount: 5, childrenCount: 2, toddlersCount: 1,
        });
        const result = await reservationMenuService.recalculateForGuestChange('res-001', 10, 5, 2);
        expect(result).toBeNull();
      });

      it('should recalculate with PER_PERSON options and trigger audit', async () => {
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
          id: 's1', reservationId: 'res-001',
          packagePrice: 1000, optionsPrice: 200, totalMenuPrice: 1200,
          adultsCount: 5, childrenCount: 2, toddlersCount: 1,
          menuData: {
            pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 20, packageName: 'Gold',
            selectedOptions: [{ optionId: 'o1', priceAmount: 10, priceUnit: 'PER_PERSON', quantity: 1 }],
            prices: { packageTotal: 1000, optionsTotal: 200, total: 1200 },
          },
        });
        mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

        const result = await reservationMenuService.recalculateForGuestChange('res-001', 10, 5, 2);
        expect(result!.packagePrice).toBe(1290);
        expect(result!.optionsPrice).toBe(170);
        expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'MENU_RECALCULATED' }));
      });

      it('should handle missing price fields with || 0 fallbacks', async () => {
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
          id: 's1', reservationId: 'res-001',
          packagePrice: 0, optionsPrice: 0, totalMenuPrice: 0,
          adultsCount: 1, childrenCount: 0, toddlersCount: 0,
          menuData: { selectedOptions: null, prices: { packageTotal: 0, optionsTotal: 0, total: 0 } },
        });
        mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

        const result = await reservationMenuService.recalculateForGuestChange('res-001', 3, 0, 0);
        expect(result!.packagePrice).toBe(0);
      });

      it('should handle option with missing priceAmount/quantity', async () => {
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
          id: 's1', reservationId: 'res-001',
          packagePrice: 100, optionsPrice: 50, totalMenuPrice: 150,
          adultsCount: 1, childrenCount: 0, toddlersCount: 0,
          menuData: {
            pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0, packageName: 'Test',
            selectedOptions: [{ optionId: 'o3', priceUnit: 'PER_PERSON' }],
            prices: { packageTotal: 100, optionsTotal: 50, total: 150 },
          },
        });
        mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

        const result = await reservationMenuService.recalculateForGuestChange('res-001', 2, 0, 0);
        expect(result!.optionsPrice).toBe(0);
      });

      it('should recalculate with PER_PERSON and FLAT options combined', async () => {
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
          id: 'snap1', reservationId: 'res-001',
          packagePrice: 1500, optionsPrice: 500, totalMenuPrice: 2000,
          adultsCount: 10, childrenCount: 5, toddlersCount: 2,
          menuData: {
            packageName: 'Gold',
            pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
            selectedOptions: [
              { optionId: 'o1', optionName: 'DJ', priceAmount: 500, priceUnit: 'FLAT', quantity: 1 },
              { optionId: 'o2', optionName: 'Fotograf', priceAmount: 20, priceUnit: 'PER_PERSON', quantity: 1 },
            ],
            prices: { packageTotal: 1500, optionsTotal: 500, total: 2000 },
          },
        });
        mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

        const result = await reservationMenuService.recalculateForGuestChange('res-001', 20, 10, 5, TEST_USER);

        expect(result).not.toBeNull();
        expect(result!.packagePrice).toBe(2500);
        expect(result!.optionsPrice).toBe(500 + 20 * 35);
        expect(result!.totalMenuPrice).toBe(2500 + 500 + 700);
      });

      it('should handle snapshot with no selectedOptions', async () => {
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
          id: 'snap1', reservationId: 'res-001',
          packagePrice: 800, optionsPrice: 0, totalMenuPrice: 800,
          adultsCount: 10, childrenCount: 5, toddlersCount: 2,
          menuData: {
            packageName: 'Basic',
            pricePerAdult: 80, pricePerChild: 40, pricePerToddler: 0,
            selectedOptions: [],
            prices: { packageTotal: 800, optionsTotal: 0, total: 800 },
          },
        });
        mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

        const result = await reservationMenuService.recalculateForGuestChange('res-001', 15, 5, 0, TEST_USER);

        expect(result).not.toBeNull();
        expect(result!.packagePrice).toBe(15 * 80 + 5 * 40);
        expect(result!.optionsPrice).toBe(0);
      });
    });

    describe('removeMenu — additional branches', () => {
      it('should handle menuData with no packageName', async () => {
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
          id: 's1', totalMenuPrice: 500, packagePrice: 500, optionsPrice: 0, menuData: {},
        });

        await reservationMenuService.removeMenu('res-001', TEST_USER);
        expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
          details: expect.objectContaining({ packageName: null }),
        }));
      });
    });

    describe('getReservationMenu — additional branches', () => {
      it('should return formatted response with selectedOptions', async () => {
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
          ...SNAPSHOT_DB,
          menuData: {
            ...SNAPSHOT_DB.menuData,
            selectedOptions: [
              { optionId: 'o1', optionName: 'DJ', priceAmount: 500, priceUnit: 'FLAT', quantity: 1 },
            ],
          },
        });
        const result = await reservationMenuService.getReservationMenu('res-001');
        expect(result.priceBreakdown.optionsCost).toHaveLength(1);
      });

      it('should return empty optionsCost when selectedOptions null', async () => {
        mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
          ...SNAPSHOT_DB,
          menuData: { ...SNAPSHOT_DB.menuData, selectedOptions: null },
        });
        const result = await reservationMenuService.getReservationMenu('res-001');
        expect(result.priceBreakdown.optionsCost).toEqual([]);
      });
    });
  });
});
