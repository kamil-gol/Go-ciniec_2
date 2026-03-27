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

import { MenuPackageController, menuPackageController } from '../../../controllers/menuPackage.controller';
import { menuService } from '../../../services/menu.service';
import {
  createMenuPackageSchema,
  updateMenuPackageSchema,
  reorderPackagesSchema,
} from '../../../validation/menu.validation';
import { z } from 'zod';

const schemas = {
  create: createMenuPackageSchema as any,
  update: updateMenuPackageSchema as any,
  reorder: reorderPackagesSchema as any,
};

function makeZodError(): z.ZodError {
  try { z.string().parse(123); } catch (e) { return e as z.ZodError; }
  throw new Error('unreachable');
}

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

beforeEach(() => {
  jest.clearAllMocks();
  schemas.create.parse.mockImplementation((d: any) => d);
  schemas.update.parse.mockImplementation((d: any) => d);
  schemas.reorder.parse.mockImplementation((d: any) => d);
});

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
      svc.getPackageById.mockRejectedValue(new Error('Nie znaleziono pakietu menu'));
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
      svc.updatePackage.mockRejectedValue(new Error('Nie znaleziono pakietu menu'));
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

  describe('edge cases / branch coverage', () => {
    describe('list() — branch', () => {
      it('should list all packages when no menuTemplateId', async () => {
        svc.getAllPackages.mockResolvedValue([{ id: 'p1' }]);
        const r = res();
        await menuPackageController.list(req({ query: {} }), r, next);
        expect(r.status).toHaveBeenCalledWith(200);
        expect(svc.getAllPackages).toHaveBeenCalled();
        expect(svc.getPackagesByTemplateId).not.toHaveBeenCalled();
      });

      it('should filter by menuTemplateId when string provided', async () => {
        svc.getPackagesByTemplateId.mockResolvedValue([{ id: 'p1' }]);
        const r = res();
        await menuPackageController.list(req({ query: { menuTemplateId: 'tmpl-1' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(200);
        expect(svc.getPackagesByTemplateId).toHaveBeenCalledWith('tmpl-1');
        expect(svc.getAllPackages).not.toHaveBeenCalled();
      });

      it('should fallback to getAllPackages when menuTemplateId is not a string', async () => {
        svc.getAllPackages.mockResolvedValue([]);
        const r = res();
        await menuPackageController.list(req({ query: { menuTemplateId: ['a', 'b'] } }), r, next);
        expect(svc.getAllPackages).toHaveBeenCalled();
      });

      it('should call next on error', async () => {
        svc.getAllPackages.mockRejectedValue(new Error('DB'));
        await menuPackageController.list(req({ query: {} }), res(), next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('listByEventType() — branch', () => {
      it('should return packages', async () => {
        svc.getPackagesByEventType.mockResolvedValue([{ id: 'p1' }]);
        const r = res();
        await menuPackageController.listByEventType(req({ params: { eventTypeId: 'ev-1' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(200);
      });

      it('should call next on error', async () => {
        svc.getPackagesByEventType.mockRejectedValue(new Error('DB'));
        await menuPackageController.listByEventType(req({ params: { eventTypeId: 'ev-1' } }), res(), next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('listByTemplate() — branch', () => {
      it('should return packages', async () => {
        svc.getPackagesByTemplateId.mockResolvedValue([{ id: 'p1' }]);
        const r = res();
        await menuPackageController.listByTemplate(req({ params: { templateId: 'tmpl-1' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(200);
      });

      it('should call next on error', async () => {
        svc.getPackagesByTemplateId.mockRejectedValue(new Error('DB'));
        await menuPackageController.listByTemplate(req({ params: { templateId: 'tmpl-1' } }), res(), next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('getById() — branch', () => {
      it('should return package', async () => {
        svc.getPackageById.mockResolvedValue({ id: 'p1' });
        const r = res();
        await menuPackageController.getById(req({ params: { id: 'p1' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(200);
      });

      it('should return 404 when Package not found', async () => {
        svc.getPackageById.mockRejectedValue(new Error('Nie znaleziono pakietu menu'));
        const r = res();
        await menuPackageController.getById(req({ params: { id: 'bad' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(404);
      });

      it('should call next on unknown error', async () => {
        svc.getPackageById.mockRejectedValue(new Error('DB'));
        await menuPackageController.getById(req({ params: { id: 'p1' } }), res(), next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('create() — branch', () => {
      it('should return 201 on success', async () => {
        svc.createPackage.mockResolvedValue({ id: 'p1' });
        const r = res();
        await menuPackageController.create(req({ body: { name: 'Pkg' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(201);
      });

      it('should return 400 on ZodError', async () => {
        schemas.create.parse.mockImplementation(() => { throw makeZodError(); });
        const r = res();
        await menuPackageController.create(req({ body: {} }), r, next);
        expect(r.status).toHaveBeenCalledWith(400);
      });

      it('should throw unauthorized when no userId', async () => {
        await menuPackageController.create(req({ body: {}, user: undefined }), res(), next);
        expect(next).toHaveBeenCalled();
      });

      it('should call next on unknown error', async () => {
        svc.createPackage.mockRejectedValue(new Error('DB'));
        await menuPackageController.create(req({ body: {} }), res(), next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('update() — branch', () => {
      it('should return 200 on success', async () => {
        svc.updatePackage.mockResolvedValue({ id: 'p1' });
        const r = res();
        await menuPackageController.update(req({ params: { id: 'p1' }, body: { name: 'Updated' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(200);
      });

      it('should return 400 on ZodError', async () => {
        schemas.update.parse.mockImplementation(() => { throw makeZodError(); });
        const r = res();
        await menuPackageController.update(req({ params: { id: 'p1' }, body: {} }), r, next);
        expect(r.status).toHaveBeenCalledWith(400);
      });

      it('should return 404 when Package not found', async () => {
        svc.updatePackage.mockRejectedValue(new Error('Nie znaleziono pakietu menu'));
        const r = res();
        await menuPackageController.update(req({ params: { id: 'bad' }, body: {} }), r, next);
        expect(r.status).toHaveBeenCalledWith(404);
      });

      it('should throw unauthorized when no userId', async () => {
        await menuPackageController.update(req({ params: { id: 'p1' }, body: {}, user: undefined }), res(), next);
        expect(next).toHaveBeenCalled();
      });

      it('should call next on unknown error', async () => {
        svc.updatePackage.mockRejectedValue(new Error('DB'));
        await menuPackageController.update(req({ params: { id: 'p1' }, body: {} }), res(), next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('delete() — branch', () => {
      it('should return 200 on success', async () => {
        svc.deletePackage.mockResolvedValue(undefined);
        const r = res();
        await menuPackageController.delete(req({ params: { id: 'p1' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(200);
      });

      it('should return 409 on Cannot delete', async () => {
        svc.deletePackage.mockRejectedValue(new Error('Cannot delete package with active reservations'));
        const r = res();
        await menuPackageController.delete(req({ params: { id: 'p1' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(409);
      });

      it('should return 404 when Package not found', async () => {
        svc.deletePackage.mockRejectedValue(new Error('Nie znaleziono pakietu menu'));
        const r = res();
        await menuPackageController.delete(req({ params: { id: 'bad' } }), r, next);
        expect(r.status).toHaveBeenCalledWith(404);
      });

      it('should throw unauthorized when no userId', async () => {
        await menuPackageController.delete(req({ params: { id: 'p1' }, user: undefined }), res(), next);
        expect(next).toHaveBeenCalled();
      });

      it('should call next on unknown error', async () => {
        svc.deletePackage.mockRejectedValue(new Error('DB'));
        await menuPackageController.delete(req({ params: { id: 'p1' } }), res(), next);
        expect(next).toHaveBeenCalled();
      });
    });

    describe('reorder() — branch', () => {
      it('should return 200 on success', async () => {
        svc.reorderPackages.mockResolvedValue({ updated: 2 });
        const r = res();
        await menuPackageController.reorder(req({ body: { packageOrders: [{ id: 'p1', order: 1 }] } }), r, next);
        expect(r.status).toHaveBeenCalledWith(200);
      });

      it('should return 400 on ZodError', async () => {
        schemas.reorder.parse.mockImplementation(() => { throw makeZodError(); });
        const r = res();
        await menuPackageController.reorder(req({ body: {} }), r, next);
        expect(r.status).toHaveBeenCalledWith(400);
      });

      it('should call next on unknown error', async () => {
        svc.reorderPackages.mockRejectedValue(new Error('DB'));
        await menuPackageController.reorder(req({ body: { packageOrders: [] } }), res(), next);
        expect(next).toHaveBeenCalled();
      });
    });
  });
});
