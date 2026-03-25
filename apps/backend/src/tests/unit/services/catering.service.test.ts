/**
 * Unit tests for catering.service.ts
 * Covers: Templates CRUD, Packages CRUD, Sections CRUD, Options CRUD
 * Issue: #236
 */

const mockPrisma = {
  cateringTemplate: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cateringPackage: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cateringPackageSection: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cateringSectionOption: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  dish: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: mockPrisma }));

import * as cateringService from '@services/catering.service';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockTemplate = {
  id: 'tmpl-1',
  name: 'Catering Weselny',
  description: 'Opis',
  slug: 'catering-weselny',
  imageUrl: null,
  isActive: true,
  displayOrder: 0,
  packages: [],
};

const mockPackage = {
  id: 'pkg-1',
  templateId: 'tmpl-1',
  name: 'Pakiet Gold',
  description: 'Opis',
  basePrice: 250,
  priceType: 'PER_PERSON',
  template: mockTemplate,
  sections: [],
};

const mockSection = {
  id: 'sec-1',
  packageId: 'pkg-1',
  categoryId: 'cat-1',
  name: 'Zupy',
  minSelect: 1,
  maxSelect: 2,
  isRequired: true,
  displayOrder: 0,
  category: { id: 'cat-1', name: 'Zupy' },
  options: [],
};

const mockDish = { id: 'dish-1', name: 'Zupa pomidorowa' };

const mockOption = {
  id: 'opt-1',
  sectionId: 'sec-1',
  dishId: 'dish-1',
  customPrice: null,
  isDefault: false,
  displayOrder: 0,
  dish: mockDish,
};

