// apps/backend/src/services/reports/reports.service.ts

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
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma-client';
import type {
  RevenueReportFilters,
  RevenueReport,
  RevenueByCategoryExtraItem,
  OccupancyReportFilters,
  OccupancyReport,
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
import type { MenuSnapshotData } from '@/dto/menu-selection.dto';

import {
  formatDateLabelPL,
  extractTimeFromDateTime,
  calculateExtrasRevenue,
  getClientName,
  getReservationDate,
  calculatePortions,
} from './report-helpers';

import {
  groupRevenueByDay,
  groupRevenueByPeriod,
  groupRevenueByHall,
  groupRevenueByEventType,
  getPreviousPeriodRevenue,
} from './revenue-grouping';

import {
  analyzePeakDaysOfWeek,
  analyzePeakHours,
  analyzeOccupancyByHall,
} from './occupancy-analysis';

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
    const whereClause: Prisma.ReservationWhereInput = {
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
      getPreviousPeriodRevenue(dateFrom, dateTo, whereClause),
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
      const extras = r.extras || [];
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
      const catExtras = r.categoryExtras || [];
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

    const revenueByDay = groupRevenueByDay(reservations);
    const maxRevenueDay = revenueByDay.sort((a, b) => b.revenue - a.revenue)[0];

    const completedRevenue = reservations
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + Number(r.totalPrice || 0), 0);
    const pendingRevenue = totalRevenue - completedRevenue;

    const growthPercent = previousPeriodRevenue > 0
      ? Math.round(((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100)
      : 0;

    const breakdown = groupRevenueByPeriod(reservations, groupBy);
    const byHall = groupRevenueByHall(reservations);
    const byEventType = groupRevenueByEventType(reservations);

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
    } as RevenueReport;
  }

  // ============================================
  // OCCUPANCY REPORTS (#165: capacity utilization)
  // ============================================

  async getOccupancyReport(filters: OccupancyReportFilters): Promise<OccupancyReport> {
    const { dateFrom, dateTo, hallId } = filters;

    // Query by both date AND startDateTime
    const dateFromDT = new Date(`${dateFrom}T00:00:00`);
    const dateToDT = new Date(`${dateTo}T23:59:59`);
    const whereClause: Prisma.ReservationWhereInput = {
      OR: [
        { date: { not: null, gte: dateFrom, lte: dateTo } },
        { startDateTime: { not: null, gte: dateFromDT, lte: dateToDT } },
      ],
      status: { not: 'CANCELLED' },
    };

    if (hallId) whereClause.hallId = hallId;

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        startTime: true,
        startDateTime: true,
        guests: true,
        hall: { select: { id: true, name: true, capacity: true, allowMultipleBookings: true } },
      },
      orderBy: { date: 'asc' },
    });

    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const totalDaysInPeriod = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const uniqueDates = new Set(reservations.map(r => getReservationDate(r)));
    const daysWithReservations = uniqueDates.size;

    const avgOccupancy = totalDaysInPeriod > 0
      ? Math.round((daysWithReservations / totalDaysInPeriod) * 100 * 10) / 10
      : 0;

    const peakDaysOfWeek = analyzePeakDaysOfWeek(reservations);
    const peakDay = peakDaysOfWeek.sort((a, b) => b.count - a.count)[0]?.dayOfWeek || 'Brak danych';

    const peakHours = analyzePeakHours(reservations);

    const hallsData = analyzeOccupancyByHall(reservations, totalDaysInPeriod);
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

  // ============================================
  // PREPARATIONS REPORTS (Service Extras) #159
  // ============================================

  async getPreparationsReport(filters: PreparationsReportFilters): Promise<PreparationsReport> {
    const { dateFrom, dateTo, categoryId, view = 'detailed' } = filters;

    const dateFromDT = new Date(dateFrom + 'T00:00:00');
    const dateToDT = new Date(dateTo + 'T23:59:59');

    const extrasWhere: Prisma.ReservationExtraWhereInput = {
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

    const dayMap = new Map<string, Map<string, { category: { id: string; name: string; icon: string | null; color: string | null; displayOrder: number }; items: PreparationItem[] }>>();

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

      const menuData = snap.menuData as unknown as MenuSnapshotData | null;

      const courses: MenuPreparationCourse[] = [];
      const dishSelections = menuData?.dishSelections || [];

      for (const catSel of dishSelections) {
        const dishes: MenuPreparationDish[] = (catSel.dishes || []).map((d: { dishName?: string; name?: string; description?: string | null; quantity?: number }) => ({
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

          const portionTarget = course.portionTarget || 'ALL';

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
