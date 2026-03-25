/**
 * Unit tests for catering-order.service.ts
 * Covers: createOrder, getOrderById, getOrderByNumber, listOrders,
 *         updateOrder, changeOrderStatus, deleteOrder, getOrderHistory,
 *         deposits (createDeposit, updateDeposit, deleteDeposit, markDepositPaid)
 * Issue: #236
 */

const mockPrisma = {
  cateringOrder: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  cateringOrderHistory: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  cateringDeposit: {
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  dish: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((fns: any[]) =>
    Promise.all(fns.map((fn: any) => (typeof fn === 'function' ? fn() : fn))),
  ),
};

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('@lib/prisma', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn(),
}));

import {
  createOrder,
  getOrderById,
  getOrderByNumber,
  listOrders,
  updateOrder,
  changeOrderStatus,
  deleteOrder,
  getOrderHistory,
} from '@services/catering-order.service';

import {
  createDeposit,
  updateDeposit,
  deleteDeposit,
  markDepositPaid,
} from '../../../services/catering/catering-deposit.service';

import { logChange } from '../../../utils/audit-logger';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockClient = {
  id: 'client-1',
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan@test.pl',
  phone: '123456789',
  companyName: null,
  clientType: 'INDIVIDUAL',
};

const mockOrder = {
  id: 'order-1',
  orderNumber: 'CAT-2026-00001',
  clientId: 'client-1',
  createdById: 'user-1',
  status: 'DRAFT',
  deliveryType: 'ON_SITE',
  subtotal: 500,
  extrasTotalPrice: 100,
  discountType: null,
  discountValue: null,
  discountAmount: 0,
  discountReason: null,
  totalPrice: 600,
  guestsCount: 50,
  eventName: 'Wesele',
  eventDate: '2026-06-15',
  eventTime: '14:00',
  eventLocation: 'Sala A',
  deliveryAddress: null,
  deliveryNotes: null,
  deliveryDate: null,
  deliveryTime: null,
  contactName: null,
  contactPhone: null,
  contactEmail: null,
  notes: null,
  internalNotes: null,
  specialRequirements: null,
  quoteExpiresAt: null,
  createdAt: new Date(),
  client: mockClient,
  items: [],
  extras: [],
  deposits: [],
};

const mockDeposit = {
  id: 'dep-1',
  orderId: 'order-1',
  amount: 200,
  remainingAmount: 200,
  dueDate: '2026-06-01',
  title: 'Zaliczka 1',
  description: null,
  internalNotes: null,
  paid: false,
  paidAt: null,
  paidAmount: null,
  status: 'PENDING',
  paymentMethod: null,
};

