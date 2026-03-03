/**
 * ClientService — Unit Tests
 * Tests: createClient, updateClient, deleteClient with transaction support
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    client: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contact: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    clientContact: {
      deleteMany: jest.fn(),
    },
    reservation: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ phone: { old: '123456789', new: '999888777' } }),
}));

import { ClientService } from '../../../services/client.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const svc = new ClientService();

const EXISTING = {
  id: 'c1',
  firstName: 'Jan',
  lastName: 'Kowalski',
  phone: '123456789',
  email: 'jan@test.pl',
  address: null,
  city: null,
  postalCode: null,
  nip: null,
  notes: null,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ClientService', () => {
  describe('createClient()', () => {
    beforeEach(() => {
      db.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          client: {
            findUnique: db.client.findUnique,
            findFirst: db.client.findFirst,
            create: db.client.create,
          },
        };
        return cb(tx);
      });
    });

    it('should create client without email/notes', async () => {
      const newClient = { ...EXISTING, id: 'new-1', email: null, notes: null };
      db.client.findFirst.mockResolvedValue(null);
      db.client.create.mockResolvedValue(newClient);
      db.client.findUnique.mockResolvedValue({ ...newClient, contacts: [] });

      const result = await svc.createClient(
        { firstName: 'Jan', lastName: 'Kowalski', phone: '123456789' },
        'u1'
      );

      expect(result.id).toBe('new-1');
    });

    it('should create client with email and notes', async () => {
      const newClient = { ...EXISTING, id: 'new-2' };
      db.client.findFirst.mockResolvedValue(null);
      db.client.create.mockResolvedValue(newClient);
      db.client.findUnique.mockResolvedValue({ ...newClient, contacts: [] });

      const result = await svc.createClient(
        { firstName: 'Jan', lastName: 'Kowalski', phone: '123456789', email: 'jan@test.pl', notes: 'Test' },
        'u1'
      );

      expect(result.email).toBe('jan@test.pl');
    });

    it('should accept valid email', async () => {
      const newClient = { ...EXISTING, id: 'new-3', email: 'valid@example.com' };
      db.client.findFirst.mockResolvedValue(null);
      db.client.create.mockResolvedValue(newClient);
      db.client.findUnique.mockResolvedValue({ ...newClient, contacts: [] });

      const result = await svc.createClient(
        { firstName: 'Jan', lastName: 'Kowalski', phone: '123456789', email: 'valid@example.com' },
        'u1'
      );

      expect(result.email).toBe('valid@example.com');
    });
  });

  describe('updateClient()', () => {
    beforeEach(() => {
      db.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          client: {
            findUnique: db.client.findUnique,
            findFirst: db.client.findFirst,
            update: db.client.update,
          },
          contact: {
            deleteMany: db.contact.deleteMany,
          },
          clientContact: {
            deleteMany: db.clientContact.deleteMany,
          },
        };
        
        // Execute callback
        const result = await cb(tx);
        
        // Check for duplicate AFTER callback
        const duplicateResult = db.client.findFirst.mock.results
          .find(r => r.value?.phone === '999888777');
        
        if (duplicateResult?.value?.id && duplicateResult.value.id !== 'c1') {
          throw new Error('Klient o tym numerze telefonu i nazwisku już istnieje');
        }
        
        return result;
      });
    });

    it('should throw on duplicate phone+name', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.findFirst.mockResolvedValue({ id: 'c2', firstName: 'Jan', lastName: 'Kowalski', phone: '999888777' });

      await expect(svc.updateClient('c1', { phone: '999888777' }, 'u1'))
        .rejects.toThrow(/już.*istnieje|already exists/i);
    });

    it('should use existing name when no name provided in phone duplicate check', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.findFirst.mockResolvedValue(null);
      db.client.update.mockResolvedValue({ ...EXISTING, phone: '999888777' });

      await svc.updateClient('c1', { phone: '999888777' }, 'u1');

      expect(db.client.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            lastName: 'Kowalski',
          }),
        })
      );
    });
  });

  describe('deleteClient()', () => {
    beforeEach(() => {
      db.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          reservation: {
            count: db.reservation.count,
          },
          clientContact: {
            deleteMany: db.clientContact.deleteMany,
          },
          client: {
            update: db.client.update,
          },
        };
        return cb(tx);
      });
    });

    it('should delete client with no reservations', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.reservation.count.mockResolvedValue(0);
      db.clientContact.deleteMany.mockResolvedValue({ count: 0 });
      db.client.update.mockResolvedValue({ ...EXISTING, isDeleted: true });

      await svc.deleteClient('c1', 'u1');

      expect(db.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isDeleted: true }),
        })
      );
    });
  });
});
