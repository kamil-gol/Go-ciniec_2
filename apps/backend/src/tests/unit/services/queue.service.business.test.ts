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
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
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
  recalculateReservationTotalPrice: jest.fn(),
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

import { QueueService } from '../../../services/queue.service';
import { prisma } from '../../../lib/prisma';
import { ReservationStatus } from '@prisma/client';
import { computeReservationBasePrice, recalculateReservationTotalPrice } from '../../../utils/recalculate-price';

const db = prisma as any;
const svc = new QueueService();

const makeRes = (o: any = {}) => ({
  id: 'res-1',
  clientId: 'c1',
  status: 'RESERVED' as ReservationStatus,
  reservationQueueDate: new Date('2027-06-15'),
  reservationQueuePosition: 1,
  guests: 50,
  queueOrderManual: false,
  notes: null,
  createdAt: new Date(),
  client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski', phone: '123456789', email: 'jan@test.pl' },
  createdBy: { id: 'u1', firstName: 'Admin', lastName: 'User' },
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
      db.reservation.findUnique.mockResolvedValue(null);
      db.reservation.aggregate.mockResolvedValue({ _max: { reservationQueuePosition: null } });
      const newRes = makeRes();
      db.reservation.create.mockResolvedValue(newRes);

      const result = await svc.addToQueue({
        clientId: 'c1',
        reservationQueueDate: new Date('2027-06-15'),
        guests: 50,
      }, 'u1');

      // Service returns formatQueueItem(reservation)
      expect(result).toBeDefined();
      expect(result.id).toBe('res-1');
      expect(result.position).toBe(1);
      expect(db.reservation.create).toHaveBeenCalled();
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
        .rejects.toThrow(/Można przenościć tylko.*RESERVED|Can only move.*RESERVED/i);
    });

    it('should move to new position', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes({ reservationQueuePosition: 1 }));
      db.reservation.findMany.mockResolvedValue([makeRes(), makeRes({ id: 'r2', reservationQueuePosition: 2 }), makeRes({ id: 'r3', reservationQueuePosition: 3 })]);
      db.reservation.count.mockResolvedValue(3);
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
      (recalculateReservationTotalPrice as jest.Mock).mockResolvedValue(undefined);
    });

    it('should promote RESERVED to PENDING with calculated price', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes());
      db.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, allowMultipleBookings: true, allowWithWholeVenue: false, capacity: 100, isWholeVenue: false });
      db.hall.findFirst.mockResolvedValue(null);
      db.eventType.findUnique.mockResolvedValue({ name: 'Wedding' });
      db.reservation.findMany.mockResolvedValue([]);
      db.reservation.updateMany.mockResolvedValue({ count: 0 });
      db.reservation.update.mockResolvedValue(makeRes({ status: 'PENDING_PAYMENT' }));

      const result = await svc.promoteReservation('res-1', {
        startDateTime: '2027-06-15T10:00:00',
        endDateTime: '2027-06-15T18:00:00',
        hallId: 'h1',
        eventTypeId: 'et1',
        adults: 50,
        children: 10,
        toddlers: 5,
        pricePerAdult: 100,
        pricePerChild: 50,
        pricePerToddler: 0,
      } as any, 'u1');

      expect(result.status).toBe('PENDING_PAYMENT');
      expect(db.reservation.update).toHaveBeenCalled();
    });

    it('should throw when hall has a booking conflict', async () => {
      db.reservation.findUnique.mockResolvedValue(makeRes());
      db.hall.findUnique.mockResolvedValue({ id: 'h1', isActive: true, allowMultipleBookings: false, allowWithWholeVenue: false, capacity: 100, isWholeVenue: false });
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
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
        } as any, 'u1')
      ).rejects.toThrow(/nie dopuszcza wielu rezerwacji|not allow multiple bookings/i);
    });
  });
});
