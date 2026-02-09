/**
 * Hall Types
 * Types and interfaces for hall management
 */
export interface CreateHallDTO {
    name: string;
    capacity: number;
    description?: string;
    pricePerPerson: number;
    isActive?: boolean;
}
export interface UpdateHallDTO {
    name?: string;
    capacity?: number;
    description?: string;
    pricePerPerson?: number;
    isActive?: boolean;
}
export interface HallFilters {
    isActive?: boolean;
    minCapacity?: number;
    maxCapacity?: number;
    search?: string;
}
export interface HallResponse {
    id: string;
    name: string;
    capacity: number;
    description: string | null;
    pricePerPerson: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=hall.types.d.ts.map