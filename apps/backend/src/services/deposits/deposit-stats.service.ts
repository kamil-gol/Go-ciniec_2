/**
 * Deposit Stats & Overdue Service
 * Extracted from deposit.service.ts — stats aggregation, overdue queries
 */

import { prisma } from '../../lib/prisma';
import notificationService from '../notification.service';

/** Raw row shape returned by getStats $queryRaw */
export interface DepositStatsRow {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  partiallyPaid: number;
  cancelled: number;
  upcomingIn7Days: number;
  totalAmount: number | string;
  paidAmountSum: number | string;
  overdueAmount: number | string;
}

/** Raw row shape returned by autoMarkOverdue $queryRaw */
export interface CountRow {
  count: number;
}

export function getDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

export const depositStatsService = {
  async getStats() {
    const todayStr = new Date().toISOString().substring(0, 10);

    const futureStr = getDatePlusDays(7);
    const stats: DepositStatsRow[] = await prisma.$queryRaw<DepositStatsRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('PENDING','PAID','OVERDUE','PARTIALLY_PAID'))::int as total,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending,
        COUNT(*) FILTER (WHERE status = 'PAID')::int as paid,
        COUNT(*) FILTER (WHERE status = 'OVERDUE')::int as overdue,
        COUNT(*) FILTER (WHERE status = 'PARTIALLY_PAID')::int as "partiallyPaid",
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int as cancelled,
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" >= ${todayStr} AND "dueDate" <= ${futureStr})::int as "upcomingIn7Days",
        COALESCE(SUM(amount) FILTER (WHERE status IN ('PENDING','PAID','OVERDUE','PARTIALLY_PAID')), 0)::numeric as "totalAmount",
        COALESCE(SUM(amount) FILTER (WHERE paid = true), 0)::numeric as "paidAmountSum",
        COALESCE(SUM(amount) FILTER (WHERE status = 'OVERDUE'), 0)::numeric as "overdueAmount"
      FROM "Deposit"`;

    const row = stats[0] || {};
    const totalAmt = Number(row.totalAmount || 0);
    const paidAmt = Number(row.paidAmountSum || 0);

    return {
      counts: {
        total: Number(row.total || 0),
        pending: Number(row.pending || 0),
        paid: Number(row.paid || 0),
        overdue: Number(row.overdue || 0),
        partiallyPaid: Number(row.partiallyPaid || 0),
        cancelled: Number(row.cancelled || 0),
        upcomingIn7Days: Number(row.upcomingIn7Days || 0),
      },
      amounts: {
        total: Number(totalAmt.toFixed(2)),
        paid: Number(paidAmt.toFixed(2)),
        pending: Number((totalAmt - paidAmt).toFixed(2)),
        overdue: Number(Number(row.overdueAmount || 0).toFixed(2)),
      },
    };
  },

  async getOverdue() {
    const todayStr = new Date().toISOString().substring(0, 10);

    const deposits = await prisma.deposit.findMany({
      where: {
        status: { equals: 'PENDING' },
        dueDate: { lt: todayStr },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        reservation: {
          include: {
            client: true,
            hall: true,
            eventType: true,
          },
        },
      },
    });

    return deposits;
  },

  async autoMarkOverdue() {
    const todayStr = new Date().toISOString().substring(0, 10);

    const result: CountRow[] = await prisma.$queryRaw<CountRow[]>`
      WITH updated AS (
        UPDATE "Deposit" SET status = 'OVERDUE', "updatedAt" = NOW()
        WHERE status = 'PENDING' AND paid = false AND "dueDate" < ${todayStr}
        RETURNING id
      ) SELECT count(*)::int as count FROM updated`;

    const count = Number(result[0]?.count || 0);

    // #128: Notification — overdue deposits
    if (count > 0) {
      notificationService.createForAll({
        type: 'DEPOSIT_OVERDUE',
        title: 'Przeterminowane zaliczki',
        message: `${count} ${count === 1 ? 'zaliczka przekroczy\u0142a' : 'zaliczek przekroczy\u0142o'} termin p\u0142atno\u015bci`,
        entityType: 'DEPOSIT',
      });
    }

    return { markedOverdueCount: count };
  },
};
