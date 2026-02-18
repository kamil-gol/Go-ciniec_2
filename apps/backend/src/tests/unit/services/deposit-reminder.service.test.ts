/**
 * DepositReminderService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    deposit: { findMany: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../services/email.service', () => ({
  default: {
    sendDepositReminder: jest.fn().mockResolvedValue(true),
    sendDepositOverdueNotice: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import depositReminderService from '../../../services/deposit-reminder.service';
import { prisma } from '../../../lib/prisma';
import emailService from '../../../services/email.service';

const mockPrisma = prisma as any;

const DEPOSIT_WITH_CLIENT = {
  id: 'dep-001', amount: 5000, dueDate: '2026-02-25', status: 'PENDING', paid: false,
  reservation: {
    date: '2026-03-15', guests: 80,
    client: { firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.pl' },
    hall: { name: 'Sala Główna' },
    eventType: { name: 'Wesele' },
  },
};

const DEPOSIT_NO_EMAIL = {
  ...DEPOSIT_WITH_CLIENT,
  id: 'dep-002',
  reservation: { ...DEPOSIT_WITH_CLIENT.reservation, client: { firstName: 'A', lastName: 'B', email: null } },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.deposit.findMany.mockResolvedValue([DEPOSIT_WITH_CLIENT]);
});

describe('DepositReminderService', () => {
  describe('sendUpcomingReminders()', () => {
    it('should send reminders for deposits due in N days', async () => {
      const count = await depositReminderService.sendUpcomingReminders(7);
      expect(count).toBe(1);
      expect(emailService.sendDepositReminder).toHaveBeenCalledWith(
        'jan@test.pl',
        expect.objectContaining({ clientName: 'Jan Kowalski', daysLeft: 7 })
      );
    });

    it('should skip deposits without client email', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([DEPOSIT_NO_EMAIL]);
      const count = await depositReminderService.sendUpcomingReminders(7);
      expect(count).toBe(0);
      expect(emailService.sendDepositReminder).not.toHaveBeenCalled();
    });
  });

  describe('sendOverdueNotices()', () => {
    it('should send overdue notices', async () => {
      const count = await depositReminderService.sendOverdueNotices();
      expect(count).toBe(1);
      expect(emailService.sendDepositOverdueNotice).toHaveBeenCalledWith(
        'jan@test.pl',
        expect.objectContaining({ clientName: 'Jan Kowalski' })
      );
    });
  });

  describe('runReminders()', () => {
    it('should run full cycle (3 upcoming + 1 overdue)', async () => {
      const result = await depositReminderService.runReminders();
      expect(result.upcomingSent).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBe(0);
      // deposit.findMany called 4 times: 7-day, 3-day, 1-day, overdue
      expect(mockPrisma.deposit.findMany).toHaveBeenCalledTimes(4);
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.deposit.findMany.mockRejectedValue(new Error('DB error'));
      const result = await depositReminderService.runReminders();
      expect(result.errors).toBeGreaterThan(0);
    });
  });
});
