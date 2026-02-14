/**
 * Reservation Service
 * Business logic for reservation management with advanced features
 * UPDATED: Phase C — Auto-recalc menu prices when guests change
 * UPDATED: Removed hall pricing references (pricePerPerson/Child removed from Hall model)
 * UPDATED: Whole venue conflict checking — "Cały Obiekt" blocks all halls and vice versa
 */

import { prisma } from '@/lib/prisma';
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
  generateExtraHoursNote,
  validateConfirmationDeadline,
  validateCustomEventFields,
  detectReservationChanges,
  formatChangesSummary
} from '../utils/reservation.utils';
import reservationMenuService from './reservation-menu.service';

/**
 * Sanitize string by removing null bytes
 */
function sanitizeString(value: any): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value).replace(/\x00/g, '').trim() || null;
}

/** Default include for reservation queries */
const RESERVATION_INCLUDE = {
  hall: { select: { id: true, name: true, capacity: true, isWholeVenue: true } },
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  eventType: { select: { id: true, name: true } },
  createdBy: { select: { id: true, email: true } },
} as const;

export class ReservationService {
  /**
   * Create a new reservation
   */
  async createReservation(data: CreateReservationDTO, userId: string): Promise<ReservationResponse> {
    if (!data.hallId || !data.clientId || !data.eventTypeId) {
      throw new Error('Hall, client, and event type are required');
    }

    await this.validateUserId(userId);

    const hasNewFormat = data.startDateTime && data.endDateTime;
    const hasLegacyFormat = data.date && data.startTime && data.endTime;
    
    if (!hasNewFormat && !hasLegacyFormat) {
      throw new Error('Either startDateTime/endDateTime or date/startTime/endTime are required');
    }

    const hall = await prisma.hall.findUnique({ where: { id: data.hallId } });
    if (!hall) throw new Error('Hall not found');
    if (!hall.isActive) throw new Error('Hall is not active');

    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) throw new Error('Client not found');

    const eventType = await prisma.eventType.findUnique({ where: { id: data.eventTypeId } });
    if (!eventType) throw new Error('Event type not found');

    const customValidation = validateCustomEventFields(eventType.name, data);
    if (!customValidation.valid) throw new Error(customValidation.error);

    let adults = data.adults ?? 0;
    let children = data.children ?? 0;
    let toddlers = data.toddlers ?? 0;

    if (adults === 0 && children === 0 && toddlers === 0) {
      throw new Error('At least one person is required (adults, children, or toddlers)');
    }

    const guests = calculateTotalGuests(adults, children, toddlers);
    if (guests > hall.capacity) {
      throw new Error(`Number of guests (${guests}) exceeds hall capacity (${hall.capacity})`);
    }

    // Menu package integration
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

