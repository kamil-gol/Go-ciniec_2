/**
 * ReservationService — Branch coverage phase 4
 * Covers:
 *   - createReservation with legacy date format (lines 590-593)
 *   - createReservation with confirmationDeadline (lines 617-619)
 *   - createReservation with depositAmount/depositDueDate shorthand (lines 629-631)
 *   - updateReservationMenu on COMPLETED reservation (lines 677-682)
 *   - updateReservation date change triggers checkWholeVenueConflict with excludeId (line 1022)
 */
jest.mock('../../../lib/prisma', () => {
  const mockPrisma: any = {
    reservation: {
      findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(),
      create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn(),
    },
    hall: { findUnique: jest.fn(), findFirst: jest.fn() },
    client: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    menuPackage: { findUnique: jest.fn() },
    menuOption: { findMany: jest.fn() },
    reservationMenuSnapshot: {
      create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn(),
    },
    deposit: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    reservationHistory: { create: jest.fn() },
    $transaction: jest.fn((fn: any) => (typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn))),
  };
  return { prisma: mockPrisma };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/reservation.utils', () => ({
  calculateTotalGuests: jest.fn((a: number, c: number, t: number) => a + c + t),
  calculateTotalPrice: jest.fn((...args: number[]) => args[0] * args[2] + args[1] * args[3]),
  validateConfirmationDeadline: jest.fn().mockReturnValue(true),
  validateCustomEventFields: jest.fn().mockReturnValue({ valid: true }),
  detectReservationChanges: jest.fn().mockReturnValue([]),
  formatChangesSummary: jest.fn().mockReturnValue(''),
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  default: { recalculateForGuestChange: jest.fn() },
}));

import { ReservationService } from '../../../services/reservation.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;
let service: ReservationService;
const UID = 'user-1';

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue({ id: UID, email: 'a@b.com' });
  service = new ReservationService();
});

// Helper: future dates
const futureDate = (() => {
  const d = new Date(Date.now() + 86400000 * 60);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
})();

describe('createReservation — legacy date format (lines 590-593)', () => {
  const setupCommon = () => {
    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, capacity: 200, isWholeVenue: false });
    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1', firstName: 'Jan', lastName: 'K' });
    mockPrisma.eventType.findUnique.mockResolvedValue({ id: 'e1', name: 'Wedding' });
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    mockPrisma.hall.findFirst.mockResolvedValue(null); // no whole-venue hall
    mockPrisma.reservationHistory.create.mockResolvedValue({});
    mockPrisma.reservation.create.mockResolvedValue({
      id: 'res-1', status: 'PENDING',
      hall: { id: 'h1', name: 'Sala A' },
      client: { id: 'c1', firstName: 'Jan', lastName: 'K' },
      eventType: { id: 'e1', name: 'Wedding' },
    });
  };

  it('should create reservation using date/startTime/endTime (legacy)', async () => {
    setupCommon();
    const result = await service.createReservation({
      hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
      date: futureDate, startTime: '14:00', endTime: '20:00',
      adults: 50, children: 10, toddlers: 5,
      pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
    } as any, UID);
    expect(result.id).toBe('res-1');
    expect(mockPrisma.reservation.create).toHaveBeenCalled();
  });

  it('should throw when legacy startTime >= endTime', async () => {
    setupCommon();
    await expect(service.createReservation({
      hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
      date: futureDate, startTime: '20:00', endTime: '14:00',
      adults: 50, children: 10, toddlers: 5,
      pricePerAdult: 200, pricePerChild: 100,
    } as any, UID)).rejects.toThrow('Godzina zakończenia musi być po godzinie rozpoczęcia');
  });

  it('should throw when legacy date has overlap', async () => {
    setupCommon();
    // First call = checkOverlap finds conflict
    mockPrisma.reservation.findFirst.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.createReservation({
      hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
      date: futureDate, startTime: '14:00', endTime: '20:00',
      adults: 50, children: 10, toddlers: 5,
      pricePerAdult: 200, pricePerChild: 100,
    } as any, UID)).rejects.toThrow('already booked');
  });
});

describe('createReservation — confirmationDeadline (lines 617-619)', () => {
  it('should pass with valid confirmationDeadline', async () => {
    const future = new Date(Date.now() + 86400000 * 30).toISOString();
    const futureEnd = new Date(Date.now() + 86400000 * 30 + 3600000 * 4).toISOString();
    const deadline = new Date(Date.now() + 86400000 * 28).toISOString();

    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, capacity: 200, isWholeVenue: false });
    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1', firstName: 'J', lastName: 'K' });
    mockPrisma.eventType.findUnique.mockResolvedValue({ id: 'e1', name: 'Party' });
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    mockPrisma.hall.findFirst.mockResolvedValue(null);
    mockPrisma.reservationHistory.create.mockResolvedValue({});
    mockPrisma.reservation.create.mockResolvedValue({
      id: 'res-d', status: 'PENDING',
      hall: { id: 'h1', name: 'S' }, client: { id: 'c1', firstName: 'J', lastName: 'K' },
      eventType: { id: 'e1', name: 'Party' },
    });

    await service.createReservation({
      hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
      startDateTime: future, endDateTime: futureEnd,
      confirmationDeadline: deadline,
      adults: 20, children: 5, toddlers: 0,
      pricePerAdult: 200, pricePerChild: 100,
    } as any, UID);

    expect(mockPrisma.reservation.create).toHaveBeenCalled();
  });
});

