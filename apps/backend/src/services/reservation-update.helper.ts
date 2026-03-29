/**
 * Reservation Update Helper
 * Extracted from reservation.service.ts — updateReservation body logic
 * Each function accepts explicit parameters (no closure over class state).
 */
import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import {
  UpdateReservationDTO,
  ReservationStatus,
} from '../types/reservation.types';
import {
  calculateTotalGuests,
  calculateTotalPrice,
  validateConfirmationDeadline,
  validateCustomEventFields,
  detectReservationChanges,
  formatChangesSummary,
} from '../utils/reservation.utils';
import { Prisma } from '@/prisma-client';
import { calculateVenueSurcharge } from '../utils/venue-surcharge';
import { recalculateReservationTotalPrice } from '../utils/recalculate-price';
import { reservationCategoryExtraService } from './reservationCategoryExtra.service';
import reservationMenuService from './reservation-menu.service';
import logger from '../utils/logger';
import { RESERVATION, HALL, VENUE_SURCHARGE } from '../i18n/pl';
import notificationService from './notification.service';
import { validateCapacityForTimeRange, checkWholeVenueConflict } from './reservation-validation.service';
import { createHistoryEntry } from './reservation-history.helper';
import { RESERVATION_INCLUDE } from './reservation.includes';

function sanitizeString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).replace(/\x00/g, '').trim() || null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExistingReservation {
  id: string;
  hallId: string;
  eventTypeId: string;
  adults: number;
  children: number;
  toddlers: number;
  guests: number;
  totalPrice: any;
  pricePerAdult: any;
  pricePerChild: any;
  pricePerToddler: any;
  venueSurcharge: any;
  startDateTime: Date | null;
  endDateTime: Date | null;
  internalNotes: string | null;
  status: string;
  hall: any;
  eventType: any;
  menuSnapshot: any;
  client: any;
  [key: string]: any;
}

// ─── 1. Hall & timing update processing ──────────────────────────────────────

export interface HallTimingResult {
  updateData: Prisma.ReservationUncheckedUpdateInput;
  effectiveHall: any;
  hallChanged: boolean;
  guestsChanged: boolean;
  newAdults: number;
  newChildren: number;
  newToddlers: number;
  finalGuests: number;
  finalStart: Date | null;
  finalEnd: Date | null;
}

