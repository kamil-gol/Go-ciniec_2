/**
 * Queue Service — Branch coverage tests
 * Covers: withRetry (lock error retry then success, lock error exhaust retries),
 * updateQueueReservation (notes same = no change tracked, notes undefined = skipped)
 */

import { ReservationStatus, Prisma } from '@prisma/client';

const mockPrisma = {
  reservation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  client: { findUnique: jest.fn() },
  hall: { findUnique: jest.fn() },
  eventType: { findUnique: jest.fn() },
  $transaction: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
};

jest.mock('../../../lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('../../../utils/audit-logger', () => ({ logChange: jest.fn() }));

import QueueServiceInstance from '../../../services/queue.service';
import { logChange } from '../../../utils/audit-logger';

const service = QueueServiceInstance;

const baseReservation = {
  id: 'r1', status: ReservationStatus.RESERVED,
  reservationQueueDate: new Date('2026-06-15'),
  reservationQueuePosition: 1, guests: 10, notes: 'old note',
  clientId: 'c1', queueOrderManual: false,
  client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski', phone: '123', email: 'j@k.pl' },
  createdBy: { id: 'u1', firstName: 'Admin', lastName: 'A' },
  createdAt: new Date(),
};

describe('QueueService branches', () => {
  beforeEach(() => jest.clearAllMocks());

  // ===== updateQueueReservation — notes unchanged =====
  describe('updateQueueReservation — notes branch', () => {
    it('should NOT track notes change when notes same as existing', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.reservation.update.mockResolvedValue(baseReservation);

      await service.updateQueueReservation('r1', { notes: 'old note' }, 'u1');

      // notes === existing.notes → no change tracked, logChange NOT called (0 changes)
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should track notes change when notes differ', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.reservation.update.mockResolvedValue({ ...baseReservation, notes: 'new note' });

      await service.updateQueueReservation('r1', { notes: 'new note' }, 'u1');

      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        action: 'QUEUE_UPDATE',
        details: expect.objectContaining({
          changes: expect.objectContaining({
            notes: { old: 'old note', new: 'new note' },
          }),
        }),
      }));
    });

    it('should not touch notes when notes is undefined in input', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.reservation.update.mockResolvedValue(baseReservation);

      await service.updateQueueReservation('r1', {}, 'u1');

      // No changes at all → no audit
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should handle notes set to empty string (falsy → null)', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.reservation.update.mockResolvedValue({ ...baseReservation, notes: null });

      await service.updateQueueReservation('r1', { notes: '' }, 'u1');

      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({
          changes: expect.objectContaining({
            notes: { old: 'old note', new: null },
          }),
        }),
      }));
    });
  });

  // ===== swapPositions — lock error in withRetry =====
  describe('swapPositions — withRetry lock error branch', () => {
    const res1 = {
      ...baseReservation, id: 'r1', reservationQueuePosition: 1,
    };
    const res2 = {
      ...baseReservation, id: 'r2', reservationQueuePosition: 2,
      client: { id: 'c2', firstName: 'Anna', lastName: 'Nowak', phone: '456', email: 'a@n.pl' },
    };

    it('should retry on lock error then succeed', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(res1)
        .mockResolvedValueOnce(res2);

      let callCount = 0;
      mockPrisma.$executeRaw.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          const err: any = new Error('lock_not_available');
          throw err;
        }
        return 1;
      });

      await service.swapPositions('r1', 'r2', 'u1');
      expect(callCount).toBe(2);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'QUEUE_SWAP' }));
    });

    it('should throw after exhausting retries on lock error', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(res1)
        .mockResolvedValueOnce(res2);

      mockPrisma.$executeRaw.mockImplementation(async () => {
        throw new Error('lock_not_available');
      });

      await expect(service.swapPositions('r1', 'r2', 'u1')).rejects.toThrow('Another user is modifying the queue');
    });

    it('should throw on P2002 error in swapPositions', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(res1)
        .mockResolvedValueOnce(res2);

      mockPrisma.$executeRaw.mockImplementation(async () => {
        const err: any = new Error('Unique constraint');
        err.code = 'P2002';
        throw err;
      });

      await expect(service.swapPositions('r1', 'r2', 'u1')).rejects.toThrow('Position conflict');
    });
  });

  // ===== moveToPosition — withRetry lock error =====
  describe('moveToPosition — lock error branch', () => {
    it('should throw lock error message after retries', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...baseReservation, reservationQueuePosition: 1,
      });
      mockPrisma.reservation.count.mockResolvedValue(5);
      mockPrisma.$executeRaw.mockImplementation(async () => {
        throw new Error('lock_not_available');
      });

      await expect(service.moveToPosition('r1', 3, 'u1')).rejects.toThrow('Another user is modifying the queue');
    });

    it('should throw P2002 error in moveToPosition', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...baseReservation, reservationQueuePosition: 1,
      });
      mockPrisma.reservation.count.mockResolvedValue(5);

      let callCount = 0;
      mockPrisma.$executeRaw.mockImplementation(async () => {
        callCount++;
        if (callCount <= 3) {
          const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: '5.0.0' });
          throw err;
        }
      });

      await expect(service.moveToPosition('r1', 3, 'u1')).rejects.toThrow('already occupied');
    });
  });

  // ===== autoCancelExpired — cancelledCount = 0 =====
  describe('autoCancelExpired', () => {
    it('should NOT log when cancelledCount is 0', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ cancelled_count: 0, cancelled_ids: [] }]);
      const result = await service.autoCancelExpired('u1');
      expect(result.cancelledCount).toBe(0);
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should log with triggeredBy system when no userId', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ cancelled_count: 2, cancelled_ids: ['r1', 'r2'] }]);
      await service.autoCancelExpired();
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({ triggeredBy: 'system' }),
      }));
    });

    it('should handle null result from queryRaw', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(null);
      const result = await service.autoCancelExpired();
      expect(result.cancelledCount).toBe(0);
    });
  });
});
