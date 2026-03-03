/**
 * MenuCourse Controller — Unit Tests
 * Standard CRUD operations
 */

jest.mock('../../../services/menuCourse.service', () => ({
  __esModule: true,
  default: {
    createCourse: jest.fn(),
    getCoursesByPackage: jest.fn(),
    getCourseById: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
    reorderCourses: jest.fn(),
    validateCourseCount: jest.fn(),
  },
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
    static notFound(entity: string) { return new MockAppError(`${entity} not found`, 404); }
  }
  return { AppError: MockAppError };
});

import { MenuCourseController } from '../../../controllers/menuCourse.controller';
import menuCourseService from '../../../services/menuCourse.service';

const ctrl = new MenuCourseController();
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('MenuCourseController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create a course', async () => {
    (menuCourseService.createCourse as jest.Mock).mockResolvedValue({ id: '1', name: 'Soup' });
    const req = {
      body: { packageId: 'pkg-1', category: 'APPETIZER', name: 'Soup' },
      user: { id: 'u1' }
    } as any;
    const res = mockRes();
    await ctrl.createCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should get courses by package', async () => {
    (menuCourseService.getCoursesByPackage as jest.Mock).mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const req = { params: { packageId: 'pkg-1' } } as any;
    const res = mockRes();
    await ctrl.getCoursesByPackage(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw notFound when course not found', async () => {
    (menuCourseService.getCourseById as jest.Mock).mockResolvedValue(null);
    const req = { params: { id: 'x' } } as any;
    await expect(ctrl.getCourseById(req, mockRes())).rejects.toThrow(/not found/);
  });

  it('should update a course', async () => {
    (menuCourseService.updateCourse as jest.Mock).mockResolvedValue({ id: '1', name: 'Updated' });
    const req = { params: { id: '1' }, body: { name: 'Updated' }, user: { id: 'u1' } } as any;
    const res = mockRes();
    await ctrl.updateCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should delete a course', async () => {
    (menuCourseService.deleteCourse as jest.Mock).mockResolvedValue(undefined);
    const req = { params: { id: '1' }, user: { id: 'u1' } } as any;
    const res = mockRes();
    await ctrl.deleteCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reorder courses', async () => {
    (menuCourseService.reorderCourses as jest.Mock).mockResolvedValue({ success: true });
    const req = { body: { orders: [{ courseId: '1', displayOrder: 1 }] } } as any;
    const res = mockRes();
    await ctrl.reorderCourses(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should validate course count', async () => {
    (menuCourseService.validateCourseCount as jest.Mock).mockResolvedValue({ valid: true });
    const req = { params: { packageId: 'pkg-1' } } as any;
    const res = mockRes();
    await ctrl.validateCourseCount(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
