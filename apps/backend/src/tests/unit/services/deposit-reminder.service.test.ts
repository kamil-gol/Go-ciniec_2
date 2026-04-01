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
import { formatDateISO, subtractDays } from '@utils/date.utils';

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

const createMockDeposit = (overrides: any = {}) => ({
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
      const yesterday = subtractDays(new Date(), 1);
      const yesterdayStr = formatDateISO(yesterday);

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
      expect(mockEmailService.sendDepositReminder).toHaveBeenCalledWith(
        'anna@test.pl',
        expect.objectContaining({
          clientName: 'Anna Nowak',
          daysLeft: 7,
          hallName: 'Sala Główna',
          eventType: 'Wesele',
        })
      );
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

      expect(mockPrisma.deposit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['PENDING', 'PARTIALLY_PAID'] },
          }),
        })
      );
    });
  });

  // ═══════════════ sendOverdueNotices ═══════════════
  describe('sendOverdueNotices', () => {
    it('should send overdue notice for past-due deposits', async () => {
      const yesterday = subtractDays(new Date(), 1);
      const dep = createMockDeposit({ dueDate: formatDateISO(yesterday) });
      mockPrisma.deposit.findMany.mockResolvedValue([dep]);
      mockEmailService.sendDepositOverdueNotice.mockResolvedValue(true);

      const count = await depositReminderService.sendOverdueNotices();

      expect(count).toBe(1);
      expect(mockEmailService.sendDepositOverdueNotice).toHaveBeenCalledWith(
        'anna@test.pl',
        expect.objectContaining({
          clientName: 'Anna Nowak',
          daysOverdue: 1,
        })
      );
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
      const fiveDaysAgo = subtractDays(new Date(), 5);
      const dep = createMockDeposit({ dueDate: formatDateISO(fiveDaysAgo) });
      mockPrisma.deposit.findMany.mockResolvedValue([dep]);

      const count = await depositReminderService.sendOverdueNotices();

      expect(count).toBe(0);
      expect(mockEmailService.sendDepositOverdueNotice).not.toHaveBeenCalled();
    });

    it('should send on day 6 overdue (> daily limit, divisible by 3)', async () => {
      const sixDaysAgo = subtractDays(new Date(), 6);
      const dep = createMockDeposit({ dueDate: formatDateISO(sixDaysAgo) });
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

  describe('edge cases / branch coverage', () => {
    /** Helper: return YYYY-MM-DD for N days ago */
    function daysAgo(n: number): string {
      return formatDateISO(subtractDays(new Date(), n));
    }

    const makeDeposit = (overrides: any = {}) => ({
      id: 'dep-1',
      amount: 1000,
      dueDate: '2027-06-15',
      reservation: {
        client: { firstName: 'Jan', lastName: 'Kowalski', email: 'j@k.pl' },
        hall: { name: 'Sala A' },
        eventType: { name: 'Wesele' },
        date: '2027-08-15',
        guests: 50,
      },
      ...overrides,
    });

    describe('sendUpcomingReminders() — edge cases', () => {
      it('should skip deposit when no client at all', async () => {
        mockPrisma.deposit.findMany.mockResolvedValue([makeDeposit({ reservation: { client: null, hall: null, eventType: null, date: null, guests: 0 } })]);
        const count = await depositReminderService.sendUpcomingReminders(3);
        expect(count).toBe(0);
      });

      it('should use fallback values for missing reservation fields', async () => {
        mockPrisma.deposit.findMany.mockResolvedValue([makeDeposit({
          reservation: {
            client: { firstName: 'A', lastName: 'B', email: 'a@b.pl' },
            hall: null,
            eventType: null,
            date: null,
            guests: 0,
          },
        })]);
        mockEmailService.sendDepositReminder.mockResolvedValue(true);
        const count = await depositReminderService.sendUpcomingReminders(1);
        expect(count).toBe(1);
        const callData = mockEmailService.sendDepositReminder.mock.calls[0][1];
        expect(callData.hallName).toBe('\u2014');
        expect(callData.eventType).toBe('\u2014');
        expect(callData.reservationDate).toBe('\u2014');
      });

      it('should not count failed sends', async () => {
        mockEmailService.sendDepositReminder.mockResolvedValue(false);
        mockPrisma.deposit.findMany.mockResolvedValue([makeDeposit()]);
        const count = await depositReminderService.sendUpcomingReminders(7);
        expect(count).toBe(0);
      });
    });

    describe('sendOverdueNotices() — edge cases', () => {
      it('should send overdue on day 2 (within daily limit)', async () => {
        mockPrisma.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(2) })]);
        mockEmailService.sendDepositOverdueNotice.mockResolvedValue(true);
        const count = await depositReminderService.sendOverdueNotices();
        expect(count).toBe(1);
      });

      it('should send overdue on day 3 (within daily limit)', async () => {
        mockPrisma.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(3) })]);
        mockEmailService.sendDepositOverdueNotice.mockResolvedValue(true);
        const count = await depositReminderService.sendOverdueNotices();
        expect(count).toBe(1);
      });

      it('should use fallback values for missing reservation fields', async () => {
        mockPrisma.deposit.findMany.mockResolvedValue([makeDeposit({
          dueDate: daysAgo(1),
          reservation: {
            client: { firstName: 'X', lastName: 'Y', email: 'x@y.pl' },
            hall: null, eventType: null, date: null,
          },
        })]);
        mockEmailService.sendDepositOverdueNotice.mockResolvedValue(true);
        const count = await depositReminderService.sendOverdueNotices();
        expect(count).toBe(1);
        const callData = mockEmailService.sendDepositOverdueNotice.mock.calls[0][1];
        expect(callData.hallName).toBe('\u2014');
        expect(callData.eventType).toBe('\u2014');
      });

      it('should not count failed sends', async () => {
        mockEmailService.sendDepositOverdueNotice.mockResolvedValue(false);
        mockPrisma.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(1) })]);
        const count = await depositReminderService.sendOverdueNotices();
        expect(count).toBe(0);
      });
    });

    describe('runReminders() — error handling', () => {
      it('should count errors when sendUpcomingReminders throws', async () => {
        const origSend = depositReminderService.sendUpcomingReminders;
        depositReminderService.sendUpcomingReminders = jest.fn().mockRejectedValue(new Error('fail'));
        depositReminderService.sendOverdueNotices = jest.fn().mockResolvedValue(0);
        const result = await depositReminderService.runReminders();
        expect(result.errors).toBe(3); // 3 REMINDER_DAYS cycles
        depositReminderService.sendUpcomingReminders = origSend;
      });

      it('should count error when sendOverdueNotices throws', async () => {
        depositReminderService.sendUpcomingReminders = jest.fn().mockResolvedValue(0);
        const origOverdue = depositReminderService.sendOverdueNotices;
        depositReminderService.sendOverdueNotices = jest.fn().mockRejectedValue(new Error('fail'));
        const result = await depositReminderService.runReminders();
        expect(result.errors).toBe(1);
        depositReminderService.sendOverdueNotices = origOverdue;
      });
    });
  });
});
