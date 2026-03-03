/**
 * QueueService — Branch Coverage Tests
 * Focuses on: P2002 errors, status validation, date validation, position conflicts
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    client: {
      findUnique: jest.fn(),
    },
    reservation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    queueItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    hall: { 
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    eventType: { findUnique: jest.fn() },
    auditLog: { create: jest.fn() },
    $executeRawUnsafe: jest.fn(),
    $transaction: jest.fn(),
  },
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    },
  },
}));

import { QueueService } from '../../../services/queue.service';
import { prisma, Prisma } from '../../../lib/prisma';
import { ReservationStatus } from '@prisma/client';

const db = prisma as any;
const svc = new QueueService();

const makeRes = (o: any = {}) => ({
  id: 'res-1',
  clientId: 'c1',
  status: 'RESERVED' as ReservationStatus,
  reservationQueueDate: new Date('2027-06-15'),
  reservationQueuePosition: 1,
  ...o,
});

beforeEach(() => {
  jest.clearAllMocks();
  
  // Setup transaction mock
  db.$transaction.mockImplementation(async (cb: any) => {
    const tx = {
      reservation: {
        findMany: db.reservation.findMany,
        update: db.reservation.update,
        updateMany: db.reservation.updateMany,
      },
    };
    return cb(tx);
  });
});

describe('QueueService — branch coverage', () => {
  describe('addToQueue — defaults', () => {
    it('should throw on P2002 unique constraint error during create', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c1' });
      db.reservation.findUnique.mockResolvedValue(
        makeRes({ 
          id: 'res-1',
          clientId: 'c1',
          reservationQueueDate: null, 
          reservationQueuePosition: null 
        })
      );
      db.reservation.count.mockResolvedValue(3);
      
      const prismaError = Object.assign(
        new Error('Unique constraint'),
        { code: 'P2002' }
      );
      db.reservation.update.mockRejectedValue(prismaError);

      await expect(svc.addToQueue({
        clientId: 'c1',
        reservationQueueDate: new Date('2027-06-15'),
        guests: 50,
      }, 'u1'))
        .rejects.toThrow(/Pozycja.*już zajęta|Position.*already.*taken/i);
    });
  });

  describe('swapPositions — error branches', () => {
    it('should throw on P2002 error during swap', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce(makeRes({ id: 'r1', reservationQueuePosition: 1 }))
        .mockResolvedValueOnce(makeRes({ id: 'r2', reservationQueuePosition: 2 }));
      
      const prismaError = Object.assign(
        new Error('Unique'),
        { code: 'P2002' }
      );
      db.$executeRawUnsafe.mockRejectedValue(prismaError);

      await expect(svc.swapPositions('r1', 'r2', 'u1'))
        .rejects.toThrow(/konflikt pozycji|Position conflict/i);
    });

    it('should throw when one reservation is not RESERVED', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce(makeRes({ status: 'CONFIRMED' }))
        .mockResolvedValueOnce(makeRes());

      await expect(svc.swapPositions('r1', 'r2', 'u1'))
        .rejects.toThrow(/można zamieniać tylko.*RESERVED|Can only swap.*RESERVED/i);
    });
  });

  describe('moveToPosition — error branches', () => {
    it('should throw on P2002 error during move', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes({ reservationQueuePosition: 1 }));
      db.reservation.findMany.mockResolvedValue([makeRes(), makeRes({ id: 'r2' }), makeRes({ id: 'r3' })]);
      
      const prismaError = Object.assign(
        new Error('Position conflict'),
        { code: 'P2002' }
      );
      db.$executeRawUnsafe.mockRejectedValue(prismaError);

      await expect(svc.moveToPosition('res-1', 3, 'u1'))
        .rejects.toThrow(/Pozycja.*zajęta|Position.*occupied/i);
    });
  });

  describe('batchUpdatePositions — extra branches', () => {
    it('should throw when update has no ID', async () => {
      await expect(svc.batchUpdatePositions([{ id: '', position: 1 }], 'u1'))
        .rejects.toThrow(/Każda aktualizacja.*identyfikator|Each update.*ID/i);
    });

    it('should throw when position is invalid', async () => {
      await expect(svc.batchUpdatePositions([{ id: 'res-001', position: 0 }], 'u1'))
        .rejects.toThrow(/Nieprawidłowa pozycja|Invalid position/i);
    });

    it('should throw when reservation is not RESERVED in batch', async () => {
      db.reservation.findMany.mockResolvedValue([makeRes({ status: 'CONFIRMED' })]);

      await expect(svc.batchUpdatePositions([{ id: 'res-001', position: 1 }], 'u1'))
        .rejects.toThrow(/nie ma statusu RESERVED|is not RESERVED/i);
    });

    it('should throw when reservation has no queue date in batch', async () => {
      db.reservation.findMany.mockResolvedValue([makeRes({ reservationQueueDate: null })]);

      await expect(svc.batchUpdatePositions([{ id: 'res-001', position: 1 }], 'u1'))
        .rejects.toThrow(/nie ma przypisanej.*kolejki|has no queue date/i);
    });
  });

  describe('promoteReservation — extra branches', () => {
    it('should throw on invalid date format', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes());

      await expect(
        svc.promoteReservation('res-1', {
          startDateTime: 'invalid',
          endDateTime: '2027-06-15T18:00:00',
          hallId: 'h1',
          eventTypeId: 'et1',
          adults: 50,
          children: 10,
          toddlers: 5,
        }, 'u1')
      ).rejects.toThrow(/Nieprawidłowy format|Invalid date/i);
    });

    it('should throw when end time is before start time', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes());

      await expect(
        svc.promoteReservation('res-1', {
          startDateTime: '2027-06-15T18:00:00',
          endDateTime: '2027-06-15T10:00:00',
          hallId: 'h1',
          eventTypeId: 'et1',
          adults: 50,
          children: 10,
          toddlers: 5,
        }, 'u1')
      ).rejects.toThrow(/późniejsza niż.*rozpoczęcia|after.*start/i);
    });

    it('should promote to CONFIRMED when status is CONFIRMED', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes());
      db.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, allowMultipleBookings: true, allowWithWholeVenue: false });
      db.hall.findFirst.mockResolvedValue(null);
      db.eventType.findUnique.mockResolvedValue({ name: 'Wedding' });
      db.reservation.findMany.mockResolvedValue([]);
      db.reservation.updateMany.mockResolvedValue({ count: 0 });
      db.reservation.update.mockResolvedValue(makeRes({ status: 'CONFIRMED' }));
      db.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await svc.promoteReservation('res-1', {
        startDateTime: '2027-06-15T10:00:00',
        endDateTime: '2027-06-15T18:00:00',
        hallId: 'h1',
        eventTypeId: 'et1',
        adults: 50,
        children: 10,
        toddlers: 5,
        promoteToStatus: 'CONFIRMED',
      }, 'u1');

      expect(result.status).toBe('CONFIRMED');
    });

    it('should handle promote when reservation has no queue date/position', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes({ reservationQueueDate: null, reservationQueuePosition: null }));
      db.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, allowMultipleBookings: true, allowWithWholeVenue: false });
      db.hall.findFirst.mockResolvedValue(null);
      db.eventType.findUnique.mockResolvedValue({ name: 'Wedding' });
      db.reservation.findMany.mockResolvedValue([]);
      db.reservation.update.mockResolvedValue(makeRes({ status: 'PENDING_PAYMENT', reservationQueueDate: null, reservationQueuePosition: null }));
      db.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      await svc.promoteReservation('res-1', {
        startDateTime: '2027-06-15T10:00:00',
        endDateTime: '2027-06-15T18:00:00',
        hallId: 'h1',
        eventTypeId: 'et1',
        adults: 50,
        children: 10,
        toddlers: 5,
      }, 'u1');

      expect(db.reservation.update).toHaveBeenCalled();
    });
  });
});
