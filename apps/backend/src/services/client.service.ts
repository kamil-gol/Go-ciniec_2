/**
 * Client Service
 * Business logic for client management
 * Extended with company support (#150 Klienci 2.0)
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma-client';
import {
  CreateClientDTO,
  UpdateClientDTO,
  ClientFilters,
  ClientResponse,
  CreateClientContactDTO,
  UpdateClientContactDTO,
  ClientContactResponse,
} from '../types/client.types';
import { logChange, diffObjects } from '../utils/audit-logger';
import { AppError } from '../utils/AppError';
import { CLIENT } from '../i18n/pl';

/** Statusy rezerwacji blokujące usunięcie klienta */
const ACTIVE_RESERVATION_STATUSES = ['RESERVED', 'PENDING', 'CONFIRMED'] as const;

/** Company fields to include in Prisma select */
const COMPANY_FIELDS = [
  'companyName', 'nip', 'regon', 'companyEmail', 'companyPhone',
  'companyAddress', 'companyCity', 'companyPostalCode', 'industry', 'website',
] as const;

export class ClientService {

  // ═══════════════════════════════════════════════════════
  // CLIENT CRUD
  // ═══════════════════════════════════════════════════════

  async createClient(data: CreateClientDTO, userId: string): Promise<ClientResponse> {
    const clientType = data.clientType || 'INDIVIDUAL';

    // ── Shared validation ──
    if (data.email && !this.isValidEmail(data.email)) {
      throw new AppError(CLIENT.INVALID_EMAIL, 400);
    }

    if (!data.phone) {
      throw new AppError(CLIENT.PHONE_REQUIRED, 400);
    }

    const phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      throw new AppError(CLIENT.PHONE_MIN_DIGITS, 400);
    }

    // ── Company-specific validation ──
    if (clientType === 'COMPANY') {
      if (!data.companyName || data.companyName.trim() === '') {
        throw new AppError(CLIENT.COMPANY_NAME_REQUIRED, 400);
      }
      if (!data.nip || data.nip.trim() === '') {
        throw new AppError(CLIENT.NIP_REQUIRED, 400);
      }
      if (!this.isValidNip(data.nip)) {
        throw new AppError(CLIENT.NIP_INVALID, 400);
      }

      // Check NIP uniqueness
      const existingByNip = await prisma.client.findFirst({
        where: { nip: data.nip.replace(/\D/g, ''), isDeleted: false },
      });
      if (existingByNip) {
        throw new AppError(CLIENT.NIP_DUPLICATE(data.nip), 409);
      }
    }

    // ── Individual duplicate check ──
    if (clientType === 'INDIVIDUAL') {
      const existingClient = await prisma.client.findFirst({
        where: {
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          isDeleted: false,
        },
      });
      if (existingClient) {
        throw new AppError(`Klient ${data.firstName} ${data.lastName} z numerem ${data.phone} już istnieje`, 409);
      }
    }

    // ── Create client (with optional contacts in transaction) ──
    const client = await prisma.$transaction(async (tx) => {
      const created = await tx.client.create({
        data: {
          clientType,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email?.trim() || null,
          phone: data.phone.trim(),
          notes: data.notes?.trim() || null,
          // Company fields
          ...(clientType === 'COMPANY' ? {
            companyName: data.companyName!.trim(),
            nip: data.nip!.replace(/\D/g, ''),
            regon: data.regon?.replace(/\D/g, '') || null,
            companyEmail: data.companyEmail?.trim() || null,
            companyPhone: data.companyPhone?.trim() || null,
            companyAddress: data.companyAddress?.trim() || null,
            companyCity: data.companyCity?.trim() || null,
            companyPostalCode: data.companyPostalCode?.trim() || null,
            industry: data.industry?.trim() || null,
            website: data.website?.trim() || null,
          } : {}),
        },
      });

      // Create initial contacts for company
      if (clientType === 'COMPANY' && data.contacts && data.contacts.length > 0) {
        for (const contact of data.contacts) {
          await tx.clientContact.create({
            data: {
              clientId: created.id,
              firstName: contact.firstName.trim(),
              lastName: contact.lastName.trim(),
              email: contact.email?.trim() || null,
              phone: contact.phone?.trim() || null,
              role: contact.role?.trim() || null,
              isPrimary: contact.isPrimary || false,
            },
          });
        }
      }

      return tx.client.findUnique({
        where: { id: created.id },
        include: { contacts: true },
      });
    });

