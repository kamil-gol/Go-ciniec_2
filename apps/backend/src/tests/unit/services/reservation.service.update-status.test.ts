/**
 * ReservationService — Unit Tests: Update & Status
 * Testy aktualizacji rezerwacji i zmiany statusow
 *
 * WAZNE: updateReservation() nie zapisuje totalPrice bezposrednio w prisma.update.data.
 * Po update wywoluje recalculateReservationTotalPrice(id) — dlatego sprawdzamy spy na recalculate.
 *
 * WAZNE: logChange jest wywolywane tylko gdy diffObjects wykryje roznice.
 * Dlatego w teScie logChange mock update musi zwracac obiekt z innymi polami niz BASE_RESERVATION.
 */
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservation: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    hall: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    menuPackage: { findUnique: jest.fn() },
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@test.pl' }) },
    reservationHistory: { create: jest.fn().mockResolvedValue({}) },
    reservationCategoryExtra: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn(), deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
  },
}));

jest.mock('../../../utils/recalculate-price', () => ({
  computeReservationBasePrice: jest.fn(),
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ notes: { old: null, new: 'Audit test' } }),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../services/audit-log.service', () => ({
  auditLogService: { log: jest.fn() },
}));

jest.mock('../../../services/email.service', () => ({
  emailService: {
    sendReservationConfirmation: jest.fn(),
    sendReservationCancellation: jest.fn(),
  },
}));

jest.mock('../../../services/notification.service', () => ({
  __esModule: true,
  default: { createForAll: jest.fn().mockResolvedValue(0) },
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  default: {
    recalculateForGuestChange: jest.fn(),
  },
}));

import { prisma } from '../../../lib/prisma';
import { recalculateReservationTotalPrice } from '../../../utils/recalculate-price';
import { reservationService } from '../../../services/reservation.service';

const mockPrisma = prisma as any;
const mockRecalculate = recalculateReservationTotalPrice as jest.Mock;

const BASE_RESERVATION = {
  id: 'res-001',
  hallId: 'hall-1',
  eventTypeId: 'et-1',
  menuPackageId: null,
  adults: 50,
  children: 10,
  toddlers: 5,
  guests: 65,
  pricePerAdult: 200,
  pricePerChild: 100,
  pricePerToddler: 50,
  totalPrice: 12000,
  status: 'PENDING',
  date: new Date('2026-06-15'),
  startTime: '16:00',
  endTime: '23:00',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.pl', phone: '123456789' },
  hall: { id: 'hall-1', name: 'Sala A', isActive: true, capacity: 100, isWholeVenue: false, allowMultipleBookings: false, allowWithWholeVenue: false },
  eventType: { id: 'et-1', name: 'Wesele' },
  menuPackage: null,
  extras: [],
  deposits: [],
  menuSnapshot: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION);
  mockPrisma.reservation.update.mockResolvedValue({ ...BASE_RESERVATION });
  mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@test.pl' });
  mockPrisma.reservationHistory.create.mockResolvedValue({});
  mockRecalculate.mockResolvedValue(undefined);
});

describe('ReservationService', () => {
  describe('updateReservation()', () => {
    it('should update basic fields', async () => {
      await reservationService.updateReservation('res-001', {
        notes: 'Test notatka do rezerwacji',
        reason: 'Aktualizacja notatki w rezerwacji',
      }, 'user-1');
      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.notes).toBe('Test notatka do rezerwacji');
    });

    it('should recalculate total price on guest change (no menu)', async () => {
      await reservationService.updateReservation('res-001', {
        adults: 60,
        children: 10,
        toddlers: 5,
        reason: 'Zmiana liczby gosci w rezerwacji',
      }, 'user-1');
      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.adults).toBe(60);
      expect(updateCall.data.guests).toBeDefined();
      expect(mockRecalculate).toHaveBeenCalledWith('res-001');
    });

    it('should update notes to CONFIRMED value', async () => {
      mockPrisma.reservation.update.mockResolvedValue({ ...BASE_RESERVATION, notes: 'CONFIRMED' });
      await reservationService.updateReservation('res-001', {
        notes: 'CONFIRMED notatka aktualizacja',
        reason: 'Aktualizacja statusu potwierdzenia',
      }, 'user-1');
      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.notes).toBe('CONFIRMED notatka aktualizacja');
    });

    it('should update notes to CANCELLED value', async () => {
      mockPrisma.reservation.update.mockResolvedValue({ ...BASE_RESERVATION, notes: 'CANCELLED' });
      await reservationService.updateReservation('res-001', {
        notes: 'CANCELLED notatka aktualizacja',
        reason: 'Aktualizacja statusu anulowania',
      }, 'user-1');
      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.notes).toBe('CANCELLED notatka aktualizacja');
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(reservationService.updateReservation('nonexistent', {
        notes: 'test notatka aktualizacja rezerwacji',
        reason: 'Aktualizacja nieistniejacego rekordu',
      }, 'user-1')).rejects.toThrow();
    });

    it('should NOT call logChange on update (#217: removed in favor of createHistoryEntry)', async () => {
      // #217: logChange was removed from updateReservation — createHistoryEntry covers it
      const { logChange } = await import('../../../utils/audit-logger');
      mockPrisma.reservation.update.mockResolvedValue({
        ...BASE_RESERVATION,
        notes: 'Audit test notatka rezerwacji',
      });
      await reservationService.updateReservation('res-001', {
        notes: 'Audit test notatka rezerwacji',
        reason: 'Test wywolania audit log zmiany',
      }, 'user-1');
      expect(logChange).not.toHaveBeenCalled();
    });
  });

  describe('getReservationById()', () => {
    it('should return reservation by id', async () => {
      const result = await reservationService.getReservationById('res-001');
      expect(result).toBeDefined();
      expect((result as any).id).toBe('res-001');
    });

    it('should throw when not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(reservationService.getReservationById('nonexistent'))
        .rejects.toThrow();
    });

    it('should include hall and eventType', async () => {
      const result = await reservationService.getReservationById('res-001');
      expect((result as any).hall).toBeDefined();
      expect((result as any).eventType).toBeDefined();
    });
  });

  describe('cancelReservation()', () => {
    it('should cancel reservation', async () => {
      const cancelRes = { ...BASE_RESERVATION, status: 'ARCHIVED' };
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION);
      (mockPrisma as any).$transaction = jest.fn().mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.reservation.update.mockResolvedValue(cancelRes);
      (mockPrisma as any).deposit = { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() };
      await expect(reservationService.cancelReservation('res-001', 'user-1')).resolves.not.toThrow();
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(reservationService.cancelReservation('nonexistent', 'user-1'))
        .rejects.toThrow();
    });
  });
});
