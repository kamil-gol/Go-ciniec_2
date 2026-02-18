/**
 * ClientService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    client: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reservation: { count: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ firstName: { old: 'A', new: 'B' } }),
}));

import { ClientService } from '../../../services/client.service';
import { prisma } from '../../../lib/prisma';
import { logChange, diffObjects } from '../../../utils/audit-logger';

const mockPrisma = prisma as any;
const USER = 'user-001';

const CLIENT = {
  id: 'cl-001', firstName: 'Jan', lastName: 'Kowalski',
  phone: '+48123456789', email: 'jan@test.pl', notes: null,
};

let service: ClientService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new ClientService();
  mockPrisma.client.findFirst.mockResolvedValue(null);
  mockPrisma.client.findMany.mockResolvedValue([CLIENT]);
  mockPrisma.client.findUnique.mockResolvedValue(CLIENT);
  mockPrisma.client.create.mockResolvedValue(CLIENT);
  mockPrisma.client.update.mockResolvedValue(CLIENT);
  mockPrisma.client.delete.mockResolvedValue(CLIENT);
  mockPrisma.reservation.count.mockResolvedValue(0);
});

describe('ClientService', () => {
  describe('createClient()', () => {
    it('should create client and audit', async () => {
      const result = await service.createClient({ firstName: 'Jan', lastName: 'Kowalski', phone: '+48123456789' } as any, USER);
      expect(result.id).toBe('cl-001');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'CLIENT' }));
    });

    it('should throw on invalid email', async () => {
      await expect(service.createClient({ firstName: 'A', lastName: 'B', phone: '+48123456789', email: 'bad' } as any, USER))
        .rejects.toThrow('Invalid email format');
    });

    it('should throw when phone is missing', async () => {
      await expect(service.createClient({ firstName: 'A', lastName: 'B' } as any, USER))
        .rejects.toThrow('Phone number is required');
    });

    it('should throw when phone has < 9 digits', async () => {
      await expect(service.createClient({ firstName: 'A', lastName: 'B', phone: '12345' } as any, USER))
        .rejects.toThrow('Phone number must contain at least 9 digits');
    });

    it('should throw on duplicate client', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(CLIENT);
      await expect(service.createClient({ firstName: 'Jan', lastName: 'Kowalski', phone: '+48123456789' } as any, USER))
        .rejects.toThrow(/już istnieje/);
    });
  });

  describe('getClients()', () => {
    it('should return clients', async () => {
      const result = await service.getClients();
      expect(result).toHaveLength(1);
    });

    it('should apply search filter', async () => {
      await service.getClients({ search: 'Jan' });
      const call = mockPrisma.client.findMany.mock.calls[0][0];
      expect(call.where.OR).toHaveLength(4);
    });
  });

  describe('getClientById()', () => {
    it('should return client with reservations', async () => {
      const result = await service.getClientById('cl-001');
      expect(result.id).toBe('cl-001');
    });

    it('should throw when not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.getClientById('x')).rejects.toThrow('Client not found');
    });
  });

  describe('updateClient()', () => {
    it('should update and audit', async () => {
      await service.updateClient('cl-001', { firstName: 'Janek' } as any, USER);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.updateClient('x', {} as any, USER)).rejects.toThrow('Client not found');
    });

    it('should not audit when no changes', async () => {
      (diffObjects as jest.Mock).mockReturnValue({});
      await service.updateClient('cl-001', { firstName: 'Jan' } as any, USER);
      expect(logChange).not.toHaveBeenCalled();
    });
  });

  describe('deleteClient()', () => {
    it('should delete and audit', async () => {
      await service.deleteClient('cl-001', USER);
      expect(mockPrisma.client.delete).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE' }));
    });

    it('should throw when has reservations', async () => {
      mockPrisma.reservation.count.mockResolvedValue(3);
      await expect(service.deleteClient('cl-001', USER)).rejects.toThrow('Cannot delete client with existing reservations');
    });
  });
});
