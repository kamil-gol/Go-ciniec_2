/**
 * DepositService — Branch Coverage Tests
 * Focuses on: update() 4-way if/else, checkAndAutoConfirmReservation() early returns,
 * list() filter combinations, getByReservation() percentPaid edge, markAsPaid() partial,
 * getStats/autoMarkOverdue fallbacks, sendConfirmationEmail guards, markAsUnpaid/cancel guards
 */
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        reservation: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        deposit: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        reservationHistory: { create: jest.fn() },
        $queryRawUnsafe: jest.fn(),
    },
}));
jest.mock('../../../services/pdf.service', () => ({
    pdfService: { generatePaymentConfirmationPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')) },
}));
jest.mock('../../../services/email.service', () => ({
    __esModule: true,
    default: { sendDepositPaidConfirmation: jest.fn().mockResolvedValue(true) },
}));
jest.mock('../../../utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/audit-logger', () => ({
    logChange: jest.fn().mockResolvedValue(undefined),
}));
import depositService from '../../../services/deposit.service';
import { prisma } from '../../../lib/prisma';
const db = prisma;
const makeDeposit = (o = {}) => ({
    id: 'dep-1', reservationId: 'res-1', amount: 500,
    remainingAmount: 500, paidAmount: 0, dueDate: '2027-06-15',
    status: 'PENDING', paid: false, paidAt: null, paymentMethod: null,
    reservation: {
        id: 'res-1', totalPrice: 5000, status: 'PENDING',
        client: { firstName: 'Jan', lastName: 'K', email: 'j@k.pl', phone: '123' },
        hall: { name: 'Sala A' }, eventType: { name: 'Wesele' },
        date: '2027-08-15', startTime: '14:00', endTime: '22:00', guests: 50,
        deposits: [],
    },
    ...o,
});
// resetAllMocks clears mockResolvedValueOnce queues (clearAllMocks does NOT)
beforeEach(() => jest.resetAllMocks());
describe('DepositService — branches', () => {
    // ═══ update() — 4-way branch ═══
    describe('update() — update path branches', () => {
        const setupUpdate = (deposit, reservation = null) => {
            db.deposit.findUnique
                .mockResolvedValueOnce(deposit) // initial find
                .mockResolvedValueOnce(deposit); // return updated
            if (reservation) {
                db.reservation.findUnique.mockResolvedValueOnce(reservation);
            }
            db.$queryRawUnsafe.mockResolvedValue([{ count: 1 }]);
        };
        it('should update both amount and dueDate (branch 1)', async () => {
            const dep = makeDeposit();
            setupUpdate(dep, { ...dep.reservation, deposits: [dep] });
            await depositService.update('dep-1', { amount: 600, dueDate: '2027-07-01' }, 'user-1');
            expect(db.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('amount'), 600, 600, '2027-07-01', 'dep-1');
        });
        it('should update amount only (branch 2)', async () => {
            const dep = makeDeposit();
            setupUpdate(dep, { ...dep.reservation, deposits: [dep] });
            await depositService.update('dep-1', { amount: 600 }, 'user-1');
            const call = db.$queryRawUnsafe.mock.calls[0];
            expect(call[0]).toContain('amount');
            expect(call[0]).not.toContain('dueDate');
        });
        it('should update dueDate only (branch 3)', async () => {
            const dep = makeDeposit();
            setupUpdate(dep);
            await depositService.update('dep-1', { dueDate: '2027-07-01' }, 'user-1');
            const call = db.$queryRawUnsafe.mock.calls[0];
            expect(call[0]).toContain('dueDate');
            expect(call[0]).not.toContain('amount =');
        });
        it('should skip raw query when neither amount nor dueDate (branch 4)', async () => {
            const dep = makeDeposit();
            setupUpdate(dep);
            await depositService.update('dep-1', {}, 'user-1');
            expect(db.$queryRawUnsafe).not.toHaveBeenCalled();
        });
        it('should throw when deposit is paid', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: true }));
            await expect(depositService.update('dep-1', { amount: 100 }, 'user-1'))
                .rejects.toThrow('edytowac oplaconej');
        });
        it('should throw when amount <= 0', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(makeDeposit());
            await expect(depositService.update('dep-1', { amount: 0 }, 'user-1'))
                .rejects.toThrow('wieksza od 0');
        });
        it('should throw when new amount exceeds total', async () => {
            const dep = makeDeposit({ amount: 500 });
            db.deposit.findUnique.mockResolvedValueOnce(dep);
            db.reservation.findUnique.mockResolvedValueOnce({
                totalPrice: 1000,
                deposits: [dep, { id: 'dep-2', amount: 800, status: 'PENDING' }],
            });
            await expect(depositService.update('dep-1', { amount: 300 }, 'user-1'))
                .rejects.toThrow('przekracza');
        });
        it('should throw when deposit not found', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(null);
            await expect(depositService.update('bad', { amount: 100 }, 'user-1'))
                .rejects.toThrow();
        });
    });
    // ═══ checkAndAutoConfirmReservation() ═══
    describe('checkAndAutoConfirmReservation()', () => {
        it('should return early when reservation not found', async () => {
            db.reservation.findUnique.mockResolvedValueOnce(null);
            await depositService.checkAndAutoConfirmReservation('bad', 'user-1');
            expect(db.reservation.update).not.toHaveBeenCalled();
        });
        it('should return early when reservation is not PENDING', async () => {
            db.reservation.findUnique.mockResolvedValueOnce({
                id: 'res-1', status: 'CONFIRMED', deposits: [], client: null,
            });
            await depositService.checkAndAutoConfirmReservation('res-1', 'user-1');
            expect(db.reservation.update).not.toHaveBeenCalled();
        });
        it('should return early when no active deposits (all cancelled)', async () => {
            db.reservation.findUnique.mockResolvedValueOnce({
                id: 'res-1', status: 'PENDING',
                deposits: [{ status: 'CANCELLED' }],
                client: null,
            });
            await depositService.checkAndAutoConfirmReservation('res-1', 'user-1');
            expect(db.reservation.update).not.toHaveBeenCalled();
        });
        it('should return early when not all deposits are paid', async () => {
            db.reservation.findUnique.mockResolvedValueOnce({
                id: 'res-1', status: 'PENDING',
                deposits: [{ status: 'PAID', amount: 500 }, { status: 'PENDING', amount: 500 }],
                client: null,
            });
            await depositService.checkAndAutoConfirmReservation('res-1', 'user-1');
            expect(db.reservation.update).not.toHaveBeenCalled();
        });
        it('should auto-confirm when all deposits are PAID', async () => {
            db.reservation.findUnique.mockResolvedValueOnce({
                id: 'res-1', status: 'PENDING',
                deposits: [{ status: 'PAID', amount: 500 }, { status: 'PAID', amount: 500 }],
                client: { firstName: 'Jan', lastName: 'K' },
            });
            db.reservation.update.mockResolvedValueOnce({});
            db.reservationHistory.create.mockResolvedValueOnce({});
            await depositService.checkAndAutoConfirmReservation('res-1', 'user-1');
            expect(db.reservation.update).toHaveBeenCalledWith({
                where: { id: 'res-1' },
                data: { status: 'CONFIRMED' },
            });
        });
        it('should auto-confirm with null client (N/A name)', async () => {
            db.reservation.findUnique.mockResolvedValueOnce({
                id: 'res-1', status: 'PENDING',
                deposits: [{ status: 'PAID', amount: 500 }],
                client: null,
            });
            db.reservation.update.mockResolvedValueOnce({});
            db.reservationHistory.create.mockResolvedValueOnce({});
            await depositService.checkAndAutoConfirmReservation('res-1', 'user-1');
            expect(db.reservation.update).toHaveBeenCalled();
        });
        it('should catch errors and not throw', async () => {
            db.reservation.findUnique.mockRejectedValueOnce(new Error('DB'));
            await depositService.checkAndAutoConfirmReservation('res-1', 'user-1');
        });
    });
    // ═══ list() filter branches ═══
    describe('list() — filter branches', () => {
        const setupList = () => {
            db.deposit.findMany.mockResolvedValue([]);
            db.deposit.count.mockResolvedValue(0);
        };
        it('should apply overdue filter', async () => {
            setupList();
            await depositService.list({ overdue: true });
            const where = db.deposit.findMany.mock.calls[0][0].where;
            expect(where.status).toEqual({ equals: 'PENDING' });
            expect(where.dueDate).toBeDefined();
        });
        it('should apply dateFrom only', async () => {
            setupList();
            await depositService.list({ dateFrom: '2027-01-01' });
            const where = db.deposit.findMany.mock.calls[0][0].where;
            expect(where.dueDate.gte).toBe('2027-01-01');
            expect(where.dueDate.lte).toBeUndefined();
        });
        it('should apply dateTo only', async () => {
            setupList();
            await depositService.list({ dateTo: '2027-12-31' });
            const where = db.deposit.findMany.mock.calls[0][0].where;
            expect(where.dueDate.lte).toBe('2027-12-31');
            expect(where.dueDate.gte).toBeUndefined();
        });
        it('should apply dateFrom and dateTo', async () => {
            setupList();
            await depositService.list({ dateFrom: '2027-01-01', dateTo: '2027-12-31' });
            const where = db.deposit.findMany.mock.calls[0][0].where;
            expect(where.dueDate.gte).toBe('2027-01-01');
            expect(where.dueDate.lte).toBe('2027-12-31');
        });
        it('should apply search filter', async () => {
            setupList();
            await depositService.list({ search: 'Jan' });
            const where = db.deposit.findMany.mock.calls[0][0].where;
            expect(where.reservation.client.OR).toBeDefined();
        });
        it('should apply paid filter', async () => {
            setupList();
            await depositService.list({ paid: true });
            const where = db.deposit.findMany.mock.calls[0][0].where;
            expect(where.paid).toBe(true);
        });
        it('should apply status filter', async () => {
            setupList();
            await depositService.list({ status: 'PAID' });
            const where = db.deposit.findMany.mock.calls[0][0].where;
            expect(where.status).toEqual({ equals: 'PAID' });
        });
        it('should use default pagination and sorting', async () => {
            setupList();
            await depositService.list({});
            const args = db.deposit.findMany.mock.calls[0][0];
            expect(args.skip).toBe(0);
            expect(args.take).toBe(20);
            expect(args.orderBy).toEqual({ dueDate: 'asc' });
        });
        it('should calculate hasMore correctly', async () => {
            db.deposit.findMany.mockResolvedValue([{ id: '1' }]);
            db.deposit.count.mockResolvedValue(50);
            const result = await depositService.list({ page: 1, limit: 1 });
            expect(result.pagination.hasMore).toBe(true);
        });
    });
    // ═══ getByReservation() ═══
    describe('getByReservation()', () => {
        it('should return percentPaid = 0 when reservationTotal = 0', async () => {
            db.reservation.findUnique.mockResolvedValueOnce({ id: 'res-1', totalPrice: 0 });
            db.deposit.findMany.mockResolvedValueOnce([]);
            const result = await depositService.getByReservation('res-1');
            expect(result.summary.percentPaid).toBe(0);
        });
        it('should throw when reservation not found', async () => {
            db.reservation.findUnique.mockResolvedValueOnce(null);
            await expect(depositService.getByReservation('bad')).rejects.toThrow();
        });
    });
    // ═══ markAsPaid() partial payment ═══
    describe('markAsPaid() — partial payment', () => {
        it('should mark as PARTIALLY_PAID when amountPaid < amount', async () => {
            const dep = makeDeposit();
            db.deposit.findUnique
                .mockResolvedValueOnce(dep)
                .mockResolvedValueOnce({ ...dep, status: 'PARTIALLY_PAID', paid: false });
            db.$queryRawUnsafe.mockResolvedValue([]);
            // isPaid=false → checkAndAutoConfirmReservation NOT called → no reservation mock needed
            await depositService.markAsPaid('dep-1', {
                paymentMethod: 'CASH', paidAt: '2027-06-15', amountPaid: 200,
            }, 'user-1');
            const updateCall = db.$queryRawUnsafe.mock.calls[0];
            expect(updateCall[1]).toBe(false); // isPaid = false
            expect(updateCall[2]).toBe('PARTIALLY_PAID');
        });
        it('should use deposit.amount when amountPaid not provided', async () => {
            const dep = makeDeposit({ amount: 500 });
            db.deposit.findUnique
                .mockResolvedValueOnce(dep)
                .mockResolvedValueOnce({ ...dep, status: 'PAID', paid: true });
            db.$queryRawUnsafe.mockResolvedValue([]);
            // isPaid=true → checkAndAutoConfirmReservation called → needs reservation mock
            db.reservation.findUnique.mockResolvedValueOnce(null); // autoConfirm early return
            await depositService.markAsPaid('dep-1', {
                paymentMethod: 'TRANSFER', paidAt: '2027-06-15',
            }, 'user-1');
            const updateCall = db.$queryRawUnsafe.mock.calls[0];
            expect(updateCall[1]).toBe(true); // isPaid (500-500=0 <= 0)
            expect(updateCall[6]).toBe(500); // amountPaid = deposit.amount
        });
        it('should throw when already paid', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: true }));
            await expect(depositService.markAsPaid('dep-1', {
                paymentMethod: 'CASH', paidAt: '2027-06-15',
            }, 'user-1')).rejects.toThrow('juz oznaczona');
        });
    });
    // ═══ sendConfirmationEmail() guards ═══
    describe('sendConfirmationEmail()', () => {
        it('should throw when deposit not paid', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: false }));
            await expect(depositService.sendConfirmationEmail('dep-1'))
                .rejects.toThrow('oplaconej');
        });
        it('should throw when client has no email', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({
                paid: true,
                reservation: {
                    id: 'res-1', client: { firstName: 'A', lastName: 'B', email: null, phone: '123' },
                    hall: null, eventType: null, date: null, startTime: null, endTime: null,
                    guests: 0, totalPrice: 1000,
                },
            }));
            await expect(depositService.sendConfirmationEmail('dep-1'))
                .rejects.toThrow('email');
        });
        it('should throw when deposit not found', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(null);
            await expect(depositService.sendConfirmationEmail('bad'))
                .rejects.toThrow();
        });
    });
    // ═══ markAsUnpaid() ═══
    describe('markAsUnpaid()', () => {
        it('should throw when deposit already unpaid and PENDING', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: false, status: 'PENDING' }));
            await expect(depositService.markAsUnpaid('dep-1', 'user-1'))
                .rejects.toThrow('nie jest oznaczona');
        });
        it('should throw when deposit not found', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(null);
            await expect(depositService.markAsUnpaid('bad', 'user-1'))
                .rejects.toThrow();
        });
    });
    // ═══ cancel() ═══
    describe('cancel()', () => {
        it('should throw when deposit is paid', async () => {
            db.deposit.findUnique.mockResolvedValueOnce(makeDeposit({ paid: true }));
            await expect(depositService.cancel('dep-1', 'user-1'))
                .rejects.toThrow('anulowac oplaconej');
        });
    });
    // ═══ create() guards ═══
    describe('create() — edge cases', () => {
        it('should throw when amount <= 0', async () => {
            db.reservation.findUnique.mockResolvedValueOnce({
                id: 'res-1', totalPrice: 5000, deposits: [], client: null,
            });
            await expect(depositService.create({
                reservationId: 'res-1', amount: 0, dueDate: '2027-06-15',
            }, 'user-1')).rejects.toThrow('wieksza od 0');
        });
        it('should throw when sum exceeds totalPrice', async () => {
            db.reservation.findUnique.mockResolvedValueOnce({
                id: 'res-1', totalPrice: 1000,
                deposits: [{ amount: 800, status: 'PENDING' }],
                client: null,
            });
            await expect(depositService.create({
                reservationId: 'res-1', amount: 300, dueDate: '2027-06-15',
            }, 'user-1')).rejects.toThrow('przekracza');
        });
    });
    // ═══ getStats() fallback ═══
    describe('getStats()', () => {
        it('should handle empty stats row', async () => {
            db.$queryRawUnsafe.mockResolvedValueOnce([{}]);
            const result = await depositService.getStats();
            expect(result.counts.total).toBe(0);
            expect(result.amounts.total).toBe(0);
        });
        it('should handle no rows returned', async () => {
            db.$queryRawUnsafe.mockResolvedValueOnce([]);
            const result = await depositService.getStats();
            expect(result.counts.total).toBe(0);
        });
    });
    // ═══ autoMarkOverdue() fallback ═══
    describe('autoMarkOverdue()', () => {
        it('should handle empty result', async () => {
            db.$queryRawUnsafe.mockResolvedValueOnce([]);
            const result = await depositService.autoMarkOverdue();
            expect(result.markedOverdueCount).toBe(0);
        });
        it('should return count from result', async () => {
            db.$queryRawUnsafe.mockResolvedValueOnce([{ count: 5 }]);
            const result = await depositService.autoMarkOverdue();
            expect(result.markedOverdueCount).toBe(5);
        });
    });
});
//# sourceMappingURL=deposit.service.branches.test.js.map