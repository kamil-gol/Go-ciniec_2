/**
 * Queue Controller
 * MIGRATED: AppError + no try/catch
 * Updated: Phase 2 Audit — pass userId to all mutating service methods
 */
import queueService from '../services/queue.service';
import { AppError } from '../utils/AppError';
export class QueueController {
    /**
     * Add reservation to queue (create RESERVED)
     * POST /api/queue/reserved
     */
    async addToQueue(req, res) {
        const data = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        if (!data.clientId || !data.reservationQueueDate || !data.guests) {
            throw AppError.badRequest('Client ID, queue date, and number of guests are required');
        }
        const queueItem = await queueService.addToQueue(data, userId);
        res.status(201).json({
            success: true,
            data: queueItem,
            message: `Dodano do kolejki na pozycję #${queueItem.position}`,
        });
    }
    /**
     * Update queue reservation
     * PUT /api/queue/:id
     */
    async updateQueueReservation(req, res) {
        const { id } = req.params;
        const data = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        const queueItem = await queueService.updateQueueReservation(id, data, userId);
        res.status(200).json({
            success: true,
            data: queueItem,
            message: 'Wpis w kolejce zaktualizowany',
        });
    }
    /**
     * Get queue for specific date
     * GET /api/queue/:date
     */
    async getQueueForDate(req, res) {
        const { date } = req.params;
        if (!date)
            throw AppError.badRequest('Date parameter is required');
        const queue = await queueService.getQueueForDate(date);
        res.status(200).json({
            success: true,
            data: queue,
            count: queue.length,
        });
    }
    /**
     * Get all queues
     * GET /api/queue
     */
    async getAllQueues(_req, res) {
        const queues = await queueService.getAllQueues();
        res.status(200).json({
            success: true,
            data: queues,
            count: queues.length,
        });
    }
    /**
     * Swap two queue positions
     * POST /api/queue/swap
     */
    async swapPositions(req, res) {
        const { reservationId1, reservationId2 } = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        if (!reservationId1 || !reservationId2) {
            throw AppError.badRequest('Both reservation IDs are required');
        }
        await queueService.swapPositions(reservationId1, reservationId2, userId);
        res.status(200).json({
            success: true,
            message: 'Pozycje zostały zamienione',
        });
    }
    /**
     * Move reservation to specific position
     * PUT /api/queue/:id/position
     */
    async moveToPosition(req, res) {
        const { id } = req.params;
        const { newPosition } = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        if (newPosition === undefined || newPosition === null) {
            throw AppError.badRequest('Position is required');
        }
        const position = typeof newPosition === 'string' ? parseInt(newPosition, 10) : newPosition;
        if (!Number.isInteger(position)) {
            throw AppError.badRequest('Position must be a valid integer');
        }
        if (position < 1) {
            throw AppError.badRequest('Position must be at least 1');
        }
        await queueService.moveToPosition(id, position, userId);
        res.status(200).json({
            success: true,
            message: `Przeniesiono na pozycję #${position}`,
        });
    }
    /**
     * Batch update queue positions atomically
     * POST /api/queue/batch-update-positions
     */
    async batchUpdatePositions(req, res) {
        const { updates } = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            throw AppError.badRequest('Updates array is required and must contain at least one item');
        }
        for (const update of updates) {
            if (!update.id || typeof update.id !== 'string') {
                throw AppError.badRequest('Each update must have a valid reservation ID');
            }
            if (!Number.isInteger(update.position) || update.position < 1) {
                throw AppError.badRequest('Each update must have a valid position (integer >= 1)');
            }
        }
        const result = await queueService.batchUpdatePositions(updates, userId);
        res.status(200).json({
            success: true,
            data: result,
            message: `Zaktualizowano ${result.updatedCount} pozycji w kolejce`,
        });
    }
    /**
     * Rebuild queue positions for all dates
     * POST /api/queue/rebuild-positions
     */
    async rebuildPositions(req, res) {
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        const result = await queueService.rebuildPositions(userId);
        res.status(200).json({
            success: true,
            data: result,
            message: `Ponumerowano ${result.updatedCount} rezerwacji w ${result.dateCount} datach`,
        });
    }
    /**
     * Promote RESERVED to PENDING/CONFIRMED
     * PUT /api/queue/:id/promote
     */
    async promoteReservation(req, res) {
        const { id } = req.params;
        const data = req.body;
        const userId = req.user?.id;
        if (!userId)
            throw AppError.unauthorized();
        if (!data.hallId || !data.eventTypeId || !data.startDateTime || !data.endDateTime) {
            throw AppError.badRequest('Hall, event type, start time, and end time are required');
        }
        if (!data.pricePerAdult || data.adults < 1) {
            throw AppError.badRequest('Price per adult and at least 1 adult are required');
        }
        const reservation = await queueService.promoteReservation(id, data, userId);
        res.status(200).json({
            success: true,
            data: reservation,
            message: 'Rezerwacja awansowana pomyślnie',
        });
    }
    /**
     * Get queue statistics
     * GET /api/queue/stats
     */
    async getStats(_req, res) {
        const stats = await queueService.getQueueStats();
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    /**
     * Manually trigger auto-cancel
     * POST /api/queue/auto-cancel
     */
    async autoCancelExpired(req, res) {
        const userId = req.user?.id;
        const result = await queueService.autoCancelExpired(userId);
        res.status(200).json({
            success: true,
            data: result,
            message: `Anulowano ${result.cancelledCount} przeterminowanych rezerwacji`,
        });
    }
}
export default new QueueController();
//# sourceMappingURL=queue.controller.js.map