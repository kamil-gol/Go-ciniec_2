/**
 * ReservationService — Unit Tests: Update & Status
 * Testy aktualizacji rezerwacji i zmiany statusów
 *
 * WAŻNE: updateReservation() nie zapisuje totalPrice bezpośrednio w prisma.update.data.
 * Po update wywołuje recalculateReservationTotalPrice(id) — dlatego sprawdzamy spy na recalculate.
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
  },
}));

jest.mock('../../../utils/recalculate-price', () => ({
  computeReservationBasePrice: jest.fn(),
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
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
  hall: { id: 'hall-1', name: 'Sala A', isActive: true, capacity: 100 },
  eventType: { id: 'et-1', name: 'Wesele' },
  menuPackage: null,
  extras: [],
  deposits: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION);
  mockPrisma.reservation.update.mockResolvedValue({ ...BASE_RESERVATION });
  mockRecalculate.mockResolvedValue(undefined);
});

describe('ReservationService', () => {

  describe('updateReservation()', () => {

    it('should update basic fields', async () => {
      await reservationService.updateReservation('res-001', {
        notes: 'Test notatka',
      }, 'user-1');

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.notes).toBe('Test notatka');
    });

    it('should recalculate total price on guest change (no menu)', async () => {
      await reservationService.updateReservation('res-001', {
        adults: 60,
        children: 10,
        toddlers: 5,
      }, 'user-1');

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      // POPRAWKA: totalPrice NIE jest w data bezpośrednio — serwis wywołuje recalculate po update
      // Weryfikujemy dane gości i wywołanie recalculate
      expect(updateCall.data.adults).toBe(60);
      expect(updateCall.data.guests).toBeDefined(); // guests = adults+children+toddlers
      // recalculate powinno być wywołane po update
      expect(mockRecalculate).toHaveBeenCalledWith('res-001');
    });

    it('should update status to CONFIRMED', async () => {
      mockPrisma.reservation.update.mockResolvedValue({ ...BASE_RESERVATION, status: 'CONFIRMED' });

      const result = await reservationService.updateReservation('res-001', {
        status: 'CONFIRMED',
      }, 'user-1');

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('CONFIRMED');
    });

    it('should update status to CANCELLED', async () => {
      mockPrisma.reservation.update.mockResolvedValue({ ...BASE_RESERVATION, status: 'CANCELLED' });

      await reservationService.updateReservation('res-001', {
        status: 'CANCELLED',
      }, 'user-1');

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('CANCELLED');
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(reservationService.updateReservation('nonexistent', {
        notes: 'test',
      }, 'user-1')).rejects.toThrow();
    });

    it('should call logChange on update', async () => {
      const { logChange } = await import('../../../utils/audit-logger');

      await reservationService.updateReservation('res-001', {
        notes: 'Audit test',
      }, 'user-1');

      expect(logChange).toHaveBeenCalled();
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

  describe('deleteReservation()', () => {

    it('should delete reservation', async () => {
      mockPrisma.reservation.update.mockResolvedValue({ ...BASE_RESERVATION, status: 'CANCELLED' });

      await reservationService.deleteReservation('res-001', 'user-1');

      expect(mockPrisma.reservation.update).toHaveBeenCalled();
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(reservationService.deleteReservation('nonexistent', 'user-1'))
        .rejects.toThrow();
    });
  });
});
