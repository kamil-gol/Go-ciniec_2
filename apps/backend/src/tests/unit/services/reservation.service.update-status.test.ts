/**
 * ReservationService — Unit Tests: Update + Status + Cancel + Archive
 * Część 3/4 testów modułu Rezerwacje
 */

// ═══ Mock Prisma ═══
jest.mock('../../../lib/prisma', () => {
  const txMock = {
    reservation: { update: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    deposit: { findMany: jest.fn(), updateMany: jest.fn() },
    reservationHistory: { create: jest.fn() },
    serviceItem: { findMany: jest.fn() },
    reservationExtra: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  };
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
    deposit: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    reservationHistory: { create: jest.fn() },
    activityLog: { create: jest.fn() },
    serviceItem: { findMany: jest.fn() },
    reservationExtra: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn((fn: any) => fn(txMock)),
    __txMock: txMock,
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/venue-surcharge', () => ({
  calculateVenueSurcharge: jest.fn().mockReturnValue(0),
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockImplementation(
    (adults: number, children: number, toddlers: number, ppa: number, ppc: number, ppt: number) =>
      adults * ppa + children * ppc + toddlers * (ppt || 0)
  ),
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  __esModule: true,
  default: { recalculateForGuestChange: jest.fn().mockResolvedValue(null) },
}));

import { ReservationService } from '../../../services/reservation.service';
import { ReservationStatus } from '../../../types/reservation.types';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;
const txMock = mockPrisma.__txMock;

const TEST_USER_ID = 'user-uuid-001';

