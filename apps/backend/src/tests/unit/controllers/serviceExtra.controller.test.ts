/**
 * ServiceExtraController — Unit Tests
 *
 * Covers: Categories CRUD, Items CRUD, Reservation extras management
 */

jest.mock('../../../services/serviceExtra.service', () => ({
  __esModule: true,
  default: {
    getCategories: jest.fn(),
    getCategoryById: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    reorderCategories: jest.fn(),
    getItems: jest.fn(),
    getItemsByCategory: jest.fn(),
    getItemById: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    getReservationExtras: jest.fn(),
    assignExtra: jest.fn(),
    bulkAssignExtras: jest.fn(),
    updateReservationExtra: jest.fn(),
    removeReservationExtra: jest.fn(),
  },
}));

import { ServiceExtraController } from '../../../controllers/serviceExtra.controller';
import serviceExtraService from '../../../services/serviceExtra.service';

const svc = serviceExtraService as any;
const controller = new ServiceExtraController();

// ─── Helpers ─────────────────────────────────────────────
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

beforeEach(() => jest.clearAllMocks());

// ─── Tests ───────────────────────────────────────────────
describe('ServiceExtraController', () => {
  // ═══════════════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════════════
  describe('getCategories()', () => {
    it('should return categories with count', async () => {
      const cats = [{ id: 'c1', name: 'Dekoracje' }];
      svc.getCategories.mockResolvedValue(cats);

      const response = res();
      await controller.getCategories(req({ query: {} }), response);

      expect(svc.getCategories).toHaveBeenCalledWith(false);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: cats, count: 1 })
      );
    });

    it('should pass activeOnly=true when query param set', async () => {
      svc.getCategories.mockResolvedValue([]);

      await controller.getCategories(req({ query: { activeOnly: 'true' } }), res());

      expect(svc.getCategories).toHaveBeenCalledWith(true);
    });
  });

  describe('getCategoryById()', () => {
    it('should return single category', async () => {
      const cat = { id: 'c1', name: 'Dekoracje' };
      svc.getCategoryById.mockResolvedValue(cat);

      const response = res();
      await controller.getCategoryById(req({ params: { id: 'c1' } }), response);

      expect(svc.getCategoryById).toHaveBeenCalledWith('c1');
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: cat })
      );
    });
  });

  describe('createCategory()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.createCategory(req({ user: undefined, body: { name: 'X', slug: 'x' } }), res())
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when name missing', async () => {
      await expect(
        controller.createCategory(req({ body: { slug: 'x' } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when slug missing', async () => {
      await expect(
        controller.createCategory(req({ body: { name: 'X' } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should create category and return 201', async () => {
      const cat = { id: 'c1', name: 'Dekoracje', slug: 'dekoracje' };
      svc.createCategory.mockResolvedValue(cat);

      const response = res();
      await controller.createCategory(
        req({ body: { name: 'Dekoracje', slug: 'dekoracje' } }), response
      );

      expect(response.status).toHaveBeenCalledWith(201);
      expect(svc.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Dekoracje', slug: 'dekoracje' }),
        'user-1'
      );
    });
  });

  describe('updateCategory()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.updateCategory(req({ user: undefined, params: { id: 'c1' } }), res())
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should update category with partial data', async () => {
      const cat = { id: 'c1', name: 'Dekoracje v2' };
      svc.updateCategory.mockResolvedValue(cat);

      const response = res();
      await controller.updateCategory(
        req({ params: { id: 'c1' }, body: { name: 'Dekoracje v2' } }), response
      );

      expect(svc.updateCategory).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ name: 'Dekoracje v2' }),
        'user-1'
      );
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteCategory()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.deleteCategory(req({ user: undefined, params: { id: 'c1' } }), res())
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should delete category', async () => {
      svc.deleteCategory.mockResolvedValue(undefined);

      const response = res();
      await controller.deleteCategory(req({ params: { id: 'c1' } }), response);

      expect(svc.deleteCategory).toHaveBeenCalledWith('c1', 'user-1');
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('reorderCategories()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.reorderCategories(req({ user: undefined, body: { orderedIds: ['c1'] } }), res())
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when orderedIds missing', async () => {
      await expect(
        controller.reorderCategories(req({ body: {} }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when orderedIds is not array', async () => {
      await expect(
        controller.reorderCategories(req({ body: { orderedIds: 'abc' } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should reorder categories', async () => {
      const cats = [{ id: 'c2' }, { id: 'c1' }];
      svc.reorderCategories.mockResolvedValue(cats);

      const response = res();
      await controller.reorderCategories(
        req({ body: { orderedIds: ['c2', 'c1'] } }), response
      );

      expect(svc.reorderCategories).toHaveBeenCalledWith(
        { orderedIds: ['c2', 'c1'] }, 'user-1'
      );
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  // ═══════════════════════════════════════════════════════
  // ITEMS
  // ═══════════════════════════════════════════════════════
  describe('getItems()', () => {
    it('should return all items', async () => {
      const items = [{ id: 'i1' }];
      svc.getItems.mockResolvedValue(items);

      const response = res();
      await controller.getItems(req({ query: {} }), response);

      expect(svc.getItems).toHaveBeenCalledWith(false);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: items, count: 1 })
      );
    });

    it('should filter by categoryId when provided', async () => {
      svc.getItemsByCategory.mockResolvedValue([]);

      await controller.getItems(
        req({ query: { categoryId: 'c1', activeOnly: 'true' } }), res()
      );

      expect(svc.getItemsByCategory).toHaveBeenCalledWith('c1', true);
    });
  });

  describe('getItemById()', () => {
    it('should return item by id', async () => {
      const item = { id: 'i1', name: 'DJ' };
      svc.getItemById.mockResolvedValue(item);

      const response = res();
      await controller.getItemById(req({ params: { id: 'i1' } }), response);

      expect(svc.getItemById).toHaveBeenCalledWith('i1');
    });
  });

  describe('createItem()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.createItem(
          req({ user: undefined, body: { categoryId: 'c1', name: 'DJ', priceType: 'FIXED' } }),
          res()
        )
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when categoryId missing', async () => {
      await expect(
        controller.createItem(req({ body: { name: 'DJ', priceType: 'FIXED' } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when name missing', async () => {
      await expect(
        controller.createItem(req({ body: { categoryId: 'c1', priceType: 'FIXED' } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when priceType missing', async () => {
      await expect(
        controller.createItem(req({ body: { categoryId: 'c1', name: 'DJ' } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should create item and return 201', async () => {
      const item = { id: 'i1', name: 'DJ', categoryId: 'c1', priceType: 'FIXED' };
      svc.createItem.mockResolvedValue(item);

      const response = res();
      await controller.createItem(
        req({ body: { categoryId: 'c1', name: 'DJ', priceType: 'FIXED', basePrice: 500 } }),
        response
      );

      expect(response.status).toHaveBeenCalledWith(201);
      expect(svc.createItem).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'c1', name: 'DJ', priceType: 'FIXED', basePrice: 500 }),
        'user-1'
      );
    });
  });

  describe('updateItem()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.updateItem(req({ user: undefined, params: { id: 'i1' } }), res())
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should update item with partial data', async () => {
      svc.updateItem.mockResolvedValue({ id: 'i1', name: 'DJ Pro' });

      const response = res();
      await controller.updateItem(
        req({ params: { id: 'i1' }, body: { name: 'DJ Pro', basePrice: 800 } }),
        response
      );

      expect(svc.updateItem).toHaveBeenCalledWith(
        'i1',
        expect.objectContaining({ name: 'DJ Pro', basePrice: 800 }),
        'user-1'
      );
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteItem()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.deleteItem(req({ user: undefined, params: { id: 'i1' } }), res())
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should delete item', async () => {
      svc.deleteItem.mockResolvedValue(undefined);

      const response = res();
      await controller.deleteItem(req({ params: { id: 'i1' } }), response);

      expect(svc.deleteItem).toHaveBeenCalledWith('i1', 'user-1');
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  // ═══════════════════════════════════════════════════════
  // RESERVATION EXTRAS
  // ═══════════════════════════════════════════════════════
  describe('getReservationExtras()', () => {
    it('should return extras for reservation', async () => {
      const result = { extras: [{ id: 'e1' }], totalExtrasPrice: 100, count: 1 };
      svc.getReservationExtras.mockResolvedValue(result);

      const response = res();
      await controller.getReservationExtras(
        req({ params: { reservationId: 'r1' } }), response
      );

      expect(svc.getReservationExtras).toHaveBeenCalledWith('r1');
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: result.extras,
          totalExtrasPrice: 100,
          count: 1,
        })
      );
    });
  });

  describe('assignExtra()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.assignExtra(
          req({ user: undefined, params: { reservationId: 'r1' }, body: { serviceItemId: 'i1' } }),
          res()
        )
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when serviceItemId missing', async () => {
      await expect(
        controller.assignExtra(
          req({ params: { reservationId: 'r1' }, body: {} }), res()
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should assign extra and return 201', async () => {
      const extra = { id: 'e1', serviceItemId: 'i1' };
      svc.assignExtra.mockResolvedValue(extra);

      const response = res();
      await controller.assignExtra(
        req({ params: { reservationId: 'r1' }, body: { serviceItemId: 'i1', quantity: 2 } }),
        response
      );

      expect(response.status).toHaveBeenCalledWith(201);
      expect(svc.assignExtra).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({ serviceItemId: 'i1', quantity: 2 }),
        'user-1'
      );
    });
  });

  describe('bulkAssignExtras()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.bulkAssignExtras(
          req({ user: undefined, params: { reservationId: 'r1' }, body: { extras: [] } }),
          res()
        )
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when extras missing', async () => {
      await expect(
        controller.bulkAssignExtras(
          req({ params: { reservationId: 'r1' }, body: {} }), res()
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when extras is not array', async () => {
      await expect(
        controller.bulkAssignExtras(
          req({ params: { reservationId: 'r1' }, body: { extras: 'not-array' } }), res()
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should bulk assign extras', async () => {
      const result = { extras: [], totalExtrasPrice: 0, count: 0 };
      svc.bulkAssignExtras.mockResolvedValue(result);

      const response = res();
      await controller.bulkAssignExtras(
        req({ params: { reservationId: 'r1' }, body: { extras: [{ serviceItemId: 'i1' }] } }),
        response
      );

      expect(response.status).toHaveBeenCalledWith(200);
      expect(svc.bulkAssignExtras).toHaveBeenCalledWith(
        'r1', { extras: [{ serviceItemId: 'i1' }] }, 'user-1'
      );
    });
  });

  describe('updateReservationExtra()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.updateReservationExtra(
          req({ user: undefined, params: { reservationId: 'r1', extraId: 'e1' } }), res()
        )
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should update reservation extra with partial data', async () => {
      const extra = { id: 'e1', quantity: 5 };
      svc.updateReservationExtra.mockResolvedValue(extra);

      const response = res();
      await controller.updateReservationExtra(
        req({
          params: { reservationId: 'r1', extraId: 'e1' },
          body: { quantity: 5, note: 'VIP' },
        }),
        response
      );

      expect(svc.updateReservationExtra).toHaveBeenCalledWith(
        'r1', 'e1',
        expect.objectContaining({ quantity: 5, note: 'VIP' }),
        'user-1'
      );
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('removeReservationExtra()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.removeReservationExtra(
          req({ user: undefined, params: { reservationId: 'r1', extraId: 'e1' } }), res()
        )
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should remove reservation extra', async () => {
      svc.removeReservationExtra.mockResolvedValue(undefined);

      const response = res();
      await controller.removeReservationExtra(
        req({ params: { reservationId: 'r1', extraId: 'e1' } }), response
      );

      expect(svc.removeReservationExtra).toHaveBeenCalledWith('r1', 'e1', 'user-1');
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });
});
