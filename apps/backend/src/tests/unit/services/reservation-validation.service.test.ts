/**
 * ReservationValidationService — Unit Tests
 * Tests for capacity validation, conflict checking, and whole-venue logic
 * Issue #237: Test coverage for extracted reservation-validation.service.ts
 */

jest.mock('../../../lib/prisma', () => {
  const mock: Record<string, any> = {
    reservation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    hall: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { prisma } from '../../../lib/prisma';
import { validateCapacityForTimeRange, checkWholeVenueConflict } from '../../../services/reservation-validation.service';

const mockPrisma = prisma as any;

const START = new Date('2027-06-15T14:00:00.000Z');
const END = new Date('2027-06-15T22:00:00.000Z');

const BASE_HALL = {
  id: 'hall-1',
  name: 'Sala Główna',
  capacity: 100,
  allowMultipleBookings: false,
};

const MULTI_HALL = {
  id: 'hall-multi',
  name: 'Sala Multi',
  capacity: 200,
  allowMultipleBookings: true,
};

const WHOLE_VENUE_HALL = {
  id: 'hall-wv',
  name: 'Cały Obiekt',
  capacity: 300,
  isWholeVenue: true,
  allowMultipleBookings: false,
  allowWithWholeVenue: false,
};

const REGULAR_HALL = {
  id: 'hall-reg',
  name: 'Sala Główna',
  capacity: 100,
  isWholeVenue: false,
  allowMultipleBookings: false,
  allowWithWholeVenue: false,
};

const COEXIST_HALL = {
  id: 'hall-coexist',
  name: 'Strzecha Tyl',
  capacity: 50,
  isWholeVenue: false,
  allowMultipleBookings: false,
  allowWithWholeVenue: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.reservation.findMany.mockResolvedValue([]);
  mockPrisma.reservation.findFirst.mockResolvedValue(null);
  mockPrisma.hall.findUnique.mockResolvedValue(null);
  mockPrisma.hall.findFirst.mockResolvedValue(null);
});

describe('ReservationValidationService', () => {
  // ─── validateCapacityForTimeRange() ───
  describe('validateCapacityForTimeRange()', () => {
    it('should pass when no overlapping reservations exist', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await expect(
        validateCapacityForTimeRange(BASE_HALL, START, END, 50)
      ).resolves.toBeUndefined();
    });

    it('should throw MULTIPLE_BOOKINGS_DISABLED when hall disallows multiple bookings and overlap exists', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-existing', guests: 40 },
      ]);

      await expect(
        validateCapacityForTimeRange(BASE_HALL, START, END, 50)
      ).rejects.toThrow('Ta sala nie dopuszcza wielu rezerwacji w tym samym czasie');
    });

    it('should pass when hall allows multiple bookings and aggregate guests fit within capacity', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-a', guests: 50 },
        { id: 'res-b', guests: 30 },
      ]);

      await expect(
        validateCapacityForTimeRange(MULTI_HALL, START, END, 50)
      ).resolves.toBeUndefined();
    });

    it('should pass when exactly at capacity', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-a', guests: 150 },
      ]);

      await expect(
        validateCapacityForTimeRange(MULTI_HALL, START, END, 50)
      ).resolves.toBeUndefined();
    });

    it('should throw CAPACITY_EXCEEDED when aggregate guests exceed capacity', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-a', guests: 100 },
        { id: 'res-b', guests: 60 },
      ]);

      await expect(
        validateCapacityForTimeRange(MULTI_HALL, START, END, 50)
      ).rejects.toThrow(/Brak wystarczającej pojemności sali/);
    });

    it('should include available/total in CAPACITY_EXCEEDED message', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-a', guests: 170 },
      ]);

      await expect(
        validateCapacityForTimeRange(MULTI_HALL, START, END, 50)
      ).rejects.toThrow('Brak wystarczającej pojemności sali. Żądano miejsc: 50, dostępne: 30/200');
    });

    it('should exclude the reservation being updated via excludeReservationId', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await validateCapacityForTimeRange(BASE_HALL, START, END, 50, 'res-self');

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.id).toEqual({ not: 'res-self' });
    });

    it('should not add id filter when excludeReservationId is undefined', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await validateCapacityForTimeRange(BASE_HALL, START, END, 50);

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.id).toBeUndefined();
    });

    it('should only query PENDING and CONFIRMED reservations', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await validateCapacityForTimeRange(BASE_HALL, START, END, 50);

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.status.in).toEqual(['PENDING', 'CONFIRMED']);
    });

    it('should only query non-archived reservations', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await validateCapacityForTimeRange(BASE_HALL, START, END, 50);

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.archivedAt).toBeNull();
    });

    it('should use correct time overlap AND conditions', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await validateCapacityForTimeRange(BASE_HALL, START, END, 50);

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).toHaveLength(2);
      expect(findManyCall.where.AND[0]).toHaveProperty('startDateTime.lt', END);
      expect(findManyCall.where.AND[1]).toHaveProperty('endDateTime.gt', START);
    });

    it('should handle overlapping reservations with 0 guests gracefully', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-zero', guests: 0 },
      ]);

      await expect(
        validateCapacityForTimeRange(MULTI_HALL, START, END, 50)
      ).resolves.toBeUndefined();
    });

    it('should handle overlapping reservations with null guests', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-null', guests: null },
      ]);

      // null guests → 0 in reduce, so 50 <= 200 should pass
      await expect(
        validateCapacityForTimeRange(MULTI_HALL, START, END, 50)
      ).resolves.toBeUndefined();
    });

    it('should reject when capacity is 0 and guests > 0 with overlap', async () => {
      const zeroCapHall = { ...MULTI_HALL, capacity: 0 };
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-x', guests: 0 },
      ]);

      await expect(
        validateCapacityForTimeRange(zeroCapHall, START, END, 1)
      ).rejects.toThrow(/Brak wystarczającej pojemności sali/);
    });
  });

  // ─── checkWholeVenueConflict() ───
  describe('checkWholeVenueConflict()', () => {
    it('should pass when hall is not found', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(null);

      await expect(
        checkWholeVenueConflict('nonexistent', START, END)
      ).resolves.toBeUndefined();
    });

    // Whole venue hall booking — check regular halls
    describe('when booking whole venue hall', () => {
      it('should pass when no conflicting regular hall reservations exist', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue(null);

        await expect(
          checkWholeVenueConflict(WHOLE_VENUE_HALL.id, START, END)
        ).resolves.toBeUndefined();
      });

      it('should throw when a regular hall (not allowWithWholeVenue) has a reservation in the time range', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue({
          id: 'res-conflict',
          hallId: REGULAR_HALL.id,
          hall: { name: 'Sala Główna' },
          client: { firstName: 'Piotr', lastName: 'Zieliński' },
        });

        await expect(
          checkWholeVenueConflict(WHOLE_VENUE_HALL.id, START, END)
        ).rejects.toThrow(/Nie można zarezerwować całego obiektu/);
      });

      it('should include hall name and client name in error message', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue({
          id: 'res-conflict',
          hallId: REGULAR_HALL.id,
          hall: { name: 'Sala Główna' },
          client: { firstName: 'Anna', lastName: 'Nowak' },
        });

        await expect(
          checkWholeVenueConflict(WHOLE_VENUE_HALL.id, START, END)
        ).rejects.toThrow(/Sala Główna/);
      });

      it('should use "nieznany klient" when conflict has no client', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue({
          id: 'res-conflict',
          hallId: REGULAR_HALL.id,
          hall: { name: 'Sala Główna' },
          client: null,
        });

        await expect(
          checkWholeVenueConflict(WHOLE_VENUE_HALL.id, START, END)
        ).rejects.toThrow(/nieznany klient/);
      });

      it('should exclude reservation by excludeReservationId', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue(null);

        await checkWholeVenueConflict(WHOLE_VENUE_HALL.id, START, END, 'res-self');

        const findFirstCall = mockPrisma.reservation.findFirst.mock.calls[0][0];
        expect(findFirstCall.where.id).toEqual({ not: 'res-self' });
      });
    });

    // Regular hall booking — check whole venue
    describe('when booking regular hall (not allowWithWholeVenue)', () => {
      it('should pass when no whole venue hall exists', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(REGULAR_HALL);
        mockPrisma.hall.findFirst.mockResolvedValue(null);

        await expect(
          checkWholeVenueConflict(REGULAR_HALL.id, START, END)
        ).resolves.toBeUndefined();
      });

      it('should pass when whole venue exists but has no overlapping reservations', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(REGULAR_HALL);
        mockPrisma.hall.findFirst.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue(null);

        await expect(
          checkWholeVenueConflict(REGULAR_HALL.id, START, END)
        ).resolves.toBeUndefined();
      });

      it('should throw when whole venue has an overlapping reservation', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(REGULAR_HALL);
        mockPrisma.hall.findFirst.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue({
          id: 'res-wv',
          hallId: WHOLE_VENUE_HALL.id,
          client: { firstName: 'Jan', lastName: 'Kowalski' },
        });

        await expect(
          checkWholeVenueConflict(REGULAR_HALL.id, START, END)
        ).rejects.toThrow(/cały obiekt jest już zarezerwowany/);
      });

      it('should include client name in whole-venue conflict error', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(REGULAR_HALL);
        mockPrisma.hall.findFirst.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue({
          id: 'res-wv',
          hallId: WHOLE_VENUE_HALL.id,
          client: { firstName: 'Jan', lastName: 'Kowalski' },
        });

        await expect(
          checkWholeVenueConflict(REGULAR_HALL.id, START, END)
        ).rejects.toThrow(/Jan Kowalski/);
      });

      it('should use "nieznany klient" when whole-venue conflict has no client', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(REGULAR_HALL);
        mockPrisma.hall.findFirst.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue({
          id: 'res-wv',
          hallId: WHOLE_VENUE_HALL.id,
          client: null,
        });

        await expect(
          checkWholeVenueConflict(REGULAR_HALL.id, START, END)
        ).rejects.toThrow(/nieznany klient/);
      });
    });

    // Hall with allowWithWholeVenue — should skip whole-venue check
    describe('when booking hall with allowWithWholeVenue=true', () => {
      it('should pass without checking whole venue conflicts', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(COEXIST_HALL);

        await expect(
          checkWholeVenueConflict(COEXIST_HALL.id, START, END)
        ).resolves.toBeUndefined();

        // Should not look for whole venue hall
        expect(mockPrisma.hall.findFirst).not.toHaveBeenCalled();
        // Should not check reservations
        expect(mockPrisma.reservation.findFirst).not.toHaveBeenCalled();
      });
    });

    // Query correctness
    describe('query correctness', () => {
      it('should only check PENDING and CONFIRMED statuses for whole venue conflicts', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue(null);

        await checkWholeVenueConflict(WHOLE_VENUE_HALL.id, START, END);

        const findFirstCall = mockPrisma.reservation.findFirst.mock.calls[0][0];
        expect(findFirstCall.where.status.in).toEqual(['PENDING', 'CONFIRMED']);
      });

      it('should check non-archived reservations only', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue(null);

        await checkWholeVenueConflict(WHOLE_VENUE_HALL.id, START, END);

        const findFirstCall = mockPrisma.reservation.findFirst.mock.calls[0][0];
        expect(findFirstCall.where.archivedAt).toBeNull();
      });

      it('should use correct time overlap AND conditions', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue(null);

        await checkWholeVenueConflict(WHOLE_VENUE_HALL.id, START, END);

        const findFirstCall = mockPrisma.reservation.findFirst.mock.calls[0][0];
        expect(findFirstCall.where.AND).toHaveLength(2);
        expect(findFirstCall.where.AND[0]).toHaveProperty('startDateTime.lt', END);
        expect(findFirstCall.where.AND[1]).toHaveProperty('endDateTime.gt', START);
      });

      it('should check halls with allowWithWholeVenue=false only when booking whole venue', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
        mockPrisma.reservation.findFirst.mockResolvedValue(null);

        await checkWholeVenueConflict(WHOLE_VENUE_HALL.id, START, END);

        const findFirstCall = mockPrisma.reservation.findFirst.mock.calls[0][0];
        expect(findFirstCall.where.hall.allowWithWholeVenue).toBe(false);
        expect(findFirstCall.where.hallId).toEqual({ not: WHOLE_VENUE_HALL.id });
      });
    });
  });
});