const EXISTING_RESERVATION = {
  id: 'res-uuid-001',
  hallId: 'hall-uuid-001',
  clientId: 'client-uuid-001',
  eventTypeId: 'event-uuid-001',
  startDateTime: new Date('2026-08-15T14:00:00.000Z'),
  endDateTime: new Date('2026-08-15T22:00:00.000Z'),
  adults: 50,
  children: 10,
  toddlers: 5,
  guests: 65,
  pricePerAdult: 200,
  pricePerChild: 100,
  pricePerToddler: 50,
  totalPrice: 11250,
  status: ReservationStatus.PENDING,
  notes: null,
  confirmationDeadline: null,
  customEventType: null,
  birthdayAge: null,
  anniversaryYear: null,
  anniversaryOccasion: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  hall: { id: 'hall-uuid-001', name: 'Sala Główna', capacity: 100, isWholeVenue: false, allowMultipleBookings: false },
  client: { id: 'client-uuid-001', firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.pl', phone: null },
  eventType: { id: 'event-uuid-001', name: 'Wesele' },
  menuSnapshot: null,
};

let service: ReservationService;

beforeEach(() => {
  jest.clearAllMocks();
  if (mockPrisma.reservation?.findMany) mockPrisma.reservation.findMany.mockResolvedValue([]);
  if (mockPrisma.reservation?.findFirst) mockPrisma.reservation.findFirst.mockResolvedValue(null);
  if (mockPrisma.hall?.findFirst) mockPrisma.hall.findFirst.mockResolvedValue(null);
  mockPrisma.serviceItem.findMany.mockResolvedValue([]);
  mockPrisma.reservationExtra.findMany.mockResolvedValue([]);
  service = new ReservationService();

  mockPrisma.user.findUnique.mockResolvedValue({ id: TEST_USER_ID });
  mockPrisma.hall.findUnique.mockResolvedValue(EXISTING_RESERVATION.hall);
  mockPrisma.hall.findFirst.mockResolvedValue(null);
  mockPrisma.reservation.findUnique.mockResolvedValue(EXISTING_RESERVATION);
  mockPrisma.reservation.findFirst.mockResolvedValue(null);
  mockPrisma.reservation.update.mockResolvedValue(EXISTING_RESERVATION);
  mockPrisma.reservationHistory.create.mockResolvedValue({});
  mockPrisma.activityLog.create.mockResolvedValue({});

  // Transaction mocks
  txMock.reservation.update.mockResolvedValue(EXISTING_RESERVATION);
  txMock.reservation.findFirst.mockResolvedValue(null);
  txMock.reservation.findMany.mockResolvedValue([]);
  txMock.deposit.findMany.mockResolvedValue([]);
  txMock.deposit.updateMany.mockResolvedValue({ count: 0 });
  txMock.reservationHistory.create.mockResolvedValue({});
  txMock.serviceItem.findMany.mockResolvedValue([]);
  txMock.reservationExtra.findMany.mockResolvedValue([]);
});

describe('ReservationService', () => {

  // ══════════════════════════════════════════════════════════════
  // updateReservation
  // ══════════════════════════════════════════════════════════════
  describe('updateReservation()', () => {

    it('should update reservation without changes (no reason needed)', async () => {
      const result = await service.updateReservation('res-uuid-001', {}, TEST_USER_ID);
      expect(result).toBeDefined();
      expect(mockPrisma.reservation.update).toHaveBeenCalledTimes(1);
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.updateReservation('nonexistent', {}, TEST_USER_ID))
        .rejects.toThrow('Nie znaleziono rezerwacji');
    });

    it('should throw when updating completed reservation', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...EXISTING_RESERVATION,
        status: ReservationStatus.COMPLETED,
      });
      await expect(service.updateReservation('res-uuid-001', {}, TEST_USER_ID))
        .rejects.toThrow('Nie można edytować zakończonej rezerwacji');
    });

    it('should throw when updating cancelled reservation', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...EXISTING_RESERVATION,
        status: ReservationStatus.CANCELLED,
      });
      await expect(service.updateReservation('res-uuid-001', {}, TEST_USER_ID))
        .rejects.toThrow('Nie można edytować anulowanej rezerwacji');
    });

    it('should require reason (min 10 chars) when changes detected', async () => {
      await expect(service.updateReservation('res-uuid-001', {
        adults: 60,
        reason: 'short',
      }, TEST_USER_ID)).rejects.toThrow(/Powód zmian jest wymagany/);
    });

    it('should recalculate total price on guest change (no menu)', async () => {
      await service.updateReservation('res-uuid-001', {
        adults: 60,
        reason: 'Klient dodał 10 osób do listy gości',
      }, TEST_USER_ID);

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      // 60*200 + 10*100 + 5*50 = 12000 + 1000 + 250 = 13250
      expect(updateCall.data.totalPrice).toBe(13250);
      expect(updateCall.data.guests).toBe(75); // 60+10+5
    });

    it('should throw when new guests exceed capacity', async () => {
      await expect(service.updateReservation('res-uuid-001', {
        adults: 90,
        children: 20,
        reason: 'Zwiększenie liczby gości na weselu',
      }, TEST_USER_ID)).rejects.toThrow(/przekracza pojemność sali/);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // updateStatus
  // ══════════════════════════════════════════════════════════════
  describe('updateStatus()', () => {

    it('should transition PENDING → CONFIRMED', async () => {
      const result = await service.updateStatus('res-uuid-001', {
        status: ReservationStatus.CONFIRMED,
        reason: 'Klient potwierdził telefonicznie',
      }, TEST_USER_ID);

      expect(result).toBeDefined();
      expect(mockPrisma.reservation.update).toHaveBeenCalledTimes(1);
      const call = mockPrisma.reservation.update.mock.calls[0][0];
      expect(call.data.status).toBe('CONFIRMED');
    });

    it('should transition PENDING → CANCELLED (via transaction)', async () => {
      await service.updateStatus('res-uuid-001', {
        status: ReservationStatus.CANCELLED,
        reason: 'Klient zrezygnował',
      }, TEST_USER_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(txMock.reservation.update).toHaveBeenCalledTimes(1);
    });

    it('should throw on invalid transition PENDING → COMPLETED', async () => {
      await expect(service.updateStatus('res-uuid-001', {
        status: ReservationStatus.COMPLETED,
      }, TEST_USER_ID)).rejects.toThrow(/Nie można zmienić statusu/);
    });

    it('should throw on invalid transition COMPLETED → anything', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...EXISTING_RESERVATION,
        status: ReservationStatus.COMPLETED,
      });

      await expect(service.updateStatus('res-uuid-001', {
        status: ReservationStatus.CANCELLED,
      }, TEST_USER_ID)).rejects.toThrow(/Nie można zmienić statusu/);
    });

    it('should throw on invalid transition CANCELLED → anything', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...EXISTING_RESERVATION,
        status: ReservationStatus.CANCELLED,
      });

      await expect(service.updateStatus('res-uuid-001', {
        status: ReservationStatus.CONFIRMED,
      }, TEST_USER_ID)).rejects.toThrow(/Nie można zmienić statusu/);
    });

    it('should allow CONFIRMED → COMPLETED for past events', async () => {
      const pastReservation = {
        ...EXISTING_RESERVATION,
        status: ReservationStatus.CONFIRMED,
        startDateTime: new Date('2025-01-15T14:00:00.000Z'), // past
      };
      mockPrisma.reservation.findUnique.mockResolvedValue(pastReservation);

      const result = await service.updateStatus('res-uuid-001', {
        status: ReservationStatus.COMPLETED,
      }, TEST_USER_ID);

      expect(result).toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // cancelReservation
  // ══════════════════════════════════════════════════════════════
  describe('cancelReservation()', () => {

    it('should cancel reservation and set archivedAt', async () => {
      await service.cancelReservation('res-uuid-001', TEST_USER_ID, 'Klient zrezygnował');

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(txMock.reservation.update).toHaveBeenCalledTimes(1);

      const updateCall = txMock.reservation.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('CANCELLED');
      expect(updateCall.data.archivedAt).toBeDefined();
    });

    it('should throw when already cancelled', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...EXISTING_RESERVATION,
        status: ReservationStatus.CANCELLED,
      });

      await expect(service.cancelReservation('res-uuid-001', TEST_USER_ID))
        .rejects.toThrow('Rezerwacja jest już anulowana');
    });

    it('should throw when reservation is completed', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...EXISTING_RESERVATION,
        status: ReservationStatus.COMPLETED,
      });

      await expect(service.cancelReservation('res-uuid-001', TEST_USER_ID))
        .rejects.toThrow('Nie można anulować zakończonej rezerwacji');
    });

    it('should cascade cancel pending deposits', async () => {
      txMock.deposit.findMany.mockResolvedValue([
        { id: 'dep-1', amount: 500, status: 'PENDING' },
        { id: 'dep-2', amount: 300, status: 'OVERDUE' },
      ]);

      await service.cancelReservation('res-uuid-001', TEST_USER_ID, 'Anulowanie');

      expect(txMock.deposit.updateMany).toHaveBeenCalledTimes(1);
      const updateCall = txMock.deposit.updateMany.mock.calls[0][0];
      expect(updateCall.data.status).toBe('CANCELLED');

      // History entry for each deposit
      expect(txMock.reservationHistory.create).toHaveBeenCalledTimes(3); // 1 cancel + 2 deposits
    });
  });

  // ══════════════════════════════════════════════════════════════
  // archiveReservation
  // ══════════════════════════════════════════════════════════════
  describe('archiveReservation()', () => {

    it('should set archivedAt timestamp', async () => {
      await service.archiveReservation('res-uuid-001', TEST_USER_ID, 'Archiwizacja');

      expect(mockPrisma.reservation.update).toHaveBeenCalledTimes(1);
      const call = mockPrisma.reservation.update.mock.calls[0][0];
      expect(call.data.archivedAt).toBeInstanceOf(Date);
    });

    it('should throw when already archived', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...EXISTING_RESERVATION,
        archivedAt: new Date(),
      });

      await expect(service.archiveReservation('res-uuid-001', TEST_USER_ID))
        .rejects.toThrow('Rezerwacja jest już zarchiwizowana');
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.archiveReservation('nonexistent', TEST_USER_ID))
        .rejects.toThrow('Nie znaleziono rezerwacji');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // unarchiveReservation
  // ══════════════════════════════════════════════════════════════
  describe('unarchiveReservation()', () => {

    it('should clear archivedAt', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...EXISTING_RESERVATION,
        archivedAt: new Date('2026-01-01'),
      });

      await service.unarchiveReservation('res-uuid-001', TEST_USER_ID, 'Przywrócenie');

      const call = mockPrisma.reservation.update.mock.calls[0][0];
      expect(call.data.archivedAt).toBeNull();
    });

    it('should throw when not archived', async () => {
      await expect(service.unarchiveReservation('res-uuid-001', TEST_USER_ID))
        .rejects.toThrow('Rezerwacja nie jest zarchiwizowana');
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.unarchiveReservation('nonexistent', TEST_USER_ID))
        .rejects.toThrow('Nie znaleziono rezerwacji');
    });
  });
});
