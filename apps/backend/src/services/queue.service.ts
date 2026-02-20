/**
 * Queue Service
 * Business logic for reservation queue management
 * Updated: Phase 2 Audit — logChange() for all queue operations
 * FIX: Replaced raw SQL auto_cancel_expired_reserved() with Prisma ORM (19.02.2026)
 * FIX: BUG8 — position > max and swap-self now throw AppError.badRequest (20.02.2026)
 */

import { ReservationStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import { logChange } from '../utils/audit-logger';
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
  /* istanbul ignore next -- unreachable: loop always returns or throws */
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

      // Audit log — QUEUE_ADD
      await logChange({
        userId: createdById,
        action: 'QUEUE_ADD',
        entityType: 'RESERVATION',
        entityId: reservation.id,
        details: {
          description: `Dodano do kolejki: ${client.firstName} ${client.lastName} | ${queueDate.toISOString().split('T')[0]} | poz. #${nextPosition} | ${data.guests} gości`,
          clientId: data.clientId,
          clientName: `${client.firstName} ${client.lastName}`,
          queueDate: queueDate.toISOString().split('T')[0],
          position: nextPosition,
          guests: data.guests,
        },
      });

      return this.formatQueueItem(reservation);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new Error(`Position ${nextPosition} is already taken for this date. Please try again.`);
      }
      throw error;
    }
  }

  async updateQueueReservation(reservationId: string, data: Partial<CreateReservedDTO>, userId: string): Promise<QueueItemResponse> {
    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { client: true },
    });
    if (!existing) throw new Error('Reservation not found');
    if (existing.status !== ReservationStatus.RESERVED) throw new Error('Can only update RESERVED reservations');

    const oldDate = existing.reservationQueueDate;
    const oldPosition = existing.reservationQueuePosition;
    const updateData: any = {};
    let dateChanged = false;
    const changes: Record<string, { old: any; new: any }> = {};

    if (data.clientId) {
      const client = await prisma.client.findUnique({ where: { id: data.clientId } });
      if (!client) throw new Error('Client not found');
      if (data.clientId !== existing.clientId) {
        changes.clientId = { old: existing.clientId, new: data.clientId };
      }
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
        changes.queueDate = {
          old: oldDate?.toISOString().split('T')[0] || null,
          new: queueDate.toISOString().split('T')[0],
        };
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
      if (data.guests !== existing.guests) {
        changes.guests = { old: existing.guests, new: data.guests };
      }
      updateData.guests = data.guests;
      updateData.adults = data.adults || data.guests;
      updateData.children = data.children || 0;
      updateData.toddlers = data.toddlers || 0;
    }

    if (data.notes !== undefined && data.notes !== existing.notes) {
      changes.notes = { old: existing.notes, new: data.notes || null };
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

    // Audit log — QUEUE_UPDATE
    if (Object.keys(changes).length > 0) {
      const clientName = (existing.client as any)
        ? `${(existing.client as any).firstName} ${(existing.client as any).lastName}`
        : 'N/A';
      await logChange({
        userId,
        action: 'QUEUE_UPDATE',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Zaktualizowano wpis w kolejce: ${clientName} | ${Object.keys(changes).join(', ')}`,
          changes,
        },
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
      where: {
        status: ReservationStatus.RESERVED,
        reservationQueueDate: { not: null },
      },
      include: { client: true, createdBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ reservationQueueDate: 'asc' }, { reservationQueuePosition: 'asc' }]
    });
    return reservations.map(r => this.formatQueueItem(r));
  }

  async swapPositions(id1: string, id2: string, userId: string): Promise<void> {
    if (!id1 || !id2) throw AppError.badRequest('Both reservation IDs are required');
    if (id1 === id2) throw AppError.badRequest('Cannot swap reservation with itself');

    const [res1, res2] = await Promise.all([
      prisma.reservation.findUnique({ where: { id: id1 }, include: { client: true } }),
      prisma.reservation.findUnique({ where: { id: id2 }, include: { client: true } })
    ]);
    if (!res1 || !res2) throw new Error('One or both reservations not found');
    if (res1.status !== ReservationStatus.RESERVED || res2.status !== ReservationStatus.RESERVED) {
      throw new Error('Can only swap RESERVED reservations');
    }
    if (res1.reservationQueueDate?.toDateString() !== res2.reservationQueueDate?.toDateString()) {
      throw new Error('Can only swap reservations on the same date');
    }

    const pos1 = res1.reservationQueuePosition;
    const pos2 = res2.reservationQueuePosition;

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

    // Audit log — QUEUE_SWAP
    const client1Name = (res1 as any).client
      ? `${(res1 as any).client.firstName} ${(res1 as any).client.lastName}`
      : 'N/A';
    const client2Name = (res2 as any).client
      ? `${(res2 as any).client.firstName} ${(res2 as any).client.lastName}`
      : 'N/A';
    const queueDate = res1.reservationQueueDate?.toISOString().split('T')[0] || 'N/A';
    await logChange({
      userId,
      action: 'QUEUE_SWAP',
      entityType: 'RESERVATION',
      entityId: id1,
      details: {
        description: `Zamieniono pozycje w kolejce: ${client1Name} (#${pos1}) ↔ ${client2Name} (#${pos2}) | ${queueDate}`,
        reservation1: { id: id1, clientName: client1Name, oldPosition: pos1 },
        reservation2: { id: id2, clientName: client2Name, oldPosition: pos2 },
        queueDate,
      },
    });
  }

  async moveToPosition(reservationId: string, newPosition: number, userId: string): Promise<void> {
    if (!reservationId) throw new Error('Reservation ID is required');
    if (!newPosition || !Number.isInteger(newPosition) || newPosition < 1) {
      throw new Error('Position must be a positive integer (>= 1)');
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, status: true, reservationQueueDate: true, reservationQueuePosition: true, clientId: true }
    });
    if (!reservation) throw new Error('Reservation not found');
    if (reservation.status !== ReservationStatus.RESERVED) throw new Error('Can only move RESERVED reservations');
    if (!reservation.reservationQueueDate) throw new Error('Reservation has no queue date');

    const oldPosition = reservation.reservationQueuePosition;

    const startOfDay = new Date(reservation.reservationQueueDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservation.reservationQueueDate); endOfDay.setHours(23, 59, 59, 999);
    const totalCount = await prisma.reservation.count({
      where: { status: ReservationStatus.RESERVED, reservationQueueDate: { gte: startOfDay, lte: endOfDay } }
    });
    if (newPosition > totalCount) {
      throw AppError.badRequest(`Position ${newPosition} is invalid. There are only ${totalCount} reservation(s) in the queue for this date.`);
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

    // Audit log — QUEUE_MOVE
    const client = await prisma.client.findUnique({ where: { id: reservation.clientId } });
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'N/A';
    const queueDate = reservation.reservationQueueDate.toISOString().split('T')[0];
    await logChange({
      userId,
      action: 'QUEUE_MOVE',
      entityType: 'RESERVATION',
      entityId: reservationId,
      details: {
        description: `Przeniesiono w kolejce: ${clientName} | #${oldPosition} → #${newPosition} | ${queueDate}`,
        clientName,
        oldPosition,
        newPosition,
        queueDate,
      },
    });
  }

  async batchUpdatePositions(updates: Array<{ id: string; position: number }>, userId: string): Promise<{ updatedCount: number }> {
    if (!updates || updates.length === 0) throw new Error('At least one update is required');
    for (const update of updates) {
      if (!update.id) throw new Error('Each update must have a reservation ID');
      if (!Number.isInteger(update.position) || update.position < 1) {
        throw new Error(`Invalid position ${update.position} for reservation ${update.id}`);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
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

      // Save old positions for audit
      const oldPositions = new Map(reservations.map(r => [r.id, r.reservationQueuePosition]));

      const TEMP_OFFSET = 1000;
      for (let i = 0; i < updates.length; i++) {
        await tx.reservation.update({ where: { id: updates[i].id }, data: { reservationQueuePosition: TEMP_OFFSET + i } });
      }
      let updatedCount = 0;
      for (const update of updates) {
        await tx.reservation.update({ where: { id: update.id }, data: { reservationQueuePosition: update.position, queueOrderManual: true } });
        updatedCount++;
      }
      return { updatedCount, oldPositions, queueDate: reservations[0].reservationQueueDate };
    });

    // Audit log — QUEUE_REORDER (outside transaction)
    const queueDate = result.queueDate?.toISOString().split('T')[0] || 'N/A';
    const positionChanges = updates.map(u => ({
      reservationId: u.id,
      oldPosition: result.oldPositions.get(u.id),
      newPosition: u.position,
    }));
    await logChange({
      userId,
      action: 'QUEUE_REORDER',
      entityType: 'RESERVATION',
      entityId: updates[0]?.id || 'batch',
      details: {
        description: `Zmieniono kolejność ${result.updatedCount} rezerwacji w kolejce | ${queueDate}`,
        queueDate,
        updatedCount: result.updatedCount,
        positionChanges,
      },
    });

    return { updatedCount: result.updatedCount };
  }

  async rebuildPositions(userId: string): Promise<{ updatedCount: number; dateCount: number }> {
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

    // Audit log — QUEUE_REBUILD
    await logChange({
      userId,
      action: 'QUEUE_REBUILD',
      entityType: 'RESERVATION',
      entityId: 'system',
      details: {
        description: `Przebudowano pozycje kolejki: ${updatedCount} rezerwacji w ${byDate.size} datach`,
        updatedCount,
        dateCount: byDate.size,
        dates: Array.from(byDate.keys()),
      },
    });

    return { updatedCount, dateCount: byDate.size };
  }

  async promoteReservation(reservationId: string, data: PromoteReservationDTO, userId: string): Promise<any> {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { client: true },
    });
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

    const hall = await prisma.hall.findUnique({ where: { id: data.hallId }, select: { name: true } });
    const eventType = await prisma.eventType.findUnique({ where: { id: data.eventTypeId }, select: { name: true } });

    const totalPrice = data.adults * data.pricePerAdult + (data.children || 0) * (data.pricePerChild || 0) + (data.toddlers || 0) * (data.pricePerToddler || 0);
    const newStatus = data.status === 'CONFIRMED' ? ReservationStatus.CONFIRMED : ReservationStatus.PENDING;

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: newStatus,
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

    // Audit log — QUEUE_PROMOTE
    const clientName = (reservation.client as any)
      ? `${(reservation.client as any).firstName} ${(reservation.client as any).lastName}`
      : 'N/A';
    await logChange({
      userId,
      action: 'QUEUE_PROMOTE',
      entityType: 'RESERVATION',
      entityId: reservationId,
      details: {
        description: `Awansowano z kolejki: ${clientName} | ${hall?.name || 'N/A'} | ${eventType?.name || 'N/A'} | ${newStatus}`,
        clientName,
        fromQueue: {
          date: oldQueueDate?.toISOString().split('T')[0] || null,
          position: oldPosition,
        },
        toReservation: {
          hallName: hall?.name || null,
          eventTypeName: eventType?.name || null,
          status: newStatus,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          guests: data.adults + (data.children || 0) + (data.toddlers || 0),
          totalPrice,
        },
      },
    });

    return updated;
  }

  async getQueueStats(): Promise<QueueStats> {
    const reservations = await prisma.reservation.findMany({
      where: { status: ReservationStatus.RESERVED, reservationQueueDate: { not: null } },
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

  /**
   * Auto-cancel expired RESERVED reservations
   * FIX: Replaced raw SQL auto_cancel_expired_reserved() with Prisma ORM
   * Bug #7: Only cancels reservations with queue date BEFORE today
   *   (today's entries are NOT cancelled)
   */
  async autoCancelExpired(userId?: string): Promise<AutoCancelResult> {
    // Bug #7: today's entries should NOT be cancelled
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find RESERVED reservations with queue date strictly BEFORE today
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.RESERVED,
        reservationQueueDate: {
          lt: today,
        },
      },
      select: { id: true },
    });

    if (expiredReservations.length === 0) {
      return { cancelledCount: 0, cancelledIds: [] };
    }

    const expiredIds = expiredReservations.map(r => r.id);

    // Batch cancel all expired reservations
    await prisma.reservation.updateMany({
      where: { id: { in: expiredIds } },
      data: {
        status: ReservationStatus.CANCELLED,
        reservationQueuePosition: null,
        reservationQueueDate: null,
      },
    });

    // Audit log — QUEUE_AUTO_CANCEL (only if something was cancelled)
    if (expiredIds.length > 0) {
      await logChange({
        userId: userId || null,
        action: 'QUEUE_AUTO_CANCEL',
        entityType: 'RESERVATION',
        entityId: 'system',
        details: {
          description: `Auto-anulowano ${expiredIds.length} przeterminowanych rezerwacji z kolejki`,
          cancelledCount: expiredIds.length,
          cancelledIds: expiredIds,
          triggeredBy: userId ? 'manual' : 'system',
        },
      });
    }

    return {
      cancelledCount: expiredIds.length,
      cancelledIds: expiredIds,
    };
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
