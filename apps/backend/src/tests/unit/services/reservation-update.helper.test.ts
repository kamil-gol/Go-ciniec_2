/**
 * reservation-update.helper — Unit Tests
 * Covers: processHallAndTimingUpdates, recalculatePrices,
 *         upsertCategoryExtrasAndRecalculate, executeUpdateReservation
 */

// ═══ Mocks ═══════════════════════════════════════════════════════════════════

jest.mock('../../../lib/prisma', () => {
  const mock = {
    hall: { findUnique: jest.fn() },
    reservation: { findUnique: jest.fn(), update: jest.fn() },
    reservationHistory: { create: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/reservation.utils', () => {
  const actual = jest.requireActual('../../../utils/reservation.utils');
  return {
    ...actual,
    calculateTotalGuests: jest.fn().mockImplementation(actual.calculateTotalGuests),
    calculateTotalPrice: jest.fn().mockReturnValue(5000),
    validateConfirmationDeadline: jest.fn().mockReturnValue(true),
    validateCustomEventFields: jest.fn().mockReturnValue({ valid: true }),
    detectReservationChanges: jest.fn().mockReturnValue([]),
    formatChangesSummary: jest.fn().mockReturnValue(''),
  };
});

jest.mock('../../../utils/venue-surcharge', () => ({
  calculateVenueSurcharge: jest.fn().mockReturnValue({ amount: 0, label: null }),
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../services/reservationCategoryExtra.service', () => ({
  reservationCategoryExtraService: {
    recalculateForGuestChange: jest.fn().mockResolvedValue(undefined),
    deleteByReservation: jest.fn().mockResolvedValue(undefined),
    upsertExtras: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  __esModule: true,
  default: { recalculateForGuestChange: jest.fn().mockResolvedValue({ totalMenuPrice: 1000 }) },
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../services/notification.service', () => ({
  __esModule: true,
  default: { createForAll: jest.fn().mockResolvedValue(1) },
}));

jest.mock('../../../services/reservation-validation.service', () => ({
  validateCapacityForTimeRange: jest.fn().mockResolvedValue(undefined),
  checkWholeVenueConflict: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../services/reservation-history.helper', () => ({
  createHistoryEntry: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../services/reservation.includes', () => ({
  RESERVATION_INCLUDE: {
    hall: { select: { id: true, name: true, capacity: true, isWholeVenue: true, allowMultipleBookings: true } },
    client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    eventType: { select: { id: true, name: true } },
    createdBy: { select: { id: true, email: true } },
  },
}));

// ═══ Imports ═════════════════════════════════════════════════════════════════

import { prisma } from '../../../lib/prisma';
import {
  processHallAndTimingUpdates,
  recalculatePrices,
  upsertCategoryExtrasAndRecalculate,
  executeUpdateReservation,
  HallTimingResult,
} from '../../../services/reservation-update.helper';
import { ReservationStatus } from '../../../types/reservation.types';
import { detectReservationChanges, formatChangesSummary } from '../../../utils/reservation.utils';
import { calculateVenueSurcharge } from '../../../utils/venue-surcharge';
import { recalculateReservationTotalPrice } from '../../../utils/recalculate-price';
import { reservationCategoryExtraService } from '../../../services/reservationCategoryExtra.service';
import reservationMenuService from '../../../services/reservation-menu.service';
import { validateCapacityForTimeRange, checkWholeVenueConflict } from '../../../services/reservation-validation.service';
import { createHistoryEntry } from '../../../services/reservation-history.helper';
import notificationService from '../../../services/notification.service';

const db = prisma as any;
const UID = 'user-001';

const FUTURE = '2027-08-15T14:00:00.000Z';
const FUTURE_END = '2027-08-15T22:00:00.000Z';

const HALL_OBJ = { id: 'hall-001', name: 'Sala A', capacity: 100, isActive: true, isWholeVenue: false, allowMultipleBookings: false };
const HALL_WHOLE = { id: 'hall-wh', name: 'Cały Obiekt', capacity: 200, isActive: true, isWholeVenue: true, allowMultipleBookings: false };

const CLIENT = { id: 'cl-001', firstName: 'Jan', lastName: 'Kowalski', email: 'j@k.pl', phone: '+48123' };
const EVENT_TYPE = { id: 'ev-001', name: 'Wesele' };

function makeExisting(overrides: Record<string, unknown> = {}) {
  return {
    id: 'res-001',
    hallId: HALL_OBJ.id,
    eventTypeId: EVENT_TYPE.id,
    adults: 50,
    children: 10,
    toddlers: 5,
    guests: 65,
    totalPrice: 10000,
    pricePerAdult: 150,
    pricePerChild: 80,
    pricePerToddler: 40,
    venueSurcharge: 0,
    startDateTime: new Date(FUTURE),
    endDateTime: new Date(FUTURE_END),
    internalNotes: null,
    status: ReservationStatus.CONFIRMED,
    hall: HALL_OBJ,
    eventType: EVENT_TYPE,
    menuSnapshot: null,
    client: CLIENT,
    ...overrides,
  };
}

function makeHallTimingResult(overrides: Partial<HallTimingResult> = {}): HallTimingResult {
  return {
    updateData: {},
    effectiveHall: HALL_OBJ,
    hallChanged: false,
    guestsChanged: false,
    newAdults: 50,
    newChildren: 10,
    newToddlers: 5,
    finalGuests: 65,
    finalStart: new Date(FUTURE),
    finalEnd: new Date(FUTURE_END),
    ...overrides,
  };
}

const mockValidateUserId = jest.fn().mockResolvedValue(undefined);
const mockGetById = jest.fn().mockResolvedValue({ id: 'res-001' });
const mockUpdateMenu = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  db.reservation.findUnique.mockResolvedValue(null);
  db.reservation.update.mockResolvedValue({ id: 'res-001', client: CLIENT });
  db.reservationHistory.create.mockResolvedValue({});
  (detectReservationChanges as jest.Mock).mockReturnValue([]);
  (calculateVenueSurcharge as jest.Mock).mockReturnValue({ amount: 0, label: null });
});

// ═══════════════════════════════════════════════════════════════════════════════

describe('reservation-update.helper', () => {
  // ─── executeUpdateReservation ────────────────────────────────────────────────

  describe('executeUpdateReservation', () => {
    it('should reject updates to COMPLETED reservations', async () => {
      db.reservation.findUnique.mockResolvedValue(makeExisting({ status: ReservationStatus.COMPLETED }));

      await expect(
        executeUpdateReservation('res-001', { adults: 60, reason: 'zmiana liczby gości na większą' }, UID, mockValidateUserId, mockGetById, mockUpdateMenu)
      ).rejects.toThrow('Nie można edytować zakończonej rezerwacji');
    });

    it('should reject updates to CANCELLED reservations', async () => {
      db.reservation.findUnique.mockResolvedValue(makeExisting({ status: ReservationStatus.CANCELLED }));

      await expect(
        executeUpdateReservation('res-001', { adults: 60, reason: 'zmiana liczby gości na większą' }, UID, mockValidateUserId, mockGetById, mockUpdateMenu)
      ).rejects.toThrow('Nie można edytować anulowanej rezerwacji');
    });

    it('should reject updates to ARCHIVED reservations', async () => {
      db.reservation.findUnique.mockResolvedValue(makeExisting({ status: ReservationStatus.ARCHIVED }));

      await expect(
        executeUpdateReservation('res-001', { adults: 60, reason: 'zmiana liczby gości na większą' }, UID, mockValidateUserId, mockGetById, mockUpdateMenu)
      ).rejects.toThrow('Nie można edytować zarchiwizowanej rezerwacji');
    });

    it('should allow internal notes edit regardless of status', async () => {
      const existing = makeExisting({ status: ReservationStatus.COMPLETED, internalNotes: 'stara notatka' });
      db.reservation.findUnique.mockResolvedValue(existing);
      db.reservation.update.mockResolvedValue({ ...existing, internalNotes: 'nowa notatka testowa' });
      mockGetById.mockResolvedValue({ id: 'res-001', internalNotes: 'nowa notatka testowa' });

      const result = await executeUpdateReservation(
        'res-001',
        { internalNotes: 'nowa notatka testowa' },
        UID,
        mockValidateUserId,
        mockGetById,
        mockUpdateMenu
      );

      expect(result).toEqual(expect.objectContaining({ id: 'res-001' }));
      expect(db.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-001' },
        data: { internalNotes: 'nowa notatka testowa' },
      });
      expect(createHistoryEntry).toHaveBeenCalledWith(
        'res-001',
        UID,
        'NOTE_UPDATED',
        'internalNotes',
        'stara notatka',
        'nowa notatka testowa',
        'Zaktualizowano notatkę wewnętrzną'
      );
    });

    it('should require reason field (min 10 chars) for structural changes', async () => {
      const existing = makeExisting({ status: ReservationStatus.CONFIRMED });
      db.reservation.findUnique.mockResolvedValue(existing);
      (detectReservationChanges as jest.Mock).mockReturnValue([
        { field: 'adults', oldValue: 50, newValue: 60, label: 'Dorośli' },
      ]);

      await expect(
        executeUpdateReservation('res-001', { adults: 60, reason: 'krótki' }, UID, mockValidateUserId, mockGetById, mockUpdateMenu)
      ).rejects.toThrow('Powód zmian jest wymagany (minimum 10 znaków)');
    });

    it('should silently ignore eventTypeId changes (immutability)', async () => {
      const existing = makeExisting({ status: ReservationStatus.CONFIRMED });
      db.reservation.findUnique.mockResolvedValue(existing);
      // No detected changes = no reason required
      (detectReservationChanges as jest.Mock).mockReturnValue([]);

      // Mock the downstream calls so executeUpdateReservation can complete
      db.reservation.update.mockResolvedValue({ id: 'res-001', client: CLIENT });
      (recalculateReservationTotalPrice as jest.Mock).mockResolvedValue(undefined);

      await executeUpdateReservation(
        'res-001',
        { eventTypeId: 'ev-other' } as any,
        UID,
        mockValidateUserId,
        mockGetById,
        mockUpdateMenu
      );

      // eventTypeId should NOT appear in the update call
      const updateCalls = db.reservation.update.mock.calls;
      if (updateCalls.length > 0) {
        expect(updateCalls[0][0].data).not.toHaveProperty('eventTypeId');
      }
    });
  });

  // ─── processHallAndTimingUpdates ─────────────────────────────────────────────

  describe('processHallAndTimingUpdates', () => {
    it('should validate new hall if hallId changes', async () => {
      const newHall = { id: 'hall-002', name: 'Sala B', capacity: 80, isActive: true, isWholeVenue: false };
      db.hall.findUnique.mockResolvedValue(newHall);
      const existing = makeExisting();
      (detectReservationChanges as jest.Mock).mockReturnValue([
        { field: 'hallId', oldValue: 'hall-001', newValue: 'hall-002', label: 'Sala' },
      ]);

      const result = await processHallAndTimingUpdates(
        { hallId: 'hall-002', reason: 'zmiana sali na mniejszą salę B' },
        existing as any,
        UID,
        mockUpdateMenu
      );

      expect(db.hall.findUnique).toHaveBeenCalledWith({ where: { id: 'hall-002' } });
      expect(result.hallChanged).toBe(true);
      expect(result.effectiveHall).toEqual(newHall);
      expect(result.updateData.hallId).toBe('hall-002');
    });

    it('should throw if new hall not found', async () => {
      db.hall.findUnique.mockResolvedValue(null);
      const existing = makeExisting();
      (detectReservationChanges as jest.Mock).mockReturnValue([
        { field: 'hallId', oldValue: 'hall-001', newValue: 'hall-999', label: 'Sala' },
      ]);

      await expect(
        processHallAndTimingUpdates(
          { hallId: 'hall-999', reason: 'zmiana sali na nieistniejącą salę' },
          existing as any,
          UID,
          mockUpdateMenu
        )
      ).rejects.toThrow('Nie znaleziono sali');
    });

    it('should check capacity when guests change', async () => {
      const existing = makeExisting();
      (detectReservationChanges as jest.Mock).mockReturnValue([]);

      const result = await processHallAndTimingUpdates(
        { adults: 60 },
        existing as any,
        UID,
        mockUpdateMenu
      );

      expect(result.guestsChanged).toBe(true);
      expect(result.newAdults).toBe(60);
      expect(result.finalGuests).toBe(75); // 60 + 10 + 5
      expect(validateCapacityForTimeRange).toHaveBeenCalledWith(
        HALL_OBJ,
        existing.startDateTime,
        existing.endDateTime,
        75,
        'res-001'
      );
    });

    it('should check whole-venue conflicts when hall changes', async () => {
      const newHall = { id: 'hall-003', name: 'Sala C', capacity: 150, isActive: true, isWholeVenue: true };
      db.hall.findUnique.mockResolvedValue(newHall);
      const existing = makeExisting();
      (detectReservationChanges as jest.Mock).mockReturnValue([
        { field: 'hallId', oldValue: 'hall-001', newValue: 'hall-003', label: 'Sala' },
      ]);

      await processHallAndTimingUpdates(
        { hallId: 'hall-003', reason: 'zmiana sali na całą salę weselną' },
        existing as any,
        UID,
        mockUpdateMenu
      );

      expect(checkWholeVenueConflict).toHaveBeenCalledWith(
        'hall-003',
        existing.startDateTime,
        existing.endDateTime,
        'res-001'
      );
    });

    it('should trigger capacity check on time/guests/menu changes', async () => {
      const existing = makeExisting();
      (detectReservationChanges as jest.Mock).mockReturnValue([]);

      const newStart = '2027-09-01T12:00:00.000Z';
      const newEnd = '2027-09-01T20:00:00.000Z';

      await processHallAndTimingUpdates(
        { startDateTime: newStart, endDateTime: newEnd },
        existing as any,
        UID,
        mockUpdateMenu
      );

      expect(validateCapacityForTimeRange).toHaveBeenCalledWith(
        HALL_OBJ,
        new Date(newStart),
        new Date(newEnd),
        65, // existing guests
        'res-001'
      );
    });

    it('should cleanup category extras on menu package change', async () => {
      const existing = makeExisting();
      (detectReservationChanges as jest.Mock).mockReturnValue([]);

      await processHallAndTimingUpdates(
        { menuPackageId: 'pkg-new' },
        existing as any,
        UID,
        mockUpdateMenu
      );

      expect(reservationCategoryExtraService.deleteByReservation).toHaveBeenCalledWith('res-001', UID);
      expect(mockUpdateMenu).toHaveBeenCalledWith(
        'res-001',
        {
          menuPackageId: 'pkg-new',
          adultsCount: 50,
          childrenCount: 10,
          toddlersCount: 5,
        },
        UID
      );
    });

    it('should throw when guests exceed hall capacity', async () => {
      const existing = makeExisting({ hall: { ...HALL_OBJ, capacity: 50 } });
      (detectReservationChanges as jest.Mock).mockReturnValue([]);

      await expect(
        processHallAndTimingUpdates(
          { adults: 40, children: 10, toddlers: 5 },
          existing as any,
          UID,
          mockUpdateMenu
        )
      ).rejects.toThrow(/przekracza pojemność sali/);
    });
  });

  // ─── recalculatePrices ───────────────────────────────────────────────────────

  describe('recalculatePrices', () => {
    it('should recalculate menu snapshot on guest change', async () => {
      const existing = makeExisting({
        menuSnapshot: { id: 'snap-001', totalMenuPrice: 5000 },
      });
      const hallTimingResult = makeHallTimingResult({
        guestsChanged: true,
        newAdults: 60,
        newChildren: 10,
        newToddlers: 5,
        finalGuests: 75,
      });

      await recalculatePrices(existing as any, {}, hallTimingResult, UID);

      expect(reservationMenuService.recalculateForGuestChange).toHaveBeenCalledWith('res-001', 60, 10, 5);
    });

    it('should log venue surcharge APPLIED audit entry', async () => {
      const existing = makeExisting({
        hall: { ...HALL_OBJ, isWholeVenue: false },
        venueSurcharge: 0,
      });
      const hallTimingResult = makeHallTimingResult({
        hallChanged: true,
        effectiveHall: HALL_WHOLE,
        finalGuests: 65,
      });
      (calculateVenueSurcharge as jest.Mock).mockReturnValue({ amount: 3000, label: 'Dopłata' });

      await recalculatePrices(existing as any, { hallId: 'hall-wh' }, hallTimingResult, UID);

      expect(createHistoryEntry).toHaveBeenCalledWith(
        'res-001',
        UID,
        'SURCHARGE_APPLIED',
        'venueSurcharge',
        '0',
        '3000',
        expect.stringContaining('Naliczono dopłatę')
      );
    });

    it('should log venue surcharge REMOVED audit entry', async () => {
      const existing = makeExisting({
        hall: { ...HALL_OBJ, isWholeVenue: true },
        venueSurcharge: 3000,
      });
      const hallTimingResult = makeHallTimingResult({
        hallChanged: true,
        effectiveHall: { ...HALL_OBJ, isWholeVenue: false },
        finalGuests: 65,
      });
      (calculateVenueSurcharge as jest.Mock).mockReturnValue({ amount: 0, label: null });

      await recalculatePrices(existing as any, { hallId: 'hall-001' }, hallTimingResult, UID);

      expect(createHistoryEntry).toHaveBeenCalledWith(
        'res-001',
        UID,
        'SURCHARGE_REMOVED',
        'venueSurcharge',
        '3000',
        '0',
        expect.any(String)
      );
    });

    it('should update per-person prices for non-menu reservations', async () => {
      const existing = makeExisting({ menuSnapshot: null });
      const hallTimingResult = makeHallTimingResult({ guestsChanged: false });

      await recalculatePrices(
        existing as any,
        { pricePerAdult: 200, pricePerChild: 100 },
        hallTimingResult,
        UID
      );

      expect(hallTimingResult.updateData.pricePerAdult).toBe(200);
      expect(hallTimingResult.updateData.pricePerChild).toBe(100);
    });

    it('should recalculate category extras when guests change', async () => {
      const existing = makeExisting({ menuSnapshot: null });
      const hallTimingResult = makeHallTimingResult({
        guestsChanged: true,
        newAdults: 60,
        newChildren: 15,
        newToddlers: 5,
        finalGuests: 80,
      });

      await recalculatePrices(existing as any, { adults: 60, children: 15 }, hallTimingResult, UID);

      expect(reservationCategoryExtraService.recalculateForGuestChange).toHaveBeenCalledWith(
        'res-001',
        60,
        15,
        5,
        UID
      );
    });
  });

  // ─── upsertCategoryExtrasAndRecalculate ──────────────────────────────────────

  describe('upsertCategoryExtrasAndRecalculate', () => {
    it('should update reservation record', async () => {
      const existing = makeExisting();
      const hallTimingResult = makeHallTimingResult({
        updateData: { adults: 60, guests: 75 },
      });

      await upsertCategoryExtrasAndRecalculate('res-001', {}, existing as any, hallTimingResult, UID);

      expect(db.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-001' },
          data: { adults: 60, guests: 75 },
        })
      );
    });

    it('should log detected changes', async () => {
      const existing = makeExisting();
      const hallTimingResult = makeHallTimingResult({ updateData: { adults: 60 } });
      (detectReservationChanges as jest.Mock).mockReturnValue([
        { field: 'adults', oldValue: 50, newValue: 60, label: 'Dorośli' },
      ]);
      (formatChangesSummary as jest.Mock).mockReturnValue('Dorośli: 50 → 60');

      await upsertCategoryExtrasAndRecalculate(
        'res-001',
        { reason: 'zmiana liczby dorosłych gości' } as any,
        existing as any,
        hallTimingResult,
        UID
      );

      expect(createHistoryEntry).toHaveBeenCalledWith(
        'res-001',
        UID,
        'UPDATED',
        'multiple',
        'różne',
        'różne',
        expect.stringContaining('Dorośli: 50 → 60')
      );
    });

    it('should upsert category extras', async () => {
      const existing = makeExisting();
      const hallTimingResult = makeHallTimingResult();
      db.reservation.findUnique.mockResolvedValue({ adults: 50, children: 10, toddlers: 5 });

      const extras = [{ categoryId: 'cat-1', quantity: 2 }];
      await upsertCategoryExtrasAndRecalculate(
        'res-001',
        { categoryExtras: extras } as any,
        existing as any,
        hallTimingResult,
        UID
      );

      expect(reservationCategoryExtraService.upsertExtras).toHaveBeenCalledWith(
        'res-001',
        extras,
        UID,
        { adults: 50, children: 10, toddlers: 5 }
      );
    });

    it('should delete category extras when empty array provided', async () => {
      const existing = makeExisting();
      const hallTimingResult = makeHallTimingResult();

      await upsertCategoryExtrasAndRecalculate(
        'res-001',
        { categoryExtras: [] } as any,
        existing as any,
        hallTimingResult,
        UID
      );

      expect(reservationCategoryExtraService.deleteByReservation).toHaveBeenCalledWith('res-001', UID);
    });

    it('should call recalculateReservationTotalPrice', async () => {
      const existing = makeExisting();
      const hallTimingResult = makeHallTimingResult();

      await upsertCategoryExtrasAndRecalculate('res-001', {}, existing as any, hallTimingResult, UID);

      expect(recalculateReservationTotalPrice).toHaveBeenCalledWith('res-001');
    });

    it('should send notification', async () => {
      const existing = makeExisting();
      const hallTimingResult = makeHallTimingResult();
      db.reservation.update.mockResolvedValue({
        id: 'res-001',
        client: { firstName: 'Jan', lastName: 'Kowalski' },
      });

      await upsertCategoryExtrasAndRecalculate('res-001', {}, existing as any, hallTimingResult, UID);

      expect(notificationService.createForAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RESERVATION_UPDATED',
          title: 'Rezerwacja zaktualizowana',
          message: expect.stringContaining('Jan Kowalski'),
          entityType: 'RESERVATION',
          entityId: 'res-001',
          excludeUserId: UID,
        })
      );
    });
  });
});
