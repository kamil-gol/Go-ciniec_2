/**
 * Hall Service
 * Business logic for hall management
 * UPDATED: isWholeVenue protection — cannot delete/deactivate "Cały Obiekt"
 * UPDATED: allowWithWholeVenue — halls that can coexist with whole venue bookings
 * UPDATED: #165 — allowMultipleBookings + getOccupiedCapacity()
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */

import { prisma } from '@/lib/prisma';
import { CreateHallDTO, UpdateHallDTO, HallResponse } from '../types/hall.types';
import { logChange, diffObjects } from '../utils/audit-logger';
import { AppError } from '../utils/AppError';
import { HALL } from '../i18n/pl';

export class HallService {
  /**
   * Get all halls with optional filters
   */
  async getHalls(filters?: { isActive?: boolean; search?: string }): Promise<HallResponse[]> {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const halls = await prisma.hall.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return halls as any[];
  }

  /**
   * Get hall by ID
   */
  async getHallById(id: string): Promise<HallResponse> {
    const hall = await prisma.hall.findUnique({ where: { id } });
    if (!hall) throw new AppError(HALL.NOT_FOUND, 404);
    return hall as any;
  }

  /**
   * Get the "whole venue" hall
   */
  async getWholeVenueHall(): Promise<HallResponse | null> {
    const hall = await prisma.hall.findFirst({ where: { isWholeVenue: true } });
    return hall as any;
  }

  /**
   * #165: Get occupied capacity for a hall in a given time range.
   * Returns total capacity, occupied capacity, available capacity,
   * and list of overlapping reservations.
   */
  async getOccupiedCapacity(
    hallId: string,
    startDateTime: string,
    endDateTime: string,
    excludeReservationId?: string
  ): Promise<{
    totalCapacity: number;
    occupiedCapacity: number;
    availableCapacity: number;
    allowMultipleBookings: boolean;
    overlappingReservations: Array<{
      id: string;
      guests: number;
      clientName: string;
      startDateTime: string | null;
      endDateTime: string | null;
    }>;
  }> {
    const hall = await prisma.hall.findUnique({ where: { id: hallId } });
    if (!hall) throw new AppError(HALL.NOT_FOUND, 404);

    const startDT = new Date(startDateTime);
    const endDT = new Date(endDateTime);

    const where: any = {
      hallId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      archivedAt: null,
      AND: [
        { startDateTime: { lt: endDT } },
        { endDateTime: { gt: startDT } },
      ],
    };
    if (excludeReservationId) where.id = { not: excludeReservationId };

    const overlapping = await prisma.reservation.findMany({
      where,
      select: {
        id: true,
        guests: true,
        startDateTime: true,
        endDateTime: true,
        client: {
          select: { firstName: true, lastName: true, companyName: true, clientType: true },
        },
      },
    });

    const occupiedCapacity = overlapping.reduce((sum, r) => sum + (r.guests || 0), 0);

    return {
      totalCapacity: hall.capacity,
      occupiedCapacity,
      availableCapacity: Math.max(0, hall.capacity - occupiedCapacity),
      allowMultipleBookings: hall.allowMultipleBookings,
      overlappingReservations: overlapping.map((r) => ({
        id: r.id,
        guests: r.guests || 0,
        clientName:
          r.client.clientType === 'COMPANY' && r.client.companyName
            ? r.client.companyName
            : `${r.client.firstName} ${r.client.lastName}`,
        startDateTime: r.startDateTime?.toISOString() || null,
        endDateTime: r.endDateTime?.toISOString() || null,
      })),
    };
  }

