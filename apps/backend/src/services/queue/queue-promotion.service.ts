/**
 * Queue Promotion Service
 * Logic for promoting queue items (RESERVED) to full reservations (PENDING/CONFIRMED)
 * Updated: #165 — capacity-based overlap check
 */

import { ReservationStatus } from '@/prisma-client';
import { prisma } from '@/lib/prisma';
import { logChange } from '../../utils/audit-logger';
import { RESERVATION, HALL } from '../../i18n/pl';
import notificationService from '../notification.service';
import { PromoteReservationDTO } from '../../types/queue.types';
import { dayBounds, clientDisplayName } from './queue.helpers';

/**
 * Promote a RESERVED queue entry to a full reservation.
 */
export async function promoteReservation(
  reservationId: string,
  data: PromoteReservationDTO,
  userId: string
): Promise<any> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { client: true },
  });
  if (!reservation) throw new Error('Nie znaleziono rezerwacji');
  if (reservation.status !== ReservationStatus.RESERVED) throw new Error('Można awansować tylko rezerwacje ze statusem RESERVED');

  const oldQueueDate = reservation.reservationQueueDate;
  const oldPosition = reservation.reservationQueuePosition;

  if (!data.hallId || !data.eventTypeId || !data.startDateTime || !data.endDateTime) {
    throw new Error('Sala, typ wydarzenia, godzina rozpoczęcia i zakończenia są wymagane');
  }

  const startDateTime = new Date(data.startDateTime);
  const endDateTime = new Date(data.endDateTime);
  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) throw new Error('Nieprawidłowy format daty/godziny');
  if (endDateTime <= startDateTime) throw new Error('Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia');

  // ══ #165: Validate hall exists and is active ══
  const hall = await prisma.hall.findUnique({
    where: { id: data.hallId },
    select: { id: true, name: true, capacity: true, isWholeVenue: true, isActive: true, allowMultipleBookings: true, allowWithWholeVenue: true }
  });
  if (!hall) throw new Error(HALL.NOT_FOUND);
  if (!hall.isActive) throw new Error(HALL.NOT_ACTIVE);

  const eventType = await prisma.eventType.findUnique({ where: { id: data.eventTypeId }, select: { name: true } });

  const guests = data.adults + (data.children || 0) + (data.toddlers || 0);

  // ══ #165: Single-reservation capacity guard ══
  if (guests > hall.capacity) {
    throw new Error(RESERVATION.GUESTS_EXCEED_CAPACITY(guests, hall.capacity));
  }

  // ══ #165: Capacity-based overlap check (replaces old binary findFirst) ══
  const overlapping = await prisma.reservation.findMany({
    where: {
      id: { not: reservationId },
      hallId: data.hallId,
      status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      archivedAt: null,
      AND: [
        { startDateTime: { lt: endDateTime } },
        { endDateTime: { gt: startDateTime } },
      ],
    },
    select: { id: true, guests: true },
  });

  if (overlapping.length > 0) {
    if (!hall.allowMultipleBookings) {
      throw new Error(RESERVATION.MULTIPLE_BOOKINGS_DISABLED);
    }

    const occupiedCapacity = overlapping.reduce((sum, r) => sum + (r.guests || 0), 0);
    const availableCapacity = Math.max(0, hall.capacity - occupiedCapacity);

    if (guests > availableCapacity) {
      throw new Error(RESERVATION.CAPACITY_EXCEEDED(guests, availableCapacity, hall.capacity));
    }
  }

  // ══ #165: Whole venue conflict check ══
  await checkWholeVenueConflict(data.hallId, hall, startDateTime, endDateTime, reservationId);

  const totalPrice = data.adults * data.pricePerAdult + (data.children || 0) * (data.pricePerChild || 0) + (data.toddlers || 0) * (data.pricePerToddler || 0);
  const newStatus = data.status === 'CONFIRMED' ? ReservationStatus.CONFIRMED : ReservationStatus.PENDING;

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: newStatus,
      hallId: data.hallId, eventTypeId: data.eventTypeId, startDateTime, endDateTime,
      adults: data.adults, children: data.children || 0, toddlers: data.toddlers || 0,
      guests,
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
    const { startOfDay, endOfDay } = dayBounds(oldQueueDate);
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
  const cName = clientDisplayName(reservation);
  await logChange({
    userId,
    action: 'QUEUE_PROMOTE',
    entityType: 'RESERVATION',
    entityId: reservationId,
    details: {
      description: `Awansowano z kolejki: ${cName} | ${hall?.name || 'N/A'} | ${eventType?.name || 'N/A'} | ${newStatus}`,
      clientName: cName,
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
        guests,
        totalPrice,
      },
    },
  });

  // #128: Notification — promoted from queue
  notificationService.createForAll({
    type: 'QUEUE_PROMOTED',
    title: 'Awans z kolejki',
    message: `${cName} — awansowano z kolejki do ${hall?.name || 'sali'} (${startDateTime.toLocaleDateString('pl-PL')})`,
    entityType: 'RESERVATION',
    entityId: reservationId,
    excludeUserId: userId,
  });

  return updated;
}

/**
 * #165: Check whole-venue conflict (mirrors reservation.service.ts logic).
 */
export async function checkWholeVenueConflict(
  hallId: string,
  hall: { isWholeVenue: boolean; allowWithWholeVenue?: boolean },
  startDateTime: Date,
  endDateTime: Date,
  excludeReservationId?: string
): Promise<void> {
  const activeStatuses = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED];

  const baseWhere: any = {
    status: { in: activeStatuses },
    archivedAt: null,
    AND: [
      { startDateTime: { lt: endDateTime } },
      { endDateTime: { gt: startDateTime } }
    ]
  };

  if (excludeReservationId) {
    baseWhere.id = { not: excludeReservationId };
  }

  if (hall.isWholeVenue) {
    // Booking whole venue — check if any non-compatible hall has a reservation
    const conflict = await prisma.reservation.findFirst({
      where: {
        ...baseWhere,
        hallId: { not: hallId },
        hall: { allowWithWholeVenue: false },
      },
      include: {
        hall: { select: { name: true } },
        client: { select: { firstName: true, lastName: true } }
      }
    });

    if (conflict) {
      const conflictClientName = conflict.client
        ? `${conflict.client.firstName} ${conflict.client.lastName}`
        : 'nieznany klient';
      const hallName = (conflict as any).hall?.name || 'inna sala';
      throw new Error(
        `Nie można zarezerwować całego obiektu — sala "${hallName}" ma już rezerwację w tym terminie (${conflictClientName}).`
      );
    }
  } else {
    // Booking regular hall — check if whole venue is booked
    if (hall.allowWithWholeVenue) return;

    const wholeVenueHall = await prisma.hall.findFirst({ where: { isWholeVenue: true } });
    if (!wholeVenueHall) return;

    const conflict = await prisma.reservation.findFirst({
      where: {
        ...baseWhere,
        hallId: wholeVenueHall.id,
      },
      include: {
        client: { select: { firstName: true, lastName: true } }
      }
    });

    if (conflict) {
      const conflictClientName = conflict.client
        ? `${conflict.client.firstName} ${conflict.client.lastName}`
        : 'nieznany klient';
      throw new Error(
        `Nie można zarezerwować tej sali — cały obiekt jest już zarezerwowany w tym terminie (${conflictClientName}).`
      );
    }
  }
}
