// apps/backend/src/services/reports/preparations-report.builder.ts

/**
 * Preparations Report Builder — extracted from reports.service.ts
 * Handles service extras preparations report (#159)
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma-client';
import type {
  PreparationsReportFilters,
  PreparationsReport,
  PreparationItem,
  PreparationCategoryGroup,
  PreparationDayGroup,
  PreparationSummaryItem,
  PreparationSummaryDayGroup,
} from '@/types/reports.types';

import {
  formatDateLabelPL,
  extractTimeFromDateTime,
  getClientName,
  getReservationDate,
} from './report-helpers';

export async function buildPreparationsReport(filters: PreparationsReportFilters): Promise<PreparationsReport> {
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
