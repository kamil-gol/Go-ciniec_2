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
// #217: logChange/diffObjects imports removed — all audit logging moved to createHistoryEntry
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
  formatChangesSummary,
} from '../utils/reservation.utils';
import { SelectedOptionDTO } from '../dto/menu-selection.dto';
import { Prisma } from '@/prisma-client';
import { calculateVenueSurcharge } from '../utils/venue-surcharge';
import { recalculateReservationTotalPrice } from '../utils/recalculate-price';
import { reservationCategoryExtraService } from './reservationCategoryExtra.service';
import reservationMenuService from './reservation-menu.service';
import { RESERVATION, MENU, HALL, CLIENT, EVENT_TYPE, VENUE_SURCHARGE } from '../i18n/pl';
import notificationService from './notification.service';
import { validateCapacityForTimeRange, checkWholeVenueConflict } from './reservation-validation.service';
import { reservationStatusService } from './reservation-status.service';
import { createHistoryEntry } from './reservation-history.helper';

function sanitizeString(value: unknown): string | null {
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
      throw new AppError(RESERVATION.HALL_CLIENT_EVENT_REQUIRED, 400);
    }
    await this.validateUserId(userId);

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

    let adults = data.adults ?? 0;
    let children = data.children ?? 0;
    let toddlers = data.toddlers ?? 0;

    if (adults === 0 && children === 0 && toddlers === 0) {
      throw new AppError(RESERVATION.GUESTS_REQUIRED, 400);
    }

    const guests = calculateTotalGuests(adults, children, toddlers);

    // #165: Single-reservation capacity check (guests alone exceed hall capacity)
    if (guests > hall.capacity) {
      throw new AppError(RESERVATION.GUESTS_EXCEED_CAPACITY(guests, hall.capacity), 400);
    }

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

    let notes = data.notes || '';

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

    const reservation = await prisma.reservation.create({
      data: {
        hallId: data.hallId,
        clientId: data.clientId,
        eventTypeId: data.eventTypeId,
        createdById: userId,
        startDateTime: data.startDateTime ? new Date(data.startDateTime) : null,
        endDateTime: data.endDateTime ? new Date(data.endDateTime) : null,
        adults,
        children,
        toddlers,
        pricePerAdult,
        pricePerChild,
        pricePerToddler,
        confirmationDeadline: data.confirmationDeadline ? new Date(data.confirmationDeadline) : null,
        customEventType: sanitizeString(data.customEventType),
        birthdayAge: data.birthdayAge || null,
        anniversaryYear: data.anniversaryYear || null,
        anniversaryOccasion: sanitizeString(data.anniversaryOccasion),
        date: data.date || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        guests,
        totalPrice: finalTotalPrice,
        discountType: discountTypeVal,
        discountValue: discountValueNum,
        discountAmount: discountAmountVal,
        discountReason: discountReasonVal,
        priceBeforeDiscount: priceBeforeDiscountVal,
        venueSurcharge: surcharge.amount,
        venueSurchargeLabel: surcharge.label,
        status: ReservationStatus.PENDING,
        notes: sanitizeString(notes),
        attachments: [],
      },
      include: RESERVATION_INCLUDE,
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
            selectedOptions,
          },
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
      const itemMap = new Map(serviceItems.map((i) => [i.id, i]));

      for (const extra of data.serviceExtras) {
        const item = itemMap.get(extra.serviceItemId);
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

    // #216: Create category extras (additional paid items beyond package limits)
    if (data.categoryExtras && data.categoryExtras.length > 0) {
      await reservationCategoryExtraService.upsertExtras(
        reservation.id,
        data.categoryExtras,
        userId,
        { adults, children, toddlers }
      );
    }

    const depositData =
      data.deposit || (data.depositAmount && data.depositDueDate ? { amount: data.depositAmount, dueDate: data.depositDueDate } : null);
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
        },
      });
    }

    await createHistoryEntry(
      reservation.id,
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

    // #217: logChange removed — createHistoryEntry already covers reservation creation

    // Recalculate totalPrice with all components (including extra hours for long events)
    await recalculateReservationTotalPrice(reservation.id);

    // #128: Notification — new reservation created
    const clientDisplayName = client.firstName + ' ' + client.lastName;
    const dateStr = data.startDateTime
      ? new Date(data.startDateTime).toLocaleDateString('pl-PL')
      : data.date || '';
    notificationService.createForAll({
      type: 'RESERVATION_CREATED',
      title: 'Nowa rezerwacja',
      message: `${clientDisplayName} — ${hall.name}, ${eventType.name} (${dateStr})`,
      entityType: 'RESERVATION',
      entityId: reservation.id,
      excludeUserId: userId,
    });

    return reservation as ReservationResponse;
  }

  async updateReservationMenu(reservationId: string, data: UpdateReservationMenuDTO, userId: string): Promise<{ message: string; totalPrice?: number }> {
    await this.validateUserId(userId);

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { menuSnapshot: true, client: true, hall: true },
    });

    if (!reservation) throw new AppError(RESERVATION.NOT_FOUND, 404);

    // #144: Also block menu updates for ARCHIVED reservations
    if (
      reservation.status === ReservationStatus.COMPLETED ||
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.ARCHIVED
    ) {
      throw new AppError(MENU.CANNOT_UPDATE_MENU, 409);
    }

    const client = reservation.client as { firstName: string; lastName: string } | null;
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'N/A';
    /* istanbul ignore next -- hall always included */
    const hall = reservation.hall as { name: string } | null;
    const hallName = hall?.name || 'N/A';

    const adults = data.adultsCount ?? reservation.adults;
    const children = data.childrenCount ?? reservation.children;
    const toddlers = data.toddlersCount ?? reservation.toddlers;
    const guests = calculateTotalGuests(adults, children, toddlers);

    if (data.menuPackageId === null) {
      // Get old package name before removal
      /* istanbul ignore next -- defensive: menuData always has packageName */
      const menuData = reservation.menuSnapshot?.menuData as Record<string, unknown> | null;
      const oldPackageName = menuData?.packageName as string || 'Nieznany pakiet';
      const oldTotalPrice = reservation.menuSnapshot ? Number(reservation.menuSnapshot.totalMenuPrice) : 0;

      if (reservation.menuSnapshot) {
        await prisma.reservationMenuSnapshot.delete({ where: { id: reservation.menuSnapshot.id } });
      }

      await createHistoryEntry(reservationId, userId, 'MENU_REMOVED', 'menu', 'Pakiet menu', 'Brak', 'Menu usunięte z rezerwacji');

      // #217: logChange removed — createHistoryEntry already covers MENU_REMOVED

      // Recalculate totalPrice after menu removal
      await recalculateReservationTotalPrice(reservationId);
      return { message: MENU.MENU_REMOVED };
    }

    if (data.menuPackageId) {
      const menuPackage = await prisma.menuPackage.findUnique({
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

      const selectedOptions: SelectedOptionDTO[] = [];
      const optionsPrice = 0;
      const pricePerAdult = Number(menuPackage.pricePerAdult);
      const pricePerChild = Number(menuPackage.pricePerChild);
      const pricePerToddler = Number(menuPackage.pricePerToddler);

      const packagePrice = calculateTotalPrice(adults, children, pricePerAdult, pricePerChild, toddlers, pricePerToddler);
      const totalMenuPrice = packagePrice + optionsPrice;

      // Save old info for audit
      const oldMenuData = reservation.menuSnapshot?.menuData as Record<string, unknown> | null;
      const oldPackageNameForAudit = oldMenuData?.packageName as string || null;
      const oldTotalPriceForAudit = reservation.menuSnapshot ? Number(reservation.menuSnapshot.totalMenuPrice) : 0;

      const snapshotData = {
        reservationId,
        menuTemplateId: menuPackage.menuTemplateId,
        packageId: menuPackage.id,
        menuData: {
          packageName: menuPackage.name,
          packageDescription: menuPackage.description,
          templateName: menuPackage.menuTemplate.name,
          pricePerAdult,
          pricePerChild,
          pricePerToddler,
          selectedOptions,
        },
        packagePrice,
        optionsPrice,
        totalMenuPrice,
        adultsCount: adults,
        childrenCount: children,
        toddlersCount: toddlers,
      };

      if (reservation.menuSnapshot) {
        await prisma.reservationMenuSnapshot.update({ where: { id: reservation.menuSnapshot.id }, data: snapshotData });
      } else {
        await prisma.reservationMenuSnapshot.create({ data: snapshotData });
      }

      // Update guest counts and per-person prices (totalPrice recalculated below)
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { pricePerAdult, pricePerChild, pricePerToddler, adults, children, toddlers, guests },
      });

      // Recalculate totalPrice including extras + discount + surcharge
      const newTotalPrice = await recalculateReservationTotalPrice(reservationId);

      await createHistoryEntry(
        reservationId,
        userId,
        'MENU_UPDATED',
        'menu',
        reservation.menuSnapshot ? 'Poprzedni pakiet' : 'Brak',
        menuPackage.name,
        `Menu zaktualizowane na: ${menuPackage.name}`
      );

      // #217: logChange removed — createHistoryEntry already covers MENU_UPDATED

      return { message: MENU.MENU_UPDATED, totalPrice: newTotalPrice };
    }

    throw new AppError(MENU.INVALID_MENU_DATA, 400);
  }

  async getReservations(filters?: ReservationFilters): Promise<ReservationResponse[]> {
    const where: Prisma.ReservationWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.hallId) where.hallId = filters.hallId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.eventTypeId) where.eventTypeId = filters.eventTypeId;

    if (filters?.dateFrom || filters?.dateTo) {
      where.OR = [
        {
          startDateTime: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          },
        },
        {
          date: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
          },
        },
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

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 100;

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        ...RESERVATION_INCLUDE,
        extras: {
          include: {
            serviceItem: { select: { id: true, name: true, basePrice: true, priceType: true } },
          },
        },
        categoryExtras: {
          include: {
            packageCategory: {
              include: { category: { select: { id: true, name: true, icon: true } } },
            },
          },
        },
      },
      orderBy: [{ startDateTime: 'asc' }, { date: 'asc' }, { startTime: 'asc' }],
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    // Enrich each reservation with computed extrasTotalPrice
    return reservations.map((r) => {
      const extras = r.extras || [];
      const extrasTotalPrice = calculateExtrasTotalPrice(extras, r.guests || 0);
      const categoryExtras = r.categoryExtras || [];
      const categoryExtrasTotal = categoryExtras.reduce(
        (sum: number, e) => sum + Number(e.totalPrice), 0
      );
      return {
        ...r,
        extrasTotalPrice,
        extrasCount: extras.length,
        categoryExtras,
        categoryExtrasTotal,
      };
    }) as ReservationResponse[];
  }

  async getReservationById(id: string): Promise<ReservationResponse> {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        ...RESERVATION_INCLUDE,
        menuSnapshot: true,
        deposits: true,
        extras: {
          include: { serviceItem: { include: { category: true } } },
          orderBy: { createdAt: 'asc' },
        },
        categoryExtras: {
          include: {
            packageCategory: {
              include: { category: { select: { id: true, name: true, icon: true, slug: true } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!reservation) throw new AppError(RESERVATION.NOT_FOUND, 404);

    // Enrich with computed extrasTotalPrice
    const extras = reservation.extras || [];
    const extrasTotalPrice = calculateExtrasTotalPrice(extras, reservation.guests || 0);

    // #216: Compute category extras total
    const categoryExtras = reservation.categoryExtras || [];
    const categoryExtrasTotal = categoryExtras.reduce(
      (sum: number, e) => sum + Number(e.totalPrice), 0
    );

    return {
      ...reservation,
      extrasTotalPrice,
      extrasCount: extras.length,
      categoryExtras,
      categoryExtrasTotal,
    } as ReservationResponse;
  }

  async updateReservation(id: string, data: UpdateReservationDTO, userId: string): Promise<ReservationResponse> {
    await this.validateUserId(userId);
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { hall: true, eventType: true, menuSnapshot: true, client: true },
    });
    if (!existingReservation) throw new AppError(RESERVATION.NOT_FOUND, 404);

    // ══ Etap 5: Notatka wewnętrzna — edytowalna niezależnie od statusu rezerwacji ══
    const isOnlyInternalNotes = data.internalNotes !== undefined && Object.keys(data).every((k) => k === 'internalNotes');
    if (isOnlyInternalNotes) {
      const newValue = sanitizeString(data.internalNotes);
      const oldValue = existingReservation.internalNotes ?? null;
      if (oldValue === newValue) {
        return await this.getReservationById(id);
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
      // #217: logChange removed — createHistoryEntry already covers this operation
      return await this.getReservationById(id);
    }

    if (existingReservation.status === ReservationStatus.COMPLETED) throw new AppError(RESERVATION.CANNOT_UPDATE_COMPLETED, 409);
    if (existingReservation.status === ReservationStatus.CANCELLED) throw new AppError(RESERVATION.CANNOT_UPDATE_CANCELLED, 409);
    if (existingReservation.status === ReservationStatus.ARCHIVED) throw new AppError(RESERVATION.CANNOT_UPDATE_ARCHIVED, 409);

    // #176: eventTypeId is immutable after creation — silently ignore if sent
    // Changing eventType would invalidate menu (scoped per eventType), orphan custom fields,
    // and require cascading recalculations. Admin should cancel + recreate instead.
    if (data.eventTypeId !== undefined && data.eventTypeId !== existingReservation.eventTypeId) {
      console.warn(`[Reservation] Ignored eventTypeId change attempt on ${id}: ${existingReservation.eventTypeId} → ${data.eventTypeId}`);
    }

    if (data.menuPackageId !== undefined) {
      // #216: When menu package changes, delete old category extras (they belong to old package's categories)
      await reservationCategoryExtraService.deleteByReservation(id, userId);

      if (data.menuPackageId === null) {
        await this.updateReservationMenu(id, { menuPackageId: null }, userId);
      } else {
        await this.updateReservationMenu(
          id,
          {
            menuPackageId: data.menuPackageId,
            adultsCount: data.adults ?? existingReservation.adults,
            childrenCount: data.children ?? existingReservation.children,
            toddlersCount: data.toddlers ?? existingReservation.toddlers,
          },
          userId
        );
      }
    }

    const detectedChanges = detectReservationChanges(existingReservation, data);
    if (detectedChanges.length > 0) {
      if (!data.reason || data.reason.length < 10) {
        throw new AppError(RESERVATION.REASON_REQUIRED, 400);
      }
    }

    if (existingReservation.eventType) {
      const customValidation = validateCustomEventFields(existingReservation.eventType.name, data);
      if (!customValidation.valid) throw new AppError(customValidation.error!, 400);
    }

    const updateData: Prisma.ReservationUpdateInput = {};

    // ══ #137: Hall change — validate new hall + recalculate surcharge ══
    let effectiveHall = existingReservation.hall;
    const hallChanged = data.hallId !== undefined && data.hallId !== existingReservation.hallId;
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

    const effectiveHallId = (data.hallId ?? existingReservation.hallId)!;
    const finalStart = data.startDateTime ? new Date(data.startDateTime) : existingReservation.startDateTime;
    const finalEnd = data.endDateTime ? new Date(data.endDateTime) : existingReservation.endDateTime;

    if (finalStart && finalEnd && finalStart >= finalEnd) throw new AppError(RESERVATION.END_AFTER_START, 400);

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
      await validateCapacityForTimeRange(effectiveHall, finalStart, finalEnd, finalGuests, id);
      await checkWholeVenueConflict(effectiveHallId, finalStart, finalEnd, id);
    }

    // Single-reservation capacity guard (guests alone exceed hall.capacity)
    if (effectiveHall && finalGuests > effectiveHall.capacity) {
      throw new AppError(RESERVATION.GUESTS_EXCEED_CAPACITY(finalGuests, effectiveHall.capacity), 400);
    }

    const hasMenuSnapshot = !!existingReservation.menuSnapshot;
    const isUsingMenuPackage = hasMenuSnapshot && data.menuPackageId !== null;

    // fix/pricing-recalculation: When using menu package with guest changes,
    // still recalculate snapshot but DON'T set totalPrice here — defer to recalculateReservationTotal
    if (isUsingMenuPackage && guestsChanged) {
      const recalcResult = await reservationMenuService.recalculateForGuestChange(id, newAdults, newChildren, newToddlers);
      // NOTE: We no longer set updateData.totalPrice here.
      // recalculateReservationTotal() at the end will compute the correct total.
      /* istanbul ignore next */
      if (recalcResult) {
        console.log(`[Reservation] Auto-recalculated menu snapshot for ${id}: menuPrice=${recalcResult.totalMenuPrice}`);
      }
    }

    // #216: Recalculate category extras when guest counts change (per-person pricing)
    if (guestsChanged) {
      await reservationCategoryExtraService.recalculateForGuestChange(id, newAdults, newChildren, newToddlers, userId);
    } else if (!isUsingMenuPackage) {
      // Update per-person prices if provided
      if (data.pricePerAdult !== undefined) updateData.pricePerAdult = data.pricePerAdult;
      if (data.pricePerChild !== undefined) updateData.pricePerChild = data.pricePerChild;
      if (data.pricePerToddler !== undefined) updateData.pricePerToddler = data.pricePerToddler;

      const ppa = data.pricePerAdult ?? existingReservation.pricePerAdult;
      const ppc = data.pricePerChild ?? existingReservation.pricePerChild;
      const ppt = data.pricePerToddler ?? existingReservation.pricePerToddler;

      // Recalculate totalPrice for legacy/no-menu reservations when guests or prices change
      if (guestsChanged || data.pricePerAdult !== undefined || data.pricePerChild !== undefined || data.pricePerToddler !== undefined) {
                updateData.totalPrice = calculateTotalPrice(newAdults, newChildren, Number(ppa), Number(ppc), newToddlers, Number(ppt));
      }
    }

    // ══ #137: Recalculate venue surcharge — handles hall change + guest change ══
    const oldIsWholeVenue = existingReservation.hall ? existingReservation.hall.isWholeVenue : false;
    const newIsWholeVenue = effectiveHall ? effectiveHall.isWholeVenue : false;
    const oldSurcharge = Number(existingReservation.venueSurcharge) || 0;

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
          await createHistoryEntry(
            id,
            userId,
            'SURCHARGE_APPLIED',
            'venueSurcharge',
            '0',
            String(newSurcharge),
            VENUE_SURCHARGE.AUDIT_APPLIED(newSurcharge, finalGuests)
          );
        } else if (oldIsWholeVenue && !newIsWholeVenue) {
          console.log(`[Reservation] Venue surcharge REMOVED for ${id}: -${oldSurcharge} PLN (hall changed to normal)`);
          await createHistoryEntry(id, userId, 'SURCHARGE_REMOVED', 'venueSurcharge', String(oldSurcharge), '0', VENUE_SURCHARGE.AUDIT_REMOVED);
        } else {
          console.log(`[Reservation] Venue surcharge RECALCULATED for ${id}: ${oldSurcharge} → ${newSurcharge} PLN`);
          await createHistoryEntry(
            id,
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
      const eventStart = finalStart || (data.startDateTime ? new Date(data.startDateTime) : null);
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

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: RESERVATION_INCLUDE,
    });

    if (detectedChanges.length > 0) {
      const changesSummary = formatChangesSummary(detectedChanges);
      await createHistoryEntry(id, userId, 'UPDATED', 'multiple', 'różne', 'różne', `${data.reason}

Zmiany:
${changesSummary}`);
    }

    // #217: logChange removed — createHistoryEntry already covers this update with detailed change summary

    // #216: Update category extras if provided
    if (data.categoryExtras !== undefined) {
      if (data.categoryExtras.length > 0) {
        const updatedRes = await prisma.reservation.findUnique({ where: { id }, select: { adults: true, children: true, toddlers: true } });
        await reservationCategoryExtraService.upsertExtras(id, data.categoryExtras, userId, {
          adults: updatedRes?.adults ?? 0,
          children: updatedRes?.children ?? 0,
          toddlers: updatedRes?.toddlers ?? 0,
        });
      } else {
        await reservationCategoryExtraService.deleteByReservation(id, userId);
      }
    }

    // Ensure totalPrice reflects all components (menu + extras + categoryExtras + surcharge + extraHours - discount)
    await recalculateReservationTotalPrice(id);

    // #128: Notification — reservation updated
    const updatedClient = reservation.client as { firstName: string; lastName: string } | null;
    if (updatedClient) {
      const updClientName = updatedClient.firstName + ' ' + updatedClient.lastName;
      notificationService.createForAll({
        type: 'RESERVATION_UPDATED',
        title: 'Rezerwacja zaktualizowana',
        message: `${updClientName} — zmieniono dane rezerwacji`,
        entityType: 'RESERVATION',
        entityId: id,
        excludeUserId: userId,
      });
    }

    return reservation as any;
  }

  // Status operations delegated to ReservationStatusService
  async updateStatus(id: string, data: UpdateStatusDTO, userId: string): Promise<any> {
    return reservationStatusService.updateStatus(id, data, userId);
  }

  async cancelReservation(id: string, userId: string, reason?: string): Promise<void> {
    return reservationStatusService.cancelReservation(id, userId, reason);
  }

  async archiveReservation(id: string, userId: string, reason?: string): Promise<void> {
    return reservationStatusService.archiveReservation(id, userId, reason);
  }

  async unarchiveReservation(id: string, userId: string, reason?: string): Promise<void> {
    return reservationStatusService.unarchiveReservation(id, userId, reason);
  }

  /**
   * Check hall availability for a given time range.
   * Returns whether the slot is available and any conflicting reservations.
   */
  async checkAvailability(
    hallId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeReservationId?: string,
  ): Promise<{ available: boolean; conflicts: Array<{
    id: string;
    clientName: string;
    eventType: string;
    startDateTime: string;
    endDateTime: string;
    status: string;
  }> }> {
    const conflicts = await prisma.reservation.findMany({
      where: {
        hallId,
        status: { notIn: ['CANCELLED'] },
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
        startDateTime: { lt: endDateTime },
        endDateTime: { gt: startDateTime },
      },
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        status: true,
        client: { select: { firstName: true, lastName: true } },
        eventType: { select: { name: true } },
      },
      orderBy: { startDateTime: 'asc' },
    });

    const formattedConflicts = conflicts.map((c) => ({
      id: c.id,
      clientName: c.client ? `${c.client.firstName} ${c.client.lastName}` : 'Nieznany',
      eventType: c.eventType?.name || 'Nieznany',
      startDateTime: c.startDateTime?.toISOString() || '',
      endDateTime: c.endDateTime?.toISOString() || '',
      status: c.status,
    }));

    return {
      available: formattedConflicts.length === 0,
      conflicts: formattedConflicts,
    };
  }

  /**
   * Prepare reservation data for PDF generation.
   * Maps extras → reservationExtras, categoryExtras for PDF format,
   * strips cancelled deposits and internalNotes.
   */
  async prepareReservationForPDF(id: string): Promise<any> {
    const reservation = await this.getReservationById(id) as any;
    if (!reservation) throw new AppError(RESERVATION.NOT_FOUND, 404);

    // Map extras → reservationExtras for PDF compatibility
    const extras = reservation.extras || [];
    const reservationExtras = extras.map((e: any) => {
      const unitPrice = e.customPrice !== null && e.customPrice !== undefined
        ? Number(e.customPrice)
        : Number(e.serviceItem.basePrice);
      const quantity = e.quantity || 1;
      let totalPrice: number;

      if (e.serviceItem.priceType === 'PER_PERSON') {
        totalPrice = unitPrice * quantity * (reservation.guests || 0);
      } else if (e.serviceItem.priceType === 'FREE') {
        totalPrice = 0;
      } else {
        // FLAT
        totalPrice = unitPrice * quantity;
      }
      totalPrice = Math.round(totalPrice * 100) / 100;

      return {
        serviceItem: {
          name: e.serviceItem.name,
          priceType: e.serviceItem.priceType,
          category: e.serviceItem.category || null,
        },
        quantity,
        unitPrice,
        totalPrice,
        priceType: e.serviceItem.priceType,
        note: e.note || null,
        status: e.status || 'ACTIVE',
      };
    });

    // #216: Map categoryExtras for PDF rendering
    const categoryExtrasForPDF = (reservation.categoryExtras || []).map((ce: any) => ({
      categoryName: ce.packageCategory?.category?.name || 'Kategoria',
      quantity: Number(ce.quantity),
      pricePerItem: Number(ce.pricePerItem),
      guestCount: Number(ce.guestCount) || 1,
      portionTarget: ce.portionTarget || 'ALL',
      totalPrice: Number(ce.totalPrice),
    }));

    const pdfData = {
      ...reservation,
      reservationExtras,
      categoryExtras: categoryExtrasForPDF,
    };

    // #deposits-fix: Strip CANCELLED deposits — they must NEVER appear in customer-facing PDF
    if (Array.isArray(pdfData.deposits)) {
      pdfData.deposits = pdfData.deposits.filter((d: any) => d.status !== 'CANCELLED');
    }

    // Etap 5: Notatka wewnętrzna NIGDY nie trafia do PDF
    delete pdfData.internalNotes;

    return pdfData;
  }

  private async validateUserId(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(401, 'Sesja wygasła lub użytkownik nie istnieje — wyloguj się i zaloguj ponownie');
    }
  }
}

export default new ReservationService();
export const reservationService = new ReservationService();
