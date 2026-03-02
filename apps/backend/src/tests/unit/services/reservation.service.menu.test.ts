/**
 * ReservationService — Unit Tests: Menu Update
 * Część 4/4 testów modułu Rezerwacje
 *
 * NOTE: MenuOption system was replaced by ServiceExtras.
 * Tests cover menuPackage add/update/remove and status transitions.
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
    reservationMenuSnapshot: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deposit: { create: jest.fn() },
    reservationHistory: { create: jest.fn() },
    activityLog: { create: jest.fn() },
    serviceItem: { findMany: jest.fn() },
    reservationExtra: { create: jest.fn() },
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

jest.mock('../../../utils/venue-surcharge', () => ({
  calculateVenueSurcharge: jest.fn().mockReturnValue({ amount: 0, label: null }),
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(0),
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
};

let service: ReservationService;

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.reservation.findMany.mockResolvedValue([]);
  mockPrisma.reservation.findFirst.mockResolvedValue(null);
  mockPrisma.hall.findFirst.mockResolvedValue(null);
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

      expect(result.message).toMatch(/zaktualizowane|updated/i);
      expect(mockPrisma.reservationMenuSnapshot.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.reservation.update).toHaveBeenCalledTimes(1);
    });

    it('should update existing snapshot when one exists', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        menuSnapshot: { id: 'snap-uuid-001', menuData: { packageName: 'Old' }, totalMenuPrice: 10000 },
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

      expect(result.message).toMatch(/usunięte|removed/i);
      expect(mockPrisma.reservationMenuSnapshot.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.updateReservationMenu('nonexistent', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID)).rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should throw when reservation is completed', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: ReservationStatus.COMPLETED,
      });

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID)).rejects.toThrow(/zakończonej/);
    });

    it('should throw when reservation is archived', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: ReservationStatus.ARCHIVED,
      });

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID)).rejects.toThrow(/zarchiwizowanej/);
    });

    it('should throw when guests below package minimum', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        ...MENU_PACKAGE,
        minGuests: 100, // our reservation has 65
      });

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID)).rejects.toThrow(/minimum 100 gości/);
    });

    it('should throw when guests above package maximum', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        ...MENU_PACKAGE,
        maxGuests: 30, // our reservation has 65
      });

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-uuid-001',
      }, TEST_USER_ID)).rejects.toThrow(/maksimum 30 go/);
    });

    it('should throw when menu package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);

      await expect(service.updateReservationMenu('res-uuid-001', {
        menuPackageId: 'pkg-nonexistent',
      }, TEST_USER_ID)).rejects.toThrow(/pakiet|package/i);
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
      }, TEST_USER_ID)).rejects.toThrow(/Nie można zmienić statusu/);
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
      }, TEST_USER_ID)).rejects.toThrow(/Nie można zmienić statusu/);
    });

    it('should block ARCHIVED → any status', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: ReservationStatus.ARCHIVED,
        client: BASE_RESERVATION.client,
        hall: BASE_RESERVATION.hall,
      });

      await expect(service.updateStatus('res-uuid-001', {
        status: ReservationStatus.PENDING,
      }, TEST_USER_ID)).rejects.toThrow(/Nie można zmienić statusu/);
    });
  });
});
