/**
 * Queue Controller
 * MIGRATED: AppError + no try/catch
 * Updated: Phase 2 Audit — pass userId to all mutating service methods
 */
import { Request, Response } from 'express';
export declare class QueueController {
    /**
     * Add reservation to queue (create RESERVED)
     * POST /api/queue/reserved
     */
    addToQueue(req: Request, res: Response): Promise<void>;
    /**
     * Update queue reservation
     * PUT /api/queue/:id
     */
    updateQueueReservation(req: Request, res: Response): Promise<void>;
    /**
     * Get queue for specific date
     * GET /api/queue/:date
     */
    getQueueForDate(req: Request, res: Response): Promise<void>;
    /**
     * Get all queues
     * GET /api/queue
     */
    getAllQueues(_req: Request, res: Response): Promise<void>;
    /**
     * Swap two queue positions
     * POST /api/queue/swap
     */
    swapPositions(req: Request, res: Response): Promise<void>;
    /**
     * Move reservation to specific position
     * PUT /api/queue/:id/position
     */
    moveToPosition(req: Request, res: Response): Promise<void>;
    /**
     * Batch update queue positions atomically
     * POST /api/queue/batch-update-positions
     */
    batchUpdatePositions(req: Request, res: Response): Promise<void>;
    /**
     * Rebuild queue positions for all dates
     * POST /api/queue/rebuild-positions
     */
    rebuildPositions(req: Request, res: Response): Promise<void>;
    /**
     * Promote RESERVED to PENDING/CONFIRMED
     * PUT /api/queue/:id/promote
     */
    promoteReservation(req: Request, res: Response): Promise<void>;
    /**
     * Get queue statistics
     * GET /api/queue/stats
     */
    getStats(_req: Request, res: Response): Promise<void>;
    /**
     * Manually trigger auto-cancel
     * POST /api/queue/auto-cancel
     */
    autoCancelExpired(req: Request, res: Response): Promise<void>;
}
declare const _default: QueueController;
export default _default;
//# sourceMappingURL=queue.controller.d.ts.map