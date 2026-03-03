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
  reservation: {
    count: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
} as unknown as PrismaClient;

let clientService: ClientService;

describe('ClientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clientService = new ClientService(mockPrisma);
  });

  describe('createClient()', () => {
    it('should create INDIVIDUAL client', async () => {
      mockPrisma.client.findFirst = jest.fn().mockResolvedValue(null);
      mockPrisma.client.create = jest.fn().mockResolvedValue({
        id: 'client-1',
        clientType: 'INDIVIDUAL',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
      });

      const result = await clientService.createClient(
        {
          clientType: 'INDIVIDUAL',
          firstName: 'Jan',
          lastName: 'Kowalski',
          email: 'jan@example.com',
          phoneNumber: '123456789',
        },
        'user-1'
      );

      expect(result.clientType).toBe('INDIVIDUAL');
      expect(mockPrisma.client.create).toHaveBeenCalled();
    });

    it('should create COMPANY client with NIP validation', async () => {
      mockPrisma.client.findFirst = jest.fn().mockResolvedValue(null);
      mockPrisma.client.create = jest.fn().mockResolvedValue({
        id: 'client-2',
        clientType: 'COMPANY',
        companyName: 'Acme Inc',
        nip: '5260250274',
      });

      const result = await clientService.createClient(
        {
          clientType: 'COMPANY',
          companyName: 'Acme Inc',
          nip: '5260250274', // Valid NIP with correct control digit
          email: 'info@acme.com',
          phoneNumber: '987654321',
        },
        'user-1'
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
            nip: '123', // Invalid: too short
            email: 'bad@corp.com',
            phoneNumber: '111111111',
          },
          'user-1'
        )
      ).rejects.toThrow(/NIP.*10 cyfr/i);
    });

    it('should throw on duplicate email', async () => {
      mockPrisma.client.findFirst = jest.fn().mockResolvedValue({
        id: 'existing-client',
        email: 'duplicate@example.com',
      });

      await expect(
        clientService.createClient(
          {
            clientType: 'INDIVIDUAL',
            firstName: 'Test',
            lastName: 'User',
            email: 'duplicate@example.com',
            phoneNumber: '999999999',
          },
          'user-1'
        )
      ).rejects.toThrow(/już istnieje|already exists/i);
    });
  });

  describe('deleteClient()', () => {
    it('should throw when client has active reservations', async () => {
      mockPrisma.client.findUnique = jest.fn().mockResolvedValue({
        id: 'client-1',
      });
      mockPrisma.reservation.count = jest.fn().mockResolvedValue(3);

      await expect(clientService.deleteClient('client-1', 'user-1')).rejects.toThrow(
        /aktywn|rezerwacj/i
      );
    });

    it('should delete client when no active reservations', async () => {
      mockPrisma.client.findUnique = jest.fn().mockResolvedValue({
        id: 'client-1',
      });
      mockPrisma.reservation.count = jest.fn().mockResolvedValue(0);
      mockPrisma.client.delete = jest.fn().mockResolvedValue({ id: 'client-1' });

      await expect(clientService.deleteClient('client-1', 'user-1')).resolves.not.toThrow();
      expect(mockPrisma.client.delete).toHaveBeenCalled();
    });
  });
});
