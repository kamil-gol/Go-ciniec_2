/**
 * Hall Service
 * Business logic for hall management
 * UPDATED: Prisma singleton
 */

import { prisma } from '@/lib/prisma';
import { CreateHallDTO, UpdateHallDTO, HallFilters, HallResponse } from '../types/hall.types';

export class HallService {
  async createHall(data: CreateHallDTO): Promise<HallResponse> {
    if (data.capacity <= 0) throw new Error('Capacity must be greater than 0');
    if (data.pricePerPerson < 0) throw new Error('Price per person cannot be negative');

    const existingHall = await prisma.hall.findFirst({ where: { name: data.name } });
    if (existingHall) throw new Error('Hall with this name already exists');

    const hall = await prisma.hall.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        description: data.description || null,
        pricePerPerson: data.pricePerPerson,
        isActive: data.isActive ?? true
      }
    });

    return hall as any;
  }

  async getHalls(filters?: HallFilters): Promise<HallResponse[]> {
    const where: any = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.minCapacity !== undefined) where.capacity = { ...where.capacity, gte: filters.minCapacity };
    if (filters?.maxCapacity !== undefined) where.capacity = { ...where.capacity, lte: filters.maxCapacity };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const halls = await prisma.hall.findMany({ where, orderBy: { name: 'asc' } });
    return halls as any[];
  }

  async getHallById(id: string): Promise<HallResponse> {
    const hall = await prisma.hall.findUnique({ where: { id } });
    if (!hall) throw new Error('Hall not found');
    return hall as any;
  }

  async updateHall(id: string, data: UpdateHallDTO): Promise<HallResponse> {
    const existingHall = await prisma.hall.findUnique({ where: { id } });
    if (!existingHall) throw new Error('Hall not found');

    if (data.capacity !== undefined && data.capacity <= 0) throw new Error('Capacity must be greater than 0');
    if (data.pricePerPerson !== undefined && data.pricePerPerson < 0) throw new Error('Price per person cannot be negative');

    if (data.name && data.name !== existingHall.name) {
      const hallWithSameName = await prisma.hall.findFirst({
        where: { name: data.name, id: { not: id } }
      });
      if (hallWithSameName) throw new Error('Hall with this name already exists');
    }

    const hall = await prisma.hall.update({ where: { id }, data });
    return hall as any;
  }

  async deleteHall(id: string): Promise<void> {
    const existingHall = await prisma.hall.findUnique({ where: { id } });
    if (!existingHall) throw new Error('Hall not found');

    const activeReservations = await prisma.reservation.count({
      where: { hallId: id, status: 'CONFIRMED', date: { gte: new Date() } }
    });

    if (activeReservations > 0) throw new Error('Cannot delete hall with active reservations');
    await prisma.hall.update({ where: { id }, data: { isActive: false } });
  }
}

export default new HallService();
