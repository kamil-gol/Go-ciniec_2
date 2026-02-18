/**
 * MenuCalculatorController — Unit Tests
 * Uses new PrismaClient() directly.
 */
const mockPrisma = {
  menuPackage: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  menuOption: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Decimal: jest.fn(),
}));

import { calculatePrice, getAvailablePackages, calculateOptionPrice } from '../../../controllers/menu-calculator.controller';

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
  ...overrides,
});
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('MenuCalculatorController', () => {
  describe('calculatePrice()', () => {
    it('should return 400 when packageId missing', async () => {
      const response = res();
      await calculatePrice(req({ body: {} }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when no guests', async () => {
      const response = res();
      await calculatePrice(req({ body: { packageId: 'p-1', adults: 0, children: 0, toddlers: 0 } }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      const response = res();
      await calculatePrice(req({ body: { packageId: 'x', adults: 10 } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return price calculation', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({
        id: 'p-1', name: 'Gold',
        pricePerAdult: { toString: () => '200' },
        pricePerChild: { toString: () => '100' },
        pricePerToddler: { toString: () => '0' },
        minGuests: null, maxGuests: null,
        menuTemplate: { eventType: { name: 'Wesele' } },
      });
      const response = res();
      await calculatePrice(
        req({ body: { packageId: 'p-1', adults: 50, children: 10, toddlers: 5 } }), response
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          grandTotal: expect.any(Number),
          totalGuests: 65,
        })
      );
    });
  });

  describe('getAvailablePackages()', () => {
    it('should return 400 when eventTypeId missing', async () => {
      const response = res();
      await getAvailablePackages(req({ query: {} }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return packages', async () => {
      mockPrisma.menuPackage.findMany.mockResolvedValue([{ id: 'p-1' }]);
      const response = res();
      await getAvailablePackages(req({ query: { eventTypeId: 'et-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 })
      );
    });
  });

  describe('calculateOptionPrice()', () => {
    it('should return 400 when adults missing', async () => {
      const response = res();
      await calculateOptionPrice(req({ params: { optionId: 'o-1' }, query: {} }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when option not found', async () => {
      mockPrisma.menuOption.findUnique.mockResolvedValue(null);
      const response = res();
      await calculateOptionPrice(
        req({ params: { optionId: 'x' }, query: { adults: '10' } }), response
      );
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return price for FLAT_FEE option', async () => {
      mockPrisma.menuOption.findUnique.mockResolvedValue({
        id: 'o-1', name: 'DJ', isActive: true,
        priceType: 'FLAT_FEE',
        priceAmount: { toString: () => '1500' },
      });
      const response = res();
      await calculateOptionPrice(
        req({ params: { optionId: 'o-1' }, query: { adults: '50', quantity: '1' } }), response
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ calculatedPrice: 1500 })
      );
    });
  });
});
