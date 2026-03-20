/**
 * Search Service
 * Global search across reservations, clients, halls
 * Issue #128: Szukaj globalnie
 */

import { prisma } from '@/lib/prisma';

export interface GlobalSearchResult {
  reservations: any[];
  clients: any[];
  halls: any[];
}

/** Polish month names → month number (1-indexed) */
const POLISH_MONTHS: Record<string, number> = {
  styczeń: 1, stycznia: 1, sty: 1,
  luty: 2, lutego: 2, lut: 2,
  marzec: 3, marca: 3, mar: 3,
  kwiecień: 4, kwietnia: 4, kwi: 4,
  maj: 5, maja: 5,
  czerwiec: 6, czerwca: 6, cze: 6,
  lipiec: 7, lipca: 7, lip: 7,
  sierpień: 8, sierpnia: 8, sie: 8,
  wrzesień: 9, września: 9, wrz: 9,
  październik: 10, października: 10, paź: 10,
  listopad: 11, listopada: 11, lis: 11,
  grudzień: 12, grudnia: 12, gru: 12,
};

/**
 * Try to parse a date-like query into a date range for filtering.
 * Supports:
 *   "15.05.2026", "15-05-2026", "2026-05-15" → exact day
 *   "15.05", "15-05", "15/05"                → day.month (current year)
 *   "maj", "maja", "czerwiec"                 → whole month (current year)
 *   "05.2026", "05/2026"                      → whole month of specific year
 */
function parseDateQuery(query: string): { gte: Date; lt: Date } | null {
  const q = query.trim().toLowerCase();

  // Full date: dd.mm.yyyy or dd-mm-yyyy or dd/mm/yyyy
  let m = q.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const date = new Date(+y, +mo - 1, +d);
    if (!isNaN(date.getTime())) {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      return { gte: date, lt: next };
    }
  }

  // ISO format: yyyy-mm-dd
  m = q.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    const date = new Date(+y, +mo - 1, +d);
    if (!isNaN(date.getTime())) {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      return { gte: date, lt: next };
    }
  }

  // Day.month: dd.mm or dd-mm or dd/mm (current year)
  m = q.match(/^(\d{1,2})[.\-/](\d{1,2})$/);
  if (m) {
    const [, d, mo] = m;
    const year = new Date().getFullYear();
    const date = new Date(year, +mo - 1, +d);
    if (!isNaN(date.getTime())) {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      return { gte: date, lt: next };
    }
  }

  // Month.year: mm.yyyy or mm/yyyy
  m = q.match(/^(\d{1,2})[.\-/](\d{4})$/);
  if (m) {
    const [, mo, y] = m;
    const start = new Date(+y, +mo - 1, 1);
    const end = new Date(+y, +mo, 1);
    return { gte: start, lt: end };
  }

  // Polish month name
  const monthNum = POLISH_MONTHS[q];
  if (monthNum) {
    const year = new Date().getFullYear();
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 1);
    return { gte: start, lt: end };
  }

  return null;
}

export class SearchService {
  /**
   * Search across multiple entities simultaneously.
   * Runs all queries in parallel for performance.
   */
  async globalSearch(query: string, limit = 5): Promise<GlobalSearchResult> {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      return { reservations: [], clients: [], halls: [] };
    }

    const [reservations, clients, halls] = await Promise.all([
      this.searchReservations(trimmed, limit),
      this.searchClients(trimmed, limit),
      this.searchHalls(trimmed, limit),
    ]);

    return { reservations, clients, halls };
  }

  private async searchReservations(query: string, limit: number) {
    const dateRange = parseDateQuery(query);

    const textConditions = [
      { client: { firstName: { contains: query, mode: 'insensitive' as const } } },
      { client: { lastName: { contains: query, mode: 'insensitive' as const } } },
      { client: { companyName: { contains: query, mode: 'insensitive' as const } } },
      { hall: { name: { contains: query, mode: 'insensitive' as const } } },
      { eventType: { name: { contains: query, mode: 'insensitive' as const } } },
    ];

    const dateConditions = dateRange
      ? [
          { startDateTime: { gte: dateRange.gte, lt: dateRange.lt } },
          {
            date: {
              gte: this.formatDateStr(dateRange.gte),
              lt: this.formatDateStr(dateRange.lt),
            },
          },
        ]
      : [];

    const orConditions = [...textConditions, ...dateConditions];

    return prisma.reservation.findMany({
      where: {
        OR: orConditions,
        status: { notIn: ['CANCELLED', 'ARCHIVED'] },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            clientType: true,
          },
        },
        hall: {
          select: { id: true, name: true },
        },
        eventType: {
          select: { id: true, name: true },
        },
      },
      take: limit,
      orderBy: [{ startDateTime: 'asc' }, { date: 'asc' }],
    });
  }

  /** Format Date to YYYY-MM-DD string for comparison with the varchar date field */
  private formatDateStr(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async searchClients(query: string, limit: number) {
    return prisma.client.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
        ],
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        clientType: true,
      },
      take: limit,
      orderBy: { lastName: 'asc' },
    });
  }

  private async searchHalls(query: string, limit: number) {
    return prisma.hall.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        description: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }
}

export default new SearchService();
