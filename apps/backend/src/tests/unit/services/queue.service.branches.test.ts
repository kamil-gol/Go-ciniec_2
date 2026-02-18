/**
 * QueueService — Branch Coverage
 * addToQueue: missing fields, guests<1, invalid date, past date, adults/children/toddlers/notes fallbacks, P2002
 * swapPositions: same id, missing ids, null client names
 * moveToPosition: invalid position, same position (return), exceeds queue, null client
 * rebuildPositions: empty, null reservationQueueDate
 * autoCancelExpired: nothing cancelled, with userId, without userId, null result
 * getQueueStats: empty, manual order, oldest date
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    client: { findUnique: jest.fn() },
    reservation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    hall: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

import { QueueService } from '../../../services/queue.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const svc = new QueueService();

const makeReservation = (o: any = {}) => ({
  id: 'r-1', status: 'RESERVED',
  reservationQueueDate: new Date('2026-06-15'),
  reservationQueuePosition: 1,
  guests: 50, adults: 40, children: 8, toddlers: 2,
  queueOrderManual: false, notes: null,
  clientId: 'c-1',
  client: { id: 'c-1', firstName: 'Jan', lastName: 'K', phone: '123', email: 'j@e.com' },
  createdBy: { id: 'u-1', firstName: 'Admin', lastName: 'A' },
  createdAt: new Date(),
  ...o,
});

beforeEach(() => jest.resetAllMocks());

describe('QueueService — branches', () => {

  // ═══ addToQueue ═══
  describe('addToQueue()', () => {
    it('should throw when missing required fields', async () => {
      await expect(svc.addToQueue({} as any, 'u-1')).rejects.toThrow('required');
    });

    it('should throw when guests < 1', async () => {
      await expect(svc.addToQueue({ clientId: 'c-1', reservationQueueDate: '2026-06-15', guests: -1 } as any, 'u-1'))
        .rejects.toThrow('at least 1');
    });

    it('should throw on invalid date', async () => {
      await expect(svc.addToQueue({ clientId: 'c-1', reservationQueueDate: 'invalid', guests: 10 } as any, 'u-1'))
        .rejects.toThrow('Invalid');
    });

    it('should throw on past date', async () => {
      await expect(svc.addToQueue({ clientId: 'c-1', reservationQueueDate: '2020-01-01', guests: 10 } as any, 'u-1'))
        .rejects.toThrow('past');
    });

    it('should throw when client not found', async () => {
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.addToQueue({ clientId: 'bad', reservationQueueDate: '2026-06-15', guests: 10 } as any, 'u-1'))
        .rejects.toThrow('not found');
    });

    it('should default adults to guests when not provided', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c-1', firstName: 'J', lastName: 'K' });
      db.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 0 } });
      db.reservation.create.mockResolvedValue(makeReservation());
      await svc.addToQueue({ clientId: 'c-1', reservationQueueDate: '2026-06-15', guests: 10 } as any, 'u-1');
      expect(db.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ adults: 10, children: 0, toddlers: 0, notes: null }),
        })
      );
    });

    it('should use provided adults/children/toddlers/notes', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c-1', firstName: 'J', lastName: 'K' });
      db.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 2 } });
      db.reservation.create.mockResolvedValue(makeReservation());
      await svc.addToQueue({
        clientId: 'c-1', reservationQueueDate: '2026-06-15', guests: 20,
        adults: 15, children: 3, toddlers: 2, notes: 'VIP'
      } as any, 'u-1');
      expect(db.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ adults: 15, children: 3, toddlers: 2, notes: 'VIP' }),
        })
      );
    });

    it('should handle P2002 unique constraint error', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c-1', firstName: 'J', lastName: 'K' });
      db.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 0 } });
      // Create a mock error that mimics PrismaClientKnownRequestError
      const { Prisma } = jest.requireActual('@prisma/client');
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: '5.0.0' });
      db.reservation.create.mockRejectedValue(p2002);
      await expect(svc.addToQueue({ clientId: 'c-1', reservationQueueDate: '2026-06-15', guests: 10 } as any, 'u-1'))
        .rejects.toThrow('already taken');
    });

    it('should rethrow non-P2002 errors', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c-1', firstName: 'J', lastName: 'K' });
      db.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 0 } });
      db.reservation.create.mockRejectedValue(new Error('DB'));
      await expect(svc.addToQueue({ clientId: 'c-1', reservationQueueDate: '2026-06-15', guests: 10 } as any, 'u-1'))
        .rejects.toThrow('DB');
    });

    it('should handle null maxPosition', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c-1', firstName: 'J', lastName: 'K' });
      db.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: null } });
      db.reservation.create.mockResolvedValue(makeReservation({ reservationQueuePosition: 1 }));
      await svc.addToQueue({ clientId: 'c-1', reservationQueueDate: '2026-06-15', guests: 10 } as any, 'u-1');
      expect(db.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reservationQueuePosition: 1 }),
        })
      );
    });
  });

  // ═══ getQueueStats ═══
  describe('getQueueStats()', () => {
    it('should handle empty reservations', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      const result = await svc.getQueueStats();
      expect(result.totalQueued).toBe(0);
      expect(result.oldestQueueDate).toBeNull();
      expect(result.manualOrderCount).toBe(0);
    });

    it('should count manual orders', async () => {
      db.reservation.findMany.mockResolvedValue([
        makeReservation({ queueOrderManual: true }),
        makeReservation({ id: 'r-2', queueOrderManual: false }),
      ]);
      const result = await svc.getQueueStats();
      expect(result.manualOrderCount).toBe(1);
    });

    it('should find oldest date', async () => {
      const old = new Date('2026-03-01');
      const newer = new Date('2026-06-01');
      db.reservation.findMany.mockResolvedValue([
        makeReservation({ reservationQueueDate: newer }),
        makeReservation({ id: 'r-2', reservationQueueDate: old }),
      ]);
      const result = await svc.getQueueStats();
      expect(result.oldestQueueDate).toEqual(old);
    });
  });

  // ═══ autoCancelExpired ═══
  describe('autoCancelExpired()', () => {
    it('should handle nothing cancelled', async () => {
      db.$queryRaw.mockResolvedValue([{ cancelled_count: 0, cancelled_ids: [] }]);
      const result = await svc.autoCancelExpired('u-1');
      expect(result.cancelledCount).toBe(0);
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should log when cancellations occur with userId', async () => {
      db.$queryRaw.mockResolvedValue([{ cancelled_count: 2, cancelled_ids: ['r-1', 'r-2'] }]);
      const result = await svc.autoCancelExpired('u-1');
      expect(result.cancelledCount).toBe(2);
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ triggeredBy: 'manual' }),
        })
      );
    });

    it('should log system trigger when no userId', async () => {
      db.$queryRaw.mockResolvedValue([{ cancelled_count: 1, cancelled_ids: ['r-1'] }]);
      await svc.autoCancelExpired();
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ triggeredBy: 'system' }),
        })
      );
    });

    it('should handle null result from queryRaw', async () => {
      db.$queryRaw.mockResolvedValue([{}]);
      const result = await svc.autoCancelExpired();
      expect(result.cancelledCount).toBe(0);
      expect(result.cancelledIds).toEqual([]);
    });
  });

  // ═══ rebuildPositions ═══
  describe('rebuildPositions()', () => {
    it('should return zeros when no reservations', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      const result = await svc.rebuildPositions('u-1');
      expect(result).toEqual({ updatedCount: 0, dateCount: 0 });
    });

    it('should skip reservations with null queueDate', async () => {
      db.reservation.findMany.mockResolvedValue([
        { id: 'r-1', reservationQueueDate: null, createdAt: new Date() },
      ]);
      db.reservation.update.mockResolvedValue({});
      const result = await svc.rebuildPositions('u-1');
      expect(result.updatedCount).toBe(0);
    });

    it('should rebuild positions by date', async () => {
      const date = new Date('2026-06-15');
      db.reservation.findMany.mockResolvedValue([
        { id: 'r-1', reservationQueueDate: date, createdAt: new Date('2026-01-01') },
        { id: 'r-2', reservationQueueDate: date, createdAt: new Date('2026-01-02') },
      ]);
      db.reservation.update.mockResolvedValue({});
      const result = await svc.rebuildPositions('u-1');
      expect(result.updatedCount).toBe(2);
      expect(result.dateCount).toBe(1);
    });
  });

  // ═══ swapPositions ═══
  describe('swapPositions()', () => {
    it('should throw when same id', async () => {
      await expect(svc.swapPositions('r-1', 'r-1', 'u-1')).rejects.toThrow('itself');
    });

    it('should throw when missing ids', async () => {
      await expect(svc.swapPositions('', 'r-2', 'u-1')).rejects.toThrow('required');
    });

    it('should handle null client in swap (N/A)', async () => {
      const res1 = makeReservation({ client: null, reservationQueueDate: new Date('2026-06-15') });
      const res2 = makeReservation({ id: 'r-2', client: null, reservationQueueDate: new Date('2026-06-15'), reservationQueuePosition: 2 });
      db.reservation.findUnique.mockResolvedValueOnce(res1).mockResolvedValueOnce(res2);
      db.$executeRaw.mockResolvedValue(undefined);
      await svc.swapPositions('r-1', 'r-2', 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            reservation1: expect.objectContaining({ clientName: 'N/A' }),
          }),
        })
      );
    });
  });

  // ═══ moveToPosition ═══
  describe('moveToPosition()', () => {
    it('should throw on invalid position', async () => {
      await expect(svc.moveToPosition('r-1', 0, 'u-1')).rejects.toThrow('positive integer');
    });

    it('should throw on non-integer position', async () => {
      await expect(svc.moveToPosition('r-1', 1.5, 'u-1')).rejects.toThrow('positive integer');
    });

    it('should return early when same position', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation({ reservationQueuePosition: 3 }));
      db.reservation.count.mockResolvedValue(5);
      await svc.moveToPosition('r-1', 3, 'u-1');
      expect(db.$executeRaw).not.toHaveBeenCalled();
    });

    it('should throw when position exceeds queue size', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation({ reservationQueuePosition: 1 }));
      db.reservation.count.mockResolvedValue(2);
      await expect(svc.moveToPosition('r-1', 5, 'u-1')).rejects.toThrow('invalid');
    });

    it('should handle null client in moveToPosition', async () => {
      db.reservation.findUnique.mockResolvedValue(makeReservation({ reservationQueuePosition: 1 }));
      db.reservation.count.mockResolvedValue(3);
      db.$executeRaw.mockResolvedValue(undefined);
      db.client.findUnique.mockResolvedValue(null);
      await svc.moveToPosition('r-1', 2, 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ clientName: 'N/A' }),
        })
      );
    });
  });
});
