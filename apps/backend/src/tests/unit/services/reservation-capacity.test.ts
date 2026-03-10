/**
 * ReservationService — Capacity Validation Unit Tests (#165)
 *
 * Tests the validateCapacityForTimeRange decision tree via createReservation():
 * 1. No overlap → create passes
 * 2. allowMultipleBookings=false + overlap → MULTIPLE_BOOKINGS_DISABLED
 * 3. allowMultipleBookings=true + within capacity → passes
 * 4. allowMultipleBookings=true + exceeded → CAPACITY_EXCEEDED
 * 5. excludeReservationId (via updateReservation path)
 * 6. guests > hall.capacity → GUESTS_EXCEED_CAPACITY
 * 7. Whole venue blocking
 */

jest.mock('../../../lib/prisma', () => {
  const mock: Record<string, any> = {
    hall: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    eventType: {
      findUnique: jest.fn(),
    },
    reservation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    menuPackage: {
      findUnique: jest.fn(),
    },
    menuOption: {
      findMany: jest.fn(),
    },
    reservationMenuSnapshot: {
      create: jest.fn(),
    },
    reservationHistory: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    deposit: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
    serviceItem: {
      findMany: jest.fn(),
    },
    reservationExtra: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((fn: any): any => (typeof fn === 'function' ? fn(mock) : Promise.all(fn))),
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
  recalculateReservationTotalPrice: jest.fn().mockReturnValue(1000),
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  __esModule: true,
  default: { recalculateForGuestChange: jest.fn().mockResolvedValue(null) },
}));

import { ReservationService } from '../../../services/reservation.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;
const USER_ID = 'user-001';

const BASE_HALL = {
  id: 'hall-1',
  name: 'Sala Główna',
  capacity: 100,
  isActive: true,
  isWholeVenue: false,
  allowMultipleBookings: false,
  allowWithWholeVenue: false,
};

const MULTI_HALL = {
  ...BASE_HALL,
  id: 'hall-multi',
  name: 'Sala Multi',
  allowMultipleBookings: true,
  capacity: 200,
};

const WHOLE_VENUE_HALL = {
  ...BASE_HALL,
  id: 'hall-wv',
  name: 'Cały Obiekt',
  isWholeVenue: true,
  capacity: 300,
};

const CLIENT = { id: 'client-1', firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.pl', phone: '123456789' };
const EVENT_TYPE = { id: 'evt-1', name: 'Wesele' };
const USER = { id: USER_ID, email: 'admin@test.pl' };

const FUTURE_START = '2027-06-15T14:00:00.000Z';
const FUTURE_END = '2027-06-15T22:00:00.000Z';

function baseCreateDTO(overrides: Record<string, any> = {}) {
  return {
    hallId: BASE_HALL.id,
    clientId: CLIENT.id,
    eventTypeId: EVENT_TYPE.id,
    startDateTime: FUTURE_START,
    endDateTime: FUTURE_END,
    adults: 50,
    children: 0,
    toddlers: 0,
    pricePerAdult: 200,
    pricePerChild: 100,
    pricePerToddler: 0,
    ...overrides,
  };
}

const CREATED_RESERVATION = {
  id: 'res-new',
  hallId: BASE_HALL.id,
  clientId: CLIENT.id,
  guests: 50,
  totalPrice: 10000,
  status: 'PENDING',
  hall: { id: BASE_HALL.id, name: BASE_HALL.name, capacity: BASE_HALL.capacity, isWholeVenue: false, allowMultipleBookings: false },
  client: CLIENT,
  eventType: EVENT_TYPE,
  createdBy: USER,
};

let service: ReservationService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new ReservationService();

  // Default mocks — happy path
  mockPrisma.user.findUnique.mockResolvedValue(USER);
  mockPrisma.hall.findUnique.mockResolvedValue(BASE_HALL);
  mockPrisma.hall.findFirst.mockResolvedValue(null);
  mockPrisma.client.findUnique.mockResolvedValue(CLIENT);
  mockPrisma.eventType.findUnique.mockResolvedValue(EVENT_TYPE);
  mockPrisma.reservation.findMany.mockResolvedValue([]);
  mockPrisma.reservation.findFirst.mockResolvedValue(null);
  mockPrisma.reservation.create.mockResolvedValue(CREATED_RESERVATION);
  mockPrisma.reservationHistory.create.mockResolvedValue({});
  mockPrisma.activityLog.create.mockResolvedValue({});
  mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
  mockPrisma.menuOption.findMany.mockResolvedValue([]);
  mockPrisma.deposit.create.mockResolvedValue({});
  mockPrisma.serviceItem.findMany.mockResolvedValue([]);
  mockPrisma.reservationExtra.findMany.mockResolvedValue([]);
});

