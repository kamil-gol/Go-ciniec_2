/**
 * Queue Service
 * Business logic for reservation queue management
 * Updated: Phase 2 Audit — logChange() for all queue operations
 * FIX: Replaced raw SQL auto_cancel_expired_reserved() with Prisma ORM (19.02.2026)
 * FIX: BUG8 — position > max and swap-self now throw AppError.badRequest (20.02.2026)
 * Updated: #165 — capacity-based overlap check in promoteReservation()
 * 🇵🇱 Spolonizowany — komunikaty po polsku
 */

import { ReservationStatus, Prisma } from '@/prisma-client';
import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import { logChange } from '../utils/audit-logger';
import {
  CreateReservedDTO,
  PromoteReservationDTO,
  QueueItemResponse,
  QueueStats,
  AutoCancelResult,
} from '../types/queue.types';
import { withRetry, formatQueueItem, dayBounds, clientDisplayName } from './queue/queue.helpers';
import { promoteReservation } from './queue/queue-promotion.service';
import {
  batchUpdatePositions,
  rebuildPositions,
  getQueueStats,
  autoCancelExpired,
} from './queue/queue-operations.service';

export class QueueService {
  async addToQueue(data: CreateReservedDTO, createdById: string): Promise<QueueItemResponse> {
    if (!data.clientId || !data.reservationQueueDate || !data.guests) {
      throw new Error('Klient, data kolejki i liczba gości są wymagane');
    }
    if (data.guests < 1) throw new Error('Liczba gości musi wynosić co najmniej 1');

    const queueDate = new Date(data.reservationQueueDate);
    if (isNaN(queueDate.getTime())) throw new Error('Nieprawidłowy format daty kolejki');
    queueDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (queueDate < today) throw new Error('Data kolejki nie może być w przeszłości');

    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) throw new Error('Nie znaleziono klienta');

    const { startOfDay, endOfDay } = dayBounds(queueDate);

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

