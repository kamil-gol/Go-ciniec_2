/**
 * AddonGroupService — Branch Coverage (lines 98-105: assignDishes)
 */
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    addonGroup: {
      findMany: jest.fn(), findUnique: jest.fn(),
      create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    },
    addonGroupDish: {
      deleteMany: jest.fn().mockResolvedValue({}),
      create: jest.fn(), findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { addonGroupService } from '../../../services/addonGroup.service';
import { prisma } from '../../../lib/prisma';
const mockPrisma = prisma as any;

beforeEach(() => jest.clearAllMocks());

describe('AddonGroupService — assignDishes branches', () => {

  it('should throw when group not found in assignDishes', async () => {
    mockPrisma.addonGroup.findUnique.mockResolvedValue(null);
    await expect(addonGroupService.assignDishes('bad-id', { dishes: [] }))
      .rejects.toThrow('Addon group not found');
  });

  it('should assign dishes with customPrice and displayOrder provided', async () => {
    mockPrisma.addonGroup.findUnique.mockResolvedValue({ id: 'g1' });
    mockPrisma.addonGroupDish.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...data, id: 'agd-1', dish: { id: data.dishId, name: 'Dish' } })
    );

    const result = await addonGroupService.assignDishes('g1', {
      dishes: [
        { dishId: 'd1', customPrice: 25.50, displayOrder: 3 },
        { dishId: 'd2', customPrice: null, displayOrder: 1 },
      ],
    });

    expect(result).toHaveLength(2);
    const firstCall = mockPrisma.addonGroupDish.create.mock.calls[0][0].data;
    expect(firstCall.customPrice).toBe(25.50);
    expect(firstCall.displayOrder).toBe(3);
  });

  it('should use null/index defaults when customPrice/displayOrder not provided', async () => {
    mockPrisma.addonGroup.findUnique.mockResolvedValue({ id: 'g1' });
    mockPrisma.addonGroupDish.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...data, id: 'agd-1', dish: { id: data.dishId } })
    );

    await addonGroupService.assignDishes('g1', {
      dishes: [{ dishId: 'd1' }],
    });

    const call = mockPrisma.addonGroupDish.create.mock.calls[0][0].data;
    expect(call.customPrice).toBeNull();
    expect(call.displayOrder).toBe(0);
  });

  it('should throw when dish not found in removeDish', async () => {
    mockPrisma.addonGroupDish.findFirst.mockResolvedValue(null);
    await expect(addonGroupService.removeDish('g1', 'd-bad'))
      .rejects.toThrow('Dish not found in addon group');
  });

  it('should successfully remove a dish', async () => {
    mockPrisma.addonGroupDish.findFirst.mockResolvedValue({ id: 'agd-1' });
    mockPrisma.addonGroupDish.delete.mockResolvedValue({});
    const result = await addonGroupService.removeDish('g1', 'd1');
    expect(result).toEqual({ success: true });
  });
});
