/**
 * Unit tests for addonGroup.service.ts
 * Covers: list, getById, create, update, delete, assignDishes, removeDish
 * Issue: #98
 */

const mockPrisma = {
  addonGroup: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  addonGroupDish: {
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { addonGroupService } from '@services/addonGroup.service';

const mockGroup = {
  id: 'grp-1', name: 'Dodatki mięsne', description: 'Ekstra mięsa',
  minSelect: 0, maxSelect: 3, priceType: 'PER_ITEM', basePrice: 25,
  icon: 'meat', displayOrder: 0, isActive: true,
  addons: [{ id: 'ad-1', dishId: 'dish-1', customPrice: null, displayOrder: 0, dish: { id: 'dish-1', name: 'Stek' } }],
};

describe('AddonGroupService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('should return addon groups with filters', async () => {
      mockPrisma.addonGroup.findMany.mockResolvedValue([mockGroup]);
      const result = await addonGroupService.list({ isActive: true });
      expect(result).toHaveLength(1);
    });

    it('should apply search filter', async () => {
      mockPrisma.addonGroup.findMany.mockResolvedValue([]);
      await addonGroupService.list({ search: 'mięs' });
      expect(mockPrisma.addonGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
      );
    });
  });

  describe('getById', () => {
    it('should return group with addons', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(mockGroup);
      const result = await addonGroupService.getById('grp-1');
      expect(result.id).toBe('grp-1');
      expect(result.addons).toHaveLength(1);
    });

    it('should throw when not found', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(null);
      await expect(addonGroupService.getById('x')).rejects.toThrow('Addon group not found');
    });
  });

  describe('create', () => {
    it('should create group with defaults', async () => {
      mockPrisma.addonGroup.create.mockResolvedValue(mockGroup);
      const result = await addonGroupService.create({ name: 'Dodatki mięsne', priceType: 'PER_ITEM' });
      expect(result.id).toBe('grp-1');
      expect(mockPrisma.addonGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ minSelect: 0, maxSelect: 1, isActive: true })
        })
      );
    });
  });

  describe('update', () => {
    it('should update existing group', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(mockGroup);
      mockPrisma.addonGroup.update.mockResolvedValue({ ...mockGroup, name: 'Ryby' });
      const result = await addonGroupService.update('grp-1', { name: 'Ryby' });
      expect(result.name).toBe('Ryby');
    });

    it('should throw when group not found', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(null);
      await expect(addonGroupService.update('x', { name: 'Y' })).rejects.toThrow('Addon group not found');
    });
  });

  describe('delete', () => {
    it('should delete group', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(mockGroup);
      mockPrisma.addonGroup.delete.mockResolvedValue(undefined);
      const result = await addonGroupService.delete('grp-1');
      expect(result.success).toBe(true);
    });

    it('should throw when not found', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(null);
      await expect(addonGroupService.delete('x')).rejects.toThrow('Addon group not found');
    });
  });

  describe('assignDishes', () => {
    it('should replace all dishes in group', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(mockGroup);
      mockPrisma.addonGroupDish.deleteMany.mockResolvedValue({});
      mockPrisma.addonGroupDish.create.mockResolvedValue({ id: 'ad-new', dishId: 'dish-2', dish: { id: 'dish-2', name: 'Łosoś' } });

      const result = await addonGroupService.assignDishes('grp-1', {
        dishes: [{ dishId: 'dish-2', customPrice: 30 }],
      });

      expect(mockPrisma.addonGroupDish.deleteMany).toHaveBeenCalledWith({ where: { groupId: 'grp-1' } });
      expect(mockPrisma.addonGroupDish.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ groupId: 'grp-1', dishId: 'dish-2', customPrice: 30 })
        })
      );
    });

    it('should throw when group not found', async () => {
      mockPrisma.addonGroup.findUnique.mockResolvedValue(null);
      await expect(addonGroupService.assignDishes('x', { dishes: [] }))
        .rejects.toThrow('Addon group not found');
    });
  });

  describe('removeDish', () => {
    it('should remove dish from group', async () => {
      mockPrisma.addonGroupDish.findFirst.mockResolvedValue({ id: 'ad-1', groupId: 'grp-1', dishId: 'dish-1' });
      mockPrisma.addonGroupDish.delete.mockResolvedValue(undefined);
      const result = await addonGroupService.removeDish('grp-1', 'dish-1');
      expect(result.success).toBe(true);
    });

    it('should throw when dish not in group', async () => {
      mockPrisma.addonGroupDish.findFirst.mockResolvedValue(null);
      await expect(addonGroupService.removeDish('grp-1', 'x'))
        .rejects.toThrow('Dish not found in addon group');
    });
  });
});
