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
    return prisma.reservation.findMany({
      where: {
        OR: [
          { client: { firstName: { contains: query, mode: 'insensitive' } } },
          { client: { lastName: { contains: query, mode: 'insensitive' } } },
          { client: { companyName: { contains: query, mode: 'insensitive' } } },
          { hall: { name: { contains: query, mode: 'insensitive' } } },
          { eventType: { name: { contains: query, mode: 'insensitive' } } },
        ],
        isDeleted: false,
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
      orderBy: { date: 'desc' },
    });
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
