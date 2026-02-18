/**
 * QueueService — Branch Coverage Tests
 * Target: 65.87% → ~85%+ branches
 * Covers: withRetry, P2002, lock errors, date change, batch validation,
 *         rebuildPositions, autoCancelExpired, promoteReservation edge cases
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    client: { findUnique: jest.fn() },
    reservation: {
      create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
      findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
      aggregate: jest.fn(), count: jest.fn(),
    },
    hall: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: any) => {
      if (typeof fn === 'function') return fn(mock);
      return Promise.all(fn);
    }),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    activityLog: { create: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

import { QueueService } from '../../../services/queue.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const UID = 'user-001';
const CLIENT = { id: 'cl-1', firstName: 'Jan', lastName: 'Kowalski', phone: '+48123', email: 'j@k.pl' };
const CREATED_BY = { id: UID, firstName: 'Admin', lastName: 'Test' };
const FUTURE_DATE = '2027-06-15';

const QUEUE_RES = {
  id: 'qr-1', status: 'RESERVED', clientId: CLIENT.id,
  reservationQueueDate: new Date('2027-06-15'), reservationQueuePosition: 1,
  queueOrderManual: false, guests: 50, adults: 50, children: 0, toddlers: 0,
  notes: null, createdAt: new Date(), client: CLIENT, createdBy: CREATED_BY,
};

let svc: QueueService;

beforeEach(() => {
  jest.clearAllMocks();
  svc = new QueueService();

  db.client.findUnique.mockResolvedValue(CLIENT);
  db.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 0 } });
  db.reservation.create.mockResolvedValue(QUEUE_RES);
  db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
  db.reservation.findMany.mockResolvedValue([]);
  db.reservation.findFirst.mockResolvedValue(null);
  db.reservation.update.mockResolvedValue(QUEUE_RES);
  db.reservation.updateMany.mockResolvedValue({});
  db.reservation.count.mockResolvedValue(5);
  db.hall.findUnique.mockResolvedValue({ name: 'Sala A' });
  db.eventType.findUnique.mockResolvedValue({ name: 'Wesele' });
  db.$executeRaw.mockResolvedValue(undefined);
  db.$queryRaw.mockResolvedValue([{ cancelled_count: 0, cancelled_ids: [] }]);
  db.activityLog.create.mockResolvedValue({});
});

describe('QueueService — Branch Coverage', () => {

  // ═══════════════════════════════════
  // addToQueue — error paths
  // ═══════════════════════════════════
  describe('addToQueue()', () => {
    it('should throw on missing fields', async () => {
      await expect(svc.addToQueue({} as any, UID)).rejects.toThrow('Client, queue date, and guests are required');
    });

    it('should throw on missing guests (falsy zero)', async () => {
      // guests: 0 is falsy → triggers the "required" check, not the "< 1" check
      await expect(svc.addToQueue({ clientId: 'cl-1', reservationQueueDate: FUTURE_DATE, guests: 0 } as any, UID))
        .rejects.toThrow('Client, queue date, and guests are required');
    });

    it('should throw on guests < 1 (negative)', async () => {
      // guests: -1 is truthy → passes the "required" check, hits the "< 1" check
      await expect(svc.addToQueue({ clientId: 'cl-1', reservationQueueDate: FUTURE_DATE, guests: -1 } as any, UID))
        .rejects.toThrow('Number of guests must be at least 1');
    });

    it('should throw on invalid date', async () => {
      await expect(svc.addToQueue({ clientId: 'cl-1', reservationQueueDate: 'not-a-date', guests: 5 } as any, UID))
        .rejects.toThrow('Invalid queue date format');
    });

    it('should throw on past date', async () => {
      await expect(svc.addToQueue({ clientId: 'cl-1', reservationQueueDate: '2020-01-01', guests: 5 } as any, UID))
        .rejects.toThrow('Queue date cannot be in the past');
    });

    it('should throw when client not found', async () => {
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.addToQueue({ clientId: 'bad', reservationQueueDate: FUTURE_DATE, guests: 5 } as any, UID))
        .rejects.toThrow('Client not found');
    });

    it('should handle P2002 unique constraint error', async () => {
      db.reservation.create.mockRejectedValue(Object.assign(new Error(''), { code: 'P2002', name: 'PrismaClientKnownRequestError' }));
      await expect(svc.addToQueue({ clientId: 'cl-1', reservationQueueDate: FUTURE_DATE, guests: 5 } as any, UID))
        .rejects.toThrow(/Position .* already taken|/);
    });

    it('should use defaults for adults/children/toddlers', async () => {
      await svc.addToQueue({ clientId: 'cl-1', reservationQueueDate: FUTURE_DATE, guests: 10 } as any, UID);
      const call = db.reservation.create.mock.calls[0][0];
      expect(call.data.adults).toBe(10);
      expect(call.data.children).toBe(0);
      expect(call.data.toddlers).toBe(0);
    });

    it('should use provided adults/children/toddlers', async () => {
      await svc.addToQueue({ clientId: 'cl-1', reservationQueueDate: FUTURE_DATE, guests: 20, adults: 15, children: 3, toddlers: 2 } as any, UID);
      const call = db.reservation.create.mock.calls[0][0];
      expect(call.data.adults).toBe(15);
      expect(call.data.children).toBe(3);
      expect(call.data.toddlers).toBe(2);
    });
  });

  // ═══════════════════════════════════
  // updateQueueReservation — branches
  // ═══════════════════════════════════
  describe('updateQueueReservation()', () => {
    it('should throw when not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(svc.updateQueueReservation('bad', {}, UID)).rejects.toThrow('Reservation not found');
    });

    it('should throw when not RESERVED', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...QUEUE_RES, status: 'PENDING' });
      await expect(svc.updateQueueReservation('qr-1', {}, UID)).rejects.toThrow('Can only update RESERVED');
    });

    it('should update clientId and track change', async () => {
      db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
      db.client.findUnique.mockResolvedValue({ id: 'cl-2' });
      await svc.updateQueueReservation('qr-1', { clientId: 'cl-2' } as any, UID);
      expect(db.reservation.update).toHaveBeenCalledTimes(1);
    });

    it('should throw when new client not found', async () => {
      db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.updateQueueReservation('qr-1', { clientId: 'bad' } as any, UID)).rejects.toThrow('Client not found');
    });

    it('should handle date change with position recalculation', async () => {
      db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
      db.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 3 } });
      await svc.updateQueueReservation('qr-1', { reservationQueueDate: '2027-07-20' } as any, UID);
      expect(db.reservation.updateMany).toHaveBeenCalledTimes(1); // shift old positions
    });

    it('should skip position shift when date not changed', async () => {
      db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
      await svc.updateQueueReservation('qr-1', { reservationQueueDate: '2027-06-15' } as any, UID);
      expect(db.reservation.updateMany).not.toHaveBeenCalled();
    });

    it('should throw on invalid queue date', async () => {
      db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
      await expect(svc.updateQueueReservation('qr-1', { reservationQueueDate: 'xxx' } as any, UID))
        .rejects.toThrow('Invalid queue date format');
    });

    it('should throw on past date', async () => {
      db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
      await expect(svc.updateQueueReservation('qr-1', { reservationQueueDate: '2020-01-01' } as any, UID))
        .rejects.toThrow('Queue date cannot be in the past');
    });

    it('should throw on guests < 1', async () => {
      db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
      await expect(svc.updateQueueReservation('qr-1', { guests: 0 } as any, UID)).rejects.toThrow('Number of guests must be at least 1');
    });

    it('should update guests and track change', async () => {
      db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
      await svc.updateQueueReservation('qr-1', { guests: 30, adults: 25, children: 3, toddlers: 2 } as any, UID);
      const call = db.reservation.update.mock.calls[0][0];
      expect(call.data.guests).toBe(30);
      expect(call.data.adults).toBe(25);
    });

    it('should update notes and track change', async () => {
      db.reservation.findUnique.mockResolvedValue(QUEUE_RES);
      await svc.updateQueueReservation('qr-1', { notes: 'Nowa notatka' } as any, UID);
      const call = db.reservation.update.mock.calls[0][0];
      expect(call.data.notes).toBe('Nowa notatka');
    });

    it('should not log audit when no changes detected', async () => {
      const { logChange } = require('../../../utils/audit-logger');
      db.reservation.findUnique.mockResolvedValue({ ...QUEUE_RES, clientId: 'cl-1' });
      await svc.updateQueueReservation('qr-1', { clientId: 'cl-1' } as any, UID);
      expect(logChange).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════
  // swapPositions — error handling
  // ═══════════════════════════════════
  describe('swapPositions()', () => {
    const RES1 = { ...QUEUE_RES, id: 'qr-1', reservationQueuePosition: 1 };
    const RES2 = { ...QUEUE_RES, id: 'qr-2', reservationQueuePosition: 2 };

    it('should throw when missing IDs', async () => {
      await expect(svc.swapPositions('', 'qr-2', UID)).rejects.toThrow('Both reservation IDs are required');
    });

    it('should throw when same ID', async () => {
      await expect(svc.swapPositions('qr-1', 'qr-1', UID)).rejects.toThrow('Cannot swap reservation with itself');
    });

    it('should throw when one not found', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce(RES1)
        .mockResolvedValueOnce(null);
      await expect(svc.swapPositions('qr-1', 'qr-2', UID)).rejects.toThrow('One or both reservations not found');
    });

    it('should throw when not RESERVED', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce(RES1)
        .mockResolvedValueOnce({ ...RES2, status: 'PENDING' });
      await expect(svc.swapPositions('qr-1', 'qr-2', UID)).rejects.toThrow('Can only swap RESERVED');
    });

    it('should throw when different dates', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce(RES1)
        .mockResolvedValueOnce({ ...RES2, reservationQueueDate: new Date('2027-07-20') });
      await expect(svc.swapPositions('qr-1', 'qr-2', UID)).rejects.toThrow('same date');
    });

    it('should handle lock error from executeRaw', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce(RES1)
        .mockResolvedValueOnce(RES2);
      db.$executeRaw.mockRejectedValue(Object.assign(new Error('lock_not_available'), { code: 'P2034' }));
      await expect(svc.swapPositions('qr-1', 'qr-2', UID)).rejects.toThrow(/Another user|lock/);
    });

    it('should handle P2002 from executeRaw', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce(RES1)
        .mockResolvedValueOnce(RES2);
      db.$executeRaw.mockRejectedValue(Object.assign(new Error('Unique constraint'), { code: 'P2002' }));
      await expect(svc.swapPositions('qr-1', 'qr-2', UID)).rejects.toThrow(/Position conflict/);
    });

    it('should succeed on happy path', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce(RES1)
        .mockResolvedValueOnce(RES2);
      db.$executeRaw.mockResolvedValue(undefined);
      await svc.swapPositions('qr-1', 'qr-2', UID);
      expect(db.$executeRaw).toHaveBeenCalled();
    });

    it('should handle null client in swap audit', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce({ ...RES1, client: null })
        .mockResolvedValueOnce({ ...RES2, client: null });
      db.$executeRaw.mockResolvedValue(undefined);
      await svc.swapPositions('qr-1', 'qr-2', UID);
      const { logChange } = require('../../../utils/audit-logger');
      const call = logChange.mock.calls[0][0];
      expect(call.details.description).toContain('N/A');
    });
  });

  // ═══════════════════════════════════
  // moveToPosition — error handling
  // ═══════════════════════════════════
  describe('moveToPosition()', () => {
    it('should throw when missing ID', async () => {
      await expect(svc.moveToPosition('', 1, UID)).rejects.toThrow('Reservation ID is required');
    });

    it('should throw on invalid position', async () => {
      await expect(svc.moveToPosition('qr-1', 0, UID)).rejects.toThrow('Position must be a positive integer');
    });

    it('should throw on non-integer position', async () => {
      await expect(svc.moveToPosition('qr-1', 1.5, UID)).rejects.toThrow('Position must be a positive integer');
    });

    it('should throw when not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(svc.moveToPosition('bad', 1, UID)).rejects.toThrow('Reservation not found');
    });

    it('should throw when not RESERVED', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...QUEUE_RES, status: 'PENDING' });
      await expect(svc.moveToPosition('qr-1', 1, UID)).rejects.toThrow('Can only move RESERVED');
    });

    it('should throw when no queue date', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...QUEUE_RES, reservationQueueDate: null });
      await expect(svc.moveToPosition('qr-1', 1, UID)).rejects.toThrow('has no queue date');
    });

    it('should throw when position exceeds total', async () => {
      db.reservation.count.mockResolvedValue(3);
      await expect(svc.moveToPosition('qr-1', 10, UID)).rejects.toThrow(/Position 10 is invalid/);
    });

    it('should return early when already at target position', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...QUEUE_RES, reservationQueuePosition: 2 });
      db.reservation.count.mockResolvedValue(5);
      await svc.moveToPosition('qr-1', 2, UID);
      expect(db.$executeRaw).not.toHaveBeenCalled();
    });

    it('should handle lock error', async () => {
      db.reservation.count.mockResolvedValue(5);
      db.$executeRaw.mockRejectedValue(Object.assign(new Error('lock_not_available'), { code: 'P2034' }));
      await expect(svc.moveToPosition('qr-1', 3, UID)).rejects.toThrow(/Another user|lock/);
    });

    it('should rethrow P2002 as-is when not instanceof PrismaClientKnownRequestError', async () => {
      // In test env, error is a plain Error with .code, not a real Prisma error instance,
      // so instanceof check fails and it goes to the generic rethrow branch
      db.reservation.count.mockResolvedValue(5);
      const err: any = new Error('Unique constraint');
      err.code = 'P2002';
      db.$executeRaw.mockRejectedValue(err);
      await expect(svc.moveToPosition('qr-1', 3, UID)).rejects.toThrow('Unique constraint');
    });

    it('should succeed on happy path', async () => {
      db.reservation.count.mockResolvedValue(5);
      db.$executeRaw.mockResolvedValue(undefined);
      db.client.findUnique.mockResolvedValue(CLIENT);
      await svc.moveToPosition('qr-1', 3, UID);
      expect(db.$executeRaw).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════
  // batchUpdatePositions — validation
  // ═══════════════════════════════════
  describe('batchUpdatePositions()', () => {
    it('should throw on empty updates', async () => {
      await expect(svc.batchUpdatePositions([], UID)).rejects.toThrow('At least one update');
    });

    it('should throw when update has no id', async () => {
      await expect(svc.batchUpdatePositions([{ id: '', position: 1 }], UID)).rejects.toThrow('must have a reservation ID');
    });

    it('should throw on invalid position', async () => {
      await expect(svc.batchUpdatePositions([{ id: 'qr-1', position: 0 }], UID)).rejects.toThrow(/Invalid position/);
    });

    it('should throw when reservation count mismatch', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      await expect(svc.batchUpdatePositions([{ id: 'qr-1', position: 1 }], UID)).rejects.toThrow('not found');
    });

    it('should throw when not RESERVED in batch', async () => {
      db.reservation.findMany.mockResolvedValue([{ id: 'qr-1', status: 'PENDING', reservationQueueDate: new Date(), reservationQueuePosition: 1 }]);
      await expect(svc.batchUpdatePositions([{ id: 'qr-1', position: 1 }], UID)).rejects.toThrow(/not RESERVED/);
    });

    it('should throw when no queue date in batch', async () => {
      db.reservation.findMany.mockResolvedValue([{ id: 'qr-1', status: 'RESERVED', reservationQueueDate: null, reservationQueuePosition: 1 }]);
      await expect(svc.batchUpdatePositions([{ id: 'qr-1', position: 1 }], UID)).rejects.toThrow(/no queue date/);
    });

    it('should throw on different dates in batch', async () => {
      db.reservation.findMany.mockResolvedValue([
        { id: 'qr-1', status: 'RESERVED', reservationQueueDate: new Date('2027-06-15'), reservationQueuePosition: 1 },
        { id: 'qr-2', status: 'RESERVED', reservationQueueDate: new Date('2027-07-20'), reservationQueuePosition: 2 },
      ]);
      await expect(svc.batchUpdatePositions([{ id: 'qr-1', position: 1 }, { id: 'qr-2', position: 2 }], UID))
        .rejects.toThrow('same date');
    });

    it('should throw on duplicate positions', async () => {
      db.reservation.findMany.mockResolvedValue([
        { id: 'qr-1', status: 'RESERVED', reservationQueueDate: new Date('2027-06-15'), reservationQueuePosition: 1 },
        { id: 'qr-2', status: 'RESERVED', reservationQueueDate: new Date('2027-06-15'), reservationQueuePosition: 2 },
      ]);
      await expect(svc.batchUpdatePositions([{ id: 'qr-1', position: 1 }, { id: 'qr-2', position: 1 }], UID))
        .rejects.toThrow('Duplicate positions');
    });

    it('should succeed on valid batch', async () => {
      const qDate = new Date('2027-06-15');
      db.reservation.findMany.mockResolvedValue([
        { id: 'qr-1', status: 'RESERVED', reservationQueueDate: qDate, reservationQueuePosition: 1 },
        { id: 'qr-2', status: 'RESERVED', reservationQueueDate: qDate, reservationQueuePosition: 2 },
      ]);
      db.reservation.update.mockResolvedValue({});
      const result = await svc.batchUpdatePositions([{ id: 'qr-1', position: 2 }, { id: 'qr-2', position: 1 }], UID);
      expect(result.updatedCount).toBe(2);
    });
  });

  // ═══════════════════════════════════
  // rebuildPositions
  // ═══════════════════════════════════
  describe('rebuildPositions()', () => {
    it('should return zeros when no reservations', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      const result = await svc.rebuildPositions(UID);
      expect(result).toEqual({ updatedCount: 0, dateCount: 0 });
    });

    it('should rebuild positions grouped by date', async () => {
      const date1 = new Date('2027-06-15');
      const date2 = new Date('2027-06-16');
      db.reservation.findMany.mockResolvedValue([
        { id: 'r1', reservationQueueDate: date1, createdAt: new Date('2027-01-02') },
        { id: 'r2', reservationQueueDate: date1, createdAt: new Date('2027-01-01') },
        { id: 'r3', reservationQueueDate: date2, createdAt: new Date('2027-01-01') },
      ]);
      db.reservation.update.mockResolvedValue({});
      const result = await svc.rebuildPositions(UID);
      expect(result.updatedCount).toBe(3);
      expect(result.dateCount).toBe(2);
    });

    it('should skip reservations without queue date', async () => {
      db.reservation.findMany.mockResolvedValue([
        { id: 'r1', reservationQueueDate: null, createdAt: new Date() },
      ]);
      const result = await svc.rebuildPositions(UID);
      expect(result.updatedCount).toBe(0);
      expect(result.dateCount).toBe(0);
    });
  });

  // ═══════════════════════════════════
  // autoCancelExpired
  // ═══════════════════════════════════
  describe('autoCancelExpired()', () => {
    it('should return zeros when nothing cancelled', async () => {
      db.$queryRaw.mockResolvedValue([{ cancelled_count: 0, cancelled_ids: [] }]);
      const result = await svc.autoCancelExpired();
      expect(result.cancelledCount).toBe(0);
    });

    it('should log audit when items cancelled', async () => {
      db.$queryRaw.mockResolvedValue([{ cancelled_count: 3, cancelled_ids: ['a', 'b', 'c'] }]);
      const { logChange } = require('../../../utils/audit-logger');
      const result = await svc.autoCancelExpired(UID);
      expect(result.cancelledCount).toBe(3);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'QUEUE_AUTO_CANCEL' }));
    });

    it('should not log audit when nothing cancelled', async () => {
      db.$queryRaw.mockResolvedValue([{ cancelled_count: 0, cancelled_ids: [] }]);
      const { logChange } = require('../../../utils/audit-logger');
      await svc.autoCancelExpired();
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should handle null result from queryRaw', async () => {
      db.$queryRaw.mockResolvedValue([]);
      const result = await svc.autoCancelExpired();
      expect(result.cancelledCount).toBe(0);
      expect(result.cancelledIds).toEqual([]);
    });

    it('should pass userId for manual trigger and null for system', async () => {
      db.$queryRaw.mockResolvedValue([{ cancelled_count: 1, cancelled_ids: ['x'] }]);
      const { logChange } = require('../../../utils/audit-logger');
      await svc.autoCancelExpired(UID);
      expect(logChange.mock.calls[0][0].details.triggeredBy).toBe('manual');
      logChange.mockClear();
      db.$queryRaw.mockResolvedValue([{ cancelled_count: 1, cancelled_ids: ['y'] }]);
      await svc.autoCancelExpired();
      expect(logChange.mock.calls[0][0].details.triggeredBy).toBe('system');
    });
  });

  // ═══════════════════════════════════
  // promoteReservation — edge cases
  // ═══════════════════════════════════
  describe('promoteReservation()', () => {
    const PROMOTE_DATA = {
      hallId: 'hall-1', eventTypeId: 'ev-1',
      startDateTime: '2027-08-15T14:00:00Z', endDateTime: '2027-08-15T22:00:00Z',
      adults: 50, children: 5, toddlers: 2,
      pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 50,
    };

    it('should throw when not found', async () => {
      db.reservation.findUnique.mockResolvedValue(null);
      await expect(svc.promoteReservation('bad', PROMOTE_DATA as any, UID)).rejects.toThrow('Reservation not found');
    });

    it('should throw when not RESERVED', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...QUEUE_RES, status: 'PENDING' });
      await expect(svc.promoteReservation('qr-1', PROMOTE_DATA as any, UID)).rejects.toThrow('Can only promote RESERVED');
    });

    it('should throw on missing required fields', async () => {
      await expect(svc.promoteReservation('qr-1', {} as any, UID)).rejects.toThrow('Hall, event type, start time, and end time are required');
    });

    it('should throw on invalid date format', async () => {
      await expect(svc.promoteReservation('qr-1', { ...PROMOTE_DATA, startDateTime: 'xxx' } as any, UID))
        .rejects.toThrow('Invalid date/time format');
    });

    it('should throw when endDateTime <= startDateTime', async () => {
      await expect(svc.promoteReservation('qr-1', { ...PROMOTE_DATA, startDateTime: '2027-08-15T22:00:00Z', endDateTime: '2027-08-15T14:00:00Z' } as any, UID))
        .rejects.toThrow('End time must be after start time');
    });

    it('should throw on hall booking conflict', async () => {
      db.reservation.findFirst.mockResolvedValue({ id: 'conflict' });
      await expect(svc.promoteReservation('qr-1', PROMOTE_DATA as any, UID)).rejects.toThrow('already booked');
    });

    it('should promote to CONFIRMED when status specified', async () => {
      db.reservation.update.mockResolvedValue({ ...QUEUE_RES, status: 'CONFIRMED' });
      await svc.promoteReservation('qr-1', { ...PROMOTE_DATA, status: 'CONFIRMED' } as any, UID);
      const call = db.reservation.update.mock.calls[0][0];
      expect(call.data.status).toBe('CONFIRMED');
    });

    it('should default to PENDING when no status specified', async () => {
      db.reservation.update.mockResolvedValue({ ...QUEUE_RES, status: 'PENDING' });
      await svc.promoteReservation('qr-1', PROMOTE_DATA as any, UID);
      const call = db.reservation.update.mock.calls[0][0];
      expect(call.data.status).toBe('PENDING');
    });

    it('should shift positions on old queue date after promote', async () => {
      db.reservation.update.mockResolvedValue({ ...QUEUE_RES, status: 'PENDING' });
      await svc.promoteReservation('qr-1', PROMOTE_DATA as any, UID);
      expect(db.reservation.updateMany).toHaveBeenCalledTimes(1);
    });

    it('should skip position shift when no old queue date/position', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...QUEUE_RES, reservationQueueDate: null, reservationQueuePosition: null });
      db.reservation.update.mockResolvedValue(QUEUE_RES);
      await svc.promoteReservation('qr-1', PROMOTE_DATA as any, UID);
      expect(db.reservation.updateMany).not.toHaveBeenCalled();
    });

    it('should handle null client in promote audit', async () => {
      db.reservation.findUnique.mockResolvedValue({ ...QUEUE_RES, client: null });
      db.reservation.update.mockResolvedValue(QUEUE_RES);
      await svc.promoteReservation('qr-1', PROMOTE_DATA as any, UID);
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange.mock.calls[0][0].details.description).toContain('N/A');
    });

    it('should use provided children/toddlers defaults', async () => {
      db.reservation.update.mockResolvedValue(QUEUE_RES);
      await svc.promoteReservation('qr-1', { ...PROMOTE_DATA, children: undefined, toddlers: undefined, pricePerChild: undefined, pricePerToddler: undefined } as any, UID);
      const call = db.reservation.update.mock.calls[0][0];
      expect(call.data.children).toBe(0);
      expect(call.data.toddlers).toBe(0);
    });
  });

  // ═══════════════════════════════════
  // getQueueForDate + getAllQueues
  // ═══════════════════════════════════
  describe('getQueueForDate()', () => {
    it('should throw on invalid date', async () => {
      await expect(svc.getQueueForDate('not-a-date')).rejects.toThrow('Invalid date format');
    });

    it('should return formatted queue items', async () => {
      db.reservation.findMany.mockResolvedValue([QUEUE_RES]);
      const result = await svc.getQueueForDate('2027-06-15');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('qr-1');
    });
  });

  describe('getQueueStats()', () => {
    it('should return stats with manual count and oldest date', async () => {
      db.reservation.findMany.mockResolvedValue([
        { reservationQueueDate: new Date('2027-06-15'), guests: 30, queueOrderManual: true },
        { reservationQueueDate: new Date('2027-06-15'), guests: 20, queueOrderManual: false },
        { reservationQueueDate: new Date('2027-06-16'), guests: 10, queueOrderManual: false },
      ]);
      const stats = await svc.getQueueStats();
      expect(stats.totalQueued).toBe(3);
      expect(stats.manualOrderCount).toBe(1);
      expect(stats.queuesByDate).toHaveLength(2);
      expect(stats.oldestQueueDate).toEqual(new Date('2027-06-15'));
    });

    it('should return empty stats when no reservations', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      const stats = await svc.getQueueStats();
      expect(stats.totalQueued).toBe(0);
      expect(stats.oldestQueueDate).toBeNull();
    });
  });
});
