/**
 * Reservation Create Helper
 * Extracted from reservation.service.ts — createReservation body logic
 * Each function accepts explicit parameters (no closure over class state).
 */
import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import {
  CreateReservationDTO,
  ReservationStatus,
} from '../types/reservation.types';
import {
  calculateTotalGuests,
  calculateTotalPrice,
  validateConfirmationDeadline,
  validateCustomEventFields,
} from '../utils/reservation.utils';
import { SelectedOptionDTO } from '../dto/menu-selection.dto';
import { Prisma } from '@/prisma-client';
import { calculateVenueSurcharge } from '../utils/venue-surcharge';
import { recalculateReservationTotalPrice } from '../utils/recalculate-price';
import { reservationCategoryExtraService } from './reservationCategoryExtra.service';
import { RESERVATION, MENU, HALL, CLIENT, EVENT_TYPE } from '../i18n/pl';
import notificationService from './notification.service';
import { validateCapacityForTimeRange, checkWholeVenueConflict } from './reservation-validation.service';
import { createHistoryEntry } from './reservation-history.helper';
import { RESERVATION_INCLUDE } from './reservation.includes';

function sanitizeString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).replace(/\x00/g, '').trim() || null;
}

// ─── Types for intermediate results ───────────────────────────────────────────

interface ValidatedEntities {
  hall: { id: string; capacity: number; allowMultipleBookings: boolean; isActive: boolean; isWholeVenue: boolean; name: string };
  client: { id: string; firstName: string; lastName: string };
  eventType: { id: string; name: string };
  adults: number;
  children: number;
  toddlers: number;
  guests: number;
}

interface ResolvedPricing {
  menuPackage: any | null;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  packagePrice: number;
  totalPrice: number;
  selectedOptions: SelectedOptionDTO[];
  optionsPrice: number;
  extrasTotal: number;
  surcharge: { amount: number | null; label: string | null };
  surchargeAmount: number;
  discountTypeVal: string | null;
  discountValueNum: number | null;
  discountAmountVal: number | null;
  discountReasonVal: string | null;
  priceBeforeDiscountVal: number | null;
  finalTotalPrice: number;
}

// ─── 1. Input validation & entity lookups ─────────────────────────────────────

export async function validateAndLookupEntities(data: CreateReservationDTO): Promise<ValidatedEntities> {
  if (!data.hallId || !data.clientId || !data.eventTypeId) {
    throw new AppError(RESERVATION.HALL_CLIENT_EVENT_REQUIRED, 400);
  }

  const hasNewFormat = data.startDateTime && data.endDateTime;
  const hasLegacyFormat = data.date && data.startTime && data.endTime;
  if (!hasNewFormat && !hasLegacyFormat) {
    throw new AppError(RESERVATION.DATE_FORMAT_REQUIRED, 400);
  }

  const hall = await prisma.hall.findUnique({ where: { id: data.hallId } });
  if (!hall) throw new AppError(HALL.NOT_FOUND, 404);
  if (!hall.isActive) throw new AppError(HALL.NOT_ACTIVE, 400);

  const client = await prisma.client.findUnique({ where: { id: data.clientId } });
  if (!client) throw new AppError(CLIENT.NOT_FOUND, 404);

  const eventType = await prisma.eventType.findUnique({ where: { id: data.eventTypeId } });
  if (!eventType) throw new AppError(EVENT_TYPE.NOT_FOUND, 404);

  const customValidation = validateCustomEventFields(eventType.name, data);
  if (!customValidation.valid) throw new AppError(customValidation.error!, 400);

  const adults = data.adults ?? 0;
  const children = data.children ?? 0;
  const toddlers = data.toddlers ?? 0;

  if (adults === 0 && children === 0 && toddlers === 0) {
    throw new AppError(RESERVATION.GUESTS_REQUIRED, 400);
  }

  const guests = calculateTotalGuests(adults, children, toddlers);

  // #165: Single-reservation capacity check (guests alone exceed hall capacity)
  if (guests > hall.capacity) {
    throw new AppError(RESERVATION.GUESTS_EXCEED_CAPACITY(guests, hall.capacity), 400);
  }

  return { hall: hall as any, client: client as any, eventType: eventType as any, adults, children, toddlers, guests };
}

// ─── 2. Menu package resolution & pricing logic ──────────────────────────────

