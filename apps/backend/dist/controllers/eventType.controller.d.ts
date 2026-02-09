/**
 * EventType Controller
 * Handle HTTP requests for event type management
 */
import { Request, Response } from 'express';
export declare class EventTypeController {
    /**
     * Create a new event type
     * POST /api/event-types
     */
    createEventType(req: Request, res: Response): Promise<void>;
    /**
     * Get all event types
     * GET /api/event-types
     */
    getEventTypes(req: Request, res: Response): Promise<void>;
    /**
     * Get event type by ID
     * GET /api/event-types/:id
     */
    getEventTypeById(req: Request, res: Response): Promise<void>;
    /**
     * Update event type
     * PUT /api/event-types/:id
     */
    updateEventType(req: Request, res: Response): Promise<void>;
    /**
     * Delete event type
     * DELETE /api/event-types/:id
     */
    deleteEventType(req: Request, res: Response): Promise<void>;
}
declare const _default: EventTypeController;
export default _default;
//# sourceMappingURL=eventType.controller.d.ts.map