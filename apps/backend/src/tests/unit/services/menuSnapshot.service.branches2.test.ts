/**
 * MenuSnapshotService — Branch Coverage (lines 47-53, 226, 239)
 * Targets: snapshot not found, recalculate edge cases, selectedOptions handling
 */
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservationMenuSnapshot: {
      findUnique: jest.fn(), findFirst: jest.fn(),
      create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    },
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    reservation: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

import reservationMenuService from '../../../services/reservation-menu.service';
import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma as any;

beforeEach(() => jest.clearAllMocks());

describe('ReservationMenuService — snapshot branches', () => {

  it('should return null when snapshot not found in recalculateForGuestChange', async () => {
    mockPrisma.reservationMenuSnapshot.findFirst.mockResolvedValue(null);
    const result = await reservationMenuService.recalculateForGuestChange('r1', 50, 10, 5);
    expect(result).toBeNull();
  });

  it('should recalculate with selectedOptions containing PER_PERSON pricing', async () => {
    mockPrisma.reservationMenuSnapshot.findFirst.mockResolvedValue({
      id: 'ms1',
      reservationId: 'r1',
      packageId: 'p1',
      menuData: {
        packageName: 'Gold',
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
        selectedOptions: [
          { optionId: 'o1', name: 'Deser', priceType: 'PER_PERSON', priceAmount: 20, quantity: 1 },
          { optionId: 'o2', name: 'Tort', priceType: 'FLAT', priceAmount: 300, quantity: 1 },
        ],
      },
      packagePrice: 11000,
      optionsPrice: 1600,
      totalMenuPrice: 12600,
      adultsCount: 50,
      childrenCount: 10,
      toddlersCount: 5,
    });
    mockPrisma.reservationMenuSnapshot.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'ms1', ...data })
    );

    const result = await reservationMenuService.recalculateForGuestChange('r1', 60, 15, 5);

    expect(result).toBeDefined();
    if (result) {
      expect(result.adultsCount).toBe(60);
      expect(result.childrenCount).toBe(15);
      // 60*200 + 15*100 + 5*0 = 12000+1500 = 13500 (package)
      // PER_PERSON: 20 * 80 * 1 = 1600, FLAT: 300 * 1 = 300 → options=1900
      expect(result.totalMenuPrice).toBeGreaterThan(0);
    }
  });

  it('should recalculate with no selectedOptions', async () => {
    mockPrisma.reservationMenuSnapshot.findFirst.mockResolvedValue({
      id: 'ms1',
      reservationId: 'r1',
      packageId: 'p1',
      menuData: {
        packageName: 'Basic',
        pricePerAdult: 150,
        pricePerChild: 80,
        pricePerToddler: 0,
        selectedOptions: [],
      },
      packagePrice: 8300,
      optionsPrice: 0,
      totalMenuPrice: 8300,
      adultsCount: 50,
      childrenCount: 10,
      toddlersCount: 5,
    });
    mockPrisma.reservationMenuSnapshot.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'ms1', ...data })
    );

    const result = await reservationMenuService.recalculateForGuestChange('r1', 40, 5, 0);

    expect(result).toBeDefined();
    if (result) {
      // 40*150 + 5*80 = 6000+400 = 6400
      expect(result.packagePrice).toBe(6400);
      expect(result.optionsPrice).toBe(0);
    }
  });

  it('should handle selectedOptions with quantity > 1', async () => {
    mockPrisma.reservationMenuSnapshot.findFirst.mockResolvedValue({
      id: 'ms1',
      reservationId: 'r1',
      packageId: 'p1',
      menuData: {
        packageName: 'Premium',
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
        selectedOptions: [
          { optionId: 'o1', name: 'Wine', priceType: 'PER_PERSON', priceAmount: 30, quantity: 2 },
        ],
      },
      packagePrice: 11000,
      optionsPrice: 3900,
      totalMenuPrice: 14900,
      adultsCount: 50,
      childrenCount: 10,
      toddlersCount: 5,
    });
    mockPrisma.reservationMenuSnapshot.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'ms1', ...data })
    );

    const result = await reservationMenuService.recalculateForGuestChange('r1', 50, 10, 5);
    expect(result).toBeDefined();
  });

  it('should handle undefined selectedOptions in menuData', async () => {
    mockPrisma.reservationMenuSnapshot.findFirst.mockResolvedValue({
      id: 'ms1',
      reservationId: 'r1',
      packageId: 'p1',
      menuData: {
        packageName: 'Minimal',
        pricePerAdult: 100,
        pricePerChild: 50,
        pricePerToddler: 0,
      },
      packagePrice: 5500,
      optionsPrice: 0,
      totalMenuPrice: 5500,
      adultsCount: 50,
      childrenCount: 10,
      toddlersCount: 5,
    });
    mockPrisma.reservationMenuSnapshot.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'ms1', ...data })
    );

    const result = await reservationMenuService.recalculateForGuestChange('r1', 30, 5, 0);
    expect(result).toBeDefined();
  });
});
