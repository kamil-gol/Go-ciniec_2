/**
 * Client Contacts Service
 * CRUD operations for client contact persons (company clients only)
 * Extracted from client.service.ts
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma-client';
import {
  CreateClientContactDTO,
  UpdateClientContactDTO,
  ClientContactResponse,
} from '../types/client.types';
import { logChange, diffObjects } from '../utils/audit-logger';
import { AppError } from '../utils/AppError';
import { CLIENT } from '../i18n/pl';

export class ClientContactsService {

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
        description: `Dodano osob\u0119 kontaktow\u0105 ${data.firstName} ${data.lastName} do firmy ${client.companyName}`,
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
          description: `Zaktualizowano osob\u0119 kontaktow\u0105: ${updated.firstName} ${updated.lastName}`,
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
        description: `Usuni\u0119to osob\u0119 kontaktow\u0105 ${contact.firstName} ${contact.lastName} z firmy ${contact.client.companyName}`,
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
}

export default new ClientContactsService();
