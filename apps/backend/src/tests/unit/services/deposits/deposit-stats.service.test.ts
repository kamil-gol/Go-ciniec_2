/**
 * Unit tests for deposits/deposit-stats.service.ts
 * Covers: getStats, getOverdue, autoMarkOverdue, getDatePlusDays
 */

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    deposit: { findMany: jest.fn() },
  },
}));

jest.mock('../../../../services/notification.service', () => ({
  __esModule: true,
  default: {
    createForAll: jest.fn().mockResolvedValue(undefined),
  },
}));

import { depositStatsService, getDatePlusDays } from '../../../../services/deposits/deposit-stats.service';
import { prisma } from '../../../../lib/prisma';
import notificationService from '../../../../services/notification.service';

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// getDatePlusDays
// ===============================================================

describe('getDatePlusDays', () => {
  it('returns date string N days from now', () => {
    const result = getDatePlusDays(7);
    // Should be YYYY-MM-DD format
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today for 0 days', () => {
    const today = new Date().toISOString().substring(0, 10);
    expect(getDatePlusDays(0)).toBe(today);
  });
});

// ===============================================================
// getStats
// ===============================================================

describe('getStats', () => {
  it('returns formatted stats from raw query', async () => {
    db.$queryRaw.mockResolvedValue([{
      total: 10,
      pending: 3,
      paid: 5,
      overdue: 1,
      partiallyPaid: 1,
      cancelled: 2,
      upcomingIn7Days: 2,
      totalAmount: '15000.00',
      paidAmountSum: '8000.00',
      overdueAmount: '2000.00',
    }]);

    const result = await depositStatsService.getStats();

    expect(result.counts.total).toBe(10);
    expect(result.counts.pending).toBe(3);
    expect(result.counts.paid).toBe(5);
    expect(result.amounts.total).toBe(15000);
    expect(result.amounts.paid).toBe(8000);
    expect(result.amounts.pending).toBe(7000);
    expect(result.amounts.overdue).toBe(2000);
  });

  it('handles empty result', async () => {
    db.$queryRaw.mockResolvedValue([{}]);

    const result = await depositStatsService.getStats();

    expect(result.counts.total).toBe(0);
    expect(result.amounts.total).toBe(0);
  });
});

// ===============================================================
// getOverdue
// ===============================================================

describe('getOverdue', () => {
  it('returns overdue deposits', async () => {
    const deposits = [{ id: 'd1', status: 'PENDING', dueDate: '2026-01-01' }];
    db.deposit.findMany.mockResolvedValue(deposits);

    const result = await depositStatsService.getOverdue();

    expect(result).toEqual(deposits);
    expect(db.deposit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { equals: 'PENDING' }, dueDate: { lt: expect.any(String) } },
        orderBy: { dueDate: 'asc' },
      }),
    );
  });
});

// ===============================================================
// autoMarkOverdue
// ===============================================================

describe('autoMarkOverdue', () => {
  it('marks overdue and sends notification', async () => {
    db.$queryRaw.mockResolvedValue([{ count: 3 }]);

    const result = await depositStatsService.autoMarkOverdue();

    expect(result.markedOverdueCount).toBe(3);
    expect(notificationService.createForAll).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DEPOSIT_OVERDUE',
        entityType: 'DEPOSIT',
      }),
    );
  });

  it('does not send notification when nothing marked', async () => {
    db.$queryRaw.mockResolvedValue([{ count: 0 }]);

    const result = await depositStatsService.autoMarkOverdue();

    expect(result.markedOverdueCount).toBe(0);
    expect(notificationService.createForAll).not.toHaveBeenCalled();
  });
});
