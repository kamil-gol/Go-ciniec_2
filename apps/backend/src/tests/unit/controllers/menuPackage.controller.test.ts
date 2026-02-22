/**
 * MenuPackageController — Unit Tests
 */
jest.mock('../../../services/menu.service', () => ({
  menuService: {
    getAllPackages: jest.fn(),
    getPackagesByTemplateId: jest.fn(),
    getPackagesByEventType: jest.fn(),
    getPackageById: jest.fn(),
    createPackage: jest.fn(),
    updatePackage: jest.fn(),
    deletePackage: jest.fn(),
    reorderPackages: jest.fn(),
  },
}));

jest.mock('../../../validation/menu.validation', () => ({
  createMenuPackageSchema: { parse: jest.fn((d: any) => d) },
  updateMenuPackageSchema: { parse: jest.fn((d: any) => d) },
  reorderPackagesSchema: { parse: jest.fn((d: any) => d) },
}));

import { MenuPackageController } from '../../../controllers/menuPackage.controller';
import { menuService } from '../../../services/menu.service';

const controller = new MenuPackageController();
const svc = menuService as any;

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

describe('MenuPackageController', () => {
  describe('list()', () => {
    it('should list all packages', async () => {
      svc.getAllPackages.mockResolvedValue([{ id: 'p-1' }]);
      const response = res();
      await controller.list(req({ query: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ count: 1 }));
    });

    it('should filter by menuTemplateId', async () => {
      svc.getPackagesByTemplateId.mockResolvedValue([{ id: 'p-1' }]);
      const response = res();
      await controller.list(req({ query: { menuTemplateId: 't-1' } }), response, next);
      expect(svc.getPackagesByTemplateId).toHaveBeenCalledWith('t-1');
    });
  });

  describe('listByEventType()', () => {
    it('should return packages', async () => {
      svc.getPackagesByEventType.mockResolvedValue([]);
      const response = res();
      await controller.listByEventType(req({ params: { eventTypeId: 'et-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getById()', () => {
    it('should return 200', async () => {
      svc.getPackageById.mockResolvedValue({ id: 'p-1', name: 'Gold' });
      const response = res();
      await controller.getById(req({ params: { id: 'p-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should return 404', async () => {
      svc.getPackageById.mockRejectedValue(new Error('Package not found'));
      const response = res();
      await controller.getById(req({ params: { id: 'x' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create()', () => {
    it('should forward 401 to next', async () => {
      await controller.create(req({ user: undefined, body: { name: 'P' } }), res(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 201 on success', async () => {
      svc.createPackage.mockResolvedValue({ id: 'p-new' });
      const response = res();
      await controller.create(req({ body: { name: 'Gold' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update()', () => {
    it('should return 404', async () => {
      svc.updatePackage.mockRejectedValue(new Error('Package not found'));
      const response = res();
      await controller.update(req({ params: { id: 'x' }, body: { name: 'U' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 200', async () => {
      svc.updatePackage.mockResolvedValue({ id: 'p-1' });
      const response = res();
      await controller.update(req({ params: { id: 'p-1' }, body: { name: 'Updated' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete()', () => {
    it('should return 409 on conflict', async () => {
      svc.deletePackage.mockRejectedValue(new Error('Cannot delete: package has reservations'));
      const response = res();
      await controller.delete(req({ params: { id: 'p-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(409);
    });

    it('should return 200', async () => {
      svc.deletePackage.mockResolvedValue(undefined);
      const response = res();
      await controller.delete(req({ params: { id: 'p-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('reorder()', () => {
    it('should return 200', async () => {
      svc.reorderPackages.mockResolvedValue([]);
      const response = res();
      await controller.reorder(req({ body: { packageOrders: [] } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });
});
