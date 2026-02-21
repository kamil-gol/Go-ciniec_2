/**
 * EventType Controller
 * Full CRUD + stats for event type management
 */
import eventTypeService from '../services/eventType.service';
import { AppError } from '../utils/AppError';
export class EventTypeController {
    async createEventType(req, res) {
        const { name, description, color, isActive } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }
        if (!name) {
            throw AppError.badRequest('Event type name is required');
        }
        const data = { name, description, color, isActive };
        const eventType = await eventTypeService.createEventType(data, userId);
        res.status(201).json({
            success: true,
            data: eventType,
            message: 'Event type created successfully'
        });
    }
    async getEventTypes(req, res) {
        const activeOnly = req.query.isActive === 'true';
        const eventTypes = await eventTypeService.getEventTypes(activeOnly);
        res.status(200).json({
            success: true,
            data: eventTypes,
            count: eventTypes.length
        });
    }
    async getEventTypeById(req, res) {
        const { id } = req.params;
        const eventType = await eventTypeService.getEventTypeById(id);
        if (!eventType)
            throw AppError.notFound('Event type');
        res.status(200).json({
            success: true,
            data: eventType
        });
    }
    async updateEventType(req, res) {
        const { id } = req.params;
        const { name, description, color, isActive } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }
        const data = {};
        if (name !== undefined)
            data.name = name;
        if (description !== undefined)
            data.description = description;
        if (color !== undefined)
            data.color = color;
        if (isActive !== undefined)
            data.isActive = isActive;
        const eventType = await eventTypeService.updateEventType(id, data, userId);
        res.status(200).json({
            success: true,
            data: eventType,
            message: 'Event type updated successfully'
        });
    }
    async deleteEventType(req, res) {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }
        await eventTypeService.deleteEventType(id, userId);
        res.status(200).json({
            success: true,
            message: 'Event type deleted successfully'
        });
    }
    async getEventTypeStats(_req, res) {
        const stats = await eventTypeService.getEventTypeStats();
        res.status(200).json({
            success: true,
            data: stats,
            count: stats.length
        });
    }
    async getPredefinedColors(_req, res) {
        const colors = eventTypeService.getPredefinedColors();
        res.status(200).json({
            success: true,
            data: colors
        });
    }
}
export default new EventTypeController();
//# sourceMappingURL=eventType.controller.js.map