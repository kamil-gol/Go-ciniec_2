/**
 * ReservationService — Branch Coverage
 * Lines 979-994: checkWholeVenueConflict (non-whole-venue blocked by whole-venue reservation)
 * Line 1022: checkOverlap with excludeId
 * Lines 593, 631: updateReservation guest change with/without menu
 */
jest.mock('../../../lib/prisma', () => {
  const mockPrisma: any = {
    reservation: {
      findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
      create: jest.fn(), update: jest.fn(), count: jest.fn(),
    },
    hall: { findUnique: jest.fn(), findFirst: jest.fn() },
    client: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    deposit: { findMany: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    reservationHistory: { create: jest.fn().mockResolvedValue({}) },
    reservationMenuSnapshot: {
      findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => (typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn))),
  };
  return { prisma: mockPrisma };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) { super(message); this.statusCode = statusCode; }
  }
  return { AppError: MockAppError };
});

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
    recalculateForGuestChange: jest.fn().mockResolvedValue(null),
  },
}));

import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma as any;

// Import after mocks
let ReservationService: any;
let service: any;

beforeAll(() => {
  const mod = require('../../../services/reservation.service');
  service = mod.default;
  ReservationService = mod.ReservationService;
});

beforeEach(() => {
  jest.clearAllMocks();
  if (mockPrisma.reservation?.findMany) mockPrisma.reservation.findMany.mockResolvedValue([]);
  if (mockPrisma.reservation?.findFirst) mockPrisma.reservation.findFirst.mockResolvedValue(null);
  if (mockPrisma.hall?.findFirst) mockPrisma.hall.findFirst.mockResolvedValue(null);
  // Default mocks for overlapping check
  if (db.reservation?.findMany) db.reservation.findMany.mockResolvedValue([]);
  if (db.reservation?.findFirst) db.reservation.findFirst.mockResolvedValue(null);
  if (db.hall?.findFirst) db.hall.findFirst.mockResolvedValue(null);
  // Default: user exists
  mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@test.pl' });
});

describe('ReservationService — checkWholeVenueConflict (lines 979-994)', () => {

  it('should throw when booking regular hall but whole venue already reserved', async () => {
    // Setup: creating a reservation for a regular hall
    mockPrisma.hall.findUnique
      .mockResolvedValueOnce({ id: 'h1', name: 'Sala A', capacity: 100, isActive: true, isWholeVenue: false })  // main query
      .mockResolvedValueOnce({ id: 'h1', name: 'Sala A', capacity: 100, isWholeVenue: false });  // wholeVenueConflict check

    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1', firstName: 'Jan', lastName: 'K' });
    mockPrisma.eventType.findUnique.mockResolvedValue({ id: 'e1', name: 'Wesele' });

    // Whole venue hall exists
    mockPrisma.hall.findFirst.mockResolvedValue({ id: 'h-whole', isWholeVenue: true });

    // reservation.findFirst is called exactly twice:
    // 1) checkDateTimeOverlap → null (no overlap)
    // 2) checkWholeVenueConflict → conflict found
    mockPrisma.reservation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'r-conflict', hallId: 'h-whole',
        client: { firstName: 'Anna', lastName: 'N' },
      });

    await expect(
      service.createReservation({
        hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
        startDateTime: new Date(Date.now() + 86400000 * 30).toISOString(),
        endDateTime: new Date(Date.now() + 86400000 * 30 + 3600000 * 8).toISOString(),
        adults: 50, children: 10, toddlers: 5,
        pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
      }, 'u1')
    ).rejects.toThrow('cały obiekt jest już zarezerwowany');
  });

  it('should throw when booking whole venue but regular hall has reservation', async () => {
    mockPrisma.hall.findUnique
      .mockResolvedValueOnce({ id: 'h-whole', name: 'Cały obiekt', capacity: 200, isActive: true, isWholeVenue: true })
      .mockResolvedValueOnce({ id: 'h-whole', name: 'Cały obiekt', capacity: 200, isWholeVenue: true });

    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1', firstName: 'Jan', lastName: 'K' });
    mockPrisma.eventType.findUnique.mockResolvedValue({ id: 'e1', name: 'Wesele' });

    mockPrisma.reservation.findFirst
      .mockResolvedValueOnce(null)  // checkDateTimeOverlap
      .mockResolvedValueOnce({      // wholeVenueConflict — regular hall conflict!
        id: 'r-conflict', hallId: 'h1',
        hall: { name: 'Sala A' },
        client: { firstName: 'Jan', lastName: 'K' },
      });

    await expect(
      service.createReservation({
        hallId: 'h-whole', clientId: 'c1', eventTypeId: 'e1',
        startDateTime: new Date(Date.now() + 86400000 * 30).toISOString(),
        endDateTime: new Date(Date.now() + 86400000 * 30 + 3600000 * 8).toISOString(),
        adults: 100, children: 20, toddlers: 10,
        pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
      }, 'u1')
    ).rejects.toThrow('Nie można zarezerwować całego obiektu');
  });
});

