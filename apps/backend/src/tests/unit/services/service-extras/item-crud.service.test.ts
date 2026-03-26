/**
 * Unit tests for service-extras/item-crud.service.ts
 * Covers: getItems, getItemById, getItemsByCategory, createItem, updateItem, deleteItem
 */

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    serviceItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    serviceCategory: { findUnique: jest.fn() },
    reservationExtra: { count: jest.fn() },
  },
}));

jest.mock('../../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ name: 'changed' }),
}));

import {
  getItems,
  getItemById,
  getItemsByCategory,
  createItem,
  updateItem,
  deleteItem,
} from '../../../../services/service-extras/item-crud.service';
import { prisma } from '../../../../lib/prisma';
import { logChange, diffObjects } from '../../../../utils/audit-logger';

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// getItems
// ===============================================================

describe('getItems', () => {
  it('returns all items', async () => {
    const items = [{ id: 'i1', name: 'DJ' }];
    db.serviceItem.findMany.mockResolvedValue(items);

    const result = await getItems(false);
    expect(result).toEqual(items);
  });

  it('filters active only', async () => {
    db.serviceItem.findMany.mockResolvedValue([]);
    await getItems(true);

    expect(db.serviceItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});

// ===============================================================
// getItemById
// ===============================================================

describe('getItemById', () => {
  it('returns item', async () => {
    db.serviceItem.findUnique.mockResolvedValue({ id: 'i1', name: 'Tort' });
    const result = await getItemById('i1');
    expect(result.name).toBe('Tort');
  });

  it('throws when not found', async () => {
    db.serviceItem.findUnique.mockResolvedValue(null);
    await expect(getItemById('i-missing')).rejects.toThrow('Nie znaleziono pozycji');
  });
});

// ===============================================================
// getItemsByCategory
// ===============================================================

describe('getItemsByCategory', () => {
  it('returns items for category', async () => {
    db.serviceItem.findMany.mockResolvedValue([{ id: 'i1' }]);
    const result = await getItemsByCategory('c1');
    expect(result).toHaveLength(1);
  });

  it('filters active only', async () => {
    db.serviceItem.findMany.mockResolvedValue([]);
    await getItemsByCategory('c1', true);

    expect(db.serviceItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoryId: 'c1', isActive: true },
      }),
    );
  });
});

// ===============================================================
// createItem
// ===============================================================

describe('createItem', () => {
  it('creates item with valid data', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Music' });
    db.serviceItem.aggregate.mockResolvedValue({ _max: { displayOrder: 1 } });
    db.serviceItem.create.mockResolvedValue({ id: 'i1', name: 'DJ', priceType: 'FLAT', basePrice: 1000 });

    const result = await createItem(
      { name: 'DJ', categoryId: 'c1', priceType: 'FLAT', basePrice: 1000 } as any,
      'u1',
    );

    expect(result.name).toBe('DJ');
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE', entityType: 'SERVICE_ITEM' }),
    );
  });

  it('throws when name is empty', async () => {
    await expect(createItem({ name: '', categoryId: 'c1', priceType: 'FLAT' } as any, 'u1'))
      .rejects.toThrow('Nazwa pozycji jest wymagana');
  });

  it('throws for invalid price type', async () => {
    await expect(createItem({ name: 'X', categoryId: 'c1', priceType: 'INVALID' } as any, 'u1'))
      .rejects.toThrow('Nieprawidlowy typ ceny');
  });

  it('throws when category not found', async () => {
    db.serviceCategory.findUnique.mockResolvedValue(null);

    await expect(createItem({ name: 'X', categoryId: 'c-missing', priceType: 'FLAT' } as any, 'u1'))
      .rejects.toThrow('Nie znaleziono kategorii');
  });

  it('sets basePrice to 0 for FREE type', async () => {
    db.serviceCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Free' });
    db.serviceItem.aggregate.mockResolvedValue({ _max: { displayOrder: 0 } });
    db.serviceItem.create.mockResolvedValue({ id: 'i2', name: 'Woda', priceType: 'FREE', basePrice: 0 });

    await createItem({ name: 'Woda', categoryId: 'c1', priceType: 'FREE', basePrice: 999 } as any, 'u1');

    expect(db.serviceItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ basePrice: 0 }),
      }),
    );
  });
});

// ===============================================================
// updateItem
// ===============================================================

describe('updateItem', () => {
  it('updates item and logs changes', async () => {
    db.serviceItem.findUnique.mockResolvedValue({ id: 'i1', name: 'Old', category: {} });
    db.serviceItem.update.mockResolvedValue({ id: 'i1', name: 'New' });

    const result = await updateItem('i1', { name: 'New' } as any, 'u1');

    expect(result.name).toBe('New');
    expect(logChange).toHaveBeenCalled();
  });

  it('throws when not found', async () => {
    db.serviceItem.findUnique.mockResolvedValue(null);
    await expect(updateItem('i-missing', { name: 'X' } as any, 'u1')).rejects.toThrow('Nie znaleziono');
  });

  it('throws when name is empty', async () => {
    db.serviceItem.findUnique.mockResolvedValue({ id: 'i1', category: {} });
    await expect(updateItem('i1', { name: '' } as any, 'u1')).rejects.toThrow('Nazwa pozycji');
  });

  it('resets price to 0 when changing to FREE', async () => {
    db.serviceItem.findUnique.mockResolvedValue({ id: 'i1', name: 'X', priceType: 'FLAT', category: {} });
    db.serviceItem.update.mockResolvedValue({ id: 'i1', name: 'X', priceType: 'FREE', basePrice: 0 });

    await updateItem('i1', { priceType: 'FREE' } as any, 'u1');

    expect(db.serviceItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ basePrice: 0 }),
      }),
    );
  });

  it('does not log when no changes', async () => {
    db.serviceItem.findUnique.mockResolvedValue({ id: 'i1', name: 'Same', category: {} });
    db.serviceItem.update.mockResolvedValue({ id: 'i1', name: 'Same' });
    (diffObjects as jest.Mock).mockReturnValueOnce({});

    await updateItem('i1', { name: 'Same' } as any, 'u1');
    expect(logChange).not.toHaveBeenCalled();
  });
});

// ===============================================================
// deleteItem
// ===============================================================

describe('deleteItem', () => {
  it('deletes item when not used', async () => {
    db.serviceItem.findUnique.mockResolvedValue({ id: 'i1', name: 'DJ', category: { name: 'Music' } });
    db.reservationExtra.count.mockResolvedValue(0);
    db.serviceItem.delete.mockResolvedValue({});

    await deleteItem('i1', 'u1');

    expect(db.serviceItem.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DELETE', entityType: 'SERVICE_ITEM' }),
    );
  });

  it('throws when not found', async () => {
    db.serviceItem.findUnique.mockResolvedValue(null);
    await expect(deleteItem('i-missing', 'u1')).rejects.toThrow('Nie znaleziono');
  });

  it('throws when used in reservations', async () => {
    db.serviceItem.findUnique.mockResolvedValue({ id: 'i1', name: 'DJ', category: {} });
    db.reservationExtra.count.mockResolvedValue(3);

    await expect(deleteItem('i1', 'u1')).rejects.toThrow('Nie mozna usunac');
  });
});