describe('createReservation — depositAmount/depositDueDate shorthand (lines 629-631)', () => {
  it('should create deposit via shorthand fields', async () => {
    const future = new Date(Date.now() + 86400000 * 30).toISOString();
    const futureEnd = new Date(Date.now() + 86400000 * 30 + 3600000 * 4).toISOString();
    const depDue = new Date(Date.now() + 86400000 * 14).toISOString();

    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, capacity: 200, isWholeVenue: false });
    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1', firstName: 'J', lastName: 'K' });
    mockPrisma.eventType.findUnique.mockResolvedValue({ id: 'e1', name: 'Party' });
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    mockPrisma.hall.findFirst.mockResolvedValue(null);
    mockPrisma.reservationHistory.create.mockResolvedValue({});
    mockPrisma.deposit.create.mockResolvedValue({});
    mockPrisma.reservation.create.mockResolvedValue({
      id: 'res-dep', status: 'PENDING',
      hall: { id: 'h1', name: 'S' }, client: { id: 'c1', firstName: 'J', lastName: 'K' },
      eventType: { id: 'e1', name: 'Party' },
    });

    await service.createReservation({
      hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
      startDateTime: future, endDateTime: futureEnd,
      adults: 20, children: 5, toddlers: 0,
      pricePerAdult: 200, pricePerChild: 100,
      depositAmount: 1000, depositDueDate: depDue,
    } as any, UID);

    expect(mockPrisma.deposit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 1000, remainingAmount: 1000 }),
      })
    );
  });
});

describe('updateReservationMenu — on COMPLETED reservation (lines 677-682)', () => {
  it('should throw when reservation is COMPLETED', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res-1', status: 'COMPLETED', adults: 50, children: 10, toddlers: 5,
      menuSnapshot: null, client: { firstName: 'J', lastName: 'K' }, hall: { name: 'Sala A' },
    });
    await expect(
      service.updateReservationMenu('res-1', { menuPackageId: 'pkg-1' } as any, UID)
    ).rejects.toThrow('Cannot update menu for completed or cancelled reservations');
  });

  it('should throw when reservation is CANCELLED', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res-1', status: 'CANCELLED', adults: 50, children: 10, toddlers: 5,
      menuSnapshot: null, client: null, hall: null,
    });
    await expect(
      service.updateReservationMenu('res-1', { menuPackageId: 'pkg-1' } as any, UID)
    ).rejects.toThrow('Cannot update menu for completed or cancelled reservations');
  });
});

describe('updateReservation — date change with excludeId (line 1022)', () => {
  it('should check overlap and wholeVenue with excludeId when changing dates', async () => {
    const future = new Date(Date.now() + 86400000 * 30);
    const futureEnd = new Date(Date.now() + 86400000 * 30 + 3600000 * 4);
    const newFuture = new Date(Date.now() + 86400000 * 31).toISOString();
    const newFutureEnd = new Date(Date.now() + 86400000 * 31 + 3600000 * 4).toISOString();

    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res-1', status: 'PENDING', hallId: 'h1',
      startDateTime: future, endDateTime: futureEnd,
      adults: 50, children: 10, toddlers: 5,
      pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
      totalPrice: 11000, menuSnapshot: null,
      hall: { id: 'h1', name: 'Sala A', capacity: 200, isWholeVenue: false },
      eventType: { id: 'e1', name: 'Wedding' },
      client: { id: 'c1', firstName: 'J', lastName: 'K' },
    });
    mockPrisma.reservation.findFirst.mockResolvedValue(null); // no overlap
    mockPrisma.hall.findUnique.mockResolvedValue({ id: 'h1', isWholeVenue: false });
    mockPrisma.hall.findFirst.mockResolvedValue(null); // no whole-venue hall
    mockPrisma.reservation.update.mockResolvedValue({
      id: 'res-1', status: 'PENDING',
      hall: { id: 'h1', name: 'Sala A' },
      client: { id: 'c1', firstName: 'J', lastName: 'K' },
      eventType: { id: 'e1', name: 'Wedding' },
    });

    await service.updateReservation('res-1', {
      startDateTime: newFuture, endDateTime: newFutureEnd,
    } as any, UID);

    // Should call findFirst for overlap check with excludeId
    expect(mockPrisma.reservation.findFirst).toHaveBeenCalled();
    expect(mockPrisma.reservation.update).toHaveBeenCalled();
  });
});
