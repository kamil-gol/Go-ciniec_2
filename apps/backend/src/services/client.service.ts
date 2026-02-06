/**
 * Client Service
 * Business logic for client management
 */

import { PrismaClient } from '@prisma/client';
import { CreateClientDTO, UpdateClientDTO, ClientFilters, ClientResponse } from '../types/client.types';

const prisma = new PrismaClient();

export class ClientService {
  /**
   * Create a new client
   */
  async createClient(data: CreateClientDTO): Promise<ClientResponse> {
    // Validate email
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Valid email is required');
    }

    // Validate phone if provided
    if (data.phone && data.phone.trim().length < 9) {
      throw new Error('Phone number must be at least 9 digits');
    }

    // Check if client with same email exists
    const existingClient = await prisma.client.findFirst({
      where: { email: data.email }
    });

    if (existingClient) {
      throw new Error('Client with this email already exists');
    }

    const client = await prisma.client.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null
      }
    });

    return client as any;
  }

  /**
   * Get all clients with optional filters
   */
  async getClients(filters?: ClientFilters): Promise<ClientResponse[]> {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    return clients as any[];
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string): Promise<ClientResponse> {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        reservations: {
          take: 5,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            status: true,
            eventType: { select: { name: true } },
            hall: { select: { name: true } }
          }
        }
      }
    });

    if (!client) {
      throw new Error('Client not found');
    }

    return client as any;
  }

  /**
   * Update client
   */
  async updateClient(id: string, data: UpdateClientDTO): Promise<ClientResponse> {
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Validate email if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Check email uniqueness if email is being changed
    if (data.email && data.email !== existingClient.email) {
      const clientWithSameEmail = await prisma.client.findFirst({
        where: { 
          email: data.email,
          id: { not: id }
        }
      });

      if (clientWithSameEmail) {
        throw new Error('Client with this email already exists');
      }
    }

    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName.trim();
    if (data.lastName) updateData.lastName = data.lastName.trim();
    if (data.email) updateData.email = data.email.trim();
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

    const client = await prisma.client.update({
      where: { id },
      data: updateData
    });

    return client as any;
  }

  /**
   * Delete client (hard delete)
   */
  async deleteClient(id: string): Promise<void> {
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Check if client has any reservations
    const reservationCount = await prisma.reservation.count({
      where: { clientId: id }
    });

    if (reservationCount > 0) {
      throw new Error('Cannot delete client with existing reservations');
    }

    // Hard delete
    await prisma.client.delete({
      where: { id }
    });
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default new ClientService();
