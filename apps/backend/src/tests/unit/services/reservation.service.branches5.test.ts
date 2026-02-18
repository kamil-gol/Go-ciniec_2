/**
 * ReservationService — Branch coverage phase 5
 * Covers remaining uncovered lines:
 *   - getReservations with dateFrom/dateTo filters (lines ~592-595)
 *   - updateReservation with menuPackageId set/null (lines ~680-685)
 *   - updateReservation eventType customValidation path (line ~711)
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

// ─── getReservations with dateFrom/dateTo ───

describe('getReservations — dateFrom/dateTo filters', () => {
  it('should build OR filter with dateFrom only', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    await service.getReservations({ dateFrom: '2026-01-01' } as any);
    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR).toHaveLength(2);
    expect(call.where.OR[0].startDateTime.gte).toBeInstanceOf(Date);
  });

  it('should build OR filter with dateTo only', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    await service.getReservations({ dateTo: '2026-12-31' } as any);
    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR[0].startDateTime.lte).toBeInstanceOf(Date);
  });

  it('should build OR filter with both dateFrom and dateTo', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    await service.getReservations({ dateFrom: '2026-01-01', dateTo: '2026-12-31' } as any);
    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR[0].startDateTime.gte).toBeInstanceOf(Date);
    expect(call.where.OR[0].startDateTime.lte).toBeInstanceOf(Date);
    expect(call.where.OR[1].date.gte).toBe('2026-01-01');
    expect(call.where.OR[1].date.lte).toBe('2026-12-31');
  });

  it('should handle archived=true filter', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    await service.getReservations({ archived: true } as any);
    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.archivedAt).toEqual({ not: null });
  });

  it('should handle archived=false filter', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    await service.getReservations({ archived: false } as any);
    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.archivedAt).toBeNull();
  });
});

// ─── updateReservation with menuPackageId ───

describe('updateReservation — menuPackageId delegation', () => {
  const existingRes = {
    id: 'res-1', status: 'PENDING', hallId: 'h1',
    startDateTime: new Date(Date.now() + 86400000 * 30),
    endDateTime: new Date(Date.now() + 86400000 * 30 + 3600000 * 4),
    adults: 50, children: 10, toddlers: 5,
    pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
    totalPrice: 11000,
    hall: { id: 'h1', name: 'Sala A', capacity: 200, isWholeVenue: false },
    eventType: { id: 'e1', name: 'Wedding' },
    client: { id: 'c1', firstName: 'J', lastName: 'K' },
    menuSnapshot: null,
  };

  it('should delegate to updateReservationMenu when menuPackageId=null (remove menu)', async () => {
    // First findUnique for updateReservation
    mockPrisma.reservation.findUnique
      .mockResolvedValueOnce(existingRes)
      // Second findUnique inside updateReservationMenu
      .mockResolvedValueOnce({
        ...existingRes, menuSnapshot: { id: 'snap-1', menuData: { packageName: 'Old' }, totalMenuPrice: 5000 },
        client: { firstName: 'J', lastName: 'K' }, hall: { name: 'Sala A' },
      });
    mockPrisma.reservationMenuSnapshot.delete.mockResolvedValue({});
    mockPrisma.reservationHistory.create.mockResolvedValue({});
    mockPrisma.reservation.update.mockResolvedValue({
      ...existingRes,
      hall: existingRes.hall, client: existingRes.client, eventType: existingRes.eventType,
    });

    await service.updateReservation('res-1', { menuPackageId: null } as any, UID);
    expect(mockPrisma.reservationMenuSnapshot.delete).toHaveBeenCalled();
  });

  it('should delegate to updateReservationMenu when menuPackageId is set (change menu)', async () => {
    mockPrisma.reservation.findUnique
      .mockResolvedValueOnce(existingRes)
      .mockResolvedValueOnce({
        ...existingRes, menuSnapshot: null,
        client: { firstName: 'J', lastName: 'K' }, hall: { name: 'Sala A' },
      });
    mockPrisma.menuPackage.findUnique.mockResolvedValue({
      id: 'pkg-1', menuTemplateId: 'tmpl-1', name: 'Premium',
      description: 'D', pricePerAdult: 300, pricePerChild: 150, pricePerToddler: 0,
      minGuests: null, maxGuests: null,
      menuTemplate: { name: 'T', variant: 'STD' }, packageOptions: [],
    });
    mockPrisma.reservationMenuSnapshot.create.mockResolvedValue({});
    mockPrisma.reservationHistory.create.mockResolvedValue({});
    mockPrisma.reservation.update.mockResolvedValue({
      ...existingRes,
      hall: existingRes.hall, client: existingRes.client, eventType: existingRes.eventType,
    });

    await service.updateReservation('res-1', { menuPackageId: 'pkg-1' } as any, UID);
    expect(mockPrisma.menuPackage.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pkg-1' } })
    );
  });
});

// ─── updateReservation eventType validation ───

describe('updateReservation — eventType customValidation', () => {
  it('should validate custom event fields when eventType exists', async () => {
    const { validateCustomEventFields } = require('../../../utils/reservation.utils');

    const existingRes = {
      id: 'res-2', status: 'PENDING', hallId: 'h1',
      startDateTime: new Date(Date.now() + 86400000 * 30),
      endDateTime: new Date(Date.now() + 86400000 * 30 + 3600000 * 4),
      adults: 50, children: 10, toddlers: 5,
      pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
      totalPrice: 11000,
      hall: { id: 'h1', name: 'Sala A', capacity: 200, isWholeVenue: false },
      eventType: { id: 'e1', name: 'Birthday' },
      client: { id: 'c1', firstName: 'J', lastName: 'K' },
      menuSnapshot: null,
    };

    mockPrisma.reservation.findUnique.mockResolvedValue(existingRes);
    mockPrisma.reservation.update.mockResolvedValue({
      ...existingRes,
      hall: existingRes.hall, client: existingRes.client, eventType: existingRes.eventType,
    });

    await service.updateReservation('res-2', { notes: 'updated notes' } as any, UID);

    expect(validateCustomEventFields).toHaveBeenCalledWith('Birthday', expect.any(Object));
  });

  it('should throw when custom validation fails in updateReservation', async () => {
    const { validateCustomEventFields } = require('../../../utils/reservation.utils');
    validateCustomEventFields.mockReturnValueOnce({ valid: false, error: 'Birthday age is required' });

    const existingRes = {
      id: 'res-3', status: 'PENDING', hallId: 'h1',
      startDateTime: new Date(Date.now() + 86400000 * 30),
      endDateTime: new Date(Date.now() + 86400000 * 30 + 3600000 * 4),
      adults: 50, children: 10, toddlers: 5,
      pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
      totalPrice: 11000,
      hall: { id: 'h1', name: 'Sala A', capacity: 200, isWholeVenue: false },
      eventType: { id: 'e1', name: 'Birthday' },
      client: { id: 'c1', firstName: 'J', lastName: 'K' },
      menuSnapshot: null,
    };

    mockPrisma.reservation.findUnique.mockResolvedValue(existingRes);

    await expect(
      service.updateReservation('res-3', { notes: 'test' } as any, UID)
    ).rejects.toThrow('Birthday age is required');
  });
});
