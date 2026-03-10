/**
 * Reservation Service - with full Audit Logging
 * Business logic for reservation management with advanced features
 * Updated: Phase 1 Audit — logChange() for menu updates + cascade cancel
 * Updated: Sprint 8 — service extras creation during reservation
 * Updated: #137 — Venue surcharge for "Cały Obiekt" bookings
 * Updated: allowWithWholeVenue — Strzecha Tył/Przód/Góra coexist with whole venue
 * Updated: #144 — ARCHIVED status support + auto-archive CRON preparation
 * Updated: Etap 5 — internalNotes field (excluded from PDF)
 * Updated: fix/recalculate-totalPrice — centralized price recalculation
 * Updated: #165 — capacity-based overlap logic (multiple reservations per hall)
 * Updated: #172 — instant auto-archive on cancellation (no 30-day delay)
 * Updated: fix/pricing-and-encoding — recalculate totalPrice at end of create/update
 * Updated: #176 — eventTypeId is immutable after creation (cascading side-effects)
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 *
 * NOTE: MenuOption & MenuPackageOption models removed from Prisma.
 * Options/extras are now handled via the ServiceExtras system.
 */

import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import { logChange, diffObjects } from '../utils/audit-logger';
import { recalculateReservationTotal } from '../utils/recalculate-total';
import {
  CreateReservationDTO,
  UpdateReservationDTO,
  UpdateStatusDTO,
  ReservationFilters,
  ReservationResponse,
  ReservationStatus,
  UpdateReservationMenuDTO,
} from '../types/reservation.types';
import {
  calculateTotalGuests,
  calculateTotalPrice,
  validateConfirmationDeadline,
  validateCustomEventFields,
  detectReservationChanges,
  formatChangesSummary
} from '../utils/reservation.utils';
import { calculateVenueSurcharge } from '../utils/venue-surcharge';
import { recalculateReservationTotalPrice } from '../utils/recalculate-price';
import reservationMenuService from './reservation-menu.service';
import { RESERVATION, MENU, HALL, CLIENT, EVENT_TYPE, VENUE_SURCHARGE } from '../i18n/pl';

function sanitizeString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).replace(/\x00/g, '').trim() || null;
}

const RESERVATION_INCLUDE = {
  hall: { select: { id: true, name: true, capacity: true, isWholeVenue: true, allowMultipleBookings: true } },
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  eventType: { select: { id: true, name: true, standardHours: true, extraHourRate: true } },
  createdBy: { select: { id: true, email: true } },
} as const;

/**
 * Calculate extrasTotalPrice from reservation extras array.
 * Supports FLAT (basePrice × quantity), PER_PERSON (basePrice × quantity × guests), FREE (0).
 */
function calculateExtrasTotalPrice(
  extras: Array<{ quantity: number; customPrice: number | null; serviceItem: { basePrice: number; priceType: string } }>,
  guests: number
): number {
  let total = 0;
  for (const extra of extras) {
    const price = extra.customPrice !== null ? Number(extra.customPrice) : Number(extra.serviceItem.basePrice);
    const qty = extra.quantity || 1;
    if (extra.serviceItem.priceType === 'PER_PERSON') {
      total += price * qty * guests;
    } else if (extra.serviceItem.priceType === 'FREE') {
      // free — no cost
    } else {
      // FLAT
      total += price * qty;
    }
  }
  return Math.round(total * 100) / 100;
}

export class ReservationService {

  async createReservation(data: CreateReservationDTO, userId: string): Promise<ReservationResponse> {
    if (!data.hallId || !data.clientId || !data.eventTypeId) {
      throw new Error(RESERVATION.HALL_CLIENT_EVENT_REQUIRED);
    }

    await this.validateUserId(userId);

    const hasNewFormat = data.startDateTime && data.endDateTime;
    const hasLegacyFormat = data.date && data.startTime && data.endTime;
    
    if (!hasNewFormat && !hasLegacyFormat) {
      throw new Error(RESERVATION.DATE_FORMAT_REQUIRED);
    }

    const hall = await prisma.hall.findUnique({ where: { id: data.hallId } });
    if (!hall) throw new Error(HALL.NOT_FOUND);
    if (!hall.isActive) throw new Error(HALL.NOT_ACTIVE);

    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) throw new Error(CLIENT.NOT_FOUND);

    const eventType = await prisma.eventType.findUnique({ where: { id: data.eventTypeId } });
    if (!eventType) throw new Error(EVENT_TYPE.NOT_FOUND);

    const customValidation = validateCustomEventFields(eventType.name, data);
    if (!customValidation.valid) throw new Error(customValidation.error);

    let adults = data.adults ?? 0;
    let children = data.children ?? 0;
    let toddlers = data.toddlers ?? 0;

    if (adults === 0 && children === 0 && toddlers === 0) {
      throw new Error(RESERVATION.GUESTS_REQUIRED);
    }

    const guests = calculateTotalGuests(adults, children, toddlers);

    // #165: Single-reservation capacity check (guests alone exceed hall capacity)
    if (guests > hall.capacity) {
      throw new Error(RESERVATION.GUESTS_EXCEED_CAPACITY(guests, hall.capacity));
    }

    let pricePerAdult: number;
    let pricePerChild: number;
    let pricePerToddler: number;
    let menuPackage = null;
    const selectedOptions: any[] = [];
    const optionsPrice = 0;