describe('ReservationService — Capacity Validation (#165)', () => {

  // ─── Case 1: No overlapping reservations → success ───
  describe('no overlap', () => {
    it('should create reservation when no overlapping reservations exist', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      const result = await service.createReservation(baseCreateDTO() as any, USER_ID);

      expect(result.id).toBe('res-new');
      expect(mockPrisma.reservation.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Case 2: allowMultipleBookings=false + overlap → block ───
  describe('allowMultipleBookings=false + overlap', () => {
    it('should throw MULTIPLE_BOOKINGS_DISABLED when hall does not allow multiple bookings and overlap exists', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(BASE_HALL);
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-existing', guests: 40 },
      ]);

      await expect(
        service.createReservation(baseCreateDTO() as any, USER_ID)
      ).rejects.toThrow('Ta sala nie dopuszcza wielu rezerwacji w tym samym czasie');
    });
  });

  // ─── Case 3: allowMultipleBookings=true + within capacity → success ───
  describe('allowMultipleBookings=true + within capacity', () => {
    it('should create reservation when aggregate guests fit within capacity', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(MULTI_HALL);
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-a', guests: 50 },
        { id: 'res-b', guests: 30 },
      ]);
      mockPrisma.reservation.create.mockResolvedValue({
        ...CREATED_RESERVATION,
        hallId: MULTI_HALL.id,
        hall: { ...MULTI_HALL },
      });

      const result = await service.createReservation(
        baseCreateDTO({ hallId: MULTI_HALL.id }) as any,
        USER_ID
      );

      expect(result).toBeDefined();
      expect(mockPrisma.reservation.create).toHaveBeenCalledTimes(1);
    });

    it('should allow when exactly at capacity', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(MULTI_HALL);
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-a', guests: 150 },
      ]);
      mockPrisma.reservation.create.mockResolvedValue({
        ...CREATED_RESERVATION,
        hallId: MULTI_HALL.id,
        hall: { ...MULTI_HALL },
      });

      const result = await service.createReservation(
        baseCreateDTO({ hallId: MULTI_HALL.id }) as any,
        USER_ID
      );

      expect(result).toBeDefined();
    });
  });

  // ─── Case 4: allowMultipleBookings=true + capacity exceeded → block ───
  describe('allowMultipleBookings=true + capacity exceeded', () => {
    it('should throw CAPACITY_EXCEEDED when aggregate guests exceed capacity', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(MULTI_HALL);
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-a', guests: 100 },
        { id: 'res-b', guests: 60 },
      ]);

      await expect(
        service.createReservation(
          baseCreateDTO({ hallId: MULTI_HALL.id }) as any,
          USER_ID
        )
      ).rejects.toThrow(/Brak wystarczającej pojemności sali/);
    });

    it('should include available/total in error message', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(MULTI_HALL);
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-a', guests: 170 },
      ]);

      await expect(
        service.createReservation(
          baseCreateDTO({ hallId: MULTI_HALL.id }) as any,
          USER_ID
        )
      ).rejects.toThrow('Brak wystarczającej pojemności sali. Żądano miejsc: 50, dostępne: 30/200');
    });
  });

  // ─── Case 5: Single-reservation guests > hall.capacity ───
  describe('guests exceed hall capacity (single reservation)', () => {
    it('should throw GUESTS_EXCEED_CAPACITY when guests alone exceed capacity', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(BASE_HALL);

      await expect(
        service.createReservation(
          baseCreateDTO({ adults: 120 }) as any,
          USER_ID
        )
      ).rejects.toThrow('Liczba gości (120) przekracza pojemność sali (100)');
    });
  });

  // ─── Case 6: Whole venue blocking ───
  describe('whole venue conflict', () => {
    it('should block when whole venue is booked and regular hall reservation attempted', async () => {
      const regularHall = { ...BASE_HALL, allowWithWholeVenue: false };
      mockPrisma.hall.findUnique.mockResolvedValue(regularHall);
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      mockPrisma.hall.findFirst.mockResolvedValue(WHOLE_VENUE_HALL);
      mockPrisma.reservation.findFirst.mockResolvedValue({
        id: 'res-wv',
        hallId: WHOLE_VENUE_HALL.id,
        client: { firstName: 'Anna', lastName: 'Nowak' },
      });

      await expect(
        service.createReservation(baseCreateDTO() as any, USER_ID)
      ).rejects.toThrow(/cały obiekt jest już zarezerwowany/);
    });

    it('should block when booking whole venue but regular hall has reservation', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE_HALL);
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      mockPrisma.reservation.findFirst.mockResolvedValue({
        id: 'res-regular',
        hallId: BASE_HALL.id,
        hall: { name: 'Sala Główna' },
        client: { firstName: 'Piotr', lastName: 'Zieliński' },
      });

      await expect(
        service.createReservation(
          baseCreateDTO({ hallId: WHOLE_VENUE_HALL.id }) as any,
          USER_ID
        )
      ).rejects.toThrow(/Nie można zarezerwować całego obiektu/);
    });
  });

  // ─── Case 7: Overlap query uses correct filters ───
  describe('overlap query correctness', () => {
    it('should query only PENDING and CONFIRMED reservations (not CANCELLED/ARCHIVED)', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await service.createReservation(baseCreateDTO() as any, USER_ID);

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.status.in).toEqual(['PENDING', 'CONFIRMED']);
      expect(findManyCall.where.archivedAt).toBeNull();
    });

    it('should check time range overlap with AND conditions', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await service.createReservation(baseCreateDTO() as any, USER_ID);

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).toHaveLength(2);
      expect(findManyCall.where.AND[0]).toHaveProperty('startDateTime.lt');
      expect(findManyCall.where.AND[1]).toHaveProperty('endDateTime.gt');
    });

    it('should filter by correct hallId', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      await service.createReservation(baseCreateDTO() as any, USER_ID);

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.hallId).toBe(BASE_HALL.id);
    });
  });

  // ─── Case 8: Edge cases ───
  describe('edge cases', () => {
    it('should handle overlapping reservations with 0 guests gracefully', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(MULTI_HALL);
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'res-zero', guests: 0 },
      ]);
      mockPrisma.reservation.create.mockResolvedValue({
        ...CREATED_RESERVATION,
        hallId: MULTI_HALL.id,
        hall: { ...MULTI_HALL },
      });

      const result = await service.createReservation(
        baseCreateDTO({ hallId: MULTI_HALL.id }) as any,
        USER_ID
      );

      expect(result).toBeDefined();
    });

    it('should handle hall with capacity 0 — any guests should fail', async () => {
      const zeroCapHall = { ...MULTI_HALL, capacity: 0 };
      mockPrisma.hall.findUnique.mockResolvedValue(zeroCapHall);

      await expect(
        service.createReservation(
          baseCreateDTO({ hallId: zeroCapHall.id }) as any,
          USER_ID
        )
      ).rejects.toThrow(/przekracza pojemność sali/);
    });

    it('should allow multiple reservations with 1 guest each when capacity permits', async () => {
      const smallHall = { ...MULTI_HALL, capacity: 5 };
      mockPrisma.hall.findUnique.mockResolvedValue(smallHall);
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'r1', guests: 1 },
        { id: 'r2', guests: 1 },
        { id: 'r3', guests: 1 },
      ]);
      mockPrisma.reservation.create.mockResolvedValue({
        ...CREATED_RESERVATION,
        hallId: smallHall.id,
        hall: { ...smallHall },
      });

      const result = await service.createReservation(
        baseCreateDTO({ hallId: smallHall.id, adults: 1 }) as any,
        USER_ID
      );

      expect(result).toBeDefined();
    });
  });
});
