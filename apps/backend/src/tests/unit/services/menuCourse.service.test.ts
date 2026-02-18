/**
 * MenuCourseService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    menuCourse: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    menuPackage: { findUnique: jest.fn() },
    menuCourseOption: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../services/dish.service', () => ({
  dishService: { getByIds: jest.fn() },
  default: { getByIds: jest.fn() },
}));

import { menuCourseService } from '../../../services/menuCourse.service';
import { prisma } from '../../../lib/prisma';
import { dishService } from '../../../services/dish.service';

const mockPrisma = prisma as any;

const DISH = { id: 'dish-001', name: 'Tartare', isActive: true };
const COURSE = {
  id: 'mc-001', packageId: 'pkg-001', name: 'Przystawki',
  minSelect: 1, maxSelect: 2, isRequired: true, displayOrder: 0,
  options: [{ id: 'mco-001', dishId: 'dish-001', customPrice: null, displayOrder: 0, dish: DISH }],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.menuCourse.findMany.mockResolvedValue([COURSE]);
  mockPrisma.menuCourse.findUnique.mockResolvedValue(COURSE);
  mockPrisma.menuCourse.create.mockResolvedValue(COURSE);
  mockPrisma.menuCourse.update.mockResolvedValue(COURSE);
  mockPrisma.menuCourse.delete.mockResolvedValue(COURSE);
  mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'pkg-001' });
  mockPrisma.menuCourseOption.findFirst.mockResolvedValue({ id: 'mco-001' });
  mockPrisma.menuCourseOption.delete.mockResolvedValue({});
  mockPrisma.$transaction.mockImplementation(async (fn: any) => {
    if (typeof fn === 'function') {
      return fn({ menuCourseOption: { deleteMany: jest.fn(), createMany: jest.fn() } });
    }
    return Promise.all(fn);
  });
  (dishService.getByIds as jest.Mock).mockResolvedValue([DISH]);
});

describe('MenuCourseService', () => {
  describe('listByPackage()', () => {
    it('should return courses for package', async () => {
      const result = await menuCourseService.listByPackage('pkg-001');
      expect(result).toHaveLength(1);
      expect(mockPrisma.menuCourse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { packageId: 'pkg-001' } })
      );
    });
  });

  describe('getById()', () => {
    it('should return course with options', async () => {
      const result = await menuCourseService.getById('mc-001');
      expect(result.name).toBe('Przystawki');
    });

    it('should throw when not found', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(null);
      await expect(menuCourseService.getById('x')).rejects.toThrow(/not found/);
    });
  });

  describe('create()', () => {
    it('should create with defaults', async () => {
      await menuCourseService.create({ packageId: 'pkg-001', name: 'Zupy' });
      const data = mockPrisma.menuCourse.create.mock.calls[0][0].data;
      expect(data.minSelect).toBe(1);
      expect(data.maxSelect).toBe(1);
      expect(data.isRequired).toBe(true);
    });

    it('should throw when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      await expect(menuCourseService.create({ packageId: 'bad', name: 'X' })).rejects.toThrow(/not found/);
    });
  });

  describe('update()', () => {
    it('should update course', async () => {
      await menuCourseService.update('mc-001', { name: 'Updated' });
      expect(mockPrisma.menuCourse.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete()', () => {
    it('should delete course', async () => {
      await menuCourseService.delete('mc-001');
      expect(mockPrisma.menuCourse.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('assignDishes()', () => {
    it('should clear and assign dishes in transaction', async () => {
      await menuCourseService.assignDishes('mc-001', [{ dishId: 'dish-001' }]);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw when dish not found', async () => {
      (dishService.getByIds as jest.Mock).mockResolvedValue([]); // no dishes found
      await expect(menuCourseService.assignDishes('mc-001', [{ dishId: 'bad' }])).rejects.toThrow(/not found/);
    });
  });

  describe('removeDish()', () => {
    it('should remove dish from course', async () => {
      await menuCourseService.removeDish('mc-001', 'dish-001');
      expect(mockPrisma.menuCourseOption.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw when dish not assigned', async () => {
      mockPrisma.menuCourseOption.findFirst.mockResolvedValue(null);
      await expect(menuCourseService.removeDish('mc-001', 'bad')).rejects.toThrow(/not assigned/);
    });
  });

  describe('getForSelection()', () => {
    it('should return course with active options', async () => {
      const result = await menuCourseService.getForSelection('mc-001');
      expect(result).toBeDefined();
    });
  });
});