describe('CateringService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ═══════════ TEMPLATES ═══════════

  describe('getCateringTemplates', () => {
    it('should return only active templates by default', async () => {
      mockPrisma.cateringTemplate.findMany.mockResolvedValue([mockTemplate]);
      const result = await cateringService.getCateringTemplates();
      expect(result).toHaveLength(1);
      expect(mockPrisma.cateringTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('should return all templates when includeInactive is true', async () => {
      mockPrisma.cateringTemplate.findMany.mockResolvedValue([mockTemplate]);
      await cateringService.getCateringTemplates(true);
      expect(mockPrisma.cateringTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  describe('getCateringTemplateById', () => {
    it('should return template by id', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(mockTemplate);
      const result = await cateringService.getCateringTemplateById('tmpl-1');
      expect(result.id).toBe('tmpl-1');
    });

    it('should throw 404 when template not found', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(null);
      await expect(cateringService.getCateringTemplateById('x')).rejects.toThrow(
        'Szablon cateringu nie istnieje',
      );
    });
  });

  describe('createCateringTemplate', () => {
    it('should create a new template', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(null);
      mockPrisma.cateringTemplate.create.mockResolvedValue(mockTemplate);
      const result = await cateringService.createCateringTemplate({
        name: 'Catering Weselny',
        slug: 'catering-weselny',
      });
      expect(result.id).toBe('tmpl-1');
      expect(mockPrisma.cateringTemplate.create).toHaveBeenCalledWith({
        data: { name: 'Catering Weselny', slug: 'catering-weselny' },
      });
    });

    it('should throw 409 when slug already exists', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(mockTemplate);
      await expect(
        cateringService.createCateringTemplate({
          name: 'Inna Nazwa',
          slug: 'catering-weselny',
        }),
      ).rejects.toThrow(/już istnieje/);
    });
  });

  describe('updateCateringTemplate', () => {
    it('should update an existing template', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.cateringTemplate.update.mockResolvedValue({
        ...mockTemplate,
        name: 'Updated',
      });
      const result = await cateringService.updateCateringTemplate('tmpl-1', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });

    it('should throw 404 when template not found', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(null);
      await expect(
        cateringService.updateCateringTemplate('x', { name: 'Y' }),
      ).rejects.toThrow('Szablon cateringu nie istnieje');
    });

    it('should throw 409 when slug conflicts with another template', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.cateringTemplate.findFirst.mockResolvedValue({
        id: 'tmpl-2',
        slug: 'taken-slug',
      });
      await expect(
        cateringService.updateCateringTemplate('tmpl-1', { slug: 'taken-slug' }),
      ).rejects.toThrow(/już zajęty/);
    });

    it('should allow update when slug is not changed or no conflict', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.cateringTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.cateringTemplate.update.mockResolvedValue({
        ...mockTemplate,
        slug: 'new-slug',
      });
      const result = await cateringService.updateCateringTemplate('tmpl-1', {
        slug: 'new-slug',
      });
      expect(result.slug).toBe('new-slug');
    });
  });

  describe('deleteCateringTemplate', () => {
    it('should delete an existing template', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.cateringTemplate.delete.mockResolvedValue(mockTemplate);
      await cateringService.deleteCateringTemplate('tmpl-1');
      expect(mockPrisma.cateringTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
      });
    });

    it('should throw 404 when template not found', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(null);
      await expect(cateringService.deleteCateringTemplate('x')).rejects.toThrow(
        'Szablon cateringu nie istnieje',
      );
    });
  });

  // ═══════════ PACKAGES ═══════════

  describe('getCateringPackageById', () => {
    it('should return package by id', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(mockPackage);
      const result = await cateringService.getCateringPackageById('pkg-1');
      expect(result.id).toBe('pkg-1');
    });

    it('should throw 404 when package not found', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(null);
      await expect(cateringService.getCateringPackageById('x')).rejects.toThrow(
        'Pakiet cateringu nie istnieje',
      );
    });
  });

  describe('createCateringPackage', () => {
    it('should create a package for a template', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.cateringPackage.create.mockResolvedValue(mockPackage);
      const result = await cateringService.createCateringPackage('tmpl-1', {
        name: 'Pakiet Gold',
        basePrice: 250,
      });
      expect(result.id).toBe('pkg-1');
      expect(mockPrisma.cateringPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ templateId: 'tmpl-1', name: 'Pakiet Gold' }),
        }),
      );
    });

    it('should throw 404 when template not found', async () => {
      mockPrisma.cateringTemplate.findUnique.mockResolvedValue(null);
      await expect(
        cateringService.createCateringPackage('x', { name: 'Pkg', basePrice: 100 }),
      ).rejects.toThrow('Szablon cateringu nie istnieje');
    });
  });

  describe('updateCateringPackage', () => {
    it('should update an existing package', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.cateringPackage.update.mockResolvedValue({
        ...mockPackage,
        name: 'Updated',
      });
      const result = await cateringService.updateCateringPackage('pkg-1', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });

    it('should throw 404 when package not found', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(null);
      await expect(
        cateringService.updateCateringPackage('x', { name: 'Y' }),
      ).rejects.toThrow('Pakiet cateringu nie istnieje');
    });

    it('should handle tieredPricing null (clear to Prisma.JsonNull)', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.cateringPackage.update.mockResolvedValue({
        ...mockPackage,
        tieredPricing: null,
      });
      await cateringService.updateCateringPackage('pkg-1', {
        tieredPricing: null,
      });
      expect(mockPrisma.cateringPackage.update).toHaveBeenCalled();
      const callData = mockPrisma.cateringPackage.update.mock.calls[0][0].data;
      expect('tieredPricing' in callData).toBe(true);
    });

    it('should handle tieredPricing with data', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.cateringPackage.update.mockResolvedValue(mockPackage);
      const pricing = { '10-20': 200, '21-50': 180 };
      await cateringService.updateCateringPackage('pkg-1', {
        tieredPricing: pricing,
      });
      expect(mockPrisma.cateringPackage.update).toHaveBeenCalled();
    });
  });

  describe('deleteCateringPackage', () => {
    it('should delete an existing package', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.cateringPackage.delete.mockResolvedValue(mockPackage);
      await cateringService.deleteCateringPackage('pkg-1');
      expect(mockPrisma.cateringPackage.delete).toHaveBeenCalledWith({
        where: { id: 'pkg-1' },
      });
    });

    it('should throw 404 when package not found', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(null);
      await expect(cateringService.deleteCateringPackage('x')).rejects.toThrow(
        'Pakiet cateringu nie istnieje',
      );
    });
  });

  // ═══════════ SECTIONS ═══════════

  describe('createCateringSection', () => {
    it('should create a section for a package', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(null);
      mockPrisma.cateringPackageSection.create.mockResolvedValue(mockSection);
      const result = await cateringService.createCateringSection('pkg-1', {
        categoryId: 'cat-1',
        minSelect: 1,
        maxSelect: 2,
      });
      expect(result.id).toBe('sec-1');
    });

    it('should throw 404 when package not found', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(null);
      await expect(
        cateringService.createCateringSection('x', { categoryId: 'cat-1' }),
      ).rejects.toThrow('Pakiet cateringu nie istnieje');
    });

    it('should throw 409 when section for category already exists', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(mockSection);
      await expect(
        cateringService.createCateringSection('pkg-1', { categoryId: 'cat-1' }),
      ).rejects.toThrow(/już istnieje/);
    });

    it('should handle maxSelect undefined (no limit)', async () => {
      mockPrisma.cateringPackage.findUnique.mockResolvedValue(mockPackage);
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(null);
      mockPrisma.cateringPackageSection.create.mockResolvedValue(mockSection);
      await cateringService.createCateringSection('pkg-1', {
        categoryId: 'cat-1',
      });
      expect(mockPrisma.cateringPackageSection.create).toHaveBeenCalled();
    });
  });

  describe('updateCateringSection', () => {
    it('should update an existing section', async () => {
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(mockSection);
      mockPrisma.cateringPackageSection.update.mockResolvedValue({
        ...mockSection,
        name: 'Updated',
      });
      const result = await cateringService.updateCateringSection('sec-1', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });

    it('should throw 404 when section not found', async () => {
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(null);
      await expect(
        cateringService.updateCateringSection('x', { name: 'Y' }),
      ).rejects.toThrow('Sekcja cateringu nie istnieje');
    });

    it('should handle maxSelect null (clear limit)', async () => {
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(mockSection);
      mockPrisma.cateringPackageSection.update.mockResolvedValue({
        ...mockSection,
        maxSelect: null,
      });
      await cateringService.updateCateringSection('sec-1', { maxSelect: null });
      expect(mockPrisma.cateringPackageSection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ maxSelect: null }),
        }),
      );
    });
  });

  describe('deleteCateringSection', () => {
    it('should delete an existing section', async () => {
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(mockSection);
      mockPrisma.cateringPackageSection.delete.mockResolvedValue(mockSection);
      await cateringService.deleteCateringSection('sec-1');
      expect(mockPrisma.cateringPackageSection.delete).toHaveBeenCalledWith({
        where: { id: 'sec-1' },
      });
    });

    it('should throw 404 when section not found', async () => {
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(null);
      await expect(cateringService.deleteCateringSection('x')).rejects.toThrow(
        'Sekcja cateringu nie istnieje',
      );
    });
  });

  // ═══════════ OPTIONS ═══════════

  describe('addOptionToSection', () => {
    it('should add a dish option to a section', async () => {
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(mockSection);
      mockPrisma.dish.findUnique.mockResolvedValue(mockDish);
      mockPrisma.cateringSectionOption.findUnique.mockResolvedValue(null);
      mockPrisma.cateringSectionOption.create.mockResolvedValue(mockOption);
      const result = await cateringService.addOptionToSection('sec-1', {
        dishId: 'dish-1',
      });
      expect(result.id).toBe('opt-1');
    });

    it('should throw 404 when section not found', async () => {
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(null);
      await expect(
        cateringService.addOptionToSection('x', { dishId: 'dish-1' }),
      ).rejects.toThrow('Sekcja cateringu nie istnieje');
    });

    it('should throw 404 when dish not found', async () => {
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(mockSection);
      mockPrisma.dish.findUnique.mockResolvedValue(null);
      await expect(
        cateringService.addOptionToSection('sec-1', { dishId: 'x' }),
      ).rejects.toThrow('Danie nie istnieje');
    });

    it('should throw 409 when dish already added to section', async () => {
      mockPrisma.cateringPackageSection.findUnique.mockResolvedValue(mockSection);
      mockPrisma.dish.findUnique.mockResolvedValue(mockDish);
      mockPrisma.cateringSectionOption.findUnique.mockResolvedValue(mockOption);
      await expect(
        cateringService.addOptionToSection('sec-1', { dishId: 'dish-1' }),
      ).rejects.toThrow(/już dodane/);
    });
  });

  describe('updateSectionOption', () => {
    it('should update an existing option', async () => {
      mockPrisma.cateringSectionOption.findUnique.mockResolvedValue(mockOption);
      mockPrisma.cateringSectionOption.update.mockResolvedValue({
        ...mockOption,
        isDefault: true,
      });
      const result = await cateringService.updateSectionOption('opt-1', {
        isDefault: true,
      });
      expect(result.isDefault).toBe(true);
    });

    it('should throw 404 when option not found', async () => {
      mockPrisma.cateringSectionOption.findUnique.mockResolvedValue(null);
      await expect(
        cateringService.updateSectionOption('x', { isDefault: true }),
      ).rejects.toThrow('Opcja sekcji nie istnieje');
    });
  });

  describe('removeOptionFromSection', () => {
    it('should remove an existing option', async () => {
      mockPrisma.cateringSectionOption.findUnique.mockResolvedValue(mockOption);
      mockPrisma.cateringSectionOption.delete.mockResolvedValue(mockOption);
      await cateringService.removeOptionFromSection('opt-1');
      expect(mockPrisma.cateringSectionOption.delete).toHaveBeenCalledWith({
        where: { id: 'opt-1' },
      });
    });

    it('should throw 404 when option not found', async () => {
      mockPrisma.cateringSectionOption.findUnique.mockResolvedValue(null);
      await expect(cateringService.removeOptionFromSection('x')).rejects.toThrow(
        'Opcja sekcji nie istnieje',
      );
    });
  });
});
