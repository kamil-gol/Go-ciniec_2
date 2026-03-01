/**
 * MenuCourseController — Branch Coverage Tests
 * Target: 62.96% → ~90%+ branches
 * Covers: error type handling (ZodError, not found, dish errors) for all methods
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

// Mock zod schemas to control validation
jest.mock('../../../validation/menuCourse.validation', () => ({
  createMenuCourseSchema: { parse: jest.fn((d: any) => d) },
  updateMenuCourseSchema: { parse: jest.fn((d: any) => d) },
  assignDishesToCourseSchema: { parse: jest.fn((d: any) => d) },
}));

import { menuCourseController } from '../../../controllers/menuCourse.controller';
import { menuCourseService } from '../../../services/menuCourse.service';
import { createMenuCourseSchema, updateMenuCourseSchema, assignDishesToCourseSchema } from '../../../validation/menuCourse.validation';
import { z } from 'zod';

const svc = menuCourseService as any;
const schemas = { create: createMenuCourseSchema as any, update: updateMenuCourseSchema as any, assign: assignDishesToCourseSchema as any };

const req = (overrides: any = {}): any => ({ body: {}, params: {}, query: {}, ...overrides });
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};
const next = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  schemas.create.parse.mockImplementation((d: any) => d);
  schemas.update.parse.mockImplementation((d: any) => d);
  schemas.assign.parse.mockImplementation((d: any) => d);
});

function makeZodError(): z.ZodError {
  try { z.string().parse(123); } catch (e) { return e as z.ZodError; }
  throw new Error('unreachable');
}

describe('MenuCourseController — branches', () => {

  // ═══ listByPackage ═══
  describe('listByPackage()', () => {
    it('should return courses', async () => {
      svc.listByPackage.mockResolvedValue([{ id: 'c1' }]);
      const r = res();
      await menuCourseController.listByPackage(req({ params: { packageId: 'pkg-1' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      svc.listByPackage.mockRejectedValue(new Error('DB error'));
      await menuCourseController.listByPackage(req({ params: { packageId: 'pkg-1' } }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ═══ getById ═══
  describe('getById()', () => {
    it('should return course', async () => {
      svc.getById.mockResolvedValue({ id: 'c1' });
      const r = res();
      await menuCourseController.getById(req({ params: { id: 'c1' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when Course not found', async () => {
      svc.getById.mockRejectedValue(new Error('Nie znaleziono kursu menu'));
      const r = res();
      await menuCourseController.getById(req({ params: { id: 'bad' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.getById.mockRejectedValue(new Error('DB error'));
      await menuCourseController.getById(req({ params: { id: 'c1' } }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ═══ create ═══
  describe('create()', () => {
    it('should return 201 on success', async () => {
      svc.create.mockResolvedValue({ id: 'c1' });
      const r = res();
      await menuCourseController.create(req({ body: { name: 'Zupa', packageId: 'pkg-1' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 on ZodError', async () => {
      schemas.create.parse.mockImplementation(() => { throw makeZodError(); });
      const r = res();
      await menuCourseController.create(req({ body: {} }), r, next);
      expect(r.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when Package not found', async () => {
      svc.create.mockRejectedValue(new Error('Nie znaleziono pakietu menu'));
      const r = res();
      await menuCourseController.create(req({ body: { name: 'X' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.create.mockRejectedValue(new Error('DB error'));
      await menuCourseController.create(req({ body: {} }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ═══ update ═══
  describe('update()', () => {
    it('should return 200 on success', async () => {
      svc.update.mockResolvedValue({ id: 'c1' });
      const r = res();
      await menuCourseController.update(req({ params: { id: 'c1' }, body: { name: 'Updated' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on ZodError', async () => {
      schemas.update.parse.mockImplementation(() => { throw makeZodError(); });
      const r = res();
      await menuCourseController.update(req({ params: { id: 'c1' }, body: {} }), r, next);
      expect(r.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when Course not found', async () => {
      svc.update.mockRejectedValue(new Error('Nie znaleziono kursu menu'));
      const r = res();
      await menuCourseController.update(req({ params: { id: 'bad' }, body: {} }), r, next);
      expect(r.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.update.mockRejectedValue(new Error('DB error'));
      await menuCourseController.update(req({ params: { id: 'c1' }, body: {} }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ═══ delete ═══
  describe('delete()', () => {
    it('should return 200 on success', async () => {
      svc.delete.mockResolvedValue(undefined);
      const r = res();
      await menuCourseController.delete(req({ params: { id: 'c1' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when Course not found', async () => {
      svc.delete.mockRejectedValue(new Error('Nie znaleziono kursu menu'));
      const r = res();
      await menuCourseController.delete(req({ params: { id: 'bad' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.delete.mockRejectedValue(new Error('DB error'));
      await menuCourseController.delete(req({ params: { id: 'c1' } }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ═══ assignDishes ═══
  describe('assignDishes()', () => {
    it('should return 200 on success', async () => {
      svc.assignDishes.mockResolvedValue({ id: 'c1', dishes: [] });
      const r = res();
      await menuCourseController.assignDishes(req({ params: { id: 'c1' }, body: { dishes: ['d1'] } }), r, next);
      expect(r.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on ZodError', async () => {
      schemas.assign.parse.mockImplementation(() => { throw makeZodError(); });
      const r = res();
      await menuCourseController.assignDishes(req({ params: { id: 'c1' }, body: {} }), r, next);
      expect(r.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when Course not found', async () => {
      svc.assignDishes.mockRejectedValue(new Error('Nie znaleziono kursu menu'));
      const r = res();
      await menuCourseController.assignDishes(req({ params: { id: 'bad' }, body: { dishes: ['d1'] } }), r, next);
      expect(r.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when Dish error', async () => {
      svc.assignDishes.mockRejectedValue(new Error('Dish "Zupa" not found'));
      const r = res();
      await menuCourseController.assignDishes(req({ params: { id: 'c1' }, body: { dishes: ['bad'] } }), r, next);
      expect(r.status).toHaveBeenCalledWith(404);
      expect(r.json.mock.calls[0][0].error).toContain('Dish');
    });

    it('should call next on unknown error', async () => {
      svc.assignDishes.mockRejectedValue(new Error('DB error'));
      await menuCourseController.assignDishes(req({ params: { id: 'c1' }, body: { dishes: [] } }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ═══ removeDish ═══
  describe('removeDish()', () => {
    it('should return 200 on success', async () => {
      svc.removeDish.mockResolvedValue(undefined);
      const r = res();
      await menuCourseController.removeDish(req({ params: { courseId: 'c1', dishId: 'd1' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when Course not found', async () => {
      svc.removeDish.mockRejectedValue(new Error('Nie znaleziono kursu menu'));
      const r = res();
      await menuCourseController.removeDish(req({ params: { courseId: 'bad', dishId: 'd1' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when Dish not assigned', async () => {
      svc.removeDish.mockRejectedValue(new Error('Dish not assigned to this course'));
      const r = res();
      await menuCourseController.removeDish(req({ params: { courseId: 'c1', dishId: 'bad' } }), r, next);
      expect(r.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.removeDish.mockRejectedValue(new Error('DB error'));
      await menuCourseController.removeDish(req({ params: { courseId: 'c1', dishId: 'd1' } }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });
});
