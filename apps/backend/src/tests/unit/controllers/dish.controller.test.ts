/**
 * DishController — Unit Tests
 */
jest.mock('../../../services/dish.service', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCategory: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

import dishController from '../../../controllers/dish.controller';
import dishService from '../../../services/dish.service';

const svc = dishService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {}, user: { id: 1 },
  ...overrides,
});
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('DishController', () => {
  describe('getDishes()', () => {
    it('should return dishes with filters', async () => {
      svc.findAll.mockResolvedValue([{ id: 'd-1' }]);
      const response = res();
      await dishController.getDishes(req({ query: { categoryId: 'cat-1', isActive: 'true', search: 'zupa' } }), response);
      expect(svc.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-1', isActive: true, search: 'zupa' })
      );
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getDishById()', () => {
    it('should return dish', async () => {
      svc.findOne.mockResolvedValue({ id: 'd-1', name: 'Zupa' });
      const response = res();
      await dishController.getDishById(req({ params: { id: 'd-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should throw 404 when not found', async () => {
      svc.findOne.mockResolvedValue(null);
      await expect(dishController.getDishById(req({ params: { id: 'x' } }), res()))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getDishesByCategory()', () => {
    it('should return dishes for category', async () => {
      svc.findByCategory.mockResolvedValue([{ id: 'd-1' }]);
      const response = res();
      await dishController.getDishesByCategory(req({ params: { categoryId: 'cat-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createDish()', () => {
    it('should throw 401 when no user', async () => {
      await expect(dishController.createDish(
        req({ user: undefined, body: { name: 'Zupa', categoryId: 'cat-1' } }), res()
      )).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when name missing', async () => {
      await expect(dishController.createDish(
        req({ body: { categoryId: 'cat-1' } }), res()
      )).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 201 on success', async () => {
      svc.create.mockResolvedValue({ id: 'd-new', name: 'Zupa pomidorowa' });
      const response = res();
      await dishController.createDish(
        req({ body: { name: 'Zupa pomidorowa', categoryId: 'cat-1' } }), response
      );
      expect(response.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateDish()', () => {
    it('should throw 401 when no user', async () => {
      await expect(dishController.updateDish(
        req({ user: undefined, params: { id: 'd-1' } }), res()
      )).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on success', async () => {
      svc.update.mockResolvedValue({ id: 'd-1', name: 'Updated' });
      const response = res();
      await dishController.updateDish(req({ params: { id: 'd-1' }, body: { name: 'Updated' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteDish()', () => {
    it('should throw 401 when no user', async () => {
      await expect(dishController.deleteDish(
        req({ user: undefined, params: { id: 'd-1' } }), res()
      )).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on success', async () => {
      svc.remove.mockResolvedValue(undefined);
      const response = res();
      await dishController.deleteDish(req({ params: { id: 'd-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });
});
