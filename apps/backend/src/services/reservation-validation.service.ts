/**
 * Reservation Validation Service
 * Extracted from reservation.service.ts — capacity and conflict validation logic
 * #165: Capacity-based overlap logic (multiple reservations per hall)
 * allowWithWholeVenue — Strzecha Tyl/Przod/Gora coexist with whole venue
 */
import { prisma } from '@/lib/prisma';
import { RESERVATION } from '../i18n/pl';
import { ReservationStatus } from '../types/reservation.types';

/**
 * #165: Validate capacity for a time range — central capacity-based overlap logic.
 *
 * Decision tree:
 * 1. hall.allowMultipleBookings === false → any overlap = block (MULTIPLE_BOOKINGS_DISABLED)
 * 2. hall.allowMultipleBookings === true → aggregate occupied + newGuests vs capacity
 * If exceeded → CAPACITY_EXCEEDED with available/total info
 */
export async function validateCapacityForTimeRange(
  hall: { id: string; capacity: number; allowMultipleBookings: boolean },
  startDateTime: Date,
  endDateTime: Date,
  newGuests: number,
  excludeReservationId?: string
): Promise<void> {
  const where: any = {
    hallId: hall.id,
    status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
    archivedAt: null,
    AND: [{ startDateTime: { lt: endDateTime } }, { endDateTime: { gt: startDateTime } }],
  };
  if (excludeReservationId) where.id = { not: excludeReservationId };

  const overlapping = await prisma.reservation.findMany({
    where,
    select: { id: true, guests: true },
  });

  if (overlapping.length === 0) return; // no conflicts at all

  // Case 1: Hall does NOT allow multiple bookings → any overlap is a block
  if (!hall.allowMultipleBookings) {
    throw new Error(RESERVATION.MULTIPLE_BOOKINGS_DISABLED);
  }

  // Case 2: Hall allows multiple bookings → check aggregate capacity
  const occupiedCapacity = overlapping.reduce((sum, r) => sum + (r.guests || 0), 0);
  const availableCapacity = Math.max(0, hall.capacity - occupiedCapacity);

  if (newGuests > availableCapacity) {
    throw new Error(RESERVATION.CAPACITY_EXCEEDED(newGuests, availableCapacity, hall.capacity));
  }
}

/**
 * Check whole-venue conflict with allowWithWholeVenue support.
 */
export async function checkWholeVenueConflict(
  hallId: string,
  startDateTime: Date,
  endDateTime: Date,
  excludeReservationId?: string
): Promise<void> {
  const hall = await prisma.hall.findUnique({ where: { id: hallId } });
  if (!hall) return;

  const activeStatuses = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED];
  const baseWhere: any = {
    status: { in: activeStatuses },
    archivedAt: null,
    AND: [{ startDateTime: { lt: endDateTime } }, { endDateTime: { gt: startDateTime } }],
  };
  if (excludeReservationId) {
    baseWhere.id = { not: excludeReservationId };
  }

  if (hall.isWholeVenue) {
    const conflict = await prisma.reservation.findFirst({
      where: {
        ...baseWhere,
        hallId: { not: hallId },
        hall: { allowWithWholeVenue: false },
      },
      include: {
        hall: { select: { name: true } },
        client: { select: { firstName: true, lastName: true } },
      },
    });

    if (conflict) {
      const clientName = conflict.client ? `${conflict.client.firstName} ${conflict.client.lastName}` : 'nieznany klient';
      const hallName = (conflict as any).hall?.name || 'inna sala';
      throw new Error(`Nie można zarezerwować całego obiektu — sala "${hallName}" ma już rezerwację w tym terminie (${clientName}).`);
    }
  } else {
    if (hall.allowWithWholeVenue) return;

    const wholeVenueHall = await prisma.hall.findFirst({ where: { isWholeVenue: true } });
    if (!wholeVenueHall) return;

    const conflict = await prisma.reservation.findFirst({
      where: {
        ...baseWhere,
        hallId: wholeVenueHall.id,
      },
      include: { client: { select: { firstName: true, lastName: true } } },
    });

    if (conflict) {
      const clientName = conflict.client ? `${conflict.client.firstName} ${conflict.client.lastName}` : 'nieznany klient';
      throw new Error(`Nie można zarezerwować tej sali — cały obiekt jest już zarezerwowany w tym terminie (${clientName}).`);
    }
  }
}
