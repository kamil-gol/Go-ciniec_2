import { QueueService } from '@/services/queue.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findUnique: jest.fn(),
    },
    reservation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb({
      client: { findUnique: jest.fn() },
      reservation: {
        create: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
    })),
  },
}));

let queueService: QueueService;

describe('QueueService — branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queueService = new QueueService();
  });

  describe('addToQueue — defaults', () => {
    it('should use today if date not provided', async () => {
      const clientId = '550e8400-e29b-41d4-a716-446655440000';
      const createdById = '550e8400-e29b-41d4-a716-446655440001';

      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: clientId,
        firstName: 'Jan',
        lastName: 'Kowalski',
      });

      (prisma.reservation.aggregate as jest.Mock).mockResolvedValue({
        _max: { reservationQueuePosition: 3 },
      });

      (prisma.reservation.create as jest.Mock).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440002',
        clientId,
        createdById,
        status: 'RESERVED',
        reservationQueuePosition: 4,
        reservationQueueDate: new Date(),
        queueOrderManual: false,
        guests: 10,
        adults: 10,
        children: 0,
        toddlers: 0,
        totalPrice: 0,
        pricePerAdult: 0,
        pricePerChild: 0,
        pricePerToddler: 0,
        notes: null,
        createdAt: new Date(),
        client: { id: clientId, firstName: 'Jan', lastName: 'Kowalski', phone: '123456789', email: 'jan@example.com' },
        createdBy: { id: createdById, firstName: 'Admin', lastName: 'User' },
      });

      const result = await queueService.addToQueue(
        {
          clientId,
          reservationQueueDate: new Date(),
          guests: 10,
          adults: 10,
          children: 0,
          toddlers: 0,
        },
        createdById
      );

      expect(result.position).toBe(4);
      expect(prisma.client.findUnique).toHaveBeenCalledWith({ where: { id: clientId } });
    });
  });

  describe('getQueueForDate', () => {
    it('should return queue entries for specified date', async () => {
      (prisma.reservation.findMany as jest.Mock).mockResolvedValue([
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          reservationQueuePosition: 1,
          reservationQueueDate: new Date('2026-05-10'),
          guests: 50,
          queueOrderManual: false,
          notes: null,
          createdAt: new Date(),
          client: { id: '550e8400-e29b-41d4-a716-446655440000', firstName: 'Jan', lastName: 'Kowalski', phone: '123', email: 'jan@example.com' },
          createdBy: { id: '550e8400-e29b-41d4-a716-446655440001', firstName: 'Admin', lastName: 'User' },
        },
      ]);

      const result = await queueService.getQueueForDate(new Date('2026-05-10'));
      expect(result).toHaveLength(1);
      expect(result[0].position).toBe(1);
    });
  });
});
