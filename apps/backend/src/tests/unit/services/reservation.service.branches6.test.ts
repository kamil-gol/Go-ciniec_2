/**
 * ReservationService — Branch coverage phase 6
 * Final uncovered lines:
 *   - 680-685: manual price recalculation (!isUsingMenuPackage && guestsChanged/priceChanged)
 *   - 711: detectedChanges history entry + audit log with diffObjects
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
import { diffObjects } from '../../../utils/audit-logger';
import { detectReservationChanges, formatChangesSummary } from '../../../utils/reservation.utils';

const mockPrisma = prisma as any;
const mockDiffObjects = diffObjects as jest.Mock;
const mockDetectChanges = detectReservationChanges as jest.Mock;
const mockFormatChanges = formatChangesSummary as jest.Mock;

let service: ReservationService;
const UID = 'user-1';

const baseExisting = {
  id: 'res-1', status: 'PENDING', hallId: 'h1',
  startDateTime: new Date(Date.now() + 86400000 * 30),
  endDateTime: new Date(Date.now() + 86400000 * 30 + 3600000 * 4),
  adults: 50, children: 10, toddlers: 5,
  pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
  totalPrice: 11000, menuSnapshot: null,
  hall: { id: 'h1', name: 'Sala A', capacity: 300, isWholeVenue: false },
  eventType: { id: 'e1', name: 'Wedding' },
  client: { id: 'c1', firstName: 'J', lastName: 'K' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue({ id: UID, email: 'a@b.com' });
  service = new ReservationService();
});

// ─── Lines 680-685: Manual price recalculation ───

describe('updateReservation — manual price recalculation (no menu package)', () => {
  it('should recalculate totalPrice when adults change (no menu)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(baseExisting);
    mockPrisma.reservation.update.mockResolvedValue({
      ...baseExisting, adults: 60,
      hall: baseExisting.hall, client: baseExisting.client, eventType: baseExisting.eventType,
    });

    await service.updateReservation('res-1', { adults: 60 } as any, UID);

    const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
    expect(updateCall.data.adults).toBe(60);
    expect(updateCall.data.guests).toBeDefined();
    expect(updateCall.data.totalPrice).toBeDefined();
  });

  it('should recalculate totalPrice when pricePerAdult changes (no menu, no guest change)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(baseExisting);
    mockPrisma.reservation.update.mockResolvedValue({
      ...baseExisting, pricePerAdult: 250,
      hall: baseExisting.hall, client: baseExisting.client, eventType: baseExisting.eventType,
    });

    await service.updateReservation('res-1', { pricePerAdult: 250 } as any, UID);

    const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
    expect(updateCall.data.pricePerAdult).toBe(250);
    expect(updateCall.data.totalPrice).toBeDefined();
  });

  it('should recalculate totalPrice when pricePerChild changes', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(baseExisting);
    mockPrisma.reservation.update.mockResolvedValue({
      ...baseExisting,
      hall: baseExisting.hall, client: baseExisting.client, eventType: baseExisting.eventType,
    });

    await service.updateReservation('res-1', { pricePerChild: 120 } as any, UID);

    const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
    expect(updateCall.data.pricePerChild).toBe(120);
    expect(updateCall.data.totalPrice).toBeDefined();
  });

  it('should recalculate totalPrice when pricePerToddler changes', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(baseExisting);
    mockPrisma.reservation.update.mockResolvedValue({
      ...baseExisting,
      hall: baseExisting.hall, client: baseExisting.client, eventType: baseExisting.eventType,
    });

    await service.updateReservation('res-1', { pricePerToddler: 50 } as any, UID);

    const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
    expect(updateCall.data.pricePerToddler).toBe(50);
    expect(updateCall.data.totalPrice).toBeDefined();
  });
});

// ─── Line 711: detectedChanges + audit log ───

describe('updateReservation — detectedChanges triggers history + audit', () => {
  it('should create history entry when changes detected and reason provided', async () => {
    mockDetectChanges.mockReturnValueOnce([
      { field: 'adults', oldValue: 50, newValue: 60 }
    ]);
    mockFormatChanges.mockReturnValueOnce('adults: 50 \u2192 60');
    mockDiffObjects.mockReturnValueOnce({ adults: { old: 50, new: 60 } });

    mockPrisma.reservation.findUnique.mockResolvedValue(baseExisting);
    mockPrisma.reservation.update.mockResolvedValue({
      ...baseExisting, adults: 60,
      hall: baseExisting.hall, client: baseExisting.client, eventType: baseExisting.eventType,
    });
    mockPrisma.reservationHistory.create.mockResolvedValue({});

    await service.updateReservation('res-1', {
      adults: 60,
      reason: 'Client requested more guests for the event',
    } as any, UID);

    // History entry should be created
    expect(mockPrisma.reservationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changeType: 'UPDATED',
          fieldName: 'multiple',
        }),
      })
    );

    // Audit log should be called with changes
    const { logChange } = require('../../../utils/audit-logger');
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        entityType: 'RESERVATION',
        details: expect.objectContaining({
          changes: { adults: { old: 50, new: 60 } },
          reason: 'Client requested more guests for the event',
        }),
      })
    );
  });

  it('should throw when changes detected but reason too short', async () => {
    mockDetectChanges.mockReturnValueOnce([
      { field: 'adults', oldValue: 50, newValue: 60 }
    ]);

    mockPrisma.reservation.findUnique.mockResolvedValue(baseExisting);

    await expect(
      service.updateReservation('res-1', {
        adults: 60,
        reason: 'short',
      } as any, UID)
    ).rejects.toThrow('Reason is required for changes (minimum 10 characters)');
  });

  it('should throw when changes detected but no reason provided', async () => {
    mockDetectChanges.mockReturnValueOnce([
      { field: 'adults', oldValue: 50, newValue: 60 }
    ]);

    mockPrisma.reservation.findUnique.mockResolvedValue(baseExisting);

    await expect(
      service.updateReservation('res-1', { adults: 60 } as any, UID)
    ).rejects.toThrow('Reason is required for changes (minimum 10 characters)');
  });
});
