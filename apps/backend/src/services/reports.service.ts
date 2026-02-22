// apps/backend/src/services/reports.service.ts

/**
 * Reports Service
 * Business logic for revenue, occupancy, and other reports
 * Updated: extras revenue tracking in revenue reports
 * 🇵🇱 Spolonizowany — polskie nazwy dni tygodnia
 */

import { prisma } from '@/lib/prisma';
import type {
  RevenueReportFilters,
  RevenueReport,
  RevenueBreakdownItem,
  RevenueByHallItem,
  RevenueByEventTypeItem,
  GroupByPeriod,
  OccupancyReportFilters,
  OccupancyReport,
  OccupancyByHallItem,
  PeakHourItem,
  PeakDayOfWeekItem,
} from '@/types/reports.types';

/**
 * Calculate extras revenue for a single reservation from its extras.
 * Supports FLAT (price × qty), PER_PERSON (price × qty × guests), FREE (0).
 */
function calculateExtrasRevenue(
  extras: Array<{ quantity: number; unitPrice: number | null; totalPrice: number | null; serviceItem: { basePrice: number; priceType: string; name: string; id: string } }>,
  guests: number
): { total: number; items: Array<{ serviceItemId: string; name: string; revenue: number }> } {
  let total = 0;
  const items: Array<{ serviceItemId: string; name: string; revenue: number }> = [];

  for (const extra of extras) {
    // Prefer pre-calculated totalPrice, then compute from unitPrice
    let revenue = 0;
    if (extra.totalPrice !== null && extra.totalPrice !== undefined) {
      revenue = Number(extra.totalPrice);
    } else {
      const price = extra.unitPrice !== null ? Number(extra.unitPrice) : Number(extra.serviceItem.basePrice);
      const qty = extra.quantity || 1;

      if (extra.serviceItem.priceType === 'PER_PERSON') {
        revenue = price * qty * guests;
      } else if (extra.serviceItem.priceType === 'FREE') {
        revenue = 0;
      } else {
        // FLAT
        revenue = price * qty;
      }
    }

    revenue = Math.round(revenue * 100) / 100;
    total += revenue;
    items.push({ serviceItemId: extra.serviceItem.id, name: extra.serviceItem.name, revenue });
  }

  return { total: Math.round(total * 100) / 100, items };
}

class ReportsService {
  // ============================================
  // REVENUE REPORTS
  // ============================================

