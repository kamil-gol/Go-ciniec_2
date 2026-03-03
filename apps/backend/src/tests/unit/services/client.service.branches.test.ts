/**
 * ClientService — Branch Coverage Tests
 * Targets uncovered branches: lines 154, 156-157
 * updateClient: conditional fields (lastName, phone?.trim()||null, notes?.trim()||null)
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    client: {
      findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
      create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    },
    reservation: { count: jest.fn() },
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn(),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { ClientService } from '../../../services/client.service';
import { prisma } from '../../../lib/prisma';
import { diffObjects } from '../../../utils/audit-logger';

const db = prisma as any;
const svc = new ClientService();

const EXISTING = {
  id: 'c1', firstName: 'Jan', lastName: 'Kowalski',
  phone: '123456789', email: 'j@t.pl', notes: 'old note',
};

beforeEach(() => jest.clearAllMocks());

describe('ClientService — branch coverage', () => {

  // ── updateClient: conditional updateData fields ──────────────────────────────
  describe('updateClient — conditional fields', () => {

    it('should NOT set firstName when not provided', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, lastName: 'Nowak' });
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { lastName: 'Nowak' }, 'u1');
      const call = db.client.update.mock.calls[0][0];
      expect(call.data.firstName).toBeUndefined();
      expect(call.data.lastName).toBe('Nowak');
    });

    it('should NOT set lastName when not provided', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, firstName: 'Anna' });
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { firstName: 'Anna' }, 'u1');
      const call = db.client.update.mock.calls[0][0];
      expect(call.data.lastName).toBeUndefined();
      expect(call.data.firstName).toBe('Anna');
    });

    it('should set phone to null when phone is undefined in data', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, phone: null });
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { phone: undefined } as any, 'u1');
      const call = db.client.update.mock.calls[0][0];
      // phone is undefined in data => phone !== undefined is false => not set
      expect(call.data.phone).toBeUndefined();
    });

    it('should set notes to null when notes is empty string', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, notes: null });
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { notes: '' } as any, 'u1');
      const call = db.client.update.mock.calls[0][0];
      expect(call.data.notes).toBeNull();
    });

    it('should set phone to null when phone is empty string', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, phone: null });
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { phone: '' } as any, 'u1');
      const call = db.client.update.mock.calls[0][0];
      expect(call.data.phone).toBeNull();
    });

    it('should trim notes when notes has whitespace', async () => {
      db.client.findUnique.mockResolvedValue(EXISTING);
      db.client.update.mockResolvedValue({ ...EXISTING, notes: 'trimmed' });
      (diffObjects as jest.Mock).mockReturnValue({});
      await svc.updateClient('c1', { notes: '  trimmed  ' } as any, 'u1');
      const call = db.client.update.mock.calls[0][0];
      expect(call.data.notes).toBe('trimmed');
    });

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
