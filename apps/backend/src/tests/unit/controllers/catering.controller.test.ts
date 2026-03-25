/**
 * CateringController — Unit Tests
 * Uses asyncHandler pattern (no next function).
 * Issue: #236
 */
jest.mock('../../../services/catering.service', () => ({
  __esModule: true,
  getCateringTemplates: jest.fn(),
  getCateringTemplateById: jest.fn(),
  createCateringTemplate: jest.fn(),
  updateCateringTemplate: jest.fn(),
  deleteCateringTemplate: jest.fn(),
  getCateringPackageById: jest.fn(),
  createCateringPackage: jest.fn(),
  updateCateringPackage: jest.fn(),
  deleteCateringPackage: jest.fn(),
  createCateringSection: jest.fn(),
  updateCateringSection: jest.fn(),
  deleteCateringSection: jest.fn(),
  addOptionToSection: jest.fn(),
  updateSectionOption: jest.fn(),
  removeOptionFromSection: jest.fn(),
}));

import * as controller from '../../../controllers/catering.controller';
import * as cateringService from '../../../services/catering.service';

const svc = cateringService as any;

const req = (overrides: any = {}): any => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'user-1' },
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

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockTemplate = { id: 'tmpl-1', name: 'Catering Weselny', slug: 'catering-weselny' };
const mockPackage = { id: 'pkg-1', name: 'Pakiet Gold', basePrice: 250 };
const mockSection = { id: 'sec-1', name: 'Zupy', categoryId: 'cat-1' };
const mockOption = { id: 'opt-1', dishId: 'dish-1', isDefault: false };

