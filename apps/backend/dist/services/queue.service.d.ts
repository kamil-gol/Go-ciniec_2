/**
 * Queue Service
 * Business logic for reservation queue management
 * Updated: Phase 2 Audit — logChange() for all queue operations
 * FIX: Replaced raw SQL auto_cancel_expired_reserved() with Prisma ORM (19.02.2026)
 * FIX: BUG8 — position > max and swap-self now throw AppError.badRequest (20.02.2026)
 */
import { CreateReservedDTO, PromoteReservationDTO, QueueItemResponse, QueueStats, AutoCancelResult } from '../types/queue.types';
export declare class QueueService {
    addToQueue(data: CreateReservedDTO, createdById: string): Promise<QueueItemResponse>;
    updateQueueReservation(reservationId: string, data: Partial<CreateReservedDTO>, userId: string): Promise<QueueItemResponse>;
    getQueueForDate(date: Date | string): Promise<QueueItemResponse[]>;
    getAllQueues(): Promise<QueueItemResponse[]>;
    swapPositions(id1: string, id2: string, userId: string): Promise<void>;
    moveToPosition(reservationId: string, newPosition: number, userId: string): Promise<void>;
    batchUpdatePositions(updates: Array<{
        id: string;
        position: number;
    }>, userId: string): Promise<{
        updatedCount: number;
    }>;
    rebuildPositions(userId: string): Promise<{
        updatedCount: number;
        dateCount: number;
    }>;
    promoteReservation(reservationId: string, data: PromoteReservationDTO, userId: string): Promise<any>;
    getQueueStats(): Promise<QueueStats>;
    /**
     * Auto-cancel expired RESERVED reservations
     * FIX: Replaced raw SQL auto_cancel_expired_reserved() with Prisma ORM
     * Bug #7: Only cancels reservations with queue date BEFORE today
     *   (today's entries are NOT cancelled)
     */
    autoCancelExpired(userId?: string): Promise<AutoCancelResult>;
    private formatQueueItem;
}
declare const _default: QueueService;
export default _default;
//# sourceMappingURL=queue.service.d.ts.map