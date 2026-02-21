/**
 * AddonGroup Controller — Branch coverage tests
 * Covers: isActive ternary, ZodError, not found errors, generic → next()
 */

jest.mock('../../../services/addonGroup.service', () => ({
  addonGroupService: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    assignDishes: jest.fn(),
    removeDish: jest.fn(),
  },
}));

import { AddonGroupController } from '../../../controllers/addonGroup.controller';
import { addonGroupService } from '../../../services/addonGroup.service';

const ctrl = new AddonGroupController();
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe('AddonGroupController branches', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list()', () => {
    it('should pass isActive=true', async () => {
      (addonGroupService.list as jest.Mock).mockResolvedValue([]);
      await ctrl.list({ query: { isActive: 'true' } } as any, mockRes(), mockNext);
      expect(addonGroupService.list).toHaveBeenCalledWith({ isActive: true, search: undefined });
    });

    it('should pass isActive=false', async () => {
      (addonGroupService.list as jest.Mock).mockResolvedValue([]);
      await ctrl.list({ query: { isActive: 'false' } } as any, mockRes(), mockNext);
      expect(addonGroupService.list).toHaveBeenCalledWith({ isActive: false, search: undefined });
    });

    it('should pass isActive=undefined when no filter', async () => {
      (addonGroupService.list as jest.Mock).mockResolvedValue([]);
      await ctrl.list({ query: {} } as any, mockRes(), mockNext);
      expect(addonGroupService.list).toHaveBeenCalledWith({ isActive: undefined, search: undefined });
    });

    it('should pass search param', async () => {
      (addonGroupService.list as jest.Mock).mockResolvedValue([]);
      await ctrl.list({ query: { search: 'bar' } } as any, mockRes(), mockNext);
      expect(addonGroupService.list).toHaveBeenCalledWith({ isActive: undefined, search: 'bar' });
    });

    it('should call next on error', async () => {
      (addonGroupService.list as jest.Mock).mockRejectedValue(new Error('db'));
      await ctrl.list({ query: {} } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getById()', () => {
    it('should return 200 on success', async () => {
      (addonGroupService.getById as jest.Mock).mockResolvedValue({ id: '1' });
      const res = mockRes();
      await ctrl.getById({ params: { id: '1' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when not found', async () => {
      (addonGroupService.getById as jest.Mock).mockRejectedValue(new Error('Addon group not found'));
      const res = mockRes();
      await ctrl.getById({ params: { id: 'x' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should call next on generic error', async () => {
      (addonGroupService.getById as jest.Mock).mockRejectedValue(new Error('DB'));
      await ctrl.getById({ params: { id: 'x' } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next on non-Error', async () => {
      (addonGroupService.getById as jest.Mock).mockRejectedValue('string error');
      await ctrl.getById({ params: { id: 'x' } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('create()', () => {
    it('should return 201 on success', async () => {
      (addonGroupService.create as jest.Mock).mockResolvedValue({ id: '1' });
      const res = mockRes();
      await ctrl.create({ body: { name: 'A', priceType: 'FREE' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 on ZodError', async () => {
      const res = mockRes();
      await ctrl.create({ body: { priceType: 'INVALID' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should call next on service error', async () => {
      (addonGroupService.create as jest.Mock).mockRejectedValue(new Error('DB'));
      await ctrl.create({ body: { name: 'A', priceType: 'FREE' } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('should return 200 on success', async () => {
      (addonGroupService.update as jest.Mock).mockResolvedValue({ id: '1' });
      const res = mockRes();
      await ctrl.update({ params: { id: '1' }, body: { name: 'B' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on ZodError', async () => {
      const res = mockRes();
      await ctrl.update({ params: { id: '1' }, body: { priceType: 'BAD' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when not found', async () => {
      (addonGroupService.update as jest.Mock).mockRejectedValue(new Error('Addon group not found'));
      const res = mockRes();
      await ctrl.update({ params: { id: 'x' }, body: { name: 'B' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should call next on generic error', async () => {
      (addonGroupService.update as jest.Mock).mockRejectedValue(new Error('DB'));
      await ctrl.update({ params: { id: '1' }, body: { name: 'B' } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next on non-Error', async () => {
      (addonGroupService.update as jest.Mock).mockRejectedValue('str');
      await ctrl.update({ params: { id: '1' }, body: { name: 'B' } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('delete()', () => {
    it('should return 200 on success', async () => {
      (addonGroupService.delete as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      await ctrl.delete({ params: { id: '1' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when not found', async () => {
      (addonGroupService.delete as jest.Mock).mockRejectedValue(new Error('Addon group not found'));
      const res = mockRes();
      await ctrl.delete({ params: { id: 'x' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should call next on generic error', async () => {
      (addonGroupService.delete as jest.Mock).mockRejectedValue(new Error('DB'));
      await ctrl.delete({ params: { id: '1' } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next on non-Error', async () => {
      (addonGroupService.delete as jest.Mock).mockRejectedValue(42);
      await ctrl.delete({ params: { id: '1' } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('assignDishes()', () => {
    const validDish = { dishId: '550e8400-e29b-41d4-a716-446655440000' };

    it('should return 200 on success', async () => {
      (addonGroupService.assignDishes as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      await ctrl.assignDishes({ params: { id: '1' }, body: { dishes: [validDish] } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on ZodError', async () => {
      const res = mockRes();
      await ctrl.assignDishes({ params: { id: '1' }, body: { dishes: 'bad' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when group not found', async () => {
      (addonGroupService.assignDishes as jest.Mock).mockRejectedValue(new Error('Addon group not found'));
      const res = mockRes();
      await ctrl.assignDishes({ params: { id: 'x' }, body: { dishes: [validDish] } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should call next on generic error', async () => {
      (addonGroupService.assignDishes as jest.Mock).mockRejectedValue(new Error('DB'));
      await ctrl.assignDishes({ params: { id: '1' }, body: { dishes: [validDish] } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next on non-Error', async () => {
      (addonGroupService.assignDishes as jest.Mock).mockRejectedValue(null);
      await ctrl.assignDishes({ params: { id: '1' }, body: { dishes: [validDish] } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('removeDish()', () => {
    it('should return 200 on success', async () => {
      (addonGroupService.removeDish as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      await ctrl.removeDish({ params: { groupId: '1', dishId: '2' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when not found', async () => {
      (addonGroupService.removeDish as jest.Mock).mockRejectedValue(new Error('Dish not found in addon group'));
      const res = mockRes();
      await ctrl.removeDish({ params: { groupId: '1', dishId: '2' } } as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should call next on generic error', async () => {
      (addonGroupService.removeDish as jest.Mock).mockRejectedValue(new Error('DB'));
      await ctrl.removeDish({ params: { groupId: '1', dishId: '2' } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next on non-Error', async () => {
      (addonGroupService.removeDish as jest.Mock).mockRejectedValue(false);
      await ctrl.removeDish({ params: { groupId: '1', dishId: '2' } } as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
