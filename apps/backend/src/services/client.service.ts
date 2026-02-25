/**
 * Client Service
 * Business logic for client management
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */

import { prisma } from '@/lib/prisma';
import { CreateClientDTO, UpdateClientDTO, ClientFilters, ClientResponse } from '../types/client.types';
import { logChange, diffObjects } from '../utils/audit-logger';
import { CLIENT } from '../i18n/pl';

/** Statusy rezerwacji blokujące usunięcie klienta */
const ACTIVE_RESERVATION_STATUSES = ['RESERVED', 'PENDING', 'CONFIRMED'] as const;

export class ClientService {
  async createClient(data: CreateClientDTO, userId: string): Promise<ClientResponse> {
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error(CLIENT.INVALID_EMAIL);
    }

    if (!data.phone) {
      throw new Error(CLIENT.PHONE_REQUIRED);
    }

    const phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      throw new Error(CLIENT.PHONE_MIN_DIGITS);
    }

    const existingClient = await prisma.client.findFirst({
      where: { 
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        isDeleted: false
      }
    });

    if (existingClient) {
      throw new Error(`Klient ${data.firstName} ${data.lastName} z numerem ${data.phone} już istnieje`);
    }

    const client = await prisma.client.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email?.trim() || null,
        phone: data.phone.trim(),
        notes: data.notes?.trim() || null
      }
    });

    // Audit log
    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'CLIENT',
      entityId: client.id,
      details: {
        description: `Utworzono klienta: ${client.firstName} ${client.lastName}`,
        data: {
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone
        }
      }
    });

    return client as any;
  }

  async getClients(filters?: ClientFilters): Promise<ClientResponse[]> {
    const where: any = {
      isDeleted: false
    };

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Opcja dla admina: pokaż też usunięte
    if (filters?.includeDeleted) {
      delete where.isDeleted;
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    return clients as any[];
  }

  async getClientById(id: string): Promise<ClientResponse> {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        reservations: {
          take: 10,
          orderBy: { startDateTime: 'desc' },
          select: {
            id: true,
            startDateTime: true,
            endDateTime: true,
            guests: true,
            totalPrice: true,
            status: true,
            eventType: { select: { id: true, name: true } },
            hall: { select: { id: true, name: true } }
          }
        },
        _count: {
          select: { reservations: true }
        }
      }
    });

    if (!client) {
      throw new Error(CLIENT.NOT_FOUND);
    }

    return client as any;
  }

  async updateClient(id: string, data: UpdateClientDTO, userId: string): Promise<ClientResponse> {
    const existingClient = await prisma.client.findUnique({ where: { id } });

    if (!existingClient) {
      throw new Error(CLIENT.NOT_FOUND);
    }

    // Nie pozwalaj edytować usuniętego klienta
    if (existingClient.isDeleted) {
      throw new Error(CLIENT.ALREADY_DELETED);
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error(CLIENT.INVALID_EMAIL);
    }

    if (data.phone) {
      const phoneDigits = data.phone.replace(/\D/g, '');
      if (phoneDigits.length < 9) {
        throw new Error(CLIENT.PHONE_MIN_DIGITS);
      }

      const firstName = data.firstName || existingClient.firstName;
      const lastName = data.lastName || existingClient.lastName;
      
      const clientWithSameDetails = await prisma.client.findFirst({
        where: { 
          phone: data.phone,
          firstName: firstName,
          lastName: lastName,
          id: { not: id },
          isDeleted: false
        }
      });

      if (clientWithSameDetails) {
        throw new Error(`Klient ${firstName} ${lastName} z numerem ${data.phone} już istnieje`);
      }
    }

    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName.trim();
    if (data.lastName) updateData.lastName = data.lastName.trim();
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

    const client = await prisma.client.update({
      where: { id },
      data: updateData
    });

    // Audit log
    const changes = diffObjects(existingClient, client);
    if (Object.keys(changes).length > 0) {
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'CLIENT',
        entityId: client.id,
        details: {
          description: `Zaktualizowano klienta: ${client.firstName} ${client.lastName}`,
          changes
        }
      });
    }

    return client as any;
  }

  async deleteClient(id: string, userId: string): Promise<void> {
    const existingClient = await prisma.client.findUnique({ where: { id } });

    if (!existingClient) {
      throw new Error(CLIENT.NOT_FOUND);
    }

    if (existingClient.isDeleted) {
      throw new Error(CLIENT.ALREADY_DELETED);
    }

    // Sprawdź tylko AKTYWNE rezerwacje — zakończone/anulowane/archiwalne nie blokują
    const activeReservationCount = await prisma.reservation.count({
      where: {
        clientId: id,
        status: { in: [...ACTIVE_RESERVATION_STATUSES] }
      }
    });

    if (activeReservationCount > 0) {
      throw new Error(CLIENT.CANNOT_DELETE_WITH_ACTIVE_RESERVATIONS(activeReservationCount));
    }

    // Soft-delete + anonimizacja danych osobowych
    await prisma.client.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        firstName: 'Usunięty',
        lastName: 'Klient',
        phone: '***',
        email: null,
        notes: null
      }
    });

    // Audit log — zachowaj pełne dane sprzed anonimizacji
    await logChange({
      userId,
      action: 'SOFT_DELETE',
      entityType: 'CLIENT',
      entityId: id,
      details: {
        description: `Usunięto (soft-delete) klienta: ${existingClient.firstName} ${existingClient.lastName}`,
        deletedData: {
          firstName: existingClient.firstName,
          lastName: existingClient.lastName,
          email: existingClient.email,
          phone: existingClient.phone,
          notes: existingClient.notes
        }
      }
    });
  }

  /**
   * Pobierz informacje o rezerwacjach klienta pogrupowane wg statusu
   * Używane w modalu potwierdzenia usunięcia
   */
  async getClientReservationSummary(id: string): Promise<{
    active: number;
    completed: number;
    cancelled: number;
    archived: number;
    total: number;
  }> {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new Error(CLIENT.NOT_FOUND);
    }

    const [active, completed, cancelled, archived] = await Promise.all([
      prisma.reservation.count({
        where: { clientId: id, status: { in: [...ACTIVE_RESERVATION_STATUSES] } }
      }),
      prisma.reservation.count({
        where: { clientId: id, status: 'COMPLETED' }
      }),
      prisma.reservation.count({
        where: { clientId: id, status: 'CANCELLED' }
      }),
      prisma.reservation.count({
        where: { clientId: id, status: 'ARCHIVED' }
      }),
    ]);

    return {
      active,
      completed,
      cancelled,
      archived,
      total: active + completed + cancelled + archived
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default new ClientService();
