// apps/backend/src/services/reports.service.ts

/**
 * Reports Service
 * Business logic for revenue, occupancy, preparations, and other reports
 * Updated: extras revenue tracking in revenue reports
 * Updated: preparations report for service extras (#159)
 * Updated: extras filter changed to blacklist (not CANCELLED) instead of whitelist
 * Updated: menu preparations report (#160)
 * Updated: occupancy report — capacity utilization for multi-booking halls (#165)
 * Updated: #166 — portionTarget support in menu preparations report
 * FIX: query by both date AND startDateTime, remove Prisma `some` pre-filter
 * FIX: fallback startTime/endTime from startDateTime/endDateTime
 * FIX: added portionSize from menuData.quantity to dish mapping
 * FIX: totalPortions excludes toddlers (adults + children only)
 * FIX: removed toddlerPortions from summary dish aggregation (not displayed)
 * 🇵🇱 Spolonizowany — nazwy dni tygodnia po polsku
 */

import { prisma } from '@/lib/prisma';
import type {
  RevenueReportFilters,
  RevenueReport,
  RevenueBreakdownItem,
  RevenueByHallItem,
  RevenueByEventTypeItem,
  RevenueByCategoryExtraItem,
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
  MenuPreparationsReportFilters,
  MenuPreparationsReport,
  MenuPreparationReservation,
  MenuPreparationCourse,
  MenuPreparationDish,
  MenuPreparationDayGroup,
  MenuPreparationSummaryDish,
  MenuPreparationSummaryCourseGroup,
  MenuPreparationSummaryDayGroup,
} from '@/types/reports.types';

const DAY_NAMES_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const MONTH_NAMES_PL = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