export async function resolveMenuAndPricing(
  data: CreateReservationDTO,
  entities: ValidatedEntities
): Promise<ResolvedPricing> {
  const { adults, children, toddlers, guests, hall } = entities;

  let pricePerAdult: number;
  let pricePerChild: number;
  let pricePerToddler: number;
  let menuPackage = null;
  const selectedOptions: SelectedOptionDTO[] = [];
  const optionsPrice = 0;

  if (data.menuPackageId) {
    menuPackage = await prisma.menuPackage.findUnique({
      where: { id: data.menuPackageId },
      include: { menuTemplate: true },
    });
    if (!menuPackage) throw new AppError(MENU.PACKAGE_NOT_FOUND, 404);

    if (menuPackage.minGuests && guests < menuPackage.minGuests) {
      throw new AppError(MENU.MIN_GUESTS(menuPackage.minGuests), 400);
    }
    if (menuPackage.maxGuests && guests > menuPackage.maxGuests) {
      throw new AppError(MENU.MAX_GUESTS(menuPackage.maxGuests), 400);
    }

    pricePerAdult = Number(menuPackage.pricePerAdult);
    pricePerChild = Number(menuPackage.pricePerChild);
    pricePerToddler = Number(menuPackage.pricePerToddler);
  } else {
    if (data.pricePerAdult === undefined || data.pricePerChild === undefined) {
      throw new AppError(RESERVATION.PRICE_REQUIRED, 400);
    }
    pricePerAdult = data.pricePerAdult;
    pricePerChild = data.pricePerChild;
    pricePerToddler = data.pricePerToddler ?? 0;
  }

  const packagePrice = calculateTotalPrice(adults, children, pricePerAdult, pricePerChild, toddlers, pricePerToddler);
  const totalPrice = packagePrice + optionsPrice;

  // Sprint 8: Calculate service extras total (must be before discount so discount covers extras)
  let extrasTotal = 0;
  if (data.serviceExtras && data.serviceExtras.length > 0) {
    extrasTotal = data.serviceExtras.reduce((sum, e) => sum + e.totalPrice, 0);
  }

  const totalWithExtras = totalPrice + extrasTotal;

  // ══ #137: Venue surcharge for "Cały Obiekt" ══
  const surcharge = calculateVenueSurcharge(hall.isWholeVenue, guests);
  const surchargeAmount = surcharge.amount || 0;
  const totalWithSurcharge = totalWithExtras + surchargeAmount;

  // ══ Discount handling (Sprint 7 — applied atomically during creation) ══
  let discountTypeVal: string | null = null;
  let discountValueNum: number | null = null;
  let discountAmountVal: number | null = null;
  let discountReasonVal: string | null = null;
  let priceBeforeDiscountVal: number | null = null;
  let finalTotalPrice = totalWithSurcharge;

  if (data.discountType && data.discountValue && data.discountValue > 0 && data.discountReason && data.discountReason.trim().length >= 3) {
    discountTypeVal = data.discountType;
    discountValueNum = data.discountValue;
    discountReasonVal = data.discountReason.trim();
    priceBeforeDiscountVal = totalWithSurcharge;

    if (data.discountType === 'PERCENTAGE') {
      if (data.discountValue > 100) throw new AppError('Rabat procentowy nie może przekroczyć 100%', 400);
      discountAmountVal = Math.round((totalWithSurcharge * data.discountValue) / 100 * 100) / 100;
    } else {
      discountAmountVal = data.discountValue;
      if (discountAmountVal > totalWithSurcharge) {
        throw new AppError(`Rabat kwotowy (${discountAmountVal} PLN) nie może przekroczyć ceny (${totalWithSurcharge} PLN)`, 400);
      }
    }
    finalTotalPrice = Math.round((totalWithSurcharge - discountAmountVal) * 100) / 100;
  }

  return {
    menuPackage,
    pricePerAdult,
    pricePerChild,
    pricePerToddler,
    packagePrice,
    totalPrice,
    selectedOptions,
    optionsPrice,
    extrasTotal,
    surcharge,
    surchargeAmount,
    discountTypeVal,
    discountValueNum,
    discountAmountVal,
    discountReasonVal,
    priceBeforeDiscountVal,
    finalTotalPrice,
  };
}

// ─── 3. Date/time validation & availability checking ─────────────────────────

