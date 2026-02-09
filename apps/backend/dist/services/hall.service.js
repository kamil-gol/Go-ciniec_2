/**
 * Hall Service
 * Business logic for hall management
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export class HallService {
    /**
     * Create a new hall
     */
    async createHall(data) {
        // Validate capacity
        if (data.capacity <= 0) {
            throw new Error('Capacity must be greater than 0');
        }
        // Validate price
        if (data.pricePerPerson < 0) {
            throw new Error('Price per person cannot be negative');
        }
        // Check if hall with same name exists
        const existingHall = await prisma.hall.findFirst({
            where: { name: data.name }
        });
        if (existingHall) {
            throw new Error('Hall with this name already exists');
        }
        const hall = await prisma.hall.create({
            data: {
                name: data.name,
                capacity: data.capacity,
                description: data.description || null,
                pricePerPerson: data.pricePerPerson,
                isActive: data.isActive ?? true
            }
        });
        return hall;
    }
    /**
     * Get all halls with optional filters
     */
    async getHalls(filters) {
        const where = {};
        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        if (filters?.minCapacity !== undefined) {
            where.capacity = { ...where.capacity, gte: filters.minCapacity };
        }
        if (filters?.maxCapacity !== undefined) {
            where.capacity = { ...where.capacity, lte: filters.maxCapacity };
        }
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }
        const halls = await prisma.hall.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        return halls;
    }
    /**
     * Get hall by ID
     */
    async getHallById(id) {
        const hall = await prisma.hall.findUnique({
            where: { id }
        });
        if (!hall) {
            throw new Error('Hall not found');
        }
        return hall;
    }
    /**
     * Update hall
     */
    async updateHall(id, data) {
        // Check if hall exists
        const existingHall = await prisma.hall.findUnique({
            where: { id }
        });
        if (!existingHall) {
            throw new Error('Hall not found');
        }
        // Validate capacity if provided
        if (data.capacity !== undefined && data.capacity <= 0) {
            throw new Error('Capacity must be greater than 0');
        }
        // Validate price if provided
        if (data.pricePerPerson !== undefined && data.pricePerPerson < 0) {
            throw new Error('Price per person cannot be negative');
        }
        // Check name uniqueness if name is being changed
        if (data.name && data.name !== existingHall.name) {
            const hallWithSameName = await prisma.hall.findFirst({
                where: {
                    name: data.name,
                    id: { not: id }
                }
            });
            if (hallWithSameName) {
                throw new Error('Hall with this name already exists');
            }
        }
        const hall = await prisma.hall.update({
            where: { id },
            data
        });
        return hall;
    }
    /**
     * Soft delete hall (set isActive to false)
     */
    async deleteHall(id) {
        // Check if hall exists
        const existingHall = await prisma.hall.findUnique({
            where: { id }
        });
        if (!existingHall) {
            throw new Error('Hall not found');
        }
        // Check if hall has active reservations
        const activeReservations = await prisma.reservation.count({
            where: {
                hallId: id,
                status: 'CONFIRMED',
                date: { gte: new Date() }
            }
        });
        if (activeReservations > 0) {
            throw new Error('Cannot delete hall with active reservations');
        }
        // Soft delete
        await prisma.hall.update({
            where: { id },
            data: { isActive: false }
        });
    }
}
export default new HallService();
//# sourceMappingURL=hall.service.js.map