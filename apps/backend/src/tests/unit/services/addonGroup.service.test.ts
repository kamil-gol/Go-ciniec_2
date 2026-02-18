/**
 * AddonGroupService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    addonGroup: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    addonGroupDish: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

import { addonGroupService } from '../../../services/addonGroup.service';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as any;

const DISH = { id: 'dish-001', name: 'Tartare' };
const GROUP = {
  id: 'ag-001', name: 'Dodatki', description: 'Wybierz dodatek',
  minSelect: 0, maxSelect: 3, priceType: 'FIXED', basePrice: 0,
  icon: null, displayOrder: 0, isActive: true,
  addons: [{ id: 'agd-001', dishId: 'dish-001', customPrice: null, displayOrder: 0, dish: DISH }],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.addonGroup.findMany.mockResolvedValue([GROUP]);
  mockPrisma.addonGroup.findUnique.mockResolvedValue(GROUP);
  mockPrisma.addonGroup.create.mockResolvedValue(GROUP);
  mockPrisma.addonGroup.update.mockResolvedValue(GROUP);
  mockPrisma.addonGroup.delete.mockResolvedValue(GROUP);
  mockPrisma.addonGroupDish.deleteMany.mockResolvedValue({ count: 1 });
  mockPrisma.addonGroupDish.create.mockResolvedValue({ id: 'agd-new', dishId: 'dish-001', dish: DISH });
  mockPrisma.addonGroupDish.findFirst.mockResolvedValue({ id: 'agd-001' });
  mockPrisma.addonGroupDish.delete.mockResolvedValue({});
});

describe('AddonGroupService', () => {
  describe('list()', () => {
    it('should return groups with addons', async () => {
      const result = await addonGroupService.list();
      expect(result).toHaveLength(1);
      expect(result[0].addons).toHaveLength(1);
    });

    it('should apply filters', async () => {
      await addonGroupService.list({ isActive: true, search: 'Dod' });
      const call = mockPrisma.addonGroup.findMany.mock.calls[0][0];
      expect(call.where.isActive).toBe(true);
      expect(call.where.OR).toHaveLength(2);
    });
  });

  describe('getById()', () => {
    it('should return group', async () => {
      const result = await addonGroupService.getById('ag-001');
      expect(result.name).toBe('Dodatki');
    });

    it('should throw when not found', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(null);
      await expect(addonGroupService.getById('x')).rejects.toThrow(/not found/);
    });
  });

  describe('create()', () => {
    it('should create group with defaults', async () => {
      await addonGroupService.create({ name: 'New', priceType: 'FIXED' });
      const data = mockPrisma.addonGroup.create.mock.calls[0][0].data;
      expect(data.name).toBe('New');
      expect(data.minSelect).toBe(0);
      expect(data.maxSelect).toBe(1);
      expect(data.isActive).toBe(true);
    });
  });

  describe('update()', () => {
    it('should update group', async () => {
      await addonGroupService.update('ag-001', { name: 'Updated' });
      expect(mockPrisma.addonGroup.update).toHaveBeenCalledTimes(1);
    });

    it('should throw when not found', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(null);
      await expect(addonGroupService.update('x', { name: 'A' })).rejects.toThrow(/not found/);
    });
  });

  describe('delete()', () => {
    it('should delete and return success', async () => {
      const result = await addonGroupService.delete('ag-001');
      expect(result.success).toBe(true);
    });
  });

  describe('assignDishes()', () => {
    it('should clear existing and create new assignments', async () => {
      await addonGroupService.assignDishes('ag-001', {
        dishes: [{ dishId: 'dish-001' }, { dishId: 'dish-002' }],
      });
      expect(mockPrisma.addonGroupDish.deleteMany).toHaveBeenCalledWith({ where: { groupId: 'ag-001' } });
      expect(mockPrisma.addonGroupDish.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeDish()', () => {
    it('should remove dish from group', async () => {
      const result = await addonGroupService.removeDish('ag-001', 'dish-001');
      expect(result.success).toBe(true);
    });

    it('should throw when dish not in group', async () => {
      mockPrisma.addonGroupDish.findFirst.mockResolvedValue(null);
      await expect(addonGroupService.removeDish('ag-001', 'bad')).rejects.toThrow(/not found/);
    });
  });
});
