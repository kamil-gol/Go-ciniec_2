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
      const mockReservationFind = mock.reservation.findUnique as jest.Mock;
      mockReservationFind.mockResolvedValue({
        id: 'res-001',
        adults: 10,
        children: 5,
        toddlers: 2,
      });

      const mockCategoryFindMany = mock.packageCategorySettings.findMany || (jest.fn() as jest.Mock);
      mock.packageCategorySettings.findMany = jest.fn().mockResolvedValue([
        {
          id: 'cat-001',
          extraItemPrice: null, // Does NOT support extras
          maxExtra: 10,
          portionTarget: 'ALL',
        },
      ]);

      const { reservationCategoryExtraService } = await import(
        '../../../services/reservationCategoryExtra.service'
      );

      await expect(
        reservationCategoryExtraService.upsertExtras('res-001', [
          { packageCategoryId: 'cat-001', quantity: 2 },
        ])
      ).rejects.toThrow('Ta kategoria nie wspiera dodatkowych pozycji');
    });

    it('should calculate per-person pricing correctly', async () => {
      const mockReservationFind = mock.reservation.findUnique as jest.Mock;
      mockReservationFind.mockResolvedValue({
        id: 'res-001',
        adults: 10,
        children: 5,
        toddlers: 2,
      });

      const mockCategoryFindMany = mock.packageCategorySettings.findMany as jest.Mock;
      mockCategoryFindMany.mockResolvedValue([
        {
          id: 'cat-001',
          extraItemPrice: 50,
          maxExtra: 20,
          portionTarget: 'ALL',
        },
      ]);
      mockFindMany.mockResolvedValue([]);
      mockUpsert.mockResolvedValue({
        id: 'extra-001',
        packageCategoryId: 'cat-001',
        quantity: 5,
        pricePerItem: 50,
        guestCount: 17, // 10 + 5 + 2
        portionTarget: 'ALL',
        totalPrice: 4250, // 5 * 50 * 17
      });
      mockDeleteMany.mockResolvedValue({ count: 0 });

      const { reservationCategoryExtraService } = await import(
        '../../../services/reservationCategoryExtra.service'
      );

      const result = await reservationCategoryExtraService.upsertExtras(
        'res-001',
        [{ packageCategoryId: 'cat-001', quantity: 5 }],
        'user-123'
      );

      expect(result).toHaveLength(1);
      expect(result[0].guestCount).toBe(17);
      expect(result[0].totalPrice).toBe(4250);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            reservationId_packageCategoryId: {
              reservationId: 'res-001',
              packageCategoryId: 'cat-001',
            },
          },
        })
      );
    });
  });
});
