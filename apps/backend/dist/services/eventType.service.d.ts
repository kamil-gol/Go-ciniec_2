/**
 * EventType Service
 * Business logic for event type management
 */
import { CreateEventTypeDTO, UpdateEventTypeDTO, EventTypeResponse, EventTypeStatsResponse } from '../types/eventType.types';
export declare class EventTypeService {
    createEventType(data: CreateEventTypeDTO, userId: string): Promise<EventTypeResponse>;
    getEventTypes(activeOnly?: boolean): Promise<EventTypeResponse[]>;
    getEventTypeById(id: string): Promise<EventTypeResponse & {
        _count: {
            reservations: number;
            menuTemplates: number;
        };
    }>;
    updateEventType(id: string, data: UpdateEventTypeDTO, userId: string): Promise<EventTypeResponse>;
    toggleActive(id: string, userId: string): Promise<EventTypeResponse>;
    deleteEventType(id: string, userId: string): Promise<void>;
    getEventTypeStats(): Promise<EventTypeStatsResponse[]>;
    getPredefinedColors(): string[];
}
declare const _default: EventTypeService;
export default _default;
//# sourceMappingURL=eventType.service.d.ts.map