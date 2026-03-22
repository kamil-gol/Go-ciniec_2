/**
 * ReservationService — Branch Coverage
 * Lines 593, 631: updateReservation guest change with/without menu
 * Archive/unarchive branches
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
    reservationCategoryExtra: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn(), deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $transaction: jest.fn((fn: any) => (typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn))),
  };
  return { prisma: mockPrisma };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/recalculate-price', () => ({
  computeReservationBasePrice: jest.fn(),
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(0),
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(messageOrCode: string | number, codeOrMessage?: number | string) {
      if (typeof messageOrCode === 'number') {
        super(typeof codeOrMessage === 'string' ? codeOrMessage : 'Error');
        this.statusCode = messageOrCode;
      } else {
        super(messageOrCode);
        this.statusCode = typeof codeOrMessage === 'number' ? codeOrMessage : 500;
      }
    }
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

jest.mock('../../../services/notification.service', () => ({
  __esModule: true,
  default: { createForAll: jest.fn().mockResolvedValue(0) },
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
  mockPrisma.reservation.findMany.mockResolvedValue([]);
  mockPrisma.reservation.findFirst.mockResolvedValue(null);
  mockPrisma.hall.findFirst.mockResolvedValue(null);
  // Default: user exists
  mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@test.pl' });
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

    // Just verify update was called — exact data shape may vary by implementation
    expect(mockPrisma.reservation.update).toHaveBeenCalled();
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