export async function validateDateTimeAndAvailability(
  data: CreateReservationDTO,
  hall: ValidatedEntities['hall'],
  guests: number
): Promise<string> {
  let notes = data.notes || '';
  const hasNewFormat = data.startDateTime && data.endDateTime;
  const hasLegacyFormat = data.date && data.startTime && data.endTime;

  if (hasNewFormat && data.startDateTime && data.endDateTime) {
    const startDT = new Date(data.startDateTime);
    const endDT = new Date(data.endDateTime);
    if (startDT < new Date()) throw new AppError(RESERVATION.DATE_IN_FUTURE, 400);
    if (startDT >= endDT) throw new AppError(RESERVATION.END_AFTER_START, 400);

    // #165: Capacity-based overlap check instead of binary block
    await validateCapacityForTimeRange(hall, startDT, endDT, guests);
    await checkWholeVenueConflict(data.hallId, startDT, endDT);

    /* istanbul ignore next */
    if (startDT.getFullYear() > new Date().getFullYear()) {
      notes += ' [Auto] Rezerwacja na kolejny rok — ceny mogą ulec zmianie (inflacja).';
    }
  }

  if (hasLegacyFormat && data.date && data.startTime && data.endTime) {
    const reservationDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) throw new AppError(RESERVATION.DATE_IN_FUTURE, 400);
    if (data.startTime >= data.endTime) throw new AppError(RESERVATION.END_AFTER_START, 400);

    // #165: Capacity-based overlap check for legacy format
    const startDT = new Date(`${data.date}T${data.startTime}:00`);
    const endDT = new Date(`${data.date}T${data.endTime}:00`);
    await validateCapacityForTimeRange(hall, startDT, endDT, guests);
    await checkWholeVenueConflict(data.hallId, startDT, endDT);

    /* istanbul ignore next */
    if (reservationDate.getFullYear() > new Date().getFullYear()) {
      notes += ' [Auto] Rezerwacja na kolejny rok — ceny mogą ulec zmianie (inflacja).';
    }
  }

  if (data.confirmationDeadline && data.startDateTime) {
    const deadline = new Date(data.confirmationDeadline);
    const eventStart = new Date(data.startDateTime);
    if (!validateConfirmationDeadline(deadline, eventStart)) {
      throw new AppError(RESERVATION.CONFIRMATION_DEADLINE, 400);
    }
  }

  return notes;
}

// ─── 4. Post-creation extras handling ─────────────────────────────────────────

export async function handlePostCreationExtras(
  reservationId: string,
  data: CreateReservationDTO,
  entities: ValidatedEntities,
  pricing: ResolvedPricing,
  userId: string
): Promise<void> {
  const { adults, children, toddlers } = entities;
  const { menuPackage, selectedOptions, packagePrice, optionsPrice, totalPrice, extrasTotal, surchargeAmount, discountTypeVal, discountAmountVal } = pricing;

  // Create menu snapshot
  if (menuPackage) {
    await prisma.reservationMenuSnapshot.create({
      data: {
        reservationId,
        menuTemplateId: menuPackage.menuTemplateId,
        packageId: menuPackage.id,
        menuData: {
          packageName: menuPackage.name,
          packageDescription: menuPackage.description,
          templateName: menuPackage.menuTemplate.name,
          pricePerAdult: Number(menuPackage.pricePerAdult),
          pricePerChild: Number(menuPackage.pricePerChild),
          pricePerToddler: Number(menuPackage.pricePerToddler),
          selectedOptions,
        } as unknown as Prisma.InputJsonValue,
        packagePrice,
        optionsPrice,
        totalMenuPrice: totalPrice,
        adultsCount: adults,
        childrenCount: children,
        toddlersCount: toddlers,
      },
    });
  }

  // Sprint 8: Create service extras records
  if (data.serviceExtras && data.serviceExtras.length > 0) {
    const serviceItemIds = data.serviceExtras.map((e) => e.serviceItemId);
    const serviceItems = await prisma.serviceItem.findMany({
      where: { id: { in: serviceItemIds } },
    });
    const itemMap = new Map(serviceItems.map((i: any) => [i.id, i]));

    for (const extra of data.serviceExtras) {
      const item: any = itemMap.get(extra.serviceItemId);
      if (!item) continue;

      await prisma.reservationExtra.create({
        data: {
          reservationId,
          serviceItemId: extra.serviceItemId,
          quantity: extra.quantity,
          unitPrice: extra.unitPrice,
          priceType: item.priceType,
          totalPrice: extra.totalPrice,
          status: 'PENDING',
        },
      });
    }

    // Update extrasTotalPrice on reservation
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { extrasTotalPrice: extrasTotal },
    });
  }

  // #216: Create category extras (additional paid items beyond package limits)
  if (data.categoryExtras && data.categoryExtras.length > 0) {
    await reservationCategoryExtraService.upsertExtras(
      reservationId,
      data.categoryExtras,
      userId,
      { adults, children, toddlers }
    );
  }

  // Create deposit
  const depositData =
    data.deposit || (data.depositAmount && data.depositDueDate ? { amount: data.depositAmount, dueDate: data.depositDueDate } : null);
  if (depositData) {
    const depositAmount = Number(depositData.amount);
    await prisma.deposit.create({
      data: {
        reservationId,
        amount: depositAmount,
        remainingAmount: depositAmount,
        dueDate: new Date(depositData.dueDate).toISOString().split('T')[0],
        paid: depositData.paid || false,
        status: depositData.paid ? 'PAID' : 'PENDING',
        paymentMethod: sanitizeString(depositData.paymentMethod),
        paidAt: depositData.paidAt ? new Date(depositData.paidAt) : null,
      },
    });
  }

  // History entry
  await createHistoryEntry(
    reservationId,
    userId,
    'CREATED',
    null,
    null,
    null,
    menuPackage
      ? `Utworzono rezerwację z pakietem menu: ${menuPackage.name}${discountTypeVal ? ` | Rabat: -${discountAmountVal} PLN` : ''}${
          extrasTotal > 0 ? ` | Dodatki: +${extrasTotal} PLN` : ''
        }${surchargeAmount > 0 ? ` | Dopłata obiekt: +${surchargeAmount} PLN` : ''}`
      : `Utworzono rezerwację${discountTypeVal ? ` | Rabat: -${discountAmountVal} PLN` : ''}${
          extrasTotal > 0 ? ` | Dodatki: +${extrasTotal} PLN` : ''
        }${surchargeAmount > 0 ? ` | Dopłata obiekt: +${surchargeAmount} PLN` : ''}`
  );

  // Recalculate totalPrice with all components (including extra hours for long events)
  await recalculateReservationTotalPrice(reservationId);
}

