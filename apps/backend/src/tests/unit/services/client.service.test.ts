import { ClientService } from '@/services/client.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    clientContact: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    reservation: {
      count: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb({
      client: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      clientContact: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    })),
  },
}));

let clientService: ClientService;

describe('ClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clientService = new ClientService();
  });

  describe('createClient()', () => {
    it('should create INDIVIDUAL client', async () => {
      // Mock: no duplicate found
      (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = {
          client: {
            create: jest.fn().mockResolvedValue({
              id: '550e8400-e29b-41d4-a716-446655440000',
              clientType: 'INDIVIDUAL',
              firstName: 'Jan',
              lastName: 'Kowalski',
              email: 'jan@example.com',
              phone: '123456789',
            }),
            findUnique: jest.fn().mockResolvedValue({
              id: '550e8400-e29b-41d4-a716-446655440000',
              clientType: 'INDIVIDUAL',
              firstName: 'Jan',
              lastName: 'Kowalski',
              email: 'jan@example.com',
              phone: '123456789',
              contacts: [],
            }),
          },
        };
        return cb(tx);
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
    });

    it('should create COMPANY client with NIP validation', async () => {
      // Mock: no duplicate NIP
      (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = {
          client: {
            create: jest.fn().mockResolvedValue({
              id: '550e8400-e29b-41d4-a716-446655440002',
              clientType: 'COMPANY',
              companyName: 'Acme Inc',
              nip: '5260250274',
              firstName: 'Jan',
              lastName: 'Nowak',
              phone: '987654321',
              email: 'info@acme.com',
            }),
            findUnique: jest.fn().mockResolvedValue({
              id: '550e8400-e29b-41d4-a716-446655440002',
              clientType: 'COMPANY',
              companyName: 'Acme Inc',
              nip: '5260250274',
              firstName: 'Jan',
              lastName: 'Nowak',
              phone: '987654321',
              email: 'info@acme.com',
              contacts: [],
            }),
          },
        };
        return cb(tx);
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
      (prisma.client.findFirst as jest.Mock).mockResolvedValue({
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
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        isDeleted: false,
        contacts: [],
      });
      (prisma.reservation.count as jest.Mock).mockResolvedValue(3);

      await expect(
        clientService.deleteClient('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001')
      ).rejects.toThrow(/aktywn|rezerwacj/i);
    });

    it('should delete client when no active reservations', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        clientType: 'INDIVIDUAL',
        firstName: 'Jan',
        lastName: 'Kowalski',
        isDeleted: false,
        contacts: [],
      });
      (prisma.reservation.count as jest.Mock).mockResolvedValue(0);
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = {
          clientContact: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          client: {
            update: jest.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' }),
          },
        };
        await cb(tx);
      });

      await expect(
        clientService.deleteClient('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001')
      ).resolves.not.toThrow();
    });
  });
});
