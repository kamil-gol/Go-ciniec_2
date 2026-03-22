// apps/backend/src/services/reports/revenue-grouping.ts

/**
 * Revenue grouping functions extracted from ReportsService.
 */

import { prisma } from '@/lib/prisma';
import type {
  RevenueBreakdownItem,
  RevenueByHallItem,
  RevenueByEventTypeItem,
  GroupByPeriod,
} from '@/types/reports.types';
import { getReservationDate } from './report-helpers';

export function groupRevenueByDay(reservations: any[]): RevenueBreakdownItem[] {
  const grouped = new Map<string, { revenue: number; count: number }>();
  reservations.forEach(r => {
    const period = getReservationDate(r);
    const existing = grouped.get(period) || { revenue: 0, count: 0 };
    grouped.set(period, {
      revenue: existing.revenue + Number(r.totalPrice || 0),
      count: existing.count + 1,
    });
  });
  return Array.from(grouped.entries())
    .map(([period, data]) => ({
      period,
      revenue: Math.round(data.revenue * 100) / 100,
      count: data.count,
      avgRevenue: Math.round((data.revenue / data.count) * 100) / 100,
    }));
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function groupRevenueByPeriod(
  reservations: any[],
  groupBy: GroupByPeriod
): RevenueBreakdownItem[] {
  const grouped = new Map<string, { revenue: number; count: number }>();
  reservations.forEach(r => {
    const dateStr = getReservationDate(r);
    if (!dateStr) return;
    const date = new Date(dateStr);
    let period: string;
    switch (groupBy) {
      case 'day':
        period = dateStr;
        break;
      case 'week':
        const weekNum = getWeekNumber(date);
        period = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        break;
      case 'month':
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        period = `${date.getFullYear()}`;
        break;
    }
    const existing = grouped.get(period) || { revenue: 0, count: 0 };
    grouped.set(period, {
      revenue: existing.revenue + Number(r.totalPrice || 0),
      count: existing.count + 1,
    });
  });
  return Array.from(grouped.entries())
    .map(([period, data]) => ({
      period,
      revenue: Math.round(data.revenue * 100) / 100,
      count: data.count,
      avgRevenue: Math.round((data.revenue / data.count) * 100) / 100,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function groupRevenueByHall(reservations: any[]): RevenueByHallItem[] {
  const grouped = new Map<string, { name: string; revenue: number; count: number }>();
  reservations.forEach(r => {
    if (!r.hall) return;
    const existing = grouped.get(r.hall.id) || { name: r.hall.name, revenue: 0, count: 0 };
    grouped.set(r.hall.id, {
      name: r.hall.name,
      revenue: existing.revenue + Number(r.totalPrice || 0),
      count: existing.count + 1,
    });
  });
  return Array.from(grouped.entries())
    .map(([hallId, data]) => ({
      hallId,
      hallName: data.name,
      revenue: Math.round(data.revenue * 100) / 100,
      count: data.count,
      avgRevenue: Math.round((data.revenue / data.count) * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function groupRevenueByEventType(reservations: any[]): RevenueByEventTypeItem[] {
  const grouped = new Map<string, { name: string; revenue: number; count: number }>();
  reservations.forEach(r => {
    if (!r.eventType) return;
    const existing = grouped.get(r.eventType.id) || {
      name: r.eventType.name,
      revenue: 0,
      count: 0,
    };
    grouped.set(r.eventType.id, {
      name: r.eventType.name,
      revenue: existing.revenue + Number(r.totalPrice || 0),
      count: existing.count + 1,
    });
  });
  return Array.from(grouped.entries())
    .map(([eventTypeId, data]) => ({
      eventTypeId,
      eventTypeName: data.name,
      revenue: Math.round(data.revenue * 100) / 100,
      count: data.count,
      avgRevenue: Math.round((data.revenue / data.count) * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getPreviousPeriodRevenue(
  dateFrom: string,
  dateTo: string,
  whereClause: any
): Promise<number> {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const periodDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - periodDays);
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);

  const prevFromStr = prevFrom.toISOString().split('T')[0];
  const prevToStr = prevTo.toISOString().split('T')[0];
  const prevFromDT = new Date(`${prevFromStr}T00:00:00`);
  const prevToDT = new Date(`${prevToStr}T23:59:59`);

  // Build clean where without OR from parent (replace date range)
  const { OR: _or, ...restWhere } = whereClause;
  const result = await prisma.reservation.aggregate({
    _sum: { totalPrice: true },
    where: {
      ...restWhere,
      OR: [
        { date: { not: null, gte: prevFromStr, lte: prevToStr } },
        { startDateTime: { not: null, gte: prevFromDT, lte: prevToDT } },
      ],
    },
  });

  return Number(result._sum.totalPrice || 0);
}
