/**
 * PackageCategoryController — Comprehensive Unit Tests
 * Controller is thin: delegates to packageCategoryService, errors propagate to asyncHandler.
 */

const mockService = {
  getByPackageWithDishes: jest.fn(),
  getById: jest.fn(),
  createFromInput: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  bulkUpdateFromInput: jest.fn(),
};

jest.mock('../../../services/packageCategory.service', () => ({
  packageCategoryService: mockService,
}));

jest.mock('../../../validation/menu.validation', () => ({
  bulkUpdateCategorySettingsSchema: {
    safeParse: jest.fn(),
  },
}));

import { packageCategoryController as ctrl } from '../../../controllers/packageCategory.controller';
import { bulkUpdateCategorySettingsSchema } from '../../../validation/menu.validation';
import { AppError } from '../../../utils/AppError';

const safeParse = (bulkUpdateCategorySettingsSchema as any).safeParse as jest.Mock;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
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

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('PackageCategoryController', () => {
  // ========== getByPackage ==========
  describe('getByPackage()', () => {
    it('should throw 404 when package not found', async () => {
      mockService.getByPackageWithDishes.mockRejectedValue(AppError.notFound('Package'));
      const response = res();
      await expect(ctrl.getByPackage(req({ params: { packageId: 'x' } }), response))
        .rejects.toThrow('nie znaleziono');
    });

    it('should return categories with dishes', async () => {
      mockService.getByPackageWithDishes.mockResolvedValue({
        packageId: 'pkg-1', packageName: 'Gold',
        categories: [{
          id: 'cs-1', categoryId: 'cat-1', categoryName: 'Zupy', categorySlug: 'zupy',
          categoryIcon: 'soup', categoryColor: '#f00',
          minSelect: 1, maxSelect: 3, isRequired: true, customLabel: 'Zupy',
          displayOrder: 0, extraItemPrice: null, maxExtra: null, portionTarget: 'ALL',
          dishes: [{ id: 'd-1', name: 'Pomidorowa', description: 'Opis', allergens: ['gluten'], displayOrder: 1 }],
        }],
      });
      const response = res();
      await ctrl.getByPackage(req({ params: { packageId: 'pkg-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ packageName: 'Gold' }) })
      );
    });

    it('should use customLabel when set', async () => {
      mockService.getByPackageWithDishes.mockResolvedValue({
        packageId: 'pkg-1', packageName: 'Gold',
        categories: [{
          id: 'cs-1', categoryId: 'cat-1', categoryName: 'Zupy', categorySlug: 'zupy',
          categoryIcon: null, categoryColor: null,
          minSelect: 1, maxSelect: 2, isRequired: false, customLabel: 'Nasze zupy',
          displayOrder: 1, extraItemPrice: null, maxExtra: null, portionTarget: 'ALL',
          dishes: [],
        }],
      });
      const response = res();
      await ctrl.getByPackage(req({ params: { packageId: 'pkg-1' } }), response);
      const data = response.json.mock.calls[0][0].data;
      expect(data.categories[0].customLabel).toBe('Nasze zupy');
    });

    it('should propagate unexpected errors', async () => {
      mockService.getByPackageWithDishes.mockRejectedValue(new Error('db'));
      const response = res();
      await expect(ctrl.getByPackage(req({ params: { packageId: 'x' } }), response))
        .rejects.toThrow('db');
    });
  });

  // ========== getById ==========
  describe('getById()', () => {
    it('should throw 404 when not found', async () => {
      mockService.getById.mockRejectedValue(AppError.notFound('Category setting'));
      const response = res();
      await expect(ctrl.getById(req({ params: { id: 'x' } }), response))
        .rejects.toThrow('nie znaleziono');
    });

    it('should return setting', async () => {
      mockService.getById.mockResolvedValue({ id: 'cs-1' });
      const response = res();
      await ctrl.getById(req({ params: { id: 'cs-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 'cs-1' } })
      );
    });

    it('should propagate unexpected errors', async () => {
      mockService.getById.mockRejectedValue(new Error('db'));
      const response = res();
      await expect(ctrl.getById(req({ params: { id: 'x' } }), response))
        .rejects.toThrow('db');
    });
  });

  // ========== create ==========
  describe('create()', () => {
    it('should throw 400 when packageId missing', async () => {
      mockService.createFromInput.mockRejectedValue(AppError.badRequest('packageId and categoryId are required'));
      const response = res();
      await expect(ctrl.create(req({ body: { categoryId: 'c-1' } }), response))
        .rejects.toThrow('packageId and categoryId are required');
    });

    it('should throw 400 when categoryId missing', async () => {
      mockService.createFromInput.mockRejectedValue(AppError.badRequest('packageId and categoryId are required'));
      const response = res();
      await expect(ctrl.create(req({ body: { packageId: 'p-1' } }), response))
        .rejects.toThrow('packageId and categoryId are required');
    });

    it('should throw 400 when minSelect > maxSelect', async () => {
      mockService.createFromInput.mockRejectedValue(
        AppError.badRequest('Minimalna wartość nie może być większa niż maksymalna')
      );
      const response = res();
      await expect(ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 5, maxSelect: 2 } }), response))
        .rejects.toThrow('Minimalna wartość');
    });

    it('should throw 404 when package not found', async () => {
      mockService.createFromInput.mockRejectedValue(AppError.notFound('Package'));
      const response = res();
      await expect(ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 1, maxSelect: 3 } }), response))
        .rejects.toThrow('nie znaleziono');
    });

    it('should throw 404 when category not found', async () => {
      mockService.createFromInput.mockRejectedValue(AppError.notFound('Category'));
      const response = res();
      await expect(ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 1, maxSelect: 3 } }), response))
        .rejects.toThrow('nie znaleziono');
    });

    it('should throw 409 when duplicate', async () => {
      mockService.createFromInput.mockRejectedValue(
        AppError.conflict('Category setting already exists for this package')
      );
      const response = res();
      await expect(ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 1, maxSelect: 3 } }), response))
        .rejects.toThrow('already exists');
    });

    it('should return 201 on success with defaults', async () => {
      mockService.createFromInput.mockResolvedValue({ id: 'cs-new' });
      const response = res();
      await ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1' } }), response);
      expect(response.status).toHaveBeenCalledWith(201);
    });

    it('should return 201 with explicit values', async () => {
      mockService.createFromInput.mockResolvedValue({ id: 'cs-new' });
      const response = res();
      await ctrl.create(req({ body: {
        packageId: 'p-1', categoryId: 'c-1',
        minSelect: 2, maxSelect: 5, isRequired: false, isEnabled: false,
        displayOrder: 3, customLabel: 'Custom',
      } }), response);
      expect(response.status).toHaveBeenCalledWith(201);
      expect(mockService.createFromInput).toHaveBeenCalledWith(
        expect.objectContaining({ isRequired: false, isEnabled: false, customLabel: 'Custom' })
      );
    });

    it('should propagate unexpected errors', async () => {
      mockService.createFromInput.mockRejectedValue(new Error('db'));
      const response = res();
      await expect(ctrl.create(req({ body: { packageId: 'p-1', categoryId: 'c-1', minSelect: 1, maxSelect: 2 } }), response))
        .rejects.toThrow('db');
    });
  });

  // ========== update ==========
  describe('update()', () => {
    it('should throw 400 when minSelect > maxSelect', async () => {
      mockService.updateById.mockRejectedValue(
        AppError.badRequest('Minimalna wartość nie może być większa niż maksymalna')
      );
      const response = res();
      await expect(ctrl.update(req({ params: { id: 'cs-1' }, body: { minSelect: 5, maxSelect: 2 } }), response))
        .rejects.toThrow('Minimalna wartość');
    });

    it('should throw 404 when not found', async () => {
      mockService.updateById.mockRejectedValue(AppError.notFound('Category setting'));
      const response = res();
      await expect(ctrl.update(req({ params: { id: 'x' }, body: { minSelect: 1 } }), response))
        .rejects.toThrow('nie znaleziono');
    });

    it('should return 200 on success', async () => {
      mockService.updateById.mockResolvedValue({ id: 'cs-1', minSelect: 2 });
      const response = res();
      await ctrl.update(req({ params: { id: 'cs-1' }, body: { minSelect: 2 } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should skip minSelect>maxSelect check when only one provided', async () => {
      mockService.updateById.mockResolvedValue({ id: 'cs-1' });
      const response = res();
      await ctrl.update(req({ params: { id: 'cs-1' }, body: { minSelect: 5 } }), response);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should propagate unexpected errors', async () => {
      mockService.updateById.mockRejectedValue(new Error('db'));
      const response = res();
      await expect(ctrl.update(req({ params: { id: 'x' }, body: {} }), response))
        .rejects.toThrow('db');
    });
  });

  // ========== delete ==========
  describe('delete()', () => {
    it('should throw 404 when not found', async () => {
      mockService.deleteById.mockRejectedValue(AppError.notFound('Category setting'));
      const response = res();
      await expect(ctrl.delete(req({ params: { id: 'x' } }), response))
        .rejects.toThrow('nie znaleziono');
    });

    it('should return 200 on success', async () => {
      mockService.deleteById.mockResolvedValue(undefined);
      const response = res();
      await ctrl.delete(req({ params: { id: 'cs-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should propagate unexpected errors', async () => {
      mockService.deleteById.mockRejectedValue(new Error('db'));
      const response = res();
      await expect(ctrl.delete(req({ params: { id: 'x' } }), response))
        .rejects.toThrow('db');
    });
  });

  // ========== bulkUpdate ==========
  describe('bulkUpdate()', () => {
    it('should throw 400 on validation failure', async () => {
      safeParse.mockReturnValue({ success: false, error: { errors: [{ path: ['x'], message: 'bad' }] } });
      const response = res();
      await expect(ctrl.bulkUpdate(req({ params: { packageId: 'pkg-1' }, body: {} }), response))
        .rejects.toThrow('Błąd walidacji');
    });

    it('should throw 404 when package not found', async () => {
      safeParse.mockReturnValue({ success: true, data: { settings: [] } });
      mockService.bulkUpdateFromInput.mockRejectedValue(AppError.notFound('Package'));
      const response = res();
      await expect(ctrl.bulkUpdate(req({ params: { packageId: 'x' } }), response))
        .rejects.toThrow('nie znaleziono');
    });

    it('should return 200 with empty settings', async () => {
      safeParse.mockReturnValue({ success: true, data: { settings: [] } });
      mockService.bulkUpdateFromInput.mockResolvedValue([]);
      const response = res();
      await ctrl.bulkUpdate(req({ params: { packageId: 'pkg-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [] })
      );
    });

    it('should create settings in transaction', async () => {
      const settings = [
        { categoryId: 'c-1', minSelect: 1, maxSelect: 3, isRequired: true, isEnabled: true, displayOrder: 0 },
      ];
      safeParse.mockReturnValue({ success: true, data: { settings } });
      mockService.bulkUpdateFromInput.mockResolvedValue([{ id: 'cs-new' }]);
      const response = res();
      await ctrl.bulkUpdate(req({ params: { packageId: 'pkg-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should use defaults for optional fields', async () => {
      const settings = [
        { categoryId: 'c-1', minSelect: 1, maxSelect: 2 },
      ];
      safeParse.mockReturnValue({ success: true, data: { settings } });
      mockService.bulkUpdateFromInput.mockResolvedValue([{ id: 'cs-new' }]);
      const response = res();
      await ctrl.bulkUpdate(req({ params: { packageId: 'pkg-1' } }), response);
      expect(mockService.bulkUpdateFromInput).toHaveBeenCalledWith('pkg-1', settings);
    });

    it('should propagate unexpected errors', async () => {
      safeParse.mockReturnValue({ success: true, data: { settings: [] } });
      mockService.bulkUpdateFromInput.mockRejectedValue(new Error('db'));
      const response = res();
      await expect(ctrl.bulkUpdate(req({ params: { packageId: 'x' } }), response))
        .rejects.toThrow('db');
    });
  });
});
