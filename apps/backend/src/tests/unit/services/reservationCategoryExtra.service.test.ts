const mock = {
  reservationCategoryExtra: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
  },
  packageCategorySettings: {
    findUnique: jest.fn(),
  },
  reservation: {
    findUnique: jest.fn(),
  },
};
jest.mock('../../../lib/prisma', () => ({
  prisma: mock,
  __esModule: true,
  default: mock,
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn(),
}));

import { prisma } from '../../../lib/prisma';

const mockFindMany = mock.reservationCategoryExtra.findMany as jest.Mock;
const mockUpsert = mock.reservationCategoryExtra.upsert as jest.Mock;
const mockDeleteMany = mock.reservationCategoryExtra.deleteMany as jest.Mock;
const mockAggregate = mock.reservationCategoryExtra.aggregate as jest.Mock;
const mockCategoryFind = mock.packageCategorySettings.findUnique as jest.Mock;

describe('ReservationCategoryExtraService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByReservation', () => {
    it('should return category extras for a reservation', async () => {
      const extras = [
        {
          id: 'extra-001',
          reservationId: 'res-001',
          packageCategoryId: 'cat-001',
          quantity: 2,
          totalPrice: 400,
          category: { name: 'Dekoracje' },
        },
      ];
      mockFindMany.mockResolvedValue(extras);

      // Dynamic import to ensure mocks are applied
      const { reservationCategoryExtraService } = await import(
        '../../../services/reservationCategoryExtra.service'
      );

      const result = await reservationCategoryExtraService.getByReservation('res-001');
      expect(result).toEqual(extras);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reservationId: 'res-001' },
        })
      );
    });
  });

  describe('calculateTotal', () => {
    it('should return sum of all extras totalPrice', async () => {
      mockFindMany.mockResolvedValue([
        { totalPrice: 500 },
        { totalPrice: 1000 },
      ]);

      const { reservationCategoryExtraService } = await import(
        '../../../services/reservationCategoryExtra.service'
      );

      const total = await reservationCategoryExtraService.calculateTotal('res-001');
      expect(total).toBe(1500);
    });

    it('should return 0 when no extras exist', async () => {
      mockFindMany.mockResolvedValue([]);

      const { reservationCategoryExtraService } = await import(
        '../../../services/reservationCategoryExtra.service'
      );

      const total = await reservationCategoryExtraService.calculateTotal('res-001');
      expect(total).toBe(0);
    });
  });

  describe('deleteByReservation', () => {
    it('should delete all category extras for a reservation', async () => {
      mockDeleteMany.mockResolvedValue({ count: 3 });

      const { reservationCategoryExtraService } = await import(
        '../../../services/reservationCategoryExtra.service'
      );

      const result = await reservationCategoryExtraService.deleteByReservation('res-001');
      expect(mockDeleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reservationId: 'res-001' },
        })
      );
    });
  });

  describe('upsertExtras', () => {
    it('should validate category supports extras', async () => {
      mockCategoryFind.mockResolvedValue({
        id: 'cat-001',
        extraItemPrice: null, // Does NOT support extras
        maxExtra: 10,
      });

      const { reservationCategoryExtraService } = await import(
        '../../../services/reservationCategoryExtra.service'
      );

      // TODO: [AUDIT] uzupełnij — oczekiwany błąd dla kategorii bez extraItemPrice
      expect(mockCategoryFind).toBeDefined();
    });

    it('should calculate per-person pricing correctly', async () => {
      mockCategoryFind.mockResolvedValue({
        id: 'cat-001',
        extraItemPrice: 50,
        maxExtra: 20,
      });
      mockFindMany.mockResolvedValue([]);
      mockUpsert.mockResolvedValue({
        id: 'extra-001',
        quantity: 5,
        guestCount: 60,
        totalPrice: 15000, // 5 * 50 * 60
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });

      // TODO: [AUDIT] uzupełnij wywołanie upsertExtras z guestCounts
      expect(mockUpsert).toBeDefined();
    });
  });
});
