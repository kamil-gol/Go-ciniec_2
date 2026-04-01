jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    client: {
      findUnique: jest.fn(),
    },
    clientContact: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn(),
  diffObjects: jest.fn().mockReturnValue([]),
}));

import prisma from '../../../lib/prisma';

const mockClientFindUnique = prisma.client.findUnique as jest.Mock;
const mockContactCreate = prisma.clientContact.create as jest.Mock;
const mockContactFindUnique = prisma.clientContact.findUnique as jest.Mock;
const mockContactUpdate = prisma.clientContact.update as jest.Mock;
const mockContactUpdateMany = prisma.clientContact.updateMany as jest.Mock;

// Dynamic import after mocks
let ClientContactsService: any;

beforeAll(async () => {
  const mod = await import('../../../services/client-contacts.service');
  ClientContactsService = mod.default || mod;
});

describe('ClientContactsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const COMPANY_CLIENT = {
    id: 'client-001',
    clientType: 'COMPANY',
    companyName: 'Test Sp. z o.o.',
    deletedAt: null,
  };

  describe('addContact', () => {
    it('should create a contact for a company client', async () => {
      mockClientFindUnique.mockResolvedValue(COMPANY_CLIENT);
      mockContactCreate.mockResolvedValue({
        id: 'contact-001',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@test.pl',
        phone: '123456789',
        isPrimary: false,
        clientId: 'client-001',
      });

      const result = await ClientContactsService.addContact('client-001', {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@test.pl',
        phone: '123456789',
        isPrimary: false,
      }, 'user-123');

      expect(result.id).toBe('contact-001');
      expect(result.firstName).toBe('Jan');
      expect(mockContactCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clientId: 'client-001',
            firstName: 'Jan',
            lastName: 'Kowalski',
          }),
        })
      );
    });

    it('should reject contact for non-COMPANY client', async () => {
      mockClientFindUnique.mockResolvedValue({
        ...COMPANY_CLIENT,
        clientType: 'INDIVIDUAL',
      });

      await expect(
        ClientContactsService.addContact('client-001', {
          firstName: 'Jan',
          lastName: 'Kowalski',
        }, 'user-123')
      ).rejects.toThrow('Osoby kontaktowe można dodawać tylko do klientów firmowych');
    });

    it('should unset other primaries when adding isPrimary contact', async () => {
      mockClientFindUnique.mockResolvedValue(COMPANY_CLIENT);
      mockContactUpdateMany.mockResolvedValue({ count: 1 });
      mockContactCreate.mockResolvedValue({
        id: 'contact-002',
        isPrimary: true,
        clientId: 'client-001',
      });

      await ClientContactsService.addContact('client-001', {
        firstName: 'Jan',
        lastName: 'Nowy',
        isPrimary: true,
      }, 'user-123');

      expect(mockContactUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: 'client-001', isPrimary: true },
          data: { isPrimary: false },
        })
      );
    });
  });

  describe('removeContact', () => {
    it('should delete a contact', async () => {
      const mockClientContactDelete = prisma.clientContact.delete as jest.Mock;
      mockClientContactDelete.mockResolvedValue({
        id: 'contact-001',
        firstName: 'Jan',
        lastName: 'Kowalski',
      });

      // Mock findFirst instead of findUnique for removeContact
      const mockContactFindFirst = jest.fn().mockResolvedValue({
        id: 'contact-001',
        clientId: 'client-001',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@test.pl',
        phone: '123456789',
        role: null,
        client: {
          companyName: 'Test Sp. z o.o.',
        },
      });
      (prisma.clientContact as any).findFirst = mockContactFindFirst;

      await ClientContactsService.removeContact('client-001', 'contact-001', 'user-123');

      expect(mockClientContactDelete).toHaveBeenCalledWith({
        where: { id: 'contact-001' },
      });
    });
  });
});
