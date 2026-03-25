/**
 * CateringOrderController — Unit Tests
 * Uses try/catch + next(error) pattern.
 * Issue: #236
 */
jest.mock('../../../services/catering-order.service', () => ({
  __esModule: true,
  default: {
    listOrders: jest.fn(),
    getOrderById: jest.fn(),
    createOrder: jest.fn(),
    updateOrder: jest.fn(),
    changeOrderStatus: jest.fn(),
    deleteOrder: jest.fn(),
    getOrderHistory: jest.fn(),
    createDeposit: jest.fn(),
    updateDeposit: jest.fn(),
    deleteDeposit: jest.fn(),
    markDepositPaid: jest.fn(),
  },
}));

jest.mock('../../../services/pdf.service', () => ({
  __esModule: true,
  pdfService: {
    generateCateringQuotePDF: jest.fn(),
    generateCateringKitchenPDF: jest.fn(),
    generateCateringInvoicePDF: jest.fn(),
    generateCateringOrderPDF: jest.fn(),
  },
}));

import * as controller from '../../../controllers/catering-order.controller';
import cateringOrderService from '../../../services/catering-order.service';

const svc = cateringOrderService as any;

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
  r.send = jest.fn().mockReturnValue(r);
  r.set = jest.fn().mockReturnValue(r);
  return r;
};
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockOrder = {
  id: 'order-1',
  orderNumber: 'CAT-2026-00001',
  status: 'DRAFT',
  totalPrice: 600,
  client: { firstName: 'Jan', lastName: 'Kowalski' },
  items: [],
  extras: [],
};

const mockDeposit = {
  id: 'dep-1',
  amount: 200,
  paid: false,
};