function formatDateLabelPL(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES_PL[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES_PL[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

function extractTimeFromDateTime(dt: Date | string | null | undefined): string | null {
  if (!dt) return null;
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  if (isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function calculateExtrasRevenue(
  extras: Array<{ quantity: number; unitPrice: number | null; totalPrice: number | null; serviceItem: { basePrice: number; priceType: string; name: string; id: string } }>,
  guests: number
): { total: number; items: Array<{ serviceItemId: string; name: string; revenue: number }> } {
  let total = 0;
  const items: Array<{ serviceItemId: string; name: string; revenue: number }> = [];

  for (const extra of extras) {
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
        revenue = price * qty;
      }
    }
    revenue = Math.round(revenue * 100) / 100;
    total += revenue;
    items.push({ serviceItemId: extra.serviceItem.id, name: extra.serviceItem.name, revenue });
  }

  return { total: Math.round(total * 100) / 100, items };
}

function getClientName(client: { clientType: string; companyName?: string | null; firstName: string; lastName: string }): string {
  if (client.clientType === 'COMPANY' && client.companyName) {
    return client.companyName;
  }
  return `${client.firstName} ${client.lastName}`;
}

function getReservationDate(r: { date: string | null; startDateTime: Date | string | null }): string {
  if (r.date) return r.date;
  if (r.startDateTime) {
    return new Date(r.startDateTime).toISOString().split('T')[0];
  }
  return '';
}

/**
 * #166: Calculate adult/children portions based on portionTarget.
 * Exported for unit testing.
 */
export function calculatePortions(
  portionTarget: string,
  adults: number,
  children: number,
  portionSize: number
): { adultPortions: number; childrenPortions: number; totalPortions: number } {
  let adultPortions = 0;
  let childrenPortions = 0;

  switch (portionTarget) {
    case 'ADULTS_ONLY':
      adultPortions = adults * portionSize;
      childrenPortions = 0;
      break;
    case 'CHILDREN_ONLY':
      adultPortions = 0;
      childrenPortions = children * portionSize;
      break;
    case 'ALL':
    default:
      adultPortions = adults * portionSize;
      childrenPortions = children * portionSize;
      break;
  }

  return {
    adultPortions,
    childrenPortions,
    totalPortions: adultPortions + childrenPortions,
  };
}

class ReportsService {
  // ============================================
  // REVENUE REPORTS
  // ============================================

  async getRevenueReport(filters: RevenueReportFilters): Promise<RevenueReport> {
    const {
      dateFrom,
      dateTo,
      groupBy = 'month',
      hallId,
      eventTypeId,
      status,
    } = filters;

    // Query by both date AND startDateTime (some reservations use one or the other)
    const dateFromDT = new Date(`${dateFrom}T00:00:00`);
    const dateToDT = new Date(`${dateTo}T23:59:59`);
    const whereClause: any = {
      OR: [
        { date: { not: null, gte: dateFrom, lte: dateTo } },
        { startDateTime: { not: null, gte: dateFromDT, lte: dateToDT } },
      ],
      status: { not: 'CANCELLED' },
    };

    if (hallId) whereClause.hallId = hallId;
    if (eventTypeId) whereClause.eventTypeId = eventTypeId;
    if (status) whereClause.status = status;

    const [
      reservations,
      completedReservations,
      previousPeriodRevenue,
    ] = await Promise.all([
      prisma.reservation.findMany({
        where: whereClause,
        select: {
          id: true,
          date: true,
          startTime: true,
          startDateTime: true,
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
          categoryExtras: {
            include: {
              packageCategory: {
                include: {
                  category: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.reservation.count({
        where: { ...whereClause, status: 'COMPLETED' },
      }),
      this.getPreviousPeriodRevenue(dateFrom, dateTo, whereClause),
    ]);

    const totalRevenue = reservations.reduce(
      (sum, r) => sum + Number(r.totalPrice || 0),
      0
    );
    const totalReservations = reservations.length;
    const avgRevenuePerReservation = totalReservations > 0
      ? totalRevenue / totalReservations
      : 0;

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

    const byServiceItem = Array.from(serviceItemRevenueMap.entries())
      .map(([serviceItemId, data]) => ({
        serviceItemId,
        name: data.name,
        revenue: Math.round(data.revenue * 100) / 100,
        count: data.count,
        avgRevenue: data.count > 0 ? Math.round((data.revenue / data.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // #216: Category extras (dodatkowo płatne porcje) revenue
    let totalCategoryExtrasRevenue = 0;
    const categoryExtraRevenueMap = new Map<string, { name: string; revenue: number; count: number; totalQuantity: number }>();

    for (const r of reservations) {
      const catExtras = (r as any).categoryExtras || [];
      if (catExtras.length === 0) continue;
      for (const ce of catExtras) {
        const revenue = Number(ce.totalPrice || 0);
        totalCategoryExtrasRevenue += revenue;
        const categoryName = ce.packageCategory?.category?.name || 'Nieznana kategoria';
        const categoryId = ce.packageCategory?.category?.id || 'unknown';
        const existing = categoryExtraRevenueMap.get(categoryId) || { name: categoryName, revenue: 0, count: 0, totalQuantity: 0 };
        existing.revenue += revenue;
        existing.count += 1;
        existing.totalQuantity += Number(ce.quantity || 0);
        categoryExtraRevenueMap.set(categoryId, existing);
      }
    }

    const byCategoryExtra: RevenueByCategoryExtraItem[] = Array.from(categoryExtraRevenueMap.entries())
      .map(([_, data]) => ({
        categoryName: data.name,
        revenue: Math.round(data.revenue * 100) / 100,
        count: data.count,
        totalQuantity: data.totalQuantity,
        avgRevenue: data.count > 0 ? Math.round((data.revenue / data.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const revenueByDay = this.groupRevenueByDay(reservations);
    const maxRevenueDay = revenueByDay.sort((a, b) => b.revenue - a.revenue)[0];

    const completedRevenue = reservations
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + Number(r.totalPrice || 0), 0);
    const pendingRevenue = totalRevenue - completedRevenue;

    const growthPercent = previousPeriodRevenue > 0
      ? Math.round(((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100)
      : 0;

    const breakdown = this.groupRevenueByPeriod(reservations, groupBy);
    const byHall = this.groupRevenueByHall(reservations);
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
        categoryExtrasRevenue: Math.round(totalCategoryExtrasRevenue * 100) / 100,
      },
      breakdown,
      byHall,
      byEventType,
      byServiceItem,
      byCategoryExtra,
      filters,
    } as any;
  }

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

  private groupRevenueByDay(reservations: any[]): RevenueBreakdownItem[] {
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

  private groupRevenueByPeriod(
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

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

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
  // OCCUPANCY REPORTS (#165: capacity utilization)
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
        hall: { select: { id: true, name: true, capacity: true, allowMultipleBookings: true } },
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

    const multiBookingHalls = hallsData.filter(h => h.allowMultipleBookings && h.avgCapacityUtilization !== null);
    const avgCapacityUtilization = multiBookingHalls.length > 0
      ? Math.round((multiBookingHalls.reduce((sum, h) => sum + (h.avgCapacityUtilization || 0), 0) / multiBookingHalls.length) * 10) / 10
      : null;

    return {
      summary: {
        avgOccupancy,
        peakDay,
        peakHall: peakHall?.hallName || null,
        peakHallId: peakHall?.hallId || null,
        totalReservations: reservations.length,
        totalDaysInPeriod,
        avgCapacityUtilization,
      },
      halls: hallsData,
      peakHours: peakHours.slice(0, 10),
      peakDaysOfWeek,
      filters,
    };
  }

  private analyzePeakDaysOfWeek(reservations: any[]): PeakDayOfWeekItem[] {
    const counts = new Map<number, number>();
    reservations.forEach(r => {
      const date = new Date(r.date);
      const dayOfWeek = date.getDay();
      counts.set(dayOfWeek, (counts.get(dayOfWeek) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([dayOfWeekNum, count]) => ({
        dayOfWeek: DAY_NAMES_PL[dayOfWeekNum],
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
      capacity: number | null;
      allowMultipleBookings: boolean;
      dates: Set<string>;
      reservations: number;
      totalGuests: number;
      guestsPerDate: Map<string, number>;
    }>();
    reservations.forEach(r => {
      if (!r.hall) return;
      const existing = hallData.get(r.hall.id) || {
        name: r.hall.name,
        capacity: r.hall.capacity ?? null,
        allowMultipleBookings: r.hall.allowMultipleBookings ?? false,
        dates: new Set<string>(),
        reservations: 0,
        totalGuests: 0,
        guestsPerDate: new Map<string, number>(),
      };
      existing.dates.add(r.date);
      existing.reservations += 1;
      existing.totalGuests += r.guests || 0;
      const currentDateGuests = existing.guestsPerDate.get(r.date) || 0;
      existing.guestsPerDate.set(r.date, currentDateGuests + (r.guests || 0));
      hallData.set(r.hall.id, existing);
    });
    return Array.from(hallData.entries())
      .map(([hallId, data]) => {
        let avgCapacityUtilization: number | null = null;
        if (data.allowMultipleBookings && data.capacity && data.capacity > 0 && data.guestsPerDate.size > 0) {
          const dailyUtilizations = Array.from(data.guestsPerDate.values())
            .map(guests => Math.min((guests / data.capacity!) * 100, 100));
          avgCapacityUtilization = Math.round(
            (dailyUtilizations.reduce((sum, u) => sum + u, 0) / dailyUtilizations.length) * 10
          ) / 10;
        }

        return {
          hallId,
          hallName: data.name,
          occupancy: Math.round((data.dates.size / totalDaysInPeriod) * 100 * 10) / 10,
          reservations: data.reservations,
          avgGuestsPerReservation: data.reservations > 0
            ? Math.round((data.totalGuests / data.reservations) * 10) / 10
            : 0,
          capacity: data.capacity,
          allowMultipleBookings: data.allowMultipleBookings,
          avgCapacityUtilization,
        };
      })
      .sort((a, b) => b.occupancy - a.occupancy);
  }

  // ============================================
  // PREPARATIONS REPORTS (Service Extras) #159
  // ============================================

  async getPreparationsReport(filters: PreparationsReportFilters): Promise<PreparationsReport> {
    const { dateFrom, dateTo, categoryId, view = 'detailed' } = filters;

    const dateFromDT = new Date(dateFrom + 'T00:00:00');
    const dateToDT = new Date(dateTo + 'T23:59:59');

    const extrasWhere: any = {
      status: { not: 'CANCELLED' },
    };
    if (categoryId) {
      extrasWhere.serviceItem = { categoryId };
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        status: { not: 'CANCELLED' },
        OR: [
          { date: { not: null, gte: dateFrom, lte: dateTo } },
          { startDateTime: { not: null, gte: dateFromDT, lte: dateToDT } },
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
        endDateTime: true,
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

    const reservationsWithExtras = reservations.filter(r => r.extras.length > 0);

    const allItems: PreparationItem[] = [];

    for (const r of reservationsWithExtras) {
      const effectiveDate = getReservationDate(r);
      if (!effectiveDate) continue;

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
            startTime: r.startTime || extractTimeFromDateTime(r.startDateTime),
            endTime: r.endTime || extractTimeFromDateTime(r.endDateTime),
            guests: r.guests,
            adults: r.adults,
            children: r.children,
            toddlers: r.toddlers,
          },
        });
      }
    }

    const dayMap = new Map<string, Map<string, { category: any; items: PreparationItem[] }>>();

    for (const item of allItems) {
      const date = item.reservation.date;
      if (!dayMap.has(date)) dayMap.set(date, new Map());

      const catMap = dayMap.get(date)!;
      const r = reservationsWithExtras.find(res => res.id === item.reservation.id);
      const extra = r?.extras.find(e => e.id === item.extraId);
      const cat = extra?.serviceItem.category;

      if (!cat) continue;

      if (!catMap.has(cat.id)) {
        catMap.set(cat.id, { category: cat, items: [] });
      }
      catMap.get(cat.id)!.items.push(item);
    }

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

    const totalExtras = allItems.length;
    const uniqueReservationIds = new Set(allItems.map(i => i.reservation.id));
    const totalReservationsWithExtras = uniqueReservationIds.size;

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

  // ============================================
  // MENU PREPARATIONS REPORTS #160 + #166
  // ============================================

  async getMenuPreparationsReport(filters: MenuPreparationsReportFilters): Promise<MenuPreparationsReport> {
    const { dateFrom, dateTo, view = 'detailed' } = filters;

    const dateFromDT = new Date(dateFrom + 'T00:00:00');
    const dateToDT = new Date(dateTo + 'T23:59:59');

    const snapshots = await prisma.reservationMenuSnapshot.findMany({
      where: {
        reservation: {
          status: { not: 'CANCELLED' },
          OR: [
            { date: { not: null, gte: dateFrom, lte: dateTo } },
            { startDateTime: { not: null, gte: dateFromDT, lte: dateToDT } },
          ],
        },
      },
      select: {
        id: true,
        menuData: true,
        packagePrice: true,
        totalMenuPrice: true,
        adultsCount: true,
        childrenCount: true,
        toddlersCount: true,
        reservation: {
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
            endDateTime: true,
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
          },
        },
      },
    });

    const allReservations: (MenuPreparationReservation & { _date: string })[] = [];

    for (const snap of snapshots) {
      const r = snap.reservation;
      const effectiveDate = getReservationDate(r);
      if (!effectiveDate) continue;

      const menuData = snap.menuData as any;

      const courses: MenuPreparationCourse[] = [];
      const dishSelections = menuData?.dishSelections || [];

      for (const catSel of dishSelections) {
        const dishes: MenuPreparationDish[] = (catSel.dishes || []).map((d: any) => ({
          name: d.dishName || d.name || 'Nieznane danie',
          description: d.description || null,
          portionSize: d.quantity != null ? Number(d.quantity) : 1,
        }));

        if (dishes.length > 0) {
          courses.push({
            courseName: catSel.categoryName || 'Nieznana kategoria',
            icon: catSel.categoryIcon || null,
            portionTarget: catSel.portionTarget || 'ALL',
            dishes,
          });
        }
      }

      allReservations.push({
        _date: effectiveDate,
        reservationId: r.id,
        clientName: getClientName(r.client),
        hallName: r.hall?.name || null,
        eventTypeName: r.eventType?.name || null,
        date: effectiveDate,
        startTime: r.startTime || extractTimeFromDateTime(r.startDateTime),
        endTime: r.endTime || extractTimeFromDateTime(r.endDateTime),
        guests: {
          adults: snap.adultsCount,
          children: snap.childrenCount,
          toddlers: snap.toddlersCount,
          total: snap.adultsCount + snap.childrenCount + snap.toddlersCount,
        },
        package: {
          name: menuData?.packageName || 'Nieznany pakiet',
          description: menuData?.packageDescription || null,
        },
        courses,
        packagePrice: Number(snap.packagePrice),
        totalMenuPrice: Number(snap.totalMenuPrice),
      });
    }

    allReservations.sort((a, b) => {
      const dateCompare = a._date.localeCompare(b._date);
      if (dateCompare !== 0) return dateCompare;
      return (a.startTime || '99:99').localeCompare(b.startTime || '99:99');
    });

    const dayMap = new Map<string, MenuPreparationReservation[]>();

    for (const item of allReservations) {
      if (!dayMap.has(item._date)) dayMap.set(item._date, []);
      const { _date, ...reservationData } = item;
      dayMap.get(item._date)!.push(reservationData);
    }

    const days: MenuPreparationDayGroup[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, reservations]) => ({
        date,
        dateLabel: formatDateLabelPL(date),
        reservations,
        totalReservations: reservations.length,
        totalGuests: reservations.reduce((sum, r) => sum + r.guests.total, 0),
      }));

    // SUMMARY VIEW: aggregate per course -> per dish per day
    // #166: totalPortions now uses calculatePortions() with portionTarget
    let summaryDays: MenuPreparationSummaryDayGroup[] | undefined;

    if (view === 'summary') {
      const summaryDayMap = new Map<string, Map<string, Map<string, {
        dish: MenuPreparationSummaryDish;
        courseIcon: string | null;
      }>>>();

      for (const item of allReservations) {
        const date = item._date;
        if (!summaryDayMap.has(date)) summaryDayMap.set(date, new Map());
        const courseMap = summaryDayMap.get(date)!;

        for (const course of item.courses) {
          if (!courseMap.has(course.courseName)) courseMap.set(course.courseName, new Map());
          const dishMap = courseMap.get(course.courseName)!;

          const portionTarget = (course as any).portionTarget || 'ALL';

          for (const dish of course.dishes) {
            if (!dishMap.has(dish.name)) {
              dishMap.set(dish.name, {
                courseIcon: course.icon,
                dish: {
                  dishName: dish.name,
                  totalPortions: 0,
                  adultPortions: 0,
                  childrenPortions: 0,
                  portionTarget,
                  reservations: [],
                },
              });
            }

            const entry = dishMap.get(dish.name)!;
            const pSize = dish.portionSize ?? 1;

            const portions = calculatePortions(
              portionTarget,
              item.guests.adults,
              item.guests.children,
              pSize
            );

            entry.dish.totalPortions += portions.totalPortions;
            entry.dish.adultPortions += portions.adultPortions;
            entry.dish.childrenPortions += portions.childrenPortions;
            entry.dish.reservations.push({
              id: item.reservationId,
              clientName: item.clientName,
              guests: item.guests.total,
            });
          }
        }
      }

      summaryDays = Array.from(summaryDayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, courseMap]) => {
          const courses: MenuPreparationSummaryCourseGroup[] = Array.from(courseMap.entries())
            .map(([courseName, dishMap]) => {
              const dishes = Array.from(dishMap.values())
                .map(entry => entry.dish)
                .sort((a, b) => b.totalPortions - a.totalPortions);

              const firstEntry = Array.from(dishMap.values())[0];

              return {
                courseName,
                icon: firstEntry?.courseIcon || null,
                dishes,
              };
            });

          const dayReservations = allReservations.filter(r => r._date === date);
          const uniqueIds = new Set(dayReservations.map(r => r.reservationId));

          return {
            date,
            dateLabel: formatDateLabelPL(date),
            courses,
            totalReservations: uniqueIds.size,
            totalGuests: dayReservations.reduce((sum, r) => sum + r.guests.total, 0),
          };
        });
    }

    const totalMenus = allReservations.length;
    const totalGuests = allReservations.reduce((sum, r) => sum + r.guests.total, 0);
    const totalAdults = allReservations.reduce((sum, r) => sum + r.guests.adults, 0);
    const totalChildren = allReservations.reduce((sum, r) => sum + r.guests.children, 0);
    const totalToddlers = allReservations.reduce((sum, r) => sum + r.guests.toddlers, 0);

    const packageCounts = new Map<string, number>();
    for (const r of allReservations) {
      const name = r.package.name;
      packageCounts.set(name, (packageCounts.get(name) || 0) + 1);
    }
    const topPackageEntry = Array.from(packageCounts.entries())
      .sort(([, a], [, b]) => b - a)[0] || null;
    const topPackage = topPackageEntry
      ? { name: topPackageEntry[0], count: topPackageEntry[1] }
      : null;

    const today = new Date().toISOString().split('T')[0];
    const futureReservations = allReservations
      .filter(r => r._date >= today)
      .sort((a, b) => {
        const dateCompare = a._date.localeCompare(b._date);
        if (dateCompare !== 0) return dateCompare;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });

    const nearestEvent = futureReservations.length > 0
      ? {
          date: futureReservations[0]._date,
          startTime: futureReservations[0].startTime,
          clientName: futureReservations[0].clientName,
        }
      : null;

    return {
      summary: {
        totalMenus,
        totalGuests,
        totalAdults,
        totalChildren,
        totalToddlers,
        topPackage,
        nearestEvent,
      },
      days,
      ...(summaryDays ? { summaryDays } : {}),
      filters,
    };
  }
}

export default new ReportsService();
