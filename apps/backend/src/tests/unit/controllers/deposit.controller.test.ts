/**
 * DepositController — Unit Tests
 * Service + pdfService mocked. Tests validation (Zod), auth checks, response format.
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

import {
  listDeposits, getDepositStats, getOverdueDeposits, getDeposit,
  getReservationDeposits, createDeposit, updateDeposit, deleteDeposit,
  markDepositAsPaid, markDepositAsUnpaid, cancelDeposit, downloadDepositPdf,
} from '../../../controllers/deposit.controller';
import depositService from '../../../services/deposit.service';
import { pdfService } from '../../../services/pdf.service';

const svc = depositService as any;
const pdf = pdfService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {}, user: { id: 1 },
  ...overrides,
});

const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn();
  r.send = jest.fn();
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('DepositController', () => {
  // ═══════ listDeposits ═══════
  describe('listDeposits()', () => {
    it('should return 200 with deposits + pagination', async () => {
      svc.list.mockResolvedValue({ deposits: [{ id: 'd-1' }], pagination: { page: 1, total: 1 } });
      const response = res();
      await listDeposits(req({ query: {} }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, pagination: expect.any(Object) })
      );
    });
  });

  // ═══════ getDepositStats ═══════
  describe('getDepositStats()', () => {
    it('should return 200 with stats', async () => {
      svc.getStats.mockResolvedValue({ totalPending: 5, totalPaid: 10 });
      const response = res();
      await getDepositStats(req(), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { totalPending: 5, totalPaid: 10 } })
      );
    });
  });

  // ═══════ getOverdueDeposits ═══════
  describe('getOverdueDeposits()', () => {
    it('should return 200 with overdue list', async () => {
      svc.getOverdue.mockResolvedValue([{ id: 'd-1', status: 'OVERDUE' }]);
      const response = res();
      await getOverdueDeposits(req(), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  // ═══════ getDeposit ═══════
  describe('getDeposit()', () => {
    it('should return deposit by id', async () => {
      svc.getById.mockResolvedValue({ id: 'd-1', amount: 5000 });
      const response = res();
      await getDeposit(req({ params: { id: 'd-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { id: 'd-1', amount: 5000 } })
      );
    });
  });

  // ═══════ getReservationDeposits ═══════
  describe('getReservationDeposits()', () => {
    it('should return deposits + summary for reservation', async () => {
      svc.getByReservation.mockResolvedValue({
        deposits: [{ id: 'd-1' }], summary: { total: 5000, paid: 3000 },
      });
      const response = res();
      await getReservationDeposits(req({ params: { reservationId: 'r-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ summary: { total: 5000, paid: 3000 } })
      );
    });
  });

  // ═══════ createDeposit ═══════
  describe('createDeposit()', () => {
    it('should throw 401 when no user', async () => {
      const r = req({ user: undefined, params: { reservationId: 'r-1' }, body: { amount: 1000, dueDate: '2026-04-01' } });
      await expect(createDeposit(r, res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw Zod error when amount missing', async () => {
      const r = req({ params: { reservationId: 'r-1' }, body: { dueDate: '2026-04-01' } });
      await expect(createDeposit(r, res())).rejects.toThrow();
    });

    it('should throw Zod error when amount negative', async () => {
      const r = req({ params: { reservationId: 'r-1' }, body: { amount: -100, dueDate: '2026-04-01' } });
      await expect(createDeposit(r, res())).rejects.toThrow();
    });

    it('should return 201 on success', async () => {
      svc.create.mockResolvedValue({ id: 'd-new', amount: 2000 });
      const r = req({ params: { reservationId: 'r-1' }, body: { amount: 2000, dueDate: '2026-04-01' } });
      const response = res();
      await createDeposit(r, response);
      expect(response.status).toHaveBeenCalledWith(201);
      expect(svc.create).toHaveBeenCalledWith(
        expect.objectContaining({ reservationId: 'r-1', amount: 2000 }), 1
      );
    });
  });

  // ═══════ updateDeposit ═══════
  describe('updateDeposit()', () => {
    it('should throw 401 when no user', async () => {
      const r = req({ user: undefined, params: { id: 'd-1' }, body: { amount: 3000 } });
      await expect(updateDeposit(r, res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on success', async () => {
      svc.update.mockResolvedValue({ id: 'd-1', amount: 3000 });
      const r = req({ params: { id: 'd-1' }, body: { amount: 3000 } });
      const response = res();
      await updateDeposit(r, response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  // ═══════ deleteDeposit ═══════
  describe('deleteDeposit()', () => {
    it('should throw 401 when no user', async () => {
      await expect(deleteDeposit(req({ user: undefined, params: { id: 'd-1' } }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on success', async () => {
      svc.delete.mockResolvedValue({ success: true });
      const response = res();
      await deleteDeposit(req({ params: { id: 'd-1' } }), response);
      expect(response.json).toHaveBeenCalledWith({ success: true });
    });
  });

  // ═══════ markDepositAsPaid ═══════
  describe('markDepositAsPaid()', () => {
    it('should throw 401 when no user', async () => {
      const r = req({ user: undefined, params: { id: 'd-1' }, body: { paymentMethod: 'CASH', paidAt: '2026-03-01' } });
      await expect(markDepositAsPaid(r, res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw Zod error when paymentMethod invalid', async () => {
      const r = req({ params: { id: 'd-1' }, body: { paymentMethod: 'BITCOIN', paidAt: '2026-03-01' } });
      await expect(markDepositAsPaid(r, res())).rejects.toThrow();
    });

    it('should return 200 on valid payment', async () => {
      svc.markAsPaid.mockResolvedValue({ id: 'd-1', status: 'PAID' });
      const r = req({ params: { id: 'd-1' }, body: { paymentMethod: 'TRANSFER', paidAt: '2026-03-01' } });
      const response = res();
      await markDepositAsPaid(r, response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  // ═══════ markDepositAsUnpaid ═══════
  describe('markDepositAsUnpaid()', () => {
    it('should throw 401 when no user', async () => {
      await expect(markDepositAsUnpaid(req({ user: undefined, params: { id: 'd-1' } }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on success', async () => {
      svc.markAsUnpaid.mockResolvedValue({ id: 'd-1', status: 'PENDING' });
      const response = res();
      await markDepositAsUnpaid(req({ params: { id: 'd-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  // ═══════ cancelDeposit ═══════
  describe('cancelDeposit()', () => {
    it('should throw 401 when no user', async () => {
      await expect(cancelDeposit(req({ user: undefined, params: { id: 'd-1' } }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on cancel', async () => {
      svc.cancel.mockResolvedValue({ id: 'd-1', status: 'CANCELLED' });
      const response = res();
      await cancelDeposit(req({ params: { id: 'd-1' } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  // ═══════ downloadDepositPdf ═══════
  describe('downloadDepositPdf()', () => {
    it('should throw 400 when deposit not paid', async () => {
      svc.getById.mockResolvedValue({ id: 'd-1', paid: false });
      await expect(downloadDepositPdf(req({ params: { id: 'd-1' } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when no reservation data', async () => {
      svc.getById.mockResolvedValue({ id: 'd-1', paid: true, reservation: null });
      await expect(downloadDepositPdf(req({ params: { id: 'd-1' } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should send PDF buffer on success', async () => {
      const pdfBuf = Buffer.from('fake-pdf');
      svc.getById.mockResolvedValue({
        id: 'd-1', paid: true, paidAt: '2026-03-01', paymentMethod: 'TRANSFER', amount: 5000,
        reservation: {
          id: 'r-1', date: '2026-06-15', startTime: '14:00', endTime: '22:00',
          guests: 80, totalPrice: 15000,
          hall: { name: 'Sala Główna' }, eventType: { name: 'Wesele' },
          client: { firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.pl', phone: '+48123' },
        },
      });
      pdf.generatePaymentConfirmationPDF.mockResolvedValue(pdfBuf);
      const response = res();
      await downloadDepositPdf(req({ params: { id: 'd-1' } }), response);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(response.send).toHaveBeenCalledWith(pdfBuf);
    });
  });
});
