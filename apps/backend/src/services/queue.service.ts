/**
 * Queue Service
 * Business logic for reservation queue management
 * ✨ UPDATED: Fixed unique constraint conflict in batch update (Bug #9)
 */

import { PrismaClient, ReservationStatus, Prisma } from '@prisma/client';
import {
  CreateReservedDTO,
  PromoteReservationDTO,
  QueueItemResponse,
  QueueStats,
  AutoCancelResult,
  BatchUpdatePositionsDTO,
} from '../types/queue.types';

const prisma = new PrismaClient();

// ✨ BUG #5 FIX: Retry helper for race conditions
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a lock-related error
      const isLockError = 
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' || // Transaction timeout
        error.message?.includes('lock_not_available') || // PostgreSQL NOWAIT lock
        error.message?.includes('55P03'); // PostgreSQL lock error code
      
      // Only retry on lock errors
      if (!isLockError || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export class QueueService {
  /**
   * Add reservation to queue (create RESERVED status)
   */
  async addToQueue(data: CreateReservedDTO, createdById: string): Promise<QueueItemResponse> {
    // Validate required fields
    if (!data.clientId || !data.reservationQueueDate || !data.guests) {
      throw new Error('Client, queue date, and guests are required');
    }

    // Validate guests
    if (data.guests < 1) {
      throw new Error('Number of guests must be at least 1');
    }

    // Parse queue date and normalize to start of day
    const queueDate = new Date(data.reservationQueueDate);
    if (isNaN(queueDate.getTime())) {
      throw new Error('Invalid queue date format');
    }
    queueDate.setHours(0, 0, 0, 0);

    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (queueDate < today) {
      throw new Error('Queue date cannot be in the past');
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Get next position for this date (use separate date objects to avoid mutation)
    const startOfDay = new Date(queueDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queueDate);
    endOfDay.setHours(23, 59, 59, 999);

    const maxPosition = await prisma.reservation.aggregate({
      where: {
        status: ReservationStatus.RESERVED,
        reservationQueueDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      _max: {
        reservationQueuePosition: true,
      },
    });

    const nextPosition = (maxPosition._max.reservationQueuePosition || 0) + 1;

    try {
      // Create reservation with start of day timestamp
      const reservation = await prisma.reservation.create({
        data: {
          clientId: data.clientId,
          createdById,
          status: ReservationStatus.RESERVED,
          reservationQueueDate: queueDate,
          reservationQueuePosition: nextPosition,
          queueOrderManual: false,
          guests: data.guests,
          adults: data.adults || data.guests,
          children: data.children || 0,
          toddlers: data.toddlers || 0,
          totalPrice: 0,
          pricePerAdult: 0,
          pricePerChild: 0,
          pricePerToddler: 0,
          notes: data.notes || null,
        },
        include: {
          client: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return this.formatQueueItem(reservation);
    } catch (error: any) {
      // Handle unique constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error(
            `Position ${nextPosition} is already taken for this date. ` +
            'This might be a race condition. Please try again.'
          );
        }
      }
      throw error;
    }
  }

  /**
   * Update queue reservation
   */
  async updateQueueReservation(
    reservationId: string,
    data: Partial<CreateReservedDTO>
  ): Promise<QueueItemResponse> {
    // Get existing reservation
    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!existing) {
      throw new Error('Reservation not found');
    }

    if (existing.status !== ReservationStatus.RESERVED) {
      throw new Error('Can only update RESERVED reservations');
    }

    // Store old date and position for renumbering
    const oldDate = existing.reservationQueueDate;
    const oldPosition = existing.reservationQueuePosition;

    // Build update data
    const updateData: any = {};

    if (data.clientId) {
      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
      });
      if (!client) {
        throw new Error('Client not found');
      }
      updateData.clientId = data.clientId;
    }

    let dateChanged = false;

    if (data.reservationQueueDate) {
      const queueDate = new Date(data.reservationQueueDate);
      if (isNaN(queueDate.getTime())) {
        throw new Error('Invalid queue date format');
      }
      // Normalize to start of day
      queueDate.setHours(0, 0, 0, 0);

      // Check if date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (queueDate < today) {
        throw new Error('Queue date cannot be in the past');
      }

      // Check if date actually changed
      const oldDateNormalized = oldDate ? new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate()) : null;
      const newDateNormalized = new Date(queueDate.getFullYear(), queueDate.getMonth(), queueDate.getDate());
      
      dateChanged = !oldDateNormalized || oldDateNormalized.getTime() !== newDateNormalized.getTime();

      if (dateChanged) {
        // Recalculate position for new date
        const startOfDay = new Date(queueDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queueDate);
        endOfDay.setHours(23, 59, 59, 999);

        const maxPosition = await prisma.reservation.aggregate({
          where: {
            status: ReservationStatus.RESERVED,
            reservationQueueDate: {
              gte: startOfDay,
              lt: endOfDay,
            },
            id: { not: reservationId }, // Exclude current reservation
          },
          _max: {
            reservationQueuePosition: true,
          },
        });

        const nextPosition = (maxPosition._max.reservationQueuePosition || 0) + 1;
        updateData.reservationQueuePosition = nextPosition;
        updateData.queueOrderManual = false; // Reset manual flag when changing date
      }

      updateData.reservationQueueDate = queueDate;
    }

    if (data.guests !== undefined) {
      if (data.guests < 1) {
        throw new Error('Number of guests must be at least 1');
      }
      updateData.guests = data.guests;
      updateData.adults = data.adults || data.guests;
      updateData.children = data.children || 0;
      updateData.toddlers = data.toddlers || 0;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes || null;
    }

    // Update reservation
    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Renumber old date if date was changed
    if (dateChanged && oldDate && oldPosition) {
      const startOfOldDay = new Date(oldDate);
      startOfOldDay.setHours(0, 0, 0, 0);
      const endOfOldDay = new Date(oldDate);
      endOfOldDay.setHours(23, 59, 59, 999);

      // Decrease position for all reservations with higher position on the OLD date
      await prisma.reservation.updateMany({
        where: {
          status: ReservationStatus.RESERVED,
          reservationQueueDate: {
            gte: startOfOldDay,
            lte: endOfOldDay,
          },
          reservationQueuePosition: {
            gt: oldPosition,
          },
        },
        data: {
          reservationQueuePosition: {
            decrement: 1,
          },
        },
      });
    }

    return this.formatQueueItem(updated);
  }

  /**
   * Get queue for specific date
   */
  async getQueueForDate(date: Date | string): Promise<QueueItemResponse[]> {
    const queueDate = new Date(date);
    if (isNaN(queueDate.getTime())) {
      throw new Error('Invalid date format');
    }

    const startOfDay = new Date(queueDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(queueDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.RESERVED,
        reservationQueueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { reservationQueuePosition: 'asc' },
      ],
    });

    return reservations.map((r) => this.formatQueueItem(r));
  }

  /**
   * Get all queues (grouped by date)
   */
  async getAllQueues(): Promise<QueueItemResponse[]> {
    const reservations = await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.RESERVED,
      },
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { reservationQueueDate: 'asc' },
        { reservationQueuePosition: 'asc' },
      ],
    });

    return reservations.map((r) => this.formatQueueItem(r));
  }

  /**
   * Swap two reservations' positions
   * ✨ BUG #5 FIX: Added retry logic for race conditions
   */
  async swapPositions(id1: string, id2: string): Promise<void> {
    // Validate IDs
    if (!id1 || !id2) {
      throw new Error('Both reservation IDs are required');
    }

    if (id1 === id2) {
      throw new Error('Cannot swap reservation with itself');
    }

    // Get both reservations
    const [res1, res2] = await Promise.all([
      prisma.reservation.findUnique({ where: { id: id1 } }),
      prisma.reservation.findUnique({ where: { id: id2 } }),
    ]);

    if (!res1 || !res2) {
      throw new Error('One or both reservations not found');
    }

    // Verify both are RESERVED
    if (res1.status !== ReservationStatus.RESERVED || res2.status !== ReservationStatus.RESERVED) {
      throw new Error('Can only swap RESERVED reservations');
    }

    // Verify same date
    const date1 = res1.reservationQueueDate?.toDateString();
    const date2 = res2.reservationQueueDate?.toDateString();

    if (date1 !== date2) {
      throw new Error('Can only swap reservations on the same date');
    }

    // ✨ BUG #5 FIX: Wrap in retry logic
    try {
      await withRetry(async () => {
        await prisma.$executeRaw`SELECT swap_queue_positions(${id1}::UUID, ${id2}::UUID)`;
      });
    } catch (error: any) {
      // ✨ BUG #5 FIX: User-friendly error messages
      if (error.message?.includes('lock') || error.code === 'P2034') {
        throw new Error(
          'Another user is modifying the queue. Please refresh and try again.'
        );
      }
      if (error.code === 'P2002') {
        throw new Error('Position conflict detected. Please refresh and try again.');
      }
      throw error;
    }
  }

  /**
   * Move reservation to specific position
   * ✨ BUG #5 FIX: Added retry logic for race conditions
   */
  async moveToPosition(reservationId: string, newPosition: number): Promise<void> {
    // Validate
    if (!reservationId) {
      throw new Error('Reservation ID is required');
    }

    if (!newPosition || !Number.isInteger(newPosition) || newPosition < 1) {
      throw new Error('Position must be a positive integer (>= 1)');
    }

    // Get reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        status: true,
        reservationQueueDate: true,
        reservationQueuePosition: true,
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.RESERVED) {
      throw new Error('Can only move RESERVED reservations');
    }

    if (!reservation.reservationQueueDate) {
      throw new Error('Reservation has no queue date');
    }

    // Validate against maxPosition
    const startOfDay = new Date(reservation.reservationQueueDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservation.reservationQueueDate);
    endOfDay.setHours(23, 59, 59, 999);

    const totalCount = await prisma.reservation.count({
      where: {
        status: ReservationStatus.RESERVED,
        reservationQueueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (newPosition > totalCount) {
      throw new Error(
        `Position ${newPosition} is invalid. ` +
        `There are only ${totalCount} reservation(s) in the queue for this date. ` +
        `Position must be between 1 and ${totalCount}.`
      );
    }

    // Check if already at this position
    if (reservation.reservationQueuePosition === newPosition) {
      // No-op, but don't throw error
      return;
    }

    // ✨ BUG #5 FIX: Wrap in retry logic
    try {
      await withRetry(async () => {
        await prisma.$executeRaw`SELECT move_to_queue_position(${reservationId}::UUID, ${newPosition}::INTEGER)`;
      });
    } catch (error: any) {
      // ✨ BUG #5 FIX: User-friendly error messages
      if (error.message?.includes('lock') || error.code === 'P2034') {
        throw new Error(
          'Another user is modifying the queue. Please refresh and try again.'
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error(
            `Position ${newPosition} is already occupied. ` +
            'Please refresh and try again.'
          );
        }
      }
      throw error;
    }
  }

  /**
   * Batch update queue positions atomically
   * ✨ BUG #9 FIX: Atomic transaction with temporary negative positions
   * 
   * This method updates multiple positions in a single transaction,
   * preventing race conditions and unique constraint conflicts.
   * 
   * Strategy: Use temporary NEGATIVE positions to avoid conflicts,
   * then update to final positive positions.
   */
  async batchUpdatePositions(
    updates: Array<{ id: string; position: number }>
  ): Promise<{ updatedCount: number }> {
    // Validate
    if (!updates || updates.length === 0) {
      throw new Error('At least one update is required');
    }

    // Validate each update
    for (const update of updates) {
      if (!update.id) {
        throw new Error('Each update must have a reservation ID');
      }
      if (!Number.isInteger(update.position) || update.position < 1) {
        throw new Error(`Invalid position ${update.position} for reservation ${update.id}`);
      }
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get all reservations that need updating
      const reservationIds = updates.map(u => u.id);
      const reservations = await tx.reservation.findMany({
        where: {
          id: { in: reservationIds },
        },
        select: {
          id: true,
          status: true,
          reservationQueueDate: true,
          reservationQueuePosition: true,
        },
      });

      // Validate all exist and are RESERVED
      if (reservations.length !== updates.length) {
        throw new Error('One or more reservations not found');
      }

      for (const res of reservations) {
        if (res.status !== ReservationStatus.RESERVED) {
          throw new Error(`Reservation ${res.id} is not RESERVED`);
        }
        if (!res.reservationQueueDate) {
          throw new Error(`Reservation ${res.id} has no queue date`);
        }
      }

      // Verify all reservations are on the same date
      const firstDate = reservations[0].reservationQueueDate?.toDateString();
      for (const res of reservations) {
        if (res.reservationQueueDate?.toDateString() !== firstDate) {
          throw new Error('All reservations must be on the same date');
        }
      }

      // Verify no duplicate positions in updates
      const positions = updates.map(u => u.position);
      const uniquePositions = new Set(positions);
      if (positions.length !== uniquePositions.size) {
        throw new Error('Duplicate positions detected in updates');
      }

      // ✨ FIX: Step 1 - Set all to TEMPORARY NEGATIVE positions
      // This avoids unique constraint conflicts
      console.log('Step 1: Setting temporary negative positions...');
      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        const tempPosition = -(i + 1); // -1, -2, -3, etc.
        
        await tx.reservation.update({
          where: { id: update.id },
          data: {
            reservationQueuePosition: tempPosition,
          },
        });
      }

      // ✨ FIX: Step 2 - Set to FINAL positions
      console.log('Step 2: Setting final positions...');
      let updatedCount = 0;
      for (const update of updates) {
        await tx.reservation.update({
          where: { id: update.id },
          data: {
            reservationQueuePosition: update.position,
            queueOrderManual: true, // Mark as manually ordered
          },
        });
        updatedCount++;
      }

      return { updatedCount };
    });

    return result;
  }

  /**
   * Rebuild queue positions for all dates
   * Renumbers all RESERVED reservations per date based on createdAt
   * ✨ FIX: Don't modify date, just renumber positions
   */
  async rebuildPositions(): Promise<{ updatedCount: number; dateCount: number }> {
    // Get all RESERVED reservations grouped by date
    const reservations = await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.RESERVED,
      },
      select: {
        id: true,
        reservationQueueDate: true,
        createdAt: true,
      },
      orderBy: [
        { reservationQueueDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (reservations.length === 0) {
      return { updatedCount: 0, dateCount: 0 };
    }

    // Group by date
    const byDate = new Map<string, Array<{ id: string; createdAt: Date }>>(); 
    
    reservations.forEach((r) => {
      if (r.reservationQueueDate) {
        const dateKey = r.reservationQueueDate.toISOString().split('T')[0];
        if (!byDate.has(dateKey)) {
          byDate.set(dateKey, []);
        }
        byDate.get(dateKey)!.push({ id: r.id, createdAt: r.createdAt });
      }
    });

    // Update positions per date
    let updatedCount = 0;
    
    for (const [dateKey, items] of byDate.entries()) {
      // Sort by createdAt within each date
      items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      // ✨ FIX: Only update position and queueOrderManual, don't touch date
      for (let i = 0; i < items.length; i++) {
        await prisma.reservation.update({
          where: { id: items[i].id },
          data: {
            reservationQueuePosition: i + 1,
            queueOrderManual: false, // Reset manual flag
            // ✨ FIX: Don't update reservationQueueDate - keep existing date as-is
          },
        });
        updatedCount++;
      }
    }

    return {
      updatedCount,
      dateCount: byDate.size,
    };
  }

  /**
   * Promote RESERVED reservation to PENDING/CONFIRMED
   */
  async promoteReservation(
    reservationId: string,
    data: PromoteReservationDTO
  ): Promise<any> {
    // Get reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== ReservationStatus.RESERVED) {
      throw new Error('Can only promote RESERVED reservations');
    }

    // Store old queue date and position for renumbering
    const oldQueueDate = reservation.reservationQueueDate;
    const oldPosition = reservation.reservationQueuePosition;

    // Validate required fields
    if (!data.hallId || !data.eventTypeId || !data.startDateTime || !data.endDateTime) {
      throw new Error('Hall, event type, start time, and end time are required');
    }

    // Parse dates
    const startDateTime = new Date(data.startDateTime);
    const endDateTime = new Date(data.endDateTime);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      throw new Error('Invalid date/time format');
    }

    if (endDateTime <= startDateTime) {
      throw new Error('End time must be after start time');
    }

    // Check hall availability
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        id: { not: reservationId },
        hallId: data.hallId,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
        OR: [
          {
            AND: [
              { startDateTime: { lte: startDateTime } },
              { endDateTime: { gt: startDateTime } },
            ],
          },
          {
            AND: [
              { startDateTime: { lt: endDateTime } },
              { endDateTime: { gte: endDateTime } },
            ],
          },
          {
            AND: [
              { startDateTime: { gte: startDateTime } },
              { endDateTime: { lte: endDateTime } },
            ],
          },
        ],
      },
    });

    if (conflictingReservation) {
      throw new Error('Hall is already booked for this time slot');
    }

    // Calculate total price
    const totalPrice =
      data.adults * data.pricePerAdult +
      (data.children || 0) * (data.pricePerChild || 0) +
      (data.toddlers || 0) * (data.pricePerToddler || 0);

    // Update reservation (this will trigger auto-recalculation)
    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: data.status === 'CONFIRMED' ? ReservationStatus.CONFIRMED : ReservationStatus.PENDING,
        hallId: data.hallId,
        eventTypeId: data.eventTypeId,
        startDateTime,
        endDateTime,
        adults: data.adults,
        children: data.children || 0,
        toddlers: data.toddlers || 0,
        guests: data.adults + (data.children || 0) + (data.toddlers || 0),
        pricePerAdult: data.pricePerAdult,
        pricePerChild: data.pricePerChild || 0,
        pricePerToddler: data.pricePerToddler || 0,
        totalPrice,
        notes: data.notes || reservation.notes,
        customEventType: data.customEventType || null,
        birthdayAge: data.birthdayAge || null,
        anniversaryYear: data.anniversaryYear || null,
        anniversaryOccasion: data.anniversaryOccasion || null,
        // Clear queue fields
        reservationQueuePosition: null,
        reservationQueueDate: null,
      },
      include: {
        client: true,
        hall: true,
        eventType: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Renumber remaining reservations on the same date
    if (oldQueueDate && oldPosition) {
      const startOfDay = new Date(oldQueueDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(oldQueueDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Decrease position for all reservations with higher position on the same date
      await prisma.reservation.updateMany({
        where: {
          status: ReservationStatus.RESERVED,
          reservationQueueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          reservationQueuePosition: {
            gt: oldPosition,
          },
        },
        data: {
          reservationQueuePosition: {
            decrement: 1,
          },
        },
      });
    }

    return updated;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const reservations = await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.RESERVED,
      },
      select: {
        reservationQueueDate: true,
        guests: true,
        queueOrderManual: true,
      },
    });

    // Group by date
    const byDate = new Map<string, { count: number; totalGuests: number }>();
    let manualCount = 0;
    let oldestDate: Date | null = null;

    reservations.forEach((r) => {
      if (r.reservationQueueDate) {
        const dateKey = r.reservationQueueDate.toISOString().split('T')[0];
        const existing = byDate.get(dateKey) || { count: 0, totalGuests: 0 };
        byDate.set(dateKey, {
          count: existing.count + 1,
          totalGuests: existing.totalGuests + r.guests,
        });

        if (!oldestDate || r.reservationQueueDate < oldestDate) {
          oldestDate = r.reservationQueueDate;
        }
      }

      if (r.queueOrderManual) {
        manualCount++;
      }
    });

    const queuesByDate = Array.from(byDate.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      totalGuests: data.totalGuests,
    }));

    return {
      totalQueued: reservations.length,
      queuesByDate,
      oldestQueueDate: oldestDate,
      manualOrderCount: manualCount,
    };
  }

  /**
   * Auto-cancel expired RESERVED reservations
   */
  async autoCancelExpired(): Promise<AutoCancelResult> {
    const result = await prisma.$queryRaw<Array<{ cancelled_count: number; cancelled_ids: string[] }>>`
      SELECT * FROM auto_cancel_expired_reserved()
    `;

    if (result && result.length > 0) {
      return {
        cancelledCount: result[0].cancelled_count,
        cancelledIds: result[0].cancelled_ids || [],
      };
    }

    return {
      cancelledCount: 0,
      cancelledIds: [],
    };
  }

  /**
   * Format queue item for response
   */
  private formatQueueItem(reservation: any): QueueItemResponse {
    return {
      id: reservation.id,
      position: reservation.reservationQueuePosition || 0,
      queueDate: reservation.reservationQueueDate,
      guests: reservation.guests,
      client: {
        id: reservation.client.id,
        firstName: reservation.client.firstName,
        lastName: reservation.client.lastName,
        phone: reservation.client.phone,
        email: reservation.client.email,
      },
      isManualOrder: reservation.queueOrderManual,
      notes: reservation.notes,
      createdAt: reservation.createdAt,
      createdBy: {
        id: reservation.createdBy.id,
        firstName: reservation.createdBy.firstName,
        lastName: reservation.createdBy.lastName,
      },
    };
  }
}

export default new QueueService();
