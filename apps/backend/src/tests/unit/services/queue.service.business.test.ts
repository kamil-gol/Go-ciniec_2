/**
 * QueueService — Unit Tests: Business Logic
 * Część 2/2 testów modułu Kolejka
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    client: { findUnique: jest.fn() },
    hall: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    reservation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
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
import { logChange } from '../../../utils/audit-logger';

const mockPrisma = prisma as any;

const TEST_USER_ID = 'user-uuid-001';

const QUEUE_DATE = new Date('2026-09-15');

const makeReservation = (id: string, position: number, overrides?: any) => ({
  id,
  status: 'RESERVED',
  reservationQueueDate: QUEUE_DATE,
  reservationQueuePosition: position,
  queueOrderManual: false,
  guests: 50,
  adults: 50,
  children: 0,
  toddlers: 0,
  notes: null,
  clientId: 'client-001',
  createdAt: new Date('2026-01-10'),
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
  mockPrisma.hall.findUnique.mockResolvedValue({ id: 'hall-001', name: 'Sala Główna', isActive: true });
  mockPrisma.eventType.findUnique.mockResolvedValue({ name: 'Wesele' });

  // Transaction mock — execute callback with mockPrisma as tx
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
});

describe('QueueService', () => {

  // ══════════════════════════════════════════════════════════════
  // swapPositions
  // ══════════════════════════════════════════════════════════════
  describe('swapPositions()', () => {

    it('should swap positions via $executeRawUnsafe', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_2);

      await service.swapPositions('res-001', 'res-002', TEST_USER_ID);

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUEUE_SWAP' })
      );
    });

    it('should throw when IDs are missing', async () => {
      await expect(service.swapPositions('', 'res-002', TEST_USER_ID))
        .rejects.toThrow(/Wymagane.*identyfikatory/i);
    });

    it('should throw when swapping with itself', async () => {
      await expect(service.swapPositions('res-001', 'res-001', TEST_USER_ID))
        .rejects.toThrow(/zami.*sob/i);
    });

    it('should throw when one reservation not found', async () => {
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(null);

      await expect(service.swapPositions('res-001', 'res-999', TEST_USER_ID))
        .rejects.toThrow(/Nie znaleziono.*jednej.*obu/i);
    });

    it('should throw when reservations are on different dates', async () => {
      const RES_DIFF_DATE = makeReservation('res-003', 1, {
        reservationQueueDate: new Date('2026-10-20'),
      });
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce(RES_1)
        .mockResolvedValueOnce(RES_DIFF_DATE);

      await expect(service.swapPositions('res-001', 'res-003', TEST_USER_ID))
        .rejects.toThrow(/same date|tego samego dnia/i);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // moveToPosition
  // ══════════════════════════════════════════════════════════════
  describe('moveToPosition()', () => {

    it('should move reservation via $executeRawUnsafe and audit', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(RES_1);
      mockPrisma.reservation.count.mockResolvedValue(5);

      await service.moveToPosition('res-001', 3, TEST_USER_ID);

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUEUE_MOVE' })
      );
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.moveToPosition('res-999', 2, TEST_USER_ID))
        .rejects.toThrow(/Nie znaleziono rezerwacji/i);
    });

    it('should throw when reservation is not RESERVED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(
        makeReservation('res-001', 1, { status: 'PENDING' })
      );

      await expect(service.moveToPosition('res-001', 2, TEST_USER_ID))
        .rejects.toThrow(/move.*RESERVED|przenie.*RESERVED/i);
    });

    it('should throw when position is not a positive integer', async () => {
      await expect(service.moveToPosition('res-001', 0, TEST_USER_ID))
        .rejects.toThrow(/positive integer|dodatni/i);
    });

    it('should throw when position exceeds queue size', async () => {
      mockPrisma.reservation.count.mockResolvedValue(3);

      await expect(service.moveToPosition('res-001', 5, TEST_USER_ID))
        .rejects.toThrow(/Position.*invalid|Pozycja.*nieprawid/i);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // batchUpdatePositions
  // ══════════════════════════════════════════════════════════════
  describe('batchUpdatePositions()', () => {

    it('should batch update positions in transaction', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([RES_1, RES_2]);

      const result = await service.batchUpdatePositions([
        { id: 'res-001', position: 2 },
        { id: 'res-002', position: 1 },
      ], TEST_USER_ID);

      expect(result.updatedCount).toBe(2);
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUEUE_REORDER' })
      );
    });

    it('should throw when updates array is empty', async () => {
      await expect(service.batchUpdatePositions([], TEST_USER_ID))
        .rejects.toThrow(/co najmniej jedna|at least one/i);
    });

    it('should throw when some reservations not found', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([RES_1]); // only 1 of 2

      await expect(service.batchUpdatePositions([
        { id: 'res-001', position: 1 },
        { id: 'res-999', position: 2 },
      ], TEST_USER_ID)).rejects.toThrow(/not found|Nie znaleziono.*wi.*cej/i);
    });

    it('should throw when reservations are on different dates', async () => {
      const RES_DIFF = makeReservation('res-003', 1, {
        reservationQueueDate: new Date('2026-10-20'),
      });
      mockPrisma.reservation.findMany.mockResolvedValue([RES_1, RES_DIFF]);

      await expect(service.batchUpdatePositions([
        { id: 'res-001', position: 1 },
        { id: 'res-003', position: 2 },
      ], TEST_USER_ID)).rejects.toThrow(/same date|tego samego dnia/i);
    });

    it('should throw on duplicate positions', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([RES_1, RES_2]);

      await expect(service.batchUpdatePositions([
        { id: 'res-001', position: 1 },
        { id: 'res-002', position: 1 }, // duplicate!
      ], TEST_USER_ID)).rejects.toThrow(/Duplicate|zduplikowane/i);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // rebuildPositions
  // ══════════════════════════════════════════════════════════════
  describe('rebuildPositions()', () => {

    it('should rebuild positions ordered by createdAt per date', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([
        { id: 'r1', reservationQueueDate: QUEUE_DATE, createdAt: new Date('2026-01-10') },
        { id: 'r2', reservationQueueDate: QUEUE_DATE, createdAt: new Date('2026-01-05') },
        { id: 'r3', reservationQueueDate: new Date('2026-10-01'), createdAt: new Date('2026-02-01') },
      ]);

      const result = await service.rebuildPositions(TEST_USER_ID);

      expect(result.updatedCount).toBe(3);
      expect(result.dateCount).toBe(2); // 2 unique dates
      expect(mockPrisma.reservation.update).toHaveBeenCalledTimes(3);

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUEUE_REBUILD' })
      );
    });

    it('should return zero counts when no reservations', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);

      const result = await service.rebuildPositions(TEST_USER_ID);

      expect(result.updatedCount).toBe(0);
      expect(result.dateCount).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // promoteReservation
  // ══════════════════════════════════════════════════════════════
  describe('promoteReservation()', () => {

    const PROMOTE_DATA = {
      hallId: 'hall-001',
      eventTypeId: 'et-001',
      startDateTime: '2026-09-15T14:00:00.000Z',
      endDateTime: '2026-09-15T22:00:00.000Z',
      adults: 40,
      children: 5,
      toddlers: 3,
      pricePerAdult: 200,
      pricePerChild: 100,
      pricePerToddler: 0,
      status: 'PENDING',
    };

    it('should promote RESERVED to PENDING with calculated price', async () => {
      mockPrisma.reservation.update.mockResolvedValue({
        ...RES_1,
        status: 'PENDING',
        hallId: 'hall-001',
        hall: { name: 'Sala Główna' },
        eventType: { name: 'Wesele' },
      });

      const result = await service.promoteReservation('res-001', PROMOTE_DATA as any, TEST_USER_ID);

      expect(result.status).toBe('PENDING');
      expect(mockPrisma.reservation.update).toHaveBeenCalledTimes(1);

      const updateData = mockPrisma.reservation.update.mock.calls[0][0].data;
      // totalPrice = 40*200 + 5*100 + 3*0 = 8500
      expect(updateData.totalPrice).toBe(8500);
      expect(updateData.reservationQueuePosition).toBeNull();
      expect(updateData.reservationQueueDate).toBeNull();

      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUEUE_PROMOTE' })
      );
    });

    it('should throw when reservation not found', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.promoteReservation('res-999', PROMOTE_DATA as any, TEST_USER_ID))
        .rejects.toThrow(/Nie znaleziono rezerwacji/i);
    });

    it('should throw when reservation is not RESERVED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(
        makeReservation('res-001', 1, { status: 'CONFIRMED' })
      );

      await expect(service.promoteReservation('res-001', PROMOTE_DATA as any, TEST_USER_ID))
        .rejects.toThrow(/promote.*RESERVED|awansowa.*RESERVED/i);
    });

    it('should throw when required fields are missing', async () => {
      await expect(service.promoteReservation('res-001', {
        hallId: 'hall-001',
        // missing eventTypeId, startDateTime, endDateTime
      } as any, TEST_USER_ID)).rejects.toThrow(/required|wymagane/i);
    });

    it('should throw when hall has a booking conflict', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue({ id: 'conflict-res' }); // conflict!

      await expect(service.promoteReservation('res-001', PROMOTE_DATA as any, TEST_USER_ID))
        .rejects.toThrow(/already booked|zajęta|nieaktywna/i);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // autoCancelExpired — uses Prisma ORM (findMany + updateMany)
  // ══════════════════════════════════════════════════════════════
  describe('autoCancelExpired()', () => {

    it('should cancel expired and audit when count > 0', async () => {
      mockPrisma.reservation.findMany.mockResolvedValueOnce([
        { id: 'r1' }, { id: 'r2' }, { id: 'r3' },
      ]);
      mockPrisma.reservation.updateMany.mockResolvedValueOnce({ count: 3 });

      const result = await service.autoCancelExpired(TEST_USER_ID);

      expect(result.cancelledCount).toBe(3);
      expect(result.cancelledIds).toEqual(['r1', 'r2', 'r3']);
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUEUE_AUTO_CANCEL' })
      );
    });

    it('should NOT audit when nothing cancelled', async () => {
      mockPrisma.reservation.findMany.mockResolvedValueOnce([]);

      const result = await service.autoCancelExpired();

      expect(result.cancelledCount).toBe(0);
      expect(logChange).not.toHaveBeenCalled();
    });
  });
});
