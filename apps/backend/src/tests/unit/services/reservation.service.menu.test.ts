/**
 * ReservationService — Unit Tests: Menu Update + Options
 * Część 4/4 testów modułu Rezerwacje
 */

// ═══ Mock Prisma ═══
jest.mock('../../../lib/prisma', () => {
  const mock = {
    hall: { findUnique: jest.fn(), findFirst: jest.fn() },
    client: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    reservation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    reservationMenuSnapshot: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deposit: { create: jest.fn() },
    reservationHistory: { create: jest.fn() },
    activityLog: { create: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  __esModule: true,
  default: { recalculateForGuestChange: jest.fn().mockResolvedValue(null) },
}));

import { ReservationService } from '../../../services/reservation.service';
import { ReservationStatus } from '../../../types/reservation.types';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;

const TEST_USER_ID = 'user-uuid-001';

const BASE_RESERVATION = {
  id: 'res-uuid-001',
  hallId: 'hall-uuid-001',
  clientId: 'client-uuid-001',
  adults: 50,
  children: 10,
  toddlers: 5,
  guests: 65,
  status: ReservationStatus.PENDING,
  totalPrice: '11250',
  client: { firstName: 'Jan', lastName: 'Kowalski' },
  hall: { name: 'Sala Główna' },
  menuSnapshot: null,
};

const MENU_PACKAGE = {
  id: 'pkg-uuid-001',
  name: 'Pakiet Premium',
  description: 'Pakiet z pełnym menu',
  menuTemplateId: 'tpl-uuid-001',
  pricePerAdult: '250',
  pricePerChild: '120',
  pricePerToddler: '60',
  minGuests: 20,
  maxGuests: 200,
  menuTemplate: { id: 'tpl-uuid-001', name: 'Szablon Wesele' },
  packageOptions: [],
};

let service: ReservationService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new ReservationService();

  mockPrisma.user.findUnique.mockResolvedValue({ id: TEST_USER_ID });
  mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION);
  mockPrisma.reservation.update.mockResolvedValue(BASE_RESERVATION);
  mockPrisma.menuPackage.findUnique.mockResolvedValue(MENU_PACKAGE);
  mockPrisma.reservationMenuSnapshot.create.mockResolvedValue({});
  mockPrisma.reservationMenuSnapshot.update.mockResolvedValue({});
  mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue({});
  mockPrisma.reservationHistory.create.mockResolvedValue({});
  mockPrisma.activityLog.create.mockResolvedValue({});
});

