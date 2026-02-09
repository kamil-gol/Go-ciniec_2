/**
 * EventType Types
 * Types and interfaces for event type management
 */
export interface CreateEventTypeDTO {
    name: string;
}
export interface UpdateEventTypeDTO {
    name?: string;
}
export interface EventTypeResponse {
    id: string;
    name: string;
    createdAt: Date;
}
//# sourceMappingURL=eventType.types.d.ts.map