describe('CateringController', () => {
  // ═══════════ TEMPLATES ═══════════

  describe('getTemplates()', () => {
    it('should return templates with success', async () => {
      svc.getCateringTemplates.mockResolvedValue([mockTemplate]);
      const response = res();
      await controller.getTemplates(req({ query: {} }), response, next);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [mockTemplate] }),
      );
    });

    it('should pass includeInactive query param', async () => {
      svc.getCateringTemplates.mockResolvedValue([]);
      await controller.getTemplates(
        req({ query: { includeInactive: 'true' } }),
        res(),
        next,
      );
      expect(svc.getCateringTemplates).toHaveBeenCalledWith(true);
    });

    it('should default includeInactive to false', async () => {
      svc.getCateringTemplates.mockResolvedValue([]);
      await controller.getTemplates(req({ query: {} }), res(), next);
      expect(svc.getCateringTemplates).toHaveBeenCalledWith(false);
    });
  });

  describe('getTemplateById()', () => {
    it('should return template by id', async () => {
      svc.getCateringTemplateById.mockResolvedValue(mockTemplate);
      const response = res();
      await controller.getTemplateById(
        req({ params: { id: 'tmpl-1' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockTemplate }),
      );
    });

    it('should forward 404 error via next', async () => {
      svc.getCateringTemplateById.mockRejectedValue(new Error('Not found'));
      // asyncHandler wraps the promise: Promise.resolve(fn(...)).catch(next)
      // Need to flush multiple microtask cycles for catch to fire
      controller.getTemplateById(
        req({ params: { id: 'x' } }),
        res(),
        next,
      );
      // Flush microtasks — two cycles needed for Promise.resolve().catch() chain
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('createTemplate()', () => {
    it('should return 201 on success', async () => {
      svc.createCateringTemplate.mockResolvedValue(mockTemplate);
      const response = res();
      await controller.createTemplate(
        req({ body: { name: 'Catering Weselny', slug: 'catering-weselny' } }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockTemplate }),
      );
    });

    it('should forward validation error via next for invalid body', async () => {
      controller.createTemplate(req({ body: {} }), res(), next);
      await new Promise(process.nextTick);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateTemplate()', () => {
    it('should return updated template', async () => {
      svc.updateCateringTemplate.mockResolvedValue({ ...mockTemplate, name: 'Updated' });
      const response = res();
      await controller.updateTemplate(
        req({ params: { id: 'tmpl-1' }, body: { name: 'Updated' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'Updated' }),
        }),
      );
    });
  });

  describe('deleteTemplate()', () => {
    it('should return success message', async () => {
      svc.deleteCateringTemplate.mockResolvedValue(undefined);
      const response = res();
      await controller.deleteTemplate(
        req({ params: { id: 'tmpl-1' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.any(String) }),
      );
    });
  });

  // ═══════════ PACKAGES ═══════════

  describe('getPackageById()', () => {
    it('should return package by id', async () => {
      svc.getCateringPackageById.mockResolvedValue(mockPackage);
      const response = res();
      await controller.getPackageById(
        req({ params: { packageId: 'pkg-1' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockPackage }),
      );
    });
  });

  describe('createPackage()', () => {
    it('should return 201 on success', async () => {
      svc.createCateringPackage.mockResolvedValue(mockPackage);
      const response = res();
      await controller.createPackage(
        req({
          params: { id: 'tmpl-1' },
          body: { name: 'Pakiet Gold', basePrice: 250 },
        }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(201);
      expect(svc.createCateringPackage).toHaveBeenCalledWith(
        'tmpl-1',
        expect.objectContaining({ name: 'Pakiet Gold' }),
      );
    });

    it('should forward validation error for missing name', async () => {
      controller.createPackage(
        req({ params: { id: 'tmpl-1' }, body: { basePrice: 250 } }),
        res(),
        next,
      );
      await new Promise(process.nextTick);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updatePackage()', () => {
    it('should return updated package', async () => {
      svc.updateCateringPackage.mockResolvedValue({ ...mockPackage, name: 'Updated' });
      const response = res();
      await controller.updatePackage(
        req({ params: { packageId: 'pkg-1' }, body: { name: 'Updated' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });
  });

  describe('deletePackage()', () => {
    it('should return success message', async () => {
      svc.deleteCateringPackage.mockResolvedValue(undefined);
      const response = res();
      await controller.deletePackage(
        req({ params: { packageId: 'pkg-1' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.any(String) }),
      );
    });
  });

  // ═══════════ SECTIONS ═══════════

  describe('createSection()', () => {
    it('should return 201 on success', async () => {
      svc.createCateringSection.mockResolvedValue(mockSection);
      const response = res();
      await controller.createSection(
        req({
          params: { packageId: 'pkg-1' },
          body: { categoryId: '550e8400-e29b-41d4-a716-446655440000' },
        }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(201);
    });

    it('should forward validation error for missing categoryId', async () => {
      controller.createSection(
        req({ params: { packageId: 'pkg-1' }, body: {} }),
        res(),
        next,
      );
      await new Promise(process.nextTick);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateSection()', () => {
    it('should return updated section', async () => {
      svc.updateCateringSection.mockResolvedValue({ ...mockSection, name: 'Updated' });
      const response = res();
      await controller.updateSection(
        req({ params: { sectionId: 'sec-1' }, body: { name: 'Updated' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });
  });

  describe('deleteSection()', () => {
    it('should return success message', async () => {
      svc.deleteCateringSection.mockResolvedValue(undefined);
      const response = res();
      await controller.deleteSection(
        req({ params: { sectionId: 'sec-1' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.any(String) }),
      );
    });
  });

  // ═══════════ OPTIONS ═══════════

  describe('addOption()', () => {
    it('should return 201 on success', async () => {
      svc.addOptionToSection.mockResolvedValue(mockOption);
      const response = res();
      await controller.addOption(
        req({
          params: { sectionId: 'sec-1' },
          body: { dishId: '550e8400-e29b-41d4-a716-446655440000' },
        }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(201);
    });

    it('should forward validation error for missing dishId', async () => {
      controller.addOption(
        req({ params: { sectionId: 'sec-1' }, body: {} }),
        res(),
        next,
      );
      await new Promise(process.nextTick);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateOption()', () => {
    it('should return updated option', async () => {
      svc.updateSectionOption.mockResolvedValue({ ...mockOption, isDefault: true });
      const response = res();
      await controller.updateOption(
        req({ params: { optionId: 'opt-1' }, body: { isDefault: true } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });
  });

  describe('removeOption()', () => {
    it('should return success message', async () => {
      svc.removeOptionFromSection.mockResolvedValue(undefined);
      const response = res();
      await controller.removeOption(
        req({ params: { optionId: 'opt-1' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.any(String) }),
      );
    });
  });
});
