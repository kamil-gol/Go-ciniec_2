/**
 * EventType Service
 * Business logic for event type management
 */
import { prisma } from '@/lib/prisma';
import { logChange, diffObjects } from '../utils/audit-logger';
// Predefined colors for event types
const PREDEFINED_COLORS = [
    '#EF4444', // red
    '#F97316', // orange
    '#EAB308', // yellow
    '#22C55E', // green
    '#06B6D4', // cyan
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#F43F5E', // rose
    '#14B8A6', // teal
];
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
function isValidColor(color) {
    return HEX_COLOR_REGEX.test(color);
}
export class EventTypeService {
    async createEventType(data, userId) {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Event type name is required');
        }
        if (data.color && !isValidColor(data.color)) {
            throw new Error('Invalid color format. Use hex format (e.g. #FF5733)');
        }
        const existingType = await prisma.eventType.findFirst({
            where: { name: data.name.trim() }
        });
        if (existingType) {
            throw new Error('Event type with this name already exists');
        }
        const eventType = await prisma.eventType.create({
            data: {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                color: data.color || null,
                isActive: data.isActive !== undefined ? data.isActive : true,
            }
        });
        // Audit log
        await logChange({
            userId,
            action: 'CREATE',
            entityType: 'EVENT_TYPE',
            entityId: eventType.id,
            details: {
                description: `Utworzono typ wydarzenia: ${eventType.name}`,
                data: {
                    name: eventType.name,
                    color: eventType.color,
                    isActive: eventType.isActive
                }
            }
        });
        return eventType;
    }
    async getEventTypes(activeOnly = false) {
        const where = activeOnly ? { isActive: true } : {};
        const eventTypes = await prisma.eventType.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        return eventTypes;
    }
    async getEventTypeById(id) {
        const eventType = await prisma.eventType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        reservations: true,
                        menuTemplates: true,
                    }
                }
            }
        });
        if (!eventType)
            throw new Error('Event type not found');
        return eventType;
    }
    async updateEventType(id, data, userId) {
        const existingType = await prisma.eventType.findUnique({ where: { id } });
        if (!existingType)
            throw new Error('Event type not found');
        if (data.name !== undefined && data.name.trim().length === 0) {
            throw new Error('Event type name cannot be empty');
        }
        if (data.color !== undefined && data.color !== null && !isValidColor(data.color)) {
            throw new Error('Invalid color format. Use hex format (e.g. #FF5733)');
        }
        if (data.name && data.name.trim() !== existingType.name) {
            const typeWithSameName = await prisma.eventType.findFirst({
                where: { name: data.name.trim(), id: { not: id } }
            });
            if (typeWithSameName)
                throw new Error('Event type with this name already exists');
        }
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name.trim();
        if (data.description !== undefined)
            updateData.description = data.description?.trim() || null;
        if (data.color !== undefined)
            updateData.color = data.color;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        const eventType = await prisma.eventType.update({
            where: { id },
            data: updateData
        });
        // Audit log
        const changes = diffObjects(existingType, eventType);
        if (Object.keys(changes).length > 0) {
            await logChange({
                userId,
                action: 'UPDATE',
                entityType: 'EVENT_TYPE',
                entityId: eventType.id,
                details: {
                    description: `Zaktualizowano typ wydarzenia: ${eventType.name}`,
                    changes
                }
            });
        }
        return eventType;
    }
    async toggleActive(id, userId) {
        const existingType = await prisma.eventType.findUnique({ where: { id } });
        if (!existingType)
            throw new Error('Event type not found');
        const eventType = await prisma.eventType.update({
            where: { id },
            data: { isActive: !existingType.isActive }
        });
        // Audit log
        await logChange({
            userId,
            action: 'TOGGLE_ACTIVE',
            entityType: 'EVENT_TYPE',
            entityId: eventType.id,
            details: {
                description: `${eventType.isActive ? 'Aktywowano' : 'Dezaktywowano'} typ wydarzenia: ${eventType.name}`,
                oldValue: existingType.isActive,
                newValue: eventType.isActive
            }
        });
        return eventType;
    }
    async deleteEventType(id, userId) {
        const existingType = await prisma.eventType.findUnique({ where: { id } });
        if (!existingType)
            throw new Error('Event type not found');
        const reservationCount = await prisma.reservation.count({
            where: { eventTypeId: id }
        });
        if (reservationCount > 0) {
            throw new Error(`Cannot delete event type that is used in ${reservationCount} reservation(s)`);
        }
        const menuTemplateCount = await prisma.menuTemplate.count({
            where: { eventTypeId: id }
        });
        if (menuTemplateCount > 0) {
            throw new Error(`Cannot delete event type that has ${menuTemplateCount} menu template(s). Remove templates first.`);
        }
        await prisma.eventType.delete({ where: { id } });
        // Audit log
        await logChange({
            userId,
            action: 'DELETE',
            entityType: 'EVENT_TYPE',
            entityId: id,
            details: {
                description: `Usunięto typ wydarzenia: ${existingType.name}`,
                deletedData: {
                    name: existingType.name,
                    color: existingType.color
                }
            }
        });
    }
    async getEventTypeStats() {
        const eventTypes = await prisma.eventType.findMany({
            include: {
                _count: {
                    select: {
                        reservations: true,
                        menuTemplates: true,
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        return eventTypes.map(et => ({
            id: et.id,
            name: et.name,
            color: et.color,
            isActive: et.isActive,
            reservationCount: et._count.reservations,
            menuTemplateCount: et._count.menuTemplates,
        }));
    }
    getPredefinedColors() {
        return PREDEFINED_COLORS;
    }
}
export default new EventTypeService();
//# sourceMappingURL=eventType.service.js.map