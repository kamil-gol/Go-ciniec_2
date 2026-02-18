/**
 * ReservationService — Unit Tests: Create + Read
 * Część 2/4 testów modułu Rezerwacje
 *
 * Mockuje: prisma, audit-logger, reservation-menu.service
 */

import { ReservationService } from '../../../services/reservation.service';
import { ReservationStatus } from '../../../types/reservation.types';

// ═══ Mock Prisma ═══
const mockPrisma = {
  hall: { findUnique: jest.fn() },
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
  reservationMenuSnapshot: { create: jest.fn() },
  deposit: { create: jest.fn() },
  reservationHistory: { create: jest.fn() },
  activityLog: { create: jest.fn() },
};

jest.mock('../../../lib/prisma', () => ({
  prisma: mockPrisma,
  __esModule: true,
  default: mockPrisma,
}));

// ═══ Mock audit-logger ═══
jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

// ═══ Mock reservation-menu.service ═══
jest.mock('../../../services/reservation-menu.service', () => ({
  __esModule: true,
  default: {
    recalculateForGuestChange: jest.fn().mockResolvedValue(null),
  },
}));

// ═══ Test Fixtures ═══
const TEST_USER_ID = 'user-uuid-001';
const TEST_HALL = {
  id: 'hall-uuid-001',
  name: 'Sala Główna',
  capacity: 100,
  isActive: true,
  isWholeVenue: false,
};
const TEST_CLIENT = {
  id: 'client-uuid-001',
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan@example.com',
  phone: '+48123456789',
};
const TEST_EVENT_TYPE = {
  id: 'event-uuid-001',
  name: 'Wesele',
};

const FUTURE_START = '2026-08-15T14:00:00.000Z';
const FUTURE_END = '2026-08-15T22:00:00.000Z';

const VALID_CREATE_DTO = {
  hallId: TEST_HALL.id,
  clientId: TEST_CLIENT.id,
  eventTypeId: TEST_EVENT_TYPE.id,
  startDateTime: FUTURE_START,
  endDateTime: FUTURE_END,
  adults: 50,
  children: 10,
  toddlers: 5,
  pricePerAdult: 200,
  pricePerChild: 100,
  pricePerToddler: 50,
};

const CREATED_RESERVATION = {
  id: 'res-uuid-001',
  ...VALID_CREATE_DTO,
  guests: 65,
  totalPrice: 11250, // 50*200 + 10*100 + 5*50
  status: ReservationStatus.PENDING,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  hall: TEST_HALL,
  client: TEST_CLIENT,
  eventType: TEST_EVENT_TYPE,
  createdBy: { id: TEST_USER_ID, email: 'admin@test.pl' },
};

// ═══ Service Instance ═══
let service: ReservationService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new ReservationService();

  // Default mocks — happy path
  mockPrisma.user.findUnique.mockResolvedValue({ id: TEST_USER_ID });
  mockPrisma.hall.findUnique.mockResolvedValue(TEST_HALL);
  mockPrisma.client.findUnique.mockResolvedValue(TEST_CLIENT);
  mockPrisma.eventType.findUnique.mockResolvedValue(TEST_EVENT_TYPE);
  mockPrisma.reservation.create.mockResolvedValue(CREATED_RESERVATION);
  mockPrisma.reservation.findFirst.mockResolvedValue(null); // no overlap
  mockPrisma.reservationHistory.create.mockResolvedValue({});
  mockPrisma.activityLog.create.mockResolvedValue({});
});

