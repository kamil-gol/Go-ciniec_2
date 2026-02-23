/**
 * Hall Types
 * Type definitions for hall management
 * UPDATED: Added isWholeVenue flag for "Cały Obiekt" protection
 * UPDATED: Added allowWithWholeVenue — halls that can coexist with whole venue bookings
 */

export interface CreateHallDTO {
  name: string;
  capacity: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  isActive?: boolean;
  isWholeVenue?: boolean;
  allowWithWholeVenue?: boolean;
}

export interface UpdateHallDTO {
  name?: string;
  capacity?: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  isActive?: boolean;
  allowWithWholeVenue?: boolean;
}

export interface HallResponse {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
  isWholeVenue: boolean;
  allowWithWholeVenue: boolean;
  createdAt: Date;
  updatedAt: Date;
}
