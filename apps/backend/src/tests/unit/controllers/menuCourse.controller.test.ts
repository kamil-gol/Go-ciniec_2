import { MenuCourseController } from '@/controllers/menuCourse.controller';
import { menuCourseService } from '@/services/menuCourse.service';
import { Request, Response, NextFunction } from 'express';

jest.mock('@/services/menuCourse.service');

jest.mock('@/validation/menuCourse.validation', () => ({
  createMenuCourseSchema: { parse: jest.fn((data: any) => data) },
  updateMenuCourseSchema: { parse: jest.fn((data: any) => data) },
  assignDishesToCourseSchema: { parse: jest.fn((data: any) => data) },
}));

const ctrl = new MenuCourseController();

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('MenuCourseController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list courses by package', async () => {
    (menuCourseService.listByPackage as jest.Mock).mockResolvedValue([{ id: '1', name: 'Appetizer' }]);

    const req = { params: { packageId: 'pkg-1' } } as any;
    const res = mockRes();
    await ctrl.listByPackage(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should get course by id', async () => {
    (menuCourseService.getById as jest.Mock).mockResolvedValue({ id: '1', name: 'Appetizer' });
    const req = { params: { id: '1' } } as any;
    const res = mockRes();
    await ctrl.getById(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should create a course', async () => {
    (menuCourseService.create as jest.Mock).mockResolvedValue({ id: '1', name: 'Przystawki' });

    const req = {
      body: {
        packageId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Przystawki',
        description: 'Różnorodne przekąski',
        minSelect: 1,
        maxSelect: 3,
        isRequired: true,
        displayOrder: 1,
      },
    } as any;
    const res = mockRes();
    await ctrl.create(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should update a course', async () => {
    (menuCourseService.update as jest.Mock).mockResolvedValue({ id: '1', name: 'Updated' });
    const req = { params: { id: '1' }, body: { name: 'Updated' } } as any;
    const res = mockRes();
    await ctrl.update(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should delete a course', async () => {
    (menuCourseService.delete as jest.Mock).mockResolvedValue(undefined);
    const req = { params: { id: '1' } } as any;
    const res = mockRes();
    await ctrl.delete(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should assign dishes to course', async () => {
    (menuCourseService.assignDishes as jest.Mock).mockResolvedValue({ id: '1' });
    const req = {
      params: { id: '1' },
      body: {
        dishes: [
          {
            dishId: '550e8400-e29b-41d4-a716-446655440001',
            displayOrder: 1,
            isDefault: false,
            isRecommended: false,
          },
          {
            dishId: '550e8400-e29b-41d4-a716-446655440002',
            displayOrder: 2,
            isDefault: false,
            isRecommended: true,
          },
        ],
      },
    } as any;
    const res = mockRes();
    await ctrl.assignDishes(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should remove dish from course', async () => {
    (menuCourseService.removeDish as jest.Mock).mockResolvedValue(undefined);
    const req = { params: { courseId: '1', dishId: 'd1' } } as any;
    const res = mockRes();
    await ctrl.removeDish(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  describe('edge cases / branch coverage', () => {
    describe('create — branch', () => {
      it('should create with all fields', async () => {
        (menuCourseService.create as jest.Mock).mockResolvedValue({ id: '1', name: 'A' });
        const req = {
          body: { packageId: 'p1', category: 'APPETIZER', name: 'A', description: 'B', displayOrder: 1 },
          user: { id: 'u1' }
        } as any;
        const res = mockRes();
        await ctrl.create(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should create with minimal fields', async () => {
        (menuCourseService.create as jest.Mock).mockResolvedValue({ id: '2' });
        const req = { body: { packageId: 'p1', category: 'DESSERT' }, user: { id: 'u1' } } as any;
        await ctrl.create(req, mockRes(), mockNext);
        expect(menuCourseService.create).toHaveBeenCalled();
      });
    });

    describe('getById — branch', () => {
      it('should return 404 when service rejects with not found', async () => {
        (menuCourseService.getById as jest.Mock).mockRejectedValue(new Error('Course not found'));
        const req = { params: { id: 'x' } } as any;
        const res = mockRes();
        await ctrl.getById(req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(404);
      });
    });

    describe('update — branch', () => {
      it('should include only name when only name provided', async () => {
        (menuCourseService.update as jest.Mock).mockResolvedValue({ id: '1' });
        const req = { params: { id: '1' }, body: { name: 'New' }, user: { id: 'u1' } } as any;
        await ctrl.update(req, mockRes(), mockNext);
        expect(menuCourseService.update).toHaveBeenCalledWith('1', { name: 'New' });
      });

      it('should include all fields when all provided', async () => {
        (menuCourseService.update as jest.Mock).mockResolvedValue({ id: '1' });
        const req = {
          params: { id: '1' },
          body: { name: 'A', description: 'B', isVegetarian: true, isGlutenFree: false, category: 'MAIN' },
          user: { id: 'u1' }
        } as any;
        await ctrl.update(req, mockRes(), mockNext);
        expect(menuCourseService.update).toHaveBeenCalledWith(
          '1', { name: 'A', description: 'B', isVegetarian: true, isGlutenFree: false, category: 'MAIN' }
        );
      });

      it('should send empty data when no fields', async () => {
        (menuCourseService.update as jest.Mock).mockResolvedValue({ id: '1' });
        const req = { params: { id: '1' }, body: {}, user: { id: 'u1' } } as any;
        await ctrl.update(req, mockRes(), mockNext);
        expect(menuCourseService.update).toHaveBeenCalledWith('1', {});
      });
    });
  });
});