      if (!menuPackage) throw new Error('Selected menu package not found');
      if (menuPackage.minGuests && guests < menuPackage.minGuests) {
        throw new Error(`This package requires at least ${menuPackage.minGuests} guests`);
      }
      if (menuPackage.maxGuests && guests > menuPackage.maxGuests) {
        throw new Error(`This package allows maximum ${menuPackage.maxGuests} guests`);
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
        throw new Error('Price per adult and per child are required when no menu package is selected');
      }
      pricePerAdult = data.pricePerAdult;
      pricePerChild = data.pricePerChild;
      pricePerToddler = data.pricePerToddler ?? 0;
    }

    const packagePrice = calculateTotalPrice(adults, children, pricePerAdult, pricePerChild, toddlers, pricePerToddler);
    const totalPrice = packagePrice + optionsPrice;

    let notes = data.notes || '';
    if (hasNewFormat && data.startDateTime && data.endDateTime) {
      const startDT = new Date(data.startDateTime);
      const endDT = new Date(data.endDateTime);
      
      if (startDT < new Date()) throw new Error('Reservation date must be in the future');
      if (startDT >= endDT) throw new Error('End time must be after start time');

      // Check same-hall overlap
      const hasOverlap = await this.checkDateTimeOverlap(data.hallId, startDT, endDT);
      if (hasOverlap) throw new Error('This time slot is already booked for the selected hall. Please choose a different time.');

      // Check whole venue conflict
      await this.checkWholeVenueConflict(data.hallId, startDT, endDT);

      const extraHoursNote = generateExtraHoursNote(startDT, endDT);
      if (extraHoursNote) notes += extraHoursNote;
    }

    if (hasLegacyFormat && data.date && data.startTime && data.endTime) {
      const reservationDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (reservationDate < today) throw new Error('Reservation date must be in the future');
      if (data.startTime >= data.endTime) throw new Error('End time must be after start time');

      const hasOverlap = await this.checkOverlap(data.hallId, data.date, data.startTime, data.endTime);
      if (hasOverlap) throw new Error('This time slot is already booked for the selected hall');

      // Check whole venue conflict (legacy format)
      const startDT = new Date(`${data.date}T${data.startTime}:00`);
      const endDT = new Date(`${data.date}T${data.endTime}:00`);
      await this.checkWholeVenueConflict(data.hallId, startDT, endDT);
    }

    if (data.confirmationDeadline && data.startDateTime) {
      const deadline = new Date(data.confirmationDeadline);
      const eventStart = new Date(data.startDateTime);
      if (!validateConfirmationDeadline(deadline, eventStart)) {
        throw new Error('Confirmation deadline must be at least 1 day before the event');
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
        totalPrice,
        status: ReservationStatus.PENDING,
        notes: sanitizeString(notes),
        attachments: []
      },
      include: RESERVATION_INCLUDE
    });

    // Create menu snapshot if package was selected
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
          packagePrice,
          optionsPrice,
          totalMenuPrice: totalPrice,
          adultsCount: adults,
          childrenCount: children,
          toddlersCount: toddlers
        }
      });
    }

    // Create deposit if specified
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
          dueDate: new Date(depositData.dueDate),
          paid: depositData.paid || false,
          status: depositData.paid ? 'PAID' : 'PENDING',
          paymentMethod: sanitizeString(depositData.paymentMethod),
          paidAt: depositData.paidAt ? new Date(depositData.paidAt) : null,
        }
      });
    }

    await this.createHistoryEntry(
      reservation.id, userId, 'CREATED', null, null, null,
      menuPackage ? `Reservation created with menu package: ${menuPackage.name}` : 'Reservation created'
    );

    return reservation as any;
  }

  /**
   * Update reservation menu
   */
  async updateReservationMenu(
    reservationId: string,
    data: UpdateReservationMenuDTO,
    userId: string
  ): Promise<any> {
    await this.validateUserId(userId);

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { menuSnapshot: true }
    });

    if (!reservation) throw new Error('Reservation not found');
    if (reservation.status === ReservationStatus.COMPLETED || reservation.status === ReservationStatus.CANCELLED) {
      throw new Error('Cannot update menu for completed or cancelled reservations');
    }

    const adults = data.adultsCount ?? reservation.adults;
    const children = data.childrenCount ?? reservation.children;
    const toddlers = data.toddlersCount ?? reservation.toddlers;
    const guests = calculateTotalGuests(adults, children, toddlers);

    if (data.menuPackageId === null) {
      if (reservation.menuSnapshot) {
        await prisma.reservationMenuSnapshot.delete({ where: { id: reservation.menuSnapshot.id } });
      }
      await this.createHistoryEntry(reservationId, userId, 'MENU_REMOVED', 'menu', 'Menu package', 'None', 'Menu removed from reservation');
      return { message: 'Menu removed successfully' };
    }

    if (data.menuPackageId) {
      const menuPackage = await prisma.menuPackage.findUnique({
        where: { id: data.menuPackageId },
        include: { menuTemplate: true, packageOptions: { include: { option: true } } }
      });

      if (!menuPackage) throw new Error('Menu package not found');
      if (menuPackage.minGuests && guests < menuPackage.minGuests) {
        throw new Error(`This package requires at least ${menuPackage.minGuests} guests`);
      }
      if (menuPackage.maxGuests && guests > menuPackage.maxGuests) {
        throw new Error(`This package allows maximum ${menuPackage.maxGuests} guests`);
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
          selectedOptions
        },
        packagePrice,
        optionsPrice,
        totalMenuPrice,
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
        reservation.menuSnapshot ? 'Previous package' : 'None',
        menuPackage.name, `Menu updated to: ${menuPackage.name}`
      );

      return { message: 'Menu updated successfully', totalPrice: totalMenuPrice };
    }

    throw new Error('Invalid menu update data');
  }

  /**
   * Process selected options — BATCH query instead of N+1
   */
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

      if (!option) throw new Error(`Option ${selection.optionId} not found`);
      if (!option.isActive) throw new Error(`Option ${option.name} is not active`);

      const quantity = selection.quantity ?? 1;
      if (option.allowMultiple) {
        if (option.maxQuantity && quantity > option.maxQuantity) {
          throw new Error(`Maximum ${option.maxQuantity} of ${option.name} allowed`);
        }
      } else if (quantity > 1) {
        throw new Error(`Option ${option.name} does not allow multiple selections`);
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

  /**
   * Calculate total price for selected options
   */
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

  /**
   * Get all reservations with filters + PAGINATION
   */
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
      include: RESERVATION_INCLUDE,
      orderBy: [
        { startDateTime: 'asc' },
        { date: 'asc' },
        { startTime: 'asc' }
      ],
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return reservations as any[];
  }

  /**
   * Get reservation by ID
   */
  async getReservationById(id: string): Promise<ReservationResponse> {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        ...RESERVATION_INCLUDE,
        menuSnapshot: true,
        deposits: true
      }
    });

    if (!reservation) throw new Error('Reservation not found');
    return reservation as any;
  }

  /**
   * Update reservation
   * PHASE C: When guests change and menu exists, auto-recalculate menu prices
   */
  async updateReservation(id: string, data: UpdateReservationDTO, userId: string): Promise<ReservationResponse> {
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { hall: true, eventType: true, menuSnapshot: true }
    });

    if (!existingReservation) throw new Error('Reservation not found');
    if (existingReservation.status === ReservationStatus.COMPLETED) throw new Error('Cannot update completed reservation');
    if (existingReservation.status === ReservationStatus.CANCELLED) throw new Error('Cannot update cancelled reservation');

    // Handle menu package updates
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
        throw new Error('Reason is required for changes (minimum 10 characters)');
      }
    }

    if (existingReservation.eventType) {
      const customValidation = validateCustomEventFields(existingReservation.eventType.name, data);
      if (!customValidation.valid) throw new Error(customValidation.error);
    }

    const updateData: any = {};

    if (data.startDateTime) {
      const newStart = new Date(data.startDateTime);
      if (newStart < new Date()) throw new Error('Reservation date must be in the future');
      updateData.startDateTime = newStart;
    }
    if (data.endDateTime) updateData.endDateTime = new Date(data.endDateTime);

    const finalStart = data.startDateTime ? new Date(data.startDateTime) : existingReservation.startDateTime;
    const finalEnd = data.endDateTime ? new Date(data.endDateTime) : existingReservation.endDateTime;
    
    if (finalStart && finalEnd && finalStart >= finalEnd) throw new Error('End time must be after start time');

    if ((data.startDateTime || data.endDateTime) && finalStart && finalEnd) {
      const hasOverlap = await this.checkDateTimeOverlap(existingReservation.hallId!, finalStart, finalEnd, id);
      if (hasOverlap) throw new Error('This time slot is already booked for the selected hall. Please choose a different time.');

      // Check whole venue conflict on time change
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
        throw new Error(`Number of guests (${updateData.guests}) exceeds hall capacity (${existingReservation.hall.capacity})`);
      }
    }

    // PHASE C: Auto-recalculate menu prices when guests change
    const hasMenuSnapshot = !!existingReservation.menuSnapshot;
    const isUsingMenuPackage = hasMenuSnapshot && data.menuPackageId !== null;
    
    if (isUsingMenuPackage && guestsChanged) {
      const recalcResult = await reservationMenuService.recalculateForGuestChange(
        id, newAdults, newChildren, newToddlers
      );

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
        throw new Error('Confirmation deadline must be at least 1 day before the event');
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

    if ((data.startDateTime || data.endDateTime) && finalStart && finalEnd) {
      const extraHoursNote = generateExtraHoursNote(finalStart, finalEnd);
      if (extraHoursNote) {
        updateData.notes = sanitizeString((updateData.notes || existingReservation.notes || '') + extraHoursNote);
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: RESERVATION_INCLUDE
    });

    if (detectedChanges.length > 0) {
      const changesSummary = formatChangesSummary(detectedChanges);
      await this.createHistoryEntry(id, userId, 'UPDATED', 'multiple', 'various', 'various', `${data.reason}\n\nChanges:\n${changesSummary}`);
    }

    return reservation as any;
  }

  /**
   * Update reservation status
   * CASCADE: If new status is CANCELLED → auto-cancel pending deposits
   */
  async updateStatus(id: string, data: UpdateStatusDTO, userId: string): Promise<ReservationResponse> {
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({ where: { id } });
    if (!existingReservation) throw new Error('Reservation not found');

    this.validateStatusTransition(existingReservation.status, data.status);

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
              : `Status changed${cancelledDeposits > 0 ? ` | Auto-anulowano ${cancelledDeposits} zaliczek` : ''}`
          }
        });

        return updatedReservation;
      });

      return reservation as any;
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: data.status },
      include: RESERVATION_INCLUDE
    });

    await this.createHistoryEntry(id, userId, 'STATUS_CHANGED', 'status', existingReservation.status, data.status, data.reason || 'Status changed');
    return reservation as any;
  }

  /**
   * Cancel reservation (soft delete)
   * CASCADE: Auto-cancels all PENDING and OVERDUE deposits
   */
  async cancelReservation(id: string, userId: string, reason?: string): Promise<void> {
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({ where: { id } });
    if (!existingReservation) throw new Error('Reservation not found');
    if (existingReservation.status === ReservationStatus.CANCELLED) throw new Error('Reservation is already cancelled');
    if (existingReservation.status === ReservationStatus.COMPLETED) throw new Error('Cannot cancel completed reservation');

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
            : `Reservation cancelled${cancelledCount > 0 ? ` | Auto-anulowano ${cancelledCount} zaliczek` : ''}`
        }
      });
    });
  }

  /**
   * CASCADE: Cancel all PENDING and OVERDUE deposits for a reservation
   */
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

    for (const deposit of pendingDeposits) {
      await tx.reservationHistory.create({
        data: {
          reservationId,
          changedByUserId: userId,
          changeType: 'DEPOSIT_CASCADE_CANCELLED',
          fieldName: 'deposit',
          oldValue: deposit.status,
          newValue: 'CANCELLED',
          reason: `Zaliczka ${Number(deposit.amount).toLocaleString('pl-PL')} zł auto-anulowana z powodu anulowania rezerwacji${reason ? `: ${reason}` : ''}`
        }
      });
    }

    return pendingDeposits.length;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔒 WHOLE VENUE CONFLICT DETECTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Check for whole venue conflicts.
   *
   * Rules:
   * 1. If booking "Cały Obiekt" (isWholeVenue) → no other hall can have
   *    a reservation (PENDING/CONFIRMED) in the same time range.
   * 2. If booking a regular hall → "Cały Obiekt" cannot have a reservation
   *    in the same time range.
   *
   * @throws Error with descriptive Polish message on conflict
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
      // Booking whole venue → check if ANY other hall has a reservation
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
        const clientName = conflict.client
          ? `${conflict.client.firstName} ${conflict.client.lastName}`
          : 'nieznany klient';
        const hallName = (conflict as any).hall?.name || 'inna sala';
        throw new Error(
          `Nie można zarezerwować całego obiektu — sala "${hallName}" ma już rezerwację w tym terminie (${clientName}).`
        );
      }
    } else {
      // Booking regular hall → check if "Cały Obiekt" is reserved
      const wholeVenueHall = await prisma.hall.findFirst({ where: { isWholeVenue: true } });
      if (!wholeVenueHall) return; // no whole venue hall configured

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

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private async validateUserId(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
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
      throw new Error(`Cannot change status from ${currentStatus} to ${newStatus}`);
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
