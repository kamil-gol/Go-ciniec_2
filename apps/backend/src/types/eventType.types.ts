/**
 * EventType Types
 * Types and interfaces for event type management
 * Updated: fix/ts-errors — standardHours/extraHourRate nullable (Prisma Decimal | null)
 */

export interface CreateEventTypeDTO {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  standardHours?: number;
  extraHourRate?: number;
}

export interface UpdateEventTypeDTO {
  name?: string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
  standardHours?: number;
  extraHourRate?: number;
}

export interface EventTypeResponse {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  standardHours: number | null;  // fix: Prisma returns number | null
  extraHourRate: number | null;  // fix: Prisma returns Decimal | null → serialized as number | null
  createdAt: Date;
  updatedAt: Date;
}

export interface EventTypeStatsResponse {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
  standardHours: number | null;  // fix: Prisma returns number | null
  extraHourRate: number | null;  // fix: Prisma returns Decimal | null → serialized as number | null
  reservationCount: number;
  menuTemplateCount: number;
}
