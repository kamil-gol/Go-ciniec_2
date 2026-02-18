/**
 * ClientService — Branch Coverage
 * createClient: no email (skip validation), email empty->null, notes empty->null
 * updateClient: no phone (skip duplicate check), firstName/lastName fallback from existing,
 *   duplicate check with fallback names, conditional fields individually,
 *   email/phone/notes trim||null, no changes audit skip
 * deleteClient: has reservations, not found
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reservation: { count: jest.fn() },
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
const mockDiff = diffObjects as jest.Mock;
const svc = new ClientService();

const makeClient = (o: any = {}) => ({
  id: 'c-1', firstName: 'Jan', lastName: 'Kowalski',
  email: 'jan@example.com', phone: '123456789', notes: 'Notatka',
  createdAt: new Date(), updatedAt: new Date(),
  ...o,
});

beforeEach(() => jest.resetAllMocks());

describe('ClientService — branches', () => {

  // ═══ createClient ═══
  describe('createClient()', () => {
    it('should skip email validation when no email', async () => {
      db.client.findFirst.mockResolvedValue(null);
      db.client.create.mockResolvedValue(makeClient({ email: null }));
      await svc.createClient({ firstName: 'Jan', lastName: 'K', phone: '123456789' } as any, 'u-1');
      expect(db.client.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: null }) })
      );
    });

    it('should throw on invalid email', async () => {
      await expect(svc.createClient({ firstName: 'Jan', lastName: 'K', phone: '123456789', email: 'bad' } as any, 'u-1'))
        .rejects.toThrow('email');
    });

    it('should throw when phone missing', async () => {
      await expect(svc.createClient({ firstName: 'Jan', lastName: 'K' } as any, 'u-1'))
        .rejects.toThrow('required');
    });

    it('should throw when phone too short', async () => {
      await expect(svc.createClient({ firstName: 'Jan', lastName: 'K', phone: '12345' } as any, 'u-1'))
        .rejects.toThrow('9 digits');
    });

    it('should default notes to null', async () => {
      db.client.findFirst.mockResolvedValue(null);
      db.client.create.mockResolvedValue(makeClient({ notes: null }));
      await svc.createClient({ firstName: 'Jan', lastName: 'K', phone: '123456789' } as any, 'u-1');
      expect(db.client.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ notes: null }) })
      );
    });

    it('should throw on duplicate client', async () => {
      db.client.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(svc.createClient({ firstName: 'Jan', lastName: 'K', phone: '123456789' } as any, 'u-1'))
        .rejects.toThrow('istnieje');
    });
  });

  // ═══ getClients ═══
  describe('getClients()', () => {
    it('should return all when no filters', async () => {
      db.client.findMany.mockResolvedValue([]);
      await svc.getClients();
      expect(db.client.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('should apply search filter', async () => {
      db.client.findMany.mockResolvedValue([]);
      await svc.getClients({ search: 'Jan' });
      const where = db.client.findMany.mock.calls[0][0].where;
      expect(where.OR).toHaveLength(4);
    });
  });

  // ═══ updateClient ═══
  describe('updateClient()', () => {
    it('should throw when not found', async () => {
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.updateClient('bad', {}, 'u-1')).rejects.toThrow('not found');
    });

    it('should throw on invalid email', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      await expect(svc.updateClient('c-1', { email: 'bad' }, 'u-1')).rejects.toThrow('email');
    });

    it('should skip email validation when no email in update', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.update.mockResolvedValue(makeClient());
      mockDiff.mockReturnValue({});
      await svc.updateClient('c-1', { notes: 'Updated' }, 'u-1');
    });

    it('should use existing firstName when not provided (fallback)', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.findFirst.mockResolvedValue(null); // no duplicate
      db.client.update.mockResolvedValue(makeClient());
      mockDiff.mockReturnValue({});
      // Update only phone — firstName/lastName should fallback to existing
      await svc.updateClient('c-1', { phone: '987654321' }, 'u-1');
      expect(db.client.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            firstName: 'Jan',    // fallback from existingClient
            lastName: 'Kowalski', // fallback from existingClient
          }),
        })
      );
    });

    it('should use provided firstName/lastName in duplicate check', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.findFirst.mockResolvedValue(null);
      db.client.update.mockResolvedValue(makeClient());
      mockDiff.mockReturnValue({});
      await svc.updateClient('c-1', { phone: '987654321', firstName: 'Adam', lastName: 'Nowak' }, 'u-1');
      expect(db.client.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            firstName: 'Adam',
            lastName: 'Nowak',
          }),
        })
      );
    });

    it('should throw on duplicate when updating phone', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.findFirst.mockResolvedValue({ id: 'other' });
      await expect(svc.updateClient('c-1', { phone: '987654321' }, 'u-1'))
        .rejects.toThrow('istnieje');
    });

    it('should throw on short phone', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      await expect(svc.updateClient('c-1', { phone: '123' }, 'u-1'))
        .rejects.toThrow('9 digits');
    });

    it('should skip phone duplicate check when phone not updated', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.update.mockResolvedValue(makeClient());
      mockDiff.mockReturnValue({});
      await svc.updateClient('c-1', { firstName: 'Adam' }, 'u-1');
      expect(db.client.findFirst).not.toHaveBeenCalled();
    });

    it('should set email to null when empty string', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.update.mockResolvedValue(makeClient({ email: null }));
      mockDiff.mockReturnValue({});
      await svc.updateClient('c-1', { email: '' }, 'u-1');
      const data = db.client.update.mock.calls[0][0].data;
      expect(data.email).toBeNull();
    });

    it('should set phone to null when empty string', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.update.mockResolvedValue(makeClient({ phone: null }));
      mockDiff.mockReturnValue({});
      await svc.updateClient('c-1', { phone: '' } as any, 'u-1');
      // phone is empty string, fails digits < 9 check, so it throws
      // Actually wait... let me re-check. The `if (data.phone)` block checks truthiness.
      // Empty string is falsy so it skips the block.
      // Then `if (data.phone !== undefined)` is true, so it sets updateData.phone = ''.trim() || null
      const data = db.client.update.mock.calls[0][0].data;
      expect(data.phone).toBeNull();
    });

    it('should set notes to null when empty string', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.update.mockResolvedValue(makeClient({ notes: null }));
      mockDiff.mockReturnValue({});
      await svc.updateClient('c-1', { notes: '' }, 'u-1');
      const data = db.client.update.mock.calls[0][0].data;
      expect(data.notes).toBeNull();
    });

    it('should update only firstName', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.update.mockResolvedValue(makeClient({ firstName: 'Adam' }));
      mockDiff.mockReturnValue({ firstName: { old: 'Jan', new: 'Adam' } });
      await svc.updateClient('c-1', { firstName: 'Adam' }, 'u-1');
      const data = db.client.update.mock.calls[0][0].data;
      expect(data.firstName).toBe('Adam');
      expect(data.lastName).toBeUndefined();
    });

    it('should skip audit when no changes', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.client.update.mockResolvedValue(makeClient());
      mockDiff.mockReturnValue({});
      await svc.updateClient('c-1', { firstName: 'Jan' }, 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).not.toHaveBeenCalled();
    });
  });

  // ═══ deleteClient ═══
  describe('deleteClient()', () => {
    it('should throw when not found', async () => {
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.deleteClient('bad', 'u-1')).rejects.toThrow('not found');
    });

    it('should throw when has reservations', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.reservation.count.mockResolvedValue(3);
      await expect(svc.deleteClient('c-1', 'u-1')).rejects.toThrow('existing reservations');
    });

    it('should delete successfully', async () => {
      db.client.findUnique.mockResolvedValue(makeClient());
      db.reservation.count.mockResolvedValue(0);
      db.client.delete.mockResolvedValue(undefined);
      await svc.deleteClient('c-1', 'u-1');
      expect(db.client.delete).toHaveBeenCalledWith({ where: { id: 'c-1' } });
    });
  });

  // ═══ getClientById ═══
  describe('getClientById()', () => {
    it('should throw when not found', async () => {
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.getClientById('bad')).rejects.toThrow('not found');
    });
  });
});
