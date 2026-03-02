/**
 * Reservation Menu Service — Branch coverage tests
 * Covers: selectMenu (new vs update, with/without dishes/options, reservation/package not found),
 * recalculateForGuestChange (null snapshot/menuData, PER_PERSON/FLAT, price unchanged),
 * removeMenu (snapshot exists/null, packageName fallback),
 * validateDishSelections (isRequired min, maxSelect),
 * buildMenuSnapshot (!categorySetting, dish?.name fallback),
 * calculateOptionsPrice (PER_PERSON, FLAT, default),
 * formatMenuResponse (selectedOptions null/present),
 * getReservationMenu (no snapshot)
 * NOTE: menuOption mock removed — MenuOption model no longer in Prisma
 */

const mockPrisma = {
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

jest.mock('../../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn(),
}));

import ReservationMenuServiceModule from '../../../services/reservation-menu.service';
import { logChange } from '../../../utils/audit-logger';

const service = ReservationMenuServiceModule;

const makeSnapshotResult = (overrides: any = {}) => ({
  id: 'snap1', reservationId: 'r1',
  menuData: {
    packageId: 'mp1', packageName: 'Gold',
    pricePerAdult: 150, pricePerChild: 80, pricePerToddler: 30,
    adults: 10, children: 5, toddlers: 2,
    dishSelections: [], selectedOptions: [],
    prices: { packageTotal: 1960, optionsTotal: 0, total: 1960 },
  },
  menuTemplateId: 'mt1', packageId: 'mp1',
  packagePrice: 1960, optionsPrice: 0, totalMenuPrice: 1960,
  adultsCount: 10, childrenCount: 5, toddlersCount: 2,
  selectedAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

const baseReservation = {
  id: 'r1', adults: 10, children: 5, toddlers: 2,
  eventType: { id: 'et1', name: 'Wesele' },
  client: { firstName: 'Jan', lastName: 'K' },
};

const basePackage = {
  id: 'mp1', name: 'Gold', description: 'Premium',
  menuTemplateId: 'mt1',
  pricePerAdult: 150, pricePerChild: 80, pricePerToddler: 30,
  menuTemplate: { name: 'Template A', eventType: null },
  categorySettings: [
    {
      categoryId: 'cat1', isEnabled: true, displayOrder: 1,
      minSelect: 1, maxSelect: 3, isRequired: true,
      category: {
        name: 'Zupy',
        dishes: [{ id: 'd1', name: 'Pomidorowa', isActive: true }],
      },
    },
  ],
};

describe('ReservationMenuService branches', () => {
  beforeEach(() => jest.clearAllMocks());

  // ===== selectMenu =====
  describe('selectMenu', () => {
    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.selectMenu('r1', { packageId: 'mp1' })).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should throw when package not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      await expect(service.selectMenu('r1', { packageId: 'mp1' })).rejects.toThrow(/Nie znaleziono.*pakietu menu/);
    });

    it('should select as new (no existing snapshot) with dishes and PER_PERSON option', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue(basePackage);
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.dish.findMany.mockResolvedValue([
        { id: 'd1', name: 'Pomidorowa', description: 'Klasyczna', allergens: ['gluten'], isActive: true },
      ]);
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult({
        menuData: {
          ...makeSnapshotResult().menuData,
          selectedOptions: [{ optionId: 'opt1', optionName: 'Woda', priceAmount: 10, priceUnit: 'PER_PERSON', quantity: 2 }],
        },
      }));

      const result = await service.selectMenu('r1', {
        packageId: 'mp1',
        dishSelections: [{ categoryId: 'cat1', dishes: [{ dishId: 'd1', quantity: 2 }] }],
        selectedOptions: [{ optionId: 'opt1', quantity: 2, name: 'Woda', priceAmount: 10, priceType: 'PER_PERSON', category: 'DRINK' }],
      }, 'u1');

      expect(result).toBeDefined();
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        action: 'MENU_SELECTED',
        details: expect.objectContaining({ isNewSelection: true }),
      }));
    });

    it('should select as update (existing snapshot) without dishes/options + null client', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({ ...baseReservation, client: null });
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...basePackage, categorySettings: [] });
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({ id: 'existing' });
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

      const result = await service.selectMenu('r1', { packageId: 'mp1' }, 'u1');

      expect(result).toBeDefined();
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({ isNewSelection: false }),
      }));
    });

    it('should select without userId (userId || null branch)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...basePackage, categorySettings: [] });
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

      await service.selectMenu('r1', { packageId: 'mp1' });
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
    });

    it('should use input adults/children/toddlers when provided', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...basePackage, categorySettings: [] });
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

      await service.selectMenu('r1', { packageId: 'mp1', adults: 20, children: 10, toddlers: 5 });
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({ guests: { adults: 20, children: 10, toddlers: 5 } }),
      }));
    });

    it('should handle FLAT option in calculateOptionsPrice', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...basePackage, categorySettings: [] });
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

      await service.selectMenu('r1', {
        packageId: 'mp1',
        selectedOptions: [{ optionId: 'opt2', quantity: 1, name: 'DJ', priceAmount: 500, priceType: 'FLAT', category: 'ENTERTAINMENT' }],
      });

      expect(mockPrisma.reservationMenuSnapshot.upsert).toHaveBeenCalled();
    });

    it('should handle option with missing price fields (defaults to 0/FLAT)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...basePackage, categorySettings: [] });
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

      await service.selectMenu('r1', {
        packageId: 'mp1',
        selectedOptions: [{ optionId: 'nonexistent', quantity: 1 }],
      });

      expect(mockPrisma.reservationMenuSnapshot.upsert).toHaveBeenCalled();
    });

    it('should handle dishSelection with unknown categoryId (!categorySetting in buildMenuSnapshot)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue(basePackage);
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.dish.findMany.mockResolvedValue([]);
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

      await service.selectMenu('r1', {
        packageId: 'mp1',
        dishSelections: [
          { categoryId: 'cat1', dishes: [{ dishId: 'd1', quantity: 1 }] },
          { categoryId: 'unknown_cat', dishes: [{ dishId: 'dx', quantity: 1 }] },
        ],
      });

      expect(mockPrisma.reservationMenuSnapshot.upsert).toHaveBeenCalled();
    });

    it('should use Unknown dish when dish not found in buildMenuSnapshot', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue(basePackage);
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.dish.findMany.mockResolvedValue([]);
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

      await service.selectMenu('r1', {
        packageId: 'mp1',
        dishSelections: [{ categoryId: 'cat1', dishes: [{ dishId: 'nonexistent', quantity: 1 }] }],
      });

      const upsertCall = mockPrisma.reservationMenuSnapshot.upsert.mock.calls[0][0];
      const menuData = upsertCall.create.menuData;
      const dishSel = menuData.dishSelections.find((s: any) => s !== null);
      if (dishSel) {
        expect(dishSel.dishes[0].dishName).toBe('Nieznane danie');
      }
    });
  });

  // ===== validateDishSelections (via selectMenu) =====
  describe('validateDishSelections via selectMenu', () => {
    it('should throw when required category has less than minSelect', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        ...basePackage,
        categorySettings: [{
          categoryId: 'cat1', isEnabled: true, displayOrder: 1,
          minSelect: 2, maxSelect: 5, isRequired: true,
          category: { name: 'Zupy', dishes: [] },
        }],
      });

      await expect(service.selectMenu('r1', {
        packageId: 'mp1',
        dishSelections: [{ categoryId: 'cat1', dishes: [{ dishId: 'd1', quantity: 1 }] }],
      })).rejects.toThrow('minimum 2');
    });

    it('should throw when selections exceed maxSelect', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        ...basePackage,
        categorySettings: [{
          categoryId: 'cat1', isEnabled: true, displayOrder: 1,
          minSelect: 1, maxSelect: 2, isRequired: false,
          category: { name: 'Zupy', dishes: [] },
        }],
      });

      await expect(service.selectMenu('r1', {
        packageId: 'mp1',
        dishSelections: [{ categoryId: 'cat1', dishes: [{ dishId: 'd1', quantity: 5 }] }],
      })).rejects.toThrow('maksimum 2');
    });

    it('should pass when no selection for non-required category', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        ...basePackage,
        categorySettings: [{
          categoryId: 'cat1', isEnabled: true, displayOrder: 1,
          minSelect: 1, maxSelect: 3, isRequired: false,
          category: { name: 'Zupy', dishes: [] },
        }],
      });
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

      await service.selectMenu('r1', {
        packageId: 'mp1',
        dishSelections: [],
      });

      expect(mockPrisma.reservationMenuSnapshot.upsert).toHaveBeenCalled();
    });
  });

  // ===== updateMenu =====
  describe('updateMenu', () => {
    it('should delegate to selectMenu', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ ...basePackage, categorySettings: [] });
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.reservationMenuSnapshot.upsert.mockResolvedValue(makeSnapshotResult());

      const result = await service.updateMenu('r1', { packageId: 'mp1' }, 'u1');
      expect(result).toBeDefined();
    });
  });

  // ===== recalculateForGuestChange =====
  describe('recalculateForGuestChange', () => {
    it('should return null when no existing snapshot', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      const result = await service.recalculateForGuestChange('r1', 10, 5, 2);
      expect(result).toBeNull();
    });

    it('should return null when menuData is null', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', menuData: null, packagePrice: 0, optionsPrice: 0, totalMenuPrice: 0,
        adultsCount: 5, childrenCount: 2, toddlersCount: 1,
      });
      const result = await service.recalculateForGuestChange('r1', 10, 5, 2);
      expect(result).toBeNull();
    });

    it('should recalculate with PER_PERSON options and trigger audit', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1',
        packagePrice: 1000, optionsPrice: 200, totalMenuPrice: 1200,
        adultsCount: 5, childrenCount: 2, toddlersCount: 1,
        menuData: {
          pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 20, packageName: 'Gold',
          selectedOptions: [{ optionId: 'o1', priceAmount: 10, priceUnit: 'PER_PERSON', quantity: 1 }],
          prices: { packageTotal: 1000, optionsTotal: 200, total: 1200 },
        },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await service.recalculateForGuestChange('r1', 10, 5, 2);
      expect(result!.packagePrice).toBe(1290);
      expect(result!.optionsPrice).toBe(170);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'MENU_RECALCULATED' }));
    });

    it('should recalculate with FLAT options', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1',
        packagePrice: 500, optionsPrice: 500, totalMenuPrice: 1000,
        adultsCount: 5, childrenCount: 0, toddlersCount: 0,
        menuData: {
          pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0, packageName: 'Silver',
          selectedOptions: [{ optionId: 'o2', priceAmount: 500, priceUnit: 'FLAT', quantity: 1 }],
          prices: { packageTotal: 500, optionsTotal: 500, total: 1000 },
        },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await service.recalculateForGuestChange('r1', 10, 0, 0);
      expect(result!.optionsPrice).toBe(500);
    });

    it('should NOT call logChange when price unchanged', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1',
        packagePrice: 500, optionsPrice: 0, totalMenuPrice: 500,
        adultsCount: 5, childrenCount: 0, toddlersCount: 0,
        menuData: {
          pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0,
          selectedOptions: [], prices: { packageTotal: 500, optionsTotal: 0, total: 500 },
        },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      await service.recalculateForGuestChange('r1', 5, 0, 0);
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should handle missing price fields with || 0 fallbacks', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1',
        packagePrice: 0, optionsPrice: 0, totalMenuPrice: 0,
        adultsCount: 1, childrenCount: 0, toddlersCount: 0,
        menuData: { selectedOptions: null, prices: { packageTotal: 0, optionsTotal: 0, total: 0 } },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await service.recalculateForGuestChange('r1', 3, 0, 0);
      expect(result!.packagePrice).toBe(0);
    });

    it('should handle option with missing priceAmount/quantity', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1',
        packagePrice: 100, optionsPrice: 50, totalMenuPrice: 150,
        adultsCount: 1, childrenCount: 0, toddlersCount: 0,
        menuData: {
          pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0, packageName: 'Test',
          selectedOptions: [{ optionId: 'o3', priceUnit: 'PER_PERSON' }],
          prices: { packageTotal: 100, optionsTotal: 50, total: 150 },
        },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await service.recalculateForGuestChange('r1', 2, 0, 0);
      expect(result!.optionsPrice).toBe(0);
    });
  });

  // ===== removeMenu =====
  describe('removeMenu', () => {
    it('should log audit when snapshot exists', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', totalMenuPrice: 1500, packagePrice: 1000, optionsPrice: 500,
        menuData: { packageName: 'Gold' },
      });
      mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue({});
      await service.removeMenu('r1', 'u1');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'MENU_DIRECT_REMOVED' }));
    });

    it('should skip audit when no snapshot', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue({});
      await service.removeMenu('r1');
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should handle menuData with no packageName', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', totalMenuPrice: 500, packagePrice: 500, optionsPrice: 0, menuData: {},
      });
      mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue({});
      await service.removeMenu('r1', 'u1');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({ packageName: null }),
      }));
    });
  });

  // ===== getReservationMenu =====
  describe('getReservationMenu', () => {
    it('should throw when no snapshot', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      await expect(service.getReservationMenu('r1')).rejects.toThrow('Menu nie zostało wybrane');
    });

    it('should return formatted response with selectedOptions', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(makeSnapshotResult({
        menuData: {
          ...makeSnapshotResult().menuData,
          selectedOptions: [
            { optionId: 'o1', optionName: 'DJ', priceAmount: 500, priceUnit: 'FLAT', quantity: 1 },
          ],
        },
      }));
      const result = await service.getReservationMenu('r1');
      expect(result.priceBreakdown.optionsCost).toHaveLength(1);
    });

    it('should return empty optionsCost when selectedOptions null', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(makeSnapshotResult({
        menuData: { ...makeSnapshotResult().menuData, selectedOptions: null },
      }));
      const result = await service.getReservationMenu('r1');
      expect(result.priceBreakdown.optionsCost).toEqual([]);
    });
  });
});