export async function processHallAndTimingUpdates(
  data: UpdateReservationDTO,
  existing: ExistingReservation,
  userId: string,
  updateReservationMenu: (id: string, menuData: any, uid: string) => Promise<any>
): Promise<HallTimingResult> {
  const updateData: Prisma.ReservationUncheckedUpdateInput = {};

  // #176: eventTypeId is immutable after creation — silently ignore if sent
  if (data.eventTypeId !== undefined && data.eventTypeId !== existing.eventTypeId) {
    logger.debug(`[Reservation] Ignored eventTypeId change attempt on ${existing.id}: ${existing.eventTypeId} → ${data.eventTypeId}`);
  }

  if (data.menuPackageId !== undefined) {
    // #216: When menu package changes, delete old category extras (they belong to old package's categories)
    await reservationCategoryExtraService.deleteByReservation(existing.id, userId);

    if (data.menuPackageId === null) {
      await updateReservationMenu(existing.id, { menuPackageId: null }, userId);
    } else {
      await updateReservationMenu(
        existing.id,
        {
          menuPackageId: data.menuPackageId,
          adultsCount: data.adults ?? existing.adults,
          childrenCount: data.children ?? existing.children,
          toddlersCount: data.toddlers ?? existing.toddlers,
        },
        userId
      );
    }
  }

  const detectedChanges = detectReservationChanges(existing, data);
  if (detectedChanges.length > 0) {
    if (!data.reason || data.reason.length < 10) {
      throw new AppError(RESERVATION.REASON_REQUIRED, 400);
    }
  }

  if (existing.eventType) {
    const customValidation = validateCustomEventFields(existing.eventType.name, data);
    if (!customValidation.valid) throw new AppError(customValidation.error!, 400);
  }

  // ══ #137: Hall change — validate new hall + recalculate surcharge ══
  let effectiveHall = existing.hall;
  const hallChanged = data.hallId !== undefined && data.hallId !== existing.hallId;
  if (hallChanged) {
    const newHall = await prisma.hall.findUnique({ where: { id: data.hallId! } });
    if (!newHall) throw new AppError(HALL.NOT_FOUND, 404);
    if (!newHall.isActive) throw new AppError(HALL.NOT_ACTIVE, 400);
    effectiveHall = newHall;
    updateData.hallId = data.hallId;
  }

  if (data.startDateTime) {
    const newStart = new Date(data.startDateTime);
    if (newStart < new Date()) throw new AppError(RESERVATION.DATE_IN_FUTURE, 400);
    updateData.startDateTime = newStart;
  }
  if (data.endDateTime) updateData.endDateTime = new Date(data.endDateTime);

  const effectiveHallId = (data.hallId ?? existing.hallId)!;
  const finalStart = data.startDateTime ? new Date(data.startDateTime) : existing.startDateTime;
  const finalEnd = data.endDateTime ? new Date(data.endDateTime) : existing.endDateTime;

  if (finalStart && finalEnd && finalStart >= finalEnd) throw new AppError(RESERVATION.END_AFTER_START, 400);

  if (data.adults !== undefined) updateData.adults = data.adults;
  if (data.children !== undefined) updateData.children = data.children;
  if (data.toddlers !== undefined) updateData.toddlers = data.toddlers;

  const guestsChanged = data.adults !== undefined || data.children !== undefined || data.toddlers !== undefined;
  const newAdults = data.adults ?? existing.adults;
  const newChildren = data.children ?? existing.children;
  const newToddlers = data.toddlers ?? existing.toddlers;

  if (guestsChanged) {
    updateData.guests = calculateTotalGuests(newAdults, newChildren, newToddlers);
  }
  const finalGuests = guestsChanged
    ? calculateTotalGuests(newAdults, newChildren, newToddlers)
    : existing.guests;

  // #165: Capacity-based overlap + capacity check on hall/time/guests change
  if ((hallChanged || data.startDateTime || data.endDateTime || guestsChanged) && finalStart && finalEnd && effectiveHall) {
    await validateCapacityForTimeRange(effectiveHall, finalStart, finalEnd, finalGuests, existing.id);
    await checkWholeVenueConflict(effectiveHallId, finalStart, finalEnd, existing.id);
  }

  // Single-reservation capacity guard (guests alone exceed hall.capacity)
  if (effectiveHall && finalGuests > effectiveHall.capacity) {
    throw new AppError(RESERVATION.GUESTS_EXCEED_CAPACITY(finalGuests, effectiveHall.capacity), 400);
  }

  return { updateData, effectiveHall, hallChanged, guestsChanged, newAdults, newChildren, newToddlers, finalGuests, finalStart, finalEnd };
}

// ─── 2. Price recalculation ──────────────────────────────────────────────────

