/**
 * Hall Service
 * Business logic for hall management
 * UPDATED: isWholeVenue protection — cannot delete/deactivate "Cały Obiekt"
 */

import { prisma } from '@/lib/prisma';
import { CreateHallDTO, UpdateHallDTO, HallResponse } from '../types/hall.types';

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
    if (!hall) throw new Error('Hall not found');
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
   * Create new hall
   */
  async createHall(data: CreateHallDTO): Promise<HallResponse> {
    // Only one hall can be isWholeVenue
    if (data.isWholeVenue) {
      const existing = await prisma.hall.findFirst({ where: { isWholeVenue: true } });
      if (existing) {
        throw new Error('Sala "Cały Obiekt" już istnieje. Może być tylko jedna.');
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
      },
    });

    return hall as any;
  }

  /**
   * Update hall
   * PROTECTED: Cannot deactivate or rename isWholeVenue hall
   */
  async updateHall(id: string, data: UpdateHallDTO): Promise<HallResponse> {
    const existingHall = await prisma.hall.findUnique({ where: { id } });
    if (!existingHall) throw new Error('Hall not found');

    // Protection for "Cały Obiekt"
    if (existingHall.isWholeVenue) {
      if (data.isActive === false) {
        throw new Error('Nie można dezaktywować sali "Cały Obiekt". Jest wymagana do logiki rezerwacji.');
      }
      if (data.name !== undefined && data.name !== existingHall.name) {
        throw new Error('Nie można zmienić nazwy sali "Cały Obiekt".');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const hall = await prisma.hall.update({
      where: { id },
      data: updateData,
    });

    return hall as any;
  }

  /**
   * Delete hall (soft delete - deactivate)
   * PROTECTED: Cannot delete isWholeVenue hall
   */
  async deleteHall(id: string): Promise<void> {
    const existingHall = await prisma.hall.findUnique({ where: { id } });
    if (!existingHall) throw new Error('Hall not found');

    if (existingHall.isWholeVenue) {
      throw new Error('Nie można usunąć sali "Cały Obiekt". Jest wymagana do logiki rezerwacji.');
    }

    await prisma.hall.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export default new HallService();
