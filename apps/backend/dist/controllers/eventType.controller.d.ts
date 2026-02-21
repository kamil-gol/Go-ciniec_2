/**
 * EventType Controller
 * Full CRUD + stats for event type management
 */
import { Request, Response } from 'express';
export declare class EventTypeController {
    createEventType(req: Request, res: Response): Promise<void>;
    getEventTypes(req: Request, res: Response): Promise<void>;
    getEventTypeById(req: Request, res: Response): Promise<void>;
    updateEventType(req: Request, res: Response): Promise<void>;
    deleteEventType(req: Request, res: Response): Promise<void>;
    getEventTypeStats(_req: Request, res: Response): Promise<void>;
    getPredefinedColors(_req: Request, res: Response): Promise<void>;
}
declare const _default: EventTypeController;
export default _default;
//# sourceMappingURL=eventType.controller.d.ts.map