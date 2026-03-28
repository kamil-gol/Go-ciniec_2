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
  MenuPreparationsReportFilters,
  MenuPreparationsReport,
} from '@/types/reports.types';

import { buildPreparationsReport } from './preparations-report.builder';
import { buildMenuPreparationsReport } from './menu-preparations-report.builder';

import {
  calculateExtrasRevenue,
  getReservationDate,
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
      const mappedExtras = extras.map(e => ({
        quantity: Number(e.quantity),
        unitPrice: e.unitPrice != null ? Number(e.unitPrice) : null,
        totalPrice: e.totalPrice != null ? Number(e.totalPrice) : null,
        serviceItem: { ...e.serviceItem, basePrice: Number(e.serviceItem.basePrice) },
      }));
      const extrasCalc = calculateExtrasRevenue(mappedExtras, r.guests || 0);
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
    return buildPreparationsReport(filters);
  }

  // ============================================
  // MENU PREPARATIONS REPORTS #160 + #166
  // ============================================

  async getMenuPreparationsReport(filters: MenuPreparationsReportFilters): Promise<MenuPreparationsReport> {
    return buildMenuPreparationsReport(filters);
  }
}

export default new ReportsService();