  /**
   * Create new hall
   */
  async createHall(data: CreateHallDTO, userId: string): Promise<HallResponse> {
    // Only one hall can be isWholeVenue
    if (data.isWholeVenue) {
      const existing = await prisma.hall.findFirst({ where: { isWholeVenue: true } });
      if (existing) {
        throw new AppError('Sala "Ca\u0142y Obiekt" ju\u017C istnieje. Mo\u017Ce by\u0107 tylko jedna.', 409);
      }
    }

    const hall = await prisma.hall.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        description: data.description || null,
        amenities: data.amenities || [],
        images: data.images || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        isWholeVenue: data.isWholeVenue || false,
        allowWithWholeVenue: data.allowWithWholeVenue || false,
        allowMultipleBookings: data.allowMultipleBookings !== undefined ? data.allowMultipleBookings : true,
      },
    });

    // Audit log
    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'HALL',
      entityId: hall.id,
      details: {
        description: `Utworzono sal\u0119: ${hall.name}`,
        data: {
          name: hall.name,
          capacity: hall.capacity,
          isWholeVenue: hall.isWholeVenue,
          allowWithWholeVenue: hall.allowWithWholeVenue,
          allowMultipleBookings: hall.allowMultipleBookings,
          isActive: hall.isActive,
        },
      },
    });

    return hall as any;
  }

  /**
   * Update hall
   * PROTECTED: Cannot deactivate or rename isWholeVenue hall
   */
  async updateHall(id: string, data: UpdateHallDTO, userId: string): Promise<HallResponse> {
    const existingHall = await prisma.hall.findUnique({ where: { id } });
    if (!existingHall) throw new AppError(HALL.NOT_FOUND, 404);

    // Protection for "Ca\u0142y Obiekt"
    if (existingHall.isWholeVenue) {
      if (data.isActive === false) {
        throw new AppError('Nie mo\u017Cna dezaktywowa\u0107 sali "Ca\u0142y Obiekt". Jest wymagana do logiki rezerwacji.', 403);
      }
      if (data.name !== undefined && data.name !== existingHall.name) {
        throw new AppError('Nie mo\u017Cna zmieni\u0107 nazwy sali "Ca\u0142y Obiekt".', 403);
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.allowWithWholeVenue !== undefined) updateData.allowWithWholeVenue = data.allowWithWholeVenue;
    if (data.allowMultipleBookings !== undefined) updateData.allowMultipleBookings = data.allowMultipleBookings;

    const hall = await prisma.hall.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    const changes = diffObjects(existingHall, hall);
    if (Object.keys(changes).length > 0) {
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'HALL',
        entityId: hall.id,
        details: {
          description: `Zaktualizowano sal\u0119: ${hall.name}`,
          changes,
        },
      });
    }

    return hall as any;
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string, userId: string): Promise<HallResponse> {
    const existingHall = await prisma.hall.findUnique({ where: { id } });
    if (!existingHall) throw new AppError(HALL.NOT_FOUND, 404);

    if (existingHall.isWholeVenue) {
      throw new AppError('Nie mo\u017Cna dezaktywowa\u0107 sali "Ca\u0142y Obiekt".', 403);
    }

    const hall = await prisma.hall.update({
      where: { id },
      data: { isActive: !existingHall.isActive },
    });

    // Audit log
    await logChange({
      userId,
      action: 'TOGGLE_ACTIVE',
      entityType: 'HALL',
      entityId: hall.id,
      details: {
        description: `${hall.isActive ? 'Aktywowano' : 'Dezaktywowano'} sal\u0119: ${hall.name}`,
        oldValue: existingHall.isActive,
        newValue: hall.isActive,
      },
    });

    return hall as any;
  }

  /**
   * Delete hall (soft delete - deactivate)
   * PROTECTED: Cannot delete isWholeVenue hall
   */
  async deleteHall(id: string, userId: string): Promise<void> {
    const existingHall = await prisma.hall.findUnique({ where: { id } });
    if (!existingHall) throw new AppError(HALL.NOT_FOUND, 404);

    if (existingHall.isWholeVenue) {
      throw new AppError('Nie mo\u017Cna usun\u0105\u0107 sali "Ca\u0142y Obiekt". Jest wymagana do logiki rezerwacji.', 403);
    }

    await prisma.hall.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'HALL',
      entityId: id,
      details: {
        description: `Usuni\u0119to (dezaktywowano) sal\u0119: ${existingHall.name}`,
        deletedData: {
          name: existingHall.name,
          capacity: existingHall.capacity,
        },
      },
    });
  }
}

export default new HallService();
