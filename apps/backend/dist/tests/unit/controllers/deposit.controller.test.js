/**
 * Deposit Controller — Unit Tests
 * Tests all exported controller functions.
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
    createDepositSchema: { parse: jest.fn((d) => d) },
    updateDepositSchema: { parse: jest.fn((d) => d) },
    markPaidSchema: { parse: jest.fn((d) => d) },
    depositFiltersSchema: { parse: jest.fn((d) => d) },
}));
import * as ctrl from '../../../controllers/deposit.controller';
import depositService from '../../../services/deposit.service';
import { pdfService } from '../../../services/pdf.service';
const svc = depositService;
const pdfSvc = pdfService;
const req = (overrides = {}) => ({
    body: {}, params: {}, query: {}, user: { id: 'u-1' },
    ...overrides,
});
const res = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    r.setHeader = jest.fn();
    r.send = jest.fn();
    return r;
};
beforeEach(() => jest.clearAllMocks());
describe('Deposit Controller', () => {
    describe('listDeposits', () => {
        it('should return list with pagination', async () => {
            svc.list.mockResolvedValue({ deposits: [{ id: 'd-1' }], pagination: { total: 1 } });
            const response = res();
            await ctrl.listDeposits(req({ query: {} }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: 'd-1' }] }));
        });
    });
    describe('getDepositStats', () => {
        it('should return stats', async () => {
            svc.getStats.mockResolvedValue({ total: 5000 });
            const response = res();
            await ctrl.getDepositStats(req(), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: { total: 5000 } }));
        });
    });
    describe('getOverdueDeposits', () => {
        it('should return overdue list', async () => {
            svc.getOverdue.mockResolvedValue([{ id: 'd-2' }]);
            const response = res();
            await ctrl.getOverdueDeposits(req(), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: 'd-2' }] }));
        });
    });
    describe('getDeposit', () => {
        it('should return single deposit', async () => {
            svc.getById.mockResolvedValue({ id: 'd-1' });
            const response = res();
            await ctrl.getDeposit(req({ params: { id: 'd-1' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: 'd-1' } }));
        });
    });
    describe('downloadDepositPdf', () => {
        const PAID_DEPOSIT = {
            id: 'd-1', paid: true, amount: 5000,
            paidAt: '2026-01-15T10:00:00Z',
            paymentMethod: 'CASH',
            reservation: {
                id: 'r-1', date: '2026-03-15', startTime: '14:00', endTime: '22:00',
                guests: 80, totalPrice: 20000,
                client: { firstName: 'Jan', lastName: 'Kowalski', email: 'jan@x.pl', phone: '123' },
                hall: { name: 'Sala A' },
                eventType: { name: 'Wesele' },
            },
        };
        it('should throw 400 when deposit not paid', async () => {
            svc.getById.mockResolvedValue({ ...PAID_DEPOSIT, paid: false });
            await expect(ctrl.downloadDepositPdf(req({ params: { id: 'd-1' } }), res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should throw 400 when no reservation', async () => {
            svc.getById.mockResolvedValue({ ...PAID_DEPOSIT, reservation: null });
            await expect(ctrl.downloadDepositPdf(req({ params: { id: 'd-1' } }), res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should throw 400 when no client', async () => {
            svc.getById.mockResolvedValue({
                ...PAID_DEPOSIT,
                reservation: { ...PAID_DEPOSIT.reservation, client: null },
            });
            await expect(ctrl.downloadDepositPdf(req({ params: { id: 'd-1' } }), res())).rejects.toMatchObject({ statusCode: 400 });
        });
        it('should generate PDF with paidAt date', async () => {
            svc.getById.mockResolvedValue(PAID_DEPOSIT);
            pdfSvc.generatePaymentConfirmationPDF.mockResolvedValue(Buffer.from('pdf'));
            const response = res();
            await ctrl.downloadDepositPdf(req({ params: { id: 'd-1' } }), response);
            expect(pdfSvc.generatePaymentConfirmationPDF).toHaveBeenCalledWith(expect.objectContaining({ paidAt: new Date('2026-01-15T10:00:00Z'), paymentMethod: 'CASH' }));
            expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(response.send).toHaveBeenCalled();
        });
        it('should use current date when paidAt is null', async () => {
            svc.getById.mockResolvedValue({ ...PAID_DEPOSIT, paidAt: null });
            pdfSvc.generatePaymentConfirmationPDF.mockResolvedValue(Buffer.from('pdf'));
            const response = res();
            await ctrl.downloadDepositPdf(req({ params: { id: 'd-1' } }), response);
            const call = pdfSvc.generatePaymentConfirmationPDF.mock.calls[0][0];
            expect(call.paidAt).toBeInstanceOf(Date);
        });
        it('should fallback paymentMethod to TRANSFER when null', async () => {
            svc.getById.mockResolvedValue({ ...PAID_DEPOSIT, paymentMethod: null });
            pdfSvc.generatePaymentConfirmationPDF.mockResolvedValue(Buffer.from('pdf'));
            const response = res();
            await ctrl.downloadDepositPdf(req({ params: { id: 'd-1' } }), response);
            const call = pdfSvc.generatePaymentConfirmationPDF.mock.calls[0][0];
            expect(call.paymentMethod).toBe('TRANSFER');
        });
    });
    describe('sendDepositEmail', () => {
        it('should return result', async () => {
            svc.sendConfirmationEmail.mockResolvedValue({ sent: true });
            const response = res();
            await ctrl.sendDepositEmail(req({ params: { id: 'd-1' } }), response);
            expect(response.json).toHaveBeenCalledWith({ sent: true });
        });
    });
    describe('getReservationDeposits', () => {
        it('should return deposits with summary', async () => {
            svc.getByReservation.mockResolvedValue({ deposits: [], summary: { total: 0 } });
            const response = res();
            await ctrl.getReservationDeposits(req({ params: { reservationId: 'r-1' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
    describe('createDeposit', () => {
        it('should throw 401 when no user', async () => {
            await expect(ctrl.createDeposit(req({ params: { reservationId: 'r-1' }, user: undefined }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return 201 on success', async () => {
            svc.create.mockResolvedValue({ id: 'd-new' });
            const response = res();
            await ctrl.createDeposit(req({ params: { reservationId: 'r-1' }, body: { amount: 1000, dueDate: '2026-04-01' } }), response);
            expect(response.status).toHaveBeenCalledWith(201);
        });
    });
    describe('updateDeposit', () => {
        it('should throw 401 when no user', async () => {
            await expect(ctrl.updateDeposit(req({ params: { id: 'd-1' }, user: undefined }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return updated deposit', async () => {
            svc.update.mockResolvedValue({ id: 'd-1' });
            const response = res();
            await ctrl.updateDeposit(req({ params: { id: 'd-1' }, body: { amount: 2000 } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
    describe('deleteDeposit', () => {
        it('should throw 401 when no user', async () => {
            await expect(ctrl.deleteDeposit(req({ params: { id: 'd-1' }, user: undefined }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return result', async () => {
            svc.delete.mockResolvedValue({ success: true });
            const response = res();
            await ctrl.deleteDeposit(req({ params: { id: 'd-1' } }), response);
            expect(response.json).toHaveBeenCalledWith({ success: true });
        });
    });
    describe('markDepositAsPaid', () => {
        it('should throw 401 when no user', async () => {
            await expect(ctrl.markDepositAsPaid(req({ params: { id: 'd-1' }, user: undefined }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return paid deposit', async () => {
            svc.markAsPaid.mockResolvedValue({ id: 'd-1', paid: true });
            const response = res();
            await ctrl.markDepositAsPaid(req({ params: { id: 'd-1' }, body: { paymentMethod: 'CASH' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
    describe('markDepositAsUnpaid', () => {
        it('should throw 401 when no user', async () => {
            await expect(ctrl.markDepositAsUnpaid(req({ params: { id: 'd-1' }, user: undefined }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return unpaid deposit', async () => {
            svc.markAsUnpaid.mockResolvedValue({ id: 'd-1', paid: false });
            const response = res();
            await ctrl.markDepositAsUnpaid(req({ params: { id: 'd-1' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
    describe('cancelDeposit', () => {
        it('should throw 401 when no user', async () => {
            await expect(ctrl.cancelDeposit(req({ params: { id: 'd-1' }, user: undefined }), res())).rejects.toMatchObject({ statusCode: 401 });
        });
        it('should return cancelled deposit', async () => {
            svc.cancel.mockResolvedValue({ id: 'd-1', status: 'CANCELLED' });
            const response = res();
            await ctrl.cancelDeposit(req({ params: { id: 'd-1' } }), response);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
//# sourceMappingURL=deposit.controller.test.js.map