// ════════════════════════════════════════════════════════════════
// createReservation
// ════════════════════════════════════════════════════════════════
describe('ReservationService', () => {
  describe('createReservation()', () => {

    it('should create reservation with correct data (happy path)', async () => {
      const result = await service.createReservation(VALID_CREATE_DTO, TEST_USER_ID);

      expect(result.id).toBe('res-uuid-001');
      expect(result.status).toBe(ReservationStatus.PENDING);
      expect(mockPrisma.reservation.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.reservationHistory.create).toHaveBeenCalledTimes(1);
    });

    it('should calculate guests and totalPrice correctly', async () => {
      await service.createReservation(VALID_CREATE_DTO, TEST_USER_ID);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.guests).toBe(65); // 50 + 10 + 5
      expect(createCall.data.totalPrice).toBe(11250); // 50*200 + 10*100 + 5*50
    });

    it('should throw when hallId is missing', async () => {
      const dto = { ...VALID_CREATE_DTO, hallId: '' };
      await expect(service.createReservation(dto, TEST_USER_ID))
        .rejects.toThrow('Hall, client, and event type are required');
    });

    it('should throw when hall is not found', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(null);
      await expect(service.createReservation(VALID_CREATE_DTO, TEST_USER_ID))
        .rejects.toThrow('Hall not found');
    });

    it('should throw when hall is inactive', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue({ ...TEST_HALL, isActive: false });
      await expect(service.createReservation(VALID_CREATE_DTO, TEST_USER_ID))
        .rejects.toThrow('Hall is not active');
    });

    it('should throw when guests exceed hall capacity', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue({ ...TEST_HALL, capacity: 30 });
      await expect(service.createReservation(VALID_CREATE_DTO, TEST_USER_ID))
        .rejects.toThrow(/exceeds hall capacity/);
    });

    it('should throw when no datetime provided', async () => {
      const dto = { ...VALID_CREATE_DTO, startDateTime: undefined, endDateTime: undefined };
      await expect(service.createReservation(dto, TEST_USER_ID))
        .rejects.toThrow(/startDateTime\/endDateTime or date\/startTime\/endTime/);
    });

    it('should throw when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.createReservation(VALID_CREATE_DTO, TEST_USER_ID))
        .rejects.toThrow(/wygasła|użytkownik/);
    });

    it('should throw when time slot overlaps', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue({ id: 'existing-res' });
      await expect(service.createReservation(VALID_CREATE_DTO, TEST_USER_ID))
        .rejects.toThrow(/already booked/);
    });

    it('should throw when all guest counts are zero', async () => {
      const dto = { ...VALID_CREATE_DTO, adults: 0, children: 0, toddlers: 0 };
      await expect(service.createReservation(dto, TEST_USER_ID))
        .rejects.toThrow('At least one person is required');
    });

    it('should apply percentage discount correctly', async () => {
      const dto = {
        ...VALID_CREATE_DTO,
        discountType: 'PERCENTAGE' as const,
        discountValue: 10,
        discountReason: 'Stały klient z rabatami',
      };
      await service.createReservation(dto, TEST_USER_ID);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      // totalPrice = 11250, 10% = 1125, final = 10125
      expect(createCall.data.totalPrice).toBe(10125);
      expect(createCall.data.discountAmount).toBe(1125);
      expect(createCall.data.priceBeforeDiscount).toBe(11250);
    });

    it('should apply fixed discount correctly', async () => {
      const dto = {
        ...VALID_CREATE_DTO,
        discountType: 'FIXED' as const,
        discountValue: 500,
        discountReason: 'Jednorazowa zniżka',
      };
      await service.createReservation(dto, TEST_USER_ID);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.totalPrice).toBe(10750); // 11250 - 500
      expect(createCall.data.discountAmount).toBe(500);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // getReservations
  // ══════════════════════════════════════════════════════════════
  describe('getReservations()', () => {
    const mockReservations = [
      { id: 'res-1', status: 'PENDING', archivedAt: null },
      { id: 'res-2', status: 'CONFIRMED', archivedAt: null },
    ];

    beforeEach(() => {
      mockPrisma.reservation.findMany.mockResolvedValue(mockReservations);
    });

    it('should return all non-archived reservations by default', async () => {
      const result = await service.getReservations();
      expect(result).toHaveLength(2);

      const call = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(call.where.archivedAt).toBeNull();
    });

    it('should filter by status', async () => {
      await service.getReservations({ status: ReservationStatus.PENDING });

      const call = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('PENDING');
    });

    it('should filter by hallId', async () => {
      await service.getReservations({ hallId: 'hall-uuid-001' });

      const call = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(call.where.hallId).toBe('hall-uuid-001');
    });

    it('should filter by date range', async () => {
      await service.getReservations({
        dateFrom: '2026-06-01',
        dateTo: '2026-06-30',
      });

      const call = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toHaveLength(2); // startDateTime + date (legacy)
    });

    it('should include archived when requested', async () => {
      await service.getReservations({ archived: true });

      const call = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(call.where.archivedAt).toEqual({ not: null });
    });
  });

  // ══════════════════════════════════════════════════════════════
  // getReservationById
  // ══════════════════════════════════════════════════════════════
  describe('getReservationById()', () => {
    it('should return reservation with includes', async () => {
      const fullReservation = {
        ...CREATED_RESERVATION,
        menuSnapshot: null,
        deposits: [],
      };
      mockPrisma.reservation.findUnique.mockResolvedValue(fullReservation);

      const result = await service.getReservationById('res-uuid-001');
      expect(result.id).toBe('res-uuid-001');

      const call = mockPrisma.reservation.findUnique.mock.calls[0][0];
      expect(call.include.menuSnapshot).toBe(true);
      expect(call.include.deposits).toBe(true);
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.getReservationById('nonexistent'))
        .rejects.toThrow('Reservation not found');
    });

    it('should include hall, client, eventType, createdBy', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...CREATED_RESERVATION,
        menuSnapshot: null,
        deposits: [],
      });

      await service.getReservationById('res-uuid-001');

      const call = mockPrisma.reservation.findUnique.mock.calls[0][0];
      expect(call.include.hall).toBeDefined();
      expect(call.include.client).toBeDefined();
      expect(call.include.eventType).toBeDefined();
      expect(call.include.createdBy).toBeDefined();
    });
  });
});
