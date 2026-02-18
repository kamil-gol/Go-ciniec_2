/**
 * ReservationService — Branch Coverage
 * Targets: archiveReservation, unarchiveReservation, updateStatus COMPLETED date checks
 * Minimal mocking to avoid interfering with existing test coverage.
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

import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma as any;

let service: any;

beforeAll(() => {
  service = require('../../../services/reservation.service').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@test.pl' });
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
      .rejects.toThrow('already archived');
  });

  it('should throw when reservation not found for archive', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null);

    await expect(service.archiveReservation('bad-id', 'u1'))
      .rejects.toThrow('Reservation not found');
  });

  it('should unarchive a reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', archivedAt: new Date('2026-01-01'),
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
      .rejects.toThrow('not archived');
  });

  it('should throw when reservation not found for unarchive', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null);

    await expect(service.unarchiveReservation('bad-id', 'u1'))
      .rejects.toThrow('Reservation not found');
  });

  it('should archive without reason (default message)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', archivedAt: null,
      client: { firstName: 'Jan', lastName: 'K' },
      hall: null,
    });
    mockPrisma.reservation.update.mockResolvedValue({});

    await service.archiveReservation('r1', 'u1');

    expect(mockPrisma.reservationHistory.create).toHaveBeenCalled();
  });
});

describe('ReservationService — updateStatus COMPLETED date checks', () => {

  it('should block completing reservation before event date (startDateTime)', async () => {
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

  it('should block completing reservation before event date (legacy date field)', async () => {
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

  it('should allow completing reservation after event date', async () => {
    const pastDate = new Date(Date.now() - 86400000 * 5);
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', status: 'CONFIRMED',
      startDateTime: pastDate,
      client: { firstName: 'Jan', lastName: 'K' },
      hall: { name: 'Sala A' },
    });
    mockPrisma.reservation.update.mockResolvedValue({
      id: 'r1', status: 'COMPLETED',
      hall: { id: 'h1', name: 'Sala A' },
      client: { id: 'c1', firstName: 'Jan', lastName: 'K' },
      eventType: { id: 'e1', name: 'Wesele' },
      createdBy: { id: 'u1', email: 'test@test.pl' },
    });

    const result = await service.updateStatus('r1', { status: 'COMPLETED' }, 'u1');
    expect(result.status).toBe('COMPLETED');
  });

  it('should allow completing when no event date at all', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', status: 'CONFIRMED',
      startDateTime: null,
      date: null,
      client: { firstName: 'Jan', lastName: 'K' },
      hall: { name: 'Sala A' },
    });
    mockPrisma.reservation.update.mockResolvedValue({
      id: 'r1', status: 'COMPLETED',
      hall: { id: 'h1', name: 'Sala A' },
      client: { id: 'c1', firstName: 'Jan', lastName: 'K' },
      eventType: { id: 'e1', name: 'Wesele' },
      createdBy: { id: 'u1', email: 'test@test.pl' },
    });

    const result = await service.updateStatus('r1', { status: 'COMPLETED' }, 'u1');
    expect(result.status).toBe('COMPLETED');
  });

  it('should reject invalid status transitions', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'r1', status: 'COMPLETED',
      client: { firstName: 'Jan', lastName: 'K' },
      hall: { name: 'Sala A' },
    });

    await expect(service.updateStatus('r1', { status: 'PENDING' }, 'u1'))
      .rejects.toThrow('Cannot change status');
  });
});
