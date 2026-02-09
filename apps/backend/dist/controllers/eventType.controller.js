/**
 * EventType Controller
 * Handle HTTP requests for event type management
 */
import eventTypeService from '../services/eventType.service';
export class EventTypeController {
    /**
     * Create a new event type
     * POST /api/event-types
     */
    async createEventType(req, res) {
        try {
            const data = req.body;
            // Validate required fields
            if (!data.name) {
                res.status(400).json({
                    success: false,
                    error: 'Event type name is required'
                });
                return;
            }
            const eventType = await eventTypeService.createEventType(data);
            res.status(201).json({
                success: true,
                data: eventType,
                message: 'Event type created successfully'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to create event type'
            });
        }
    }
    /**
     * Get all event types
     * GET /api/event-types
     */
    async getEventTypes(req, res) {
        try {
            const eventTypes = await eventTypeService.getEventTypes();
            res.status(200).json({
                success: true,
                data: eventTypes,
                count: eventTypes.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch event types'
            });
        }
    }
    /**
     * Get event type by ID
     * GET /api/event-types/:id
     */
    async getEventTypeById(req, res) {
        try {
            const { id } = req.params;
            const eventType = await eventTypeService.getEventTypeById(id);
            res.status(200).json({
                success: true,
                data: eventType
            });
        }
        catch (error) {
            const statusCode = error.message === 'Event type not found' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to fetch event type'
            });
        }
    }
    /**
     * Update event type
     * PUT /api/event-types/:id
     */
    async updateEventType(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const eventType = await eventTypeService.updateEventType(id, data);
            res.status(200).json({
                success: true,
                data: eventType,
                message: 'Event type updated successfully'
            });
        }
        catch (error) {
            const statusCode = error.message === 'Event type not found' ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to update event type'
            });
        }
    }
    /**
     * Delete event type
     * DELETE /api/event-types/:id
     */
    async deleteEventType(req, res) {
        try {
            const { id } = req.params;
            await eventTypeService.deleteEventType(id);
            res.status(200).json({
                success: true,
                message: 'Event type deleted successfully'
            });
        }
        catch (error) {
            const statusCode = error.message === 'Event type not found' ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to delete event type'
            });
        }
    }
}
export default new EventTypeController();
//# sourceMappingURL=eventType.controller.js.map