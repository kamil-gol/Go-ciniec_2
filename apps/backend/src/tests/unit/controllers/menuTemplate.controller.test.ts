/**
 * MenuTemplateController — Comprehensive Unit Tests
 * Covers all methods, error handling branches, and downloadPdf.
 */
import { z } from 'zod';

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
  pdfService: {
    generateMenuCardPDF: jest.fn(),
  },
}));

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    packageCategorySettings: {
      findMany: jest.fn(),
    },
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
import { pdfService } from '../../../services/pdf.service';
import { prisma } from '../../../lib/prisma';
import * as schemas from '../../../validation/menu.validation';

const ctrl = new MenuTemplateController();
const svc = menuService as any;
const pdfSvc = pdfService as any;
const db = (prisma as any).packageCategorySettings;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {}, user: { id: 'u-1' },
  ...overrides,
});

const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn();
  r.send = jest.fn().mockReturnValue(r);
  return r;
};

const next = jest.fn();

function zodError() {
  return new z.ZodError([{ code: 'custom', message: 'bad', path: ['x'] } as any]);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('MenuTemplateController', () => {
  // ========== list() ==========
  describe('list()', () => {
    it('should return 200 with templates', async () => {
      svc.getMenuTemplates.mockResolvedValue([{ id: 't-1' }]);
      const response = res();
      await ctrl.list(req({ query: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, count: 1 })
      );
    });

    it('should return 400 on ZodError', async () => {
      (schemas as any).menuTemplateQuerySchema.parse.mockImplementationOnce(() => { throw zodError(); });
      const response = res();
      await ctrl.list(req(), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Błąd walidacji' })
      );
    });

    it('should call next on unknown error', async () => {
      (schemas as any).menuTemplateQuerySchema.parse.mockImplementationOnce(() => { throw new TypeError('fail'); });
      await ctrl.list(req(), res(), next);
      expect(next).toHaveBeenCalledWith(expect.any(TypeError));
    });
  });

  // ========== getById() ==========
  describe('getById()', () => {
    it('should return 200', async () => {
      svc.getMenuTemplateById.mockResolvedValue({ id: 't-1', name: 'Gold' });
      const response = res();
      await ctrl.getById(req({ params: { id: 't-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when template not found', async () => {
      svc.getMenuTemplateById.mockRejectedValue(new Error('Nie znaleziono szablonu menu'));
      const response = res();
      await ctrl.getById(req({ params: { id: 'x' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.getMenuTemplateById.mockRejectedValue(new TypeError('db fail'));
      await ctrl.getById(req({ params: { id: 'x' } }), res(), next);
      expect(next).toHaveBeenCalledWith(expect.any(TypeError));
    });
  });

  // ========== getActive() ==========
  describe('getActive()', () => {
    it('should return 200 with date from query', async () => {
      svc.getActiveMenuForEventType.mockResolvedValue({ id: 't-1' });
      const response = res();
      await ctrl.getActive(req({ params: { eventTypeId: 'et-1' }, query: { date: '2026-06-15' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(svc.getActiveMenuForEventType).toHaveBeenCalledWith(
        'et-1', new Date('2026-06-15')
      );
    });

    it('should use current date when no date query', async () => {
      svc.getActiveMenuForEventType.mockResolvedValue({ id: 't-1' });
      const response = res();
      const before = Date.now();
      await ctrl.getActive(req({ params: { eventTypeId: 'et-1' }, query: {} }), response, next);
      const callDate = svc.getActiveMenuForEventType.mock.calls[0][1] as Date;
      expect(callDate.getTime()).toBeGreaterThanOrEqual(before - 1000);
    });

    it('should return 404 when no active menu found', async () => {
      svc.getActiveMenuForEventType.mockRejectedValue(new Error('Nie znaleziono aktywnego menu dla tego typu wydarzenia'));
      const response = res();
      await ctrl.getActive(req({ params: { eventTypeId: 'et-1' }, query: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.getActiveMenuForEventType.mockRejectedValue(new TypeError('fail'));
      await ctrl.getActive(req({ params: { eventTypeId: 'et-1' }, query: {} }), res(), next);
      expect(next).toHaveBeenCalledWith(expect.any(TypeError));
    });
  });

  // ========== create() ==========
  describe('create()', () => {
    it('should return 201', async () => {
      svc.createMenuTemplate.mockResolvedValue({ id: 't-new' });
      const response = res();
      await ctrl.create(req({ body: { name: 'New' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(201);
    });

    it('should pass 401 to next when no user', async () => {
      await ctrl.create(req({ user: undefined, body: { name: 'X' } }), res(), next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should return 400 on ZodError', async () => {
      (schemas as any).createMenuTemplateSchema.parse.mockImplementationOnce(() => { throw zodError(); });
      const response = res();
      await ctrl.create(req({ body: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should call next on unknown error', async () => {
      svc.createMenuTemplate.mockRejectedValue(new Error('db fail'));
      await ctrl.create(req({ body: { name: 'X' } }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ========== update() ==========
  describe('update()', () => {
    it('should return 200', async () => {
      svc.updateMenuTemplate.mockResolvedValue({ id: 't-1' });
      const response = res();
      await ctrl.update(req({ params: { id: 't-1' }, body: { name: 'Updated' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should pass 401 to next when no user', async () => {
      await ctrl.update(req({ user: undefined, params: { id: 't-1' } }), res(), next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should return 400 on ZodError', async () => {
      (schemas as any).updateMenuTemplateSchema.parse.mockImplementationOnce(() => { throw zodError(); });
      const response = res();
      await ctrl.update(req({ params: { id: 't-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when not found', async () => {
      svc.updateMenuTemplate.mockRejectedValue(new Error('Nie znaleziono szablonu menu'));
      const response = res();
      await ctrl.update(req({ params: { id: 'x' }, body: {} }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.updateMenuTemplate.mockRejectedValue(new TypeError('fail'));
      await ctrl.update(req({ params: { id: 't-1' }, body: {} }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ========== delete() ==========
  describe('delete()', () => {
    it('should return 200', async () => {
      svc.deleteMenuTemplate.mockResolvedValue(undefined);
      const response = res();
      await ctrl.delete(req({ params: { id: 't-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should pass 401 to next when no user', async () => {
      await ctrl.delete(req({ user: undefined, params: { id: 't-1' } }), res(), next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should return 409 on Cannot delete', async () => {
      svc.deleteMenuTemplate.mockRejectedValue(new Error('Nie można usunąć szablonu menu'));
      const response = res();
      await ctrl.delete(req({ params: { id: 't-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(409);
    });

    it('should return 404 when not found', async () => {
      svc.deleteMenuTemplate.mockRejectedValue(new Error('Nie znaleziono szablonu menu'));
      const response = res();
      await ctrl.delete(req({ params: { id: 'x' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.deleteMenuTemplate.mockRejectedValue(new TypeError('fail'));
      await ctrl.delete(req({ params: { id: 't-1' } }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ========== duplicate() ==========
  describe('duplicate()', () => {
    it('should return 201', async () => {
      svc.duplicateMenuTemplate.mockResolvedValue({ id: 't-dup' });
      const response = res();
      await ctrl.duplicate(req({ params: { id: 't-1' }, body: { newName: 'Copy' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(201);
    });

    it('should pass 401 to next when no user', async () => {
      await ctrl.duplicate(req({ user: undefined, params: { id: 't-1' } }), res(), next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should return 400 on ZodError', async () => {
      (schemas as any).duplicateMenuTemplateSchema.parse.mockImplementationOnce(() => { throw zodError(); });
      const response = res();
      await ctrl.duplicate(req({ params: { id: 't-1' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when not found', async () => {
      svc.duplicateMenuTemplate.mockRejectedValue(new Error('Nie znaleziono szablonu menu'));
      const response = res();
      await ctrl.duplicate(req({ params: { id: 'x' }, body: { newName: 'X' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should call next on unknown error', async () => {
      svc.duplicateMenuTemplate.mockRejectedValue(new TypeError('fail'));
      await ctrl.duplicate(req({ params: { id: 't-1' }, body: {} }), res(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ========== downloadPdf() ==========
  describe('downloadPdf()', () => {
    const TEMPLATE = {
      id: 't-1', name: 'Pakiet Wesele', description: 'Desc', variant: 'STANDARD',
      eventType: { name: 'Wesele', color: '#ff0000' },
      packages: [
        {
          id: 'pkg-1', name: 'Gold', description: 'Premium', shortDescription: 'Best',
          pricePerAdult: '250', pricePerChild: '120', pricePerToddler: '0',
          isPopular: true, isRecommended: false, badgeText: 'TOP',
          includedItems: ['DJ', 'Dekoracje'],
          packageOptions: [
            {
              option: { name: 'DJ Pro', description: 'Best DJ', category: 'MUSIC', priceType: 'FLAT', priceAmount: '800' },
              customPrice: null,
              isRequired: true,
            },
          ],
        },
      ],
    };

    const CATEGORY_SETTINGS = [
      {
        customLabel: null,
        category: {
          name: 'Zupy', icon: 'soup',
          dishes: [
            { name: 'Pomidorowa', description: 'Classic', allergens: ['gluten'], isActive: true },
          ],
        },
        minSelect: '1', maxSelect: '2',
      },
    ];

    it('should generate and send PDF', async () => {
      svc.getMenuTemplateById.mockResolvedValue(TEMPLATE);
      db.findMany.mockResolvedValue(CATEGORY_SETTINGS);
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf-data'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(response.send).toHaveBeenCalled();
      expect(pdfSvc.generateMenuCardPDF).toHaveBeenCalledWith(
        expect.objectContaining({
          templateName: 'Pakiet Wesele',
          eventTypeName: 'Wesele',
          eventTypeColor: '#ff0000',
        })
      );
    });

    it('should use customLabel when available', async () => {
      const csWithLabel = [{ ...CATEGORY_SETTINGS[0], customLabel: 'Zupy firmowe' }];
      svc.getMenuTemplateById.mockResolvedValue(TEMPLATE);
      db.findMany.mockResolvedValue(csWithLabel);
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      const pdfData = pdfSvc.generateMenuCardPDF.mock.calls[0][0];
      expect(pdfData.packages[0].courses[0].name).toBe('Zupy firmowe');
    });

    it('should fallback to category name when no customLabel', async () => {
      svc.getMenuTemplateById.mockResolvedValue(TEMPLATE);
      db.findMany.mockResolvedValue(CATEGORY_SETTINGS);
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      const pdfData = pdfSvc.generateMenuCardPDF.mock.calls[0][0];
      expect(pdfData.packages[0].courses[0].name).toBe('Zupy');
    });

    it('should handle template with no packages', async () => {
      svc.getMenuTemplateById.mockResolvedValue({ ...TEMPLATE, packages: null });
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      const pdfData = pdfSvc.generateMenuCardPDF.mock.calls[0][0];
      expect(pdfData.packages).toHaveLength(0);
    });

    it('should handle option with null fields (fallbacks)', async () => {
      const templateWithNullOption = {
        ...TEMPLATE,
        packages: [{
          ...TEMPLATE.packages[0],
          packageOptions: [
            { option: null, customPrice: null, isRequired: false },
          ],
        }],
      };
      svc.getMenuTemplateById.mockResolvedValue(templateWithNullOption);
      db.findMany.mockResolvedValue([]);
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      const pdfData = pdfSvc.generateMenuCardPDF.mock.calls[0][0];
      const opt = pdfData.packages[0].options[0];
      expect(opt.name).toBe('Nieznana opcja');
      expect(opt.category).toBe('OTHER');
      expect(opt.priceType).toBe('FLAT');
      expect(opt.priceAmount).toBe(0);
    });

    it('should handle non-array includedItems', async () => {
      const templateNonArrayItems = {
        ...TEMPLATE,
        packages: [{ ...TEMPLATE.packages[0], includedItems: 'not-an-array' }],
      };
      svc.getMenuTemplateById.mockResolvedValue(templateNonArrayItems);
      db.findMany.mockResolvedValue(CATEGORY_SETTINGS);
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      const pdfData = pdfSvc.generateMenuCardPDF.mock.calls[0][0];
      expect(pdfData.packages[0].includedItems).toEqual([]);
    });

    it('should handle non-array allergens', async () => {
      const csNoAllergens = [{
        ...CATEGORY_SETTINGS[0],
        category: {
          ...CATEGORY_SETTINGS[0].category,
          dishes: [{ name: 'X', description: null, allergens: 'gluten', isActive: true }],
        },
      }];
      svc.getMenuTemplateById.mockResolvedValue(TEMPLATE);
      db.findMany.mockResolvedValue(csNoAllergens);
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      const pdfData = pdfSvc.generateMenuCardPDF.mock.calls[0][0];
      expect(pdfData.packages[0].courses[0].dishes[0].allergens).toEqual([]);
    });

    it('should fallback eventTypeName to Ogolne when no eventType', async () => {
      svc.getMenuTemplateById.mockResolvedValue({ ...TEMPLATE, eventType: null });
      db.findMany.mockResolvedValue([]);
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      const pdfData = pdfSvc.generateMenuCardPDF.mock.calls[0][0];
      expect(pdfData.eventTypeName).toBe('Ogolne');
      expect(pdfData.eventTypeColor).toBeUndefined();
    });

    it('should use customPrice when available', async () => {
      const templateCustomPrice = {
        ...TEMPLATE,
        packages: [{
          ...TEMPLATE.packages[0],
          packageOptions: [{
            option: { name: 'DJ', description: null, category: 'MUSIC', priceType: 'FLAT', priceAmount: '800' },
            customPrice: '500',
            isRequired: false,
          }],
        }],
      };
      svc.getMenuTemplateById.mockResolvedValue(templateCustomPrice);
      db.findMany.mockResolvedValue([]);
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      const pdfData = pdfSvc.generateMenuCardPDF.mock.calls[0][0];
      expect(pdfData.packages[0].options[0].priceAmount).toBe(500);
    });

    it('should handle dishes being null/undefined', async () => {
      const csNoDishes = [{
        ...CATEGORY_SETTINGS[0],
        category: { name: 'Empty', icon: null, dishes: null },
      }];
      svc.getMenuTemplateById.mockResolvedValue(TEMPLATE);
      db.findMany.mockResolvedValue(csNoDishes);
      pdfSvc.generateMenuCardPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      const pdfData = pdfSvc.generateMenuCardPDF.mock.calls[0][0];
      expect(pdfData.packages[0].courses[0].dishes).toEqual([]);
    });

    it('should return 404 when template not found', async () => {
      svc.getMenuTemplateById.mockRejectedValue(new Error('Nie znaleziono szablonu menu'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 'x' } }), response);
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on unknown error', async () => {
      svc.getMenuTemplateById.mockRejectedValue(new TypeError('something broke'));
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Nie udało się wygenerować PDF', details: 'something broke' })
      );
    });

    it('should return 500 with Unknown error for non-Error objects', async () => {
      svc.getMenuTemplateById.mockRejectedValue('string-error');
      const response = res();
      await ctrl.downloadPdf(req({ params: { id: 't-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ details: 'Nieznany błąd' })
      );
    });
  });
});
