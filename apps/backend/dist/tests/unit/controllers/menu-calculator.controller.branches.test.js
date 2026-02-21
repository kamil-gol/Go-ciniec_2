/**
 * MenuCalculator Controller — branch coverage
 * Uncovered lines: 174, 191, 254, 328
 *   174: calculatePrice switch → PER_ADULT
 *   191: calculatePrice switch → PER_GUEST_TYPE
 *   254: getAvailablePackages → date filter
 *   328: calculateOptionPrice switch → PER_GUEST_TYPE
 */
const mockMenuPackageFindUnique = jest.fn();
const mockMenuPackageFindMany = jest.fn();
const mockMenuOptionFindMany = jest.fn();
const mockMenuOptionFindUnique = jest.fn();
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            menuPackage: {
                findUnique: mockMenuPackageFindUnique,
                findMany: mockMenuPackageFindMany,
            },
            menuOption: {
                findMany: mockMenuOptionFindMany,
                findUnique: mockMenuOptionFindUnique,
            },
        })),
        Decimal: jest.fn().mockImplementation((val) => ({
            toString: () => val,
        })),
    };
});
import { calculatePrice, getAvailablePackages, calculateOptionPrice } from '../../../controllers/menu-calculator.controller';
const mockReq = (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    ...overrides,
});
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const makeDecimal = (val) => ({ toString: () => val.toString() });
const basePkg = {
    id: 'pkg-1',
    name: 'Standard',
    minGuests: null,
    maxGuests: null,
    pricePerAdult: makeDecimal(200),
    pricePerChild: makeDecimal(100),
    pricePerToddler: makeDecimal(0),
    menuTemplate: { eventType: { id: 'e1' } },
};
beforeEach(() => jest.clearAllMocks());
// === calculatePrice: PER_ADULT case ===
describe('calculatePrice — PER_ADULT option', () => {
    it('should calculate PER_ADULT price (basePrice * adults * qty)', async () => {
        mockMenuPackageFindUnique.mockResolvedValue(basePkg);
        mockMenuOptionFindMany.mockResolvedValue([
            { id: 'opt-1', name: 'Wine', category: 'DRINK', priceType: 'PER_ADULT', priceAmount: makeDecimal(50), isActive: true },
        ]);
        const req = mockReq({
            body: {
                packageId: 'pkg-1',
                adults: 10,
                children: 5,
                toddlers: 2,
                selectedOptions: [{ optionId: 'opt-1', quantity: 1 }],
            },
        });
        const res = mockRes();
        await calculatePrice(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            optionsDetails: expect.arrayContaining([
                expect.objectContaining({
                    optionId: 'opt-1',
                    priceType: 'PER_ADULT',
                    calculatedPrice: 500, // 50 * 10 * 1
                }),
            ]),
        }));
    });
});
// === calculatePrice: PER_GUEST_TYPE case ===
describe('calculatePrice — PER_GUEST_TYPE option', () => {
    it('should calculate PER_GUEST_TYPE price (adults full + children 50%)', async () => {
        mockMenuPackageFindUnique.mockResolvedValue(basePkg);
        mockMenuOptionFindMany.mockResolvedValue([
            { id: 'opt-2', name: 'Dessert', category: 'FOOD', priceType: 'PER_GUEST_TYPE', priceAmount: makeDecimal(40), isActive: true },
        ]);
        const req = mockReq({
            body: {
                packageId: 'pkg-1',
                adults: 10,
                children: 6,
                toddlers: 0,
                selectedOptions: [{ optionId: 'opt-2', quantity: 2 }],
            },
        });
        const res = mockRes();
        await calculatePrice(req, res);
        // (40*10 + 40*0.5*6) * 2 = (400 + 120) * 2 = 1040
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            optionsDetails: expect.arrayContaining([
                expect.objectContaining({
                    optionId: 'opt-2',
                    priceType: 'PER_GUEST_TYPE',
                    calculatedPrice: 1040,
                }),
            ]),
        }));
    });
});
// === getAvailablePackages: date filter ===
describe('getAvailablePackages — with date filter', () => {
    it('should pass date OR clause when date query param provided', async () => {
        mockMenuPackageFindMany.mockResolvedValue([]);
        const req = mockReq({
            query: { eventTypeId: 'e1', date: '2026-06-15' },
        });
        const res = mockRes();
        await getAvailablePackages(req, res);
        expect(mockMenuPackageFindMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                menuTemplate: expect.objectContaining({
                    eventTypeId: 'e1',
                    isActive: true,
                    OR: expect.arrayContaining([
                        { validFrom: null, validTo: null },
                    ]),
                }),
            }),
        }));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            date: '2026-06-15',
            count: 0,
        }));
    });
});
// === calculateOptionPrice: PER_GUEST_TYPE case ===
describe('calculateOptionPrice — PER_GUEST_TYPE', () => {
    it('should calculate PER_GUEST_TYPE for single option endpoint', async () => {
        mockMenuOptionFindUnique.mockResolvedValue({
            id: 'opt-3',
            name: 'Cake',
            priceType: 'PER_GUEST_TYPE',
            priceAmount: makeDecimal(30),
            isActive: true,
        });
        const req = mockReq({
            params: { optionId: 'opt-3' },
            query: { adults: '20', children: '10', toddlers: '0', quantity: '1' },
        });
        const res = mockRes();
        await calculateOptionPrice(req, res);
        // (30*20 + 30*0.5*10) * 1 = (600 + 150) * 1 = 750
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            optionId: 'opt-3',
            priceType: 'PER_GUEST_TYPE',
            calculatedPrice: 750,
        }));
    });
    it('should calculate PER_ADULT for single option endpoint', async () => {
        mockMenuOptionFindUnique.mockResolvedValue({
            id: 'opt-4',
            name: 'Champagne',
            priceType: 'PER_ADULT',
            priceAmount: makeDecimal(80),
            isActive: true,
        });
        const req = mockReq({
            params: { optionId: 'opt-4' },
            query: { adults: '15', children: '5', toddlers: '0', quantity: '2' },
        });
        const res = mockRes();
        await calculateOptionPrice(req, res);
        // 80 * 15 * 2 = 2400
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            optionId: 'opt-4',
            priceType: 'PER_ADULT',
            calculatedPrice: 2400,
        }));
    });
    it('should calculate PER_CHILD for single option endpoint', async () => {
        mockMenuOptionFindUnique.mockResolvedValue({
            id: 'opt-5',
            name: 'Kid Meal',
            priceType: 'PER_CHILD',
            priceAmount: makeDecimal(25),
            isActive: true,
        });
        const req = mockReq({
            params: { optionId: 'opt-5' },
            query: { adults: '10', children: '8', toddlers: '3', quantity: '1' },
        });
        const res = mockRes();
        await calculateOptionPrice(req, res);
        // 25 * 8 * 1 = 200
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            optionId: 'opt-5',
            priceType: 'PER_CHILD',
            calculatedPrice: 200,
        }));
    });
});
//# sourceMappingURL=menu-calculator.controller.branches.test.js.map