    if (data.menuPackageId) {
      menuPackage = await prisma.menuPackage.findUnique({
        where: { id: data.menuPackageId },
        include: {
          menuTemplate: true,
        }
      });

      if (!menuPackage) throw new Error(MENU.PACKAGE_NOT_FOUND);
      if (menuPackage.minGuests && guests < menuPackage.minGuests) {
        throw new Error(MENU.MIN_GUESTS(menuPackage.minGuests));
      }
      if (menuPackage.maxGuests && guests > menuPackage.maxGuests) {
        throw new Error(MENU.MAX_GUESTS(menuPackage.maxGuests));
      }

      pricePerAdult = Number(menuPackage.pricePerAdult);
      pricePerChild = Number(menuPackage.pricePerChild);
      pricePerToddler = Number(menuPackage.pricePerToddler);
    } else {
      if (data.pricePerAdult === undefined || data.pricePerChild === undefined) {
        throw new Error(RESERVATION.PRICE_REQUIRED);
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

    if (data.discountType && data.discountValue && data.discountValue > 0
        && data.discountReason && data.discountReason.trim().length >= 3) {
      discountTypeVal = data.discountType;
      discountValueNum = data.discountValue;
      discountReasonVal = data.discountReason.trim();
      priceBeforeDiscountVal = totalWithSurcharge;

      if (data.discountType === 'PERCENTAGE') {
        if (data.discountValue > 100) throw new Error('Rabat procentowy nie może przekroczyć 100%');
        discountAmountVal = Math.round(totalWithSurcharge * data.discountValue / 100 * 100) / 100;
      } else {
        discountAmountVal = data.discountValue;
        if (discountAmountVal > totalWithSurcharge) {
          throw new Error(`Rabat kwotowy (${discountAmountVal} PLN) nie może przekroczyć ceny (${totalWithSurcharge} PLN)`);
        }
      }

      finalTotalPrice = Math.round((totalWithSurcharge - discountAmountVal) * 100) / 100;
    }

    let notes = data.notes || '';
    if (hasNewFormat && data.startDateTime && data.endDateTime) {
      const startDT = new Date(data.startDateTime);
      const endDT = new Date(data.endDateTime);
      
      if (startDT < new Date()) throw new Error(RESERVATION.DATE_IN_FUTURE);
      if (startDT >= endDT) throw new Error(RESERVATION.END_AFTER_START);

      // #165: Capacity-based overlap check instead of binary block
      await this.validateCapacityForTimeRange(hall, startDT, endDT, guests);

      await this.checkWholeVenueConflict(data.hallId, startDT, endDT);

      /* istanbul ignore next */
      if (startDT.getFullYear() > new Date().getFullYear()) {
        notes += '\n[Auto] Rezerwacja na kolejny rok — ceny mogą ulec zmianie (inflacja).';
      }
    }

    if (hasLegacyFormat && data.date && data.startTime && data.endTime) {
      const reservationDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (reservationDate < today) throw new Error(RESERVATION.DATE_IN_FUTURE);
      if (data.startTime >= data.endTime) throw new Error(RESERVATION.END_AFTER_START);

      // #165: Capacity-based overlap check for legacy format
      const startDT = new Date(`${data.date}T${data.startTime}:00`);
      const endDT = new Date(`${data.date}T${data.endTime}:00`);
      await this.validateCapacityForTimeRange(hall, startDT, endDT, guests);

      await this.checkWholeVenueConflict(data.hallId, startDT, endDT);

      /* istanbul ignore next */
      if (reservationDate.getFullYear() > new Date().getFullYear()) {
        notes += '\n[Auto] Rezerwacja na kolejny rok — ceny mogą ulec zmianie (inflacja).';
      }
    }

    if (data.confirmationDeadline && data.startDateTime) {
      const deadline = new Date(data.confirmationDeadline);
      const eventStart = new Date(data.startDateTime);
      if (!validateConfirmationDeadline(deadline, eventStart)) {
        throw new Error(RESERVATION.CONFIRMATION_DEADLINE);
      }
    }

    const reservation = await prisma.reservation.create({
      data: {
        hallId: data.hallId,
        clientId: data.clientId,
        eventTypeId: data.eventTypeId,
        createdById: userId,
        startDateTime: data.startDateTime ? new Date(data.startDateTime) : null,
        endDateTime: data.endDateTime ? new Date(data.endDateTime) : null,
        adults, children, toddlers,
        pricePerAdult, pricePerChild, pricePerToddler,
        confirmationDeadline: data.confirmationDeadline ? new Date(data.confirmationDeadline) : null,
        customEventType: sanitizeString(data.customEventType),
        birthdayAge: data.birthdayAge || null,
        anniversaryYear: data.anniversaryYear || null,
        anniversaryOccasion: sanitizeString(data.anniversaryOccasion),
        date: data.date || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        guests, totalPrice: finalTotalPrice,
        discountType: discountTypeVal,
        discountValue: discountValueNum,
        discountAmount: discountAmountVal,
        discountReason: discountReasonVal,
        priceBeforeDiscount: priceBeforeDiscountVal,
        venueSurcharge: surcharge.amount,
        venueSurchargeLabel: surcharge.label,
        status: ReservationStatus.PENDING,
        notes: sanitizeString(notes),
        attachments: []
      },
      include: RESERVATION_INCLUDE
    });

    if (menuPackage) {
      await prisma.reservationMenuSnapshot.create({
        data: {
          reservationId: reservation.id,
          menuTemplateId: menuPackage.menuTemplateId,
          packageId: menuPackage.id,
          menuData: {
            packageName: menuPackage.name,
            packageDescription: menuPackage.description,
            templateName: menuPackage.menuTemplate.name,
            pricePerAdult: Number(menuPackage.pricePerAdult),
            pricePerChild: Number(menuPackage.pricePerChild),
            pricePerToddler: Number(menuPackage.pricePerToddler),
            selectedOptions
          },
          packagePrice, optionsPrice,
          totalMenuPrice: totalPrice,
          adultsCount: adults,
          childrenCount: children,
          toddlersCount: toddlers
        }
      });
    }

    // Sprint 8: Create service extras records
    if (data.serviceExtras && data.serviceExtras.length > 0) {
      const serviceItemIds = data.serviceExtras.map(e => e.serviceItemId);
      const serviceItems = await prisma.serviceItem.findMany({
        where: { id: { in: serviceItemIds } },
      });
      const itemMap = new Map(serviceItems.map((i: any) => [i.id, i]));

      for (const extra of data.serviceExtras) {
        const item = itemMap.get(extra.serviceItemId) as any;
        if (!item) continue;

        await prisma.reservationExtra.create({
          data: {
            reservationId: reservation.id,
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
        where: { id: reservation.id },
        data: { extrasTotalPrice: extrasTotal },
      });
    }

    const depositData = data.deposit || (data.depositAmount && data.depositDueDate ? {
      amount: data.depositAmount,
      dueDate: data.depositDueDate
    } : null);

    if (depositData) {
      const depositAmount = Number(depositData.amount);
      await prisma.deposit.create({
        data: {
          reservationId: reservation.id,
          amount: depositAmount,
          remainingAmount: depositAmount,
          dueDate: new Date(depositData.dueDate).toISOString().split('T')[0],
          paid: depositData.paid || false,
          status: depositData.paid ? 'PAID' : 'PENDING',
          paymentMethod: sanitizeString(depositData.paymentMethod),
          paidAt: depositData.paidAt ? new Date(depositData.paidAt) : null,
        }
      });
    }

    await this.createHistoryEntry(
      reservation.id, userId, 'CREATED', null, null, null,
      menuPackage
        ? `Utworzono rezerwację z pakietem menu: ${menuPackage.name}${discountTypeVal ? ` | Rabat: -${discountAmountVal} PLN` : ''}${extrasTotal > 0 ? ` | Dodatki: +${extrasTotal} PLN` : ''}${surchargeAmount > 0 ? ` | Dopłata obiekt: +${surchargeAmount} PLN` : ''}`
        : `Utworzono rezerwację${discountTypeVal ? ` | Rabat: -${discountAmountVal} PLN` : ''}${extrasTotal > 0 ? ` | Dodatki: +${extrasTotal} PLN` : ''}${surchargeAmount > 0 ? ` | Dopłata obiekt: +${surchargeAmount} PLN` : ''}`
    );

    // Audit log
    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'RESERVATION',
      entityId: reservation.id,
      details: {
        description: `Utworzono rezerwację: ${client.firstName} ${client.lastName} | ${hall.name} | ${eventType.name}`,
        data: {
          hallId: data.hallId,
          clientId: data.clientId,
          eventTypeId: data.eventTypeId,
          guests,
          totalPrice: finalTotalPrice,
          extrasTotal: extrasTotal > 0 ? extrasTotal : undefined,
          extrasCount: data.serviceExtras?.length || 0,
          venueSurcharge: surchargeAmount > 0 ? surchargeAmount : undefined,
          startDateTime: data.startDateTime,
          endDateTime: data.endDateTime
        }
      }
    });

    // Recalculate totalPrice with all components (including extra hours for long events)
    await recalculateReservationTotalPrice(reservation.id);

    return reservation as any;
  }

  async updateReservationMenu(
    reservationId: string,
    data: UpdateReservationMenuDTO,
    userId: string
  ): Promise<any> {
    await this.validateUserId(userId);

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { menuSnapshot: true, client: true, hall: true }
    });

