/**
 * ClientService — Comprehensive Unit Tests
 * Targets ~45.94% branches. Covers: validation (email, phone),
 * duplicate check, getClients with/without search, updateClient
 * conditional fields, deleteClient with reservations guard.
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    client: {
      findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
      create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    },
    clientContact: { deleteMany: jest.fn() },
    reservation: { count: jest.fn() },
    $transaction: jest.fn((callback) => {
      // Mock transaction by calling the callback with tx object
      const tx = {
        client: { create: jest.fn((p) => Promise.resolve(p.data)), delete: jest.fn() },
        clientContact: { deleteMany: jest.fn() },
      };
      return callback(tx);
    }),
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn(),
  diffObjects: jest.fn().mockReturnValue({}),
}));

import { ClientService } from '../../../services/client.service';
import { prisma } from '../../../lib/prisma';
import { diffObjects } from '../../../utils/audit-logger';

const db = prisma as any;
const svc = new ClientService();

beforeEach(() => jest.clearAllMocks());

describe('ClientService', () => {
  // ========== createClient ==========
  describe('createClient()', () => {
    it('should throw on invalid email', async () => {
      await expect(svc.createClient(
        { firstName: 'Jan', lastName: 'K', phone: '123456789', email: 'invalid' } as any, 'u1'
      )).rejects.toThrow('Nieprawidłowy format adresu email');
    });

    it('should throw when phone is missing', async () => {
      await expect(svc.createClient(
        { firstName: 'Jan', lastName: 'K', phone: '' } as any, 'u1'
      )).rejects.toThrow('Numer telefonu jest wymagany');
    });

    it('should throw when phone has less than 9 digits', async () => {
      await expect(svc.createClient(
        { firstName: 'Jan', lastName: 'K', phone: '12345' } as any, 'u1'
      )).rejects.toThrow('co najmniej 9 cyfr');
    });

    it('should throw on duplicate client', async () => {
      db.client.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(svc.createClient(
        { firstName: 'Jan', lastName: 'K', phone: '123456789' } as any, 'u1'
      )).rejects.toThrow('ju\u017c istnieje');
    });

    it('should create client without email/notes', async () => {
      db.client.findFirst.mockResolvedValue(null);
      const result = await svc.createClient(
        { firstName: 'Jan', lastName: 'K', phone: '123456789' } as any, 'u1'
      );
      expect(result).toBeDefined();
      expect(result.firstName).toBe('Jan');
    });

    it('should create client with email and notes', async () => {
      db.client.findFirst.mockResolvedValue(null);
      const result = await svc.createClient(
        { firstName: 'Jan', lastName: 'K', phone: '123456789', email: 'jan@test.pl', notes: 'VIP' } as any, 'u1'
      );
      expect(result).toBeDefined();
      expect(result.email).toBe('jan@test.pl');
    });

    it('should accept valid email', async () => {
      db.client.findFirst.mockResolvedValue(null);
      const result = await svc.createClient(
        { firstName: 'A', lastName: 'B', phone: '123456789', email: 'a@b.com' } as any, 'u1'
      );
      expect(result).toBeDefined();
    });
  });

  // ========== getClients ==========
  describe('getClients()', () => {
    it('should return all clients without filters', async () => {
      db.client.findMany.mockResolvedValue([{ id: '1' }]);
      const result = await svc.getClients();
      expect(result).toHaveLength(1);
    });

    it('should build OR clause with search filter', async () => {
      db.client.findMany.mockResolvedValue([]);
      await svc.getClients({ search: 'Jan' });
      const call = db.client.findMany.mock.calls[0][0];
      expect(call.where.OR.length).toBeGreaterThanOrEqual(4);
    });

    it('should not build OR clause without search', async () => {
      db.client.findMany.mockResolvedValue([]);
      await svc.getClients({});
      const call = db.client.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeUndefined();
    });
  });

  // ========== getClientById ==========
  describe('getClientById()', () => {
    it('should throw when not found', async () => {
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.getClientById('x')).rejects.toThrow('Nie znaleziono klienta');
    });

    it('should return client with reservations', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c1', reservations: [], _count: { reservations: 0 } });
      const result = await svc.getClientById('c1');
      expect(result.id).toBe('c1');
    });
  });

  // ========== updateClient ==========
  describe('updateClient()', () => {
    const EXISTING = { id: 'c1', firstName: 'Jan', lastName: 'K', phone: '123456789', email: 'j@t.pl', notes: null };

    it('should throw when not found', async () => {
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.updateClient('x', {}, 'u1')).rejects.toThrow('Nie znaleziono klienta');
    });

    it('should throw on invalid email', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      await expect(svc.updateClient('c1', { email: 'bad' }, 'u1')).rejects.toThrow('Nieprawidłowy format adresu email');
    });

    it('should throw on short phone', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      await expect(svc.updateClient('c1', { phone: '123' }, 'u1')).rejects.toThrow('co najmniej 9 cyfr');
    });

    it('should throw on duplicate phone+name', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.findFirst.mockResolvedValue({ id: 'c2' });
      await expect(svc.updateClient('c1', { phone: '999888777' }, 'u1')).rejects.toThrow('ju\u017c istnieje');
    });

    it('should use existing name when no name provided in phone duplicate check', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.findFirst.mockResolvedValue(null);
      db.client.update.mockResolvedValue({ ...EXISTING, phone: '999888777' });
      await svc.updateClient('c1', { phone: '999888777' }, 'u1');
      expect(db.client.findFirst).toHaveBeenCalled();
    });

    it('should use provided name in phone duplicate check', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.findFirst.mockResolvedValue(null);
      db.client.update.mockResolvedValue({ ...EXISTING, firstName: 'Anna', phone: '999888777' });
      await svc.updateClient('c1', { firstName: 'Anna', phone: '999888777' }, 'u1');
      expect(db.client.findFirst).toHaveBeenCalled();
    });

    it('should only include provided fields in updateData', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, firstName: 'Anna' });
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { firstName: 'Anna' }, 'u1');
      const call = db.client.update.mock.calls[0][0];
      expect(call.data.firstName).toBe('Anna');
      expect(call.data.lastName).toBeUndefined();
    });

    it('should set email to null when empty string', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, email: null });
      (diffObjects as jest.Mock).mockReturnValue({ email: { old: 'j@t.pl', new: null } });
      await svc.updateClient('c1', { email: '' } as any, 'u1');
      const call = db.client.update.mock.calls[0][0];
      expect(call.data.email).toBeNull();
    });

    it('should audit log when changes exist', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, firstName: 'Anna' });
      (diffObjects as jest.Mock).mockReturnValue({ firstName: { old: 'Jan', new: 'Anna' } });
      await svc.updateClient('c1', { firstName: 'Anna' }, 'u1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });

    it('should skip audit log when no changes', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue(EXISTING);
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { firstName: 'Jan' }, 'u1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });
  });

  // ========== deleteClient ==========
  describe('deleteClient()', () => {
    it('should throw when not found', async () => {
      db.client.findUnique.mockResolvedValue(null);
      await expect(svc.deleteClient('x', 'u1')).rejects.toThrow('Nie znaleziono klienta');
    });

    it('should throw when client has reservations', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c1', firstName: 'J', lastName: 'K' });
      db.reservation.count.mockResolvedValue(3);
      await expect(svc.deleteClient('c1', 'u1')).rejects.toThrow(/rezerwacj/);
    });

    it('should delete client with no reservations', async () => {
      db.client.findUnique.mockResolvedValue({ id: 'c1', firstName: 'J', lastName: 'K', email: null, phone: '123' });
      db.reservation.count.mockResolvedValue(0);
      await svc.deleteClient('c1', 'u1');
      expect(db.$transaction).toHaveBeenCalled();
    });
  });
});
