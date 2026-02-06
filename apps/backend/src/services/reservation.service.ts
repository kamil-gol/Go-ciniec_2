/**
 * Reservation Service
 * Business logic for reservation management
 */

import { PrismaClient } from '@prisma/client';
import {
  CreateReservationDTO,
  UpdateReservationDTO,
  UpdateStatusDTO,
  ReservationFilters,
  ReservationResponse,
  ReservationStatus
} from '../types/reservation.types';

const prisma = new PrismaClient();

export class ReservationService {
  /**
   * Create a new reservation
   */
  async createReservation(data: CreateReservationDTO, userId: string): Promise<ReservationResponse> {
    // Validate required fields
    if (!data.hallId || !data.clientId || !data.eventTypeId) {
      throw new Error('Hall, client, and event type are required');
    }

    if (!data.date || !data.startTime || !data.endTime) {
      throw new Error('Date, start time, and end time are required');
    }

    if (!data.guests || data.guests < 1) {
      throw new Error('Number of guests must be at least 1');
    }

    // Check if hall exists and get price
    const hall = await prisma.hall.findUnique({
      where: { id: data.hallId }
    });

    if (!hall) {
      throw new Error('Hall not found');
    }

    if (!hall.isActive) {
      throw new Error('Hall is not active');
    }

    // Validate capacity
    if (data.guests > hall.capacity) {
      throw new Error(`Number of guests (${data.guests}) exceeds hall capacity (${hall.capacity})`);
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

    // Validate date is in the future
    const reservationDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      throw new Error('Reservation date must be in the future');
    }

    // Validate time range
    if (data.startTime >= data.endTime) {
      throw new Error('End time must be after start time');
    }

    // Check for overlapping reservations
    const hasOverlap = await this.checkOverlap(
      data.hallId,
      data.date,
      data.startTime,
      data.endTime
    );

    if (hasOverlap) {
      throw new Error('This time slot is already booked for the selected hall');
    }

    // Calculate total price
    const totalPrice = Number(hall.pricePerPerson) * data.guests;

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        hallId: data.hallId,
        clientId: data.clientId,
        eventTypeId: data.eventTypeId,
        createdById: userId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        guests: data.guests,
        totalPrice: totalPrice,
        status: ReservationStatus.PENDING,
        notes: data.notes || null,
        attachments: []
      },
      include: {
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } }
      }
    });

    // Create history entry
    await this.createHistoryEntry(
      reservation.id,
      userId,
      'CREATED',
      null,
      null,
      null,
      'Reservation created'
    );

    return reservation as any;
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
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.date.lte = filters.dateTo;
      }
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
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
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
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } }
      }
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    return reservation as any;
  }

  /**
   * Update reservation
   */
  async updateReservation(id: string, data: UpdateReservationDTO, userId: string): Promise<ReservationResponse> {
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { hall: true }
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

    const updateData: any = {};
    let needsPriceRecalculation = false;

    // Update date if provided
    if (data.date) {
      const newDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (newDate < today) {
        throw new Error('Reservation date must be in the future');
      }

      updateData.date = data.date;
    }

    // Update times if provided
    if (data.startTime) {
      updateData.startTime = data.startTime;
    }

    if (data.endTime) {
      updateData.endTime = data.endTime;
    }

    // Validate time range if both are being updated or one is being updated
    const finalStartTime = data.startTime || existingReservation.startTime;
    const finalEndTime = data.endTime || existingReservation.endTime;

    if (finalStartTime >= finalEndTime) {
      throw new Error('End time must be after start time');
    }

    // Check for overlaps if date or times changed
    if (data.date || data.startTime || data.endTime) {
      const checkDate = data.date || existingReservation.date;
      const hasOverlap = await this.checkOverlap(
        existingReservation.hallId,
        checkDate,
        finalStartTime,
        finalEndTime,
        id // Exclude current reservation
      );

      if (hasOverlap) {
        throw new Error('This time slot is already booked for the selected hall');
      }
    }

    // Update guests if provided
    if (data.guests !== undefined) {
      if (data.guests < 1) {
        throw new Error('Number of guests must be at least 1');
      }

      if (data.guests > existingReservation.hall.capacity) {
        throw new Error(`Number of guests (${data.guests}) exceeds hall capacity (${existingReservation.hall.capacity})`);
      }

      updateData.guests = data.guests;
      needsPriceRecalculation = true;
    }

    // Recalculate price if guests changed
    if (needsPriceRecalculation) {
      const newGuests = data.guests || existingReservation.guests;
      updateData.totalPrice = Number(existingReservation.hall.pricePerPerson) * newGuests;
    }

    // Update other fields
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    // Track changes for history
    const changes: Array<{field: string, oldValue: any, newValue: any}> = [];
    
    if (data.guests !== undefined && data.guests !== existingReservation.guests) {
      changes.push({ field: 'guests', oldValue: existingReservation.guests.toString(), newValue: data.guests.toString() });
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } }
      }
    });

    // Create history entries for changes
    for (const change of changes) {
      await this.createHistoryEntry(
        id,
        userId,
        'UPDATED',
        change.field,
        change.oldValue,
        change.newValue,
        'Reservation updated'
      );
    }

    return reservation as any;
  }

  /**
   * Update reservation status
   */
  async updateStatus(id: string, data: UpdateStatusDTO, userId: string): Promise<ReservationResponse> {
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
        hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        eventType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } }
      }
    });

    // Create history entry
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

    // Create history entry
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
   * Check for overlapping reservations
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