    if (!reservation) throw new Error(RESERVATION.NOT_FOUND);
    // #144: Also block menu updates for ARCHIVED reservations
    if (reservation.status === ReservationStatus.COMPLETED || reservation.status === ReservationStatus.CANCELLED || reservation.status === ReservationStatus.ARCHIVED) {
      throw new Error(MENU.CANNOT_UPDATE_MENU);
    }

    const clientName = reservation.client
      ? `${(reservation.client as any).firstName} ${(reservation.client as any).lastName}`
      : 'N/A';
    /* istanbul ignore next -- hall always included */
    const hallName = (reservation.hall as any)?.name || 'N/A';

    const adults = data.adultsCount ?? reservation.adults;
    const children = data.childrenCount ?? reservation.children;
    const toddlers = data.toddlersCount ?? reservation.toddlers;
    const guests = calculateTotalGuests(adults, children, toddlers);

    if (data.menuPackageId === null) {
      // Get old package name before removal
      /* istanbul ignore next -- defensive: menuData always has packageName */
      const oldPackageName = reservation.menuSnapshot
        ? ((reservation.menuSnapshot as any).menuData as any)?.packageName || 'Nieznany pakiet'
        : 'Brak';
      const oldTotalPrice = reservation.menuSnapshot
        ? Number((reservation.menuSnapshot as any).totalMenuPrice)
        : 0;

      if (reservation.menuSnapshot) {
        await prisma.reservationMenuSnapshot.delete({ where: { id: reservation.menuSnapshot.id } });
      }
      await this.createHistoryEntry(reservationId, userId, 'MENU_REMOVED', 'menu', 'Pakiet menu', 'Brak', 'Menu usunięte z rezerwacji');

      // Audit log — MENU_REMOVED
      await logChange({
        userId,
        action: 'MENU_REMOVED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Menu usunięte z rezerwacji: ${oldPackageName} (-${oldTotalPrice} PLN) | ${clientName}`,
          removedPackage: oldPackageName,
          removedPrice: oldTotalPrice,
        },
      });

      // Recalculate totalPrice after menu removal
      await recalculateReservationTotalPrice(reservationId);

