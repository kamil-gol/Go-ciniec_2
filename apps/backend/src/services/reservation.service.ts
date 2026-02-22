/**
 * Reservation Service - with full Audit Logging
 * Business logic for reservation management with advanced features
 * Updated: Phase 1 Audit — logChange() for menu updates + cascade cancel
 * Updated: Sprint 8 — service extras creation during reservation
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */

import { prisma } from '@/lib/prisma';
import { AppError } from '../utils/AppError';
import { logChange, diffObjects } from '../utils/audit-logger';
import {
  CreateReservationDTO,
  UpdateReservationDTO,
  UpdateStatusDTO,
  ReservationFilters,
  ReservationResponse,
  ReservationStatus,
  UpdateReservationMenuDTO,
  MenuOptionSelection
} from '../types/reservation.types';
import {
  calculateTotalGuests,
  calculateTotalPrice,
  validateConfirmationDeadline,
  validateCustomEventFields,
  detectReservationChanges,
  formatChangesSummary
} from '../utils/reservation.utils';
import reservationMenuService from './reservation-menu.service';
import { RESERVATION, MENU, HALL, CLIENT, EVENT_TYPE } from '../i18n/pl';

function sanitizeString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).replace(/\x00/g, '').trim() || null;
}

const RESERVATION_INCLUDE = {
  hall: { select: { id: true, name: true, capacity: true, isWholeVenue: true } },
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  eventType: { select: { id: true, name: true } },
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
    if (guests > hall.capacity) {
      throw new Error(RESERVATION.GUESTS_EXCEED_CAPACITY(guests, hall.capacity));
    }

    let pricePerAdult: number;
    let pricePerChild: number;
    let pricePerToddler: number;
    let menuPackage = null;
    let selectedOptions: any[] = [];
    let optionsPrice = 0;

    if (data.menuPackageId) {
      menuPackage = await prisma.menuPackage.findUnique({
        where: { id: data.menuPackageId },
        include: {
          menuTemplate: true,
          packageOptions: { include: { option: true } }
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

      if (data.selectedOptions && data.selectedOptions.length > 0) {
        selectedOptions = await this.processSelectedOptions(data.selectedOptions, guests);
        optionsPrice = this.calculateOptionsPrice(selectedOptions, guests);
      }
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

    // ═══ Discount handling (Sprint 7 — applied atomically during creation) ═══
    let discountTypeVal: string | null = null;
    let discountValueNum: number | null = null;
    let discountAmountVal: number | null = null;
    let discountReasonVal: string | null = null;
    let priceBeforeDiscountVal: number | null = null;
    let finalTotalPrice = totalWithExtras;

    if (data.discountType && data.discountValue && data.discountValue > 0
        && data.discountReason && data.discountReason.trim().length >= 3) {
      discountTypeVal = data.discountType;
      discountValueNum = data.discountValue;
      discountReasonVal = data.discountReason.trim();
      priceBeforeDiscountVal = totalWithExtras;

      if (data.discountType === 'PERCENTAGE') {
        if (data.discountValue > 100) throw new Error('Rabat procentowy nie mo\u017ce przekroczy\u0107 100%');
        discountAmountVal = Math.round(totalWithExtras * data.discountValue / 100 * 100) / 100;
      } else {
        discountAmountVal = data.discountValue;
        if (discountAmountVal > totalWithExtras) {
          throw new Error(`Rabat kwotowy (${discountAmountVal} PLN) nie mo\u017ce przekroczy\u0107 ceny (${totalWithExtras} PLN)`);
        }
      }

      finalTotalPrice = Math.round((totalWithExtras - discountAmountVal) * 100) / 100;
    }

    let notes = data.notes || '';
    if (hasNewFormat && data.startDateTime && data.endDateTime) {
      const startDT = new Date(data.startDateTime);
      const endDT = new Date(data.endDateTime);
      
      if (startDT < new Date()) throw new Error(RESERVATION.DATE_IN_FUTURE);
      if (startDT >= endDT) throw new Error(RESERVATION.END_AFTER_START);

      const hasOverlap = await this.checkDateTimeOverlap(data.hallId, startDT, endDT);
      if (hasOverlap) throw new Error(RESERVATION.TIME_SLOT_BOOKED);

      await this.checkWholeVenueConflict(data.hallId, startDT, endDT);

      /* istanbul ignore next */
      if (startDT.getFullYear() > new Date().getFullYear()) {
        notes += '\n[Auto] Rezerwacja na kolejny rok \u2014 ceny mog\u0105 ulec zmianie (inflacja).';
      }
    }

    if (hasLegacyFormat && data.date && data.startTime && data.endTime) {
      const reservationDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (reservationDate < today) throw new Error(RESERVATION.DATE_IN_FUTURE);
      if (data.startTime >= data.endTime) throw new Error(RESERVATION.END_AFTER_START);

      const hasOverlap = await this.checkOverlap(data.hallId, data.date, data.startTime, data.endTime);
      if (hasOverlap) throw new Error(RESERVATION.TIME_SLOT_BOOKED);

      const startDT = new Date(`${data.date}T${data.startTime}:00`);
      const endDT = new Date(`${data.date}T${data.endTime}:00`);
      await this.checkWholeVenueConflict(data.hallId, startDT, endDT);

      /* istanbul ignore next */
      if (reservationDate.getFullYear() > new Date().getFullYear()) {
        notes += '\n[Auto] Rezerwacja na kolejny rok \u2014 ceny mog\u0105 ulec zmianie (inflacja).';
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
        ? `Utworzono rezerwacj\u0119 z pakietem menu: ${menuPackage.name}${discountTypeVal ? ` | Rabat: -${discountAmountVal} PLN` : ''}${extrasTotal > 0 ? ` | Dodatki: +${extrasTotal} PLN` : ''}`
        : `Utworzono rezerwacj\u0119${discountTypeVal ? ` | Rabat: -${discountAmountVal} PLN` : ''}${extrasTotal > 0 ? ` | Dodatki: +${extrasTotal} PLN` : ''}`
    );

    // Audit log
    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'RESERVATION',
      entityId: reservation.id,
      details: {
        description: `Utworzono rezerwacj\u0119: ${client.firstName} ${client.lastName} | ${hall.name} | ${eventType.name}`,
        data: {
          hallId: data.hallId,
          clientId: data.clientId,
          eventTypeId: data.eventTypeId,
          guests,
          totalPrice: finalTotalPrice,
          extrasTotal: extrasTotal > 0 ? extrasTotal : undefined,
          extrasCount: data.serviceExtras?.length || 0,
          startDateTime: data.startDateTime,
          endDateTime: data.endDateTime
        }
      }
    });

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
    if (reservation.status === ReservationStatus.COMPLETED || reservation.status === ReservationStatus.CANCELLED) {
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
      await this.createHistoryEntry(reservationId, userId, 'MENU_REMOVED', 'menu', 'Pakiet menu', 'Brak', 'Menu usuni\u0119te z rezerwacji');

      // Audit log — MENU_REMOVED
      await logChange({
        userId,
        action: 'MENU_REMOVED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        details: {
          description: `Menu usuni\u0119te z rezerwacji: ${oldPackageName} (-${oldTotalPrice} PLN) | ${clientName}`,
          removedPackage: oldPackageName,
          removedPrice: oldTotalPrice,
        },
      });

      return { message: MENU.MENU_REMOVED };
    }

    if (data.menuPackageId) {
      const menuPackage = await prisma.menuPackage.findUnique({
        where: { id: data.menuPackageId },
        include: { menuTemplate: true, packageOptions: { include: { option: true } } }
      });

      if (!menuPackage) throw new Error(MENU.PACKAGE_NOT_FOUND);
      if (menuPackage.minGuests && guests < menuPackage.minGuests) {
        throw new Error(MENU.MIN_GUESTS(menuPackage.minGuests));
      }
      if (menuPackage.maxGuests && guests > menuPackage.maxGuests) {
        throw new Error(MENU.MAX_GUESTS(menuPackage.maxGuests));
      }

      let selectedOptions: any[] = [];
      let optionsPrice = 0;
      if (data.selectedOptions && data.selectedOptions.length > 0) {
        selectedOptions = await this.processSelectedOptions(data.selectedOptions, guests);
        optionsPrice = this.calculateOptionsPrice(selectedOptions, guests);
      }

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

      await prisma.reservation.update({
        where: { id: reservationId },
        data: { pricePerAdult, pricePerChild, pricePerToddler, totalPrice: totalMenuPrice, adults, children, toddlers, guests }
      });

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

      return { message: MENU.MENU_UPDATED, totalPrice: totalMenuPrice };
    }

    throw new Error(MENU.INVALID_MENU_DATA);
  }

  private async processSelectedOptions(
    selections: MenuOptionSelection[],
    totalGuests: number
  ): Promise<any[]> {
    const optionIds = selections.map(s => s.optionId);

    const options = await prisma.menuOption.findMany({
      where: { id: { in: optionIds } }
    });

    const optionMap = new Map(options.map(o => [o.id, o]));
    const processed = [];

    for (const selection of selections) {
      const option = optionMap.get(selection.optionId);

      if (!option) throw new Error(MENU.OPTION_NOT_FOUND(selection.optionId));
      if (!option.isActive) throw new Error(MENU.OPTION_INACTIVE(option.name));

      const quantity = selection.quantity ?? 1;
      if (option.allowMultiple) {
        if (option.maxQuantity && quantity > option.maxQuantity) {
          throw new Error(MENU.OPTION_MAX_QTY(option.maxQuantity, option.name));
        }
      } else if (quantity > 1) {
        throw new Error(MENU.OPTION_NO_MULTIPLE(option.name));
      }

      processed.push({
        optionId: option.id,
        name: option.name,
        description: option.description,
        category: option.category,
        priceType: option.priceType,
        priceAmount: Number(option.priceAmount),
        quantity
      });
    }

    return processed;
  }

  private calculateOptionsPrice(options: any[], totalGuests: number): number {
    let total = 0;
    for (const option of options) {
      const quantity = option.quantity ?? 1;
      if (option.priceType === 'PER_PERSON') {
        total += option.priceAmount * totalGuests * quantity;
      } else {
        total += option.priceAmount * quantity;
      }
    }
    return total;
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
    if (existingReservation.status === ReservationStatus.COMPLETED) throw new Error(RESERVATION.CANNOT_UPDATE_COMPLETED);
    if (existingReservation.status === ReservationStatus.CANCELLED) throw new Error(RESERVATION.CANNOT_UPDATE_CANCELLED);

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

    if (data.startDateTime) {
      const newStart = new Date(data.startDateTime);
      if (newStart < new Date()) throw new Error(RESERVATION.DATE_IN_FUTURE);
      updateData.startDateTime = newStart;
    }
    if (data.endDateTime) updateData.endDateTime = new Date(data.endDateTime);

    const finalStart = data.startDateTime ? new Date(data.startDateTime) : existingReservation.startDateTime;
    const finalEnd = data.endDateTime ? new Date(data.endDateTime) : existingReservation.endDateTime;
    
    if (finalStart && finalEnd && finalStart >= finalEnd) throw new Error(RESERVATION.END_AFTER_START);

    if ((data.startDateTime || data.endDateTime) && finalStart && finalEnd) {
      const hasOverlap = await this.checkDateTimeOverlap(existingReservation.hallId!, finalStart, finalEnd, id);
      if (hasOverlap) throw new Error(RESERVATION.TIME_SLOT_BOOKED);
      await this.checkWholeVenueConflict(existingReservation.hallId!, finalStart, finalEnd, id);
    }

    if (data.adults !== undefined) updateData.adults = data.adults;
    if (data.children !== undefined) updateData.children = data.children;
    if (data.toddlers !== undefined) updateData.toddlers = data.toddlers;

    const guestsChanged = data.adults !== undefined || data.children !== undefined || data.toddlers !== undefined;
    const newAdults = data.adults ?? existingReservation.adults;
    const newChildren = data.children ?? existingReservation.children;
    const newToddlers = data.toddlers ?? existingReservation.toddlers;

    if (guestsChanged) {
      updateData.guests = calculateTotalGuests(newAdults, newChildren, newToddlers);
      if (existingReservation.hall && updateData.guests > existingReservation.hall.capacity) {
        throw new Error(RESERVATION.GUESTS_EXCEED_CAPACITY(updateData.guests, existingReservation.hall.capacity));
      }
    }

    const hasMenuSnapshot = !!existingReservation.menuSnapshot;
    const isUsingMenuPackage = hasMenuSnapshot && data.menuPackageId !== null;
    
    if (isUsingMenuPackage && guestsChanged) {
      const recalcResult = await reservationMenuService.recalculateForGuestChange(
        id, newAdults, newChildren, newToddlers
      );

      /* istanbul ignore next */
      if (recalcResult) {
        updateData.totalPrice = recalcResult.totalMenuPrice;
        console.log(`[Reservation] Auto-recalculated menu for ${id}: ${recalcResult.totalMenuPrice} (was ${Number(existingReservation.totalPrice)})`);
      }
    } else if (!isUsingMenuPackage) {
      if (guestsChanged ||
          data.pricePerAdult !== undefined || data.pricePerChild !== undefined || data.pricePerToddler !== undefined) {
        const finalPricePerAdult = data.pricePerAdult ?? Number(existingReservation.pricePerAdult);
        const finalPricePerChild = data.pricePerChild ?? Number(existingReservation.pricePerChild);
        const finalPricePerToddler = data.pricePerToddler ?? Number(existingReservation.pricePerToddler);
        updateData.totalPrice = calculateTotalPrice(newAdults, newChildren, finalPricePerAdult, finalPricePerChild, newToddlers, finalPricePerToddler);
      }

      if (data.pricePerAdult !== undefined) updateData.pricePerAdult = data.pricePerAdult;
      if (data.pricePerChild !== undefined) updateData.pricePerChild = data.pricePerChild;
      if (data.pricePerToddler !== undefined) updateData.pricePerToddler = data.pricePerToddler;
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

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: RESERVATION_INCLUDE
    });

    if (detectedChanges.length > 0) {
      const changesSummary = formatChangesSummary(detectedChanges);
      await this.createHistoryEntry(id, userId, 'UPDATED', 'multiple', 'r\u00f3\u017cne', 'r\u00f3\u017cne', `${data.reason}\n\nZmiany:\n${changesSummary}`);
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
          description: `Zaktualizowano rezerwacj\u0119: ${(existingReservation.client as any)?.firstName ?? ''} ${(existingReservation.client as any)?.lastName ?? ''}`,
          changes,
          reason: data.reason
        }
      });
    }

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

    if (data.status === ReservationStatus.CANCELLED) {
      const reservation = await prisma.$transaction(async (tx) => {
        const updatedReservation = await tx.reservation.update({
          where: { id },
          data: { status: data.status },
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
            newValue: data.status,
            reason: data.reason
              ? `${data.reason}${cancelledDeposits > 0 ? ` | Auto-anulowano ${cancelledDeposits} zaliczek` : ''}`
              : `Zmiana statusu${cancelledDeposits > 0 ? ` | Auto-anulowano ${cancelledDeposits} zaliczek` : ''}`
          }
        });

        return updatedReservation;
      });

      // Audit log
      await logChange({
        userId,
        action: 'STATUS_CHANGE',
        entityType: 'RESERVATION',
        entityId: id,
        details: {
          description: `Anulowano rezerwacj\u0119: ${(existingReservation.client as any)?.firstName ?? ''} ${(existingReservation.client as any)?.lastName ?? ''} | ${existingReservation.hall?.name ?? 'Brak sali'}`,
          oldStatus: existingReservation.status,
          newStatus: data.status,
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

    // Audit log
    await logChange({
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'RESERVATION',
      entityId: id,
      details: {
        description: `Zmiana statusu rezerwacji: ${existingReservation.status} \u2192 ${data.status}`,
        oldStatus: existingReservation.status,
        newStatus: data.status,
        reason: data.reason
      }
    });

    return reservation as any;
  }

  async cancelReservation(id: string, userId: string, reason?: string): Promise<void> {
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({ where: { id }, include: { client: true, hall: true } });
    if (!existingReservation) throw new Error(RESERVATION.NOT_FOUND);
    if (existingReservation.status === ReservationStatus.CANCELLED) throw new Error(RESERVATION.ALREADY_CANCELLED);
    if (existingReservation.status === ReservationStatus.COMPLETED) throw new Error(RESERVATION.CANNOT_CANCEL_COMPLETED);

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELLED, archivedAt: new Date() }
      });

      const cancelledCount = await this.cascadeCancelDeposits(tx, id, userId, reason);

      await tx.reservationHistory.create({
        data: {
          reservationId: id,
          changedByUserId: userId,
          changeType: 'CANCELLED',
          fieldName: 'status',
          oldValue: existingReservation.status,
          newValue: ReservationStatus.CANCELLED,
          reason: reason
            ? `${reason}${cancelledCount > 0 ? ` | Auto-anulowano ${cancelledCount} zaliczek` : ''}`
            : `Rezerwacja anulowana${cancelledCount > 0 ? ` | Auto-anulowano ${cancelledCount} zaliczek` : ''}`
        }
      });
    });

    // Audit log
    await logChange({
      userId,
      action: 'CANCEL',
      entityType: 'RESERVATION',
      entityId: id,
      details: {
        description: `Anulowano rezerwacj\u0119: ${(existingReservation.client as any)?.firstName ?? ''} ${(existingReservation.client as any)?.lastName ?? ''} | ${existingReservation.hall?.name ?? 'Brak sali'}`,
        reason
      }
    });
  }

  /**
   * Archive reservation - set archivedAt timestamp
   */
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
      data: { archivedAt: new Date() }
    });

    await this.createHistoryEntry(
      id, userId, 'ARCHIVED', 'archivedAt',
      'null', new Date().toISOString(),
      reason || 'Rezerwacja zarchiwizowana'
    );

    // Audit log
    await logChange({
      userId,
      action: 'ARCHIVE',
      entityType: 'RESERVATION',
      entityId: id,
      details: {
        /* istanbul ignore next -- hall always included */
        description: `Zarchiwizowano rezerwacj\u0119: ${(reservation.client as any)?.firstName ?? ''} ${(reservation.client as any)?.lastName ?? ''} | ${reservation.hall?.name ?? 'Brak sali'}`,
        reason
      }
    });
  }

  /**
   * Unarchive reservation - remove archivedAt timestamp
   */
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
      data: { archivedAt: null }
    });

    await this.createHistoryEntry(
      id, userId, 'UNARCHIVED', 'archivedAt',
      reservation.archivedAt.toISOString(), 'null',
      reason || 'Rezerwacja przywr\u00f3cona z archiwum'
    );

    // Audit log
    await logChange({
      userId,
      action: 'UNARCHIVE',
      entityType: 'RESERVATION',
      entityId: id,
      details: {
        /* istanbul ignore next -- hall always included */
        description: `Przywr\u00f3cono rezerwacj\u0119 z archiwum: ${(reservation.client as any)?.firstName ?? ''} ${(reservation.client as any)?.lastName ?? ''} | ${reservation.hall?.name ?? 'Brak sali'}`,
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
          changeType: 'DEPOSIT_CANCELLED',
          fieldName: 'deposit',
          oldValue: deposit.status,
          newValue: 'CANCELLED',
          reason: `Zaliczka ${Number(deposit.amount).toLocaleString('pl-PL')} z\u0142 auto-anulowana z powodu anulowania rezerwacji${reason ? `: ${reason}` : ''}`
        }
      });
    }

    // Audit log — DEPOSIT_CANCELLED (outside transaction, fire-and-forget)
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
        },
        include: {
          hall: { select: { name: true } },
          client: { select: { firstName: true, lastName: true } }
        }
      });

      if (conflict) {
        /* istanbul ignore next -- client always included */
        const clientName = conflict.client
          ? `${conflict.client.firstName} ${conflict.client.lastName}`
          : 'nieznany klient';
        /* istanbul ignore next -- hall always included */
        const hallName = (conflict as any).hall?.name || 'inna sala';
        throw new Error(
          `Nie mo\u017cna zarezerwowa\u0107 ca\u0142ego obiektu \u2014 sala "${hallName}" ma ju\u017c rezerwacj\u0119 w tym terminie (${clientName}).`
        );
      }
    } else {
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
        /* istanbul ignore next -- client always included */
        const clientName = conflict.client
          ? `${conflict.client.firstName} ${conflict.client.lastName}`
          : 'nieznany klient';
        throw new Error(
          `Nie mo\u017cna zarezerwowa\u0107 tej sali \u2014 ca\u0142y obiekt jest ju\u017c zarezerwowany w tym terminie (${clientName}).`
        );
      }
    }
  }

  private async validateUserId(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(401, 'Sesja wygas\u0142a lub u\u017cytkownik nie istnieje \u2014 wyloguj si\u0119 i zaloguj ponownie');
    }
  }

  private async checkDateTimeOverlap(hallId: string, startDateTime: Date, endDateTime: Date, excludeId?: string): Promise<boolean> {
    const where: any = {
      hallId,
      startDateTime: { not: null },
      endDateTime: { not: null },
      status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      archivedAt: null
    };
    if (excludeId) where.id = { not: excludeId };

    const overlapping = await prisma.reservation.findFirst({
      where: { ...where, AND: [{ startDateTime: { lt: endDateTime } }, { endDateTime: { gt: startDateTime } }] }
    });
    return !!overlapping;
  }

  private async checkOverlap(hallId: string, date: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
    const where: any = {
      hallId,
      date,
      status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      archivedAt: null
    };
    if (excludeId) where.id = { not: excludeId };

    const overlapping = await prisma.reservation.findFirst({
      where: {
        ...where,
        OR: [
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
          { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
          { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] }
        ]
      }
    });
    return !!overlapping;
  }

  private validateStatusTransition(currentStatus: string, newStatus: ReservationStatus): void {
    const validTransitions: Record<string, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
      [ReservationStatus.CONFIRMED]: [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED],
      [ReservationStatus.COMPLETED]: [],
      [ReservationStatus.CANCELLED]: []
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
