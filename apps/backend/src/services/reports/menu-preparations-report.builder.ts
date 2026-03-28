// apps/backend/src/services/reports/menu-preparations-report.builder.ts

/**
 * Menu Preparations Report Builder — extracted from reports.service.ts
 * Handles menu preparations report (#160 + #166 portionTarget)
 */

import { prisma } from '@/lib/prisma';
import type {
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
  getClientName,
  getReservationDate,
  calculatePortions,
} from './report-helpers';

export async function buildMenuPreparationsReport(filters: MenuPreparationsReportFilters): Promise<MenuPreparationsReport> {
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
          icon: (catSel as Record<string, unknown>).categoryIcon as string || null,
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
