/**
 * Deposit Controller — Branch coverage tests
 * Covers: downloadDepositPdf (!paid, !reservation, paidAt fallback, paymentMethod fallback,
 * null email/date/hall/eventType), !userId in CRUD methods
 */

jest.mock('../../../services/deposit.service', () => ({
  __esModule: true,
  default: {
    list: jest.fn(),
    getStats: jest.fn(),
    getOverdue: jest.fn(),
    getById: jest.fn(),
    getByReservation: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    markAsPaid: jest.fn(),
    markAsUnpaid: jest.fn(),
    cancel: jest.fn(),
    sendConfirmationEmail: jest.fn(),
  },
}));

jest.mock('../../../services/pdf.service', () => ({
  pdfService: {
    generatePaymentConfirmationPDF: jest.fn(),
  },
}));

jest.mock('../../../validation/deposit.validation', () => ({
  depositFiltersSchema: { parse: jest.fn((x: any) => x) },
  createDepositSchema: { parse: jest.fn((x: any) => x) },
  updateDepositSchema: { parse: jest.fn((x: any) => x) },
  markPaidSchema: { parse: jest.fn((x: any) => x) },
}));

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static unauthorized(msg?: string) { return new MockAppError(msg || 'Unauthorized', 401); }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
  }
  return { AppError: MockAppError };
});

import * as ctrl from '../../../controllers/deposit.controller';
import depositService from '../../../services/deposit.service';
import { pdfService } from '../../../services/pdf.service';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.send = jest.fn();
  return res;
};

describe('Deposit Controller branches', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('downloadDepositPdf', () => {
    it('should throw when deposit not paid', async () => {
      (depositService.getById as jest.Mock).mockResolvedValue({ id: 'd1', paid: false });
      const req = { params: { id: 'd1' } } as any;
      await expect(ctrl.downloadDepositPdf(req, mockRes())).rejects.toThrow('oplaconych');
    });

    it('should throw when no reservation', async () => {
      (depositService.getById as jest.Mock).mockResolvedValue({ id: 'd1', paid: true, reservation: null });
      const req = { params: { id: 'd1' } } as any;
      await expect(ctrl.downloadDepositPdf(req, mockRes())).rejects.toThrow('danych');
    });

    it('should throw when no client', async () => {
      (depositService.getById as jest.Mock).mockResolvedValue({
        id: 'd1', paid: true,
        reservation: { id: 'r1', client: null },
      });
      const req = { params: { id: 'd1' } } as any;
      await expect(ctrl.downloadDepositPdf(req, mockRes())).rejects.toThrow('danych');
    });

    it('should generate PDF with all fields present', async () => {
      (depositService.getById as jest.Mock).mockResolvedValue({
        id: 'd1', paid: true, paidAt: '2026-01-15T10:00:00Z', paymentMethod: 'CASH', amount: 500,
        reservation: {
          id: 'r1', date: '2026-03-01', startTime: '10:00', endTime: '18:00',
          guests: 50, totalPrice: 5000,
          hall: { name: 'Sala A' }, eventType: { name: 'Wesele' },
          client: { firstName: 'Jan', lastName: 'K', email: 'jan@k.pl', phone: '123' },
        },
      });
      (pdfService.generatePaymentConfirmationPDF as jest.Mock).mockResolvedValue(Buffer.from('pdf'));
      const req = { params: { id: 'd1' } } as any;
      const res = mockRes();
      await ctrl.downloadDepositPdf(req, res);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(pdfService.generatePaymentConfirmationPDF).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'CASH',
          client: expect.objectContaining({ email: 'jan@k.pl' }),
          reservation: expect.objectContaining({ hall: 'Sala A', eventType: 'Wesele' }),
        })
      );
    });

    it('should use fallbacks when optional fields null', async () => {
      (depositService.getById as jest.Mock).mockResolvedValue({
        id: 'd1', paid: true, paidAt: null, paymentMethod: null, amount: 300,
        reservation: {
          id: 'r1', date: null, startTime: null, endTime: null, guests: 30, totalPrice: 3000,
          hall: null, eventType: null,
          client: { firstName: 'Anna', lastName: 'M', email: null, phone: '456' },
        },
      });
      (pdfService.generatePaymentConfirmationPDF as jest.Mock).mockResolvedValue(Buffer.from('pdf'));
      const req = { params: { id: 'd1' } } as any;
      const res = mockRes();
      await ctrl.downloadDepositPdf(req, res);
      expect(pdfService.generatePaymentConfirmationPDF).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'TRANSFER',
          client: expect.objectContaining({ email: undefined }),
          reservation: expect.objectContaining({
            date: '', startTime: '', endTime: '',
            hall: undefined, eventType: undefined,
          }),
        })
      );
    });
  });

  describe('createDeposit', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { reservationId: 'r1' }, body: { amount: 500, dueDate: '2026-03-01' }, user: undefined } as any;
      await expect(ctrl.createDeposit(req, mockRes())).rejects.toThrow();
    });

    it('should create deposit', async () => {
      (depositService.create as jest.Mock).mockResolvedValue({ id: 'd1' });
      const req = { params: { reservationId: 'r1' }, body: { amount: 500, dueDate: '2026-03-01' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.createDeposit(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateDeposit', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'd1' }, body: {}, user: undefined } as any;
      await expect(ctrl.updateDeposit(req, mockRes())).rejects.toThrow();
    });
  });

  describe('deleteDeposit', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'd1' }, user: undefined } as any;
      await expect(ctrl.deleteDeposit(req, mockRes())).rejects.toThrow();
    });
  });

  describe('markDepositAsPaid', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'd1' }, body: {}, user: undefined } as any;
      await expect(ctrl.markDepositAsPaid(req, mockRes())).rejects.toThrow();
    });
  });

  describe('markDepositAsUnpaid', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'd1' }, user: undefined } as any;
      await expect(ctrl.markDepositAsUnpaid(req, mockRes())).rejects.toThrow();
    });
  });

  describe('cancelDeposit', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'd1' }, user: undefined } as any;
      await expect(ctrl.cancelDeposit(req, mockRes())).rejects.toThrow();
    });
  });

  describe('sendDepositEmail', () => {
    it('should send email', async () => {
      (depositService.sendConfirmationEmail as jest.Mock).mockResolvedValue({ success: true });
      const req = { params: { id: 'd1' } } as any;
      const res = mockRes();
      await ctrl.sendDepositEmail(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
