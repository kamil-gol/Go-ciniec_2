/**
 * Reservation Service
 * Business logic for reservation management with advanced features
 * UPDATED: Full support for toddlers (0-3 years) age group + DateTime overlap validation + MENU INTEGRATION
 */

import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();

/**
 * Sanitize string by removing null bytes
 */
function sanitizeString(value: any): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value).replace(/\x00/g, '').trim() || null;
}

export class ReservationService {
  /**
   * Create a new reservation
   * NEW: Integrated menu package selection with automatic pricing
   */
  async createReservation(data: CreateReservationDTO, userId: string): Promise<ReservationResponse> {
    // Validate required fields
    if (!data.hallId || !data.clientId || !data.eventTypeId) {
      throw new Error('Hall, client, and event type are required');
    }

    // Validate userId exists
    await this.validateUserId(userId);

    // Require either new startDateTime/endDateTime OR legacy date/startTime/endTime
    const hasNewFormat = data.startDateTime && data.endDateTime;
    const hasLegacyFormat = data.date && data.startTime && data.endTime;
    
    if (!hasNewFormat && !hasLegacyFormat) {
      throw new Error('Either startDateTime/endDateTime or date/startTime/endTime are required');
    }

    // Check if hall exists and get prices
    const hall = await prisma.hall.findUnique({
      where: { id: data.hallId }
    });

    if (!hall) {
      throw new Error('Hall not found');
    }

    if (!hall.isActive) {
      throw new Error('Hall is not active');
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId }
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check if event type exists
    const eventType = await prisma.eventType.findUnique({
      where: { id: data.eventTypeId }
    });

    if (!eventType) {
      throw new Error('Event type not found');
    }

    // Validate custom event fields
    const customValidation = validateCustomEventFields(eventType.name, data);
    if (!customValidation.valid) {
      throw new Error(customValidation.error);
    }

    // ═══════════════════════════════════════════════════════════════
    // NEW: Guest count validation - ALWAYS REQUIRED
    // ═══════════════════════════════════════════════════════════════
    let adults = data.adults ?? 0;
    let children = data.children ?? 0;
    let toddlers = data.toddlers ?? 0;

    // At least one person is required
    if (adults === 0 && children === 0 && toddlers === 0) {
      throw new Error('At least one person is required (adults, children, or toddlers)');
    }

    const guests = calculateTotalGuests(adults, children, toddlers);

    // Validate capacity
    if (guests > hall.capacity) {
      throw new Error(`Number of guests (${guests}) exceeds hall capacity (${hall.capacity})`);
    }

    // ═══════════════════════════════════════════════════════════════
    // NEW: MENU PACKAGE INTEGRATION
    // ═══════════════════════════════════════════════════════════════
    let pricePerAdult: number;
    let pricePerChild: number;
    let pricePerToddler: number;
    let menuPackage = null;
    let selectedOptions: any[] = [];
    let optionsPrice = 0;

    if (data.menuPackageId) {
      // ┌─────────────────────────────────────────────────────────────
      // PATH A: Menu package selected - fetch prices from package
      // └─────────────────────────────────────────────────────────────
      menuPackage = await prisma.menuPackage.findUnique({
        where: { id: data.menuPackageId },
        include: {
          menuTemplate: true,
          packageOptions: {
            include: {
              option: true
            }
          }
        }
      });

      if (!menuPackage) {
        throw new Error('Selected menu package not found');
      }

      // Validate min/max guests for package
      if (menuPackage.minGuests && guests < menuPackage.minGuests) {
        throw new Error(`This package requires at least ${menuPackage.minGuests} guests`);
      }
      if (menuPackage.maxGuests && guests > menuPackage.maxGuests) {
        throw new Error(`This package allows maximum ${menuPackage.maxGuests} guests`);
      }

      // Get prices from package
      pricePerAdult = Number(menuPackage.pricePerAdult);
      pricePerChild = Number(menuPackage.pricePerChild);
      pricePerToddler = Number(menuPackage.pricePerToddler);

      // Handle selected options (if any)
      if (data.selectedOptions && data.selectedOptions.length > 0) {
        selectedOptions = await this.processSelectedOptions(
          data.selectedOptions,
          guests
        );
        optionsPrice = this.calculateOptionsPrice(selectedOptions, guests);
      }

    } else {
      // ┌─────────────────────────────────────────────────────────────
      // PATH B: No package - manual prices REQUIRED
      // └─────────────────────────────────────────────────────────────
      if (data.pricePerAdult === undefined || data.pricePerChild === undefined) {
        throw new Error('Price per adult and per child are required when no menu package is selected');
      }

      pricePerAdult = data.pricePerAdult;
      pricePerChild = data.pricePerChild;
      pricePerToddler = data.pricePerToddler ?? 0;
    }

    // Calculate total price
    const packagePrice = calculateTotalPrice(adults, children, pricePerAdult, pricePerChild, toddlers, pricePerToddler);
    const totalPrice = packagePrice + optionsPrice;

    // Prepare notes with extra hours warning if using new format
    let notes = data.notes || '';
    if (hasNewFormat && data.startDateTime && data.endDateTime) {
      const startDT = new Date(data.startDateTime);
      const endDT = new Date(data.endDateTime);
      
      // Validate date is in the future
      const today = new Date();
      if (startDT < today) {
        throw new Error('Reservation date must be in the future');
      }

      // Validate time range
      if (startDT >= endDT) {
        throw new Error('End time must be after start time');
      }

      // Check for overlapping reservations using DateTime
      const hasOverlap = await this.checkDateTimeOverlap(
        data.hallId,
        startDT,
        endDT
      );

      if (hasOverlap) {
        throw new Error('This time slot is already booked for the selected hall. Please choose a different time.');
      }

      const extraHoursNote = generateExtraHoursNote(startDT, endDT);
      if (extraHoursNote) {
        notes += extraHoursNote;
      }
    }

    // Validate legacy format if used
    if (hasLegacyFormat && data.date && data.startTime && data.endTime) {
      const reservationDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (reservationDate < today) {
        throw new Error('Reservation date must be in the future');
      }

      if (data.startTime >= data.endTime) {
        throw new Error('End time must be after start time');
      }

      // Check for overlapping reservations (legacy)
      const hasOverlap = await this.checkOverlap(
        data.hallId,
        data.date,
        data.startTime,
        data.endTime
      );

      if (hasOverlap) {
        throw new Error('This time slot is already booked for the selected hall');
      }
    }

    // Validate confirmation deadline
    if (data.confirmationDeadline && data.startDateTime) {
      const deadline = new Date(data.confirmationDeadline);
      const eventStart = new Date(data.startDateTime);
      
      if (!validateConfirmationDeadline(deadline, eventStart)) {
        throw new Error('Confirmation deadline must be at least 1 day before the event');
      }
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        hallId: data.hallId,
        clientId: data.clientId,
        eventTypeId: data.eventTypeId,
        createdById: userId,
        
        // New fields - with toddlers support
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
        
        // Legacy fields (for backwards compatibility)
        date: data.date || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        
        guests,
        totalPrice,
        status: ReservationStatus.PENDING,
        notes: sanitizeString(notes),
        attachments: []
      },
      include: {
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true, pricePerChild: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } }
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // NEW: Create menu snapshot if package was selected
    // ═══════════════════════════════════════════════════════════════
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
            selectedOptions: selectedOptions
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