describe('ReservationService', () => {

  // ══════════════════════════════════════════════════════════════
  // updateReservationMenu — add / update package
  // ══════════════════════════════════════════════════════════════
  describe('updateReservationMenu()', () => {

    it('should add menu package to reservation (no existing snapshot)', async () => {
      const result = await service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID);

      expect(result.message).toBe('Menu updated successfully');
      expect(mockPrisma.reservationMenuSnapshot.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.reservation.update).toHaveBeenCalledTimes(1);
    });

    it('should calculate total with package prices', async () => {
      await service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID);

      // 50*250 + 10*120 + 5*60 = 12500 + 1200 + 300 = 14000
      expect(mockPrisma.reservation.update.mock.calls[0][0].data.totalPrice).toBe(14000);
    });

    it('should update existing snapshot when one exists', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        menuSnapshot: { id: 'snap-uuid-001', menuData: { packageName: 'Old' } },
      });

      await service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID);

      expect(mockPrisma.reservationMenuSnapshot.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.reservationMenuSnapshot.create).not.toHaveBeenCalled();
    });

    it('should remove menu when menuPackageId is null', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        menuSnapshot: { id: 'snap-uuid-001', menuData: { packageName: 'Pakiet' }, totalMenuPrice: 14000 },
      });

      const result = await service.updateReservationMenu('res-uuid-001', {
        menuPackageId: null,
      }, TEST_USER_ID);

      expect(result.message).toBe('Menu removed successfully');
      expect(mockPrisma.reservationMenuSnapshot.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.updateReservationMenu('nonexistent', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID)).rejects.toThrow('Reservation not found');
    });

    it('should throw when reservation is completed', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: ReservationStatus.COMPLETED,
      });

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID)).rejects.toThrow(/completed or cancelled/);
    });

    it('should throw when guests below package minimum', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        ...MENU_PACKAGE,
        minGuests: 100, // our reservation has 65
      });

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID)).rejects.toThrow(/at least 100 guests/);
    });

    it('should throw when guests above package maximum', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        ...MENU_PACKAGE,
        maxGuests: 30, // our reservation has 65
      });

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID)).rejects.toThrow(/maximum 30 guests/);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // updateReservationMenu — with selected options
  // ══════════════════════════════════════════════════════════════
  describe('updateReservationMenu() with options', () => {

    const PER_PERSON_OPTION = {
      id: 'opt-001',
      name: 'Bar otwarty',
      description: 'Open bar',
      category: 'DRINKS',
      priceType: 'PER_PERSON',
      priceAmount: 50, // Decimal mock
      isActive: true,
      allowMultiple: false,
      maxQuantity: null,
    };

    const FLAT_OPTION = {
      id: 'opt-002',
      name: 'Dekoracje',
      description: 'Dekoracje sali',
      category: 'DECORATION',
      priceType: 'FLAT',
      priceAmount: 2000,
      isActive: true,
      allowMultiple: true,
      maxQuantity: 5,
    };

    it('should calculate PER_PERSON option price correctly', async () => {
      mockPrisma.menuOption.findMany.mockResolvedValue([PER_PERSON_OPTION]);

      await service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
        selectedOptions: [{ optionId: 'opt-001', quantity: 1 }],
      }, TEST_USER_ID);

      // Package: 50*250 + 10*120 + 5*60 = 14000
      // Option PER_PERSON: 50 * 65 guests * 1 = 3250
      // Total: 14000 + 3250 = 17250
      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.totalPrice).toBe(17250);
    });

    it('should calculate FLAT option price correctly', async () => {
      mockPrisma.menuOption.findMany.mockResolvedValue([FLAT_OPTION]);

      await service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
        selectedOptions: [{ optionId: 'opt-002', quantity: 2 }],
      }, TEST_USER_ID);

      // Package: 14000
      // Option FLAT: 2000 * 2 = 4000
      // Total: 14000 + 4000 = 18000
      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.totalPrice).toBe(18000);
    });

    it('should throw when option not found', async () => {
      mockPrisma.menuOption.findMany.mockResolvedValue([]); // empty

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
        selectedOptions: [{ optionId: 'opt-999' }],
      }, TEST_USER_ID)).rejects.toThrow(/not found/);
    });

    it('should throw when option is inactive', async () => {
      mockPrisma.menuOption.findMany.mockResolvedValue([
        { ...PER_PERSON_OPTION, isActive: false },
      ]);

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
        selectedOptions: [{ optionId: 'opt-001' }],
      }, TEST_USER_ID)).rejects.toThrow(/not active/);
    });

    it('should throw when quantity exceeds maxQuantity', async () => {
      mockPrisma.menuOption.findMany.mockResolvedValue([FLAT_OPTION]);

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
        selectedOptions: [{ optionId: 'opt-002', quantity: 10 }], // max is 5
      }, TEST_USER_ID)).rejects.toThrow(/Maximum 5/);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Edge cases — validateStatusTransition (tested indirectly)
  // ══════════════════════════════════════════════════════════════
  describe('validateStatusTransition (indirect)', () => {

    it('should block CONFIRMED → PENDING', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: ReservationStatus.CONFIRMED,
        client: BASE_RESERVATION.client,
        hall: BASE_RESERVATION.hall,
      });

      await expect(service.updateStatus('res-uuid-001', {
        status: ReservationStatus.PENDING,
      }, TEST_USER_ID)).rejects.toThrow(/Cannot change status/);
    });

    it('should block COMPLETED → PENDING', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: ReservationStatus.COMPLETED,
        client: BASE_RESERVATION.client,
        hall: BASE_RESERVATION.hall,
      });

      await expect(service.updateStatus('res-uuid-001', {
        status: ReservationStatus.PENDING,
      }, TEST_USER_ID)).rejects.toThrow(/Cannot change status/);
    });
  });
});
