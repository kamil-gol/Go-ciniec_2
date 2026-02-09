/**
 * Hall Service
 * Business logic for hall management
 */
import { CreateHallDTO, UpdateHallDTO, HallFilters, HallResponse } from '../types/hall.types';
export declare class HallService {
    /**
     * Create a new hall
     */
    createHall(data: CreateHallDTO): Promise<HallResponse>;
    /**
     * Get all halls with optional filters
     */
    getHalls(filters?: HallFilters): Promise<HallResponse[]>;
    /**
     * Get hall by ID
     */
    getHallById(id: string): Promise<HallResponse>;
    /**
     * Update hall
     */
    updateHall(id: string, data: UpdateHallDTO): Promise<HallResponse>;
    /**
     * Soft delete hall (set isActive to false)
     */
    deleteHall(id: string): Promise<void>;
}
declare const _default: HallService;
export default _default;
//# sourceMappingURL=hall.service.d.ts.map