    // Create history entry
    await this.createHistoryEntry(
      reservation.id,
      userId,
      'CREATED',
      null,
      null,
      null,
      menuPackage ? `Reservation created with menu package: ${menuPackage.name}` : 'Reservation created'
    );

    return reservation as any;
  }

  /**
   * NEW: Update reservation menu
   * Allows changing menu package and options after reservation is created
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

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status === ReservationStatus.COMPLETED || reservation.status === ReservationStatus.CANCELLED) {
      throw new Error('Cannot update menu for completed or cancelled reservations');
    }

    // Use provided guest counts or fall back to reservation
    const adults = data.adultsCount ?? reservation.adults;
    const children = data.childrenCount ?? reservation.children;
    const toddlers = data.toddlersCount ?? reservation.toddlers;
    const guests = calculateTotalGuests(adults, children, toddlers);

    if (data.menuPackageId === null) {
      // Remove menu snapshot
      if (reservation.menuSnapshot) {
        await prisma.reservationMenuSnapshot.delete({
          where: { id: reservation.menuSnapshot.id }
        });
      }

      await this.createHistoryEntry(
        reservationId,
        userId,
        'MENU_REMOVED',
        'menu',
        'Menu package',
        'None',
        'Menu removed from reservation'
      );

      return { message: 'Menu removed successfully' };
    }

    if (data.menuPackageId) {
      // Fetch new package
      const menuPackage = await prisma.menuPackage.findUnique({
        where: { id: data.menuPackageId },
        include: {
          menuTemplate: true,
          packageOptions: {
            include: { option: true }
          }
        }
      });

      if (!menuPackage) {
        throw new Error('Menu package not found');
      }

      // Validate min/max guests
      if (menuPackage.minGuests && guests < menuPackage.minGuests) {
        throw new Error(`This package requires at least ${menuPackage.minGuests} guests`);
      }
      if (menuPackage.maxGuests && guests > menuPackage.maxGuests) {
        throw new Error(`This package allows maximum ${menuPackage.maxGuests} guests`);
      }

      // Process options
      let selectedOptions: any[] = [];
      let optionsPrice = 0;
      if (data.selectedOptions && data.selectedOptions.length > 0) {
        selectedOptions = await this.processSelectedOptions(
          data.selectedOptions,
          guests
        );
        optionsPrice = this.calculateOptionsPrice(selectedOptions, guests);
      }

      // Calculate prices
      const pricePerAdult = Number(menuPackage.pricePerAdult);
      const pricePerChild = Number(menuPackage.pricePerChild);
      const pricePerToddler = Number(menuPackage.pricePerToddler);
      const packagePrice = calculateTotalPrice(adults, children, pricePerAdult, pricePerChild, toddlers, pricePerToddler);
      const totalMenuPrice = packagePrice + optionsPrice;

      // Update or create snapshot
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
        await prisma.reservationMenuSnapshot.update({
          where: { id: reservation.menuSnapshot.id },
          data: snapshotData
        });
      } else {
        await prisma.reservationMenuSnapshot.create({
          data: snapshotData
        });
      }

      // Update reservation prices
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          pricePerAdult,
          pricePerChild,
          pricePerToddler,
          totalPrice: totalMenuPrice,
          adults,
          children,
          toddlers,
          guests
        }
      });

      await this.createHistoryEntry(
        reservationId,
        userId,
        'MENU_UPDATED',
        'menu',
        reservation.menuSnapshot ? 'Previous package' : 'None',
        menuPackage.name,
        `Menu updated to: ${menuPackage.name}`
      );

      return { message: 'Menu updated successfully', totalPrice: totalMenuPrice };
    }

    throw new Error('Invalid menu update data');
  }

  /**
   * NEW: Process selected options and validate them
   * UPDATED: Accept any active menu option, not just package-assigned options
   */
  private async processSelectedOptions(
    selections: MenuOptionSelection[],
    totalGuests: number
  ): Promise<any[]> {
    const processed = [];

    for (const selection of selections) {
      // Fetch option from database
      const option = await prisma.menuOption.findUnique({
        where: { id: selection.optionId }
      });

      if (!option) {
        throw new Error(`Option ${selection.optionId} not found`);
      }

      if (!option.isActive) {
        throw new Error(`Option ${option.name} is not active`);
      }

      // Validate quantity
      const quantity = selection.quantity ?? 1;
      if (option.allowMultiple) {
        if (option.maxQuantity && quantity > option.maxQuantity) {
          throw new Error(`Maximum ${option.maxQuantity} of ${option.name} allowed`);
        }
      } else if (quantity > 1) {
        throw new Error(`Option ${option.name} does not allow multiple selections`);
      }

      const price = Number(option.priceAmount);

      processed.push({
        optionId: option.id,
        name: option.name,
        description: option.description,
        category: option.category,
        priceType: option.priceType,
        priceAmount: price,
        quantity
      });
    }

    return processed;
  }

  /**
   * NEW: Calculate total price for selected options
   */
  private calculateOptionsPrice(options: any[], totalGuests: number): number {
    let total = 0;

    for (const option of options) {
      const price = option.priceAmount;
      const quantity = option.quantity ?? 1;

      if (option.priceType === 'PER_PERSON') {
        total += price * totalGuests * quantity;
      } else if (option.priceType === 'FLAT' || option.priceType === 'FREE') {
        total += price * quantity;
      }
    }

    return total;
  }

  /**
   * Get all reservations with filters
   */
  async getReservations(filters?: ReservationFilters): Promise<ReservationResponse[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.hallId) {
      where.hallId = filters.hallId;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.eventTypeId) {
      where.eventTypeId = filters.eventTypeId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.OR = [
        // Check new format
        {
          startDateTime: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) })
          }
        },
        // Check legacy format
        {
          date: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo })
          }
        }
      ];
    }

    if (filters?.archived !== undefined) {
      if (filters.archived) {
        where.archivedAt = { not: null };
      } else {
        where.archivedAt = null;
      }
    } else {
      // By default, exclude archived
      where.archivedAt = null;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true, pricePerChild: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } }
      },
      orderBy: [
        { startDateTime: 'asc' },
        { date: 'asc' },
        { startTime: 'asc' }
      ]
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
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true, pricePerChild: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        menuSnapshot: true,
        deposits: true
      }
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    return reservation as any;
  }

  /**
   * Update reservation
   * ⚡ UPDATED: Added menu package support
   */
  async updateReservation(id: string, data: UpdateReservationDTO, userId: string): Promise<ReservationResponse> {
    // Validate userId exists
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { hall: true, eventType: true, menuSnapshot: true }
    });

    if (!existingReservation) {
      throw new Error('Reservation not found');
    }

    // Cannot update completed or cancelled reservations
    if (existingReservation.status === ReservationStatus.COMPLETED) {
      throw new Error('Cannot update completed reservation');
    }

    if (existingReservation.status === ReservationStatus.CANCELLED) {
      throw new Error('Cannot update cancelled reservation');
    }

    // ⚡ NEW: Handle menu package updates
    if (data.menuPackageId !== undefined) {
      if (data.menuPackageId === null) {
        // Remove menu package
        await this.updateReservationMenu(
          id,
          { menuPackageId: null },
          userId
        );
      } else {
        // Update or add menu package
        await this.updateReservationMenu(
          id,
          {
            menuPackageId: data.menuPackageId,
            adultsCount: data.adults ?? existingReservation.adults,
            childrenCount: data.children ?? existingReservation.children,
            toddlersCount: data.toddlers ?? existingReservation.toddlers
          },
          userId
        );
      }
    }

    // Validate reason if there are changes
    const detectedChanges = detectReservationChanges(existingReservation, data);
    if (detectedChanges.length > 0) {
      if (!data.reason || data.reason.length < 10) {
        throw new Error('Reason is required for changes (minimum 10 characters)');
      }
    }

    // Validate custom event fields if event type is being referenced
    if (existingReservation.eventType) {
      const customValidation = validateCustomEventFields(existingReservation.eventType.name, data);
      if (!customValidation.valid) {
        throw new Error(customValidation.error);
      }
    }

    const updateData: any = {};

    // Update datetime fields
    if (data.startDateTime) {
      const newStart = new Date(data.startDateTime);
      const today = new Date();
      if (newStart < today) {
        throw new Error('Reservation date must be in the future');
      }
      updateData.startDateTime = newStart;
    }

    if (data.endDateTime) {
      updateData.endDateTime = new Date(data.endDateTime);
    }

    // Validate time range
    const finalStart = data.startDateTime ? new Date(data.startDateTime) : existingReservation.startDateTime;
    const finalEnd = data.endDateTime ? new Date(data.endDateTime) : existingReservation.endDateTime;
    
    if (finalStart && finalEnd && finalStart >= finalEnd) {
      throw new Error('End time must be after start time');
    }

    // Check for overlapping reservations when updating time
    if ((data.startDateTime || data.endDateTime) && finalStart && finalEnd) {
      const hasOverlap = await this.checkDateTimeOverlap(
        existingReservation.hallId,
        finalStart,
        finalEnd,
        id
      );

      if (hasOverlap) {
        throw new Error('This time slot is already booked for the selected hall. Please choose a different time.');
      }
    }

    // Update guest counts
    if (data.adults !== undefined) {
      updateData.adults = data.adults;
    }
    if (data.children !== undefined) {
      updateData.children = data.children;
    }
    if (data.toddlers !== undefined) {
      updateData.toddlers = data.toddlers;
    }

    // Recalculate guests if adults, children or toddlers changed
    if (data.adults !== undefined || data.children !== undefined || data.toddlers !== undefined) {
      const newAdults = data.adults ?? existingReservation.adults;
      const newChildren = data.children ?? existingReservation.children;
      const newToddlers = data.toddlers ?? existingReservation.toddlers;
      updateData.guests = calculateTotalGuests(newAdults, newChildren, newToddlers);

      // Validate capacity
      if (updateData.guests > existingReservation.hall.capacity) {
        throw new Error(`Number of guests (${updateData.guests}) exceeds hall capacity (${existingReservation.hall.capacity})`);
      }
    }

    // ⚡ UPDATED: Only update pricing if NOT using menu package OR menuPackageId is explicitly null
    const isUsingMenuPackage = existingReservation.menuSnapshot && data.menuPackageId !== null;
    
    if (!isUsingMenuPackage) {
      // Manual pricing update
      if (data.pricePerAdult !== undefined) {
        updateData.pricePerAdult = data.pricePerAdult;
      }
      if (data.pricePerChild !== undefined) {
        updateData.pricePerChild = data.pricePerChild;
      }
      if (data.pricePerToddler !== undefined) {
        updateData.pricePerToddler = data.pricePerToddler;
      }

      // Recalculate total price if any pricing or guest count changed
      if (data.adults !== undefined || data.children !== undefined || data.toddlers !== undefined ||
          data.pricePerAdult !== undefined || data.pricePerChild !== undefined || data.pricePerToddler !== undefined) {
        const finalAdults = data.adults ?? existingReservation.adults;
        const finalChildren = data.children ?? existingReservation.children;
        const finalToddlers = data.toddlers ?? existingReservation.toddlers;
        const finalPricePerAdult = data.pricePerAdult ?? Number(existingReservation.pricePerAdult);
        const finalPricePerChild = data.pricePerChild ?? Number(existingReservation.pricePerChild);
        const finalPricePerToddler = data.pricePerToddler ?? Number(existingReservation.pricePerToddler);
        
        updateData.totalPrice = calculateTotalPrice(
          finalAdults, 
          finalChildren, 
          finalPricePerAdult, 
          finalPricePerChild,
          finalToddlers,
          finalPricePerToddler
        );
      }
    }
    // Note: If using menu package, prices are updated by updateReservationMenu

    // Update confirmation deadline
    if (data.confirmationDeadline) {
      const deadline = new Date(data.confirmationDeadline);
      const eventStart = finalStart || (data.startDateTime ? new Date(data.startDateTime) : null);
      
      if (eventStart && !validateConfirmationDeadline(deadline, eventStart)) {
        throw new Error('Confirmation deadline must be at least 1 day before the event');
      }
      updateData.confirmationDeadline = deadline;
    }

    // Update custom event fields
    if (data.customEventType !== undefined) updateData.customEventType = sanitizeString(data.customEventType);
    if (data.birthdayAge !== undefined) updateData.birthdayAge = data.birthdayAge || null;
    if (data.anniversaryYear !== undefined) updateData.anniversaryYear = data.anniversaryYear || null;
    if (data.anniversaryOccasion !== undefined) updateData.anniversaryOccasion = sanitizeString(data.anniversaryOccasion);

    // Update legacy fields
    if (data.date !== undefined) updateData.date = data.date || null;
    if (data.startTime !== undefined) updateData.startTime = data.startTime || null;
    if (data.endTime !== undefined) updateData.endTime = data.endTime || null;

    // Update notes
    if (data.notes !== undefined) updateData.notes = sanitizeString(data.notes);

    // Add extra hours note if datetime changed
    if ((data.startDateTime || data.endDateTime) && finalStart && finalEnd) {
      const extraHoursNote = generateExtraHoursNote(finalStart, finalEnd);
      if (extraHoursNote) {
        updateData.notes = sanitizeString((updateData.notes || existingReservation.notes || '') + extraHoursNote);
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true, pricePerChild: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } }
      }
    });

    // Create history entries for changes
    if (detectedChanges.length > 0) {
      const changesSummary = formatChangesSummary(detectedChanges);
      await this.createHistoryEntry(
        id,
        userId,
        'UPDATED',
        'multiple',
        'various',
        'various',
        `${data.reason}\n\nChanges:\n${changesSummary}`
      );
    }

    return reservation as any;
  }

  /**
   * Update reservation status
   */
  async updateStatus(id: string, data: UpdateStatusDTO, userId: string): Promise<ReservationResponse> {
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!existingReservation) {
      throw new Error('Reservation not found');
    }

    // Validate status transition
    this.validateStatusTransition(existingReservation.status, data.status);

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: data.status },
      include: {
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true, pricePerChild: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } }
      }
    });

    await this.createHistoryEntry(
      id,
      userId,
      'STATUS_CHANGED',
      'status',
      existingReservation.status,
      data.status,
      data.reason || 'Status changed'
    );

    return reservation as any;
  }

  /**
   * Cancel reservation (soft delete)
   */
  async cancelReservation(id: string, userId: string, reason?: string): Promise<void> {
    await this.validateUserId(userId);

    const existingReservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!existingReservation) {
      throw new Error('Reservation not found');
    }

    if (existingReservation.status === ReservationStatus.CANCELLED) {
      throw new Error('Reservation is already cancelled');
    }

    if (existingReservation.status === ReservationStatus.COMPLETED) {
      throw new Error('Cannot cancel completed reservation');
    }

    await prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.CANCELLED,
        archivedAt: new Date()
      }
    });

    await this.createHistoryEntry(
      id,
      userId,
      'CANCELLED',
      'status',
      existingReservation.status,
      ReservationStatus.CANCELLED,
      reason || 'Reservation cancelled'
    );
  }

  /**
   * Validate userId exists in database
   */
  private async validateUserId(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }
  }

  /**
   * Check for overlapping reservations using startDateTime/endDateTime
   */
  private async checkDateTimeOverlap(
    hallId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeId?: string
  ): Promise<boolean> {
    const where: any = {
      hallId,
      startDateTime: { not: null },
      endDateTime: { not: null },
      status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      archivedAt: null
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const overlapping = await prisma.reservation.findFirst({
      where: {
        ...where,
        AND: [
          { startDateTime: { lt: endDateTime } },
          { endDateTime: { gt: startDateTime } }
        ]
      }
    });

    return !!overlapping;
  }

  /**
   * Check for overlapping reservations (legacy format)
   */
  private async checkOverlap(
    hallId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> {
    const where: any = {
      hallId,
      date: date,
      status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      archivedAt: null
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const overlapping = await prisma.reservation.findFirst({
      where: {
        ...where,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    return !!overlapping;
  }

  /**
   * Validate status transition
   */
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

  /**
   * Create history entry
   */
  private async createHistoryEntry(
    reservationId: string,
    userId: string,
    changeType: string,
    fieldName: string | null,
    oldValue: string | null,
    newValue: string | null,
    reason: string
  ): Promise<void> {
    await prisma.reservationHistory.create({
      data: {
        reservationId,
        changedByUserId: userId,
        changeType,
        fieldName,
        oldValue,
        newValue,
        reason
      }
    });
  }
}

export default new ReservationService();
