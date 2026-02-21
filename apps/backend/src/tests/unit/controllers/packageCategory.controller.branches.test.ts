/**
 * PackageCategory Controller — Branch coverage tests
 * Covers: getByPackage (customLabel || category.name, error.message fallback),
 * create (missing fields, min>max, not found, existing, defaults vs explicit),
 * update (min>max, not found, partial/all spread branches),
 * delete (not found, error without message),
 * bulkUpdate (validation fail, not found, empty settings, defaults vs explicit)
 */

jest.mock('@prisma/client', () => {
  const mockPrismaObj = {
    menuPackage: { findUnique: jest.fn() },
    packageCategorySettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    dishCategory: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrismaObj) };
});

jest.mock('../../../validation/menu.validation', () => ({
  bulkUpdateCategorySettingsSchema: {
    safeParse: jest.fn(),
  },
}));

import { packageCategoryController } from '../../../controllers/packageCategory.controller';
import { PrismaClient } from '@prisma/client';
import { bulkUpdateCategorySettingsSchema } from '../../../validation/menu.validation';

const prisma = new PrismaClient() as any;

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('PackageCategoryController branches', () => {
  beforeEach(() => jest.clearAllMocks());

  // ===== getByPackage =====
  describe('getByPackage', () => {
    it('should return 404 when package not found', async () => {
      prisma.menuPackage.findUnique.mockResolvedValue(null);
      const req = { params: { packageId: 'p1' } } as any;
      const res = mockRes();
      await packageCategoryController.getByPackage(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should use customLabel fallback to category.name when customLabel null', async () => {
      prisma.menuPackage.findUnique.mockResolvedValue({
        id: 'p1', name: 'Gold',
        categorySettings: [
          {
            id: 'cs1', categoryId: 'c1', minSelect: 1, maxSelect: 3,
            isRequired: true, customLabel: null, displayOrder: 1,
            category: { name: 'Zupy', slug: 'zupy', icon: null, color: null, dishes: [] },
          },
          {
            id: 'cs2', categoryId: 'c2', minSelect: 0, maxSelect: 2,
            isRequired: false, customLabel: 'Specjalne', displayOrder: 2,
            category: { name: 'Desery', slug: 'desery', icon: null, color: null, dishes: [] },
          },
        ],
      });
      const req = { params: { packageId: 'p1' } } as any;
      const res = mockRes();
      await packageCategoryController.getByPackage(req, res);
      const data = res.json.mock.calls[0][0].data;
      expect(data.categories[0].customLabel).toBe('Zupy');
      expect(data.categories[1].customLabel).toBe('Specjalne');
    });

    it('should handle error without message', async () => {
      prisma.menuPackage.findUnique.mockRejectedValue({ code: 'ERR' });
      const req = { params: { packageId: 'p1' } } as any;
      const res = mockRes();
      await packageCategoryController.getByPackage(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  // ===== create =====
  describe('create', () => {
    it('should return 400 when missing packageId/categoryId', async () => {
      const req = { body: {} } as any;
      const res = mockRes();
      await packageCategoryController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when minSelect > maxSelect', async () => {
      const req = { body: { packageId: 'p1', categoryId: 'c1', minSelect: 5, maxSelect: 2 } } as any;
      const res = mockRes();
      await packageCategoryController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Minimalna') }));
    });

    it('should return 404 when package not found', async () => {
      prisma.menuPackage.findUnique.mockResolvedValue(null);
      const req = { body: { packageId: 'p1', categoryId: 'c1', minSelect: 1, maxSelect: 3 } } as any;
      const res = mockRes();
      await packageCategoryController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when category not found', async () => {
      prisma.menuPackage.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.dishCategory.findUnique.mockResolvedValue(null);
      const req = { body: { packageId: 'p1', categoryId: 'c1', minSelect: 1, maxSelect: 3 } } as any;
      const res = mockRes();
      await packageCategoryController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 when setting already exists', async () => {
      prisma.menuPackage.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.dishCategory.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'existing' });
      const req = { body: { packageId: 'p1', categoryId: 'c1', minSelect: 1, maxSelect: 3 } } as any;
      const res = mockRes();
      await packageCategoryController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should create with default values when optional fields missing', async () => {
      prisma.menuPackage.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.dishCategory.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      prisma.packageCategorySettings.create.mockResolvedValue({ id: 'new', category: { name: 'Test' } });
      const req = { body: { packageId: 'p1', categoryId: 'c1' } } as any;
      const res = mockRes();
      await packageCategoryController.create(req, res);
      expect(prisma.packageCategorySettings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            minSelect: 1, maxSelect: 1, isRequired: true, isEnabled: true, displayOrder: 0, customLabel: null,
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create with explicit values', async () => {
      prisma.menuPackage.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.dishCategory.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      prisma.packageCategorySettings.create.mockResolvedValue({ id: 'new', category: { name: 'T' } });
      const req = {
        body: {
          packageId: 'p1', categoryId: 'c1',
          minSelect: 2, maxSelect: 5, isRequired: false, isEnabled: false,
          displayOrder: 3, customLabel: 'My Label',
        },
      } as any;
      const res = mockRes();
      await packageCategoryController.create(req, res);
      expect(prisma.packageCategorySettings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            minSelect: 2, maxSelect: 5, isRequired: false, isEnabled: false,
            displayOrder: 3, customLabel: 'My Label',
          }),
        })
      );
    });
  });

  // ===== getById =====
  describe('getById', () => {
    it('should return 404 when not found', async () => {
      prisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      const req = { params: { id: 'x' } } as any;
      const res = mockRes();
      await packageCategoryController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== update =====
  describe('update', () => {
    it('should return 400 when minSelect > maxSelect', async () => {
      const req = { params: { id: 'cs1' }, body: { minSelect: 10, maxSelect: 2 } } as any;
      const res = mockRes();
      await packageCategoryController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should skip min/max validation when only one provided', async () => {
      prisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs1' });
      prisma.packageCategorySettings.update.mockResolvedValue({ id: 'cs1', category: {}, package: {} });
      const req = { params: { id: 'cs1' }, body: { minSelect: 3 } } as any;
      const res = mockRes();
      await packageCategoryController.update(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 when setting not found', async () => {
      prisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      const req = { params: { id: 'cs1' }, body: { isRequired: true } } as any;
      const res = mockRes();
      await packageCategoryController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update with partial fields (spread branches: some undefined)', async () => {
      prisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs1' });
      prisma.packageCategorySettings.update.mockResolvedValue({ id: 'cs1', category: {}, package: {} });
      const req = { params: { id: 'cs1' }, body: { isRequired: true, customLabel: 'New' } } as any;
      const res = mockRes();
      await packageCategoryController.update(req, res);
      expect(prisma.packageCategorySettings.update).toHaveBeenCalled();
    });

    it('should update with ALL fields (all spread branches true)', async () => {
      prisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs1' });
      prisma.packageCategorySettings.update.mockResolvedValue({ id: 'cs1', category: {}, package: {} });
      const req = {
        params: { id: 'cs1' },
        body: { minSelect: 1, maxSelect: 5, isRequired: false, isEnabled: true, displayOrder: 2, customLabel: 'All' },
      } as any;
      const res = mockRes();
      await packageCategoryController.update(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle error without message', async () => {
      prisma.packageCategorySettings.findUnique.mockRejectedValue({ code: 'ERR' });
      const req = { params: { id: 'cs1' }, body: {} } as any;
      const res = mockRes();
      await packageCategoryController.update(req, res);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  // ===== delete =====
  describe('delete', () => {
    it('should return 404 when not found', async () => {
      prisma.packageCategorySettings.findUnique.mockResolvedValue(null);
      const req = { params: { id: 'cs1' } } as any;
      const res = mockRes();
      await packageCategoryController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete successfully', async () => {
      prisma.packageCategorySettings.findUnique.mockResolvedValue({ id: 'cs1' });
      prisma.packageCategorySettings.delete.mockResolvedValue({});
      const req = { params: { id: 'cs1' } } as any;
      const res = mockRes();
      await packageCategoryController.delete(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle error without message in delete', async () => {
      prisma.packageCategorySettings.findUnique.mockRejectedValue({ code: 'P2002' });
      const req = { params: { id: 'cs1' } } as any;
      const res = mockRes();
      await packageCategoryController.delete(req, res);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  // ===== bulkUpdate =====
  describe('bulkUpdate', () => {
    it('should return 400 on validation failure', async () => {
      (bulkUpdateCategorySettingsSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { errors: [{ path: ['settings', 0, 'minSelect'], message: 'Required' }] },
      });
      const req = { params: { packageId: 'p1' }, body: {} } as any;
      const res = mockRes();
      await packageCategoryController.bulkUpdate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when package not found', async () => {
      (bulkUpdateCategorySettingsSchema.safeParse as jest.Mock).mockReturnValue({
        success: true, data: { settings: [] },
      });
      prisma.menuPackage.findUnique.mockResolvedValue(null);
      const req = { params: { packageId: 'p1' }, body: {} } as any;
      const res = mockRes();
      await packageCategoryController.bulkUpdate(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return empty array when settings empty', async () => {
      (bulkUpdateCategorySettingsSchema.safeParse as jest.Mock).mockReturnValue({
        success: true, data: { settings: [] },
      });
      prisma.menuPackage.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.$transaction.mockImplementation(async (fn: Function) => fn({
        packageCategorySettings: { deleteMany: jest.fn(), create: jest.fn() },
      }));
      const req = { params: { packageId: 'p1' }, body: { settings: [] } } as any;
      const res = mockRes();
      await packageCategoryController.bulkUpdate(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [], message: 'Updated 0 category settings',
      }));
    });

    it('should create settings with defaults when optional fields missing', async () => {
      (bulkUpdateCategorySettingsSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { settings: [{ categoryId: 'c1', minSelect: 1, maxSelect: 3 }] },
      });
      prisma.menuPackage.findUnique.mockResolvedValue({ id: 'p1' });
      const mockCreate = jest.fn().mockResolvedValue({ id: 'cs1', category: { name: 'T' } });
      prisma.$transaction.mockImplementation(async (fn: Function) => fn({
        packageCategorySettings: { deleteMany: jest.fn(), create: mockCreate },
      }));
      const req = { params: { packageId: 'p1' }, body: {} } as any;
      const res = mockRes();
      await packageCategoryController.bulkUpdate(req, res);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          isRequired: true, isEnabled: true, displayOrder: 0, customLabel: null,
        }),
      }));
    });

    it('should create settings with explicit values', async () => {
      (bulkUpdateCategorySettingsSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: {
          settings: [{
            categoryId: 'c1', minSelect: 2, maxSelect: 4,
            isRequired: false, isEnabled: false, displayOrder: 5, customLabel: 'Custom',
          }],
        },
      });
      prisma.menuPackage.findUnique.mockResolvedValue({ id: 'p1' });
      const mockCreate = jest.fn().mockResolvedValue({ id: 'cs1', category: { name: 'T' } });
      prisma.$transaction.mockImplementation(async (fn: Function) => fn({
        packageCategorySettings: { deleteMany: jest.fn(), create: mockCreate },
      }));
      const req = { params: { packageId: 'p1' }, body: {} } as any;
      const res = mockRes();
      await packageCategoryController.bulkUpdate(req, res);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          isRequired: false, isEnabled: false, displayOrder: 5, customLabel: 'Custom',
        }),
      }));
    });
  });
});
