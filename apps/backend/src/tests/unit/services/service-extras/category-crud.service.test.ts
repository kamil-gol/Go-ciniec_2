/**
 * Unit tests for service-extras/category-crud.service.ts
 * Covers: getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, reorderCategories
 */

jest.mock('../../../../lib/prisma', () => ({
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
    reservationExtra: { count: jest.fn() },
    $transaction: jest.fn().mockImplementation((promises: Promise<any>[]) => Promise.all(promises)),
  },
}));

jest.mock('../../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ name: 'changed' }),
}));

import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '../../../../services/service-extras/category-crud.service';
import { prisma } from '../../../../lib/prisma';
import { logChange, diffObjects } from '../../../../utils/audit-logger';

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// getCategories
// ===============================================================

describe('getCategories', () => {
  it('returns all categories when activeOnly=false', async () => {
    const cats = [{ id: 'c1', name: 'Dekoracje' }];
    db.serviceCategory.findMany.mockResolvedValue(cats);

    const result = await getCategories(false);

    expect(result).toEqual(cats);
    expect(db.serviceCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('filters active only', async () => {
    db.serviceCategory.findMany.mockResolvedValue([]);

    await getCategories(true);

    expect(db.serviceCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});

// ===============================================================
// getCategoryById
// ===============================================================

describe('getCategoryById', () => {
  it('returns category by id', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Muzyka' });

    const result = await getCategoryById('c1');
    expect(result).toEqual({ id: 'c1', name: 'Muzyka' });
  });

  it('throws when not found', async () => {
    db.serviceCategory.findUnique.mockResolvedValue(null);

    await expect(getCategoryById('c-missing')).rejects.toThrow('Nie znaleziono kategorii');
  });
});

// ===============================================================
// createCategory
// ===============================================================

describe('createCategory', () => {
  it('creates category with valid data', async () => {
    db.serviceCategory.findUnique.mockResolvedValue(null); // no slug conflict
    db.serviceCategory.aggregate.mockResolvedValue({ _max: { displayOrder: 2 } });
    db.serviceCategory.create.mockResolvedValue({ id: 'c1', name: 'Tort', slug: 'tort' });

    const result = await createCategory({ name: 'Tort', slug: 'tort' } as any, 'u1');

    expect(result.name).toBe('Tort');
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE', entityType: 'SERVICE_CATEGORY' }),
    );
  });

  it('throws when name is empty', async () => {
    await expect(createCategory({ name: '', slug: 'x' } as any, 'u1')).rejects.toThrow('Nazwa kategorii jest wymagana');
  });

  it('throws when slug is invalid', async () => {
    await expect(createCategory({ name: 'Test', slug: 'INVALID SLUG' } as any, 'u1')).rejects.toThrow('slug');
  });

  it('throws when slug already exists', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(createCategory({ name: 'Test', slug: 'tort' } as any, 'u1')).rejects.toThrow('slug');
  });

  it('auto-calculates displayOrder when not provided', async () => {
    db.serviceCategory.findUnique.mockResolvedValue(null);
    db.serviceCategory.aggregate.mockResolvedValue({ _max: { displayOrder: 5 } });
    db.serviceCategory.create.mockResolvedValue({ id: 'c2', name: 'DJ', slug: 'dj' });

    await createCategory({ name: 'DJ', slug: 'dj' } as any, 'u1');

    expect(db.serviceCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayOrder: 6 }),
      }),
    );
  });
});

// ===============================================================
// updateCategory
// ===============================================================

describe('updateCategory', () => {
  it('updates category and logs changes', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Old' });
    db.serviceCategory.update.mockResolvedValue({ id: 'c1', name: 'New' });

    const result = await updateCategory('c1', { name: 'New' } as any, 'u1');

    expect(result.name).toBe('New');
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'UPDATE', entityType: 'SERVICE_CATEGORY' }),
    );
  });

  it('throws when category not found', async () => {
    db.serviceCategory.findUnique.mockResolvedValue(null);

    await expect(updateCategory('c-missing', { name: 'X' } as any, 'u1')).rejects.toThrow('Nie znaleziono');
  });

  it('throws when name is empty', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1' });

    await expect(updateCategory('c1', { name: '' } as any, 'u1')).rejects.toThrow('Nazwa kategorii');
  });

  it('validates slug uniqueness on update', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', slug: 'old' });
    db.serviceCategory.findFirst.mockResolvedValue({ id: 'c2', slug: 'taken' });

    await expect(updateCategory('c1', { slug: 'taken' } as any, 'u1')).rejects.toThrow('slug');
  });

  it('does not log when no changes', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Same' });
    db.serviceCategory.update.mockResolvedValue({ id: 'c1', name: 'Same' });
    (diffObjects as jest.Mock).mockReturnValueOnce({});

    await updateCategory('c1', { name: 'Same' } as any, 'u1');

    expect(logChange).not.toHaveBeenCalled();
  });
});

// ===============================================================
// deleteCategory
// ===============================================================

describe('deleteCategory', () => {
  it('deletes category when not used in reservations', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Old', slug: 'old', _count: { items: 0 } });
    db.reservationExtra.count.mockResolvedValue(0);
    db.serviceCategory.delete.mockResolvedValue({});

    await deleteCategory('c1', 'u1');

    expect(db.serviceCategory.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DELETE' }),
    );
  });

  it('throws when category not found', async () => {
    db.serviceCategory.findUnique.mockResolvedValue(null);

    await expect(deleteCategory('c-missing', 'u1')).rejects.toThrow('Nie znaleziono');
  });

  it('throws when category is used in reservations', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'X', _count: { items: 2 } });
    db.reservationExtra.count.mockResolvedValue(5);

    await expect(deleteCategory('c1', 'u1')).rejects.toThrow('Nie mozna usunac');
  });
});

// ===============================================================
// reorderCategories
// ===============================================================

describe('reorderCategories', () => {
  it('reorders and logs change', async () => {
    db.serviceCategory.update.mockResolvedValue({});
    db.serviceCategory.findMany.mockResolvedValue([]);

    await reorderCategories({ orderedIds: ['c2', 'c1', 'c3'] }, 'u1');

    expect(db.$transaction).toHaveBeenCalled();
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'REORDER', entityId: 'batch' }),
    );
  });
});
