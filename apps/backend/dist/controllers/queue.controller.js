/**
 * Queue Controller
 * Handle HTTP requests for reservation queue management
 */
import queueService from '../services/queue.service';
export class QueueController {
    /**
     * Add reservation to queue (create RESERVED)
     * POST /api/queue/reserved
     */
    async addToQueue(req, res) {
        try {
            const data = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated',
                });
                return;
            }
            // Validate required fields
            if (!data.clientId || !data.reservationQueueDate || !data.guests) {
                res.status(400).json({
                    success: false,
                    error: 'Client ID, queue date, and number of guests are required',
                });
                return;
            }
            const queueItem = await queueService.addToQueue(data, userId);
            res.status(201).json({
                success: true,
                data: queueItem,
                message: `Dodano do kolejki na pozycję #${queueItem.position}`,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to add to queue',
            });
        }
    }
    /**
     * Update queue reservation
     * PUT /api/queue/:id
     */
    async updateQueueReservation(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Reservation ID is required',
                });
                return;
            }
            const queueItem = await queueService.updateQueueReservation(id, data);
            res.status(200).json({
                success: true,
                data: queueItem,
                message: 'Wpis w kolejce zaktualizowany',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to update queue reservation',
            });
        }
    }
    /**
     * Get queue for specific date
     * GET /api/queue/:date
     */
    async getQueueForDate(req, res) {
        try {
            const { date } = req.params;
            if (!date) {
                res.status(400).json({
                    success: false,
                    error: 'Date parameter is required',
                });
                return;
            }
            const queue = await queueService.getQueueForDate(date);
            res.status(200).json({
                success: true,
                data: queue,
                count: queue.length,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to get queue',
            });
        }
    }
    /**
     * Get all queues
     * GET /api/queue
     */
    async getAllQueues(req, res) {
        try {
            const queues = await queueService.getAllQueues();
            res.status(200).json({
                success: true,
                data: queues,
                count: queues.length,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to get queues',
            });
        }
    }
    /**
     * Swap two queue positions
     * POST /api/queue/swap
     */
    async swapPositions(req, res) {
        try {
            const { reservationId1, reservationId2 } = req.body;
            if (!reservationId1 || !reservationId2) {
                res.status(400).json({
                    success: false,
                    error: 'Both reservation IDs are required',
                });
                return;
            }
            await queueService.swapPositions(reservationId1, reservationId2);
            res.status(200).json({
                success: true,
                message: 'Pozycje zostały zamienione',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to swap positions',
            });
        }
    }
    /**
     * Move reservation to specific position
     * PUT /api/queue/:id/position
     */
    async moveToPosition(req, res) {
        try {
            const { id } = req.params;
            const { newPosition } = req.body;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Reservation ID is required',
                });
                return;
            }
            if (!newPosition || newPosition < 1) {
                res.status(400).json({
                    success: false,
                    error: 'Valid position (>= 1) is required',
                });
                return;
            }
            await queueService.moveToPosition(id, newPosition);
            res.status(200).json({
                success: true,
                message: `Przeniesiono na pozycję #${newPosition}`,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to move reservation',
            });
        }
    }
    /**
     * Rebuild queue positions for all dates
     * POST /api/queue/rebuild-positions
     */
    async rebuildPositions(req, res) {
        try {
            const result = await queueService.rebuildPositions();
            res.status(200).json({
                success: true,
                data: result,
                message: `Ponumerowano ${result.updatedCount} rezerwacji w ${result.dateCount} datach`,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to rebuild positions',
            });
        }
    }
    /**
     * Promote RESERVED to PENDING/CONFIRMED
     * PUT /api/queue/:id/promote
     */
    async promoteReservation(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Reservation ID is required',
                });
                return;
            }
            // Validate required fields
            if (!data.hallId || !data.eventTypeId || !data.startDateTime || !data.endDateTime) {
                res.status(400).json({
                    success: false,
                    error: 'Hall, event type, start time, and end time are required',
                });
                return;
            }
            if (!data.pricePerAdult || data.adults < 1) {
                res.status(400).json({
                    success: false,
                    error: 'Price per adult and at least 1 adult are required',
                });
                return;
            }
            const reservation = await queueService.promoteReservation(id, data);
            res.status(200).json({
                success: true,
                data: reservation,
                message: 'Rezerwacja awansowana pomyślnie',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to promote reservation',
            });
        }
    }
    /**
     * Get queue statistics
     * GET /api/queue/stats
     */
    async getStats(req, res) {
        try {
            const stats = await queueService.getQueueStats();
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to get statistics',
            });
        }
    }
    /**
     * Manually trigger auto-cancel
     * POST /api/queue/auto-cancel
     */
    async autoCancelExpired(req, res) {
        try {
            const result = await queueService.autoCancelExpired();
            res.status(200).json({
                success: true,
                data: result,
                message: `Anulowano ${result.cancelledCount} przeterminowanych rezerwacji`,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to auto-cancel reservations',
            });
        }
    }
}
export default new QueueController();
//# sourceMappingURL=queue.controller.js.map