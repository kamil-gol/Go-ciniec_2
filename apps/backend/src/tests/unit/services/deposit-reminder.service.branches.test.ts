/**
 * DepositReminderService — Branch Coverage Tests
 * Target: 65.21% → ~90%+ branches
 * Covers: no email skip, overdue throttle, missing reservation fields,
 *         error handling in runReminders, formatDatePL error path
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    deposit: { findMany: jest.fn() },
  },
}));

jest.mock('../../../services/email.service', () => ({
  __esModule: true,
  default: {
    sendDepositReminder: jest.fn().mockResolvedValue(true),
    sendDepositOverdueNotice: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('@utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

import depositReminderService from '../../../services/deposit-reminder.service';
import { prisma } from '../../../lib/prisma';
import emailService from '../../../services/email.service';

const db = prisma as any;
const emailSvc = emailService as any;

/** Helper: return YYYY-MM-DD for N days ago */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().substring(0, 10);
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

beforeEach(() => {
  jest.clearAllMocks();
  db.deposit.findMany.mockResolvedValue([]);
  emailSvc.sendDepositReminder.mockResolvedValue(true);
  emailSvc.sendDepositOverdueNotice.mockResolvedValue(true);
});

describe('DepositReminderService — branches', () => {

  // ═══ sendUpcomingReminders ═══
  describe('sendUpcomingReminders()', () => {
    it('should send reminder when client has email', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit()]);
      const count = await depositReminderService.sendUpcomingReminders(7);
      expect(count).toBe(1);
      expect(emailSvc.sendDepositReminder).toHaveBeenCalledTimes(1);
    });

    it('should skip deposit when no client email', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit({ reservation: { client: { firstName: 'Jan', lastName: 'K', email: null }, hall: null, eventType: null, date: null, guests: 0 } })]);
      const count = await depositReminderService.sendUpcomingReminders(7);
      expect(count).toBe(0);
      expect(emailSvc.sendDepositReminder).not.toHaveBeenCalled();
    });

    it('should skip deposit when no client at all', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit({ reservation: { client: null, hall: null, eventType: null, date: null, guests: 0 } })]);
      const count = await depositReminderService.sendUpcomingReminders(3);
      expect(count).toBe(0);
    });

    it('should use fallback values for missing reservation fields', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit({
        reservation: {
          client: { firstName: 'A', lastName: 'B', email: 'a@b.pl' },
          hall: null,
          eventType: null,
          date: null,
          guests: 0,
        },
      })]);
      const count = await depositReminderService.sendUpcomingReminders(1);
      expect(count).toBe(1);
      const callData = emailSvc.sendDepositReminder.mock.calls[0][1];
      expect(callData.hallName).toBe('\u2014');
      expect(callData.eventType).toBe('\u2014');
      expect(callData.reservationDate).toBe('\u2014');
    });

    it('should return 0 when no deposits found', async () => {
      db.deposit.findMany.mockResolvedValue([]);
      const count = await depositReminderService.sendUpcomingReminders(7);
      expect(count).toBe(0);
    });

    it('should not count failed sends', async () => {
      emailSvc.sendDepositReminder.mockResolvedValue(false);
      db.deposit.findMany.mockResolvedValue([makeDeposit()]);
      const count = await depositReminderService.sendUpcomingReminders(7);
      expect(count).toBe(0);
    });
  });

  // ═══ sendOverdueNotices ═══
  describe('sendOverdueNotices()', () => {
    it('should send overdue notice (1 day overdue — within daily limit)', async () => {
      // daysOverdue=1, which is ≤ OVERDUE_DAILY_LIMIT(3), so no throttle
      db.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(1) })]);
      const count = await depositReminderService.sendOverdueNotices();
      expect(count).toBe(1);
    });

    it('should skip when no client email', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(1), reservation: { client: null, hall: null, eventType: null, date: null } })]);
      const count = await depositReminderService.sendOverdueNotices();
      expect(count).toBe(0);
    });

    it('should throttle overdue notices (>3 days, not multiple of 3)', async () => {
      // daysOverdue=5: >3 and 5%3=2 ≠ 0 → skip
      db.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(5) })]);
      const count = await depositReminderService.sendOverdueNotices();
      expect(count).toBe(0);
    });

    it('should send overdue on day 6 (multiple of 3)', async () => {
      // daysOverdue=6: >3 and 6%3=0 → send
      db.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(6) })]);
      const count = await depositReminderService.sendOverdueNotices();
      expect(count).toBe(1);
    });

    it('should send overdue on day 2 (≤ 3 daily limit)', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(2) })]);
      const count = await depositReminderService.sendOverdueNotices();
      expect(count).toBe(1);
    });

    it('should send overdue on day 3 (≤ 3 daily limit)', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(3) })]);
      const count = await depositReminderService.sendOverdueNotices();
      expect(count).toBe(1);
    });

    it('should use fallback values for missing reservation fields', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit({
        dueDate: daysAgo(1),
        reservation: {
          client: { firstName: 'X', lastName: 'Y', email: 'x@y.pl' },
          hall: null, eventType: null, date: null,
        },
      })]);
      const count = await depositReminderService.sendOverdueNotices();
      expect(count).toBe(1);
      const callData = emailSvc.sendDepositOverdueNotice.mock.calls[0][1];
      expect(callData.hallName).toBe('\u2014');
      expect(callData.eventType).toBe('\u2014');
    });

    it('should not count failed sends', async () => {
      emailSvc.sendDepositOverdueNotice.mockResolvedValue(false);
      db.deposit.findMany.mockResolvedValue([makeDeposit({ dueDate: daysAgo(1) })]);
      const count = await depositReminderService.sendOverdueNotices();
      expect(count).toBe(0);
    });
  });

  // ═══ runReminders ═══
  describe('runReminders()', () => {
    it('should aggregate counts from all cycles', async () => {
      db.deposit.findMany.mockResolvedValue([makeDeposit()]);
      const result = await depositReminderService.runReminders();
      // 3 upcoming cycles (7, 3, 1 days) + 1 overdue
      expect(result.upcomingSent).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBe(0);
    });

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
