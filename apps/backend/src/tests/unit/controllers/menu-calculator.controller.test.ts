/**
 * Menu Calculator Controller — Unit Tests (updated after MenuOption removal)
 * Tests calculatePrice (package-only), getAvailablePackages, calculateOptionPrice (410 Gone)
 */

import { Request, Response } from 'express';

const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();

jest.mock('@/prisma-client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      menuPackage: { findUnique: mockFindUnique, findMany: mockFindMany },
    })),
    Decimal: jest.fn(),
  };
});

import { calculatePrice, getAvailablePackages, calculateOptionPrice } from '../../../controllers/menu-calculator.controller';

const mockRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res as Response;
};

const dec = (v: number) => ({ toString: () => String(v) });

const PKG = {
  id: 'pkg-1', name: 'Gold', minGuests: 20, maxGuests: 200,
  pricePerAdult: dec(200), pricePerChild: dec(100), pricePerToddler: dec(0),
  menuTemplate: { eventType: { name: 'Wesele' } },
};

beforeEach(() => jest.clearAllMocks());

describe('menu-calculator.controller', () => {
  // ========== calculatePrice ==========
  describe('calculatePrice()', () => {
    it('should return 400 when packageId missing', async () => {
      const res = mockRes();
      await calculatePrice({ body: {} } as Request, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when totalGuests is 0', async () => {
      const res = mockRes();
      await calculatePrice({ body: { packageId: 'p1' } } as Request, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when package not found', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue(null);
      await calculatePrice({ body: { packageId: 'p1', adults: 10 } } as Request, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should warn when below minGuests', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue(PKG);
      await calculatePrice({ body: { packageId: 'pkg-1', adults: 5, children: 0, toddlers: 0 } } as Request, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.warnings).toBeDefined();
      expect(data.warnings[0]).toContain('minimum');
    });

    it('should warn when above maxGuests', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue(PKG);
      await calculatePrice({ body: { packageId: 'pkg-1', adults: 250, children: 0, toddlers: 0 } } as Request, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.warnings[0]).toContain('maximum');
    });

    it('should calculate basic package price (no options)', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue({ ...PKG, minGuests: null, maxGuests: null });
      await calculatePrice({ body: { packageId: 'pkg-1', adults: 50, children: 10, toddlers: 5 } } as Request, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.priceBreakdown.adultsSubtotal).toBe(10000);
      expect(data.priceBreakdown.childrenSubtotal).toBe(1000);
      expect(data.priceBreakdown.toddlersSubtotal).toBe(0);
      expect(data.optionsTotal).toBe(0);
      expect(data.optionsDetails).toEqual([]);
      expect(data.grandTotal).toBe(11000);
      expect(data.warnings).toBeUndefined();
    });

    it('should return correct averagePerGuest', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue({ ...PKG, minGuests: null, maxGuests: null });
      await calculatePrice({ body: { packageId: 'pkg-1', adults: 10, children: 0, toddlers: 0 } } as Request, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.averagePerGuest).toBe(200); // 2000 / 10
    });

    it('should return 500 on error', async () => {
      const res = mockRes();
      mockFindUnique.mockRejectedValue(new Error('DB'));
      await calculatePrice({ body: { packageId: 'p1', adults: 1 } } as Request, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== getAvailablePackages ==========
  describe('getAvailablePackages()', () => {
    it('should return 400 when eventTypeId missing', async () => {
      const res = mockRes();
      await getAvailablePackages({ query: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return packages without date filter', async () => {
      const res = mockRes();
      mockFindMany.mockResolvedValue([{ id: 'p1' }]);
      await getAvailablePackages({ query: { eventTypeId: 'et1' } } as any, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.count).toBe(1);
      expect(data.date).toBeNull();
    });

    it('should filter by date when provided', async () => {
      const res = mockRes();
      mockFindMany.mockResolvedValue([]);
      await getAvailablePackages({ query: { eventTypeId: 'et1', date: '2026-06-15' } } as any, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.date).toBe('2026-06-15');
    });

    it('should pass date OR clause when date provided', async () => {
      const res = mockRes();
      mockFindMany.mockResolvedValue([]);
      await getAvailablePackages({ query: { eventTypeId: 'e1', date: '2026-06-15' } } as any, res);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            menuTemplate: expect.objectContaining({
              eventTypeId: 'e1',
              isActive: true,
              OR: expect.arrayContaining([
                { validFrom: null, validTo: null },
              ]),
            }),
          }),
        })
      );
    });

    it('should return 500 on error', async () => {
      const res = mockRes();
      mockFindMany.mockRejectedValue(new Error('DB'));
      await getAvailablePackages({ query: { eventTypeId: 'et1' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== calculateOptionPrice (DEPRECATED — 410 Gone) ==========
  describe('calculateOptionPrice()', () => {
    it('should return 410 Gone (MenuOption model removed)', async () => {
      const res = mockRes();
      await calculateOptionPrice({ params: { optionId: 'o1' }, query: { adults: '10' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(410);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.error).toContain('MenuOption');
    });
  });
});
