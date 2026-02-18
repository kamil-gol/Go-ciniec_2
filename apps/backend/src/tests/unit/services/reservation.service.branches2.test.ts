/**
 * ReservationService — Branch Coverage Tests (Part 2)
 * Targets uncovered lines: 590-593, 617-619, 629-631, 654-660, 677-682, 708, 979-994, 1022
 * Focus: updateReservation (menu recalc, confirmationDeadline, custom fields),
 *        updateStatus (COMPLETED date checks, CANCELLED cascade deposits),
 *        checkWholeVenueConflict (isWholeVenue=true conflict, non-wholeVenue conflict)
 */

jest.mock('../../../lib/prisma', () => {
  const mockPrisma: any = {
    user: { findUnique: jest.fn() },
    hall: { findUnique: jest.fn(), findFirst: jest.fn() },
    client: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    reservation: {
      create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
      findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
      count: jest.fn(), aggregate: jest.fn(),
    },
    reservationMenuSnapshot: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    reservationHistory: { create: jest.fn() },
    deposit: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  return { prisma: mockPrisma, __esModule: true, default: mockPrisma };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/reservation.utils', () => ({
  calculateTotalGuests: jest.fn((a: number, c: number, t: number) => a + c + t),
  calculateTotalPrice: jest.fn((a: number, c: number, pa: number, pc: number, t: number, pt: number) => a * pa + c * pc + t * pt),
  validateConfirmationDeadline: jest.fn().mockReturnValue(true),
  validateCustomEventFields: jest.fn().mockReturnValue({ valid: true }),
  detectReservationChanges: jest.fn().mockReturnValue([]),
  formatChangesSummary: jest.fn().mockReturnValue(''),
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  __esModule: true,
  default: {
    recalculateForGuestChange: jest.fn(),
  },
}));

import { ReservationService } from '../../../services/reservation.service';
import { prisma } from '../../../lib/prisma';
import { diffObjects } from '../../../utils/audit-logger';
import { validateConfirmationDeadline, detectReservationChanges } from '../../../utils/reservation.utils';
import reservationMenuService from '../../../services/reservation-menu.service';

const mockPrisma = prisma as any;
const USER_ID = 'u-001';

const baseHall = { id: 'h1', name: 'Sala A', capacity: 200, isWholeVenue: false, isActive: true };
const baseClient = { id: 'c1', firstName: 'Jan', lastName: 'Kowalski', email: 'j@k.pl', phone: '123' };
const baseEventType = { id: 'e1', name: 'Wesele' };

const makeReservation = (overrides?: any) => ({
  id: 'r1', status: 'PENDING', hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
  startDateTime: new Date('2027-06-15T14:00:00Z'),
  endDateTime: new Date('2027-06-15T22:00:00Z'),
  date: null, startTime: null, endTime: null,
  adults: 50, children: 10, toddlers: 5, guests: 65,
  pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
  totalPrice: 11000, notes: null, archivedAt: null,
  confirmationDeadline: null, customEventType: null,
  birthdayAge: null, anniversaryYear: null, anniversaryOccasion: null,
  menuSnapshot: null,
  hall: baseHall, client: baseClient, eventType: baseEventType,
  createdBy: { id: USER_ID, email: 'admin@test.pl' },
  ...overrides,
});

let service: ReservationService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new ReservationService();
  mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
  mockPrisma.reservation.findFirst.mockResolvedValue(null);
  mockPrisma.reservation.update.mockImplementation(({ data }: any) =>
    Promise.resolve({ ...makeReservation(), ...data })
  );
  mockPrisma.reservationHistory.create.mockResolvedValue({});
  mockPrisma.hall.findUnique.mockResolvedValue(baseHall);
  mockPrisma.hall.findFirst.mockResolvedValue(null);
  mockPrisma.deposit.findMany.mockResolvedValue([]);
  mockPrisma.deposit.updateMany.mockResolvedValue({ count: 0 });
  (diffObjects as jest.Mock).mockReturnValue({});
  (detectReservationChanges as jest.Mock).mockReturnValue([]);
});