      return { message: MENU.MENU_REMOVED };
    }

    if (data.menuPackageId) {
      const menuPackage = await prisma.menuPackage.findUnique({
        where: { id: data.menuPackageId },
        include: { menuTemplate: true }
      });

      if (!menuPackage) throw new Error(MENU.PACKAGE_NOT_FOUND);
      if (menuPackage.minGuests && guests < menuPackage.minGuests) {
        throw new Error(MENU.MIN_GUESTS(menuPackage.minGuests));
      }
      if (menuPackage.maxGuests && guests > menuPackage.maxGuests) {
        throw new Error(MENU.MAX_GUESTS(menuPackage.maxGuests));
      }

      const selectedOptions: any[] = [];
      const optionsPrice = 0;

      const pricePerAdult = Number(menuPackage.pricePerAdult);
      const pricePerChild = Number(menuPackage.pricePerChild);
      const pricePerToddler = Number(menuPackage.pricePerToddler);
      const packagePrice = calculateTotalPrice(adults, children, pricePerAdult, pricePerChild, toddlers, pricePerToddler);
      const totalMenuPrice = packagePrice + optionsPrice;

      // Save old info for audit
      const oldPackageName = reservation.menuSnapshot
        ? ((reservation.menuSnapshot as any).menuData as any)?.packageName || null
        : null;
      const oldTotalPrice = reservation.menuSnapshot
        ? Number((reservation.menuSnapshot as any).totalMenuPrice)
        : 0;

      const snapshotData = {
        reservationId,
        menuTemplateId: menuPackage.menuTemplateId,
        packageId: menuPackage.id,
        menuData: {
          packageName: menuPackage.name,
          packageDescription: menuPackage.description,
          templateName: menuPackage.menuTemplate.name,
          pricePerAdult, pricePerChild, pricePerToddler,
          selectedOptions
        },
        packagePrice, optionsPrice, totalMenuPrice,
        adultsCount: adults,
        childrenCount: children,
        toddlersCount: toddlers
      };

      if (reservation.menuSnapshot) {
        await prisma.reservationMenuSnapshot.update({ where: { id: reservation.menuSnapshot.id }, data: snapshotData });
      } else {
        await prisma.reservationMenuSnapshot.create({ data: snapshotData });
      }

      // Update guest counts and per-person prices (totalPrice recalculated below)
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { pricePerAdult, pricePerChild, pricePerToddler, adults, children, toddlers, guests }
      });

      // Recalculate totalPrice including extras + discount + surcharge
      const newTotalPrice = await recalculateReservationTotalPrice(reservationId);

      await this.createHistoryEntry(
        reservationId, userId, 'MENU_UPDATED', 'menu',
        reservation.menuSnapshot ? 'Poprzedni pakiet' : 'Brak',
        menuPackage.name, `Menu zaktualizowane na: ${menuPackage.name}`
      );

      // Audit log — MENU_UPDATED
      await logChange({
        userId,
        action: 'MENU_UPDATED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Menu ${oldPackageName ? 'zmienione' : 'dodane'}: ${menuPackage.name} (${totalMenuPrice} PLN) | ${clientName}`,
          oldPackage: oldPackageName,
          newPackage: menuPackage.name,
          oldPrice: oldTotalPrice,
          newPrice: totalMenuPrice,
          packagePrice,
          optionsPrice,
          optionsCount: selectedOptions.length,
          guests: { adults, children, toddlers },
        },
      });

      return { message: MENU.MENU_UPDATED, totalPrice: newTotalPrice };
    }

    throw new Error(MENU.INVALID_MENU_DATA);
  }

  async getReservations(filters?: ReservationFilters): Promise<ReservationResponse[]> {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.hallId) where.hallId = filters.hallId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.eventTypeId) where.eventTypeId = filters.eventTypeId;

    if (filters?.dateFrom || filters?.dateTo) {
      where.OR = [
        {
          startDateTime: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) })
          }
        },
        {
          date: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo })
          }
        }
      ];
    }

    if (filters?.archived !== undefined) {
      where.archivedAt = filters.archived ? { not: null } : null;
    } else {
      where.archivedAt = null;
    }

    // #144: When no explicit status filter, also exclude ARCHIVED by status
    if (!filters?.status && !filters?.archived) {
      where.status = { not: ReservationStatus.ARCHIVED };
    }

    const page = (filters as any)?.page ?? 1;
    const pageSize = (filters as any)?.pageSize ?? 100;

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        ...RESERVATION_INCLUDE,
        extras: {
          include: {
            serviceItem: {
              select: { id: true, name: true, basePrice: true, priceType: true }
            }
          }
        }
      },
      orderBy: [
        { startDateTime: 'asc' },
        { date: 'asc' },
        { startTime: 'asc' }
      ],
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    // Enrich each reservation with computed extrasTotalPrice
    return reservations.map((r: any) => {
      const extras = r.extras || [];
      const extrasTotalPrice = calculateExtrasTotalPrice(extras, r.guests || 0);
      return {
        ...r,
        extrasTotalPrice,
        extrasCount: extras.length,
      };
    }) as any[];
  }

  async getReservationById(id: string): Promise<ReservationResponse> {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        ...RESERVATION_INCLUDE,
        menuSnapshot: true,
        deposits: true,
        extras: {
          include: {
            serviceItem: {
              include: {
                category: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!reservation) throw new Error(RESERVATION.NOT_FOUND);

    // Enrich with computed extrasTotalPrice
    const extras = (reservation as any).extras || [];
    const extrasTotalPrice = calculateExtrasTotalPrice(extras, reservation.guests || 0);

    return {
      ...reservation,
      extrasTotalPrice,
      extrasCount: extras.length,
    } as any;
  }

  async updateReservation(id: string, data: UpdateReservationDTO, userId: string): Promise<ReservationResponse> {
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { hall: true, eventType: true, menuSnapshot: true, client: true }
    });

    if (!existingReservation) throw new Error(RESERVATION.NOT_FOUND);

    // ══ Etap 5: Notatka wewnętrzna — edytowalna niezależnie od statusu rezerwacji ══
    const isOnlyInternalNotes =
      data.internalNotes !== undefined &&
      Object.keys(data).every(k => k === 'internalNotes');

    if (isOnlyInternalNotes) {
      const newValue = sanitizeString(data.internalNotes);
      const oldValue = (existingReservation as any).internalNotes ?? null;

      if (oldValue === newValue) {
        return await this.getReservationById(id);
      }

      await prisma.reservation.update({
        where: { id },
        data: { internalNotes: newValue },
      });

      await this.createHistoryEntry(
        id, userId, 'NOTE_UPDATED', 'internalNotes',
        oldValue || '(brak)', newValue || '(brak)',
        'Zaktualizowano notatkę wewnętrzną'
      );

      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'RESERVATION',
        entityId: id,
        details: {
          description: `Zaktualizowano notatkę wewnętrzną`,
          changes: { internalNotes: { old: oldValue, new: newValue } },
        },
      });

      return await this.getReservationById(id);
    }

    if (existingReservation.status === ReservationStatus.COMPLETED) throw new Error(RESERVATION.CANNOT_UPDATE_COMPLETED);
    if (existingReservation.status === ReservationStatus.CANCELLED) throw new Error(RESERVATION.CANNOT_UPDATE_CANCELLED);
    if (existingReservation.status === ReservationStatus.ARCHIVED) throw new Error(RESERVATION.CANNOT_UPDATE_ARCHIVED);

    // #176: eventTypeId is immutable after creation — silently ignore if sent
    // Changing eventType would invalidate menu (scoped per eventType), orphan custom fields,
    // and require cascading recalculations. Admin should cancel + recreate instead.
    if (data.eventTypeId !== undefined && data.eventTypeId !== existingReservation.eventTypeId) {
      console.warn(`[Reservation] Ignored eventTypeId change attempt on ${id}: ${existingReservation.eventTypeId} → ${data.eventTypeId}`);
    }

    if (data.menuPackageId !== undefined) {
      if (data.menuPackageId === null) {
        await this.updateReservationMenu(id, { menuPackageId: null }, userId);
      } else {
        await this.updateReservationMenu(id, {
          menuPackageId: data.menuPackageId,
          adultsCount: data.adults ?? existingReservation.adults,
          childrenCount: data.children ?? existingReservation.children,
          toddlersCount: data.toddlers ?? existingReservation.toddlers
        }, userId);
      }
    }

    const detectedChanges = detectReservationChanges(existingReservation, data);
    if (detectedChanges.length > 0) {
      if (!data.reason || data.reason.length < 10) {
        throw new Error(RESERVATION.REASON_REQUIRED);
      }
    }

    if (existingReservation.eventType) {
      const customValidation = validateCustomEventFields(existingReservation.eventType.name, data);
      if (!customValidation.valid) throw new Error(customValidation.error);
    }

    const updateData: any = {};

    // ══ #137: Hall change — validate new hall + recalculate surcharge ══
    let effectiveHall = existingReservation.hall;
    const hallChanged = data.hallId !== undefined && data.hallId !== existingReservation.hallId;

    if (hallChanged) {
      const newHall = await prisma.hall.findUnique({ where: { id: data.hallId! } });
      if (!newHall) throw new Error(HALL.NOT_FOUND);
      if (!newHall.isActive) throw new Error(HALL.NOT_ACTIVE);

      effectiveHall = newHall as any;
      updateData.hallId = data.hallId;
    }

    if (data.startDateTime) {
      const newStart = new Date(data.startDateTime);
      if (newStart < new Date()) throw new Error(RESERVATION.DATE_IN_FUTURE);
      updateData.startDateTime = newStart;
    }
    if (data.endDateTime) updateData.endDateTime = new Date(data.endDateTime);

    const effectiveHallId = (data.hallId ?? existingReservation.hallId)!;
    const finalStart = data.startDateTime ? new Date(data.startDateTime) : existingReservation.startDateTime;
    const finalEnd = data.endDateTime ? new Date(data.endDateTime) : existingReservation.endDateTime;
    
    if (finalStart && finalEnd && finalStart >= finalEnd) throw new Error(RESERVATION.END_AFTER_START);

    if (data.adults !== undefined) updateData.adults = data.adults;
    if (data.children !== undefined) updateData.children = data.children;
    if (data.toddlers !== undefined) updateData.toddlers = data.toddlers;

    const guestsChanged = data.adults !== undefined || data.children !== undefined || data.toddlers !== undefined;
    const newAdults = data.adults ?? existingReservation.adults;
    const newChildren = data.children ?? existingReservation.children;
    const newToddlers = data.toddlers ?? existingReservation.toddlers;

    if (guestsChanged) {
      updateData.guests = calculateTotalGuests(newAdults, newChildren, newToddlers);
    }

    const finalGuests = updateData.guests ?? existingReservation.guests;

    // #165: Capacity-based overlap + capacity check on hall/time/guests change
    if ((hallChanged || data.startDateTime || data.endDateTime || guestsChanged) && finalStart && finalEnd && effectiveHall) {
      await this.validateCapacityForTimeRange(effectiveHall as any, finalStart, finalEnd, finalGuests, id);
      await this.checkWholeVenueConflict(effectiveHallId, finalStart, finalEnd, id);
    }

    // Single-reservation capacity guard (guests alone exceed hall.capacity)
    if (effectiveHall && finalGuests > (effectiveHall as any).capacity) {
      throw new Error(RESERVATION.GUESTS_EXCEED_CAPACITY(finalGuests, (effectiveHall as any).capacity));
    }

    const hasMenuSnapshot = !!existingReservation.menuSnapshot;
    const isUsingMenuPackage = hasMenuSnapshot && data.menuPackageId !== null;
    
    // fix/pricing-recalculation: When using menu package with guest changes,
    // still recalculate snapshot but DON'T set totalPrice here — defer to recalculateReservationTotal
    if (isUsingMenuPackage && guestsChanged) {
      const recalcResult = await reservationMenuService.recalculateForGuestChange(
        id, newAdults, newChildren, newToddlers
      );
      // NOTE: We no longer set updateData.totalPrice here.
      // recalculateReservationTotal() at the end will compute the correct total.
      /* istanbul ignore next */
      if (recalcResult) {
        console.log(`[Reservation] Auto-recalculated menu snapshot for ${id}: menuPrice=${recalcResult.totalMenuPrice}`);
      }
    } else if (!isUsingMenuPackage) {
      // Update per-person prices if provided (will be used by recalculateReservationTotal)
      if (data.pricePerAdult !== undefined) updateData.pricePerAdult = data.pricePerAdult;
      if (data.pricePerChild !== undefined) updateData.pricePerChild = data.pricePerChild;
      if (data.pricePerToddler !== undefined) updateData.pricePerToddler = data.pricePerToddler;
    }

    // ══ #137: Recalculate venue surcharge — handles hall change + guest change ══
    const oldIsWholeVenue = existingReservation.hall ? (existingReservation.hall as any).isWholeVenue : false;
    const newIsWholeVenue = effectiveHall ? (effectiveHall as any).isWholeVenue : false;
    const oldSurcharge = Number((existingReservation as any).venueSurcharge) || 0;

    if (hallChanged || guestsChanged || oldIsWholeVenue || newIsWholeVenue) {
      const surcharge = calculateVenueSurcharge(newIsWholeVenue, finalGuests);
      const newSurcharge = surcharge.amount || 0;

      updateData.venueSurcharge = surcharge.amount;
      updateData.venueSurchargeLabel = surcharge.label;

      if (oldSurcharge !== newSurcharge) {
        const baseTotal = updateData.totalPrice ?? Number(existingReservation.totalPrice);
        updateData.totalPrice = Math.round((baseTotal - oldSurcharge + newSurcharge) * 100) / 100;

        if (!oldIsWholeVenue && newIsWholeVenue) {
          console.log(`[Reservation] Venue surcharge APPLIED for ${id}: +${newSurcharge} PLN (hall changed to whole venue)`);
          await this.createHistoryEntry(
            id, userId, 'SURCHARGE_APPLIED', 'venueSurcharge',
            '0', String(newSurcharge),
            VENUE_SURCHARGE.AUDIT_APPLIED(newSurcharge, finalGuests)
          );
        } else if (oldIsWholeVenue && !newIsWholeVenue) {
          console.log(`[Reservation] Venue surcharge REMOVED for ${id}: -${oldSurcharge} PLN (hall changed to normal)`);
          await this.createHistoryEntry(
            id, userId, 'SURCHARGE_REMOVED', 'venueSurcharge',
            String(oldSurcharge), '0',
            VENUE_SURCHARGE.AUDIT_REMOVED
          );
        } else {
          console.log(`[Reservation] Venue surcharge RECALCULATED for ${id}: ${oldSurcharge} → ${newSurcharge} PLN`);
          await this.createHistoryEntry(
            id, userId, 'SURCHARGE_RECALC', 'venueSurcharge',
            String(oldSurcharge), String(newSurcharge),
            VENUE_SURCHARGE.AUDIT_RECALCULATED(oldSurcharge, newSurcharge, finalGuests)
          );
        }
      }
    }

    if (data.confirmationDeadline) {
      const deadline = new Date(data.confirmationDeadline);
      const eventStart = finalStart || (data.startDateTime ? new Date(data.startDateTime) : null);
      if (eventStart && !validateConfirmationDeadline(deadline, eventStart)) {
        throw new Error(RESERVATION.CONFIRMATION_DEADLINE);
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

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: RESERVATION_INCLUDE
    });

    // fix/pricing-recalculation: Centralized total recalculation after ALL fields are persisted.
    // This ensures totalPrice = basePricing + extrasTotal + venueSurcharge - discountAmount
    // regardless of which fields were changed (guests, prices, hall, menu, etc.).
    const pricingChanged = guestsChanged || hallChanged
      || data.pricePerAdult !== undefined || data.pricePerChild !== undefined || data.pricePerToddler !== undefined
      || data.menuPackageId !== undefined;

    if (pricingChanged) {
      await recalculateReservationTotal(id);
    }

    if (detectedChanges.length > 0) {
      const changesSummary = formatChangesSummary(detectedChanges);
      await this.createHistoryEntry(id, userId, 'UPDATED', 'multiple', 'różne', 'różne', `${data.reason}\n\nZmiany:\n${changesSummary}`);
    }

    // Audit log
    const changes = diffObjects(existingReservation, reservation);
    if (Object.keys(changes).length > 0) {
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'RESERVATION',
        entityId: id,
        details: {
          description: `Zaktualizowano rezerwację: ${(existingReservation.client as any)?.firstName ?? ''} ${(existingReservation.client as any)?.lastName ?? ''}`,
          changes,
          reason: data.reason
        }
      });
    }

    // Ensure totalPrice reflects all components (menu + extras + surcharge + extraHours - discount)
    await recalculateReservationTotalPrice(id);

    return reservation as any;
  }

  async updateStatus(id: string, data: UpdateStatusDTO, userId: string): Promise<ReservationResponse> {
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({ where: { id }, include: { client: true, hall: true } });
    if (!existingReservation) throw new Error(RESERVATION.NOT_FOUND);

    this.validateStatusTransition(existingReservation.status, data.status);

    if (data.status === ReservationStatus.COMPLETED) {
      const eventDate = existingReservation.startDateTime
        ? new Date(existingReservation.startDateTime)
        : existingReservation.date
          ? new Date(existingReservation.date)
          : null;
      if (eventDate && eventDate > new Date()) {
        throw new Error(RESERVATION.CANNOT_COMPLETE_BEFORE_EVENT);
      }
    }

    // #172: Cancellation = instant archive (CANCELLED → ARCHIVED + archivedAt)
    if (data.status === ReservationStatus.CANCELLED) {
      const reservation = await prisma.$transaction(async (tx) => {
        const updatedReservation = await tx.reservation.update({
          where: { id },
          data: { status: ReservationStatus.ARCHIVED, archivedAt: new Date() },
          include: RESERVATION_INCLUDE
        });

        const cancelledDeposits = await this.cascadeCancelDeposits(tx, id, userId, data.reason);

        await tx.reservationHistory.create({
          data: {
            reservationId: id,
            changedByUserId: userId,
            changeType: 'STATUS_CHANGED',
            fieldName: 'status',
            oldValue: existingReservation.status,
            newValue: 'CANCELLED',
            reason: data.reason
              ? `${data.reason}${cancelledDeposits > 0 ? ` | Auto-anulowano ${cancelledDeposits} zaliczek` : ''}`
              : `Zmiana statusu${cancelledDeposits > 0 ? ` | Auto-anulowano ${cancelledDeposits} zaliczek` : ''}`
          }
        });

        // #172: Auto-archive history entry
        await tx.reservationHistory.create({
          data: {
            reservationId: id,
            changedByUserId: userId,
            changeType: 'AUTO_ARCHIVED',
            fieldName: 'archivedAt',
            oldValue: null,
            newValue: new Date().toISOString(),
            reason: 'Automatyczna archiwizacja po anulowaniu rezerwacji'
          }
        });

        return updatedReservation;
      });

      await logChange({
        userId,
        action: 'STATUS_CHANGE',
        entityType: 'RESERVATION',
        entityId: id,
        details: {
          description: `Anulowano i zarchiwizowano rezerwację: ${(existingReservation.client as any)?.firstName ?? ''} ${(existingReservation.client as any)?.lastName ?? ''} | ${existingReservation.hall?.name ?? 'Brak sali'}`,
          oldStatus: existingReservation.status,
          newStatus: 'CANCELLED → ARCHIVED',
          reason: data.reason
        }
      });

      return reservation as any;
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: data.status },
      include: RESERVATION_INCLUDE
    });

    await this.createHistoryEntry(id, userId, 'STATUS_CHANGED', 'status', existingReservation.status, data.status, data.reason || 'Zmiana statusu');

    await logChange({
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'RESERVATION',
      entityId: id,
      details: {
        description: `Zmiana statusu rezerwacji: ${existingReservation.status} → ${data.status}`,
        oldStatus: existingReservation.status,
        newStatus: data.status,
        reason: data.reason
      }
    });

    return reservation as any;
  }

  // #172: Cancellation = instant archive
  async cancelReservation(id: string, userId: string, reason?: string): Promise<void> {
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({ where: { id }, include: { client: true, hall: true } });
    if (!existingReservation) throw new Error(RESERVATION.NOT_FOUND);
    if (existingReservation.status === ReservationStatus.CANCELLED) throw new Error(RESERVATION.ALREADY_CANCELLED);
    if (existingReservation.status === ReservationStatus.COMPLETED) throw new Error(RESERVATION.CANNOT_CANCEL_COMPLETED);
    if (existingReservation.status === ReservationStatus.ARCHIVED) throw new Error(RESERVATION.ALREADY_ARCHIVED);

    await prisma.$transaction(async (tx) => {
      // #172: Instant archive — status ARCHIVED + archivedAt set
      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.ARCHIVED, archivedAt: new Date() }
      });

      const cancelledCount = await this.cascadeCancelDeposits(tx, id, userId, reason);

      await tx.reservationHistory.create({
        data: {
          reservationId: id,
          changedByUserId: userId,
          changeType: 'CANCELLED',
          fieldName: 'status',
          oldValue: existingReservation.status,
          newValue: 'CANCELLED',
          reason: reason
            ? `${reason}${cancelledCount > 0 ? ` | Auto-anulowano ${cancelledCount} zaliczek` : ''}`
            : `Rezerwacja anulowana${cancelledCount > 0 ? ` | Auto-anulowano ${cancelledCount} zaliczek` : ''}`
        }
      });

      // #172: Auto-archive history entry
      await tx.reservationHistory.create({
        data: {
          reservationId: id,
          changedByUserId: userId,
          changeType: 'AUTO_ARCHIVED',
          fieldName: 'archivedAt',
          oldValue: null,
          newValue: new Date().toISOString(),
          reason: 'Automatyczna archiwizacja po anulowaniu rezerwacji'
        }
      });
    });

    await logChange({
      userId,
      action: 'CANCEL',
      entityType: 'RESERVATION',
      entityId: id,
      details: {
        description: `Anulowano i zarchiwizowano rezerwację: ${(existingReservation.client as any)?.firstName ?? ''} ${(existingReservation.client as any)?.lastName ?? ''} | ${existingReservation.hall?.name ?? 'Brak sali'}`,
        reason
      }
    });
  }

  async archiveReservation(id: string, userId: string, reason?: string): Promise<void> {
    await this.validateUserId(userId);

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { client: true, hall: true }
    });

    if (!reservation) throw new Error(RESERVATION.NOT_FOUND);
    if (reservation.archivedAt) throw new Error(RESERVATION.ALREADY_ARCHIVED);

    await prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.ARCHIVED, archivedAt: new Date() }
    });

    await this.createHistoryEntry(
      id, userId, 'ARCHIVED', 'archivedAt',
      'null', new Date().toISOString(),
      reason || 'Rezerwacja zarchiwizowana'
    );

    await logChange({
      userId,
      action: 'ARCHIVE',
      entityType: 'RESERVATION',
      entityId: id,
      details: {
        description: `Zarchiwizowano rezerwację: ${(reservation.client as any)?.firstName ?? ''} ${(reservation.client as any)?.lastName ?? ''} | ${reservation.hall?.name ?? 'Brak sali'}`,
        reason
      }
    });
  }

  async unarchiveReservation(id: string, userId: string, reason?: string): Promise<void> {
    await this.validateUserId(userId);

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { client: true, hall: true }
    });

    if (!reservation) throw new Error(RESERVATION.NOT_FOUND);
    if (!reservation.archivedAt) throw new Error(RESERVATION.NOT_ARCHIVED);

    await prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED, archivedAt: null }
    });

    await this.createHistoryEntry(
      id, userId, 'UNARCHIVED', 'archivedAt',
      reservation.archivedAt.toISOString(), 'null',
      reason || 'Rezerwacja przywrócona z archiwum'
    );

    await logChange({
      userId,
      action: 'UNARCHIVE',
      entityType: 'RESERVATION',
      entityId: id,
      details: {
        description: `Przywrócono rezerwację z archiwum: ${(reservation.client as any)?.firstName ?? ''} ${(reservation.client as any)?.lastName ?? ''} | ${reservation.hall?.name ?? 'Brak sali'}`,
        reason
      }
    });
  }

  private async cascadeCancelDeposits(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    reservationId: string,
    userId: string,
    reason?: string
  ): Promise<number> {
    const pendingDeposits = await tx.deposit.findMany({
      where: {
        reservationId,
        status: { in: ['PENDING', 'OVERDUE'] }
      }
    });

    if (pendingDeposits.length === 0) return 0;

    await tx.deposit.updateMany({
      where: {
        reservationId,
        status: { in: ['PENDING', 'OVERDUE'] }
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    const totalCancelledAmount = pendingDeposits.reduce(
      (sum: number, d: any) => sum + Number(d.amount), 0
    );

    for (const deposit of pendingDeposits) {
      await tx.reservationHistory.create({
        data: {
          reservationId,
          changedByUserId: userId,
          changeType: 'DEPOSIT_CANCEL',
          fieldName: 'deposit',
          oldValue: deposit.status,
          newValue: 'CANCELLED',
          reason: `Zaliczka ${Number(deposit.amount).toLocaleString('pl-PL')} zł auto-anulowana z powodu anulowania rezerwacji${reason ? `: ${reason}` : ''}`
        }
      });
    }

    /* istanbul ignore next */
    setTimeout(async () => {
      try {
        await logChange({
          userId,
          action: 'DEPOSIT_CANCELLED',
          entityType: 'RESERVATION',
          entityId: reservationId,
          details: {
            description: `Auto-anulowano ${pendingDeposits.length} zaliczek (${totalCancelledAmount.toFixed(2)} PLN) przy anulowaniu rezerwacji`,
            cancelledCount: pendingDeposits.length,
            totalCancelledAmount,
            depositIds: pendingDeposits.map((d: any) => d.id),
            reason,
          },
        });
      } catch (e) {
        console.error('[Audit] Failed to log DEPOSIT_CANCELLED:', e);
      }
    }, 0);

    return pendingDeposits.length;
  }

  /**
   * #165: Validate capacity for a time range — central capacity-based overlap logic.
   *
   * Decision tree:
   * 1. hall.allowMultipleBookings === false → any overlap = block (MULTIPLE_BOOKINGS_DISABLED)
   * 2. hall.allowMultipleBookings === true  → aggregate occupied + newGuests vs capacity
   *    If exceeded → CAPACITY_EXCEEDED with available/total info
   */
  private async validateCapacityForTimeRange(
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
      AND: [
        { startDateTime: { lt: endDateTime } },
        { endDateTime: { gt: startDateTime } },
      ],
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
  private async checkWholeVenueConflict(
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
      AND: [
        { startDateTime: { lt: endDateTime } },
        { endDateTime: { gt: startDateTime } }
      ]
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
          client: { select: { firstName: true, lastName: true } }
        }
      });

      if (conflict) {
        const clientName = conflict.client
          ? `${conflict.client.firstName} ${conflict.client.lastName}`
          : 'nieznany klient';
        const hallName = (conflict as any).hall?.name || 'inna sala';
        throw new Error(
          `Nie można zarezerwować całego obiektu — sala "${hallName}" ma już rezerwację w tym terminie (${clientName}).`
        );
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
        include: {
          client: { select: { firstName: true, lastName: true } }
        }
      });

      if (conflict) {
        const clientName = conflict.client
          ? `${conflict.client.firstName} ${conflict.client.lastName}`
          : 'nieznany klient';
        throw new Error(
          `Nie można zarezerwować tej sali — cały obiekt jest już zarezerwowany w tym terminie (${clientName}).`
        );
      }
    }
  }

  private async validateUserId(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(401, 'Sesja wygasła lub użytkownik nie istnieje — wyloguj się i zaloguj ponownie');
    }
  }

  // #144: Added ARCHIVED as terminal state (no transitions out)
  private validateStatusTransition(currentStatus: string, newStatus: ReservationStatus): void {
    const validTransitions: Record<string, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
      [ReservationStatus.CONFIRMED]: [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED],
      [ReservationStatus.COMPLETED]: [],
      [ReservationStatus.CANCELLED]: [],
      [ReservationStatus.ARCHIVED]: [],
    };
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(RESERVATION.STATUS_TRANSITION_INVALID(currentStatus, newStatus));
    }
  }

  private async createHistoryEntry(
    reservationId: string, userId: string, changeType: string,
    fieldName: string | null, oldValue: string | null, newValue: string | null, reason: string
  ): Promise<void> {
    await prisma.reservationHistory.create({
      data: { reservationId, changedByUserId: userId, changeType, fieldName, oldValue, newValue, reason }
    });
  }
}

export default new ReservationService();
