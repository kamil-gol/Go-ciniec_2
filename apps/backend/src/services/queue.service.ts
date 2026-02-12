/**
 * Queue Service
 * Business logic for reservation queue management
 */

import { ReservationStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  CreateReservedDTO,
  PromoteReservationDTO,
  QueueItemResponse,
  QueueStats,
  AutoCancelResult,
  BatchUpdatePositionsDTO,
} from '../types/queue.types';

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
      const isLockError = 
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' ||
        error.message?.includes('lock_not_available') ||
        error.message?.includes('55P03');
      if (!isLockError || attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

export class QueueService {
  async addToQueue(data: CreateReservedDTO, createdById: string): Promise<QueueItemResponse> {
    if (!data.clientId || !data.reservationQueueDate || !data.guests) {
      throw new Error('Client, queue date, and guests are required');
    }
    if (data.guests < 1) throw new Error('Number of guests must be at least 1');

    const queueDate = new Date(data.reservationQueueDate);
    if (isNaN(queueDate.getTime())) throw new Error('Invalid queue date format');
    queueDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (queueDate < today) throw new Error('Queue date cannot be in the past');

    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) throw new Error('Client not found');

    const startOfDay = new Date(queueDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queueDate); endOfDay.setHours(23, 59, 59, 999);

    const maxPosition = await prisma.reservation.aggregate({
      where: {
        status: ReservationStatus.RESERVED,
        reservationQueueDate: { gte: startOfDay, lt: endOfDay }
      },
      _max: { reservationQueuePosition: true }
    });

    const nextPosition = (maxPosition._max.reservationQueuePosition || 0) + 1;

    try {
      const reservation = await prisma.reservation.create({
        data: {
          clientId: data.clientId, createdById, status: ReservationStatus.RESERVED,
          reservationQueueDate: queueDate, reservationQueuePosition: nextPosition,
          queueOrderManual: false, guests: data.guests,
          adults: data.adults || data.guests, children: data.children || 0,
          toddlers: data.toddlers || 0, totalPrice: 0, pricePerAdult: 0,
          pricePerChild: 0, pricePerToddler: 0, notes: data.notes || null
        },
        include: {
          client: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } }
        }
      });
      return this.formatQueueItem(reservation);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new Error(`Position ${nextPosition} is already taken for this date. Please try again.`);
      }
      throw error;
    }
  }

  async updateQueueReservation(reservationId: string, data: Partial<CreateReservedDTO>): Promise<QueueItemResponse> {
    const existing = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!existing) throw new Error('Reservation not found');
    if (existing.status !== ReservationStatus.RESERVED) throw new Error('Can only update RESERVED reservations');

    const oldDate = existing.reservationQueueDate;
    const oldPosition = existing.reservationQueuePosition;
    const updateData: any = {};
    let dateChanged = false;

    if (data.clientId) {
      const client = await prisma.client.findUnique({ where: { id: data.clientId } });
      if (!client) throw new Error('Client not found');
      updateData.clientId = data.clientId;
    }

    if (data.reservationQueueDate) {
      const queueDate = new Date(data.reservationQueueDate);
      if (isNaN(queueDate.getTime())) throw new Error('Invalid queue date format');
      queueDate.setHours(0, 0, 0, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (queueDate < today) throw new Error('Queue date cannot be in the past');

      const oldDateNormalized = oldDate ? new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate()) : null;
      const newDateNormalized = new Date(queueDate.getFullYear(), queueDate.getMonth(), queueDate.getDate());
      dateChanged = !oldDateNormalized || oldDateNormalized.getTime() !== newDateNormalized.getTime();

      if (dateChanged) {
        const startOfDay = new Date(queueDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queueDate); endOfDay.setHours(23, 59, 59, 999);
        const maxPosition = await prisma.reservation.aggregate({
          where: { status: ReservationStatus.RESERVED, reservationQueueDate: { gte: startOfDay, lt: endOfDay }, id: { not: reservationId } },
          _max: { reservationQueuePosition: true }
        });
        updateData.reservationQueuePosition = (maxPosition._max.reservationQueuePosition || 0) + 1;
        updateData.queueOrderManual = false;
      }
      updateData.reservationQueueDate = queueDate;
    }

    if (data.guests !== undefined) {
      if (data.guests < 1) throw new Error('Number of guests must be at least 1');
      updateData.guests = data.guests;
      updateData.adults = data.adults || data.guests;
      updateData.children = data.children || 0;
      updateData.toddlers = data.toddlers || 0;
    }

    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const updated = await prisma.reservation.update({
      where: { id: reservationId }, data: updateData,
      include: { client: true, createdBy: { select: { id: true, firstName: true, lastName: true } } }
    });

    if (dateChanged && oldDate && oldPosition) {
      const startOfOldDay = new Date(oldDate); startOfOldDay.setHours(0, 0, 0, 0);
      const endOfOldDay = new Date(oldDate); endOfOldDay.setHours(23, 59, 59, 999);
      await prisma.reservation.updateMany({
        where: {
          status: ReservationStatus.RESERVED,
          reservationQueueDate: { gte: startOfOldDay, lte: endOfOldDay },
          reservationQueuePosition: { gt: oldPosition }
        },
        data: { reservationQueuePosition: { decrement: 1 } }
      });
    }

    return this.formatQueueItem(updated);
  }

  async getQueueForDate(date: Date | string): Promise<QueueItemResponse[]> {
    const queueDate = new Date(date);
    if (isNaN(queueDate.getTime())) throw new Error('Invalid date format');
    const startOfDay = new Date(queueDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queueDate); endOfDay.setHours(23, 59, 59, 999);

    const reservations = await prisma.reservation.findMany({
      where: { status: ReservationStatus.RESERVED, reservationQueueDate: { gte: startOfDay, lte: endOfDay } },
      include: { client: true, createdBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ reservationQueuePosition: 'asc' }]
    });
    return reservations.map(r => this.formatQueueItem(r));
  }

  async getAllQueues(): Promise<QueueItemResponse[]> {
    const reservations = await prisma.reservation.findMany({
      where: { status: ReservationStatus.RESERVED },
      include: { client: true, createdBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ reservationQueueDate: 'asc' }, { reservationQueuePosition: 'asc' }]
    });
    return reservations.map(r => this.formatQueueItem(r));
  }

  async swapPositions(id1: string, id2: string): Promise<void> {
    if (!id1 || !id2) throw new Error('Both reservation IDs are required');
    if (id1 === id2) throw new Error('Cannot swap reservation with itself');

    const [res1, res2] = await Promise.all([
      prisma.reservation.findUnique({ where: { id: id1 } }),
      prisma.reservation.findUnique({ where: { id: id2 } })
    ]);
    if (!res1 || !res2) throw new Error('One or both reservations not found');
    if (res1.status !== ReservationStatus.RESERVED || res2.status !== ReservationStatus.RESERVED) {
      throw new Error('Can only swap RESERVED reservations');
    }
    if (res1.reservationQueueDate?.toDateString() !== res2.reservationQueueDate?.toDateString()) {
      throw new Error('Can only swap reservations on the same date');
    }

    try {
      await withRetry(async () => {
        await prisma.$executeRaw`SELECT swap_queue_positions(${id1}::UUID, ${id2}::UUID)`;
      });
    } catch (error: any) {
      if (error.message?.includes('lock') || error.code === 'P2034') {
        throw new Error('Another user is modifying the queue. Please refresh and try again.');
      }
      if (error.code === 'P2002') throw new Error('Position conflict detected. Please refresh and try again.');
      throw error;
    }
  }

  async moveToPosition(reservationId: string, newPosition: number): Promise<void> {
    if (!reservationId) throw new Error('Reservation ID is required');
    if (!newPosition || !Number.isInteger(newPosition) || newPosition < 1) {
      throw new Error('Position must be a positive integer (>= 1)');
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, status: true, reservationQueueDate: true, reservationQueuePosition: true }
    });
    if (!reservation) throw new Error('Reservation not found');
    if (reservation.status !== ReservationStatus.RESERVED) throw new Error('Can only move RESERVED reservations');
    if (!reservation.reservationQueueDate) throw new Error('Reservation has no queue date');

    const startOfDay = new Date(reservation.reservationQueueDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservation.reservationQueueDate); endOfDay.setHours(23, 59, 59, 999);
    const totalCount = await prisma.reservation.count({
      where: { status: ReservationStatus.RESERVED, reservationQueueDate: { gte: startOfDay, lte: endOfDay } }
    });
    if (newPosition > totalCount) {
      throw new Error(`Position ${newPosition} is invalid. There are only ${totalCount} reservation(s) in the queue for this date.`);
    }
    if (reservation.reservationQueuePosition === newPosition) return;

    try {
      await withRetry(async () => {
        await prisma.$executeRaw`SELECT move_to_queue_position(${reservationId}::UUID, ${newPosition}::INTEGER)`;
      });
    } catch (error: any) {
      if (error.message?.includes('lock') || error.code === 'P2034') {
        throw new Error('Another user is modifying the queue. Please refresh and try again.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new Error(`Position ${newPosition} is already occupied. Please refresh and try again.`);
      }
      throw error;
    }
  }

  async batchUpdatePositions(updates: Array<{ id: string; position: number }>): Promise<{ updatedCount: number }> {
    if (!updates || updates.length === 0) throw new Error('At least one update is required');
    for (const update of updates) {
      if (!update.id) throw new Error('Each update must have a reservation ID');
      if (!Number.isInteger(update.position) || update.position < 1) {
        throw new Error(`Invalid position ${update.position} for reservation ${update.id}`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const reservationIds = updates.map(u => u.id);
      const reservations = await tx.reservation.findMany({
        where: { id: { in: reservationIds } },
        select: { id: true, status: true, reservationQueueDate: true, reservationQueuePosition: true }
      });
      if (reservations.length !== updates.length) throw new Error('One or more reservations not found');

      for (const res of reservations) {
        if (res.status !== ReservationStatus.RESERVED) throw new Error(`Reservation ${res.id} is not RESERVED`);
        if (!res.reservationQueueDate) throw new Error(`Reservation ${res.id} has no queue date`);
      }

      const firstDate = reservations[0].reservationQueueDate?.toDateString();
      for (const res of reservations) {
        if (res.reservationQueueDate?.toDateString() !== firstDate) throw new Error('All reservations must be on the same date');
      }

      const positions = updates.map(u => u.position);
      if (positions.length !== new Set(positions).size) throw new Error('Duplicate positions detected in updates');

      const TEMP_OFFSET = 1000;
      for (let i = 0; i < updates.length; i++) {
        await tx.reservation.update({ where: { id: updates[i].id }, data: { reservationQueuePosition: TEMP_OFFSET + i } });
      }
      let updatedCount = 0;
      for (const update of updates) {
        await tx.reservation.update({ where: { id: update.id }, data: { reservationQueuePosition: update.position, queueOrderManual: true } });
        updatedCount++;
      }
      return { updatedCount };
    });
  }

  async rebuildPositions(): Promise<{ updatedCount: number; dateCount: number }> {
    const reservations = await prisma.reservation.findMany({
      where: { status: ReservationStatus.RESERVED },
      select: { id: true, reservationQueueDate: true, createdAt: true },
      orderBy: [{ reservationQueueDate: 'asc' }, { createdAt: 'asc' }]
    });
    if (reservations.length === 0) return { updatedCount: 0, dateCount: 0 };

    const byDate = new Map<string, Array<{ id: string; createdAt: Date }>>();
    reservations.forEach(r => {
      if (r.reservationQueueDate) {
        const dateKey = r.reservationQueueDate.toISOString().split('T')[0];
        if (!byDate.has(dateKey)) byDate.set(dateKey, []);
        byDate.get(dateKey)!.push({ id: r.id, createdAt: r.createdAt });
      }
    });

    let updatedCount = 0;
    for (const [, items] of byDate.entries()) {
      items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      for (let i = 0; i < items.length; i++) {
        await prisma.reservation.update({
          where: { id: items[i].id },
          data: { reservationQueuePosition: i + 1, queueOrderManual: false }
        });
        updatedCount++;
      }
    }
    return { updatedCount, dateCount: byDate.size };
  }

  async promoteReservation(reservationId: string, data: PromoteReservationDTO): Promise<any> {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new Error('Reservation not found');
    if (reservation.status !== ReservationStatus.RESERVED) throw new Error('Can only promote RESERVED reservations');

    const oldQueueDate = reservation.reservationQueueDate;
    const oldPosition = reservation.reservationQueuePosition;

    if (!data.hallId || !data.eventTypeId || !data.startDateTime || !data.endDateTime) {
      throw new Error('Hall, event type, start time, and end time are required');
    }

    const startDateTime = new Date(data.startDateTime);
    const endDateTime = new Date(data.endDateTime);
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) throw new Error('Invalid date/time format');
    if (endDateTime <= startDateTime) throw new Error('End time must be after start time');

    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        id: { not: reservationId }, hallId: data.hallId,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
        OR: [
          { AND: [{ startDateTime: { lte: startDateTime } }, { endDateTime: { gt: startDateTime } }] },
          { AND: [{ startDateTime: { lt: endDateTime } }, { endDateTime: { gte: endDateTime } }] },
          { AND: [{ startDateTime: { gte: startDateTime } }, { endDateTime: { lte: endDateTime } }] }
        ]
      }
    });
    if (conflictingReservation) throw new Error('Hall is already booked for this time slot');

    const totalPrice = data.adults * data.pricePerAdult + (data.children || 0) * (data.pricePerChild || 0) + (data.toddlers || 0) * (data.pricePerToddler || 0);

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: data.status === 'CONFIRMED' ? ReservationStatus.CONFIRMED : ReservationStatus.PENDING,
        hallId: data.hallId, eventTypeId: data.eventTypeId, startDateTime, endDateTime,
        adults: data.adults, children: data.children || 0, toddlers: data.toddlers || 0,
        guests: data.adults + (data.children || 0) + (data.toddlers || 0),
        pricePerAdult: data.pricePerAdult, pricePerChild: data.pricePerChild || 0,
        pricePerToddler: data.pricePerToddler || 0, totalPrice,
        notes: data.notes || reservation.notes,
        customEventType: data.customEventType || null, birthdayAge: data.birthdayAge || null,
        anniversaryYear: data.anniversaryYear || null, anniversaryOccasion: data.anniversaryOccasion || null,
        reservationQueuePosition: null, reservationQueueDate: null
      },
      include: {
        client: true, hall: true, eventType: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    if (oldQueueDate && oldPosition) {
      const startOfDay = new Date(oldQueueDate); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(oldQueueDate); endOfDay.setHours(23, 59, 59, 999);
      await prisma.reservation.updateMany({
        where: {
          status: ReservationStatus.RESERVED,
          reservationQueueDate: { gte: startOfDay, lte: endOfDay },
          reservationQueuePosition: { gt: oldPosition }
        },
        data: { reservationQueuePosition: { decrement: 1 } }
      });
    }

    return updated;
  }

  async getQueueStats(): Promise<QueueStats> {
    const reservations = await prisma.reservation.findMany({
      where: { status: ReservationStatus.RESERVED },
      select: { reservationQueueDate: true, guests: true, queueOrderManual: true }
    });

    const byDate = new Map<string, { count: number; totalGuests: number }>();
    let manualCount = 0;
    let oldestDate: Date | null = null;

    reservations.forEach(r => {
      if (r.reservationQueueDate) {
        const dateKey = r.reservationQueueDate.toISOString().split('T')[0];
        const existing = byDate.get(dateKey) || { count: 0, totalGuests: 0 };
        byDate.set(dateKey, { count: existing.count + 1, totalGuests: existing.totalGuests + r.guests });
        if (!oldestDate || r.reservationQueueDate < oldestDate) oldestDate = r.reservationQueueDate;
      }
      if (r.queueOrderManual) manualCount++;
    });

    return {
      totalQueued: reservations.length,
      queuesByDate: Array.from(byDate.entries()).map(([date, data]) => ({ date, count: data.count, totalGuests: data.totalGuests })),
      oldestQueueDate: oldestDate,
      manualOrderCount: manualCount
    };
  }

  async autoCancelExpired(): Promise<AutoCancelResult> {
    const result = await prisma.$queryRaw<Array<{ cancelled_count: number; cancelled_ids: string[] }>>`
      SELECT * FROM auto_cancel_expired_reserved()
    `;
    if (result && result.length > 0) return { cancelledCount: result[0].cancelled_count, cancelledIds: result[0].cancelled_ids || [] };
    return { cancelledCount: 0, cancelledIds: [] };
  }

  private formatQueueItem(reservation: any): QueueItemResponse {
    return {
      id: reservation.id,
      position: reservation.reservationQueuePosition || 0,
      queueDate: reservation.reservationQueueDate,
      guests: reservation.guests,
      client: {
        id: reservation.client.id, firstName: reservation.client.firstName,
        lastName: reservation.client.lastName, phone: reservation.client.phone,
        email: reservation.client.email
      },
      isManualOrder: reservation.queueOrderManual,
      notes: reservation.notes,
      createdAt: reservation.createdAt,
      createdBy: {
        id: reservation.createdBy.id, firstName: reservation.createdBy.firstName,
        lastName: reservation.createdBy.lastName
      }
    };
  }
}

export default new QueueService();
