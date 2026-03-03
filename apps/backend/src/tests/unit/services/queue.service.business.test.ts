/**
 * QueueService — Business Logic Tests
 * Tests: addToQueue, removeFromQueue, getQueueForDate, swapPositions, moveToPosition, promoteReservation
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    client: {
      findUnique: jest.fn(),
    },
    reservation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    hall: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    eventType: {
      findUnique: jest.fn(),
    },
    menuPackage: {
      findUnique: jest.fn(),
    },
    dish: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $executeRawUnsafe: jest.fn(),
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../utils/recalculate-price', () => ({
  computeReservationBasePrice: jest.fn(),
  recalculateReservationPrice: jest.fn(),
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

import { QueueService } from '../../../services/queue.service';
import { prisma } from '../../../lib/prisma';
import { ReservationStatus } from '@prisma/client';
import { computeReservationBasePrice, recalculateReservationPrice } from '../../../utils/recalculate-price';

const db = prisma as any;
const svc = new QueueService();

const makeRes = (o: any = {}) => ({
  id: 'res-1',
  clientId: 'c1',
  status: 'RESERVED' as ReservationStatus,
  reservationQueueDate: new Date('2027-06-15'),
  reservationQueuePosition: 1,
  client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski' },
  createdBy: { id: 'u1', firstName: 'Admin', lastName: 'User' },
  createdAt: new Date(),
  ...o,
});

beforeEach(() => {
  jest.clearAllMocks();
  
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

describe('QueueService', () => {
  describe('addToQueue()', () => {
    it('should add reservation to queue', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c1' });
      db.reservation.findUnique.mockResolvedValue(makeRes({ reservationQueueDate: null, reservationQueuePosition: null }));
      db.reservation.count.mockResolvedValue(0);
      db.reservation.update.mockResolvedValue(makeRes());

      const result = await svc.addToQueue({
        clientId: 'c1',
        reservationQueueDate: new Date('2027-06-15'),
        guests: 50,
      }, 'u1');

      expect(result.reservation).toBeDefined();
      expect(db.reservation.update).toHaveBeenCalled();
    });
  });

  describe('swapPositions()', () => {
    it('should throw when IDs are missing', async () => {
      await expect(svc.swapPositions('', 'r2', 'u1'))
        .rejects.toThrow(/Oba identyfikatory.*wymagane|Both.*IDs.*required/i);
    });

    it('should swap positions successfully', async () => {
      db.reservation.findUnique
        .mockResolvedValueOnce(makeRes({ id: 'r1', reservationQueuePosition: 1 }))
        .mockResolvedValueOnce(makeRes({ id: 'r2', reservationQueuePosition: 2 }));
      db.$executeRawUnsafe.mockResolvedValue(undefined);

      await svc.swapPositions('r1', 'r2', 'u1');

      expect(db.$executeRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('getQueueForDate()', () => {
    it('should return empty array when no reservations', async () => {
      db.reservation.findMany.mockResolvedValue([]);

      const result = await svc.getQueueForDate(new Date('2027-06-15'));

      expect(result).toEqual([]);
    });

    it('should return queue items for date', async () => {
      db.reservation.findMany.mockResolvedValue([makeRes()]);

      const result = await svc.getQueueForDate(new Date('2027-06-15'));

      expect(result).toHaveLength(1);
    });
  });

  describe('moveToPosition()', () => {
    it('should throw when reservation is not RESERVED', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes({ status: 'CONFIRMED' }));

      await expect(svc.moveToPosition('res-1', 3, 'u1'))
        .rejects.toThrow(/Można przenosić tylko.*RESERVED|Can only move.*RESERVED/i);
    });

    it('should move to new position', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes({ reservationQueuePosition: 1 }));
      db.reservation.findMany.mockResolvedValue([makeRes(), makeRes({ id: 'r2' }), makeRes({ id: 'r3' })]);
      db.$executeRawUnsafe.mockResolvedValue(undefined);

      await svc.moveToPosition('res-1', 3, 'u1');

      expect(db.$executeRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('promoteReservation()', () => {
    beforeEach(() => {
      (computeReservationBasePrice as jest.Mock).mockResolvedValue({
        basePrice: 5000,
        breakdown: {},
      });
      (recalculateReservationPrice as jest.Mock).mockResolvedValue(undefined);
    });

    it('should promote RESERVED to PENDING with calculated price', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes());
      db.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, allowMultipleBookings: true, allowWithWholeVenue: false });
      db.hall.findFirst.mockResolvedValue(null);
      db.eventType.findUnique.mockResolvedValue({ name: 'Wedding' });
      db.reservation.findMany.mockResolvedValue([]);
      db.reservation.updateMany.mockResolvedValue({ count: 0 });
      db.reservation.update.mockResolvedValue(makeRes({ status: 'PENDING_PAYMENT' }));
      db.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await svc.promoteReservation('res-1', {
        startDateTime: '2027-06-15T10:00:00',
        endDateTime: '2027-06-15T18:00:00',
        hallId: 'h1',
        eventTypeId: 'et1',
        adults: 50,
        children: 10,
        toddlers: 5,
      }, 'u1');

      expect(result.status).toBe('PENDING_PAYMENT');
      expect(db.reservation.update).toHaveBeenCalled();
    });

    it('should throw when hall has a booking conflict', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes());
      db.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, allowMultipleBookings: false, allowWithWholeVenue: false });
      db.hall.findFirst.mockResolvedValue(null);
      db.eventType.findUnique.mockResolvedValue({ name: 'Wedding' });
      db.reservation.findMany.mockResolvedValue([makeRes({ id: 'other' })]);

      await expect(
        svc.promoteReservation('res-1', {
          startDateTime: '2027-06-15T10:00:00',
          endDateTime: '2027-06-15T18:00:00',
          hallId: 'h1',
          eventTypeId: 'et1',
          adults: 50,
          children: 10,
          toddlers: 5,
        }, 'u1')
      ).rejects.toThrow(/nie dopuszcza wielu rezerwacji|not allow multiple bookings/i);
    });
  });
});
