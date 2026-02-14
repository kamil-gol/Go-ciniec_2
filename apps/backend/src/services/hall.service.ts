/**
 * Hall Service
 * Business logic for hall management
 * UPDATED: Added isWholeVenue protection (cannot delete/deactivate whole venue hall)
 * UPDATED: Whole venue hall name and isWholeVenue flag cannot be changed
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
   * Create new hall
   */
  async createHall(data: CreateHallDTO): Promise<HallResponse> {
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
   * PROTECTION: Whole venue hall cannot be deactivated or renamed
   */
  async updateHall(id: string, data: UpdateHallDTO): Promise<HallResponse> {
    const existingHall = await prisma.hall.findUnique({ where: { id } });
    if (!existingHall) throw new Error('Hall not found');

    // Protect whole venue hall
    if (existingHall.isWholeVenue) {
      if (data.isActive === false) {
        throw new Error('Sala "Ca\u0142y Obiekt" nie mo\u017ce by\u0107 dezaktywowana');
      }
      if (data.name !== undefined && data.name !== existingHall.name) {
        throw new Error('Nie mo\u017cna zmieni\u0107 nazwy sali "Ca\u0142y Obiekt"');
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
   * PROTECTION: Whole venue hall cannot be deleted
   */
  async deleteHall(id: string): Promise<void> {
    const existingHall = await prisma.hall.findUnique({ where: { id } });
    if (!existingHall) throw new Error('Hall not found');

    if (existingHall.isWholeVenue) {
      throw new Error('Sala "Ca\u0142y Obiekt" nie mo\u017ce by\u0107 usuni\u0119ta');
    }

    await prisma.hall.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export default new HallService();
