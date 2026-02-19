/**
 * QueueService — Branch Coverage (line 39: withRetry lock error + delay)
 * Also tests edge branches in queue operations
 */

// Must mock before imports
jest.mock('../../../lib/prisma', () => {
  const mockPrisma: any = {
    reservation: {
      findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(),
      create: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
      count: jest.fn(), aggregate: jest.fn(),
    },
    hall: { findUnique: jest.fn() },
    client: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    reservationHistory: { create: jest.fn().mockResolvedValue({}) },
    deposit: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
    $transaction: jest.fn((fn: any) => (typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn))),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };
  return { prisma: mockPrisma };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

import { QueueService } from '../../../services/queue.service';
import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma as any;

let service: QueueService;

beforeEach(() => {
  jest.resetAllMocks();
  // Restore default mocks
  mockPrisma.reservation.findMany.mockResolvedValue([]);
  mockPrisma.reservation.count.mockResolvedValue(0);
  mockPrisma.reservation.updateMany.mockResolvedValue({ count: 0 });
  mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: null } });
  service = new QueueService();
});

describe('QueueService — withRetry lock error branch (line 39)', () => {

  it('should retry on lock error in swapPositions and succeed on 2nd attempt', async () => {
    const res1 = {
      id: 'r1', status: 'RESERVED',
      reservationQueueDate: new Date('2026-06-15'),
      reservationQueuePosition: 1,
      client: { firstName: 'Jan', lastName: 'Kowalski' },
    };
    const res2 = {
      id: 'r2', status: 'RESERVED',
      reservationQueueDate: new Date('2026-06-15'),
      reservationQueuePosition: 2,
      client: { firstName: 'Anna', lastName: 'Nowak' },
    };

    mockPrisma.reservation.findUnique
      .mockResolvedValueOnce(res1)
      .mockResolvedValueOnce(res2);

    // First attempt: lock error -> retry, Second attempt: success
    const lockError = new Error('lock_not_available');
    mockPrisma.$executeRaw
      .mockRejectedValueOnce(lockError)
      .mockResolvedValueOnce(undefined);

    // Speed up setTimeout
    jest.useFakeTimers();
    const promise = service.swapPositions('r1', 'r2', 'u1');
    jest.advanceTimersByTime(200);
    jest.useRealTimers();

    await promise;

    expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(2);
  });

  it('should throw user-friendly message after max retries on persistent lock error', async () => {
    const res1 = {
      id: 'r1', status: 'RESERVED',
      reservationQueueDate: new Date('2026-06-15'),
      reservationQueuePosition: 1,
      client: { firstName: 'Jan', lastName: 'Kowalski' },
    };
    const res2 = {
      id: 'r2', status: 'RESERVED',
      reservationQueueDate: new Date('2026-06-15'),
      reservationQueuePosition: 2,
      client: { firstName: 'Anna', lastName: 'Nowak' },
    };

    mockPrisma.reservation.findUnique
      .mockResolvedValueOnce(res1)
      .mockResolvedValueOnce(res2);

    const lockError = new Error('lock_not_available');
    mockPrisma.$executeRaw.mockRejectedValue(lockError);

    await expect(service.swapPositions('r1', 'r2', 'u1'))
      .rejects.toThrow('Another user is modifying the queue. Please refresh and try again.');
  });
});

describe('QueueService — getAllQueues', () => {

  it('should return formatted queue items', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([
      {
        id: 'r1', reservationQueuePosition: 1, reservationQueueDate: new Date(),
        guests: 10, queueOrderManual: false, notes: null, createdAt: new Date(),
        client: { id: 'c1', firstName: 'Jan', lastName: 'K', phone: '123', email: 'j@k.pl' },
        createdBy: { id: 'u1', firstName: 'Admin', lastName: 'A' },
      },
    ]);

    const result = await service.getAllQueues();
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe(1);
  });
});

describe('QueueService — getQueueStats', () => {

  it('should return stats with manual count and oldest date', async () => {
    const date1 = new Date('2026-06-15');
    const date2 = new Date('2026-06-10');
    mockPrisma.reservation.findMany.mockResolvedValue([
      { reservationQueueDate: date1, guests: 10, queueOrderManual: true },
      { reservationQueueDate: date1, guests: 5, queueOrderManual: false },
      { reservationQueueDate: date2, guests: 8, queueOrderManual: true },
    ]);

    const result = await service.getQueueStats();
    expect(result.totalQueued).toBe(3);
    expect(result.manualOrderCount).toBe(2);
    expect(result.queuesByDate).toHaveLength(2);
  });

  it('should return empty stats when no reservations', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    const result = await service.getQueueStats();
    expect(result.totalQueued).toBe(0);
    expect(result.oldestQueueDate).toBeNull();
  });
});

describe('QueueService — autoCancelExpired', () => {

  it('should log audit when cancellations occur', async () => {
    // autoCancelExpired now uses findMany + updateMany (not $queryRaw)
    mockPrisma.reservation.findMany.mockResolvedValueOnce([
      { id: 'r1' }, { id: 'r2' }, { id: 'r3' },
    ]);
    mockPrisma.reservation.updateMany.mockResolvedValueOnce({ count: 3 });

    const result = await service.autoCancelExpired('u1');
    expect(result.cancelledCount).toBe(3);
    expect(result.cancelledIds).toEqual(['r1', 'r2', 'r3']);
    const { logChange } = require('../../../utils/audit-logger');
    expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'QUEUE_AUTO_CANCEL' }));
  });

  it('should NOT log audit when no cancellations', async () => {
    mockPrisma.reservation.findMany.mockResolvedValueOnce([]);

    const result = await service.autoCancelExpired();
    expect(result.cancelledCount).toBe(0);
    const { logChange } = require('../../../utils/audit-logger');
    expect(logChange).not.toHaveBeenCalled();
  });

  it('should handle empty findMany result', async () => {
    mockPrisma.reservation.findMany.mockResolvedValueOnce([]);

    const result = await service.autoCancelExpired();
    expect(result.cancelledCount).toBe(0);
  });
});

describe('QueueService — rebuildPositions', () => {

  it('should return zero counts when no reservations', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    const result = await service.rebuildPositions('u1');
    expect(result).toEqual({ updatedCount: 0, dateCount: 0 });
  });

  it('should skip reservations without queueDate in rebuild', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([
      { id: 'r1', reservationQueueDate: null, createdAt: new Date() },
    ]);
    mockPrisma.reservation.update.mockResolvedValue({});

    const result = await service.rebuildPositions('u1');
    expect(result.updatedCount).toBe(0);
    expect(result.dateCount).toBe(0);
  });
});
