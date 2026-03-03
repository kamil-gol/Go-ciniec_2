import { ClientService } from '@/services/client.service';
import { PrismaClient } from '@prisma/client';

const mockPrisma = {
  client: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  clientContact: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  reservation: {
    count: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
} as unknown as PrismaClient;

let clientService: ClientService;

describe('ClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clientService = new ClientService();
    (clientService as any).prisma = mockPrisma;
  });

  describe('createClient()', () => {
    it('should create INDIVIDUAL client', async () => {
      mockPrisma.client.findFirst = jest.fn().mockResolvedValue(null);
      mockPrisma.client.create = jest.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        clientType: 'INDIVIDUAL',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        phone: '123456789',
      });

      const result = await clientService.createClient(
        {
          clientType: 'INDIVIDUAL',
          firstName: 'Jan',
          lastName: 'Kowalski',
          email: 'jan@example.com',
          phone: '123456789',
        },
        '550e8400-e29b-41d4-a716-446655440001'
      );

      expect(result.clientType).toBe('INDIVIDUAL');
      expect(mockPrisma.client.create).toHaveBeenCalled();
    });

    it('should create COMPANY client with NIP validation', async () => {
      mockPrisma.client.findFirst = jest.fn().mockResolvedValue(null);
      mockPrisma.$transaction = jest.fn().mockImplementation(async (cb) => {
        const result = await cb(mockPrisma);
        return result;
      });

      mockPrisma.client.create = jest.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440002',
        clientType: 'COMPANY',
        companyName: 'Acme Inc',
        nip: '5260250274',
        firstName: 'Jan',
        lastName: 'Nowak',
        phone: '987654321',
        email: 'info@acme.com',
      });

      mockPrisma.client.findUnique = jest.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440002',
        clientType: 'COMPANY',
        companyName: 'Acme Inc',
        nip: '5260250274',
        firstName: 'Jan',
        lastName: 'Nowak',
        phone: '987654321',
        email: 'info@acme.com',
        contacts: [],
      });

      const result = await clientService.createClient(
        {
          clientType: 'COMPANY',
          companyName: 'Acme Inc',
          nip: '5260250274',
          firstName: 'Jan',
          lastName: 'Nowak',
          email: 'info@acme.com',
          phone: '987654321',
        },
        '550e8400-e29b-41d4-a716-446655440001'
      );

      expect(result.clientType).toBe('COMPANY');
      expect(result.nip).toBe('5260250274');
    });

    it('should throw on invalid NIP format', async () => {
      await expect(
        clientService.createClient(
          {
            clientType: 'COMPANY',
            companyName: 'BadCorp',
            nip: '123',
            firstName: 'Jan',
            lastName: 'Kowalski',
            email: 'bad@corp.com',
            phone: '111111111',
          },
          '550e8400-e29b-41d4-a716-446655440001'
        )
      ).rejects.toThrow(/NIP.*10 cyfr/i);
    });

    it('should throw on duplicate phone', async () => {
      mockPrisma.client.findFirst = jest.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        phone: '999999999',
        firstName: 'Test',
        lastName: 'User',
      });

      await expect(
        clientService.createClient(
          {
            clientType: 'INDIVIDUAL',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '999999999',
          },
          '550e8400-e29b-41d4-a716-446655440001'
        )
      ).rejects.toThrow(/już istnieje/i);
    });
  });

  describe('deleteClient()', () => {
    it('should throw when client has active reservations', async () => {
      mockPrisma.client.findUnique = jest.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        contacts: [],
      });
      mockPrisma.reservation.count = jest.fn().mockResolvedValue(3);

      await expect(
        clientService.deleteClient('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001')
      ).rejects.toThrow(/aktywn|rezerwacj/i);
    });

    it('should delete client when no active reservations', async () => {
      mockPrisma.client.findUnique = jest.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        clientType: 'INDIVIDUAL',
        firstName: 'Jan',
        lastName: 'Kowalski',
        contacts: [],
      });
      mockPrisma.reservation.count = jest.fn().mockResolvedValue(0);
      mockPrisma.$transaction = jest.fn().mockImplementation(async (cb) => {
        await cb(mockPrisma);
      });
      mockPrisma.clientContact.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
      mockPrisma.client.update = jest.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' });

      await expect(
        clientService.deleteClient('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001')
      ).resolves.not.toThrow();
    });
  });
});
