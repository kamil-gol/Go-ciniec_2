/**
 * MenuTemplateController — Unit Tests
 */
jest.mock('../../../services/menu.service', () => ({
  menuService: {
    getMenuTemplates: jest.fn(),
    getMenuTemplateById: jest.fn(),
    getActiveMenuForEventType: jest.fn(),
    createMenuTemplate: jest.fn(),
    updateMenuTemplate: jest.fn(),
    deleteMenuTemplate: jest.fn(),
    duplicateMenuTemplate: jest.fn(),
  },
}));

jest.mock('../../../services/pdf.service', () => ({
  pdfService: { generateMenuCardPDF: jest.fn() },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    packageCategorySettings: { findMany: jest.fn() },
  },
}));

jest.mock('../../../validation/menu.validation', () => ({
  createMenuTemplateSchema: { parse: jest.fn((d: any) => d) },
  updateMenuTemplateSchema: { parse: jest.fn((d: any) => d) },
  duplicateMenuTemplateSchema: { parse: jest.fn((d: any) => d) },
  menuTemplateQuerySchema: { parse: jest.fn((d: any) => d) },
}));

import { MenuTemplateController } from '../../../controllers/menuTemplate.controller';
import { menuService } from '../../../services/menu.service';
import { z } from 'zod';

const controller = new MenuTemplateController();
const svc = menuService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {}, user: { id: 1 },
  ...overrides,
});
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn();
  r.send = jest.fn();
  return r;
};
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('MenuTemplateController', () => {
  describe('list()', () => {
    it('should return 200 with templates', async () => {
      svc.getMenuTemplates.mockResolvedValue([{ id: 't-1' }]);
      const response = res();
      await controller.list(req(), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ count: 1 }));
    });
  });

  describe('getById()', () => {
    it('should return 200', async () => {
      svc.getMenuTemplateById.mockResolvedValue({ id: 't-1', name: 'Wesele Standard' });
      const response = res();
      await controller.getById(req({ params: { id: 't-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should return 404', async () => {
      svc.getMenuTemplateById.mockRejectedValue(new Error('Menu template not found'));
      const response = res();
      await controller.getById(req({ params: { id: 'x' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getActive()', () => {
    it('should return 404 when no active menu', async () => {
      svc.getActiveMenuForEventType.mockRejectedValue(new Error('No active menu found for event type'));
      const response = res();
      await controller.getActive(req({ params: { eventTypeId: 'et-1' }, query: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create()', () => {
    it('should forward 401 to next when no user', async () => {
      await controller.create(req({ user: undefined, body: { name: 'T' } }), res(), next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 201 on success', async () => {
      svc.createMenuTemplate.mockResolvedValue({ id: 't-new', name: 'Nowe' });
      const response = res();
      await controller.create(req({ body: { name: 'Nowe' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update()', () => {
    it('should return 404', async () => {
      svc.updateMenuTemplate.mockRejectedValue(new Error('Menu template not found'));
      const response = res();
      await controller.update(req({ params: { id: 'x' }, body: { name: 'U' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 200 on success', async () => {
      svc.updateMenuTemplate.mockResolvedValue({ id: 't-1' });
      const response = res();
      await controller.update(req({ params: { id: 't-1' }, body: { name: 'Updated' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete()', () => {
    it('should return 404', async () => {
      svc.deleteMenuTemplate.mockRejectedValue(new Error('Menu template not found'));
      const response = res();
      await controller.delete(req({ params: { id: 'x' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 on conflict', async () => {
      svc.deleteMenuTemplate.mockRejectedValue(new Error('Cannot delete: template has reservations'));
      const response = res();
      await controller.delete(req({ params: { id: 't-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(409);
    });

    it('should return 200 on success', async () => {
      svc.deleteMenuTemplate.mockResolvedValue(undefined);
      const response = res();
      await controller.delete(req({ params: { id: 't-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('duplicate()', () => {
    it('should return 201 on success', async () => {
      svc.duplicateMenuTemplate.mockResolvedValue({ id: 't-dup' });
      const response = res();
      await controller.duplicate(
        req({ params: { id: 't-1' }, body: { newName: 'Kopia' } }), response, next
      );
      expect(response.status).toHaveBeenCalledWith(201);
    });
  });
});