describe('CateringOrderService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ═══════════ CREATE ORDER ═══════════

  describe('createOrder', () => {
    it('should create a new order with items and extras', async () => {
      mockPrisma.cateringOrder.count.mockResolvedValue(0);
      mockPrisma.dish.findMany.mockResolvedValue([
        { id: 'dish-1', name: 'Zupa pomidorowa' },
      ]);
      mockPrisma.cateringOrder.create.mockResolvedValue(mockOrder);

      const result = await createOrder({
        clientId: 'client-1',
        createdById: 'user-1',
        items: [{ dishId: 'dish-1', quantity: 50, unitPrice: 10 }],
        extras: [{ name: 'Dekoracja', quantity: 1, unitPrice: 100 }],
      });

      expect(result.id).toBe('order-1');
      expect(mockPrisma.cateringOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderNumber: 'CAT-2026-00001',
            clientId: 'client-1',
          }),
        }),
      );
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entityType: 'CATERING_ORDER',
        }),
      );
    });

    it('should create order with empty items and extras', async () => {
      mockPrisma.cateringOrder.count.mockResolvedValue(5);
      mockPrisma.cateringOrder.create.mockResolvedValue(mockOrder);

      await createOrder({
        clientId: 'client-1',
        createdById: 'user-1',
      });

      expect(mockPrisma.cateringOrder.create).toHaveBeenCalled();
    });

    it('should apply discount when provided', async () => {
      mockPrisma.cateringOrder.count.mockResolvedValue(0);
      mockPrisma.dish.findMany.mockResolvedValue([]);
      mockPrisma.cateringOrder.create.mockResolvedValue(mockOrder);

      await createOrder({
        clientId: 'client-1',
        createdById: 'user-1',
        discountType: 'PERCENTAGE' as any,
        discountValue: 10,
        items: [],
      });

      expect(mockPrisma.cateringOrder.create).toHaveBeenCalled();
    });
  });

  // ═══════════ READ ORDERS ═══════════

  describe('getOrderById', () => {
    it('should return order by id', async () => {
      mockPrisma.cateringOrder.findUnique.mockResolvedValue(mockOrder);
      const result = await getOrderById('order-1');
      expect(result!.id).toBe('order-1');
    });

    it('should return null when not found', async () => {
      mockPrisma.cateringOrder.findUnique.mockResolvedValue(null);
      const result = await getOrderById('x');
      expect(result).toBeNull();
    });
  });

  describe('getOrderByNumber', () => {
    it('should return order by order number', async () => {
      mockPrisma.cateringOrder.findUnique.mockResolvedValue(mockOrder);
      const result = await getOrderByNumber('CAT-2026-00001');
      expect(result!.orderNumber).toBe('CAT-2026-00001');
    });
  });

  describe('listOrders', () => {
    it('should return paginated orders', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockOrder], 1]);
      const result = await listOrders({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual(
        expect.objectContaining({ total: 1, page: 1, limit: 20, totalPages: 1 }),
      );
    });

    it('should apply status filter', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);
      await listOrders({ status: 'DRAFT' as any });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);
      await listOrders({ search: 'Kowalski' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should apply date range filters', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);
      await listOrders({
        eventDateFrom: '2026-01-01',
        eventDateTo: '2026-12-31',
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should use default pagination', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);
      const result = await listOrders({});
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  // ═══════════ UPDATE ORDER ═══════════

  describe('updateOrder', () => {
    it('should update basic fields', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue(mockOrder);
      mockPrisma.cateringOrder.update.mockResolvedValue({
        ...mockOrder,
        eventName: 'Updated Event',
      });

      const result = await updateOrder('order-1', {
        eventName: 'Updated Event',
        changedById: 'user-1',
      });

      expect(result.eventName).toBe('Updated Event');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entityType: 'CATERING_ORDER',
        }),
      );
    });

    it('should update items and recalculate totals', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue(mockOrder);
      mockPrisma.dish.findMany.mockResolvedValue([
        { id: 'dish-1', name: 'Zupa' },
      ]);
      mockPrisma.cateringOrder.update.mockResolvedValue(mockOrder);

      await updateOrder('order-1', {
        items: [{ dishId: 'dish-1', quantity: 10, unitPrice: 20 }],
        changedById: 'user-1',
      });

      expect(mockPrisma.cateringOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: expect.any(Number),
            totalPrice: expect.any(Number),
          }),
        }),
      );
    });

    it('should create status change history entry', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue(mockOrder);
      mockPrisma.cateringOrder.update.mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
      });

      await updateOrder('order-1', {
        status: 'CONFIRMED' as any,
        changedById: 'user-1',
      });

      expect(mockPrisma.cateringOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CONFIRMED',
            history: expect.objectContaining({
              create: expect.objectContaining({
                changeType: 'STATUS_CHANGE',
              }),
            }),
          }),
        }),
      );
    });

    it('should handle discount addition', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue(mockOrder);
      mockPrisma.cateringOrder.update.mockResolvedValue(mockOrder);
      mockPrisma.cateringOrderHistory.create.mockResolvedValue({});

      await updateOrder('order-1', {
        discountType: 'PERCENTAGE' as any,
        discountValue: 10,
        changedById: 'user-1',
      });

      expect(mockPrisma.cateringOrderHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'DISCOUNT_ADDED',
          }),
        }),
      );
    });

    it('should handle discount removal', async () => {
      const orderWithDiscount = {
        ...mockOrder,
        discountType: 'PERCENTAGE',
        discountValue: 10,
      };
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue(orderWithDiscount);
      mockPrisma.cateringOrder.update.mockResolvedValue(mockOrder);
      mockPrisma.cateringOrderHistory.create.mockResolvedValue({});

      await updateOrder('order-1', {
        discountType: null,
        discountValue: null,
        changedById: 'user-1',
      });

      expect(mockPrisma.cateringOrderHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'DISCOUNT_REMOVED',
          }),
        }),
      );
    });

    it('should handle discount update', async () => {
      const orderWithDiscount = {
        ...mockOrder,
        discountType: 'PERCENTAGE',
        discountValue: 10,
      };
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue(orderWithDiscount);
      mockPrisma.cateringOrder.update.mockResolvedValue(mockOrder);
      mockPrisma.cateringOrderHistory.create.mockResolvedValue({});

      await updateOrder('order-1', {
        discountType: 'AMOUNT' as any,
        discountValue: 50,
        changedById: 'user-1',
      });

      expect(mockPrisma.cateringOrderHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'DISCOUNT_UPDATED',
          }),
        }),
      );
    });
  });

  // ═══════════ CHANGE STATUS ═══════════

  describe('changeOrderStatus', () => {
    it('should delegate to updateOrder', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue(mockOrder);
      mockPrisma.cateringOrder.update.mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
      });

      const result = await changeOrderStatus(
        'order-1',
        'CONFIRMED' as any,
        'user-1',
        'Klient potwierdził',
      );

      expect(result.status).toBe('CONFIRMED');
    });
  });

  // ═══════════ DELETE ORDER ═══════════

  describe('deleteOrder', () => {
    it('should delete a DRAFT order', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue(mockOrder);
      mockPrisma.cateringOrder.delete.mockResolvedValue(mockOrder);

      await deleteOrder('order-1', 'user-1');

      expect(mockPrisma.cateringOrder.delete).toHaveBeenCalledWith({
        where: { id: 'order-1' },
      });
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          entityType: 'CATERING_ORDER',
        }),
      );
    });

    it('should delete a CANCELLED order', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
      });
      mockPrisma.cateringOrder.delete.mockResolvedValue(mockOrder);

      await deleteOrder('order-1');
      expect(mockPrisma.cateringOrder.delete).toHaveBeenCalled();
    });

    it('should throw 400 for non-DRAFT/CANCELLED order', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
      });

      await expect(deleteOrder('order-1')).rejects.toThrow(/DRAFT.*CANCELLED/);
    });
  });

  // ═══════════ ORDER HISTORY ═══════════

  describe('getOrderHistory', () => {
    it('should return order history', async () => {
      const history = [
        {
          id: 'hist-1',
          changeType: 'CREATED',
          newValue: 'DRAFT',
          changedBy: { id: 'user-1', firstName: 'Jan', lastName: 'Kowalski' },
        },
      ];
      mockPrisma.cateringOrderHistory.findMany.mockResolvedValue(history);

      const result = await getOrderHistory('order-1');
      expect(result).toHaveLength(1);
      expect(result[0].changeType).toBe('CREATED');
    });
  });

  // ═══════════ DEPOSITS ═══════════

  describe('createDeposit', () => {
    it('should create a deposit', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        totalPrice: 600,
        deposits: [],
      });
      mockPrisma.cateringDeposit.create.mockResolvedValue(mockDeposit);
      mockPrisma.cateringOrderHistory.create.mockResolvedValue({});

      const result = await createDeposit(
        'order-1',
        { amount: 200, dueDate: '2026-06-01', title: 'Zaliczka 1' },
        'user-1',
      );

      expect(result.id).toBe('dep-1');
      expect(mockPrisma.cateringDeposit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'order-1',
            amount: 200,
            remainingAmount: 200,
          }),
        }),
      );
    });

    it('should throw 400 when amount <= 0', async () => {
      await expect(
        createDeposit('order-1', { amount: 0, dueDate: '2026-06-01' }),
      ).rejects.toThrow(/większa od 0/);
    });

    it('should throw 400 when total exceeds order price', async () => {
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        totalPrice: 600,
        deposits: [{ amount: 500 }],
      });

      await expect(
        createDeposit('order-1', { amount: 200, dueDate: '2026-06-01' }),
      ).rejects.toThrow(/przekracza/);
    });
  });

  describe('updateDeposit', () => {
    it('should update a deposit', async () => {
      mockPrisma.cateringDeposit.findUniqueOrThrow.mockResolvedValue(mockDeposit);
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        totalPrice: 600,
        deposits: [mockDeposit],
      });
      mockPrisma.cateringDeposit.update.mockResolvedValue({
        ...mockDeposit,
        amount: 300,
      });
      mockPrisma.cateringOrderHistory.create.mockResolvedValue({});

      const result = await updateDeposit(
        'dep-1',
        { amount: 300 },
        'user-1',
        'order-1',
      );

      expect(result.amount).toBe(300);
    });

    it('should throw 400 when updated amount <= 0', async () => {
      mockPrisma.cateringDeposit.findUniqueOrThrow.mockResolvedValue(mockDeposit);

      await expect(
        updateDeposit('dep-1', { amount: 0 }),
      ).rejects.toThrow(/większa od 0/);
    });

    it('should throw 400 when updated total exceeds order price', async () => {
      mockPrisma.cateringDeposit.findUniqueOrThrow.mockResolvedValue(mockDeposit);
      mockPrisma.cateringOrder.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        totalPrice: 600,
        deposits: [mockDeposit, { id: 'dep-2', amount: 400 }],
      });

      await expect(
        updateDeposit('dep-1', { amount: 500 }),
      ).rejects.toThrow(/przekracza/);
    });
  });

  describe('deleteDeposit', () => {
    it('should delete a deposit', async () => {
      mockPrisma.cateringDeposit.findUniqueOrThrow.mockResolvedValue(mockDeposit);
      mockPrisma.cateringDeposit.delete.mockResolvedValue(mockDeposit);
      mockPrisma.cateringOrderHistory.create.mockResolvedValue({});

      await deleteDeposit('dep-1', 'user-1', 'order-1');

      expect(mockPrisma.cateringDeposit.delete).toHaveBeenCalledWith({
        where: { id: 'dep-1' },
      });
    });

    it('should record wasPaid flag when deleting paid deposit', async () => {
      const paidDeposit = { ...mockDeposit, paid: true, paymentMethod: 'CASH' };
      mockPrisma.cateringDeposit.findUniqueOrThrow.mockResolvedValue(paidDeposit);
      mockPrisma.cateringDeposit.delete.mockResolvedValue(paidDeposit);
      mockPrisma.cateringOrderHistory.create.mockResolvedValue({});

      await deleteDeposit('dep-1', 'user-1', 'order-1');

      expect(mockPrisma.cateringOrderHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'DEPOSIT_DELETED',
            newValue: expect.stringContaining('wasPaid:true'),
          }),
        }),
      );
    });
  });

  describe('markDepositPaid', () => {
    it('should mark a deposit as paid', async () => {
      mockPrisma.cateringDeposit.findUniqueOrThrow.mockResolvedValue(mockDeposit);
      mockPrisma.cateringDeposit.update.mockResolvedValue({
        ...mockDeposit,
        paid: true,
        status: 'PAID',
        remainingAmount: 0,
      });
      mockPrisma.cateringOrderHistory.create.mockResolvedValue({});

      const result = await markDepositPaid('dep-1', 'CASH', 'user-1', 'order-1');

      expect(result.paid).toBe(true);
      expect(result.remainingAmount).toBe(0);
      expect(mockPrisma.cateringDeposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paid: true,
            status: 'PAID',
            paymentMethod: 'CASH',
          }),
        }),
      );
    });

    it('should handle missing paymentMethod', async () => {
      mockPrisma.cateringDeposit.findUniqueOrThrow.mockResolvedValue(mockDeposit);
      mockPrisma.cateringDeposit.update.mockResolvedValue({
        ...mockDeposit,
        paid: true,
      });

      await markDepositPaid('dep-1');

      expect(mockPrisma.cateringDeposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentMethod: null,
          }),
        }),
      );
    });
  });
});
