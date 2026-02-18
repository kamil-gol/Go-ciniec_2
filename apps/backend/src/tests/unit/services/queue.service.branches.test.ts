/**
 * QueueService — Branch Coverage Tests
 * Targets uncovered branches: withRetry lock errors, addToQueue defaults,
 * swapPositions lock/P2002 errors, moveToPosition lock/P2002, updateQueueReservation edges
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    client: { findUnique: jest.fn() },
    hall: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    reservation: {
      create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
      findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
      count: jest.fn(), aggregate: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { QueueService } from '../../../services/queue.service';
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

const mockPrisma = prisma as any;
const TEST_USER_ID = 'user-001';
const QUEUE_DATE = new Date('2026-09-15');

const makeReservation = (id: string, position: number, overrides?: any) => ({
  id, status: 'RESERVED',
  reservationQueueDate: QUEUE_DATE, reservationQueuePosition: position,
  queueOrderManual: false, guests: 50, adults: 50, children: 0, toddlers: 0,
  notes: null, clientId: 'client-001', createdAt: new Date('2026-01-10'),
  client: { id: 'client-001', firstName: 'Jan', lastName: 'Kowalski', phone: '+48123', email: 'jan@test.pl' },
  createdBy: { id: TEST_USER_ID, firstName: 'Admin', lastName: 'Test' },
  ...overrides,
});

const RES_1 = makeReservation('res-001', 1);
const RES_2 = makeReservation('res-002', 2);

let service: QueueService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new QueueService();

  mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
  mockPrisma.reservation.findMany.mockResolvedValue([]);
  mockPrisma.reservation.findFirst.mockResolvedValue(null);
  mockPrisma.reservation.update.mockImplementation(({ where }: any) => {
    if (where.id === 'res-001') return Promise.resolve(RES_1);
    return Promise.resolve(RES_2);
  });
  mockPrisma.reservation.updateMany.mockResolvedValue({ count: 0 });
  mockPrisma.reservation.count.mockResolvedValue(5);
  mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 5 } });
  mockPrisma.$executeRaw.mockResolvedValue(undefined);
  mockPrisma.$queryRaw.mockResolvedValue([{ cancelled_count: 0, cancelled_ids: [] }]);
  mockPrisma.client.findUnique.mockResolvedValue(RES_1.client);
  mockPrisma.hall.findUnique.mockResolvedValue({ name: 'Sala G\u0142\u00f3wna' });
  mockPrisma.eventType.findUnique.mockResolvedValue({ name: 'Wesele' });
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
});

describe('QueueService \u2014 branch coverage', () => {

  // \u2500\u2500 addToQueue: default values for adults/children/toddlers \u2500\u2500
  describe('addToQueue \u2014 defaults', () => {

    it('should default adults to guests when adults not provided', async () => {
      mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 0 } });
      mockPrisma.reservation.create.mockResolvedValue(
        makeReservation('res-new', 1, { adults: 30, children: 0, toddlers: 0 })
      );

      await service.addToQueue({
        clientId: 'client-001', reservationQueueDate: '2026-09-15', guests: 30,
      } as any, TEST_USER_ID);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.adults).toBe(30);
      expect(createCall.data.children).toBe(0);
      expect(createCall.data.toddlers).toBe(0);
    });

    it('should use provided adults/children/toddlers values', async () => {
      mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 0 } });
      mockPrisma.reservation.create.mockResolvedValue(
        makeReservation('res-new', 1, { adults: 20, children: 5, toddlers: 3 })
      );

      await service.addToQueue({
        clientId: 'client-001', reservationQueueDate: '2026-09-15', guests: 28,
        adults: 20, children: 5, toddlers: 3,
      } as any, TEST_USER_ID);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.adults).toBe(20);
      expect(createCall.data.children).toBe(5);
      expect(createCall.data.toddlers).toBe(3);
    });

    it('should throw on P2002 unique constraint error during create', async () => {
      mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 3 } });
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002', clientVersion: '5.0.0',
      });
      mockPrisma.reservation.create.mockRejectedValue(p2002Error);

      await expect(service.addToQueue({
        clientId: 'client-001', reservationQueueDate: '2026-09-15', guests: 10,
      } as any, TEST_USER_ID)).rejects.toThrow('Position 4 is already taken');
    });

    it('should re-throw non-P2002 errors from create', async () => {
      mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 0 } });
      mockPrisma.reservation.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.addToQueue({
        clientId: 'client-001', reservationQueueDate: '2026-09-15', guests: 10,
      } as any, TEST_USER_ID)).rejects.toThrow('DB connection lost');
    });

    it('should throw when guests is less than 1', async () => {
      await expect(service.addToQueue({
        clientId: 'client-001', reservationQueueDate: '2026-09-15', guests: -1,
      } as any, TEST_USER_ID)).rejects.toThrow('Number of guests must be at least 1');
    });

    it('should throw on invalid queue date format', async () => {
      await expect(service.addToQueue({
        clientId: 'client-001', reservationQueueDate: 'not-a-date', guests: 10,
      } as any, TEST_USER_ID)).rejects.toThrow('Invalid queue date format');
    });

    it('should throw when queue date is in the past', async () => {
      await expect(service.addToQueue({
        clientId: 'client-001', reservationQueueDate: '2020-01-01', guests: 10,
      } as any, TEST_USER_ID)).rejects.toThrow('Queue date cannot be in the past');
    });

    it('should throw when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.addToQueue({
        clientId: 'missing', reservationQueueDate: '2026-09-15', guests: 10,
      } as any, TEST_USER_ID)).rejects.toThrow('Client not found');
    });
  });

  // \u2500\u2500 swapPositions: lock and P2002 error branches \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe('swapPositions \u2014 error branches', () => {

    it('should throw user-friendly message on lock error from $executeRaw', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);
      mockPrisma.$executeRaw.mockRejectedValue(
        Object.assign(new Error('lock_not_available'), { code: undefined })
      );

      await expect(service.swapPositions('res-001', 'res-002', TEST_USER_ID))
        .rejects.toThrow('Another user is modifying the queue');
    });

    it('should throw user-friendly message on P2034 error', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);
      mockPrisma.$executeRaw.mockRejectedValue(
        Object.assign(new Error('Transaction failed'), { code: 'P2034' })
      );

      await expect(service.swapPositions('res-001', 'res-002', TEST_USER_ID))
        .rejects.toThrow('Another user is modifying the queue');
    });

    it('should throw on P2002 error during swap', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);
      mockPrisma.$executeRaw.mockRejectedValue(
        Object.assign(new Error('Unique constraint'), { code: 'P2002' })
      );

      await expect(service.swapPositions('res-001', 'res-002', TEST_USER_ID))
        .rejects.toThrow('Position conflict detected');
    });

    it('should re-throw unknown errors during swap', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);
      mockPrisma.$executeRaw.mockRejectedValue(new Error('Unknown DB error'));

      await expect(service.swapPositions('res-001', 'res-002', TEST_USER_ID))
        .rejects.toThrow('Unknown DB error');
    });

    it('should throw when one reservation is not RESERVED', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(makeReservation('res-002', 2, { status: 'PENDING' }));

      await expect(service.swapPositions('res-001', 'res-002', TEST_USER_ID))
        .rejects.toThrow('Can only swap RESERVED reservations');
    });
  });

  // \u2500\u2500 moveToPosition: lock and P2002 error branches \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe('moveToPosition \u2014 error branches', () => {

    it('should throw on lock error during move', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.count.mockResolvedValue(5);
      mockPrisma.$executeRaw.mockRejectedValue(
        Object.assign(new Error('lock_not_available'), { code: undefined })
      );

      await expect(service.moveToPosition('res-001', 3, TEST_USER_ID))
        .rejects.toThrow('Another user is modifying the queue');
    });

    it('should throw on P2002 error during move', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.count.mockResolvedValue(5);
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002', clientVersion: '5.0.0',
      });
      mockPrisma.$executeRaw.mockRejectedValue(p2002);

      await expect(service.moveToPosition('res-001', 3, TEST_USER_ID))
        .rejects.toThrow('Position 3 is already occupied');
    });

    it('should re-throw unknown errors during move', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.count.mockResolvedValue(5);
      mockPrisma.$executeRaw.mockRejectedValue(new Error('Timeout'));

      await expect(service.moveToPosition('res-001', 3, TEST_USER_ID))
        .rejects.toThrow('Timeout');
    });

    it('should throw when reservationId is empty', async () => {
      await expect(service.moveToPosition('', 2, TEST_USER_ID))
        .rejects.toThrow('Reservation ID is required');
    });

    it('should throw when reservation has no queue date', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(
        makeReservation('res-001', 1, { reservationQueueDate: null })
      );
      await expect(service.moveToPosition('res-001', 2, TEST_USER_ID))
        .rejects.toThrow('Reservation has no queue date');
    });

    it('should return early when position is same as current', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.count.mockResolvedValue(5);

      await service.moveToPosition('res-001', 1, TEST_USER_ID);

      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  // \u2500\u2500 updateQueueReservation: edge cases \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe('updateQueueReservation \u2014 branches', () => {

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.updateQueueReservation('missing', {}, TEST_USER_ID))
        .rejects.toThrow('Reservation not found');
    });

    it('should throw when reservation is not RESERVED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(
        makeReservation('res-001', 1, { status: 'CONFIRMED' })
      );
      await expect(service.updateQueueReservation('res-001', {}, TEST_USER_ID))
        .rejects.toThrow('Can only update RESERVED reservations');
    });

    it('should throw when client not found during update', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.updateQueueReservation('res-001', { clientId: 'missing' }, TEST_USER_ID))
        .rejects.toThrow('Client not found');
    });

    it('should throw when guests < 1 during update', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      await expect(service.updateQueueReservation('res-001', { guests: 0 } as any, TEST_USER_ID))
        .rejects.toThrow('Number of guests must be at least 1');
    });

    it('should throw on invalid queue date during update', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      await expect(service.updateQueueReservation('res-001', { reservationQueueDate: 'bad-date' } as any, TEST_USER_ID))
        .rejects.toThrow('Invalid queue date format');
    });

    it('should throw when queue date is in the past during update', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      await expect(service.updateQueueReservation('res-001', { reservationQueueDate: '2020-01-01' } as any, TEST_USER_ID))
        .rejects.toThrow('Queue date cannot be in the past');
    });

    it('should reposition when date changes', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: 3 } });
      mockPrisma.reservation.update.mockResolvedValue(
        makeReservation('res-001', 4, { reservationQueueDate: new Date('2026-10-01') })
      );

      await service.updateQueueReservation('res-001', {
        reservationQueueDate: '2026-10-01',
      } as any, TEST_USER_ID);

      // Should have decremented old date positions
      expect(mockPrisma.reservation.updateMany).toHaveBeenCalled();
    });

    it('should track clientId change', async () => {
      const newClient = { id: 'client-002', firstName: 'Anna', lastName: 'Nowak', phone: '+48999', email: 'a@t.pl' };
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.client.findUnique.mockResolvedValue(newClient);
      mockPrisma.reservation.update.mockResolvedValue(
        makeReservation('res-001', 1, { clientId: 'client-002', client: newClient })
      );

      await service.updateQueueReservation('res-001', { clientId: 'client-002' } as any, TEST_USER_ID);

      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUEUE_UPDATE' })
      );
    });

    it('should not audit when no changes detected', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.update.mockResolvedValue(RES_1);

      await service.updateQueueReservation('res-001', { notes: RES_1.notes } as any, TEST_USER_ID);

      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).not.toHaveBeenCalled();
    });
  });

  // \u2500\u2500 batchUpdatePositions: extra branches \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe('batchUpdatePositions \u2014 extra branches', () => {

    it('should throw when update has no ID', async () => {
      await expect(service.batchUpdatePositions([
        { id: '', position: 1 },
      ], TEST_USER_ID)).rejects.toThrow('Each update must have a reservation ID');
    });

    it('should throw when position is invalid', async () => {
      await expect(service.batchUpdatePositions([
        { id: 'res-001', position: 0 },
      ], TEST_USER_ID)).rejects.toThrow(/Invalid position/);
    });

    it('should throw when reservation is not RESERVED in batch', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        makeReservation('res-001', 1, { status: 'PENDING' }),
      ]);
      await expect(service.batchUpdatePositions([
        { id: 'res-001', position: 1 },
      ], TEST_USER_ID)).rejects.toThrow('is not RESERVED');
    });

    it('should throw when reservation has no queue date in batch', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        makeReservation('res-001', 1, { reservationQueueDate: null }),
      ]);
      await expect(service.batchUpdatePositions([
        { id: 'res-001', position: 1 },
      ], TEST_USER_ID)).rejects.toThrow('has no queue date');
    });
  });

  // \u2500\u2500 getQueueStats: edge cases \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe('getQueueStats \u2014 branches', () => {

    it('should count manual orders and find oldest date', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        { reservationQueueDate: new Date('2026-08-01'), guests: 20, queueOrderManual: true },
        { reservationQueueDate: new Date('2026-09-15'), guests: 30, queueOrderManual: false },
        { reservationQueueDate: new Date('2026-08-01'), guests: 10, queueOrderManual: true },
      ]);

      const stats = await service.getQueueStats();

      expect(stats.totalQueued).toBe(3);
      expect(stats.manualOrderCount).toBe(2);
      expect(stats.oldestQueueDate).toEqual(new Date('2026-08-01'));
      expect(stats.queuesByDate).toHaveLength(2);
    });

    it('should handle empty queue', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);
      const stats = await service.getQueueStats();
      expect(stats.totalQueued).toBe(0);
      expect(stats.oldestQueueDate).toBeNull();
    });
  });

  // \u2500\u2500 promoteReservation: extra error branches \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe('promoteReservation \u2014 extra branches', () => {

    it('should throw on invalid date format', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      await expect(service.promoteReservation('res-001', {
        hallId: 'h1', eventTypeId: 'e1',
        startDateTime: 'not-a-date', endDateTime: '2026-09-15T22:00:00Z',
        adults: 10, pricePerAdult: 100,
      } as any, TEST_USER_ID)).rejects.toThrow('Invalid date/time format');
    });

    it('should throw when end time is before start time', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      await expect(service.promoteReservation('res-001', {
        hallId: 'h1', eventTypeId: 'e1',
        startDateTime: '2026-09-15T22:00:00Z', endDateTime: '2026-09-15T14:00:00Z',
        adults: 10, pricePerAdult: 100,
      } as any, TEST_USER_ID)).rejects.toThrow('End time must be after start time');
    });

    it('should promote to CONFIRMED when status is CONFIRMED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.update.mockResolvedValue({
        ...RES_1, status: 'CONFIRMED',
        hall: { name: 'Sala' }, eventType: { name: 'Wesele' },
      });

      await service.promoteReservation('res-001', {
        hallId: 'h1', eventTypeId: 'e1',
        startDateTime: '2026-09-15T14:00:00Z', endDateTime: '2026-09-15T22:00:00Z',
        adults: 10, children: 0, toddlers: 0,
        pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0,
        status: 'CONFIRMED',
      } as any, TEST_USER_ID);

      const updateData = mockPrisma.reservation.update.mock.calls[0][0].data;
      expect(updateData.status).toBe('CONFIRMED');
    });

    it('should handle promote when reservation has no queue date/position', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(
        makeReservation('res-001', 1, { reservationQueueDate: null, reservationQueuePosition: null })
      );
      mockPrisma.reservation.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.update.mockResolvedValue({
        ...RES_1, status: 'PENDING',
        hall: { name: 'Sala' }, eventType: { name: 'Wesele' },
      });

      await service.promoteReservation('res-001', {
        hallId: 'h1', eventTypeId: 'e1',
        startDateTime: '2026-09-15T14:00:00Z', endDateTime: '2026-09-15T22:00:00Z',
        adults: 10, pricePerAdult: 100, status: 'PENDING',
      } as any, TEST_USER_ID);

      // updateMany should NOT be called (no old date/position)
      expect(mockPrisma.reservation.updateMany).not.toHaveBeenCalled();
    });
  });
});
