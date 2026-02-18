/**
 * QueueService — Branch coverage phase 3
 * Covers: line 39 — error.message?.includes('55P03') branch in withRetry
 * The 55P03 is a Postgres lock_timeout error code that can appear in the error message.
 */
const mockPrisma = {
  reservation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  client: { findUnique: jest.fn() },
  hall: { findUnique: jest.fn() },
  eventType: { findUnique: jest.fn() },
  $executeRaw: jest.fn(),
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn(),
}));

import { QueueService } from '../../../services/queue.service';

const service = new QueueService();

beforeEach(() => jest.clearAllMocks());

describe('QueueService — 55P03 lock error branch in withRetry', () => {
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

    // Error with 55P03 in message but NOT 'lock_not_available' and NOT PrismaClientKnownRequestError
    // This specifically targets the third OR branch: error.message?.includes('55P03')
    const lockError = new Error('database error code 55P03 could not obtain lock timeout');
    mockPrisma.$executeRaw.mockRejectedValue(lockError);

    // withRetry will retry 3 times (default maxRetries=3) then throw.
    // The outer catch in swapPositions re-throws because message doesn't contain just 'lock'
    // (it contains 'lock timeout' which DOES include 'lock') — so it maps to the friendly message.
    await expect(
      service.swapPositions('r1', 'r2', 'user-1')
    ).rejects.toThrow('Another user is modifying the queue');

    // $executeRaw should have been called 3 times (initial + 2 retries)
    expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(3);
  }, 10000); // generous timeout for retry delays (100ms + 200ms)
});
