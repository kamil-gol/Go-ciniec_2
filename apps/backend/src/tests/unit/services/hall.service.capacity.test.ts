/**
 * HallService.getOccupiedCapacity() — Unit Tests (#165)
 *
 * Tests the capacity query logic used by the GET /api/halls/:id/available-capacity endpoint.
 *
 * Scenarios:
 * 1. No overlapping reservations → occupiedCapacity=0, availableCapacity=totalCapacity
 * 2. Multiple overlapping → correct aggregate sum
 * 3. excludeReservationId → excluded from aggregate
 * 4. Hall not found → throws
 * 5. Company client → companyName used as clientName
 * 6. availableCapacity never goes below 0 (Math.max guard)
 * 7. Correct overlap query filters (status, archivedAt, time range)
 * 8. allowMultipleBookings flag is returned in response
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    hall: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    reservation: {
      findMany: jest.fn(),
    },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

import { HallService } from '../../../services/hall.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;

const MULTI_HALL = {
  id: 'hall-multi',
  name: 'Sala Wielorezerwacyjna',
  capacity: 300,
  isActive: true,
  isWholeVenue: false,
  allowMultipleBookings: true,
  allowWithWholeVenue: false,
};

const SINGLE_HALL = {
  ...MULTI_HALL,
  id: 'hall-single',
  name: 'Sala Jednorezerwacyjna',
  capacity: 100,
  allowMultipleBookings: false,
};

const START = '2027-08-15T14:00:00.000Z';
const END = '2027-08-15T22:00:00.000Z';

function makeOverlapping(overrides: Array<Partial<{ id: string; guests: number; startDateTime: Date; endDateTime: Date; client: any }>>) {
  return overrides.map((o, i) => ({
    id: o.id ?? `res-${i}`,
    guests: o.guests ?? 50,
    startDateTime: o.startDateTime ?? new Date(START),
    endDateTime: o.endDateTime ?? new Date(END),
    client: o.client ?? { firstName: 'Jan', lastName: 'Kowalski', companyName: null, clientType: 'INDIVIDUAL' },
  }));
}

let service: HallService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new HallService();
  mockPrisma.hall.findUnique.mockResolvedValue(MULTI_HALL);
  mockPrisma.reservation.findMany.mockResolvedValue([]);
});

describe('HallService.getOccupiedCapacity() — #165', () => {

  // ─── 1. No overlapping reservations ───
  it('should return full available capacity when no overlapping reservations', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);

    const result = await service.getOccupiedCapacity(MULTI_HALL.id, START, END);

    expect(result).toEqual({
      totalCapacity: 300,
      occupiedCapacity: 0,
      availableCapacity: 300,
      allowMultipleBookings: true,
      overlappingReservations: [],
    });
  });

  // ─── 2. Multiple overlapping → correct aggregate ───
  it('should sum guests from all overlapping reservations', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue(
      makeOverlapping([
        { guests: 80 },
        { guests: 50 },
        { guests: 30 },
      ])
    );

    const result = await service.getOccupiedCapacity(MULTI_HALL.id, START, END);

    expect(result.occupiedCapacity).toBe(160);
    expect(result.availableCapacity).toBe(140);
    expect(result.overlappingReservations).toHaveLength(3);
  });

  // ─── 3. excludeReservationId → passes to query ───
  it('should pass excludeReservationId to the where clause', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);

    await service.getOccupiedCapacity(MULTI_HALL.id, START, END, 'res-exclude');

    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.id).toEqual({ not: 'res-exclude' });
  });

  it('should not add id filter when excludeReservationId is omitted', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);

    await service.getOccupiedCapacity(MULTI_HALL.id, START, END);

    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.id).toBeUndefined();
  });

  // ─── 4. Hall not found → throws ───
  it('should throw when hall does not exist', async () => {
    mockPrisma.hall.findUnique.mockResolvedValue(null);

    await expect(
      service.getOccupiedCapacity('non-existent', START, END)
    ).rejects.toThrow('Nie znaleziono sali');
  });

  // ─── 5. Company client → companyName as clientName ───
  it('should use companyName for COMPANY clients', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue(
      makeOverlapping([
        {
          guests: 50,
          client: { firstName: 'Jan', lastName: 'Kowalski', companyName: 'ACME Sp. z o.o.', clientType: 'COMPANY' },
        },
      ])
    );

    const result = await service.getOccupiedCapacity(MULTI_HALL.id, START, END);

    expect(result.overlappingReservations[0].clientName).toBe('ACME Sp. z o.o.');
  });

  it('should use firstName lastName for INDIVIDUAL clients', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue(
      makeOverlapping([
        {
          guests: 30,
          client: { firstName: 'Anna', lastName: 'Nowak', companyName: null, clientType: 'INDIVIDUAL' },
        },
      ])
    );

    const result = await service.getOccupiedCapacity(MULTI_HALL.id, START, END);

    expect(result.overlappingReservations[0].clientName).toBe('Anna Nowak');
  });

  // ─── 6. availableCapacity ≥ 0 (Math.max guard) ───
  it('should clamp availableCapacity to 0 when over-booked (data inconsistency)', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue(
      makeOverlapping([
        { guests: 200 },
        { guests: 200 },
      ])
    );

    const result = await service.getOccupiedCapacity(MULTI_HALL.id, START, END);

    expect(result.occupiedCapacity).toBe(400);
    expect(result.availableCapacity).toBe(0); // Math.max(0, 300 - 400) = 0
  });

  // ─── 7. Correct query filters ───
  it('should query only PENDING and CONFIRMED, non-archived reservations', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);

    await service.getOccupiedCapacity(MULTI_HALL.id, START, END);

    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.status.in).toEqual(['PENDING', 'CONFIRMED']);
    expect(call.where.archivedAt).toBeNull();
  });

  it('should use correct time overlap AND conditions', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);

    await service.getOccupiedCapacity(MULTI_HALL.id, START, END);

    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.AND).toHaveLength(2);
    expect(call.where.AND[0]).toHaveProperty('startDateTime.lt');
    expect(call.where.AND[1]).toHaveProperty('endDateTime.gt');
  });

  // ─── 8. allowMultipleBookings flag in response ───
  it('should return allowMultipleBookings=true for multi-booking hall', async () => {
    const result = await service.getOccupiedCapacity(MULTI_HALL.id, START, END);
    expect(result.allowMultipleBookings).toBe(true);
  });

  it('should return allowMultipleBookings=false for single-booking hall', async () => {
    mockPrisma.hall.findUnique.mockResolvedValue(SINGLE_HALL);
    const result = await service.getOccupiedCapacity(SINGLE_HALL.id, START, END);
    expect(result.allowMultipleBookings).toBe(false);
  });

  // ─── 9. Handles null guests gracefully ───
  it('should treat null guests as 0', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([
      {
        id: 'res-null',
        guests: null,
        startDateTime: new Date(START),
        endDateTime: new Date(END),
        client: { firstName: 'X', lastName: 'Y', companyName: null, clientType: 'INDIVIDUAL' },
      },
    ]);

    const result = await service.getOccupiedCapacity(MULTI_HALL.id, START, END);

    expect(result.occupiedCapacity).toBe(0);
    expect(result.overlappingReservations[0].guests).toBe(0);
  });
});
