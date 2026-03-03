/**
 * ClientService — Unit Tests
 * Extended with company support tests (#150)
 * 🧪 Tests createClient, updateClient, deleteClient
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    client: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    clientContact: {
      create: jest.fn(),
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
  diffObjects: jest.fn(),
}));

import { ClientService } from '../../../services/client.service';
import { prisma } from '../../../lib/prisma';
import { diffObjects } from '../../../utils/audit-logger';

const db = prisma as any;
const svc = new ClientService();

const EXISTING_PERSON = {
  id: 'c1',
  clientType: 'INDIVIDUAL',
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan@test.pl',
  phone: '123456789',
  notes: null,
  companyName: null,
  nip: null,
  isDeleted: false,
  contacts: [],
};

const EXISTING_COMPANY = {
  id: 'c2',
  clientType: 'COMPANY',
  firstName: 'Jan',
  lastName: 'Nowak',
  email: 'kontakt@firma.pl',
  phone: '987654321',
  notes: null,
  companyName: 'Firma Sp. z o.o.',
  nip: '1234567890',
  regon: null,
  companyEmail: 'biuro@firma.pl',
  companyPhone: '123456789',
  companyAddress: null,
  companyCity: null,
  companyPostalCode: null,
  industry: null,
  website: null,
  isDeleted: false,
  contacts: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  
  // Default $transaction passthrough
  db.$transaction.mockImplementation(async (cb: any) => {
    const tx = {
      client: {
        create: db.client.create,
        findUnique: db.client.findUnique,
        update: db.client.update,
      },
      clientContact: {
        create: db.clientContact.create,
        deleteMany: db.clientContact.deleteMany,
      },
    };
    return cb(tx);
  });
});

describe('ClientService', () => {
  describe('createClient()', () => {
    it('should create INDIVIDUAL client', async () => {
      db.client.findFirst.mockResolvedValue(null);
      db.client.create.mockResolvedValue(EXISTING_PERSON);
      db.client.findUnique.mockResolvedValue(EXISTING_PERSON);

      const result = await svc.createClient(
        {
          clientType: 'INDIVIDUAL',
          firstName: 'Jan',
          lastName: 'Kowalski',
          phone: '123456789',
          email: 'jan@test.pl',
        },
        'u1'
      );

      expect(result.firstName).toBe('Jan');
      expect(db.client.create).toHaveBeenCalled();
    });

    it('should create COMPANY client with NIP validation', async () => {
      db.client.findFirst.mockResolvedValue(null);
      db.client.create.mockResolvedValue(EXISTING_COMPANY);
      db.client.findUnique.mockResolvedValue(EXISTING_COMPANY);

      const result = await svc.createClient(
        {
          clientType: 'COMPANY',
          firstName: 'Jan',
          lastName: 'Nowak',
          phone: '987654321',
          email: 'kontakt@firma.pl',
          companyName: 'Firma Sp. z o.o.',
          nip: '1234567890',
          companyEmail: 'biuro@firma.pl',
          companyPhone: '123456789',
        },
        'u1'
      );

      expect(result.companyName).toBe('Firma Sp. z o.o.');
      expect(result.nip).toBe('1234567890');
      expect(db.client.create).toHaveBeenCalled();
    });

    it('should throw when INDIVIDUAL client with same phone+name exists', async () => {
      db.client.findFirst.mockResolvedValue(EXISTING_PERSON);

      await expect(
        svc.createClient(
          {
            clientType: 'INDIVIDUAL',
            firstName: 'Jan',
            lastName: 'Kowalski',
            phone: '123456789',
          },
          'u1'
        )
      ).rejects.toThrow(/już istnieje|already exists/i);
    });
  });

  describe('updateClient()', () => {
    it('should throw on duplicate phone+name', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING_PERSON);
      // Duplicate check finds another client with same phone+name
      db.client.findFirst.mockResolvedValue({ ...EXISTING_PERSON, id: 'other-id' });

      await expect(
        svc.updateClient('c1', { phone: '123456789' }, 'u1')
      ).rejects.toThrow(/już.*istnieje|already exists/i);
    });

    it('should use existing name when no name provided in phone duplicate check', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING_PERSON);
      db.client.findFirst.mockResolvedValue(null);
      db.client.update.mockResolvedValue({ ...EXISTING_PERSON, phone: '999888777' });
      (diffObjects as jest.Mock).mockReturnValue({});

      await svc.updateClient('c1', { phone: '999888777' }, 'u1');

      // Service should call findFirst with existing firstName/lastName
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
    it('should soft-delete client and anonymize personal data', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING_PERSON);
      db.reservation.count.mockResolvedValue(0);
      db.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          clientContact: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          client: {
            update: jest.fn().mockResolvedValue({
              ...EXISTING_PERSON,
              isDeleted: true,
              firstName: 'Usunięty',
              lastName: 'Klient',
            }),
          },
        };
        return cb(tx);
      });

      await svc.deleteClient('c1', 'u1');

      expect(db.$transaction).toHaveBeenCalled();
    });

    it('should throw when client has active reservations', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING_PERSON);
      db.reservation.count.mockResolvedValue(3);

      await expect(svc.deleteClient('c1', 'u1')).rejects.toThrow(/aktywne rezerwacje|active reservations/i);
    });
  });
});
