/**
 * Hall Service
 * Business logic for hall management
 * UPDATED: isWholeVenue protection — cannot delete/deactivate "Cały Obiekt"
 */
import { CreateHallDTO, UpdateHallDTO, HallResponse } from '../types/hall.types';
export declare class HallService {
    /**
     * Get all halls with optional filters
     */
    getHalls(filters?: {
        isActive?: boolean;
        search?: string;
    }): Promise<HallResponse[]>;
    /**
     * Get hall by ID
     */
    getHallById(id: string): Promise<HallResponse>;
    /**
     * Get the "whole venue" hall
     */
    getWholeVenueHall(): Promise<HallResponse | null>;
    /**
     * Create new hall
     */
    createHall(data: CreateHallDTO, userId: string): Promise<HallResponse>;
    /**
     * Update hall
     * PROTECTED: Cannot deactivate or rename isWholeVenue hall
     */
    updateHall(id: string, data: UpdateHallDTO, userId: string): Promise<HallResponse>;
    /**
     * Toggle active status
     */
    toggleActive(id: string, userId: string): Promise<HallResponse>;
    /**
     * Delete hall (soft delete - deactivate)
     * PROTECTED: Cannot delete isWholeVenue hall
     */
    deleteHall(id: string, userId: string): Promise<void>;
}
declare const _default: HallService;
export default _default;
//# sourceMappingURL=hall.service.d.ts.map