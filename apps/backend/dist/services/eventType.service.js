/**
 * EventType Service
 * Business logic for event type management
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export class EventTypeService {
    /**
     * Create a new event type
     */
    async createEventType(data) {
        // Validate name
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Event type name is required');
        }
        // Check if event type with same name exists
        const existingType = await prisma.eventType.findFirst({
            where: { name: data.name.trim() }
        });
        if (existingType) {
            throw new Error('Event type with this name already exists');
        }
        const eventType = await prisma.eventType.create({
            data: {
                name: data.name.trim()
            }
        });
        return eventType;
    }
    /**
     * Get all event types
     */
    async getEventTypes() {
        const eventTypes = await prisma.eventType.findMany({
            orderBy: { name: 'asc' }
        });
        return eventTypes;
    }
    /**
     * Get event type by ID
     */
    async getEventTypeById(id) {
        const eventType = await prisma.eventType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { reservations: true }
                }
            }
        });
        if (!eventType) {
            throw new Error('Event type not found');
        }
        return eventType;
    }
    /**
     * Update event type
     */
    async updateEventType(id, data) {
        // Check if event type exists
        const existingType = await prisma.eventType.findUnique({
            where: { id }
        });
        if (!existingType) {
            throw new Error('Event type not found');
        }
        // Validate name if provided
        if (data.name && data.name.trim().length === 0) {
            throw new Error('Event type name cannot be empty');
        }
        // Check name uniqueness if name is being changed
        if (data.name && data.name.trim() !== existingType.name) {
            const typeWithSameName = await prisma.eventType.findFirst({
                where: {
                    name: data.name.trim(),
                    id: { not: id }
                }
            });
            if (typeWithSameName) {
                throw new Error('Event type with this name already exists');
            }
        }
        const eventType = await prisma.eventType.update({
            where: { id },
            data: {
                name: data.name?.trim()
            }
        });
        return eventType;
    }
    /**
     * Delete event type
     */
    async deleteEventType(id) {
        // Check if event type exists
        const existingType = await prisma.eventType.findUnique({
            where: { id }
        });
        if (!existingType) {
            throw new Error('Event type not found');
        }
        // Check if event type is used in reservations
        const reservationCount = await prisma.reservation.count({
            where: { eventTypeId: id }
        });
        if (reservationCount > 0) {
            throw new Error(`Cannot delete event type that is used in ${reservationCount} reservation(s)`);
        }
        // Hard delete
        await prisma.eventType.delete({
            where: { id }
        });
    }
}
export default new EventTypeService();
//# sourceMappingURL=eventType.service.js.map