    // Audit log
    const description = clientType === 'COMPANY'
      ? `Utworzono klienta firmowego: ${data.companyName} (NIP: ${data.nip})`
      : `Utworzono klienta: ${data.firstName} ${data.lastName}`;

    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'CLIENT',
      entityId: client!.id,
      details: {
        description,
        data: {
          clientType,
          firstName: client!.firstName,
          lastName: client!.lastName,
          email: client!.email,
          phone: client!.phone,
          ...(clientType === 'COMPANY' ? {
            companyName: client!.companyName,
            nip: client!.nip,
          } : {}),
        },
      },
    });

    return client as unknown as ClientResponse;
  }

  async getClients(filters?: ClientFilters): Promise<ClientResponse[]> {
    const where: Prisma.ClientWhereInput = {
      isDeleted: false,
    };

    // Filter by clientType
    if (filters?.clientType) {
      where.clientType = filters.clientType;
    }

    // Search across personal + company fields
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { nip: { contains: filters.search.replace(/\D/g, ''), mode: 'insensitive' } },
      ];
    }

    // Admin option: show deleted too
    if (filters?.includeDeleted) {
      delete where.isDeleted;
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return clients as unknown as ClientResponse[];
  }

  async getClientById(id: string): Promise<ClientResponse> {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
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
            hall: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { reservations: true },
        },
      },
    });

    if (!client) {
      throw new AppError(CLIENT.NOT_FOUND, 404);
    }

    return client as unknown as ClientResponse;
  }

  async updateClient(id: string, data: UpdateClientDTO, userId: string): Promise<ClientResponse> {
    const existingClient = await prisma.client.findUnique({ where: { id } });

    if (!existingClient) {
      throw new AppError(CLIENT.NOT_FOUND, 404);
    }

    if (existingClient.isDeleted) {
      throw new AppError(CLIENT.ALREADY_DELETED, 409);
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new AppError(CLIENT.INVALID_EMAIL, 400);
    }

    // Phone validation
    if (data.phone) {
      const phoneDigits = data.phone.replace(/\D/g, '');
      if (phoneDigits.length < 9) {
        throw new AppError(CLIENT.PHONE_MIN_DIGITS, 400);
      }

      // Duplicate check for INDIVIDUAL
      if ((data.clientType || existingClient.clientType) === 'INDIVIDUAL') {
        const firstName = data.firstName || existingClient.firstName;
        const lastName = data.lastName || existingClient.lastName;

        const clientWithSameDetails = await prisma.client.findFirst({
          where: {
            phone: data.phone,
            firstName,
            lastName,
            id: { not: id },
            isDeleted: false,
          },
        });

        if (clientWithSameDetails) {
          throw new AppError(`Klient ${firstName} ${lastName} z numerem ${data.phone} już istnieje`, 409);
        }
      }
    }

    // NIP validation + uniqueness for COMPANY
    const effectiveType = data.clientType || existingClient.clientType;
    if (effectiveType === 'COMPANY') {
      if (data.nip) {
        if (!this.isValidNip(data.nip)) {
          throw new AppError(CLIENT.NIP_INVALID, 400);
        }
        const nipClean = data.nip.replace(/\D/g, '');
        const existingByNip = await prisma.client.findFirst({
          where: { nip: nipClean, id: { not: id }, isDeleted: false },
        });
        if (existingByNip) {
          throw new AppError(CLIENT.NIP_DUPLICATE(data.nip), 409);
        }
      }
    }

    // Build update payload
    const updateData: Prisma.ClientUpdateInput = {};

    if (data.clientType !== undefined) updateData.clientType = data.clientType;
    if (data.firstName) updateData.firstName = data.firstName.trim();
    if (data.lastName) updateData.lastName = data.lastName.trim();
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || undefined;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || undefined;

    // Company fields
    if (data.companyName !== undefined) updateData.companyName = data.companyName?.trim() || null;
    if (data.nip !== undefined) updateData.nip = data.nip?.replace(/\D/g, '') || null;
    if (data.regon !== undefined) updateData.regon = data.regon?.replace(/\D/g, '') || null;
    if (data.companyEmail !== undefined) updateData.companyEmail = data.companyEmail?.trim() || null;
    if (data.companyPhone !== undefined) updateData.companyPhone = data.companyPhone?.trim() || null;
    if (data.companyAddress !== undefined) updateData.companyAddress = data.companyAddress?.trim() || null;
    if (data.companyCity !== undefined) updateData.companyCity = data.companyCity?.trim() || null;
    if (data.companyPostalCode !== undefined) updateData.companyPostalCode = data.companyPostalCode?.trim() || null;
    if (data.industry !== undefined) updateData.industry = data.industry?.trim() || null;
    if (data.website !== undefined) updateData.website = data.website?.trim() || null;

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
      include: { contacts: true },
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
          description: `Zaktualizowano klienta: ${client.companyName || `${client.firstName} ${client.lastName}`}`,
          changes,
        },
      });
    }

    return client as unknown as ClientResponse;
  }

  async deleteClient(id: string, userId: string): Promise<void> {
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: { contacts: true },
    });

    if (!existingClient) {
      throw new AppError(CLIENT.NOT_FOUND, 404);
    }

    if (existingClient.isDeleted) {
      throw new AppError(CLIENT.ALREADY_DELETED, 409);
    }

    const activeReservationCount = await prisma.reservation.count({
      where: {
        clientId: id,
        status: { in: [...ACTIVE_RESERVATION_STATUSES] },
      },
    });

    if (activeReservationCount > 0) {
      throw new AppError(CLIENT.CANNOT_DELETE_WITH_ACTIVE_RESERVATIONS(activeReservationCount), 409);
    }

    await prisma.$transaction(async (tx) => {
      // Delete all contacts first
      await tx.clientContact.deleteMany({ where: { clientId: id } });

      // Soft-delete + anonymize personal & company data
      await tx.client.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          firstName: 'Usunięty',
          lastName: 'Klient',
          phone: '***',
          email: null,
          notes: null,
          // Anonymize company fields
          companyName: existingClient.clientType === 'COMPANY' ? 'Usunięta firma' : null,
          nip: null,
          regon: null,
          companyEmail: null,
          companyPhone: null,
          companyAddress: null,
          companyCity: null,
          companyPostalCode: null,
          industry: null,
          website: null,
        },
      });
    });

    // Audit log — preserve full data before anonymization
    await logChange({
      userId,
      action: 'SOFT_DELETE',
      entityType: 'CLIENT',
      entityId: id,
      details: {
        description: `Usunięto (soft-delete) klienta: ${existingClient.companyName || `${existingClient.firstName} ${existingClient.lastName}`}`,
        deletedData: {
          clientType: existingClient.clientType,
          firstName: existingClient.firstName,
          lastName: existingClient.lastName,
          email: existingClient.email,
          phone: existingClient.phone,
          notes: existingClient.notes,
          companyName: existingClient.companyName,
          nip: existingClient.nip,
          contacts: existingClient.contacts,
        },
      },
    });
  }

  async getClientReservationSummary(id: string): Promise<{
    active: number;
    completed: number;
    cancelled: number;
    archived: number;
    total: number;
  }> {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new AppError(CLIENT.NOT_FOUND, 404);
    }

    const [active, completed, cancelled, archived] = await Promise.all([
      prisma.reservation.count({
        where: { clientId: id, status: { in: [...ACTIVE_RESERVATION_STATUSES] } },
      }),
      prisma.reservation.count({
        where: { clientId: id, status: 'COMPLETED' },
      }),
      prisma.reservation.count({
        where: { clientId: id, status: 'CANCELLED' },
      }),
      prisma.reservation.count({
        where: { clientId: id, status: 'ARCHIVED' },
      }),
    ]);

    return {
      active,
      completed,
      cancelled,
      archived,
      total: active + completed + cancelled + archived,
    };
  }

  // ═══════════════════════════════════════════════════════
  // CLIENT CONTACTS CRUD
  // ═══════════════════════════════════════════════════════

  async addContact(clientId: string, data: CreateClientContactDTO, userId: string): Promise<ClientContactResponse> {
    const client = await prisma.client.findUnique({ where: { id: clientId } });

    if (!client) throw new AppError(CLIENT.NOT_FOUND, 404);
    if (client.clientType !== 'COMPANY') throw new AppError(CLIENT.CONTACT_ONLY_FOR_COMPANY, 400);
    if (!data.firstName || !data.lastName) throw new AppError(CLIENT.CONTACT_NAME_REQUIRED, 400);

    // If new contact is primary, unset other primaries
    if (data.isPrimary) {
      await prisma.clientContact.updateMany({
        where: { clientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.clientContact.create({
      data: {
        clientId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        role: data.role?.trim() || null,
        isPrimary: data.isPrimary || false,
      },
    });

    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'CLIENT_CONTACT',
      entityId: contact.id,
      details: {
        description: `Dodano osobę kontaktową ${data.firstName} ${data.lastName} do firmy ${client.companyName}`,
        data: { clientId, firstName: data.firstName, lastName: data.lastName, role: data.role },
      },
    });

    return contact as unknown as ClientContactResponse;
  }

  async updateContact(clientId: string, contactId: string, data: UpdateClientContactDTO, userId: string): Promise<ClientContactResponse> {
    const contact = await prisma.clientContact.findFirst({
      where: { id: contactId, clientId },
    });

    if (!contact) throw new AppError(CLIENT.CONTACT_NOT_FOUND, 404);

    // If setting as primary, unset others
    if (data.isPrimary) {
      await prisma.clientContact.updateMany({
        where: { clientId, isPrimary: true, id: { not: contactId } },
        data: { isPrimary: false },
      });
    }

    const updateData: Prisma.ClientContactUpdateInput = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.role !== undefined) updateData.role = data.role?.trim() || null;
    if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary;

    const updated = await prisma.clientContact.update({
      where: { id: contactId },
      data: updateData,
    });

    const changes = diffObjects(contact, updated);
    if (Object.keys(changes).length > 0) {
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'CLIENT_CONTACT',
        entityId: contactId,
        details: {
          description: `Zaktualizowano osobę kontaktową: ${updated.firstName} ${updated.lastName}`,
          changes,
        },
      });
    }

    return updated as unknown as ClientContactResponse;
  }

  async removeContact(clientId: string, contactId: string, userId: string): Promise<void> {
    const contact = await prisma.clientContact.findFirst({
      where: { id: contactId, clientId },
      include: { client: { select: { companyName: true } } },
    });

    if (!contact) throw new AppError(CLIENT.CONTACT_NOT_FOUND, 404);

    await prisma.clientContact.delete({ where: { id: contactId } });

    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'CLIENT_CONTACT',
      entityId: contactId,
      details: {
        description: `Usunięto osobę kontaktową ${contact.firstName} ${contact.lastName} z firmy ${contact.client.companyName}`,
        deletedData: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          role: contact.role,
        },
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  // VALIDATION HELPERS
  // ═══════════════════════════════════════════════════════

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Polish NIP validation (10 digits with check digit)
   */
  private isValidNip(nip: string): boolean {
    const digits = nip.replace(/\D/g, '');
    if (digits.length !== 10) return false;

    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }

    return sum % 11 === parseInt(digits[9]);
  }
}

export default new ClientService();
