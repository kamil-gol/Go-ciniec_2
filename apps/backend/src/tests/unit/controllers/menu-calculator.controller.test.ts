/**
 * Menu Calculator Controller — Comprehensive Unit Tests
 * Targets ~47% branches. Covers: calculatePrice validation + all 5 price types
 * + warnings + customPrice, getAvailablePackages with/without date,
 * calculateOptionPrice all price types + missing option.
 */

import { Request, Response } from 'express';

const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      menuPackage: { findUnique: mockFindUnique, findMany: mockFindMany },
      menuOption: { findMany: mockFindMany, findUnique: mockFindUnique },
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

const makeOption = (id: string, priceType: string, priceAmount: number) => ({
  id, name: `Opt-${id}`, category: 'GENERAL', priceType,
  priceAmount: dec(priceAmount), isActive: true,
});

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

    it('should calculate basic package price without options', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue({ ...PKG, minGuests: null, maxGuests: null });
      await calculatePrice({ body: { packageId: 'pkg-1', adults: 50, children: 10, toddlers: 5 } } as Request, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.priceBreakdown.adultsSubtotal).toBe(10000);
      expect(data.priceBreakdown.childrenSubtotal).toBe(1000);
      expect(data.priceBreakdown.toddlersSubtotal).toBe(0);
      expect(data.optionsTotal).toBe(0);
      expect(data.warnings).toBeUndefined();
    });

    it('should calculate all price types for options', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue({ ...PKG, minGuests: null, maxGuests: null });
      mockFindMany.mockResolvedValue([
        makeOption('o1', 'PER_PERSON', 10),
        makeOption('o2', 'PER_ADULT', 20),
        makeOption('o3', 'PER_CHILD', 15),
        makeOption('o4', 'PER_GUEST_TYPE', 30),
        makeOption('o5', 'FLAT_FEE', 500),
      ]);
      await calculatePrice({
        body: {
          packageId: 'pkg-1', adults: 10, children: 5, toddlers: 0,
          selectedOptions: [
            { optionId: 'o1', quantity: 1 },  // PER_PERSON: 10 * 15 * 1 = 150
            { optionId: 'o2', quantity: 1 },  // PER_ADULT: 20 * 10 * 1 = 200
            { optionId: 'o3', quantity: 1 },  // PER_CHILD: 15 * 5 * 1 = 75
            { optionId: 'o4', quantity: 1 },  // PER_GUEST_TYPE: (30*10 + 30*0.5*5)*1 = 375
            { optionId: 'o5', quantity: 2 },  // FLAT_FEE: 500 * 2 = 1000
          ],
        },
      } as Request, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.optionsDetails).toHaveLength(5);
      expect(data.optionsDetails[0].calculatedPrice).toBe(150);
      expect(data.optionsDetails[1].calculatedPrice).toBe(200);
      expect(data.optionsDetails[2].calculatedPrice).toBe(75);
      expect(data.optionsDetails[3].calculatedPrice).toBe(375);
      expect(data.optionsDetails[4].calculatedPrice).toBe(1000);
    });

    it('should warn on missing option and use customPrice', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue({ ...PKG, minGuests: null, maxGuests: null });
      mockFindMany.mockResolvedValue([
        makeOption('o1', 'FLAT_FEE', 500),
      ]);
      await calculatePrice({
        body: {
          packageId: 'pkg-1', adults: 10, children: 0, toddlers: 0,
          selectedOptions: [
            { optionId: 'o1', quantity: 1, customPrice: 999 },
            { optionId: 'missing', quantity: 1 },
          ],
        },
      } as Request, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.optionsDetails[0].calculatedPrice).toBe(999); // customPrice
      expect(data.warnings[0]).toContain('missing');
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

    it('should return 500 on error', async () => {
      const res = mockRes();
      mockFindMany.mockRejectedValue(new Error('DB'));
      await getAvailablePackages({ query: { eventTypeId: 'et1' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== calculateOptionPrice ==========
  describe('calculateOptionPrice()', () => {
    it('should return 400 when adults missing', async () => {
      const res = mockRes();
      await calculateOptionPrice({ params: { optionId: 'o1' }, query: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when option not found', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue(null);
      await calculateOptionPrice({ params: { optionId: 'o1' }, query: { adults: '10' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when option inactive', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue({ ...makeOption('o1', 'FLAT_FEE', 100), isActive: false });
      await calculateOptionPrice({ params: { optionId: 'o1' }, query: { adults: '10' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should calculate PER_PERSON', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue(makeOption('o1', 'PER_PERSON', 50));
      await calculateOptionPrice({
        params: { optionId: 'o1' },
        query: { adults: '10', children: '5', toddlers: '0', quantity: '1' },
      } as any, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.calculatedPrice).toBe(750); // 50 * 15 * 1
    });

    it('should calculate PER_ADULT', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue(makeOption('o1', 'PER_ADULT', 20));
      await calculateOptionPrice({
        params: { optionId: 'o1' },
        query: { adults: '10', children: '5' },
      } as any, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.calculatedPrice).toBe(200); // 20 * 10 * 1
    });

    it('should calculate PER_CHILD', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue(makeOption('o1', 'PER_CHILD', 15));
      await calculateOptionPrice({
        params: { optionId: 'o1' },
        query: { adults: '10', children: '5' },
      } as any, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.calculatedPrice).toBe(75); // 15 * 5 * 1
    });

    it('should calculate PER_GUEST_TYPE', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue(makeOption('o1', 'PER_GUEST_TYPE', 30));
      await calculateOptionPrice({
        params: { optionId: 'o1' },
        query: { adults: '10', children: '5', quantity: '2' },
      } as any, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.calculatedPrice).toBe(750); // (30*10 + 30*0.5*5)*2 = 375*2
    });

    it('should calculate FLAT_FEE', async () => {
      const res = mockRes();
      mockFindUnique.mockResolvedValue(makeOption('o1', 'FLAT_FEE', 500));
      await calculateOptionPrice({
        params: { optionId: 'o1' },
        query: { adults: '10', quantity: '3' },
      } as any, res);
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.calculatedPrice).toBe(1500); // 500 * 3
    });

    it('should return 500 on error', async () => {
      const res = mockRes();
      mockFindUnique.mockRejectedValue(new Error('DB'));
      await calculateOptionPrice({ params: { optionId: 'o1' }, query: { adults: '10' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