export async function recalculatePrices(
  existing: ExistingReservation,
  data: UpdateReservationDTO,
  result: HallTimingResult,
  userId: string
): Promise<void> {
  const { updateData, effectiveHall, hallChanged, guestsChanged, newAdults, newChildren, newToddlers, finalGuests } = result;

  const hasMenuSnapshot = !!existing.menuSnapshot;
  const isUsingMenuPackage = hasMenuSnapshot && data.menuPackageId !== null;

  // fix/pricing-recalculation: When using menu package with guest changes,
  // still recalculate snapshot but DON'T set totalPrice here — defer to recalculateReservationTotal
  if (isUsingMenuPackage && guestsChanged) {
    const recalcResult = await reservationMenuService.recalculateForGuestChange(existing.id, newAdults, newChildren, newToddlers);
    /* istanbul ignore next */
    if (recalcResult) {
      logger.debug(`[Reservation] Auto-recalculated menu snapshot for ${existing.id}: menuPrice=${recalcResult.totalMenuPrice}`);
    }
  }

  // #216: Recalculate category extras when guest counts change (per-person pricing)
  if (guestsChanged) {
    await reservationCategoryExtraService.recalculateForGuestChange(existing.id, newAdults, newChildren, newToddlers, userId);
  } else if (!isUsingMenuPackage) {
    // Update per-person prices if provided
    if (data.pricePerAdult !== undefined) updateData.pricePerAdult = data.pricePerAdult;
    if (data.pricePerChild !== undefined) updateData.pricePerChild = data.pricePerChild;
    if (data.pricePerToddler !== undefined) updateData.pricePerToddler = data.pricePerToddler;

    const ppa = data.pricePerAdult ?? existing.pricePerAdult;
    const ppc = data.pricePerChild ?? existing.pricePerChild;
    const ppt = data.pricePerToddler ?? existing.pricePerToddler;

    // Recalculate totalPrice for legacy/no-menu reservations when guests or prices change
    if (guestsChanged || data.pricePerAdult !== undefined || data.pricePerChild !== undefined || data.pricePerToddler !== undefined) {
      updateData.totalPrice = calculateTotalPrice(newAdults, newChildren, Number(ppa), Number(ppc), newToddlers, Number(ppt));
    }
  }

  // ══ #137: Recalculate venue surcharge — handles hall change + guest change ══
  const oldIsWholeVenue = existing.hall ? existing.hall.isWholeVenue : false;
  const newIsWholeVenue = effectiveHall ? effectiveHall.isWholeVenue : false;
  const oldSurcharge = Number(existing.venueSurcharge) || 0;

  if (hallChanged || guestsChanged || oldIsWholeVenue || newIsWholeVenue) {
    const surcharge = calculateVenueSurcharge(newIsWholeVenue, finalGuests);
    const newSurcharge = surcharge.amount || 0;
    updateData.venueSurcharge = surcharge.amount;
    updateData.venueSurchargeLabel = surcharge.label;

    if (oldSurcharge !== newSurcharge) {
      const baseTotal = Number(updateData.totalPrice ?? existing.totalPrice);
      updateData.totalPrice = Math.round((baseTotal - oldSurcharge + newSurcharge) * 100) / 100;

      if (!oldIsWholeVenue && newIsWholeVenue) {
        logger.debug(`[Reservation] Venue surcharge APPLIED for ${existing.id}: +${newSurcharge} PLN (hall changed to whole venue)`);
        await createHistoryEntry(
          existing.id,
          userId,
          'SURCHARGE_APPLIED',
          'venueSurcharge',
          '0',
          String(newSurcharge),
          VENUE_SURCHARGE.AUDIT_APPLIED(newSurcharge, finalGuests)
        );
      } else if (oldIsWholeVenue && !newIsWholeVenue) {
        logger.debug(`[Reservation] Venue surcharge REMOVED for ${existing.id}: -${oldSurcharge} PLN (hall changed to normal)`);
        await createHistoryEntry(existing.id, userId, 'SURCHARGE_REMOVED', 'venueSurcharge', String(oldSurcharge), '0', VENUE_SURCHARGE.AUDIT_REMOVED);
      } else {
        logger.debug(`[Reservation] Venue surcharge RECALCULATED for ${existing.id}: ${oldSurcharge} → ${newSurcharge} PLN`);
        await createHistoryEntry(
          existing.id,
          userId,
          'SURCHARGE_RECALC',
          'venueSurcharge',
          String(oldSurcharge),
          String(newSurcharge),
          VENUE_SURCHARGE.AUDIT_RECALCULATED(oldSurcharge, newSurcharge, finalGuests)
        );
      }
    }
  }

  if (data.confirmationDeadline) {
    const deadline = new Date(data.confirmationDeadline);
    const eventStart = result.finalStart || (data.startDateTime ? new Date(data.startDateTime) : null);
    if (eventStart && !validateConfirmationDeadline(deadline, eventStart)) {
      throw new AppError(RESERVATION.CONFIRMATION_DEADLINE, 400);
    }
    updateData.confirmationDeadline = deadline;
  }

  if (data.customEventType !== undefined) updateData.customEventType = sanitizeString(data.customEventType);
  if (data.birthdayAge !== undefined) updateData.birthdayAge = data.birthdayAge || null;
  if (data.anniversaryYear !== undefined) updateData.anniversaryYear = data.anniversaryYear || null;
  if (data.anniversaryOccasion !== undefined) updateData.anniversaryOccasion = sanitizeString(data.anniversaryOccasion);
  if (data.date !== undefined) updateData.date = data.date || null;
  if (data.startTime !== undefined) updateData.startTime = data.startTime || null;
  if (data.endTime !== undefined) updateData.endTime = data.endTime || null;
  if (data.notes !== undefined) updateData.notes = sanitizeString(data.notes);
  if (data.internalNotes !== undefined) updateData.internalNotes = sanitizeString(data.internalNotes);
}

// ─── 3. Category extras upsert & final recalculation ─────────────────────────

