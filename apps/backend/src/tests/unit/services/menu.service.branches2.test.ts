/**
 * MenuService — Branch Coverage (lines 294, 297: pricePerChild/pricePerToddler change)
 */
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    menuTemplate: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    menuPackage: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    menuOption: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    menuPackageOption: { deleteMany: jest.fn(), create: jest.fn(), createMany: jest.fn() },
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
const service = new MenuService();
const USER = 'u1';

beforeEach(() => jest.clearAllMocks());

describe('MenuService — updatePackage pricePerChild/pricePerToddler branches', () => {

  const currentPkg = {
    name: 'Gold',
    pricePerAdult: { toNumber: () => 200 },
    pricePerChild: { toNumber: () => 100 },
    pricePerToddler: { toNumber: () => 0 },
  };

  it('should detect pricePerChild change and create price history', async () => {
    mockPrisma.menuPackage.findUnique
      .mockResolvedValueOnce(currentPkg)
      .mockResolvedValueOnce({ ...currentPkg, id: 'p1', menuTemplate: {}, packageOptions: [], categorySettings: [] });
    mockPrisma.menuPackage.update.mockResolvedValue({ id: 'p1', name: 'Gold', menuTemplate: {}, packageOptions: [], categorySettings: [] });

    await service.updatePackage('p1', { pricePerChild: 150 } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fieldName: 'pricePerChild', oldValue: 100, newValue: 150 }),
      })
    );
  });

  it('should detect pricePerToddler change and create price history', async () => {
    mockPrisma.menuPackage.findUnique
      .mockResolvedValueOnce(currentPkg)
      .mockResolvedValueOnce({ id: 'p1', menuTemplate: {}, packageOptions: [], categorySettings: [] });
    mockPrisma.menuPackage.update.mockResolvedValue({ id: 'p1', name: 'Gold', menuTemplate: {}, packageOptions: [], categorySettings: [] });

    await service.updatePackage('p1', { pricePerToddler: 50 } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fieldName: 'pricePerToddler', oldValue: 0, newValue: 50 }),
      })
    );
  });

  it('should detect all three price changes at once', async () => {
    mockPrisma.menuPackage.findUnique
      .mockResolvedValueOnce(currentPkg)
      .mockResolvedValueOnce({ id: 'p1', menuTemplate: {}, packageOptions: [], categorySettings: [] });
    mockPrisma.menuPackage.update.mockResolvedValue({ id: 'p1', name: 'Gold', menuTemplate: {}, packageOptions: [], categorySettings: [] });

    await service.updatePackage('p1', {
      pricePerAdult: 250, pricePerChild: 130, pricePerToddler: 20,
    } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledTimes(3);
  });

  it('should NOT create price history when prices unchanged', async () => {
    mockPrisma.menuPackage.findUnique
      .mockResolvedValueOnce(currentPkg)
      .mockResolvedValueOnce({ id: 'p1', menuTemplate: {}, packageOptions: [], categorySettings: [] });
    mockPrisma.menuPackage.update.mockResolvedValue({ id: 'p1', name: 'Gold', menuTemplate: {}, packageOptions: [], categorySettings: [] });

    await service.updatePackage('p1', { pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0 } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).not.toHaveBeenCalled();
  });
});

describe('MenuService — assignOptionsToPackage branches', () => {

  it('should use defaults for isRequired/isDefault/displayOrder when not provided', async () => {
    mockPrisma.menuPackageOption.deleteMany.mockResolvedValue({});
    mockPrisma.menuPackageOption.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.menuPackage.findUnique.mockResolvedValue({
      id: 'p1', menuTemplate: {}, packageOptions: [], categorySettings: [],
    });

    await service.assignOptionsToPackage('p1', {
      options: [{ optionId: 'o1' }],
    } as any);

    const createCall = mockPrisma.menuPackageOption.createMany.mock.calls[0][0];
    expect(createCall.data[0].isRequired).toBe(false);
    expect(createCall.data[0].isDefault).toBe(false);
    expect(createCall.data[0].displayOrder).toBe(0);
  });

  it('should use provided values for isRequired/isDefault/displayOrder', async () => {
    mockPrisma.menuPackageOption.deleteMany.mockResolvedValue({});
    mockPrisma.menuPackageOption.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.menuPackage.findUnique.mockResolvedValue({
      id: 'p1', menuTemplate: {}, packageOptions: [], categorySettings: [],
    });

    await service.assignOptionsToPackage('p1', {
      options: [
        { optionId: 'o1', isRequired: true, isDefault: true, displayOrder: 5, customPrice: 15 },
      ],
    } as any);

    const createCall = mockPrisma.menuPackageOption.createMany.mock.calls[0][0];
    expect(createCall.data[0].isRequired).toBe(true);
    expect(createCall.data[0].isDefault).toBe(true);
    expect(createCall.data[0].displayOrder).toBe(5);
    expect(createCall.data[0].customPrice).toBe(15);
  });
});

describe('MenuService — updateOption priceAmount change branch', () => {

  it('should create price history when priceAmount changes', async () => {
    mockPrisma.menuOption.findUnique.mockResolvedValue({ name: 'Extra cheese', priceAmount: { toNumber: () => 10 } });
    mockPrisma.menuOption.update.mockResolvedValue({ id: 'o1', name: 'Extra cheese' });

    await service.updateOption('o1', { priceAmount: 15 } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fieldName: 'priceAmount', oldValue: 10, newValue: 15 }),
      })
    );
  });

  it('should NOT create price history when priceAmount unchanged', async () => {
    mockPrisma.menuOption.findUnique.mockResolvedValue({ name: 'Extra cheese', priceAmount: { toNumber: () => 10 } });
    mockPrisma.menuOption.update.mockResolvedValue({ id: 'o1', name: 'Extra cheese' });

    await service.updateOption('o1', { priceAmount: 10 } as any, USER);

    expect(mockPrisma.menuPriceHistory.create).not.toHaveBeenCalled();
  });
});

describe('MenuService — getPackagesByEventType empty templates', () => {

  it('should return empty array when no templates found', async () => {
    mockPrisma.menuTemplate.findMany.mockResolvedValue([]);
    const result = await service.getPackagesByEventType('et-nonexistent');
    expect(result).toEqual([]);
  });
});
