import { MenuCourseController } from '@/controllers/menuCourse.controller';
import { MenuCourseService } from '@/services/menuCourse.service';
import { Request, Response } from 'express';

jest.mock('@/services/menuCourse.service');

const menuCourseService = new MenuCourseService() as jest.Mocked<MenuCourseService>;
const ctrl = new MenuCourseController(menuCourseService);

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('MenuCourseController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a course', async () => {
    menuCourseService.createCourse = jest.fn().mockResolvedValue({
      id: '1',
      name: 'Appetizer',
    });

    const req = {
      body: { packageId: 'pkg-1', name: 'Appetizer', displayOrder: 1 },
      user: { id: 'u1' },
    } as any;
    const res = mockRes();
    await ctrl.createCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should get courses by package', async () => {
    menuCourseService.getCoursesByPackage = jest.fn().mockResolvedValue([{ id: '1' }]);
    const req = { params: { packageId: 'pkg-1' } } as any;
    const res = mockRes();
    await ctrl.getCoursesByPackage(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw notFound when course not found', async () => {
    menuCourseService.getCourseById = jest.fn().mockResolvedValue(null);
    const req = { params: { id: 'x' } } as any;
    await expect(ctrl.getCourseById(req, mockRes())).rejects.toThrow(/not found/i);
  });

  it('should update a course', async () => {
    menuCourseService.updateCourse = jest.fn().mockResolvedValue({ id: '1', name: 'Updated' });
    const req = { params: { id: '1' }, body: { name: 'Updated' }, user: { id: 'u1' } } as any;
    const res = mockRes();
    await ctrl.updateCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should delete a course', async () => {
    menuCourseService.deleteCourse = jest.fn().mockResolvedValue(undefined);
    const req = { params: { id: '1' }, user: { id: 'u1' } } as any;
    const res = mockRes();
    await ctrl.deleteCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reorder courses', async () => {
    menuCourseService.reorderCourses = jest.fn().mockResolvedValue(undefined);
    const req = { body: { orders: [{ courseId: '1', displayOrder: 1 }] } } as any;
    const res = mockRes();
    await ctrl.reorderCourses(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should validate course count', async () => {
    menuCourseService.validateCourseCount = jest.fn().mockResolvedValue({ isValid: true });
    const req = { params: { packageId: 'pkg-1' } } as any;
    const res = mockRes();
    await ctrl.validateCourseCount(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
