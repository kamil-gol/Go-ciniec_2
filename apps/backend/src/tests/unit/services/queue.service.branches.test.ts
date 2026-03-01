/**
 * QueueService — Branch Coverage Tests
 * Targets uncovered branches: withRetry lock errors, addToQueue defaults,
 * swapPositions lock/P2002 errors, moveToPosition lock/P2002, updateQueueReservation edges,
 * autoCancelExpired (0 count, no userId), notes edge cases
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
    $executeRawUnsafe: jest.fn(),
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
  mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined);
  mockPrisma.client.findUnique.mockResolvedValue(RES_1.client);
  mockPrisma.hall.findUnique.mockResolvedValue({ name: 'Sala Główna' });
  mockPrisma.eventType.findUnique.mockResolvedValue({ name: 'Wesele' });
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
});

describe('QueueService — branch coverage', () => {

  // —— addToQueue: default values for adults/children/toddlers ——
  describe('addToQueue — defaults', () => {

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
      } as any, TEST_USER_ID)).rejects.toThrow('Liczba gości musi wynosić co najmniej 1');
    });

    it('should throw on invalid queue date format', async () => {
      await expect(service.addToQueue({
        clientId: 'client-001', reservationQueueDate: 'not-a-date', guests: 10,
      } as any, TEST_USER_ID)).rejects.toThrow('Nieprawidłowy format daty kolejki');
    });

    it('should throw when queue date is in the past', async () => {
      await expect(service.addToQueue({
        clientId: 'client-001', reservationQueueDate: '2020-01-01', guests: 10,
      } as any, TEST_USER_ID)).rejects.toThrow('Data kolejki nie może być w przeszłości');
    });

    it('should throw when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.addToQueue({
        clientId: 'missing', reservationQueueDate: '2026-09-15', guests: 10,
      } as any, TEST_USER_ID)).rejects.toThrow('Nie znaleziono klienta');
    });
  });

  // —— swapPositions: lock and P2002 error branches ————————————————
  describe('swapPositions — error branches', () => {

    it('should throw user-friendly message on lock error from $executeRawUnsafe', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);
      mockPrisma.$executeRawUnsafe.mockRejectedValue(
        Object.assign(new Error('lock_not_available'), { code: undefined })
      );

      await expect(service.swapPositions('res-001', 'res-002', TEST_USER_ID))
        .rejects.toThrow('Inny użytkownik modyfikuje kolejkę');
    });

    it('should throw user-friendly message on P2034 error', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);
      mockPrisma.$executeRawUnsafe.mockRejectedValue(
        Object.assign(new Error('Transaction failed'), { code: 'P2034' })
      );

      await expect(service.swapPositions('res-001', 'res-002', TEST_USER_ID))
        .rejects.toThrow('Inny użytkownik modyfikuje kolejkę');
    });

    it('should throw on P2002 error during swap', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);
      mockPrisma.$executeRawUnsafe.mockRejectedValue(
        Object.assign(new Error('Unique constraint'), { code: 'P2002' })
      );

      await expect(service.swapPositions('res-001', 'res-002', TEST_USER_ID))
        .rejects.toThrow('Position conflict detected');
    });

    it('should re-throw unknown errors during swap', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('Unknown DB error'));

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

    it('should retry on lock error then succeed (withRetry branch)', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);
      let callCount = 0;
      mockPrisma.$executeRawUnsafe.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) throw new Error('lock_not_available');
        return 1;
      });

      await service.swapPositions('res-001', 'res-002', TEST_USER_ID);
      expect(callCount).toBe(2);
    });
  });

  // —— moveToPosition: lock and P2002 error branches ———————————————
  describe('moveToPosition — error branches', () => {

    it('should throw on lock error during move', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.count.mockResolvedValue(5);
      mockPrisma.$executeRawUnsafe.mockRejectedValue(
        Object.assign(new Error('lock_not_available'), { code: undefined })
      );

      await expect(service.moveToPosition('res-001', 3, TEST_USER_ID))
        .rejects.toThrow('Inny użytkownik modyfikuje kolejkę');
    });

    it('should throw on P2002 error during move', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.count.mockResolvedValue(5);
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002', clientVersion: '5.0.0',
      });
      mockPrisma.$executeRawUnsafe.mockRejectedValue(p2002);

      await expect(service.moveToPosition('res-001', 3, TEST_USER_ID))
        .rejects.toThrow('Position 3 is already occupied');
    });

    it('should re-throw unknown errors during move', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.count.mockResolvedValue(5);
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('Timeout'));

      await expect(service.moveToPosition('res-001', 3, TEST_USER_ID))
        .rejects.toThrow('Timeout');
    });

    it('should throw when reservationId is empty', async () => {
      await expect(service.moveToPosition('', 2, TEST_USER_ID))
        .rejects.toThrow('Identyfikator rezerwacji jest wymagany');
    });

    it('should throw when reservation has no queue date', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(
        makeReservation('res-001', 1, { reservationQueueDate: null })
      );
      await expect(service.moveToPosition('res-001', 2, TEST_USER_ID))
        .rejects.toThrow('Rezerwacja nie ma przypisanej daty kolejki');
    });

    it('should return early when position is same as current', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.count.mockResolvedValue(5);

      await service.moveToPosition('res-001', 1, TEST_USER_ID);

      expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
    });
  });

  // —— updateQueueReservation: edge cases ——————————————————————
  describe('updateQueueReservation — branches', () => {

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.updateQueueReservation('missing', {}, TEST_USER_ID))
        .rejects.toThrow('Nie znaleziono rezerwacji');
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
        .rejects.toThrow('Nie znaleziono klienta');
    });

    it('should throw when guests < 1 during update', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      await expect(service.updateQueueReservation('res-001', { guests: 0 } as any, TEST_USER_ID))
        .rejects.toThrow('Liczba gości musi wynosić co najmniej 1');
    });

    it('should throw on invalid queue date during update', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      await expect(service.updateQueueReservation('res-001', { reservationQueueDate: 'bad-date' } as any, TEST_USER_ID))
        .rejects.toThrow('Nieprawidłowy format daty kolejki');
    });

    it('should throw when queue date is in the past during update', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      await expect(service.updateQueueReservation('res-001', { reservationQueueDate: '2020-01-01' } as any, TEST_USER_ID))
        .rejects.toThrow('Data kolejki nie może być w przeszłości');
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

    it('should track notes change when notes differ', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation('res-001', 1, { notes: 'old' }));
      mockPrisma.reservation.update.mockResolvedValue(makeReservation('res-001', 1, { notes: 'new' }));

      await service.updateQueueReservation('res-001', { notes: 'new' } as any, TEST_USER_ID);

      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({ changes: expect.objectContaining({ notes: { old: 'old', new: 'new' } }) }),
      }));
    });

    it('should convert empty string notes to null', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(makeReservation('res-001', 1, { notes: 'old' }));
      mockPrisma.reservation.update.mockResolvedValue(makeReservation('res-001', 1, { notes: null }));

      await service.updateQueueReservation('res-001', { notes: '' } as any, TEST_USER_ID);

      const updateCall = mockPrisma.reservation.update.mock.calls[0][0];
      expect(updateCall.data.notes).toBeNull();
    });
  });

  // —— batchUpdatePositions: extra branches ————————————————————
  describe('batchUpdatePositions — extra branches', () => {

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

  // —— getQueueStats: edge cases ————————————————————————————
  describe('getQueueStats — branches', () => {

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

  // —— promoteReservation: extra error branches ————————————————
  describe('promoteReservation — extra branches', () => {

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
      } as any, TEST_USER_ID)).rejects.toThrow('Godzina zakończenia musi być po godzinie rozpoczęcia');
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

      expect(mockPrisma.reservation.updateMany).not.toHaveBeenCalled();
    });
  });

  // —— autoCancelExpired: uses Prisma ORM (findMany + updateMany) ——
  describe('autoCancelExpired — branches', () => {

    it('should NOT log when cancelledCount is 0', async () => {
      mockPrisma.reservation.findMany.mockResolvedValueOnce([]);

      const result = await service.autoCancelExpired('u1');
      expect(result.cancelledCount).toBe(0);
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).not.toHaveBeenCalled();
    });

    it('should log with triggeredBy system when no userId', async () => {
      mockPrisma.reservation.findMany.mockResolvedValueOnce([
        { id: 'r1' }, { id: 'r2' },
      ]);
      mockPrisma.reservation.updateMany.mockResolvedValueOnce({ count: 2 });

      await service.autoCancelExpired();
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({ triggeredBy: 'system' }),
      }));
    });

    it('should handle empty findMany result', async () => {
      mockPrisma.reservation.findMany.mockResolvedValueOnce([]);

      const result = await service.autoCancelExpired();
      expect(result.cancelledCount).toBe(0);
    });
  });
});
