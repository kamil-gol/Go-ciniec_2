/**
 * HallController — Unit Tests
 * Uses try/catch + next(error) pattern.
 */
jest.mock('../../../services/hall.service', () => ({
  __esModule: true,
  default: {
    getHalls: jest.fn(),
    getHallById: jest.fn(),
    createHall: jest.fn(),
    updateHall: jest.fn(),
    deleteHall: jest.fn(),
  },
}));

import hallController from '../../../controllers/hall.controller';
import hallService from '../../../services/hall.service';

const svc = hallService as any;

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
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('HallController', () => {
  describe('getHalls()', () => {
    it('should return halls with count', async () => {
      svc.getHalls.mockResolvedValue([{ id: 'h-1', name: 'Sala A' }]);
      const response = res();
      await hallController.getHalls(req({ query: { isActive: 'true' } }), response, next);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, count: 1 })
      );
      expect(svc.getHalls).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
    });

    it('should pass search filter', async () => {
      svc.getHalls.mockResolvedValue([]);
      await hallController.getHalls(req({ query: { search: 'Sala' } }), res(), next);
      expect(svc.getHalls).toHaveBeenCalledWith(expect.objectContaining({ search: 'Sala' }));
    });
  });

  describe('getHallById()', () => {
    it('should return hall', async () => {
      svc.getHallById.mockResolvedValue({ id: 'h-1', name: 'Sala A' });
      const response = res();
      await hallController.getHallById(req({ params: { id: 'h-1' } }), response, next);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'Sala A' }) })
      );
    });
  });

  describe('createHall()', () => {
    it('should forward 401 to next when no user', async () => {
      await hallController.createHall(
        req({ user: undefined, body: { name: 'S', capacity: 100 } }), res(), next
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 when name/capacity missing', async () => {
      const response = res();
      await hallController.createHall(req({ body: { name: '' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 201 on success', async () => {
      svc.createHall.mockResolvedValue({ id: 'h-new', name: 'Sala B', capacity: 200 });
      const response = res();
      await hallController.createHall(
        req({ body: { name: 'Sala B', capacity: 200 } }), response, next
      );
      expect(response.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateHall()', () => {
    it('should forward 401 to next', async () => {
      await hallController.updateHall(req({ user: undefined, params: { id: 'h-1' } }), res(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 200 on success', async () => {
      svc.updateHall.mockResolvedValue({ id: 'h-1' });
      const response = res();
      await hallController.updateHall(req({ params: { id: 'h-1' }, body: { name: 'Updated' } }), response, next);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('deleteHall()', () => {
    it('should forward 401 to next', async () => {
      await hallController.deleteHall(req({ user: undefined, params: { id: 'h-1' } }), res(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 200 on success', async () => {
      svc.deleteHall.mockResolvedValue(undefined);
      const response = res();
      await hallController.deleteHall(req({ params: { id: 'h-1' } }), response, next);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Hall deactivated successfully' })
      );
    });
  });
});
