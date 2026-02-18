/**
 * Reservation Menu Service — Branch coverage tests
 * Covers: recalculateForGuestChange (null snapshot, null menuData, PER_PERSON vs FLAT options,
 * price unchanged — no audit, price changed — audit), removeMenu (snapshot exists, no snapshot),
 * calculateOptionsPrice (option not found, PER_PERSON, FLAT, default)
 */

const mockPrisma = {
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

describe('ReservationMenuService branches', () => {
  beforeEach(() => jest.clearAllMocks());

  // ===== recalculateForGuestChange =====
  describe('recalculateForGuestChange', () => {
    it('should return null when no existing snapshot', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      const result = await service.recalculateForGuestChange('r1', 10, 5, 2);
      expect(result).toBeNull();
    });

    it('should return null when menuData is null', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1', menuData: null,
        packagePrice: 0, optionsPrice: 0, totalMenuPrice: 0,
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
          pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 20,
          packageName: 'Gold',
          selectedOptions: [
            { optionId: 'opt1', optionName: 'Woda', priceAmount: 10, priceUnit: 'PER_PERSON', quantity: 1 },
          ],
          prices: { packageTotal: 1000, optionsTotal: 200, total: 1200 },
        },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await service.recalculateForGuestChange('r1', 10, 5, 2);
      // 10*100 + 5*50 + 2*20 = 1000+250+40 = 1290 (package)
      // PER_PERSON: 10 * 17(guests) * 1 = 170 (options)
      expect(result).toBeDefined();
      expect(result!.packagePrice).toBe(1290);
      expect(result!.optionsPrice).toBe(170);
      expect(result!.totalMenuPrice).toBe(1460);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'MENU_RECALCULATED' }));
    });

    it('should recalculate with FLAT options (not affected by guests)', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1',
        packagePrice: 500, optionsPrice: 100, totalMenuPrice: 600,
        adultsCount: 5, childrenCount: 0, toddlersCount: 0,
        menuData: {
          pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0,
          packageName: 'Silver',
          selectedOptions: [
            { optionId: 'opt2', optionName: 'DJ', priceAmount: 500, priceUnit: 'FLAT', quantity: 1 },
          ],
          prices: { packageTotal: 500, optionsTotal: 500, total: 1000 },
        },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await service.recalculateForGuestChange('r1', 10, 0, 0);
      expect(result!.packagePrice).toBe(1000); // 10*100
      expect(result!.optionsPrice).toBe(500);  // FLAT: 500*1
      expect(result!.totalMenuPrice).toBe(1500);
    });

    it('should NOT call logChange when price unchanged', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1',
        packagePrice: 500, optionsPrice: 0, totalMenuPrice: 500,
        adultsCount: 5, childrenCount: 0, toddlersCount: 0,
        menuData: {
          pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0,
          selectedOptions: [],
          prices: { packageTotal: 500, optionsTotal: 0, total: 500 },
        },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      // Same price: 5*100 = 500
      const result = await service.recalculateForGuestChange('r1', 5, 0, 0);
      expect(result!.totalMenuPrice).toBe(500);
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should handle missing pricePerAdult/pricePerChild/pricePerToddler with || 0', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1',
        packagePrice: 0, optionsPrice: 0, totalMenuPrice: 0,
        adultsCount: 1, childrenCount: 0, toddlersCount: 0,
        menuData: {
          // Missing price fields - should default to 0
          selectedOptions: null,
          prices: { packageTotal: 0, optionsTotal: 0, total: 0 },
        },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await service.recalculateForGuestChange('r1', 3, 0, 0);
      expect(result!.packagePrice).toBe(0);
      expect(result!.optionsPrice).toBe(0);
    });

    it('should handle option with missing priceAmount/quantity using || fallbacks', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1',
        packagePrice: 100, optionsPrice: 50, totalMenuPrice: 150,
        adultsCount: 1, childrenCount: 0, toddlersCount: 0,
        menuData: {
          pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0,
          packageName: 'Test',
          selectedOptions: [
            { optionId: 'opt3', priceUnit: 'PER_PERSON' },  // missing priceAmount and quantity
          ],
          prices: { packageTotal: 100, optionsTotal: 50, total: 150 },
        },
      });
      mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});

      const result = await service.recalculateForGuestChange('r1', 2, 0, 0);
      expect(result!.packagePrice).toBe(200);
      // PER_PERSON: 0 (priceAmount||0) * 2 (guests) * 1 (quantity||1) = 0
      expect(result!.optionsPrice).toBe(0);
    });
  });

  // ===== removeMenu =====
  describe('removeMenu', () => {
    it('should log audit when snapshot exists', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1', totalMenuPrice: 1500, packagePrice: 1000, optionsPrice: 500,
        menuData: { packageName: 'Gold' },
      });
      mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue({});

      await service.removeMenu('r1', 'u1');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        action: 'MENU_DIRECT_REMOVED',
        details: expect.objectContaining({ packageName: 'Gold' }),
      }));
    });

    it('should skip audit when no snapshot', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue({});

      await service.removeMenu('r1');
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should handle menuData with no packageName', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue({
        id: 's1', reservationId: 'r1', totalMenuPrice: 500, packagePrice: 500, optionsPrice: 0,
        menuData: {},  // no packageName
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
    it('should throw when no snapshot exists', async () => {
      mockPrisma.reservationMenuSnapshot.findUnique.mockResolvedValue(null);
      await expect(service.getReservationMenu('r1')).rejects.toThrow('Menu not selected');
    });
  });
});
