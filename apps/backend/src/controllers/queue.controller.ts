/**
 * Queue Controller
 * Handle HTTP requests for reservation queue management
 */

import { Request, Response } from 'express';
import queueService from '../services/queue.service';
import {
  CreateReservedDTO,
  PromoteReservationDTO,
  SwapQueuePositionsDTO,
  MoveQueuePositionDTO,
  BatchUpdatePositionsDTO,
} from '../types/queue.types';

export class QueueController {
  /**
   * Add reservation to queue (create RESERVED)
   * POST /api/queue/reserved
   */
  async addToQueue(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateReservedDTO = req.body;
      const userId = (req as any).user?.id;

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
    } catch (error: any) {
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
  async updateQueueReservation(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
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
  async getQueueForDate(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
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
  async getAllQueues(req: Request, res: Response): Promise<void> {
    try {
      const queues = await queueService.getAllQueues();

      res.status(200).json({
        success: true,
        data: queues,
        count: queues.length,
      });
    } catch (error: any) {
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
  async swapPositions(req: Request, res: Response): Promise<void> {
    try {
      const { reservationId1, reservationId2 }: SwapQueuePositionsDTO = req.body;

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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to swap positions',
      });
    }
  }

  /**
   * Move reservation to specific position
   * PUT /api/queue/:id/position
   * ✨ BUG #8 FIX: Enhanced validation and error handling
   */
  async moveToPosition(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPosition } = req.body;

      // Validate reservation ID
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Reservation ID is required',
        });
        return;
      }

      // ✨ BUG #8 FIX: Validate newPosition type and value
      if (newPosition === undefined || newPosition === null) {
        res.status(400).json({
          success: false,
          error: 'Position is required',
        });
        return;
      }

      // Parse as number (in case it comes as string)
      const position = typeof newPosition === 'string' ? parseInt(newPosition, 10) : newPosition;

      if (!Number.isInteger(position)) {
        res.status(400).json({
          success: false,
          error: 'Position must be a valid integer',
        });
        return;
      }

      if (position < 1) {
        res.status(400).json({
          success: false,
          error: 'Position must be at least 1',
        });
        return;
      }

      // Service layer will validate maxPosition
      await queueService.moveToPosition(id, position);

      res.status(200).json({
        success: true,
        message: `Przeniesiono na pozycję #${position}`,
      });
    } catch (error: any) {
      // ✨ BUG #8 FIX: Map error messages to appropriate HTTP status codes
      let statusCode = 400;
      
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('race condition') || error.message.includes('conflict')) {
        statusCode = 409; // Conflict
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to move reservation',
      });
    }
  }

  /**
   * Batch update queue positions atomically
   * POST /api/queue/batch-update-positions
   * ✨ NEW: Fix race conditions in drag & drop reordering
   */
  async batchUpdatePositions(req: Request, res: Response): Promise<void> {
    try {
      const { updates }: BatchUpdatePositionsDTO = req.body;

      // Validate updates array
      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Updates array is required and must contain at least one item',
        });
        return;
      }

      // Validate each update
      for (const update of updates) {
        if (!update.id || typeof update.id !== 'string') {
          res.status(400).json({
            success: false,
            error: 'Each update must have a valid reservation ID',
          });
          return;
        }

        if (!Number.isInteger(update.position) || update.position < 1) {
          res.status(400).json({
            success: false,
            error: 'Each update must have a valid position (integer >= 1)',
          });
          return;
        }
      }

      // Call service to update positions atomically
      const result = await queueService.batchUpdatePositions(updates);

      res.status(200).json({
        success: true,
        data: result,
        message: `Zaktualizowano ${result.updatedCount} pozycji w kolejce`,
      });
    } catch (error: any) {
      let statusCode = 400;
      
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('conflict') || error.message.includes('transaction')) {
        statusCode = 409; // Conflict
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to batch update positions',
      });
    }
  }

  /**
   * Rebuild queue positions for all dates
   * POST /api/queue/rebuild-positions
   */
  async rebuildPositions(req: Request, res: Response): Promise<void> {
    try {
      const result = await queueService.rebuildPositions();

      res.status(200).json({
        success: true,
        data: result,
        message: `Ponumerowano ${result.updatedCount} rezerwacji w ${result.dateCount} datach`,
      });
    } catch (error: any) {
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
  async promoteReservation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: PromoteReservationDTO = req.body;

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
    } catch (error: any) {
      // Map error messages to status codes
      let statusCode = 400;
      
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('already booked')) {
        statusCode = 409; // Conflict
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to promote reservation',
      });
    }
  }

  /**
   * Get queue statistics
   * GET /api/queue/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await queueService.getQueueStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
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
  async autoCancelExpired(req: Request, res: Response): Promise<void> {
    try {
      const result = await queueService.autoCancelExpired();

      res.status(200).json({
        success: true,
        data: result,
        message: `Anulowano ${result.cancelledCount} przeterminowanych rezerwacji`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to auto-cancel reservations',
      });
    }
  }
}

export default new QueueController();
