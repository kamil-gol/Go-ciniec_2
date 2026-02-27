// apps/backend/src/services/reports.service.ts

/**
 * Reports Service
 * Business logic for revenue, occupancy, preparations, and other reports
 * Updated: extras revenue tracking in revenue reports
 * Updated: preparations report for service extras (#159)
 * Updated: extras filter changed to blacklist (not CANCELLED) instead of whitelist
 * FIX: query by both date AND startDateTime, remove Prisma `some` pre-filter
 * 🇵🇱 Spolonizowany — nazwy dni tygodnia po polsku
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
  PreparationsReportFilters,
  PreparationsReport,
  PreparationItem,
  PreparationCategoryGroup,
  PreparationDayGroup,
  PreparationSummaryItem,
  PreparationSummaryDayGroup,
} from '@/types/reports.types';

// Polish day/month names for date labels
const DAY_NAMES_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const MONTH_NAMES_PL = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

/**
 * Format date as Polish label: "Sobota, 15 marca 2026"
 */
function formatDateLabelPL(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES_PL[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES_PL[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

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
        maxRevenueDay: maxRevenueDay?.period || null,
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
      const period = r.date;
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
          period = r.date;
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

  async getOccupancyReport(filters: OccupancyReportFilters): Promise<OccupancyReport> {
    const { dateFrom, dateTo, hallId } = filters;

    const whereClause: any = {
      date: { gte: dateFrom, lte: dateTo },
      status: { not: 'CANCELLED' },
    };

    if (hallId) whereClause.hallId = hallId;

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

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const totalDaysInPeriod = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const uniqueDates = new Set(reservations.map(r => r.date));
    const daysWithReservations = uniqueDates.size;

    const avgOccupancy = totalDaysInPeriod > 0
      ? Math.round((daysWithReservations / totalDaysInPeriod) * 100 * 10) / 10
      : 0;

    const peakDaysOfWeek = this.analyzePeakDaysOfWeek(reservations);
    const peakDay = peakDaysOfWeek.sort((a, b) => b.count - a.count)[0]?.dayOfWeek || 'Brak danych';

    const peakHours = this.analyzePeakHours(reservations);

    const hallsData = this.analyzeOccupancyByHall(reservations, totalDaysInPeriod);
    const peakHall = hallsData.sort((a, b) => b.reservations - a.reservations)[0] || null;

    return {
      summary: {
        avgOccupancy,
        peakDay,
        peakHall: peakHall?.hallName || null,
        peakHallId: peakHall?.hallId || null,
        totalReservations: reservations.length,
        totalDaysInPeriod,
      },
      halls: hallsData,
      peakHours: peakHours.slice(0, 10),
      peakDaysOfWeek,
      filters,
    };
  }

  private analyzePeakDaysOfWeek(reservations: any[]): PeakDayOfWeekItem[] {
    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const counts = new Map<number, number>();

    reservations.forEach(r => {
      const date = new Date(r.date);
      const dayOfWeek = date.getDay();
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

  // ============================================
  // PREPARATIONS REPORTS (Service Extras) #159
  // ============================================

  /**
   * Get preparations report — what service extras need to be prepared.
   * Groups by date → category → service item, with reservation details.
   * Supports detailed (per-reservation) and summary (aggregated) views.
   *
   * FIX: Query uses OR condition for date/startDateTime to catch all reservations.
   * FIX: Removed Prisma `extras: { some: ... }` pre-filter — now fetches ALL
   * reservations in date range and filters extras in-memory. This avoids edge
   * cases where Prisma relation filters silently exclude valid data.
   */
  async getPreparationsReport(filters: PreparationsReportFilters): Promise<PreparationsReport> {
    const { dateFrom, dateTo, categoryId, view = 'detailed' } = filters;

    // Build date range for startDateTime comparison
    const dateFromDT = new Date(dateFrom + 'T00:00:00');
    const dateToDT = new Date(dateTo + 'T23:59:59');

    // Build extras where clause for the nested select filter
    const extrasWhere: any = {
      status: { not: 'CANCELLED' },
    };
    if (categoryId) {
      extrasWhere.serviceItem = { categoryId };
    }

    // FIX: Query reservations by BOTH date (varchar) AND startDateTime (datetime)
    // Some reservations may only have one of these fields populated.
    // Also: removed `extras: { some: extrasWhere }` — fetch all reservations
    // in range, then filter those with matching extras in-memory.
    const reservations = await prisma.reservation.findMany({
      where: {
        status: { not: 'CANCELLED' },
        OR: [
          // Match by date varchar field (YYYY-MM-DD)
          {
            date: {
              not: null,
              gte: dateFrom,
              lte: dateTo,
            },
          },
          // Match by startDateTime field (DateTime)
          {
            startDateTime: {
              not: null,
              gte: dateFromDT,
              lte: dateToDT,
            },
          },
        ],
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        guests: true,
        adults: true,
        children: true,
        toddlers: true,
        startDateTime: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            clientType: true,
          },
        },
        hall: { select: { id: true, name: true } },
        eventType: { select: { id: true, name: true } },
        extras: {
          where: extrasWhere,
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            priceType: true,
            totalPrice: true,
            note: true,
            status: true,
            serviceItem: {
              select: {
                id: true,
                name: true,
                priceType: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                    color: true,
                    displayOrder: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    // FIX: Filter out reservations that have no matching extras (post-query)
    const reservationsWithExtras = reservations.filter(r => r.extras.length > 0);

    // Build client display name helper
    const getClientName = (client: any): string => {
      if (client.clientType === 'COMPANY' && client.companyName) {
        return client.companyName;
      }
      return `${client.firstName} ${client.lastName}`;
    };

    // Helper: get the effective date string for a reservation
    // Prefers the `date` field, falls back to startDateTime
    const getReservationDate = (r: any): string => {
      if (r.date) return r.date;
      if (r.startDateTime) {
        return new Date(r.startDateTime).toISOString().split('T')[0];
      }
      return '';
    };

    // Flatten all extras with reservation context
    const allItems: PreparationItem[] = [];

    for (const r of reservationsWithExtras) {
      const effectiveDate = getReservationDate(r);
      if (!effectiveDate) continue; // skip if no date at all

      for (const extra of r.extras) {
        allItems.push({
          extraId: extra.id,
          serviceName: extra.serviceItem.name,
          serviceItemId: extra.serviceItem.id,
          quantity: extra.quantity,
          priceType: extra.priceType,
          unitPrice: Number(extra.unitPrice),
          totalPrice: Number(extra.totalPrice),
          note: extra.note,
          status: extra.status,
          reservation: {
            id: r.id,
            clientName: getClientName(r.client),
            hallName: r.hall?.name || null,
            eventTypeName: r.eventType?.name || null,
            date: effectiveDate,
            startTime: r.startTime,
            endTime: r.endTime,
            guests: r.guests,
            adults: r.adults,
            children: r.children,
            toddlers: r.toddlers,
          },
        });
      }
    }

    // === DETAILED VIEW: group by date → category ===
    const dayMap = new Map<string, Map<string, { category: any; items: PreparationItem[] }>>();

    for (const item of allItems) {
      const date = item.reservation.date;
      if (!dayMap.has(date)) dayMap.set(date, new Map());

      const catMap = dayMap.get(date)!;
      // Find category from the reservation/extra data
      const r = reservationsWithExtras.find(res => res.id === item.reservation.id);
      const extra = r?.extras.find(e => e.id === item.extraId);
      const cat = extra?.serviceItem.category;

      if (!cat) continue;

      if (!catMap.has(cat.id)) {
        catMap.set(cat.id, {
          category: cat,
          items: [],
        });
      }
      catMap.get(cat.id)!.items.push(item);
    }

    // Convert to sorted arrays
    const days: PreparationDayGroup[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, catMap]) => {
        const categories: PreparationCategoryGroup[] = Array.from(catMap.entries())
          .sort(([, a], [, b]) => (a.category.displayOrder || 0) - (b.category.displayOrder || 0))
          .map(([catId, data]) => ({
            categoryId: catId,
            categoryName: data.category.name,
            categoryIcon: data.category.icon,
            categoryColor: data.category.color,
            items: data.items.sort((a, b) => {
              const timeA = a.reservation.startTime || '99:99';
              const timeB = b.reservation.startTime || '99:99';
              return timeA.localeCompare(timeB);
            }),
            itemCount: data.items.length,
          }));

        return {
          date,
          dateLabel: formatDateLabelPL(date),
          categories,
          totalItems: categories.reduce((sum, c) => sum + c.itemCount, 0),
        };
      });

    // === SUMMARY VIEW: aggregate per service item per day ===
    let summaryDays: PreparationSummaryDayGroup[] | undefined;

    if (view === 'summary') {
      const summaryDayMap = new Map<string, Map<string, PreparationSummaryItem>>();

      for (const item of allItems) {
        const date = item.reservation.date;
        if (!summaryDayMap.has(date)) summaryDayMap.set(date, new Map());

        const serviceMap = summaryDayMap.get(date)!;

        const r = reservationsWithExtras.find(res => res.id === item.reservation.id);
        const extra = r?.extras.find(e => e.id === item.extraId);
        const cat = extra?.serviceItem.category;

        if (!serviceMap.has(item.serviceItemId)) {
          serviceMap.set(item.serviceItemId, {
            serviceItemId: item.serviceItemId,
            serviceName: item.serviceName,
            categoryName: cat?.name || '',
            categoryIcon: cat?.icon || null,
            categoryColor: cat?.color || null,
            totalQuantity: 0,
            totalPersons: 0,
            reservationCount: 0,
            reservations: [],
          });
        }

        const summary = serviceMap.get(item.serviceItemId)!;
        summary.totalQuantity += item.quantity;
        summary.reservationCount += 1;

        if (item.priceType === 'PER_PERSON') {
          summary.totalPersons += item.reservation.guests;
        }

        summary.reservations.push({
          id: item.reservation.id,
          clientName: item.reservation.clientName,
          date: item.reservation.date,
          startTime: item.reservation.startTime,
          quantity: item.quantity,
        });
      }

      summaryDays = Array.from(summaryDayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, serviceMap]) => {
          const items = Array.from(serviceMap.values())
            .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.serviceName.localeCompare(b.serviceName));

          const uniqueReservationIds = new Set(
            items.flatMap(i => i.reservations.map(r => r.id))
          );

          return {
            date,
            dateLabel: formatDateLabelPL(date),
            items,
            totalItems: items.reduce((sum, i) => sum + i.totalQuantity, 0),
            totalReservations: uniqueReservationIds.size,
          };
        });
    }

    // === KPI SUMMARY ===
    const totalExtras = allItems.length;
    const uniqueReservationIds = new Set(allItems.map(i => i.reservation.id));
    const totalReservationsWithExtras = uniqueReservationIds.size;

    // Nearest event (from today)
    const today = new Date().toISOString().split('T')[0];
    const futureItems = allItems
      .filter(i => i.reservation.date >= today)
      .sort((a, b) => {
        const dateCompare = a.reservation.date.localeCompare(b.reservation.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.reservation.startTime || '').localeCompare(b.reservation.startTime || '');
      });

    const nearestEvent = futureItems.length > 0
      ? {
          date: futureItems[0].reservation.date,
          startTime: futureItems[0].reservation.startTime,
          clientName: futureItems[0].reservation.clientName,
        }
      : null;

    // Top category by count
    const categoryCounts = new Map<string, { name: string; icon: string | null; count: number }>();
    for (const item of allItems) {
      const r = reservationsWithExtras.find(res => res.id === item.reservation.id);
      const extra = r?.extras.find(e => e.id === item.extraId);
      const cat = extra?.serviceItem.category;
      if (!cat) continue;

      const existing = categoryCounts.get(cat.id) || { name: cat.name, icon: cat.icon, count: 0 };
      existing.count += 1;
      categoryCounts.set(cat.id, existing);
    }

    const topCategoryEntry = Array.from(categoryCounts.values())
      .sort((a, b) => b.count - a.count)[0] || null;

    const topCategory = topCategoryEntry
      ? { name: topCategoryEntry.name, icon: topCategoryEntry.icon, count: topCategoryEntry.count }
      : null;

    return {
      summary: {
        totalExtras,
        totalReservationsWithExtras,
        nearestEvent,
        topCategory,
      },
      days,
      ...(summaryDays ? { summaryDays } : {}),
      filters,
    };
  }
}

export default new ReportsService();
