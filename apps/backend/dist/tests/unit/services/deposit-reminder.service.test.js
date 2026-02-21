/**
 * Unit tests for deposit-reminder.service.ts
 * Covers: runReminders, sendUpcomingReminders, sendOverdueNotices
 * Issue: #97
 */
// ── Mocks ────────────────────────────────────────
const mockPrisma = {
    deposit: {
        findMany: jest.fn(),
    },
};
const mockEmailService = {
    sendDepositReminder: jest.fn(),
    sendDepositOverdueNotice: jest.fn(),
};
jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@services/email.service', () => ({
    __esModule: true,
    default: mockEmailService,
}));
jest.mock('@utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));
import depositReminderService from '@services/deposit-reminder.service';
// ── Fixtures ─────────────────────────────────────
const mockClient = {
    firstName: 'Anna',
    lastName: 'Nowak',
    email: 'anna@test.pl',
    phone: '+48 111 222 333',
};
const mockClientNoEmail = {
    firstName: 'Jan',
    lastName: 'Bezmaila',
    email: null,
    phone: '+48 999 888 777',
};
const createMockDeposit = (overrides = {}) => ({
    id: 'dep-1',
    amount: 2000,
    dueDate: '2026-05-01',
    status: 'PENDING',
    paid: false,
    reservation: {
        date: '2026-06-15',
        guests: 100,
        client: mockClient,
        hall: { name: 'Sala Główna' },
        eventType: { name: 'Wesele' },
    },
    ...overrides,
});
describe('DepositReminderService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    // ═══════════════ runReminders ═══════════════
    describe('runReminders', () => {
        it('should run upcoming (7,3,1 days) + overdue reminders', async () => {
            mockPrisma.deposit.findMany.mockResolvedValue([]);
            const result = await depositReminderService.runReminders();
            expect(mockPrisma.deposit.findMany).toHaveBeenCalledTimes(4);
            expect(result.upcomingSent).toBe(0);
            expect(result.overdueSent).toBe(0);
            expect(result.errors).toBe(0);
        });
        it('should count errors from failed reminder batches', async () => {
            mockPrisma.deposit.findMany.mockRejectedValue(new Error('DB down'));
            const result = await depositReminderService.runReminders();
            expect(result.errors).toBe(4);
            expect(result.upcomingSent).toBe(0);
            expect(result.overdueSent).toBe(0);
        });
        it('should aggregate sent counts from all reminder types', async () => {
            // Use yesterday's date so overdue throttle allows sending
            // (daysOverdue=1, within OVERDUE_DAILY_LIMIT=3)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().substring(0, 10);
            mockPrisma.deposit.findMany.mockResolvedValue([
                createMockDeposit({ dueDate: yesterdayStr }),
            ]);
            mockEmailService.sendDepositReminder.mockResolvedValue(true);
            mockEmailService.sendDepositOverdueNotice.mockResolvedValue(true);
            const result = await depositReminderService.runReminders();
            expect(result.upcomingSent).toBe(3);
            expect(result.overdueSent).toBe(1);
            expect(result.errors).toBe(0);
        });
    });
    // ═══════════════ sendUpcomingReminders ═══════════════
    describe('sendUpcomingReminders', () => {
        it('should send reminder emails for deposits due in N days', async () => {
            mockPrisma.deposit.findMany.mockResolvedValue([createMockDeposit()]);
            mockEmailService.sendDepositReminder.mockResolvedValue(true);
            const count = await depositReminderService.sendUpcomingReminders(7);
            expect(count).toBe(1);
            expect(mockEmailService.sendDepositReminder).toHaveBeenCalledWith('anna@test.pl', expect.objectContaining({
                clientName: 'Anna Nowak',
                daysLeft: 7,
                hallName: 'Sala Główna',
                eventType: 'Wesele',
            }));
        });
        it('should skip deposits without client email', async () => {
            mockPrisma.deposit.findMany.mockResolvedValue([
                createMockDeposit({ reservation: { ...createMockDeposit().reservation, client: mockClientNoEmail } }),
            ]);
            const count = await depositReminderService.sendUpcomingReminders(3);
            expect(count).toBe(0);
            expect(mockEmailService.sendDepositReminder).not.toHaveBeenCalled();
        });
        it('should return 0 when no deposits are due', async () => {
            mockPrisma.deposit.findMany.mockResolvedValue([]);
            const count = await depositReminderService.sendUpcomingReminders(1);
            expect(count).toBe(0);
        });
        it('should query deposits with correct status filter', async () => {
            mockPrisma.deposit.findMany.mockResolvedValue([]);
            await depositReminderService.sendUpcomingReminders(7);
            expect(mockPrisma.deposit.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: { in: ['PENDING', 'PARTIALLY_PAID'] },
                }),
            }));
        });
    });
    // ═══════════════ sendOverdueNotices ═══════════════
    describe('sendOverdueNotices', () => {
        it('should send overdue notice for past-due deposits', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dep = createMockDeposit({ dueDate: yesterday.toISOString().substring(0, 10) });
            mockPrisma.deposit.findMany.mockResolvedValue([dep]);
            mockEmailService.sendDepositOverdueNotice.mockResolvedValue(true);
            const count = await depositReminderService.sendOverdueNotices();
            expect(count).toBe(1);
            expect(mockEmailService.sendDepositOverdueNotice).toHaveBeenCalledWith('anna@test.pl', expect.objectContaining({
                clientName: 'Anna Nowak',
                daysOverdue: 1,
            }));
        });
        it('should skip deposits without client email', async () => {
            const dep = createMockDeposit({
                dueDate: '2026-01-01',
                reservation: { ...createMockDeposit().reservation, client: mockClientNoEmail },
            });
            mockPrisma.deposit.findMany.mockResolvedValue([dep]);
            const count = await depositReminderService.sendOverdueNotices();
            expect(count).toBe(0);
            expect(mockEmailService.sendDepositOverdueNotice).not.toHaveBeenCalled();
        });
        it('should throttle: skip day 5 overdue (> daily limit, not divisible by 3)', async () => {
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            const dep = createMockDeposit({ dueDate: fiveDaysAgo.toISOString().substring(0, 10) });
            mockPrisma.deposit.findMany.mockResolvedValue([dep]);
            const count = await depositReminderService.sendOverdueNotices();
            expect(count).toBe(0);
            expect(mockEmailService.sendDepositOverdueNotice).not.toHaveBeenCalled();
        });
        it('should send on day 6 overdue (> daily limit, divisible by 3)', async () => {
            const sixDaysAgo = new Date();
            sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
            const dep = createMockDeposit({ dueDate: sixDaysAgo.toISOString().substring(0, 10) });
            mockPrisma.deposit.findMany.mockResolvedValue([dep]);
            mockEmailService.sendDepositOverdueNotice.mockResolvedValue(true);
            const count = await depositReminderService.sendOverdueNotices();
            expect(count).toBe(1);
        });
        it('should return 0 when no overdue deposits exist', async () => {
            mockPrisma.deposit.findMany.mockResolvedValue([]);
            const count = await depositReminderService.sendOverdueNotices();
            expect(count).toBe(0);
        });
    });
});
//# sourceMappingURL=deposit-reminder.service.test.js.map