export async function upsertCategoryExtrasAndRecalculate(
  reservationId: string,
  data: UpdateReservationDTO,
  existing: ExistingReservation,
  hallTimingResult: HallTimingResult,
  userId: string
): Promise<any> {
  const { updateData } = hallTimingResult;
  const detectedChanges = detectReservationChanges(existing, data);

  const reservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: updateData,
    include: RESERVATION_INCLUDE,
  });

  if (detectedChanges.length > 0) {
    const changesSummary = formatChangesSummary(detectedChanges);
    await createHistoryEntry(reservationId, userId, 'UPDATED', 'multiple', 'różne', 'różne', `${data.reason}

Zmiany:
${changesSummary}`);
  }

  // #216: Update category extras if provided
  if (data.categoryExtras !== undefined) {
    if (data.categoryExtras.length > 0) {
      const updatedRes = await prisma.reservation.findUnique({ where: { id: reservationId }, select: { adults: true, children: true, toddlers: true } });
      await reservationCategoryExtraService.upsertExtras(reservationId, data.categoryExtras, userId, {
        adults: updatedRes?.adults ?? 0,
        children: updatedRes?.children ?? 0,
        toddlers: updatedRes?.toddlers ?? 0,
      });
    } else {
      await reservationCategoryExtraService.deleteByReservation(reservationId, userId);
    }
  }

  // Ensure totalPrice reflects all components (menu + extras + categoryExtras + surcharge + extraHours - discount)
  await recalculateReservationTotalPrice(reservationId);

  // #128: Notification — reservation updated
  const updatedClient = reservation.client as { firstName: string; lastName: string } | null;
  if (updatedClient) {
    const updClientName = updatedClient.firstName + ' ' + updatedClient.lastName;
    notificationService.createForAll({
      type: 'RESERVATION_UPDATED',
      title: 'Rezerwacja zaktualizowana',
      message: `${updClientName} — zmieniono dane rezerwacji`,
      entityType: 'RESERVATION',
      entityId: reservationId,
      excludeUserId: userId,
    });
  }

  return reservation;
}

// ─── Orchestrator: full updateReservation logic ──────────────────────────────

export async function executeUpdateReservation(
  id: string,
  data: UpdateReservationDTO,
  userId: string,
  validateUserId: (uid: string) => Promise<void>,
  getReservationById: (rid: string) => Promise<any>,
  updateReservationMenu: (rid: string, menuData: any, uid: string) => Promise<any>
): Promise<any> {
  await validateUserId(userId);
  const existing = await prisma.reservation.findUnique({
    where: { id },
    include: { hall: true, eventType: true, menuSnapshot: true, client: true },
  });
  if (!existing) throw new AppError(RESERVATION.NOT_FOUND, 404);

  // ══ Etap 5: Notatka wewnętrzna — edytowalna niezależnie od statusu rezerwacji ══
  const isOnlyInternalNotes = data.internalNotes !== undefined && Object.keys(data).every((k) => k === 'internalNotes');
  if (isOnlyInternalNotes) {
    const newValue = sanitizeString(data.internalNotes);
    const oldValue = existing.internalNotes ?? null;
    if (oldValue === newValue) {
      return await getReservationById(id);
    }
    await prisma.reservation.update({
      where: { id },
      data: { internalNotes: newValue },
    });
    await createHistoryEntry(
      id,
      userId,
      'NOTE_UPDATED',
      'internalNotes',
      oldValue || '(brak)',
      newValue || '(brak)',
      'Zaktualizowano notatkę wewnętrzną'
    );
    return await getReservationById(id);
  }

  if (existing.status === ReservationStatus.COMPLETED) throw new AppError(RESERVATION.CANNOT_UPDATE_COMPLETED, 409);
  if (existing.status === ReservationStatus.CANCELLED) throw new AppError(RESERVATION.CANNOT_UPDATE_CANCELLED, 409);
  if (existing.status === ReservationStatus.ARCHIVED) throw new AppError(RESERVATION.CANNOT_UPDATE_ARCHIVED, 409);

  // 1. Hall & timing update processing
  const hallTimingResult = await processHallAndTimingUpdates(data, existing as any, userId, updateReservationMenu);

  // 2. Price recalculation
  await recalculatePrices(existing as any, data, hallTimingResult, userId);

  // 3. Category extras upsert & final recalculation
  const reservation = await upsertCategoryExtrasAndRecalculate(id, data, existing as any, hallTimingResult, userId);

  return reservation;
}
