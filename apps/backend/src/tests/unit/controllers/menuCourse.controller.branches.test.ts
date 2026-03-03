/**
 * MenuCourseController — Branch Coverage Tests
 * Tests: validation branches, error handling
 */

jest.mock('../../../services/menuCourse.service', () => ({
  menuCourseService: {
    listByPackage: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { MenuCourseController } from '../../../controllers/menuCourse.controller';
import { menuCourseService } from '../../../services/menuCourse.service';

const ctrl = new MenuCourseController();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MenuCourseController branches', () => {
  describe('create', () => {
    it('should throw when no userId', async () => {
      const req = { body: { packageId: 'p1', category: 'APPETIZER', name: 'A' }, user: undefined } as any;
      await expect(ctrl.create(req, mockRes(), mockNext)).rejects.toThrow();
    });

    it('should throw badRequest when no packageId', async () => {
      const req = { body: { category: 'APPETIZER', name: 'A' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.create(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should throw badRequest when no category', async () => {
      const req = { body: { packageId: 'p1', name: 'A' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.create(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
    });

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

  describe('listByPackage', () => {
    it('should return courses', async () => {
      (menuCourseService.listByPackage as jest.Mock).mockResolvedValue([{ id: '1' }]);
      const req = { params: { packageId: 'p1' } } as any;
      const res = mockRes();
      await ctrl.listByPackage(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getById', () => {
    it('should throw notFound when null', async () => {
      (menuCourseService.getById as jest.Mock).mockRejectedValue(new Error('Course not found'));
      const req = { params: { id: 'x' } } as any;
      const res = mockRes();
      await ctrl.getById(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return course when found', async () => {
      (menuCourseService.getById as jest.Mock).mockResolvedValue({ id: '1', name: 'A' });
      const req = { params: { id: '1' } } as any;
      const res = mockRes();
      await ctrl.getById(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('update', () => {
    it('should throw when no userId', async () => {
      const req = { params: { id: '1' }, body: {}, user: undefined } as any;
      await expect(ctrl.update(req, mockRes(), mockNext)).rejects.toThrow();
    });

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

  describe('delete', () => {
    it('should throw when no userId', async () => {
      const req = { params: { id: '1' }, user: undefined } as any;
      await expect(ctrl.delete(req, mockRes(), mockNext)).rejects.toThrow();
    });

    it('should delete successfully', async () => {
      (menuCourseService.delete as jest.Mock).mockResolvedValue(true);
      const req = { params: { id: '1' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.delete(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
