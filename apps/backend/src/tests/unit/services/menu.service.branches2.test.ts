/**
 * MenuService — Branch Coverage (lines 294, 297: pricePerChild/pricePerToddler change)
 * NOTE: MenuOption & MenuPackageOption removed — assignOptionsToPackage/updateOption tests removed
 */
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    menuTemplate: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    menuPackage: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    menuPriceHistory: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn() },
    reservationMenuSnapshot: { count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn((fns: any[]) => Promise.all(fns)),
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({}),
}));

import { MenuService } from '../../../services/menu.service';
import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma as any;
const USER = 'u1';

beforeEach(() => jest.resetAllMocks());

const makeCurrentPkg = () => ({
  name: 'Gold',
  pricePerAdult: { toNumber: () => 200 },
  pricePerChild: { toNumber: () => 100 },
  pricePerToddler: { toNumber: () => 0 },
});

const updatedPkg = { id: 'p1', name: 'Gold', menuTemplate: {}, categorySettings: [] };

describe('MenuService — updatePackage pricePerChild/pricePerToddler branches', () => {

  it('should detect pricePerChild change and create price history', async () => {
    const service = new MenuService();
    mockPrisma.menuPackage.findUnique.mockResolvedValueOnce(makeCurrentPkg());
    mockPrisma.menuPackage.update.mockResolvedValue(updatedPkg);
    mockPrisma.menuPriceHistory.create.mockResolvedValue({});

    await service.updatePackage('p1', { pricePerChild: 150 } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fieldName: 'pricePerChild', oldValue: 100, newValue: 150 }),
      })
    );
  });

  it('should detect pricePerToddler change and create price history', async () => {
    const service = new MenuService();
    mockPrisma.menuPackage.findUnique.mockResolvedValueOnce(makeCurrentPkg());
    mockPrisma.menuPackage.update.mockResolvedValue(updatedPkg);
    mockPrisma.menuPriceHistory.create.mockResolvedValue({});

    await service.updatePackage('p1', { pricePerToddler: 50 } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fieldName: 'pricePerToddler', oldValue: 0, newValue: 50 }),
      })
    );
  });

  it('should detect all three price changes at once', async () => {
    const service = new MenuService();
    mockPrisma.menuPackage.findUnique.mockResolvedValueOnce(makeCurrentPkg());
    mockPrisma.menuPackage.update.mockResolvedValue(updatedPkg);
    mockPrisma.menuPriceHistory.create.mockResolvedValue({});

    await service.updatePackage('p1', {
      pricePerAdult: 250, pricePerChild: 130, pricePerToddler: 20,
    } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledTimes(3);
  });

  it('should NOT create price history when prices unchanged', async () => {
    const service = new MenuService();
    mockPrisma.menuPackage.findUnique.mockResolvedValueOnce(makeCurrentPkg());
    mockPrisma.menuPackage.update.mockResolvedValue(updatedPkg);
    mockPrisma.menuPriceHistory.create.mockResolvedValue({});

    await service.updatePackage('p1', {
      pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
    } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).not.toHaveBeenCalled();
  });
});

describe('MenuService — getPackagesByEventType empty templates', () => {

  it('should return empty array when no templates found', async () => {
    const service = new MenuService();
    mockPrisma.menuTemplate.findMany.mockResolvedValue([]);
    const result = await service.getPackagesByEventType('et-nonexistent');
    expect(result).toEqual([]);
  });
});
