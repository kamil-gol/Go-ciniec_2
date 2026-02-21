/**
 * DepositService — Unit Tests: Business Logic
 * Część 2/2 testów modułu Zaliczki
 */
// ═══ Mock Prisma ═══
jest.mock('../../../lib/prisma', () => {
    const mock = {
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
    };
    return { prisma: mock, __esModule: true, default: mock };
});
jest.mock('../../../utils/audit-logger', () => ({
    logChange: jest.fn().mockResolvedValue(undefined),
    diffObjects: jest.fn().mockReturnValue({}),
}));
jest.mock('../../../utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock('../../../services/pdf.service', () => ({
    pdfService: { generatePaymentConfirmationPDF: jest.fn() },
}));
jest.mock('../../../services/email.service', () => ({
    __esModule: true,
    default: { sendDepositPaidConfirmation: jest.fn() },
}));
import depositService from '../../../services/deposit.service';
import { prisma } from '../../../lib/prisma';
import { logChange } from '../../../utils/audit-logger';
const mockPrisma = prisma;
const TEST_USER_ID = 'user-uuid-001';
const UNPAID_DEPOSIT = {
    id: 'dep-uuid-001',
    reservationId: 'res-uuid-001',
    amount: '2000',
    remainingAmount: '2000',
    paidAmount: '0',
    dueDate: '2026-06-01',
    status: 'PENDING',
    paid: false,
    paidAt: null,
    paymentMethod: null,
    reservation: {
        id: 'res-uuid-001',
        client: { firstName: 'Jan', lastName: 'Kowalski' },
        hall: { name: 'Sala' },
        eventType: { name: 'Wesele' },
    },
};
const PAID_DEPOSIT = {
    ...UNPAID_DEPOSIT,
    id: 'dep-uuid-002',
    status: 'PAID',
    paid: true,
    paidAt: '2026-05-15T10:00:00.000Z',
    paymentMethod: 'TRANSFER',
    paidAmount: '2000',
    remainingAmount: '0',
};
beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.deposit.findUnique.mockResolvedValue(UNPAID_DEPOSIT);
    mockPrisma.deposit.findMany.mockResolvedValue([]);
    mockPrisma.reservation.findUnique.mockResolvedValue(null);
    mockPrisma.reservation.update.mockResolvedValue({});
    mockPrisma.reservationHistory.create.mockResolvedValue({});
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }]);
});
describe('DepositService', () => {
    // ══════════════════════════════════════════════════════════════
    // markAsPaid
    // ══════════════════════════════════════════════════════════════
    describe('markAsPaid()', () => {
        it('should mark full payment and set status PAID', async () => {
            // After raw SQL update, findUnique returns updated deposit
            mockPrisma.deposit.findUnique
                .mockResolvedValueOnce(UNPAID_DEPOSIT) // initial find
                .mockResolvedValueOnce({ ...PAID_DEPOSIT }); // after update
            const result = await depositService.markAsPaid('dep-uuid-001', {
                paymentMethod: 'TRANSFER',
                paidAt: '2026-05-15T10:00:00.000Z',
            }, TEST_USER_ID);
            expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
            const sql = mockPrisma.$queryRawUnsafe.mock.calls[0];
            expect(sql[1]).toBe(true); // isPaid = true
            expect(sql[2]).toBe('PAID'); // status
            expect(result).toBeDefined();
        });
        it('should handle partial payment and set status PARTIALLY_PAID', async () => {
            mockPrisma.deposit.findUnique
                .mockResolvedValueOnce(UNPAID_DEPOSIT)
                .mockResolvedValueOnce({ ...UNPAID_DEPOSIT, status: 'PARTIALLY_PAID', paidAmount: '1000', remainingAmount: '1000' });
            await depositService.markAsPaid('dep-uuid-001', {
                paymentMethod: 'CASH',
                paidAt: '2026-05-15T10:00:00.000Z',
                amountPaid: 1000, // partial: 1000 out of 2000
            }, TEST_USER_ID);
            const sql = mockPrisma.$queryRawUnsafe.mock.calls[0];
            expect(sql[1]).toBe(false); // isPaid = false (partial)
            expect(sql[2]).toBe('PARTIALLY_PAID'); // status
            expect(sql[5]).toBe(1000); // remainingAmount
            expect(sql[6]).toBe(1000); // amountPaid
        });
        it('should throw when already paid', async () => {
            mockPrisma.deposit.findUnique.mockResolvedValue(PAID_DEPOSIT);
            await expect(depositService.markAsPaid('dep-uuid-002', {
                paymentMethod: 'CASH',
                paidAt: '2026-05-15',
            }, TEST_USER_ID)).rejects.toThrow(/juz oznaczona/);
        });
        it('should throw when deposit not found', async () => {
            mockPrisma.deposit.findUnique.mockResolvedValue(null);
            await expect(depositService.markAsPaid('nonexistent', {
                paymentMethod: 'CASH',
                paidAt: '2026-05-15',
            }, TEST_USER_ID)).rejects.toThrow();
        });
        it('should call logChange with MARK_PAID action', async () => {
            mockPrisma.deposit.findUnique
                .mockResolvedValueOnce(UNPAID_DEPOSIT)
                .mockResolvedValueOnce(PAID_DEPOSIT);
            await depositService.markAsPaid('dep-uuid-001', {
                paymentMethod: 'BLIK',
                paidAt: '2026-05-15',
            }, TEST_USER_ID);
            expect(logChange).toHaveBeenCalledWith(expect.objectContaining({
                action: 'MARK_PAID',
                entityType: 'DEPOSIT',
            }));
        });
    });
    // ══════════════════════════════════════════════════════════════
    // checkAndAutoConfirmReservation
    // ══════════════════════════════════════════════════════════════
    describe('checkAndAutoConfirmReservation()', () => {
        it('should auto-confirm PENDING reservation when all deposits paid', async () => {
            mockPrisma.reservation.findUnique.mockResolvedValue({
                id: 'res-uuid-001',
                status: 'PENDING',
                deposits: [
                    { id: 'd1', status: 'PAID', amount: '3000' },
                    { id: 'd2', status: 'PAID', amount: '2000' },
                ],
                client: { firstName: 'Jan', lastName: 'Kowalski' },
            });
            await depositService.checkAndAutoConfirmReservation('res-uuid-001', TEST_USER_ID);
            expect(mockPrisma.reservation.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: 'CONFIRMED' },
            }));
            expect(mockPrisma.reservationHistory.create).toHaveBeenCalledTimes(1);
        });
        it('should NOT confirm when not all deposits are paid', async () => {
            mockPrisma.reservation.findUnique.mockResolvedValue({
                id: 'res-uuid-001',
                status: 'PENDING',
                deposits: [
                    { id: 'd1', status: 'PAID', amount: '3000' },
                    { id: 'd2', status: 'PENDING', amount: '2000' },
                ],
                client: { firstName: 'Jan', lastName: 'Kowalski' },
            });
            await depositService.checkAndAutoConfirmReservation('res-uuid-001', TEST_USER_ID);
            expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
        });
        it('should NOT confirm when reservation is not PENDING', async () => {
            mockPrisma.reservation.findUnique.mockResolvedValue({
                id: 'res-uuid-001',
                status: 'CONFIRMED', // already confirmed
                deposits: [
                    { id: 'd1', status: 'PAID', amount: '5000' },
                ],
                client: { firstName: 'Jan', lastName: 'Kowalski' },
            });
            await depositService.checkAndAutoConfirmReservation('res-uuid-001', TEST_USER_ID);
            expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
        });
        it('should NOT confirm when no active deposits', async () => {
            mockPrisma.reservation.findUnique.mockResolvedValue({
                id: 'res-uuid-001',
                status: 'PENDING',
                deposits: [
                    { id: 'd1', status: 'CANCELLED', amount: '2000' },
                ],
                client: { firstName: 'Jan', lastName: 'Kowalski' },
            });
            await depositService.checkAndAutoConfirmReservation('res-uuid-001', TEST_USER_ID);
            expect(mockPrisma.reservation.update).not.toHaveBeenCalled();
        });
    });
    // ══════════════════════════════════════════════════════════════
    // markAsUnpaid
    // ══════════════════════════════════════════════════════════════
    describe('markAsUnpaid()', () => {
        it('should reset paid deposit to PENDING via raw SQL', async () => {
            mockPrisma.deposit.findUnique
                .mockResolvedValueOnce(PAID_DEPOSIT)
                .mockResolvedValueOnce({ ...UNPAID_DEPOSIT });
            const result = await depositService.markAsUnpaid('dep-uuid-002', TEST_USER_ID);
            expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
            const sql = mockPrisma.$queryRawUnsafe.mock.calls[0][0];
            expect(sql).toContain('PENDING');
            expect(result).toBeDefined();
        });
        it('should throw when deposit not found', async () => {
            mockPrisma.deposit.findUnique.mockResolvedValue(null);
            await expect(depositService.markAsUnpaid('nonexistent', TEST_USER_ID)).rejects.toThrow();
        });
        it('should throw when deposit is already PENDING and not paid', async () => {
            mockPrisma.deposit.findUnique.mockResolvedValue(UNPAID_DEPOSIT);
            await expect(depositService.markAsUnpaid('dep-uuid-001', TEST_USER_ID))
                .rejects.toThrow(/nie jest oznaczona/);
        });
    });
    // ══════════════════════════════════════════════════════════════
    // cancel
    // ══════════════════════════════════════════════════════════════
    describe('cancel()', () => {
        it('should cancel deposit via raw SQL and set status CANCELLED', async () => {
            mockPrisma.deposit.findUnique
                .mockResolvedValueOnce(UNPAID_DEPOSIT)
                .mockResolvedValueOnce({ ...UNPAID_DEPOSIT, status: 'CANCELLED' });
            const result = await depositService.cancel('dep-uuid-001', TEST_USER_ID);
            expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
            const sql = mockPrisma.$queryRawUnsafe.mock.calls[0][0];
            expect(sql).toContain('CANCELLED');
            expect(result).toBeDefined();
        });
        it('should throw when deposit not found', async () => {
            mockPrisma.deposit.findUnique.mockResolvedValue(null);
            await expect(depositService.cancel('nonexistent', TEST_USER_ID)).rejects.toThrow();
        });
        it('should throw when deposit is paid', async () => {
            mockPrisma.deposit.findUnique.mockResolvedValue(PAID_DEPOSIT);
            await expect(depositService.cancel('dep-uuid-002', TEST_USER_ID))
                .rejects.toThrow(/oplaconej|platnosc/);
        });
    });
    // ══════════════════════════════════════════════════════════════
    // checkPaidDepositsBeforeCancel
    // ══════════════════════════════════════════════════════════════
    describe('checkPaidDepositsBeforeCancel()', () => {
        it('should return hasPaidDeposits true when paid deposits exist', async () => {
            mockPrisma.deposit.findMany.mockResolvedValue([
                { id: 'd1', amount: '3000', status: 'PAID' },
                { id: 'd2', amount: '2000', status: 'PAID' },
            ]);
            const result = await depositService.checkPaidDepositsBeforeCancel('res-uuid-001');
            expect(result.hasPaidDeposits).toBe(true);
            expect(result.paidCount).toBe(2);
            expect(result.paidTotal).toBe(5000);
        });
        it('should return hasPaidDeposits false when no paid deposits', async () => {
            mockPrisma.deposit.findMany.mockResolvedValue([]);
            const result = await depositService.checkPaidDepositsBeforeCancel('res-uuid-001');
            expect(result.hasPaidDeposits).toBe(false);
            expect(result.paidCount).toBe(0);
            expect(result.paidTotal).toBe(0);
        });
    });
    // ══════════════════════════════════════════════════════════════
    // autoMarkOverdue
    // ══════════════════════════════════════════════════════════════
    describe('autoMarkOverdue()', () => {
        it('should execute raw SQL and return count', async () => {
            mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 3 }]);
            const result = await depositService.autoMarkOverdue();
            expect(result.markedOverdueCount).toBe(3);
            expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
            const sql = mockPrisma.$queryRawUnsafe.mock.calls[0][0];
            expect(sql).toContain('OVERDUE');
        });
    });
});
//# sourceMappingURL=deposit.service.business.test.js.map