// ─── 5. Send creation notification ───────────────────────────────────────────

export function sendCreationNotification(
  reservationId: string,
  data: CreateReservationDTO,
  client: { firstName: string; lastName: string },
  hall: { name: string },
  eventType: { name: string },
  userId: string
): void {
  const clientDisplayName = client.firstName + ' ' + client.lastName;
  const dateStr = data.startDateTime
    ? new Date(data.startDateTime).toLocaleDateString('pl-PL')
    : data.date || '';
  notificationService.createForAll({
    type: 'RESERVATION_CREATED',
    title: 'Nowa rezerwacja',
    message: `${clientDisplayName} — ${hall.name}, ${eventType.name} (${dateStr})`,
    entityType: 'RESERVATION',
    entityId: reservationId,
    excludeUserId: userId,
  });
}

// ─── Orchestrator: full createReservation logic ──────────────────────────────

export async function executeCreateReservation(
  data: CreateReservationDTO,
  userId: string,
  validateUserId: (uid: string) => Promise<void>
): Promise<any> {
  await validateUserId(userId);

  // 1. Validate inputs & lookup entities
  const entities = await validateAndLookupEntities(data);

  // 2. Resolve menu package & pricing
  const pricing = await resolveMenuAndPricing(data, entities);

  // 3. Validate date/time & check availability
  const notes = await validateDateTimeAndAvailability(data, entities.hall, entities.guests);

  // 4. Create the reservation record
  const reservation = await prisma.reservation.create({
    data: {
      hallId: data.hallId,
      clientId: data.clientId,
      eventTypeId: data.eventTypeId,
      createdById: userId,
      startDateTime: data.startDateTime ? new Date(data.startDateTime) : null,
      endDateTime: data.endDateTime ? new Date(data.endDateTime) : null,
      adults: entities.adults,
      children: entities.children,
      toddlers: entities.toddlers,
      pricePerAdult: pricing.pricePerAdult,
      pricePerChild: pricing.pricePerChild,
      pricePerToddler: pricing.pricePerToddler,
      confirmationDeadline: data.confirmationDeadline ? new Date(data.confirmationDeadline) : null,
      customEventType: sanitizeString(data.customEventType),
      birthdayAge: data.birthdayAge || null,
      anniversaryYear: data.anniversaryYear || null,
      anniversaryOccasion: sanitizeString(data.anniversaryOccasion),
      date: data.date || null,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      guests: entities.guests,
      totalPrice: pricing.finalTotalPrice,
      discountType: pricing.discountTypeVal,
      discountValue: pricing.discountValueNum,
      discountAmount: pricing.discountAmountVal,
      discountReason: pricing.discountReasonVal,
      priceBeforeDiscount: pricing.priceBeforeDiscountVal,
      venueSurcharge: pricing.surcharge.amount,
      venueSurchargeLabel: pricing.surcharge.label,
      status: ReservationStatus.PENDING,
      notes: sanitizeString(notes),
      attachments: [],
    },
    include: RESERVATION_INCLUDE,
  });

  // 5. Post-creation: menu snapshot, extras, deposit, history, recalculation
  await handlePostCreationExtras(reservation.id, data, entities, pricing, userId);

  // 6. Notification
  sendCreationNotification(reservation.id, data, entities.client, entities.hall, entities.eventType, userId);

  return reservation;
}
