import { QueueService } from '@/services/queue.service';
import { PrismaClient } from '@prisma/client';

const mockPrisma = {
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
  $transaction: jest.fn((cb) => cb(mockPrisma)),
} as unknown as PrismaClient;

let queueService: QueueService;

describe('QueueService — branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Inject mocked Prisma into service
    queueService = new QueueService();
    (queueService as any).prisma = mockPrisma;
  });

  describe('addToQueue — defaults', () => {
    it('should use today if date not provided', async () => {
      const clientId = '550e8400-e29b-41d4-a716-446655440000';
      const createdById = '550e8400-e29b-41d4-a716-446655440001';

      mockPrisma.client.findUnique = jest.fn().mockResolvedValue({
        id: clientId,
        firstName: 'Jan',
        lastName: 'Kowalski',
      });

      mockPrisma.reservation.aggregate = jest.fn().mockResolvedValue({
        _max: { reservationQueuePosition: 3 },
      });

      mockPrisma.reservation.create = jest.fn().mockResolvedValue({
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
    });
  });

  describe('getQueueForDate', () => {
    it('should return queue entries for specified date', async () => {
      mockPrisma.reservation.findMany = jest.fn().mockResolvedValue([
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
