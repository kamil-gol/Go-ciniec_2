/**
 * EventType Types
 * Types and interfaces for event type management
 */

export interface CreateEventTypeDTO {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateEventTypeDTO {
  name?: string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
}

export interface EventTypeResponse {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventTypeStatsResponse {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
  reservationCount: number;
  menuTemplateCount: number;
}
