/**
 * EventType Service
 * Business logic for event type management
 */
import { CreateEventTypeDTO, UpdateEventTypeDTO, EventTypeResponse } from '../types/eventType.types';
export declare class EventTypeService {
    /**
     * Create a new event type
     */
    createEventType(data: CreateEventTypeDTO): Promise<EventTypeResponse>;
    /**
     * Get all event types
     */
    getEventTypes(): Promise<EventTypeResponse[]>;
    /**
     * Get event type by ID
     */
    getEventTypeById(id: string): Promise<EventTypeResponse>;
    /**
     * Update event type
     */
    updateEventType(id: string, data: UpdateEventTypeDTO): Promise<EventTypeResponse>;
    /**
     * Delete event type
     */
    deleteEventType(id: string): Promise<void>;
}
declare const _default: EventTypeService;
export default _default;
//# sourceMappingURL=eventType.service.d.ts.map