describe('ReservationService — updateReservation guest change branches', () => {

  const makeExisting = (overrides: any = {}) => ({
    id: 'r1', status: 'PENDING', hallId: 'h1',
    adults: 10, children: 5, toddlers: 2, guests: 17,
    pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
    totalPrice: 1250, startDateTime: new Date(Date.now() + 86400000 * 30),
    endDateTime: new Date(Date.now() + 86400000 * 30 + 3600000 * 8),
    archivedAt: null, confirmationDeadline: null,
    hall: { id: 'h1', name: 'Sala A', capacity: 200, isWholeVenue: false },
    eventType: { id: 'e1', name: 'Wesele' },
    menuSnapshot: null,
    client: { id: 'c1', firstName: 'Jan', lastName: 'K' },
    ...overrides,
  });

  it('should recalculate price when guests change WITHOUT menu package', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(makeExisting());
    mockPrisma.reservation.findFirst.mockResolvedValue(null); // no overlap
    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isWholeVenue: false });
    mockPrisma.hall.findFirst.mockResolvedValue(null);
    mockPrisma.reservation.update.mockResolvedValue(makeExisting({ adults: 20 }));

    await service.updateReservation('r1', { adults: 20, reason: 'Zmiana liczby gości na 20 osób' }, 'u1');

    expect(mockPrisma.reservation.update).toHaveBeenCalled();
  });

  it('should recalculate menu price when guests change WITH menu package', async () => {
    const recalcMock = require('../../../services/reservation-menu.service').default.recalculateForGuestChange;
    recalcMock.mockResolvedValue({ totalMenuPrice: 3000, packagePrice: 2500, optionsPrice: 500 });

    mockPrisma.reservation.findUnique.mockResolvedValue(makeExisting({
      menuSnapshot: { id: 'ms1', menuData: { packageName: 'Gold' }, totalMenuPrice: 2000 },
    }));
    mockPrisma.reservation.update.mockResolvedValue(makeExisting({ adults: 20 }));
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isWholeVenue: false });
    mockPrisma.hall.findFirst.mockResolvedValue(null);

    await service.updateReservation('r1', { adults: 20, reason: 'Zmiana gości z pakietem menu' }, 'u1');

    expect(recalcMock).toHaveBeenCalledWith('r1', 20, 5, 2);
  });

  it('should update pricePerAdult without menu package', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(makeExisting());
    mockPrisma.reservation.update.mockResolvedValue(makeExisting({ pricePerAdult: 120 }));
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isWholeVenue: false });
    mockPrisma.hall.findFirst.mockResolvedValue(null);

    await service.updateReservation('r1', { pricePerAdult: 120, reason: 'Korekta ceny za osobę dorosłą' }, 'u1');

    expect(mockPrisma.reservation.update).toHaveBeenCalled();
  });
});

describe('ReservationService — archiveReservation / unarchiveReservation', () => {

  it('should archive a reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', archivedAt: null,
      client: { firstName: 'Jan', lastName: 'K' },
      hall: { name: 'Sala A' },
    });
    mockPrisma.reservation.update.mockResolvedValue({});

    await service.archiveReservation('r1', 'u1', 'Archiwizacja');

    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ archivedAt: expect.any(Date) }) })
    );
  });

  it('should throw when already archived', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', archivedAt: new Date(),
      client: { firstName: 'Jan', lastName: 'K' },
      hall: { name: 'Sala A' },
    });

    await expect(service.archiveReservation('r1', 'u1'))
      .rejects.toThrow('już zarchiwizowana');
  });

  it('should unarchive a reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', archivedAt: new Date(),
      client: { firstName: 'Jan', lastName: 'K' },
      hall: { name: 'Sala A' },
    });
    mockPrisma.reservation.update.mockResolvedValue({});

    await service.unarchiveReservation('r1', 'u1');

    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { archivedAt: null } })
    );
  });

  it('should throw when not archived', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', archivedAt: null,
      client: { firstName: 'Jan', lastName: 'K' },
      hall: { name: 'Sala A' },
    });

    await expect(service.unarchiveReservation('r1', 'u1'))
      .rejects.toThrow('nie jest zarchiwizowana');
  });
});

describe('ReservationService — updateStatus COMPLETED', () => {

  it('should block completing reservation before event date', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30);
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', status: 'CONFIRMED',
      startDateTime: futureDate,
      client: { firstName: 'Jan', lastName: 'K' },
      hall: { name: 'Sala A' },
    });

    await expect(service.updateStatus('r1', { status: 'COMPLETED' }, 'u1'))
      .rejects.toThrow('Nie można zakończyć rezerwacji przed datą wydarzenia');
  });

  it('should use legacy date field for completion check', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString().substring(0, 10);
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', status: 'CONFIRMED',
      startDateTime: null,
      date: futureDate,
      client: { firstName: 'Jan', lastName: 'K' },
      hall: { name: 'Sala A' },
    });

    await expect(service.updateStatus('r1', { status: 'COMPLETED' }, 'u1'))
      .rejects.toThrow('Nie można zakończyć rezerwacji przed datą wydarzenia');
  });
});
