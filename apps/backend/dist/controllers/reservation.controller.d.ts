/**
 * Reservation Controller
 * Handle HTTP requests for reservation management with advanced features
 * UPDATED: Full support for toddlers (0-3 years) age group
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
     * Update reservation
     * PUT /api/reservations/:id
     *
     * Note: Requires 'reason' field (min 10 characters) if making changes to important fields
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
     */
    cancelReservation(req: Request, res: Response): Promise<void>;
}
declare const _default: ReservationController;
export default _default;
//# sourceMappingURL=reservation.controller.d.ts.map