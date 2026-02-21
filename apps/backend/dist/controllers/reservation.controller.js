/**
 * Reservation Controller
 * Handle HTTP requests for reservation management
 * MIGRATED: Uses AppError (no try/catch — errors forwarded by asyncHandler)
 * Phase 4.3: Block cancellation of reservations with paid deposits
 */
import reservationService from '../services/reservation.service';
import depositService from '../services/deposit.service';
import { pdfService } from '../services/pdf.service';
import { AppError } from '../utils/AppError';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export class ReservationController {
    /**
     * Create a new reservation
     * POST /api/reservations
     */
    async createReservation(req, res) {
        const data = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        if (!data.hallId || !data.clientId || !data.eventTypeId) {
            throw AppError.badRequest('Hall, client, and event type are required');
        }
        const hasNewFormat = data.startDateTime && data.endDateTime;
        const hasLegacyFormat = data.date && data.startTime && data.endTime;
        if (!hasNewFormat && !hasLegacyFormat) {
            throw AppError.badRequest('Either startDateTime/endDateTime or date/startTime/endTime are required');
        }
        if (data.adults === undefined || data.children === undefined || data.toddlers === undefined) {
            throw AppError.badRequest('Guest counts are required: adults, children, and toddlers (can be 0)');
        }
        if (data.adults === 0 && data.children === 0 && data.toddlers === 0) {
            throw AppError.badRequest('At least one guest is required (adults, children, or toddlers)');
        }
        if (!data.menuPackageId) {
            if (data.pricePerAdult === undefined || data.pricePerChild === undefined) {
                throw AppError.badRequest('When no menu package is selected, pricePerAdult and pricePerChild are required');
            }
        }
        if (data.menuPackageId && (data.pricePerAdult !== undefined || data.pricePerChild !== undefined)) {
            throw AppError.badRequest('Cannot specify both menuPackageId and manual prices. Choose one method.');
        }
        const reservation = await reservationService.createReservation(data, userId);
        res.status(201).json({
            success: true,
            data: reservation,
            message: data.menuPackageId
                ? 'Reservation created successfully with menu package'
                : 'Reservation created successfully'
        });
    }
    /**
     * Get all reservations with optional filters
     * GET /api/reservations
     */
    async getReservations(req, res) {
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
    /**
     * Get reservation by ID
     * GET /api/reservations/:id
     */
    async getReservationById(req, res) {
        const { id } = req.params;
        const reservation = await reservationService.getReservationById(id);
        if (!reservation)
            throw AppError.notFound('Reservation');
        res.status(200).json({
            success: true,
            data: reservation
        });
    }
    /**
     * Check hall availability for a given time range
     * GET /api/reservations/check-availability?hallId=X&startDateTime=...&endDateTime=...
     */
    async checkAvailability(req, res) {
        const { hallId, startDateTime, endDateTime, excludeReservationId } = req.query;
        if (!hallId || !startDateTime || !endDateTime) {
            throw AppError.badRequest('hallId, startDateTime, and endDateTime are required');
        }
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw AppError.badRequest('Invalid date format for startDateTime or endDateTime');
        }
        if (end <= start) {
            throw AppError.badRequest('endDateTime must be after startDateTime');
        }
        // Find overlapping reservations (not cancelled)
        const conflicts = await prisma.reservation.findMany({
            where: {
                hallId: hallId,
                status: {
                    notIn: ['CANCELLED'],
                },
                ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
                // Overlap condition: existing.start < new.end AND existing.end > new.start
                startDateTime: {
                    lt: end,
                },
                endDateTime: {
                    gt: start,
                },
            },
            select: {
                id: true,
                startDateTime: true,
                endDateTime: true,
                status: true,
                client: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                eventType: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                startDateTime: 'asc',
            },
        });
        const formattedConflicts = conflicts.map((c) => ({
            id: c.id,
            clientName: c.client ? `${c.client.firstName} ${c.client.lastName}` : 'Nieznany',
            eventType: c.eventType?.name || 'Nieznany',
            startDateTime: c.startDateTime?.toISOString() || '',
            endDateTime: c.endDateTime?.toISOString() || '',
            status: c.status,
        }));
        res.status(200).json({
            success: true,
            data: {
                available: formattedConflicts.length === 0,
                conflicts: formattedConflicts,
            },
        });
    }
    /**
     * Download reservation as PDF
     * GET /api/reservations/:id/pdf
     */
    async downloadPDF(req, res) {
        const { id } = req.params;
        const reservation = await reservationService.getReservationById(id);
        if (!reservation)
            throw AppError.notFound('Reservation');
        const pdfBuffer = await pdfService.generateReservationPDF(reservation);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="rezerwacja_${id.substring(0, 8)}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    }
    /**
     * Update reservation
     * PUT /api/reservations/:id
     */
    async updateReservation(req, res) {
        const { id } = req.params;
        const data = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        const hasImportantChanges = data.startDateTime !== undefined ||
            data.endDateTime !== undefined ||
            data.adults !== undefined ||
            data.children !== undefined ||
            data.toddlers !== undefined ||
            data.pricePerAdult !== undefined ||
            data.pricePerChild !== undefined ||
            data.pricePerToddler !== undefined;
        if (hasImportantChanges && (!data.reason || data.reason.length < 10)) {
            throw AppError.badRequest('Reason is required for important changes (minimum 10 characters)');
        }
        const reservation = await reservationService.updateReservation(id, data, userId);
        res.status(200).json({
            success: true,
            data: reservation,
            message: 'Reservation updated successfully'
        });
    }
    /**
     * Update reservation status
     * PATCH /api/reservations/:id/status
     */
    async updateStatus(req, res) {
        const { id } = req.params;
        const data = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        if (!data.status) {
            throw AppError.badRequest('Status is required');
        }
        // ═══ Phase 4.3: Block cancellation if reservation has paid deposits ═══
        if (data.status === 'CANCELLED') {
            const depositCheck = await depositService.checkPaidDepositsBeforeCancel(id);
            if (depositCheck.hasPaidDeposits) {
                throw AppError.badRequest(`Nie można anulować rezerwacji z opłaconymi zaliczkami (${depositCheck.paidCount} zaliczek na łączną kwotę ${depositCheck.paidTotal.toFixed(2)} PLN). ` +
                    `Najpierw cofnij płatności zaliczek.`);
            }
        }
        const reservation = await reservationService.updateStatus(id, data, userId);
        res.status(200).json({
            success: true,
            data: reservation,
            message: 'Reservation status updated successfully'
        });
    }
    /**
     * Cancel reservation
     * DELETE /api/reservations/:id
     * Phase 4.3: Blocks if reservation has paid deposits
     */
    async cancelReservation(req, res) {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        // ═══ Phase 4.3: Block cancellation if reservation has paid deposits ═══
        const depositCheck = await depositService.checkPaidDepositsBeforeCancel(id);
        if (depositCheck.hasPaidDeposits) {
            throw AppError.badRequest(`Nie można anulować rezerwacji z opłaconymi zaliczkami (${depositCheck.paidCount} zaliczek na łączną kwotę ${depositCheck.paidTotal.toFixed(2)} PLN). ` +
                `Najpierw cofnij płatności zaliczek.`);
        }
        await reservationService.cancelReservation(id, userId, reason);
        res.status(200).json({
            success: true,
            message: 'Reservation cancelled successfully'
        });
    }
    /**
     * Archive reservation
     * POST /api/reservations/:id/archive
     */
    async archiveReservation(req, res) {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        await reservationService.archiveReservation(id, userId, reason);
        res.status(200).json({
            success: true,
            message: 'Reservation archived successfully'
        });
    }
    /**
     * Unarchive reservation
     * POST /api/reservations/:id/unarchive
     */
    async unarchiveReservation(req, res) {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        await reservationService.unarchiveReservation(id, userId, reason);
        res.status(200).json({
            success: true,
            message: 'Reservation restored from archive successfully'
        });
    }
}
export default new ReservationController();
//# sourceMappingURL=reservation.controller.js.map