/**
 * Reservation Service - with full Audit Logging
 * Business logic for reservation management with advanced features
 * Updated: Phase 1 Audit — logChange() for menu updates + cascade cancel
 */
import { CreateReservationDTO, UpdateReservationDTO, UpdateStatusDTO, ReservationFilters, ReservationResponse, UpdateReservationMenuDTO } from '../types/reservation.types';
export declare class ReservationService {
    createReservation(data: CreateReservationDTO, userId: string): Promise<ReservationResponse>;
    updateReservationMenu(reservationId: string, data: UpdateReservationMenuDTO, userId: string): Promise<any>;
    private processSelectedOptions;
    private calculateOptionsPrice;
    getReservations(filters?: ReservationFilters): Promise<ReservationResponse[]>;
    getReservationById(id: string): Promise<ReservationResponse>;
    updateReservation(id: string, data: UpdateReservationDTO, userId: string): Promise<ReservationResponse>;
    updateStatus(id: string, data: UpdateStatusDTO, userId: string): Promise<ReservationResponse>;
    cancelReservation(id: string, userId: string, reason?: string): Promise<void>;
    /**
     * Archive reservation - set archivedAt timestamp
     */
    archiveReservation(id: string, userId: string, reason?: string): Promise<void>;
    /**
     * Unarchive reservation - remove archivedAt timestamp
     */
    unarchiveReservation(id: string, userId: string, reason?: string): Promise<void>;
    private cascadeCancelDeposits;
    private checkWholeVenueConflict;
    private validateUserId;
    private checkDateTimeOverlap;
    private checkOverlap;
    private validateStatusTransition;
    private createHistoryEntry;
}
declare const _default: ReservationService;
export default _default;
//# sourceMappingURL=reservation.service.d.ts.map