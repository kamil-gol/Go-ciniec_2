// apps/backend/src/services/reports/occupancy-analysis.ts

/**
 * Occupancy analysis functions extracted from ReportsService.
 */

import type {
  PeakDayOfWeekItem,
  PeakHourItem,
  OccupancyByHallItem,
} from '@/types/reports.types';
import { DAY_NAMES_PL, extractTimeFromDateTime, getReservationDate } from './report-helpers';

export function analyzePeakDaysOfWeek(reservations: any[]): PeakDayOfWeekItem[] {
  const counts = new Map<number, number>();
  reservations.forEach(r => {
    const dateStr = getReservationDate(r);
    if (!dateStr) return;
    const date = new Date(dateStr);
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

export function analyzePeakHours(reservations: any[]): PeakHourItem[] {
  const counts = new Map<number, number>();
  reservations.forEach(r => {
    const timeStr = r.startTime || extractTimeFromDateTime(r.startDateTime);
    if (!timeStr) return;
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (isNaN(hour)) return;
    counts.set(hour, (counts.get(hour) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count);
}

export function analyzeOccupancyByHall(
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
    const dateStr = getReservationDate(r);
    existing.dates.add(dateStr);
    existing.reservations += 1;
    existing.totalGuests += r.guests || 0;
    const currentDateGuests = existing.guestsPerDate.get(dateStr) || 0;
    existing.guestsPerDate.set(dateStr, currentDateGuests + (r.guests || 0));
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
