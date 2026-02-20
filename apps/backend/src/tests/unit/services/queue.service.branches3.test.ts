/**
 * QueueService — Branch coverage phase 3
 * Covers: line 39 — error.message?.includes('55P03') branch in withRetry
 */
jest.mock('../../../lib/prisma', () => {
  const mockPrisma: any = {
    reservation: {
      findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(),
      create: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
      count: jest.fn(), aggregate: jest.fn(),
    },
    client: { findUnique: jest.fn() },
    hall: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $transaction: jest.fn((fn: any) => (typeof fn === 'function' ? fn(mockPrisma) : Promise.all(fn))),
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
  service = new QueueService();
});

describe('QueueService — 55P03 lock error branch in withRetry (line 39)', () => {
  it('swapPositions retries on error with 55P03 in message then throws', async () => {
    const queueDate = new Date('2026-06-15');
    const makeRes = (id: string, pos: number) => ({
      id,
      status: 'RESERVED',
      reservationQueueDate: queueDate,
      reservationQueuePosition: pos,
      client: { firstName: 'Jan', lastName: 'Kowalski' },
    });

    mockPrisma.reservation.findUnique
      .mockResolvedValueOnce(makeRes('r1', 1))
      .mockResolvedValueOnce(makeRes('r2', 2));

    // Error with 55P03 in message — targets the third OR branch in isLockError check
    // Message also contains 'lock' so outer catch maps to user-friendly message
    const lockError = new Error('database error code 55P03 lock timeout');
    mockPrisma.$executeRawUnsafe.mockRejectedValue(lockError);

    await expect(
      service.swapPositions('r1', 'r2', 'user-1')
    ).rejects.toThrow('Another user is modifying the queue');

    // Should have been called 3 times (initial + 2 retries)
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(3);
  }, 10000);
});
