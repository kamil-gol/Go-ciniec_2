/**
 * Reservation Controller
 * Handle HTTP requests for reservation management with advanced features
 * UPDATED: Full support for toddlers (0-3 years) age group
 */
import reservationService from '../services/reservation.service';
export class ReservationController {
    /**
     * Create a new reservation
     * POST /api/reservations
     */
    async createReservation(req, res) {
        try {
            const data = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            // Validate required fields
            if (!data.hallId || !data.clientId || !data.eventTypeId) {
                res.status(400).json({
                    success: false,
                    error: 'Hall, client, and event type are required'
                });
                return;
            }
            // Validate either new format (startDateTime/endDateTime) or legacy format (date/startTime/endTime)
            const hasNewFormat = data.startDateTime && data.endDateTime;
            const hasLegacyFormat = data.date && data.startTime && data.endTime;
            if (!hasNewFormat && !hasLegacyFormat) {
                res.status(400).json({
                    success: false,
                    error: 'Either startDateTime/endDateTime or date/startTime/endTime are required'
                });
                return;
            }
            // Validate guests: either adults+children+toddlers or legacy guests field
            const hasGuestBreakdown = (data.adults !== undefined && data.adults >= 0) ||
                (data.children !== undefined && data.children >= 0) ||
                (data.toddlers !== undefined && data.toddlers >= 0); // NEW: Include toddlers
            const hasLegacyGuests = data.guests !== undefined && data.guests > 0;
            if (!hasGuestBreakdown && !hasLegacyGuests) {
                res.status(400).json({
                    success: false,
                    error: 'Either adults/children/toddlers counts or total guests count is required'
                });
                return;
            }
            const reservation = await reservationService.createReservation(data, userId);
            res.status(201).json({
                success: true,
                data: reservation,
                message: 'Reservation created successfully'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to create reservation'
            });
        }
    }
    /**
     * Get all reservations with optional filters
     * GET /api/reservations
     */
    async getReservations(req, res) {
        try {
            const filters = {
                status: req.query.status,
                hallId: req.query.hallId,
                clientId: req.query.clientId,
                eventTypeId: req.query.eventTypeId,
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
                archived: req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined
            };
            const reservations = await reservationService.getReservations(filters);
            res.status(200).json({
                success: true,
                data: reservations,
                count: reservations.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch reservations'
            });
        }
    }
    /**
     * Get reservation by ID
     * GET /api/reservations/:id
     */
    async getReservationById(req, res) {
        try {
            const { id } = req.params;
            const reservation = await reservationService.getReservationById(id);
            res.status(200).json({
                success: true,
                data: reservation
            });
        }
        catch (error) {
            const statusCode = error.message === 'Reservation not found' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to fetch reservation'
            });
        }
    }
    /**
     * Update reservation
     * PUT /api/reservations/:id
     *
     * Note: Requires 'reason' field (min 10 characters) if making changes to important fields
     */
    async updateReservation(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            // Validation for important fields that require a reason
            const hasImportantChanges = data.startDateTime !== undefined ||
                data.endDateTime !== undefined ||
                data.adults !== undefined ||
                data.children !== undefined ||
                data.toddlers !== undefined || // NEW: Include toddlers
                data.pricePerAdult !== undefined ||
                data.pricePerChild !== undefined ||
                data.pricePerToddler !== undefined; // NEW: Include toddler price
            if (hasImportantChanges && (!data.reason || data.reason.length < 10)) {
                res.status(400).json({
                    success: false,
                    error: 'Reason is required for important changes (minimum 10 characters)'
                });
                return;
            }
            const reservation = await reservationService.updateReservation(id, data, userId);
            res.status(200).json({
                success: true,
                data: reservation,
                message: 'Reservation updated successfully'
            });
        }
        catch (error) {
            const statusCode = error.message === 'Reservation not found' ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to update reservation'
            });
        }
    }
    /**
     * Update reservation status
     * PATCH /api/reservations/:id/status
     */
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            if (!data.status) {
                res.status(400).json({
                    success: false,
                    error: 'Status is required'
                });
                return;
            }
            const reservation = await reservationService.updateStatus(id, data, userId);
            res.status(200).json({
                success: true,
                data: reservation,
                message: 'Reservation status updated successfully'
            });
        }
        catch (error) {
            const statusCode = error.message === 'Reservation not found' ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to update reservation status'
            });
        }
    }
    /**
     * Cancel reservation
     * DELETE /api/reservations/:id
     */
    async cancelReservation(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }
            await reservationService.cancelReservation(id, userId, reason);
            res.status(200).json({
                success: true,
                message: 'Reservation cancelled successfully'
            });
        }
        catch (error) {
            const statusCode = error.message === 'Reservation not found' ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Failed to cancel reservation'
            });
        }
    }
}
export default new ReservationController();
//# sourceMappingURL=reservation.controller.js.map