/**
 * Reservation Controller
 * Handle HTTP requests for reservation management
 * MIGRATED: Uses AppError (no try/catch — errors forwarded by asyncHandler)
 * Phase 4.3: Block cancellation of reservations with paid deposits
 */
import { Request, Response } from 'express';
export declare class ReservationController {
    /**
     * Create a new reservation
     * POST /api/reservations
     */
    createReservation(req: Request, res: Response): Promise<void>;
    /**
     * Get all reservations with optional filters
     * GET /api/reservations
     */
    getReservations(req: Request, res: Response): Promise<void>;
    /**
     * Get reservation by ID
     * GET /api/reservations/:id
     */
    getReservationById(req: Request, res: Response): Promise<void>;
    /**
     * Check hall availability for a given time range
     * GET /api/reservations/check-availability?hallId=X&startDateTime=...&endDateTime=...
     */
    checkAvailability(req: Request, res: Response): Promise<void>;
    /**
     * Download reservation as PDF
     * GET /api/reservations/:id/pdf
     */
    downloadPDF(req: Request, res: Response): Promise<void>;
    /**
     * Update reservation
     * PUT /api/reservations/:id
     */
    updateReservation(req: Request, res: Response): Promise<void>;
    /**
     * Update reservation status
     * PATCH /api/reservations/:id/status
     */
    updateStatus(req: Request, res: Response): Promise<void>;
    /**
     * Cancel reservation
     * DELETE /api/reservations/:id
     * Phase 4.3: Blocks if reservation has paid deposits
     */
    cancelReservation(req: Request, res: Response): Promise<void>;
    /**
     * Archive reservation
     * POST /api/reservations/:id/archive
     */
    archiveReservation(req: Request, res: Response): Promise<void>;
    /**
     * Unarchive reservation
     * POST /api/reservations/:id/unarchive
     */
    unarchiveReservation(req: Request, res: Response): Promise<void>;
}
declare const _default: ReservationController;
export default _default;
//# sourceMappingURL=reservation.controller.d.ts.map