/**
 * Reservation Service
 * Business logic for reservation management with advanced features
 * UPDATED: Full support for toddlers (0-3 years) age group
 */
import { CreateReservationDTO, UpdateReservationDTO, UpdateStatusDTO, ReservationFilters, ReservationResponse } from '../types/reservation.types';
export declare class ReservationService {
    /**
     * Create a new reservation
     */
    createReservation(data: CreateReservationDTO, userId: string): Promise<ReservationResponse>;
    /**
     * Get all reservations with filters
     */
    getReservations(filters?: ReservationFilters): Promise<ReservationResponse[]>;
    /**
     * Get reservation by ID
     */
    getReservationById(id: string): Promise<ReservationResponse>;
    /**
     * Update reservation
     */
    updateReservation(id: string, data: UpdateReservationDTO, userId: string): Promise<ReservationResponse>;
    /**
     * Update reservation status
     */
    updateStatus(id: string, data: UpdateStatusDTO, userId: string): Promise<ReservationResponse>;
    /**
     * Cancel reservation (soft delete)
     */
    cancelReservation(id: string, userId: string, reason?: string): Promise<void>;
    /**
     * Validate userId exists in database
     */
    private validateUserId;
    /**
     * Check for overlapping reservations (legacy format)
     */
    private checkOverlap;
    /**
     * Validate status transition
     */
    private validateStatusTransition;
    /**
     * Create history entry
     */
    private createHistoryEntry;
}
declare const _default: ReservationService;
export default _default;
//# sourceMappingURL=reservation.service.d.ts.map