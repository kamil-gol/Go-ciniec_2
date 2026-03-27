import { ClientService } from '@/services/client.service';
import { prisma } from '@/lib/prisma';

jest.mock('@utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

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

  describe('edge cases / branch coverage', () => {
    describe('updateClient — client types', () => {
      it('should treat as PERSON when no companyName provided', async () => {
        const existing = {
          id: 'c1', firstName: 'Jan', lastName: 'Kowalski',
          phone: '123456789', email: 'jan@test.pl',
          companyName: null, clientType: 'INDIVIDUAL', isDeleted: false,
        };
        (prisma.client.findUnique as jest.Mock).mockResolvedValue(existing);
        (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.client.update as jest.Mock).mockResolvedValue({ ...existing, firstName: 'Adam' });

        await clientService.updateClient('c1', { firstName: 'Adam' }, 'u1');
        expect(prisma.client.update).toHaveBeenCalled();
      });

      it('should treat as COMPANY when companyName provided', async () => {
        const company = {
          id: 'c1', companyName: 'ACME Corp', firstName: null, lastName: null,
          phone: '123456789', email: 'jan@test.pl',
          clientType: 'COMPANY', isDeleted: false,
        };
        (prisma.client.findUnique as jest.Mock).mockResolvedValue(company);
        (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.client.update as jest.Mock).mockResolvedValue({ ...company, companyName: 'ACME Ltd' });

        await clientService.updateClient('c1', { companyName: 'ACME Ltd' }, 'u1');
        expect(prisma.client.update).toHaveBeenCalled();
      });
    });

    describe('updateClient — duplicate detection', () => {
      it('should not throw when updating same client', async () => {
        const existing = {
          id: 'c1', firstName: 'Jan', lastName: 'Kowalski',
          phone: '123456789', email: 'jan@test.pl',
          companyName: null, clientType: 'INDIVIDUAL', isDeleted: false,
        };
        (prisma.client.findUnique as jest.Mock).mockResolvedValue(existing);
        (prisma.client.findFirst as jest.Mock).mockResolvedValue(existing);
        (prisma.client.update as jest.Mock).mockResolvedValue({ ...existing, email: 'new@test.pl' });

        await expect(clientService.updateClient('c1', { email: 'new@test.pl' }, 'u1')).resolves.toBeDefined();
      });
    });

    describe('updateClient — conditional fields', () => {
      it('should use provided lastName in phone duplicate check', async () => {
        const existing = {
          id: 'c1', firstName: 'Jan', lastName: 'Kowalski',
          phone: '123456789', email: 'jan@test.pl',
          companyName: null, clientType: 'INDIVIDUAL', isDeleted: false,
        };
        (prisma.client.findUnique as jest.Mock).mockResolvedValue(existing);
        (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.client.update as jest.Mock).mockResolvedValue({ ...existing, lastName: 'Nowak', phone: '999888777' });

        await clientService.updateClient('c1', { lastName: 'Nowak', phone: '999888777' }, 'u1');

        expect(prisma.client.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              phone: '999888777',
              firstName: 'Jan',
              lastName: 'Nowak',
            }),
          })
        );
      });

      it('should fallback to existing lastName in phone duplicate check when not provided', async () => {
        const existing = {
          id: 'c1', firstName: 'Jan', lastName: 'Kowalski',
          phone: '123456789', email: 'jan@test.pl',
          companyName: null, clientType: 'INDIVIDUAL', isDeleted: false,
        };
        (prisma.client.findUnique as jest.Mock).mockResolvedValue(existing);
        (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.client.update as jest.Mock).mockResolvedValue({ ...existing, phone: '999888777' });

        await clientService.updateClient('c1', { phone: '999888777' }, 'u1');

        expect(prisma.client.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              phone: '999888777',
              firstName: 'Jan',
              lastName: 'Kowalski',
            }),
          })
        );
      });
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
