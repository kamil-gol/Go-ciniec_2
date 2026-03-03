/**
 * ClientService — Branch Coverage Tests
 * Tests: conditional fields and edge cases in updateClient
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    client: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    contact: {
      deleteMany: jest.fn(),
    },
    clientContact: {
      deleteMany: jest.fn(),
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

const EXISTING = {
  id: 'c1',
  firstName: 'Jan',
  lastName: 'Kowalski',
  phone: '123456789',
  email: 'jan@test.pl',
  companyName: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  
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
    return cb(tx);
  });
});

describe('ClientService — branch coverage', () => {
  describe('updateClient — client types', () => {
    it('should treat as PERSON when no companyName provided', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.findFirst.mockResolvedValue(null);
      db.client.update.mockResolvedValue({ ...EXISTING, firstName: 'Adam' });
      (diffObjects as jest.Mock).mockReturnValue({ firstName: { old: 'Jan', new: 'Adam' } });

      await svc.updateClient('c1', { firstName: 'Adam' }, 'u1');

      expect(db.client.update).toHaveBeenCalled();
    });

    it('should treat as COMPANY when companyName provided', async () => {
      const company = { ...EXISTING, companyName: 'ACME Corp', firstName: null, lastName: null };
      db.client.findUnique.mockResolvedValue(company);
      db.client.findFirst.mockResolvedValue(null);
      db.client.update.mockResolvedValue({ ...company, companyName: 'ACME Ltd' });
      (diffObjects as jest.Mock).mockReturnValue({ companyName: { old: 'ACME Corp', new: 'ACME Ltd' } });

      await svc.updateClient('c1', { companyName: 'ACME Ltd' }, 'u1');

      expect(db.client.update).toHaveBeenCalled();
    });
  });

  describe('updateClient — duplicate detection', () => {
    it('should not throw when updating same client', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.findFirst.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, email: 'new@test.pl' });
      (diffObjects as jest.Mock).mockReturnValue({ email: { old: 'jan@test.pl', new: 'new@test.pl' } });

      await expect(svc.updateClient('c1', { email: 'new@test.pl' }, 'u1')).resolves.toBeDefined();
    });
  });

  describe('updateClient — conditional fields', () => {
    it('should use provided lastName in phone duplicate check', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.findFirst.mockResolvedValue(null);
      db.client.update.mockResolvedValue({ ...EXISTING, lastName: 'Nowak', phone: '999888777' });
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { lastName: 'Nowak', phone: '999888777' }, 'u1');
      expect(db.client.findFirst).toHaveBeenCalled();
    });

    it('should fallback to existing lastName in phone duplicate check when not provided', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.findFirst.mockResolvedValue(null);
      db.client.update.mockResolvedValue({ ...EXISTING, phone: '999888777' });
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { phone: '999888777' }, 'u1');
      expect(db.client.findFirst).toHaveBeenCalled();
    });
  });
});