      return formatQueueItem(reservation);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new Error(`Pozycja ${nextPosition} jest już zajęta dla tej daty. Spróbuj ponownie.`);
      }
      throw error;
    }
  }

  async updateQueueReservation(reservationId: string, data: Partial<CreateReservedDTO>, userId: string): Promise<QueueItemResponse> {
    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { client: true },
    });
    if (!existing) throw new Error('Nie znaleziono rezerwacji');
    if (existing.status !== ReservationStatus.RESERVED) throw new Error('Można edytować tylko rezerwacje ze statusem RESERVED');

    const oldDate = existing.reservationQueueDate;
    const oldPosition = existing.reservationQueuePosition;
    const updateData: Record<string, unknown> = {};
    let dateChanged = false;
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (data.clientId) {
      const client = await prisma.client.findUnique({ where: { id: data.clientId } });
      if (!client) throw new Error('Nie znaleziono klienta');
      if (data.clientId !== existing.clientId) {
        changes.clientId = { old: existing.clientId, new: data.clientId };
      }
      updateData.clientId = data.clientId;
    }

    if (data.reservationQueueDate) {
      const queueDate = new Date(data.reservationQueueDate);
      if (isNaN(queueDate.getTime())) throw new Error('Nieprawidłowy format daty kolejki');
      queueDate.setHours(0, 0, 0, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (queueDate < today) throw new Error('Data kolejki nie może być w przeszłości');

      const oldDateNormalized = oldDate ? new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate()) : null;
      const newDateNormalized = new Date(queueDate.getFullYear(), queueDate.getMonth(), queueDate.getDate());
      dateChanged = !oldDateNormalized || oldDateNormalized.getTime() !== newDateNormalized.getTime();

      if (dateChanged) {
        changes.queueDate = {
          old: oldDate?.toISOString().split('T')[0] || null,
          new: queueDate.toISOString().split('T')[0],
        };
        const { startOfDay, endOfDay } = dayBounds(queueDate);
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
      if (data.guests < 1) throw new Error('Liczba gości musi wynosić co najmniej 1');
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
      const { startOfDay, endOfDay } = dayBounds(oldDate);
      await prisma.reservation.updateMany({
        where: {
          status: ReservationStatus.RESERVED,
          reservationQueueDate: { gte: startOfDay, lte: endOfDay },
          reservationQueuePosition: { gt: oldPosition }
        },
        data: { reservationQueuePosition: { decrement: 1 } }
      });
    }

    if (Object.keys(changes).length > 0) {
      const cName = clientDisplayName(existing);
      await logChange({
        userId,
        action: 'QUEUE_UPDATE',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Zaktualizowano wpis w kolejce: ${cName} | ${Object.keys(changes).join(', ')}`,
          changes,
        },
      });
    }

    return formatQueueItem(updated);
  }

  async getQueueForDate(date: Date | string): Promise<QueueItemResponse[]> {
    const queueDate = new Date(date);
    if (isNaN(queueDate.getTime())) throw new Error('Nieprawidłowy format daty');
    const { startOfDay, endOfDay } = dayBounds(queueDate);

    const reservations = await prisma.reservation.findMany({
      where: { status: ReservationStatus.RESERVED, reservationQueueDate: { gte: startOfDay, lte: endOfDay } },
      include: { client: true, createdBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ reservationQueuePosition: 'asc' }]
    });
    return reservations.map(r => formatQueueItem(r));
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
    return reservations.map(r => formatQueueItem(r));
  }

  async swapPositions(id1: string, id2: string, userId: string): Promise<void> {
    if (!id1 || !id2) throw AppError.badRequest('Oba identyfikatory rezerwacji są wymagane');
    if (id1 === id2) throw AppError.badRequest('Nie można zamienić rezerwacji z samą sobą');

    const [res1, res2] = await Promise.all([
      prisma.reservation.findUnique({ where: { id: id1 }, include: { client: true } }),
      prisma.reservation.findUnique({ where: { id: id2 }, include: { client: true } })
    ]);
    if (!res1 || !res2) throw new Error('Nie znaleziono jednej lub obu rezerwacji');
    if (res1.status !== ReservationStatus.RESERVED || res2.status !== ReservationStatus.RESERVED) {
      throw new Error('Można zamieniać tylko rezerwacje ze statusem RESERVED');
    }
    if (res1.reservationQueueDate?.toDateString() !== res2.reservationQueueDate?.toDateString()) {
      throw new Error('Można zamieniać tylko rezerwacje z tego samego dnia');
    }

    const pos1 = res1.reservationQueuePosition;
    const pos2 = res2.reservationQueuePosition;

    try {
      await withRetry(async () => {
        await prisma.$executeRawUnsafe('SELECT swap_queue_positions($1::UUID, $2::UUID)', id1, id2);
      });
    } catch (error: any) {
      if (error instanceof Error && error.message?.includes('lock')) {
        throw new Error('Inny użytkownik modyfikuje kolejkę. Odśwież stronę i spróbuj ponownie.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034') throw new Error('Inny użytkownik modyfikuje kolejkę. Odśwież stronę i spróbuj ponownie.');
        if (error.code === 'P2002') throw new Error('Wykryto konflikt pozycji. Odśwież stronę i spróbuj ponownie.');
      }
      throw error;
    }

    const client1Name = clientDisplayName(res1);
    const client2Name = clientDisplayName(res2);
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
    if (!reservationId) throw new Error('Identyfikator rezerwacji jest wymagany');
    if (!newPosition || !Number.isInteger(newPosition) || newPosition < 1) {
      throw new Error('Pozycja musi być dodatnią liczbą całkowitą (>= 1)');
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, status: true, reservationQueueDate: true, reservationQueuePosition: true, clientId: true }
    });
    if (!reservation) throw new Error('Nie znaleziono rezerwacji');
    if (reservation.status !== ReservationStatus.RESERVED) throw new Error('Można przenosić tylko rezerwacje ze statusem RESERVED');
    if (!reservation.reservationQueueDate) throw new Error('Rezerwacja nie ma przypisanej daty kolejki');

    const oldPosition = reservation.reservationQueuePosition;

    const { startOfDay, endOfDay } = dayBounds(reservation.reservationQueueDate);
    const totalCount = await prisma.reservation.count({
      where: { status: ReservationStatus.RESERVED, reservationQueueDate: { gte: startOfDay, lte: endOfDay } }
    });
    if (newPosition > totalCount) {
      throw AppError.badRequest(`Pozycja ${newPosition} jest nieprawidłowa. W kolejce na tę datę jest tylko ${totalCount} rezerwacji.`);
    }
    if (reservation.reservationQueuePosition === newPosition) return;

    try {
      await withRetry(async () => {
        await prisma.$executeRawUnsafe('SELECT move_to_queue_position($1::UUID, $2::INTEGER)', reservationId, newPosition);
      });
    } catch (error: any) {
      if (error instanceof Error && error.message?.includes('lock')) {
        throw new Error('Inny użytkownik modyfikuje kolejkę. Odśwież stronę i spróbuj ponownie.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034') throw new Error('Inny użytkownik modyfikuje kolejkę. Odśwież stronę i spróbuj ponownie.');
        if (error.code === 'P2002') throw new Error(`Pozycja ${newPosition} jest już zajęta. Odśwież stronę i spróbuj ponownie.`);
      }
      throw error;
    }

    const client = await prisma.client.findUnique({ where: { id: reservation.clientId } });
    const cName = client ? `${client.firstName} ${client.lastName}` : 'N/A';
    const queueDate = reservation.reservationQueueDate.toISOString().split('T')[0];
    await logChange({
      userId,
      action: 'QUEUE_MOVE',
      entityType: 'RESERVATION',
      entityId: reservationId,
      details: {
        description: `Przeniesiono w kolejce: ${cName} | #${oldPosition} → #${newPosition} | ${queueDate}`,
        clientName: cName,
        oldPosition,
        newPosition,
        queueDate,
      },
    });
  }

  async batchUpdatePositions(updates: Array<{ id: string; position: number }>, userId: string): Promise<{ updatedCount: number }> {
    return batchUpdatePositions(updates, userId);
  }

  async rebuildPositions(userId: string): Promise<{ updatedCount: number; dateCount: number }> {
    return rebuildPositions(userId);
  }

  async promoteReservation(reservationId: string, data: PromoteReservationDTO, userId: string) {
    return promoteReservation(reservationId, data, userId);
  }

  async getQueueStats(): Promise<QueueStats> {
    return getQueueStats();
  }

  async autoCancelExpired(userId?: string): Promise<AutoCancelResult> {
    return autoCancelExpired(userId);
  }
}

export default new QueueService();
