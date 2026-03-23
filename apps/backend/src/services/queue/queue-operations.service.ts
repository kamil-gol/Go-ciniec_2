/**
 * Queue Operations Service
 * Batch operations, stats, rebuild, and auto-cancel logic
 */

import { ReservationStatus } from '@/prisma-client';
import { prisma } from '@/lib/prisma';
import { logChange } from '../../utils/audit-logger';
import { QueueStats, AutoCancelResult } from '../../types/queue.types';

/**
 * Batch update queue positions (atomic reorder).
 */
export async function batchUpdatePositions(
  updates: Array<{ id: string; position: number }>,
  userId: string
): Promise<{ updatedCount: number }> {
  if (!updates || updates.length === 0) throw new Error('Wymagana jest co najmniej jedna aktualizacja');
  for (const update of updates) {
    if (!update.id) throw new Error('Każda aktualizacja musi zawierać identyfikator rezerwacji');
    if (!Number.isInteger(update.position) || update.position < 1) {
      throw new Error(`Nieprawidłowa pozycja ${update.position} dla rezerwacji ${update.id}`);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const reservationIds = updates.map(u => u.id);
    const reservations = await tx.reservation.findMany({
      where: { id: { in: reservationIds } },
      select: { id: true, status: true, reservationQueueDate: true, reservationQueuePosition: true }
    });
    if (reservations.length !== updates.length) throw new Error('Nie znaleziono jednej lub więcej rezerwacji');

    for (const res of reservations) {
      if (res.status !== ReservationStatus.RESERVED) throw new Error(`Rezerwacja ${res.id} nie ma statusu RESERVED`);
      if (!res.reservationQueueDate) throw new Error(`Rezerwacja ${res.id} nie ma przypisanej daty kolejki`);
    }

    const firstDate = reservations[0].reservationQueueDate?.toDateString();
    for (const res of reservations) {
      if (res.reservationQueueDate?.toDateString() !== firstDate) throw new Error('Wszystkie rezerwacje muszą być z tego samego dnia');
    }

    const positions = updates.map(u => u.position);
    if (positions.length !== new Set(positions).size) throw new Error('Wykryto zduplikowane pozycje w aktualizacjach');

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

/**
 * Rebuild all queue positions by date, ordered by createdAt.
 */
export async function rebuildPositions(userId: string): Promise<{ updatedCount: number; dateCount: number }> {
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

/**
 * Get queue statistics.
 */
export async function getQueueStats(): Promise<QueueStats> {
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
 * Auto-cancel expired RESERVED reservations.
 * FIX: Replaced raw SQL auto_cancel_expired_reserved() with Prisma ORM
 * Bug #7: Only cancels reservations with queue date BEFORE today
 *   (today's entries are NOT cancelled)
 */
export async function autoCancelExpired(userId?: string): Promise<AutoCancelResult> {
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
