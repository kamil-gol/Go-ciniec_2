/**
 * Queue Service
 * Business logic for reservation queue management
 */
import { CreateReservedDTO, PromoteReservationDTO, QueueItemResponse, QueueStats, AutoCancelResult } from '../types/queue.types';
export declare class QueueService {
    /**
     * Add reservation to queue (create RESERVED status)
     */
    addToQueue(data: CreateReservedDTO, createdById: string): Promise<QueueItemResponse>;
    /**
     * Update queue reservation
     */
    updateQueueReservation(reservationId: string, data: Partial<CreateReservedDTO>): Promise<QueueItemResponse>;
    /**
     * Get queue for specific date
     */
    getQueueForDate(date: Date | string): Promise<QueueItemResponse[]>;
    /**
     * Get all queues (grouped by date)
     */
    getAllQueues(): Promise<QueueItemResponse[]>;
    /**
     * Swap two reservations' positions
     */
    swapPositions(id1: string, id2: string): Promise<void>;
    /**
     * Move reservation to specific position
     */
    moveToPosition(reservationId: string, newPosition: number): Promise<void>;
    /**
     * Rebuild queue positions for all dates
     * Renumbers all RESERVED reservations per date based on createdAt
     */
    rebuildPositions(): Promise<{
        updatedCount: number;
        dateCount: number;
    }>;
    /**
     * Promote RESERVED reservation to PENDING/CONFIRMED
     */
    promoteReservation(reservationId: string, data: PromoteReservationDTO): Promise<any>;
    /**
     * Get queue statistics
     */
    getQueueStats(): Promise<QueueStats>;
    /**
     * Auto-cancel expired RESERVED reservations
     */
    autoCancelExpired(): Promise<AutoCancelResult>;
    /**
     * Format queue item for response
     */
    private formatQueueItem;
}
declare const _default: QueueService;
export default _default;
//# sourceMappingURL=queue.service.d.ts.map