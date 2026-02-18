/**
 * DishService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    dish: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dishCategory: { findUnique: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ name: { old: 'A', new: 'B' } }),
}));

import dishService from '../../../services/dish.service';
import { prisma } from '../../../lib/prisma';
import { logChange, diffObjects } from '../../../utils/audit-logger';

const mockPrisma = prisma as any;
const USER = 'user-001';

const CATEGORY = { id: 'cat-001', name: 'Przystawki', displayOrder: 0 };
const DISH = { id: 'dish-001', name: 'Tartare', description: 'Wołowy', categoryId: 'cat-001', allergens: ['gluten'], isActive: true, category: CATEGORY };

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.dish.findMany.mockResolvedValue([DISH]);
  mockPrisma.dish.findUnique.mockResolvedValue(DISH);
  mockPrisma.dish.findFirst.mockResolvedValue(null);
  mockPrisma.dish.create.mockResolvedValue(DISH);
  mockPrisma.dish.update.mockResolvedValue(DISH);
  mockPrisma.dish.delete.mockResolvedValue(DISH);
  mockPrisma.dishCategory.findUnique.mockResolvedValue(CATEGORY);
});

describe('DishService', () => {
  describe('findAll()', () => {
    it('should return dishes', async () => {
      expect(await dishService.findAll()).toHaveLength(1);
    });

    it('should apply filters', async () => {
      await dishService.findAll({ categoryId: 'cat-001', isActive: true, search: 'tar' });
      const call = mockPrisma.dish.findMany.mock.calls[0][0];
      expect(call.where.categoryId).toBe('cat-001');
      expect(call.where.isActive).toBe(true);
      expect(call.where.OR).toHaveLength(2);
    });
  });

  describe('findOne()', () => {
    it('should return dish with category', async () => {
      expect((await dishService.findOne('dish-001'))!.name).toBe('Tartare');
    });

    it('should return null when not found', async () => {
      mockPrisma.dish.findUnique.mockResolvedValue(null);
      expect(await dishService.findOne('x')).toBeNull();
    });
  });

  describe('getByIds()', () => {
    it('should return dishes by IDs', async () => {
      await dishService.getByIds(['dish-001']);
      expect(mockPrisma.dish.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['dish-001'] } } }));
    });
  });

  describe('findByCategory()', () => {
    it('should return dishes for category', async () => {
      await dishService.findByCategory('cat-001');
      expect(mockPrisma.dish.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { categoryId: 'cat-001' } }));
    });
  });

  describe('create()', () => {
    it('should create dish and audit', async () => {
      await dishService.create({ name: 'Nowe', categoryId: 'cat-001' }, USER);
      expect(mockPrisma.dish.create).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'DISH' }));
    });

    it('should throw on duplicate name', async () => {
      mockPrisma.dish.findFirst.mockResolvedValue(DISH);
      await expect(dishService.create({ name: 'Tartare', categoryId: 'cat-001' }, USER)).rejects.toThrow(/already exists/);
    });

    it('should throw when category not found', async () => {
      mockPrisma.dishCategory.findUnique.mockResolvedValue(null);
      await expect(dishService.create({ name: 'X', categoryId: 'bad' }, USER)).rejects.toThrow(/not found/);
    });
  });

  describe('update()', () => {
    it('should update and audit', async () => {
      await dishService.update('dish-001', { name: 'Carpaccio' }, USER);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.dish.findUnique.mockResolvedValue(null);
      await expect(dishService.update('x', { name: 'A' }, USER)).rejects.toThrow(/not found/);
    });
  });

  describe('toggleActive()', () => {
    it('should toggle and audit', async () => {
      await dishService.toggleActive('dish-001', USER);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'TOGGLE_ACTIVE' }));
    });
  });

  describe('remove()', () => {
    it('should delete and audit', async () => {
      await dishService.remove('dish-001', USER);
      expect(mockPrisma.dish.delete).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE' }));
    });
  });
});