  /**
   * Get comprehensive revenue report with breakdown
   * Now includes extras revenue tracking
   */
  async getRevenueReport(filters: RevenueReportFilters): Promise<RevenueReport> {
    const {
      dateFrom,
      dateTo,
      groupBy = 'month',
      hallId,
      eventTypeId,
      status,
    } = filters;

    // Build where clause
    const whereClause: any = {
      date: { gte: dateFrom, lte: dateTo },
      status: { not: 'CANCELLED' },
    };

    if (hallId) whereClause.hallId = hallId;
    if (eventTypeId) whereClause.eventTypeId = eventTypeId;
    if (status) whereClause.status = status;

    // Parallel queries for performance
    const [
      reservations,
      completedReservations,
      previousPeriodRevenue,
    ] = await Promise.all([
      // All reservations in period — now with extras
      prisma.reservation.findMany({
        where: whereClause,
        select: {
          id: true,
          date: true,
          startTime: true,
          totalPrice: true,
          status: true,
          guests: true,
          hall: { select: { id: true, name: true } },
          eventType: { select: { id: true, name: true } },
          extras: {
            include: {
              serviceItem: {
                select: { id: true, name: true, basePrice: true, priceType: true }
              }
            }
          },
        },
        orderBy: { date: 'asc' },
      }),

      // Completed reservations count
      prisma.reservation.count({
        where: { ...whereClause, status: 'COMPLETED' },
      }),

      // Previous period revenue for growth calculation
      this.getPreviousPeriodRevenue(dateFrom, dateTo, whereClause),
    ]);

    // Calculate summary
    const totalRevenue = reservations.reduce(
      (sum, r) => sum + Number(r.totalPrice || 0),
      0
    );
    const totalReservations = reservations.length;
    const avgRevenuePerReservation = totalReservations > 0
      ? totalRevenue / totalReservations
      : 0;

    // Calculate extras revenue
    let totalExtrasRevenue = 0;
    const serviceItemRevenueMap = new Map<string, { name: string; revenue: number; count: number }>();

    for (const r of reservations) {
      const extras = (r as any).extras || [];
      if (extras.length === 0) continue;

      const extrasCalc = calculateExtrasRevenue(extras, r.guests || 0);
      totalExtrasRevenue += extrasCalc.total;

      for (const item of extrasCalc.items) {
        const existing = serviceItemRevenueMap.get(item.serviceItemId) || { name: item.name, revenue: 0, count: 0 };
        existing.revenue += item.revenue;
        existing.count += 1;
        serviceItemRevenueMap.set(item.serviceItemId, existing);
      }
    }

    // Build byServiceItem ranking
    const byServiceItem = Array.from(serviceItemRevenueMap.entries())
      .map(([serviceItemId, data]) => ({
        serviceItemId,
        name: data.name,
        revenue: Math.round(data.revenue * 100) / 100,
        count: data.count,
        avgRevenue: data.count > 0 ? Math.round((data.revenue / data.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Find max revenue day
    const revenueByDay = this.groupRevenueByDay(reservations);
    const maxRevenueDay = revenueByDay.sort((a, b) => b.revenue - a.revenue)[0];

    // Completed vs pending revenue
    const completedRevenue = reservations
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + Number(r.totalPrice || 0), 0);
    const pendingRevenue = totalRevenue - completedRevenue;

    // Growth % vs previous period
    const growthPercent = previousPeriodRevenue > 0
      ? Math.round(((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100)
      : 0;

    // Breakdown by period
    const breakdown = this.groupRevenueByPeriod(reservations, groupBy);

    // Revenue by hall
    const byHall = this.groupRevenueByHall(reservations);

    // Revenue by event type
    const byEventType = this.groupRevenueByEventType(reservations);

    return {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgRevenuePerReservation: Math.round(avgRevenuePerReservation * 100) / 100,
        /* istanbul ignore next -- null when no reservations in period */
        maxRevenueDay: maxRevenueDay?.period || null,
        /* istanbul ignore next */
        maxRevenueDayAmount: Math.round((maxRevenueDay?.revenue || 0) * 100) / 100,
        growthPercent,
        totalReservations,
        completedReservations,
        pendingRevenue: Math.round(pendingRevenue * 100) / 100,
        extrasRevenue: Math.round(totalExtrasRevenue * 100) / 100,
      },
      breakdown,
      byHall,
      byEventType,
      byServiceItem,
      filters,
    } as any;
  }

  /**
   * Get revenue for previous period (for growth calculation)
   */
  private async getPreviousPeriodRevenue(
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

    const result = await prisma.reservation.aggregate({
      _sum: { totalPrice: true },
      where: {
        ...whereClause,
        date: { gte: prevFromStr, lte: prevToStr },
      },
    });

    return Number(result._sum.totalPrice || 0);
  }

  /**
   * Group revenue by day (for finding max revenue day)
   */
  private groupRevenueByDay(reservations: any[]): RevenueBreakdownItem[] {
    const grouped = new Map<string, { revenue: number; count: number }>();

    reservations.forEach(r => {
      const period = r.date; // "2026-02-16"
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

  /**
   * Group revenue by period (day/week/month/year)
   */
  private groupRevenueByPeriod(
    reservations: any[],
    groupBy: GroupByPeriod
  ): RevenueBreakdownItem[] {
    const grouped = new Map<string, { revenue: number; count: number }>();

    reservations.forEach(r => {
      const date = new Date(r.date);
      let period: string;

      switch (groupBy) {
        case 'day':
          period = r.date; // "2026-02-16"
          break;
        case 'week':
          const weekNum = this.getWeekNumber(date);
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

  /**
   * Get ISO week number (1-53)
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Group revenue by hall
   */
  private groupRevenueByHall(reservations: any[]): RevenueByHallItem[] {
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

  /**
   * Group revenue by event type
   */
  private groupRevenueByEventType(reservations: any[]): RevenueByEventTypeItem[] {
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

  // ============================================
  // OCCUPANCY REPORTS
  // ============================================

  /**
   * Get comprehensive occupancy report
   * @param filters - date range, optional hallId
   * @returns Occupancy report with summary, hall rankings, peak times
   */
  async getOccupancyReport(filters: OccupancyReportFilters): Promise<OccupancyReport> {
    const { dateFrom, dateTo, hallId } = filters;

    // Build where clause
    const whereClause: any = {
      date: { gte: dateFrom, lte: dateTo },
      status: { not: 'CANCELLED' },
    };

    if (hallId) whereClause.hallId = hallId;

    // Get all reservations in period
    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        startTime: true,
        guests: true,
        hall: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate total days in period
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const totalDaysInPeriod = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get unique dates with reservations
    const uniqueDates = new Set(reservations.map(r => r.date));
    const daysWithReservations = uniqueDates.size;

    // Calculate avg occupancy %
    const avgOccupancy = totalDaysInPeriod > 0
      ? Math.round((daysWithReservations / totalDaysInPeriod) * 100 * 10) / 10
      : 0;

    // Peak day of week analysis
    const peakDaysOfWeek = this.analyzePeakDaysOfWeek(reservations);
    /* istanbul ignore next -- empty when no reservations in period */
    const peakDay = peakDaysOfWeek.sort((a, b) => b.count - a.count)[0]?.dayOfWeek || 'N/A';

    // Peak hour analysis
    const peakHours = this.analyzePeakHours(reservations);

    // Occupancy by hall
    const hallsData = this.analyzeOccupancyByHall(reservations, totalDaysInPeriod);
    const peakHall = hallsData.sort((a, b) => b.reservations - a.reservations)[0] || null;

    return {
      summary: {
        avgOccupancy,
        peakDay,
        /* istanbul ignore next -- null when no halls have reservations */
        peakHall: peakHall?.hallName || null,
        /* istanbul ignore next */
        peakHallId: peakHall?.hallId || null,
        totalReservations: reservations.length,
        totalDaysInPeriod,
      },
      halls: hallsData,
      peakHours: peakHours.slice(0, 10), // Top 10 hours
      peakDaysOfWeek,
      filters,
    };
  }

  /**
   * Analyze peak days of week
   */
  private analyzePeakDaysOfWeek(reservations: any[]): PeakDayOfWeekItem[] {
    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const counts = new Map<number, number>();

    reservations.forEach(r => {
      const date = new Date(r.date);
      const dayOfWeek = date.getDay(); // 0-6
      counts.set(dayOfWeek, (counts.get(dayOfWeek) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([dayOfWeekNum, count]) => ({
        dayOfWeek: dayNames[dayOfWeekNum],
        dayOfWeekNum,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Analyze peak hours (0-23)
   */
  private analyzePeakHours(reservations: any[]): PeakHourItem[] {
    const counts = new Map<number, number>();

    reservations.forEach(r => {
      if (!r.startTime) return;
      const hour = parseInt(r.startTime.split(':')[0], 10);
      if (isNaN(hour)) return;
      counts.set(hour, (counts.get(hour) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Analyze occupancy by hall
   */
  private analyzeOccupancyByHall(
    reservations: any[],
    totalDaysInPeriod: number
  ): OccupancyByHallItem[] {
    const hallData = new Map<string, {
      name: string;
      dates: Set<string>;
      reservations: number;
      totalGuests: number;
    }>();

    reservations.forEach(r => {
      if (!r.hall) return;
      const existing = hallData.get(r.hall.id) || {
        name: r.hall.name,
        dates: new Set<string>(),
        reservations: 0,
        totalGuests: 0,
      };
      existing.dates.add(r.date);
      existing.reservations += 1;
      /* istanbul ignore next -- guests always present on reservation */
      existing.totalGuests += r.guests || 0;
      hallData.set(r.hall.id, existing);
    });

    return Array.from(hallData.entries())
      .map(([hallId, data]) => ({
        hallId,
        hallName: data.name,
        occupancy: Math.round((data.dates.size / totalDaysInPeriod) * 100 * 10) / 10,
        reservations: data.reservations,
        avgGuestsPerReservation: data.reservations > 0
          ? Math.round((data.totalGuests / data.reservations) * 10) / 10
          : 0,
      }))
      .sort((a, b) => b.occupancy - a.occupancy);
  }
}

export default new ReportsService();
