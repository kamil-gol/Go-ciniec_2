import { MenuCourseController } from '@/controllers/menuCourse.controller';
import { menuCourseService } from '@/services/menuCourse.service';
import { Request, Response, NextFunction } from 'express';

jest.mock('@/services/menuCourse.service');

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
    (menuCourseService.create as jest.Mock).mockResolvedValue({ id: '1', name: 'Appetizer' });

    const req = {
      body: {
        packageId: 'pkg-1',
        name: 'Appetizer',
        displayOrder: 1,
        courseName: 'Przystawki',
        minDishes: 1,
        maxDishes: 5,
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
          { dishId: 'd1', displayOrder: 1 },
          { dishId: 'd2', displayOrder: 2 },
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
});
