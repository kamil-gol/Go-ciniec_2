/**
 * ServiceExtraService — Categories & Items CRUD Tests
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    serviceCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    serviceItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    reservationExtra: {
      count: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((promises: Promise<any>[]) =>
      Promise.all(promises)
    ),
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ name: 'changed' }),
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(undefined),
}));

import { ServiceExtraService } from '../../../services/serviceExtra.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const svc = new ServiceExtraService();

beforeEach(() => {
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════

describe('ServiceExtraService — Categories', () => {
  describe('getCategories()', () => {
    it('returns all categories when activeOnly=false', async () => {
      const cats = [{ id: 'c1', name: 'Dekoracje' }];
      db.serviceCategory.findMany.mockResolvedValue(cats);

      const result = await svc.getCategories(false);

      expect(result).toEqual(cats);
      expect(db.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('returns only active categories when activeOnly=true', async () => {
      db.serviceCategory.findMany.mockResolvedValue([]);

      await svc.getCategories(true);

      expect(db.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } })
      );
    });

    it('returns all categories with default param (no arg)', async () => {
      db.serviceCategory.findMany.mockResolvedValue([]);

      await svc.getCategories();

      expect(db.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });
  });

  describe('getCategoryById()', () => {
    it('returns category when found', async () => {
      const cat = { id: 'c1', name: 'Fotografia' };
      db.serviceCategory.findUnique.mockResolvedValue(cat);

      const result = await svc.getCategoryById('c1');

      expect(result).toEqual(cat);
    });

    it('throws when category not found', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(null);

      await expect(svc.getCategoryById('missing')).rejects.toThrow('Nie znaleziono kategorii usług');
    });
  });

  describe('createCategory()', () => {
    it('throws when name is empty', async () => {
      await expect(
        svc.createCategory({ name: '  ', slug: 'test' } as any, 'u1')
      ).rejects.toThrow('Nazwa kategorii jest wymagana');
    });

    it('throws when slug is invalid', async () => {
      await expect(
        svc.createCategory({ name: 'Test', slug: 'Invalid Slug!' } as any, 'u1')
      ).rejects.toThrow('Nieprawidłowy format slug');
    });

    it('throws when slug already exists', async () => {
      db.serviceCategory.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        svc.createCategory({ name: 'Test', slug: 'test-slug' } as any, 'u1')
      ).rejects.toThrow('Kategoria z tym slugiem już istnieje');
    });

    it('creates category with auto displayOrder (last + 1)', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(null);
      db.serviceCategory.aggregate.mockResolvedValue({ _max: { displayOrder: 2 } });
      const created = { id: 'new', name: 'Muzyka', slug: 'muzyka', displayOrder: 3 };
      db.serviceCategory.create.mockResolvedValue(created);

      const result = await svc.createCategory({ name: 'Muzyka', slug: 'muzyka' } as any, 'u1');

      expect(result).toEqual(created);
      expect(db.serviceCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ displayOrder: 3 }),
        })
      );
    });

    it('auto displayOrder = 0 when no categories exist yet', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(null);
      db.serviceCategory.aggregate.mockResolvedValue({ _max: { displayOrder: null } });
      db.serviceCategory.create.mockResolvedValue({ id: 'new', name: 'X', slug: 'x', displayOrder: 0 });

      await svc.createCategory({ name: 'X', slug: 'x' } as any, 'u1');

      expect(db.serviceCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ displayOrder: 0 }),
        })
      );
    });

    it('creates category with explicit displayOrder (skips aggregate)', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(null);
      db.serviceCategory.create.mockResolvedValue({ id: 'new', name: 'Tort', slug: 'tort', displayOrder: 5 });

      await svc.createCategory({ name: 'Tort', slug: 'tort', displayOrder: 5 } as any, 'u1');

      expect(db.serviceCategory.aggregate).not.toHaveBeenCalled();
    });

    it('creates category with isExclusive=false by default', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(null);
      db.serviceCategory.aggregate.mockResolvedValue({ _max: { displayOrder: 0 } });
      db.serviceCategory.create.mockResolvedValue({ id: 'new', name: 'X', slug: 'x', isExclusive: false });

      await svc.createCategory({ name: 'X', slug: 'x' } as any, 'u1');

      expect(db.serviceCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isExclusive: false }),
        })
      );
    });
  });

  describe('updateCategory()', () => {
    const existing = { id: 'c1', name: 'Old', slug: 'old', displayOrder: 0 };

    it('throws when category not found', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(null);

      await expect(
        svc.updateCategory('missing', { name: 'X' } as any, 'u1')
      ).rejects.toThrow('Nie znaleziono kategorii usług');
    });

    it('throws when name is empty string', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(existing);

      await expect(
        svc.updateCategory('c1', { name: '  ' } as any, 'u1')
      ).rejects.toThrow('Nazwa kategorii nie może być pusta');
    });

    it('throws when slug format is invalid', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(existing);

      await expect(
        svc.updateCategory('c1', { slug: 'Bad Slug!' } as any, 'u1')
      ).rejects.toThrow('Nieprawidłowy format slug');
    });

    it('throws when slug is taken by another category', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(existing);
      db.serviceCategory.findFirst.mockResolvedValue({ id: 'other' });

      await expect(
        svc.updateCategory('c1', { slug: 'taken' } as any, 'u1')
      ).rejects.toThrow('Kategoria z tym slugiem już istnieje');
    });

    it('updates category successfully', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(existing);
      db.serviceCategory.findFirst.mockResolvedValue(null);
      const updated = { ...existing, name: 'New', slug: 'new-slug' };
      db.serviceCategory.update.mockResolvedValue(updated);

      const result = await svc.updateCategory('c1', { name: 'New', slug: 'new-slug' } as any, 'u1');

      expect(result).toEqual(updated);
    });

    it('updates without slug validation when slug is not in payload', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(existing);
      const updated = { ...existing, name: 'New Name' };
      db.serviceCategory.update.mockResolvedValue(updated);

      const result = await svc.updateCategory('c1', { name: 'New Name' } as any, 'u1');

      expect(db.serviceCategory.findFirst).not.toHaveBeenCalled();
      expect(result.name).toBe('New Name');
    });
  });

  describe('deleteCategory()', () => {
    it('throws when category not found', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(null);

      await expect(svc.deleteCategory('missing', 'u1')).rejects.toThrow('Nie znaleziono kategorii usług');
    });

    it('throws when category is used in reservations', async () => {
      db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Test', _count: { items: 0 } });
      db.reservationExtra.count.mockResolvedValue(3);

      await expect(svc.deleteCategory('c1', 'u1')).rejects.toThrow('Nie można usunąć kategorii');
    });

    it('deletes category when not used in any reservation', async () => {
      db.serviceCategory.findUnique.mockResolvedValue({
        id: 'c1',
        name: 'Test',
        slug: 'test',
        _count: { items: 0 },
      });
      db.reservationExtra.count.mockResolvedValue(0);
      db.serviceCategory.delete.mockResolvedValue({ id: 'c1' });

      await svc.deleteCategory('c1', 'u1');

      expect(db.serviceCategory.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });

  describe('reorderCategories()', () => {
    it('reorders categories using $transaction and returns updated list', async () => {
      db.serviceCategory.update.mockResolvedValue({});
      db.serviceCategory.findMany.mockResolvedValue([]);

      const result = await svc.reorderCategories({ orderedIds: ['a', 'b', 'c'] }, 'u1');

      expect((prisma as any).$transaction).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});

// ═══════════════════════════════════════════════════════
// ITEMS
// ═══════════════════════════════════════════════════════

describe('ServiceExtraService — Items', () => {
  describe('getItems()', () => {
    it('returns all items when activeOnly=false', async () => {
      db.serviceItem.findMany.mockResolvedValue([{ id: 'i1' }]);

      const result = await svc.getItems(false);

      expect(db.serviceItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
      expect(result).toHaveLength(1);
    });

    it('returns only active items when activeOnly=true', async () => {
      db.serviceItem.findMany.mockResolvedValue([]);

      await svc.getItems(true);

      expect(db.serviceItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } })
      );
    });
  });

  describe('getItemById()', () => {
    it('returns item when found', async () => {
      db.serviceItem.findUnique.mockResolvedValue({ id: 'i1', name: 'Tort' });

      const result = await svc.getItemById('i1');

      expect(result).toMatchObject({ id: 'i1' });
    });

    it('throws when item not found', async () => {
      db.serviceItem.findUnique.mockResolvedValue(null);

      await expect(svc.getItemById('missing')).rejects.toThrow('Nie znaleziono pozycji usługi');
    });
  });

  describe('getItemsByCategory()', () => {
    it('returns items for given category', async () => {
      db.serviceItem.findMany.mockResolvedValue([{ id: 'i1' }]);

      const result = await svc.getItemsByCategory('cat1');

      expect(db.serviceItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { categoryId: 'cat1' } })
      );
      expect(result).toHaveLength(1);
    });

    it('filters active items when activeOnly=true', async () => {
      db.serviceItem.findMany.mockResolvedValue([]);

      await svc.getItemsByCategory('cat1', true);

      expect(db.serviceItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { categoryId: 'cat1', isActive: true } })
      );
    });
  });

  describe('createItem()', () => {
    it('throws when name is empty', async () => {
      await expect(
        svc.createItem({ name: '', priceType: 'FLAT', categoryId: 'c1' } as any, 'u1')
      ).rejects.toThrow('Nazwa pozycji jest wymagana');
    });

    it('throws when priceType is invalid', async () => {
      await expect(
        svc.createItem({ name: 'Test', priceType: 'INVALID', categoryId: 'c1' } as any, 'u1')
      ).rejects.toThrow('Nieprawidłowy typ ceny');
    });

    it('throws when category not found', async () => {
      db.serviceCategory.findUnique.mockResolvedValue(null);

      await expect(
        svc.createItem({ name: 'Test', priceType: 'FLAT', categoryId: 'missing' } as any, 'u1')
      ).rejects.toThrow('Nie znaleziono kategorii usług');
    });

    it('creates item with auto displayOrder', async () => {
      db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Cat' });
      db.serviceItem.aggregate.mockResolvedValue({ _max: { displayOrder: 4 } });
      const created = { id: 'i1', name: 'Fotograf', priceType: 'FLAT', basePrice: 500 };
      db.serviceItem.create.mockResolvedValue(created);

      const result = await svc.createItem(
        { name: 'Fotograf', priceType: 'FLAT', basePrice: 500, categoryId: 'c1' } as any,
        'u1'
      );

      expect(result).toEqual(created);
      expect(db.serviceItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ displayOrder: 5 }),
        })
      );
    });

    it('creates FREE item — basePrice forced to 0', async () => {
      db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Cat' });
      db.serviceItem.aggregate.mockResolvedValue({ _max: { displayOrder: null } });
      db.serviceItem.create.mockResolvedValue({ id: 'i1', name: 'Gratis', priceType: 'FREE', basePrice: 0 });

      await svc.createItem({ name: 'Gratis', priceType: 'FREE', categoryId: 'c1' } as any, 'u1');

      expect(db.serviceItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ basePrice: 0 }),
        })
      );
    });

    it('creates item with explicit displayOrder (skips aggregate)', async () => {
      db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Cat' });
      db.serviceItem.create.mockResolvedValue({ id: 'i1', name: 'X', priceType: 'FLAT', basePrice: 100 });

      await svc.createItem(
        { name: 'X', priceType: 'FLAT', categoryId: 'c1', displayOrder: 10 } as any,
        'u1'
      );

      expect(db.serviceItem.aggregate).not.toHaveBeenCalled();
    });

    it('auto displayOrder = 0 when no items exist in category', async () => {
      db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Cat' });
      db.serviceItem.aggregate.mockResolvedValue({ _max: { displayOrder: null } });
      db.serviceItem.create.mockResolvedValue({ id: 'i1', name: 'First', priceType: 'FLAT', basePrice: 0 });

      await svc.createItem({ name: 'First', priceType: 'FLAT', categoryId: 'c1' } as any, 'u1');

      expect(db.serviceItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ displayOrder: 0 }),
        })
      );
    });
  });

  describe('updateItem()', () => {
    const existing = {
      id: 'i1',
      name: 'Old',
      priceType: 'FLAT',
      basePrice: 100,
      category: { id: 'c1', name: 'Cat' },
    };

    it('throws when item not found', async () => {
      db.serviceItem.findUnique.mockResolvedValue(null);

      await expect(svc.updateItem('missing', {} as any, 'u1')).rejects.toThrow(
        'Nie znaleziono pozycji usługi'
      );
    });

    it('throws when name is empty string', async () => {
      db.serviceItem.findUnique.mockResolvedValue(existing);

      await expect(
        svc.updateItem('i1', { name: '  ' } as any, 'u1')
      ).rejects.toThrow('Nazwa pozycji nie może być pusta');
    });

    it('throws when priceType is invalid', async () => {
      db.serviceItem.findUnique.mockResolvedValue(existing);

      await expect(
        svc.updateItem('i1', { priceType: 'INVALID' } as any, 'u1')
      ).rejects.toThrow('Nieprawidłowy typ ceny');
    });

    it('resets basePrice to 0 when changing priceType to FREE', async () => {
      db.serviceItem.findUnique.mockResolvedValue(existing);
      db.serviceItem.update.mockResolvedValue({ ...existing, priceType: 'FREE', basePrice: 0 });

      await svc.updateItem('i1', { priceType: 'FREE' } as any, 'u1');

      expect(db.serviceItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ basePrice: 0 }),
        })
      );
    });

    it('updates item successfully', async () => {
      db.serviceItem.findUnique.mockResolvedValue(existing);
      const updated = { ...existing, name: 'New Name' };
      db.serviceItem.update.mockResolvedValue(updated);

      const result = await svc.updateItem('i1', { name: 'New Name' } as any, 'u1');

      expect(result).toEqual(updated);
    });
  });

  describe('deleteItem()', () => {
    it('throws when item not found', async () => {
      db.serviceItem.findUnique.mockResolvedValue(null);

      await expect(svc.deleteItem('missing', 'u1')).rejects.toThrow('Nie znaleziono pozycji usługi');
    });

    it('throws when item is used in reservations', async () => {
      db.serviceItem.findUnique.mockResolvedValue({
        id: 'i1',
        name: 'Test',
        category: { name: 'Cat' },
      });
      db.reservationExtra.count.mockResolvedValue(2);

      await expect(svc.deleteItem('i1', 'u1')).rejects.toThrow('Nie można usunąć');
    });

    it('deletes item when not used in any reservation', async () => {
      db.serviceItem.findUnique.mockResolvedValue({
        id: 'i1',
        name: 'Test',
        priceType: 'FLAT',
        category: { name: 'Cat' },
      });
      db.reservationExtra.count.mockResolvedValue(0);
      db.serviceItem.delete.mockResolvedValue({ id: 'i1' });

      await svc.deleteItem('i1', 'u1');

      expect(db.serviceItem.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
    });
  });
});
