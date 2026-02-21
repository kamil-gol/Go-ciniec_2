/**
 * Hall Types
 * Type definitions for hall management
 * UPDATED: Added isWholeVenue flag for "Cały Obiekt" protection
 */
export interface CreateHallDTO {
    name: string;
    capacity: number;
    description?: string;
    amenities?: string[];
    images?: string[];
    isActive?: boolean;
    isWholeVenue?: boolean;
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
    isWholeVenue: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=hall.types.d.ts.map