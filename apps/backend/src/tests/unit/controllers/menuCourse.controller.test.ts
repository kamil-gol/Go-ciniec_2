/**
 * MenuCourseController — Unit Tests
 */
jest.mock('../../../services/menuCourse.service', () => ({
  menuCourseService: {
    listByPackage: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    assignDishes: jest.fn(),
    removeDish: jest.fn(),
  },
}));

jest.mock('../../../validation/menuCourse.validation', () => ({
  createMenuCourseSchema: { parse: jest.fn((d: any) => d) },
  updateMenuCourseSchema: { parse: jest.fn((d: any) => d) },
  assignDishesToCourseSchema: { parse: jest.fn((d: any) => d) },
}));

import { MenuCourseController } from '../../../controllers/menuCourse.controller';
import { menuCourseService } from '../../../services/menuCourse.service';

const controller = new MenuCourseController();
const svc = menuCourseService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
  ...overrides,
});
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('MenuCourseController', () => {
  describe('listByPackage()', () => {
    it('should return 200 with courses', async () => {
      svc.listByPackage.mockResolvedValue([{ id: 'c-1' }]);
      const response = res();
      await controller.listByPackage(req({ params: { packageId: 'p-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ count: 1 }));
    });
  });

  describe('getById()', () => {
    it('should return 200', async () => {
      svc.getById.mockResolvedValue({ id: 'c-1', name: 'Zupa' });
      const response = res();
      await controller.getById(req({ params: { id: 'c-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should return 404', async () => {
      svc.getById.mockRejectedValue(new Error('Course not found'));
      const response = res();
      await controller.getById(req({ params: { id: 'x' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create()', () => {
    it('should return 404 when package not found', async () => {
      svc.create.mockRejectedValue(new Error('Package not found'));
      const response = res();
      await controller.create(req({ body: { name: 'C', packageId: 'x' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 201 on success', async () => {
      svc.create.mockResolvedValue({ id: 'c-new', name: 'Zupa' });
      const response = res();
      await controller.create(req({ body: { name: 'Zupa', packageId: 'p-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update()', () => {
    it('should return 404', async () => {
      svc.update.mockRejectedValue(new Error('Course not found'));
      const response = res();
      await controller.update(req({ params: { id: 'x' }, body: { name: 'U' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 200', async () => {
      svc.update.mockResolvedValue({ id: 'c-1' });
      const response = res();
      await controller.update(req({ params: { id: 'c-1' }, body: { name: 'Updated' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete()', () => {
    it('should return 404', async () => {
      svc.delete.mockRejectedValue(new Error('Course not found'));
      const response = res();
      await controller.delete(req({ params: { id: 'x' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 200', async () => {
      svc.delete.mockResolvedValue(undefined);
      const response = res();
      await controller.delete(req({ params: { id: 'c-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('assignDishes()', () => {
    it('should return 200', async () => {
      svc.assignDishes.mockResolvedValue({ id: 'c-1', dishes: [] });
      const response = res();
      await controller.assignDishes(
        req({ params: { id: 'c-1' }, body: { dishes: [{ dishId: 'd-1' }] } }), response, next
      );
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('removeDish()', () => {
    it('should return 404 when not assigned', async () => {
      svc.removeDish.mockRejectedValue(new Error('Dish not assigned to this course'));
      const response = res();
      await controller.removeDish(
        req({ params: { courseId: 'c-1', dishId: 'd-x' } }), response, next
      );
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 200', async () => {
      svc.removeDish.mockResolvedValue(undefined);
      const response = res();
      await controller.removeDish(
        req({ params: { courseId: 'c-1', dishId: 'd-1' } }), response, next
      );
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });
});