describe('ReservationService — uncovered branches (part 2)', () => {

  // ════════════════════════════════════════════════════════════════════
  // updateReservation: isUsingMenuPackage && guestsChanged (lines 590-593)
  // ════════════════════════════════════════════════════════════════════
  describe('updateReservation — menu recalculation on guest change', () => {

    it('should recalculate menu price when guests change with active menu snapshot', async () => {
      const resWithMenu = makeReservation({
        menuSnapshot: {
          id: 'ms1', menuData: { packageName: 'Gold' },
          totalMenuPrice: 10000,
        },
      });
      mockPrisma.reservation.findUnique.mockResolvedValue(resWithMenu);
      (reservationMenuService.recalculateForGuestChange as jest.Mock).mockResolvedValue({
        totalMenuPrice: 12000,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.updateReservation('r1', { adults: 60 } as any, USER_ID);

      expect(reservationMenuService.recalculateForGuestChange).toHaveBeenCalledWith('r1', 60, 10, 5);
      // updateData.totalPrice should be set from recalcResult
      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.totalPrice).toBe(12000);
      consoleSpy.mockRestore();
    });

    it('should NOT recalculate when recalcResult is null', async () => {
      const resWithMenu = makeReservation({
        menuSnapshot: { id: 'ms1', menuData: { packageName: 'Gold' }, totalMenuPrice: 10000 },
      });
      mockPrisma.reservation.findUnique.mockResolvedValue(resWithMenu);
      (reservationMenuService.recalculateForGuestChange as jest.Mock).mockResolvedValue(null);

      await service.updateReservation('r1', { adults: 60 } as any, USER_ID);

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.totalPrice).toBeUndefined();
    });

    it('should recalculate without menu when no menuSnapshot + guests changed', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());

      await service.updateReservation('r1', { adults: 70, pricePerAdult: 250 } as any, USER_ID);

      expect(reservationMenuService.recalculateForGuestChange).not.toHaveBeenCalled();
      // Should use calculateTotalPrice instead
      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.pricePerAdult).toBe(250);
    });

    it('should NOT call recalculate when menuPackageId is explicitly null (removed)', async () => {
      const resWithMenu = makeReservation({
        menuSnapshot: { id: 'ms1', menuData: { packageName: 'Gold' }, totalMenuPrice: 10000 },
      });
      mockPrisma.reservation.findUnique.mockResolvedValue(resWithMenu);
      // Simulate updateReservationMenu (menuPackageId=null removes menu)
      mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue({});

      await service.updateReservation('r1', { menuPackageId: null, adults: 60 } as any, USER_ID);

      // isUsingMenuPackage should be false because data.menuPackageId === null
      expect(reservationMenuService.recalculateForGuestChange).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // updateReservation: confirmationDeadline (lines 617-619)
  // ════════════════════════════════════════════════════════════════════
  describe('updateReservation — confirmationDeadline', () => {

    it('should set confirmationDeadline when valid', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());
      (validateConfirmationDeadline as jest.Mock).mockReturnValue(true);

      await service.updateReservation('r1', {
        confirmationDeadline: '2027-06-10T00:00:00Z',
      } as any, USER_ID);

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.confirmationDeadline).toEqual(new Date('2027-06-10T00:00:00Z'));
    });

    it('should throw when confirmationDeadline fails validation', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());
      (validateConfirmationDeadline as jest.Mock).mockReturnValue(false);

      await expect(service.updateReservation('r1', {
        confirmationDeadline: '2027-06-15T00:00:00Z',
      } as any, USER_ID)).rejects.toThrow('Confirmation deadline must be at least 1 day before the event');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // updateReservation: custom event fields (lines 629-631)
  // ════════════════════════════════════════════════════════════════════
  describe('updateReservation — custom event fields', () => {

    it('should update customEventType, birthdayAge, anniversaryYear, anniversaryOccasion', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());

      await service.updateReservation('r1', {
        customEventType: 'Komunia',
        birthdayAge: 18,
        anniversaryYear: 25,
        anniversaryOccasion: 'Srebrne gody',
      } as any, USER_ID);

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.customEventType).toBe('Komunia');
      expect(updateCall.data.birthdayAge).toBe(18);
      expect(updateCall.data.anniversaryYear).toBe(25);
      expect(updateCall.data.anniversaryOccasion).toBe('Srebrne gody');
    });

    it('should update date/startTime/endTime/notes fields', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());

      await service.updateReservation('r1', {
        date: '2027-06-20',
        startTime: '15:00',
        endTime: '23:00',
        notes: 'Uwaga: dodatkowe dekoracje',
      } as any, USER_ID);

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.date).toBe('2027-06-20');
      expect(updateCall.data.startTime).toBe('15:00');
      expect(updateCall.data.endTime).toBe('23:00');
      expect(updateCall.data.notes).toBe('Uwaga: dodatkowe dekoracje');
    });

    it('should clear optional fields when set to falsy values', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation({
        birthdayAge: 18, anniversaryYear: 25,
      }));

      await service.updateReservation('r1', {
        birthdayAge: 0,
        anniversaryYear: 0,
        date: '',
        startTime: '',
        endTime: '',
      } as any, USER_ID);

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.birthdayAge).toBeNull();
      expect(updateCall.data.anniversaryYear).toBeNull();
      expect(updateCall.data.date).toBeNull();
      expect(updateCall.data.startTime).toBeNull();
      expect(updateCall.data.endTime).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // updateStatus: COMPLETED date checks (lines 654-660)
  // ════════════════════════════════════════════════════════════════════
  describe('updateStatus — COMPLETED date checks', () => {

    it('should throw when completing reservation with future startDateTime', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation({
        status: 'CONFIRMED',
        startDateTime: new Date('2099-06-15T14:00:00Z'),
      }));

      await expect(service.updateStatus('r1', { status: 'COMPLETED' as any }, USER_ID))
        .rejects.toThrow('Nie można zakończyć rezerwacji przed datą wydarzenia');
    });

    it('should throw when completing reservation with future date (legacy format)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation({
        status: 'CONFIRMED',
        startDateTime: null,
        date: '2099-06-15',
      }));

      await expect(service.updateStatus('r1', { status: 'COMPLETED' as any }, USER_ID))
        .rejects.toThrow('Nie można zakończyć rezerwacji przed datą wydarzenia');
    });

    it('should complete when event date is in the past (startDateTime)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation({
        status: 'CONFIRMED',
        startDateTime: new Date('2020-01-01T14:00:00Z'),
      }));

      await service.updateStatus('r1', { status: 'COMPLETED' as any }, USER_ID);

      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'COMPLETED' } })
      );
    });

    it('should complete when no date at all (eventDate = null)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation({
        status: 'CONFIRMED',
        startDateTime: null, date: null,
      }));

      await service.updateStatus('r1', { status: 'COMPLETED' as any }, USER_ID);

      expect(mockPrisma.reservation.update).toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // updateStatus: CANCELLED with cascade deposits (lines 677-682)
  // ════════════════════════════════════════════════════════════════════
  describe('updateStatus — CANCELLED with cascade deposits', () => {

    it('should cancel with cascade and append deposit count to reason', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation({ status: 'PENDING' }));

      // Mock $transaction to actually call the callback
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const txMock = {
          reservation: { update: jest.fn().mockResolvedValue(makeReservation({ status: 'CANCELLED' })) },
          deposit: {
            findMany: jest.fn().mockResolvedValue([
              { id: 'd1', amount: 500, status: 'PENDING' },
              { id: 'd2', amount: 300, status: 'OVERDUE' },
            ]),
            updateMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          reservationHistory: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(txMock);
      });

      await service.updateStatus('r1', {
        status: 'CANCELLED' as any,
        reason: 'Klient zrezygnował',
      } as any, USER_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should cancel without reason (default message)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation({ status: 'PENDING' }));

      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const txMock = {
          reservation: { update: jest.fn().mockResolvedValue(makeReservation({ status: 'CANCELLED' })) },
          deposit: {
            findMany: jest.fn().mockResolvedValue([]),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          reservationHistory: { create: jest.fn().mockResolvedValue({}) },
        };
        return fn(txMock);
      });

      await service.updateStatus('r1', { status: 'CANCELLED' as any } as any, USER_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // checkWholeVenueConflict: isWholeVenue=true + conflict (lines 979-994)
  // ════════════════════════════════════════════════════════════════════
  describe('createReservation — checkWholeVenueConflict (isWholeVenue=true)', () => {

    it('should throw when booking whole venue and another hall has reservation', async () => {
      const wholeVenueHall = { ...baseHall, id: 'h-whole', name: 'Cały Obiekt', isWholeVenue: true };
      mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
      mockPrisma.hall.findUnique.mockResolvedValue(wholeVenueHall);
      mockPrisma.client.findUnique.mockResolvedValue(baseClient);
      mockPrisma.eventType.findUnique.mockResolvedValue(baseEventType);
      mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 0 } });

      // checkDateTimeOverlap returns false
      mockPrisma.reservation.findFirst
        .mockResolvedValueOnce(null)  // checkDateTimeOverlap
        .mockResolvedValueOnce({      // checkWholeVenueConflict — conflict found!
          id: 'conflict-1',
          hall: { name: 'Sala B' },
          client: { firstName: 'Anna', lastName: 'Nowak' },
        });

      await expect(service.createReservation({
        hallId: 'h-whole', clientId: 'c1', eventTypeId: 'e1',
        startDateTime: '2027-06-15T14:00:00Z',
        endDateTime: '2027-06-15T22:00:00Z',
        adults: 100, children: 0, toddlers: 0,
        pricePerAdult: 200, pricePerChild: 0,
      } as any, USER_ID)).rejects.toThrow('Nie można zarezerwować całego obiektu');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // checkWholeVenueConflict: non-wholeVenue + whole venue booked (line 1022)
  // ════════════════════════════════════════════════════════════════════
  describe('createReservation — checkWholeVenueConflict (non-wholeVenue)', () => {

    it('should throw when booking regular hall but whole venue is already booked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
      mockPrisma.hall.findUnique.mockResolvedValue(baseHall); // regular hall
      mockPrisma.client.findUnique.mockResolvedValue(baseClient);
      mockPrisma.eventType.findUnique.mockResolvedValue(baseEventType);

      // checkDateTimeOverlap → no overlap
      // checkWholeVenueConflict: hall is not wholeVenue → find wholeVenueHall
      mockPrisma.hall.findFirst.mockResolvedValue({ id: 'h-whole', isWholeVenue: true });

      mockPrisma.reservation.findFirst
        .mockResolvedValueOnce(null)   // checkDateTimeOverlap
        .mockResolvedValueOnce({       // conflict with whole venue
          id: 'conflict-2',
          client: { firstName: 'Piotr', lastName: 'Wiśniewski' },
        });

      await expect(service.createReservation({
        hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
        startDateTime: '2027-06-15T14:00:00Z',
        endDateTime: '2027-06-15T22:00:00Z',
        adults: 50, children: 0, toddlers: 0,
        pricePerAdult: 200, pricePerChild: 0,
      } as any, USER_ID)).rejects.toThrow('Nie można zarezerwować tej sali');
    });

    it('should pass when no whole venue hall exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
      mockPrisma.hall.findUnique.mockResolvedValue(baseHall);
      mockPrisma.client.findUnique.mockResolvedValue(baseClient);
      mockPrisma.eventType.findUnique.mockResolvedValue(baseEventType);
      mockPrisma.hall.findFirst.mockResolvedValue(null); // no whole venue hall
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockResolvedValue(makeReservation());

      const result = await service.createReservation({
        hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
        startDateTime: '2027-06-15T14:00:00Z',
        endDateTime: '2027-06-15T22:00:00Z',
        adults: 50, children: 0, toddlers: 0,
        pricePerAdult: 200, pricePerChild: 0,
      } as any, USER_ID);

      expect(result).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // updateReservation: audit log with changes (line 708 area)
  // ════════════════════════════════════════════════════════════════════
  describe('updateReservation — audit log with detected changes', () => {

    it('should create history entry and audit log when changes detected with reason', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());
      (detectReservationChanges as jest.Mock).mockReturnValue(['adults: 50 → 60']);
      (diffObjects as jest.Mock).mockReturnValue({ adults: { old: 50, new: 60 } });

      await service.updateReservation('r1', {
        adults: 60,
        reason: 'Klient poprosił o zmianę liczby gości na 60 osób',
      } as any, USER_ID);

      expect(mockPrisma.reservationHistory.create).toHaveBeenCalled();
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE',
        details: expect.objectContaining({ changes: { adults: { old: 50, new: 60 } } }),
      }));
    });

    it('should throw when changes detected but reason too short', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());
      (detectReservationChanges as jest.Mock).mockReturnValue(['adults changed']);

      await expect(service.updateReservation('r1', {
        adults: 60,
        reason: 'short',
      } as any, USER_ID)).rejects.toThrow('Reason is required for changes (minimum 10 characters)');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // updateReservation: overlap check during update
  // ════════════════════════════════════════════════════════════════════
  describe('updateReservation — overlap check', () => {

    it('should throw when new date/time overlaps with existing reservation', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());
      // checkDateTimeOverlap returns true (overlap found)
      mockPrisma.reservation.findFirst.mockResolvedValue({ id: 'other-res' });

      await expect(service.updateReservation('r1', {
        startDateTime: '2027-07-01T14:00:00Z',
        endDateTime: '2027-07-01T22:00:00Z',
      } as any, USER_ID)).rejects.toThrow('This time slot is already booked');
    });

    it('should throw when start >= end during update', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation());

      await expect(service.updateReservation('r1', {
        startDateTime: '2027-07-01T22:00:00Z',
        endDateTime: '2027-07-01T14:00:00Z',
      } as any, USER_ID)).rejects.toThrow('End time must be after start time');
    });
  });
});
