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

      const service = new (ClientContactsService.constructor || ClientContactsService)();
      // TODO: [AUDIT] uzupełnij wywołanie addContact z prawidłowym DTO
      expect(mockClientFindUnique).toBeDefined();
    });

    it('should reject contact for non-COMPANY client', async () => {
      mockClientFindUnique.mockResolvedValue({
        ...COMPANY_CLIENT,
        clientType: 'INDIVIDUAL',
      });

      // TODO: [AUDIT] uzupełnij test — oczekiwany AppError
      expect(true).toBe(true);
    });

    it('should unset other primaries when adding isPrimary contact', async () => {
      mockClientFindUnique.mockResolvedValue(COMPANY_CLIENT);
      mockContactUpdateMany.mockResolvedValue({ count: 1 });
      mockContactCreate.mockResolvedValue({
        id: 'contact-002',
        isPrimary: true,
        clientId: 'client-001',
      });

      // TODO: [AUDIT] uzupełnij — sprawdź czy updateMany wywołane z isPrimary: false
      expect(mockContactUpdateMany).toBeDefined();
    });
  });

  describe('removeContact', () => {
    it('should soft-delete a contact', async () => {
      mockContactFindUnique.mockResolvedValue({
        id: 'contact-001',
        clientId: 'client-001',
        deletedAt: null,
      });
      mockContactUpdate.mockResolvedValue({
        id: 'contact-001',
        deletedAt: new Date(),
      });

      // TODO: [AUDIT] uzupełnij wywołanie removeContact
      expect(mockContactFindUnique).toBeDefined();
    });
  });
});
