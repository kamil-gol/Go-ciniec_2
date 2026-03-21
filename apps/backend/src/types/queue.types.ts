/**
 * Queue System Types & DTOs
 * Types for reservation queue management
 */

import { ReservationStatus } from '@/prisma-client';

/**
 * DTO for creating a RESERVED reservation (minimal data)
 */
export interface CreateReservedDTO {
  clientId: string;
  reservationQueueDate: Date | string;
  guests: number;
  adults?: number;
  children?: number;
  toddlers?: number;
  notes?: string;
}

/**
 * DTO for promoting RESERVED to PENDING/CONFIRMED
 */
export interface PromoteReservationDTO {
  hallId: string;
  eventTypeId: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  adults: number;
  children?: number;
  toddlers?: number;
  pricePerAdult: number;
  pricePerChild?: number;
  pricePerToddler?: number;
  status: 'PENDING' | 'CONFIRMED';
  notes?: string;
  customEventType?: string;
  birthdayAge?: number;
  anniversaryYear?: number;
  anniversaryOccasion?: string;
}

/**
 * DTO for swapping queue positions
 */
export interface SwapQueuePositionsDTO {
  reservationId1: string;
  reservationId2: string;
}

/**
 * DTO for moving to specific position
 */
export interface MoveQueuePositionDTO {
  reservationId: string;
  newPosition: number;
}

/**
 * DTO for batch updating positions (atomic)
 */
export interface BatchUpdatePositionsDTO {
  updates: Array<{
    id: string;
    position: number;
  }>;
}

/**
 * Queue item response
 */
export interface QueueItemResponse {
  id: string;
  position: number;
  queueDate: Date;
  guests: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
  };
  isManualOrder: boolean;
  notes?: string | null;
  createdAt: Date;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Queue statistics
 */
export interface QueueStats {
  totalQueued: number;
  queuesByDate: Array<{
    date: string;
    count: number;
    totalGuests: number;
  }>;
  oldestQueueDate: Date | null;
  manualOrderCount: number;
}

/**
 * Auto-cancel result
 */
export interface AutoCancelResult {
  cancelledCount: number;
  cancelledIds: string[];
}
