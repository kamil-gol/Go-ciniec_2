import { QueueService } from '@/services/queue.service';
import { Prisma, PrismaClient } from '@prisma/client';

const mockPrisma = {
  reservationQueue: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  reservation: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
} as unknown as PrismaClient;

let queueService: QueueService;

describe('QueueService — branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queueService = new QueueService(mockPrisma);
  });

  describe('addToQueue — defaults', () => {
    it('should use today if date not provided', async () => {
      mockPrisma.reservationQueue.count = jest.fn().mockResolvedValue(3);
      mockPrisma.reservationQueue.create = jest.fn().mockResolvedValue({
        id: 'q-new',
        reservationId: 'r1',
        date: new Date(),
        position: 4,
      });
      mockPrisma.reservation.update = jest.fn().mockResolvedValue({
        id: 'r1',
        status: 'QUEUE',
      });

      const result = await queueService.addToQueue('r1', undefined);
      expect(result.position).toBe(4);
    });

    it('should throw on P2002 unique constraint error during create', async () => {
      mockPrisma.reservationQueue.count = jest.fn().mockResolvedValue(2);
      
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`reservationQueueDate`,`reservationQueuePosition`)',
        { code: 'P2002', clientVersion: '5.0.0' }
      );
      mockPrisma.reservationQueue.create = jest.fn().mockRejectedValue(prismaError);

      // QueueService catches P2002 and wraps it
      await expect(queueService.addToQueue('r1')).rejects.toThrow(/zająta.*Spróbuj ponownie/i);
    });
  });

  describe('moveToPosition — error branches', () => {
    it('should throw if queueEntry not found', async () => {
      mockPrisma.reservationQueue.findUnique = jest.fn().mockResolvedValue(null);
      await expect(queueService.moveToPosition('q1', 5)).rejects.toThrow(
        /nie znaleziono|not found/i
      );
    });

    it('should throw on P2002 error during move', async () => {
      mockPrisma.reservationQueue.findUnique = jest.fn().mockResolvedValue({
        id: 'q1',
        reservationId: 'r1',
        date: new Date('2026-05-10'),
        position: 2,
      });
      mockPrisma.reservationQueue.count = jest.fn().mockResolvedValue(5);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' }
      );
      mockPrisma.reservationQueue.update = jest.fn().mockRejectedValue(prismaError);

      // QueueService catches P2002 and wraps it
      await expect(queueService.moveToPosition('q1', 3)).rejects.toThrow(/zajęta.*Odśwież/i);
    });
  });

  describe('removeFromQueue', () => {
    it('should delete queue entry and update reservation status', async () => {
      mockPrisma.reservationQueue.findUnique = jest.fn().mockResolvedValue({
        id: 'q1',
        reservationId: 'r1',
      });
      mockPrisma.reservationQueue.delete = jest.fn().mockResolvedValue({ id: 'q1' });
      mockPrisma.reservation.update = jest.fn().mockResolvedValue({
        id: 'r1',
        status: 'CANCELLED',
      });

      const result = await queueService.removeFromQueue('q1');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('getQueueForDate', () => {
    it('should return queue entries for specified date', async () => {
      mockPrisma.reservationQueue.findMany = jest.fn().mockResolvedValue([
        {
          id: 'q1',
          position: 1,
          reservation: {
            id: 'r1',
            client: { firstName: 'Jan', lastName: 'Kowalski' },
          },
        },
        {
          id: 'q2',
          position: 2,
          reservation: {
            id: 'r2',
            client: { firstName: 'Anna', lastName: 'Nowak' },
          },
        },
      ]);

      const result = await queueService.getQueueForDate(new Date('2026-05-10'));
      expect(result).toHaveLength(2);
    });
  });
});
