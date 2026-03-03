/**
 * MenuCourse Controller — Branch coverage tests
 * Covers: !userId, !packageId, !category, conditional update fields
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
    static unauthorized(msg?: string) { return new MockAppError(msg || 'Unauthorized', 401); }
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

describe('MenuCourseController branches', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createCourse', () => {
    it('should throw when no userId', async () => {
      const req = { body: { packageId: 'p1', category: 'APPETIZER', name: 'A' }, user: undefined } as any;
      await expect(ctrl.createCourse(req, mockRes())).rejects.toThrow();
    });

    it('should throw badRequest when no packageId', async () => {
      const req = { body: { category: 'APPETIZER', name: 'A' }, user: { id: 'u1' } } as any;
      await expect(ctrl.createCourse(req, mockRes())).rejects.toThrow(/required/);
    });

    it('should throw badRequest when no category', async () => {
      const req = { body: { packageId: 'p1', name: 'A' }, user: { id: 'u1' } } as any;
      await expect(ctrl.createCourse(req, mockRes())).rejects.toThrow(/required/);
    });

    it('should create with all fields', async () => {
      (menuCourseService.createCourse as jest.Mock).mockResolvedValue({ id: '1' });
      const req = {
        body: { packageId: 'p1', category: 'MAIN', name: 'Steak', description: 'Beef', isVegetarian: false },
        user: { id: 'u1' }
      } as any;
      const res = mockRes();
      await ctrl.createCourse(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create with minimal fields', async () => {
      (menuCourseService.createCourse as jest.Mock).mockResolvedValue({ id: '2' });
      const req = { body: { packageId: 'p1', category: 'DESSERT' }, user: { id: 'u1' } } as any;
      await ctrl.createCourse(req, mockRes());
      expect(menuCourseService.createCourse).toHaveBeenCalled();
    });
  });

  describe('getCoursesByPackage', () => {
    it('should return courses', async () => {
      (menuCourseService.getCoursesByPackage as jest.Mock).mockResolvedValue([{ id: '1' }]);
      const req = { params: { packageId: 'p1' } } as any;
      const res = mockRes();
      await ctrl.getCoursesByPackage(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getCourseById', () => {
    it('should throw notFound when null', async () => {
      (menuCourseService.getCourseById as jest.Mock).mockResolvedValue(null);
      const req = { params: { id: 'x' } } as any;
      await expect(ctrl.getCourseById(req, mockRes())).rejects.toThrow(/not found/);
    });

    it('should return course when found', async () => {
      (menuCourseService.getCourseById as jest.Mock).mockResolvedValue({ id: '1' });
      const req = { params: { id: '1' } } as any;
      const res = mockRes();
      await ctrl.getCourseById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateCourse', () => {
    it('should throw when no userId', async () => {
      const req = { params: { id: '1' }, body: {}, user: undefined } as any;
      await expect(ctrl.updateCourse(req, mockRes())).rejects.toThrow();
    });

    it('should include only name when only name provided', async () => {
      (menuCourseService.updateCourse as jest.Mock).mockResolvedValue({ id: '1' });
      const req = { params: { id: '1' }, body: { name: 'New' }, user: { id: 'u1' } } as any;
      await ctrl.updateCourse(req, mockRes());
      expect(menuCourseService.updateCourse).toHaveBeenCalledWith('1', { name: 'New' }, 'u1');
    });

    it('should include all fields when all provided', async () => {
      (menuCourseService.updateCourse as jest.Mock).mockResolvedValue({ id: '1' });
      const req = {
        params: { id: '1' },
        body: { name: 'A', description: 'B', isVegetarian: true, isGlutenFree: false, category: 'MAIN' },
        user: { id: 'u1' }
      } as any;
      await ctrl.updateCourse(req, mockRes());
      expect(menuCourseService.updateCourse).toHaveBeenCalledWith(
        '1', { name: 'A', description: 'B', isVegetarian: true, isGlutenFree: false, category: 'MAIN' }, 'u1'
      );
    });

    it('should send empty data when no fields', async () => {
      (menuCourseService.updateCourse as jest.Mock).mockResolvedValue({ id: '1' });
      const req = { params: { id: '1' }, body: {}, user: { id: 'u1' } } as any;
      await ctrl.updateCourse(req, mockRes());
      expect(menuCourseService.updateCourse).toHaveBeenCalledWith('1', {}, 'u1');
    });
  });

  describe('deleteCourse', () => {
    it('should throw when no userId', async () => {
      const req = { params: { id: '1' }, user: undefined } as any;
      await expect(ctrl.deleteCourse(req, mockRes())).rejects.toThrow();
    });

    it('should delete successfully', async () => {
      (menuCourseService.deleteCourse as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { id: '1' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.deleteCourse(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('reorderCourses', () => {
    it('should reorder', async () => {
      (menuCourseService.reorderCourses as jest.Mock).mockResolvedValue({ success: true });
      const req = { body: { orders: [{ courseId: '1', displayOrder: 1 }] } } as any;
      const res = mockRes();
      await ctrl.reorderCourses(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('validateCourseCount', () => {
    it('should validate', async () => {
      (menuCourseService.validateCourseCount as jest.Mock).mockResolvedValue({ valid: true });
      const req = { params: { packageId: 'p1' } } as any;
      const res = mockRes();
      await ctrl.validateCourseCount(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getCourseById - notFound coverage', () => {
    it('should throw notFound when service returns null (branch line ~207)', async () => {
      (menuCourseService.getCourseById as jest.Mock).mockResolvedValue(null);
      const req = { params: { id: 'nonexistent' } } as any;
      await expect(ctrl.getCourseById(req, mockRes())).rejects.toThrow(/not found/);
    });
  });
});