describe('CateringOrderController', () => {
  // ═══════════ LIST ORDERS ═══════════

  describe('listOrders()', () => {
    it('should return paginated orders', async () => {
      const result = {
        data: [mockOrder],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      svc.listOrders.mockResolvedValue(result);
      const response = res();
      await controller.listOrders(req({ query: {} }), response, next);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [mockOrder] }),
      );
    });

    it('should pass query filters to service', async () => {
      svc.listOrders.mockResolvedValue({ data: [], meta: {} });
      await controller.listOrders(
        req({
          query: {
            status: 'DRAFT',
            deliveryType: 'ON_SITE',
            clientId: 'client-1',
            page: '2',
            limit: '10',
          },
        }),
        res(),
        next,
      );
      expect(svc.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DRAFT',
          deliveryType: 'ON_SITE',
          clientId: 'client-1',
          page: 2,
          limit: 10,
        }),
      );
    });

    it('should forward errors to next', async () => {
      svc.listOrders.mockRejectedValue(new Error('DB error'));
      await controller.listOrders(req(), res(), next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ═══════════ GET ORDER ═══════════

  describe('getOrder()', () => {
    it('should return order by id', async () => {
      svc.getOrderById.mockResolvedValue(mockOrder);
      const response = res();
      await controller.getOrder(req({ params: { id: 'order-1' } }), response, next);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockOrder }),
      );
    });

    it('should return 404 when not found', async () => {
      svc.getOrderById.mockResolvedValue(null);
      const response = res();
      await controller.getOrder(req({ params: { id: 'x' } }), response, next);
      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });
  });

  // ═══════════ CREATE ORDER ═══════════

  describe('createOrder()', () => {
    it('should return 201 on success', async () => {
      svc.createOrder.mockResolvedValue(mockOrder);
      const response = res();
      await controller.createOrder(
        req({ body: { clientId: 'client-1' } }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockOrder }),
      );
    });

    it('should inject createdById from user', async () => {
      svc.createOrder.mockResolvedValue(mockOrder);
      await controller.createOrder(
        req({ body: { clientId: 'client-1' } }),
        res(),
        next,
      );
      expect(svc.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ createdById: 'user-1' }),
      );
    });

    it('should forward errors to next', async () => {
      svc.createOrder.mockRejectedValue(new Error('Validation error'));
      await controller.createOrder(req(), res(), next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ═══════════ UPDATE ORDER ═══════════

  describe('updateOrder()', () => {
    it('should return updated order', async () => {
      svc.updateOrder.mockResolvedValue({ ...mockOrder, eventName: 'Updated' });
      const response = res();
      await controller.updateOrder(
        req({ params: { id: 'order-1' }, body: { eventName: 'Updated' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it('should inject changedById from user', async () => {
      svc.updateOrder.mockResolvedValue(mockOrder);
      await controller.updateOrder(
        req({ params: { id: 'order-1' }, body: { eventName: 'Test' } }),
        res(),
        next,
      );
      expect(svc.updateOrder).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({ changedById: 'user-1' }),
      );
    });
  });

  // ═══════════ CHANGE STATUS ═══════════

  describe('changeStatus()', () => {
    it('should change order status', async () => {
      svc.changeOrderStatus.mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
      });
      const response = res();
      await controller.changeStatus(
        req({
          params: { id: 'order-1' },
          body: { status: 'CONFIRMED', reason: 'Klient potwierdził' },
        }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
      expect(svc.changeOrderStatus).toHaveBeenCalledWith(
        'order-1',
        'CONFIRMED',
        'user-1',
        'Klient potwierdził',
      );
    });

    it('should forward errors to next', async () => {
      svc.changeOrderStatus.mockRejectedValue(new Error('Invalid transition'));
      await controller.changeStatus(
        req({ params: { id: 'order-1' }, body: { status: 'INVALID' } }),
        res(),
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ═══════════ DELETE ORDER ═══════════

  describe('deleteOrder()', () => {
    it('should return 204 on success', async () => {
      svc.deleteOrder.mockResolvedValue(undefined);
      const response = res();
      await controller.deleteOrder(
        req({ params: { id: 'order-1' } }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(204);
      expect(response.send).toHaveBeenCalled();
    });
  });

  // ═══════════ HISTORY ═══════════

  describe('getHistory()', () => {
    it('should return order history', async () => {
      const history = [{ id: 'h-1', changeType: 'CREATED' }];
      svc.getOrderHistory.mockResolvedValue(history);
      const response = res();
      await controller.getHistory(
        req({ params: { id: 'order-1' } }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: history }),
      );
    });
  });

  // ═══════════ DEPOSITS ═══════════

  describe('createDeposit()', () => {
    it('should return 201 on success', async () => {
      svc.createDeposit.mockResolvedValue(mockDeposit);
      const response = res();
      await controller.createDeposit(
        req({
          params: { id: 'order-1' },
          body: { amount: 200, dueDate: '2026-06-01' },
        }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(201);
      expect(svc.createDeposit).toHaveBeenCalledWith(
        'order-1',
        { amount: 200, dueDate: '2026-06-01' },
        'user-1',
      );
    });
  });

  describe('updateDeposit()', () => {
    it('should return updated deposit', async () => {
      svc.updateDeposit.mockResolvedValue({ ...mockDeposit, amount: 300 });
      const response = res();
      await controller.updateDeposit(
        req({
          params: { id: 'order-1', depositId: 'dep-1' },
          body: { amount: 300 },
        }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
      expect(svc.updateDeposit).toHaveBeenCalledWith(
        'dep-1',
        { amount: 300 },
        'user-1',
        'order-1',
      );
    });
  });

  describe('deleteDeposit()', () => {
    it('should return 204 on success', async () => {
      svc.deleteDeposit.mockResolvedValue(undefined);
      const response = res();
      await controller.deleteDeposit(
        req({ params: { id: 'order-1', depositId: 'dep-1' } }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(204);
      expect(svc.deleteDeposit).toHaveBeenCalledWith('dep-1', 'user-1', 'order-1');
    });
  });

  describe('markDepositPaid()', () => {
    it('should mark deposit as paid', async () => {
      svc.markDepositPaid.mockResolvedValue({ ...mockDeposit, paid: true });
      const response = res();
      await controller.markDepositPaid(
        req({
          params: { id: 'order-1', depositId: 'dep-1' },
          body: { paymentMethod: 'CASH' },
        }),
        response,
        next,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
      expect(svc.markDepositPaid).toHaveBeenCalledWith(
        'dep-1',
        'CASH',
        'user-1',
        'order-1',
      );
    });
  });

  // ═══════════ PDF ═══════════

  describe('generatePDF()', () => {
    it('should return 404 when order not found', async () => {
      svc.getOrderById.mockResolvedValue(null);
      const response = res();
      await controller.generatePDF(
        req({ params: { id: 'order-1', type: 'quote' } }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid PDF type', async () => {
      svc.getOrderById.mockResolvedValue(mockOrder);
      const response = res();
      await controller.generatePDF(
        req({ params: { id: 'order-1', type: 'invalid' } }),
        response,
        next,
      );
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should generate quote PDF', async () => {
      svc.getOrderById.mockResolvedValue(mockOrder);
      const { pdfService } = require('../../../services/pdf.service');
      pdfService.generateCateringQuotePDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await controller.generatePDF(
        req({ params: { id: 'order-1', type: 'quote' } }),
        response,
        next,
      );
      expect(response.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'application/pdf' }),
      );
      expect(response.send).toHaveBeenCalled();
    });

    it('should generate kitchen PDF', async () => {
      svc.getOrderById.mockResolvedValue(mockOrder);
      const { pdfService } = require('../../../services/pdf.service');
      pdfService.generateCateringKitchenPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await controller.generatePDF(
        req({ params: { id: 'order-1', type: 'kitchen' } }),
        response,
        next,
      );
      expect(response.send).toHaveBeenCalled();
    });

    it('should generate invoice PDF', async () => {
      svc.getOrderById.mockResolvedValue(mockOrder);
      const { pdfService } = require('../../../services/pdf.service');
      pdfService.generateCateringInvoicePDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await controller.generatePDF(
        req({ params: { id: 'order-1', type: 'invoice' } }),
        response,
        next,
      );
      expect(response.send).toHaveBeenCalled();
    });

    it('should generate order PDF', async () => {
      svc.getOrderById.mockResolvedValue(mockOrder);
      const { pdfService } = require('../../../services/pdf.service');
      pdfService.generateCateringOrderPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await controller.generatePDF(
        req({ params: { id: 'order-1', type: 'order' } }),
        response,
        next,
      );
      expect(response.send).toHaveBeenCalled();
    });
  });
});
