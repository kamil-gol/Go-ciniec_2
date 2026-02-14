/**
 * Hall Types
 * Type definitions for hall management
 * UPDATED: Removed pricing fields (pricePerPerson/Child/Toddler) - prices are now managed via menu packages
 */

export interface CreateHallDTO {
  name: string;
  capacity: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  isActive?: boolean;
}

export interface UpdateHallDTO {
  name?: string;
  capacity?: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  isActive?: boolean;
}

export interface HallResponse {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
