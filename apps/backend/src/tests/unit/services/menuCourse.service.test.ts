/**
 * Unit tests for menuCourse.service.ts
 * Covers: listByPackage, getById, create, update, delete,
 *         assignDishes, removeDish, getForSelection, reorderDishes
 * Issue: #98
 */

const mockPrisma: any = {
  menuCourse: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  menuCourseOption: {
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  },
  menuPackage: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(async (cb: any) => {
    if (typeof cb === 'function') {
      return cb({ menuCourseOption: mockPrisma.menuCourseOption });
    }
    return Promise.all(cb);
  }),
};

const mockDishService = {
  getByIds: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@services/dish.service', () => ({ dishService: mockDishService }));

import { menuCourseService } from '@services/menuCourse.service';

const mockCourse = {
  id: 'course-1', packageId: 'pkg-1', name: 'Zupy',
  description: 'Kursy zup', minSelect: 1, maxSelect: 1,
  isRequired: true, displayOrder: 0, icon: 'soup',
  options: [{ id: 'co-1', dishId: 'dish-1', dish: { id: 'dish-1', name: 'Rosół' } }],
};

describe('MenuCourseService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listByPackage', () => {
    it('should return courses for package ordered by displayOrder', async () => {
      mockPrisma.menuCourse.findMany.mockResolvedValue([mockCourse]);
      const result = await menuCourseService.listByPackage('pkg-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.menuCourse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { packageId: 'pkg-1' }, orderBy: { displayOrder: 'asc' } })
      );
    });
  });

  describe('getById', () => {
    it('should return course with options', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(mockCourse);
      const result = await menuCourseService.getById('course-1');
      expect(result.id).toBe('course-1');
      expect(result.options).toHaveLength(1);
    });

    it('should throw when course not found', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(null);
      await expect(menuCourseService.getById('x')).rejects.toThrow('Course not found');
    });
  });

  describe('create', () => {
    it('should create course for existing package', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.menuCourse.create.mockResolvedValue(mockCourse);
      const result = await menuCourseService.create({ packageId: 'pkg-1', name: 'Zupy' });
      expect(result.id).toBe('course-1');
    });

    it('should throw when package not found', async () => {
      mockPrisma.menuPackage.findUnique.mockResolvedValue(null);
      await expect(menuCourseService.create({ packageId: 'x', name: 'Test' }))
        .rejects.toThrow('Package not found');
    });
  });

  describe('update', () => {
    it('should update course fields', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.menuCourse.update.mockResolvedValue({ ...mockCourse, name: 'Desery' });
      const result = await menuCourseService.update('course-1', { name: 'Desery' });
      expect(result.name).toBe('Desery');
    });

    it('should throw when course not found', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(null);
      await expect(menuCourseService.update('x', { name: 'Y' })).rejects.toThrow('Course not found');
    });
  });

  describe('delete', () => {
    it('should delete existing course', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.menuCourse.delete.mockResolvedValue(mockCourse);
      const result = await menuCourseService.delete('course-1');
      expect(mockPrisma.menuCourse.delete).toHaveBeenCalledWith({ where: { id: 'course-1' } });
    });
  });

  describe('assignDishes', () => {
    it('should assign dishes to course', async () => {
      mockPrisma.menuCourse.findUnique
        .mockResolvedValueOnce(mockCourse)   // getById check
        .mockResolvedValueOnce(mockCourse);  // return after assign
      mockDishService.getByIds.mockResolvedValue([{ id: 'dish-1' }, { id: 'dish-2' }]);
      mockPrisma.menuCourseOption.deleteMany.mockResolvedValue({});
      mockPrisma.menuCourseOption.createMany.mockResolvedValue({ count: 2 });

      const result = await menuCourseService.assignDishes('course-1', [
        { dishId: 'dish-1', isDefault: true },
        { dishId: 'dish-2' },
      ]);

      expect(mockDishService.getByIds).toHaveBeenCalledWith(['dish-1', 'dish-2']);
    });

    it('should throw when some dishes not found', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(mockCourse);
      mockDishService.getByIds.mockResolvedValue([{ id: 'dish-1' }]);

      await expect(menuCourseService.assignDishes('course-1', [
        { dishId: 'dish-1' }, { dishId: 'dish-missing' },
      ])).rejects.toThrow(/Dishes not found.*dish-missing/);
    });
  });

  describe('removeDish', () => {
    it('should remove dish from course', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.menuCourseOption.findFirst.mockResolvedValue({ id: 'co-1', courseId: 'course-1', dishId: 'dish-1' });
      mockPrisma.menuCourseOption.delete.mockResolvedValue({});
      await menuCourseService.removeDish('course-1', 'dish-1');
      expect(mockPrisma.menuCourseOption.delete).toHaveBeenCalledWith({ where: { id: 'co-1' } });
    });

    it('should throw when dish not assigned', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.menuCourseOption.findFirst.mockResolvedValue(null);
      await expect(menuCourseService.removeDish('course-1', 'dish-x'))
        .rejects.toThrow('Dish not assigned to this course');
    });
  });

  describe('getForSelection', () => {
    it('should return course with active dishes sorted by recommended/default', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(mockCourse);
      const result = await menuCourseService.getForSelection('course-1');
      expect(result.id).toBe('course-1');
    });

    it('should throw when course not found', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(null);
      await expect(menuCourseService.getForSelection('x')).rejects.toThrow('Course not found');
    });
  });

  describe('reorderDishes', () => {
    it('should reorder dishes in course', async () => {
      mockPrisma.menuCourse.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.menuCourseOption.updateMany.mockResolvedValue({});
      const result = await menuCourseService.reorderDishes('course-1', [
        { dishId: 'dish-1', displayOrder: 1 },
        { dishId: 'dish-2', displayOrder: 0 },
      ]);
      expect(result.id).toBe('course-1');
    });
  });
});
