/**
 * Reservation Service
 * Business logic for reservation management with advanced features
 * UPDATED: Full support for toddlers (0-3 years) age group
 */
import { PrismaClient } from '@prisma/client';
import { ReservationStatus } from '../types/reservation.types';
import { calculateTotalGuests, calculateTotalPrice, generateExtraHoursNote, validateConfirmationDeadline, validateCustomEventFields, detectReservationChanges, formatChangesSummary } from '../utils/reservation.utils';
const prisma = new PrismaClient();
export class ReservationService {
    /**
     * Create a new reservation
     */
    async createReservation(data, userId) {
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
        // Determine guests: use adults+children+toddlers if provided, otherwise fall back to guests
        let adults = data.adults ?? 0;
        let children = data.children ?? 0;
        let toddlers = data.toddlers ?? 0;
        let guests = data.guests ?? 0;
        if (adults > 0 || children > 0 || toddlers > 0) {
            guests = calculateTotalGuests(adults, children, toddlers);
        }
        else if (guests > 0) {
            // Legacy mode: all guests are adults
            adults = guests;
            children = 0;
            toddlers = 0;
        }
        else {
            throw new Error('Number of guests must be at least 1');
        }
        // Validate capacity
        if (guests > hall.capacity) {
            throw new Error(`Number of guests (${guests}) exceeds hall capacity (${hall.capacity})`);
        }
        // Determine pricing
        const pricePerAdult = data.pricePerAdult ?? Number(hall.pricePerPerson);
        const pricePerChild = data.pricePerChild ?? (hall.pricePerChild ? Number(hall.pricePerChild) : pricePerAdult);
        const pricePerToddler = data.pricePerToddler ?? 0; // Default to 0 if not specified
        // Calculate total price
        const totalPrice = calculateTotalPrice(adults, children, pricePerAdult, pricePerChild, toddlers, pricePerToddler);
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
            const hasOverlap = await this.checkOverlap(data.hallId, data.date, data.startTime, data.endTime);
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
                toddlers, // NEW: Store toddlers separately
                pricePerAdult,
                pricePerChild,
                pricePerToddler, // NEW: Store toddler price separately
                confirmationDeadline: data.confirmationDeadline ? new Date(data.confirmationDeadline) : null,
                customEventType: data.customEventType || null,
                birthdayAge: data.birthdayAge || null,
                anniversaryYear: data.anniversaryYear || null,
                anniversaryOccasion: data.anniversaryOccasion || null,
                // Legacy fields (for backwards compatibility)
                date: data.date || null,
                startTime: data.startTime || null,
                endTime: data.endTime || null,
                guests,
                totalPrice,
                status: ReservationStatus.PENDING,
                notes: notes || null,
                attachments: []
            },
            include: {
                hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true, pricePerChild: true } },
                client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                eventType: { select: { id: true, name: true } },
                createdBy: { select: { id: true, email: true } }
            }
        });
        // Create deposit if specified
        const depositData = data.deposit || (data.depositAmount && data.depositDueDate ? {
            amount: data.depositAmount,
            dueDate: data.depositDueDate
        } : null);
        if (depositData) {
            await prisma.deposit.create({
                data: {
                    reservationId: reservation.id,
                    amount: depositData.amount,
                    dueDate: new Date(depositData.dueDate),
                    paid: depositData.paid || false,
                    status: depositData.paid ? 'PAID' : 'PENDING',
                    paymentMethod: depositData.paymentMethod || null,
                    paidAt: depositData.paidAt ? new Date(depositData.paidAt) : null,
                }
            });
        }
        // Create history entry
        await this.createHistoryEntry(reservation.id, userId, 'CREATED', null, null, null, 'Reservation created');
        return reservation;
    }
    /**
     * Get all reservations with filters
     */
    async getReservations(filters) {
        const where = {};
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
            }
            else {
                where.archivedAt = null;
            }
        }
        else {
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
        return reservations;
    }
    /**
     * Get reservation by ID
     */
    async getReservationById(id) {
        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                hall: { select: { id: true, name: true, capacity: true, pricePerPerson: true, pricePerChild: true } },
                client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                eventType: { select: { id: true, name: true } },
                createdBy: { select: { id: true, email: true } }
            }
        });
        if (!reservation) {
            throw new Error('Reservation not found');
        }
        return reservation;
    }
    /**
     * Update reservation
     */
    async updateReservation(id, data, userId) {
        // Validate userId exists
        await this.validateUserId(userId);
        const existingReservation = await prisma.reservation.findUnique({
            where: { id },
            include: { hall: true, eventType: true }
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
        const updateData = {};
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
        // Update guest counts
        if (data.adults !== undefined) {
            updateData.adults = data.adults;
        }
        if (data.children !== undefined) {
            updateData.children = data.children;
        }
        if (data.toddlers !== undefined) {
            updateData.toddlers = data.toddlers; // NEW: Support toddlers updates
        }
        // Recalculate guests if adults, children or toddlers changed
        if (data.adults !== undefined || data.children !== undefined || data.toddlers !== undefined) {
            const newAdults = data.adults ?? existingReservation.adults;
            const newChildren = data.children ?? existingReservation.children;
            const newToddlers = data.toddlers ?? existingReservation.toddlers; // NEW
            updateData.guests = calculateTotalGuests(newAdults, newChildren, newToddlers);
            // Validate capacity
            if (updateData.guests > existingReservation.hall.capacity) {
                throw new Error(`Number of guests (${updateData.guests}) exceeds hall capacity (${existingReservation.hall.capacity})`);
            }
        }
        // Update pricing
        if (data.pricePerAdult !== undefined) {
            updateData.pricePerAdult = data.pricePerAdult;
        }
        if (data.pricePerChild !== undefined) {
            updateData.pricePerChild = data.pricePerChild;
        }
        if (data.pricePerToddler !== undefined) {
            updateData.pricePerToddler = data.pricePerToddler; // NEW: Support toddler price updates
        }
        // Recalculate total price if any pricing or guest count changed
        if (data.adults !== undefined || data.children !== undefined || data.toddlers !== undefined ||
            data.pricePerAdult !== undefined || data.pricePerChild !== undefined || data.pricePerToddler !== undefined) {
            const finalAdults = data.adults ?? existingReservation.adults;
            const finalChildren = data.children ?? existingReservation.children;
            const finalToddlers = data.toddlers ?? existingReservation.toddlers; // NEW
            const finalPricePerAdult = data.pricePerAdult ?? Number(existingReservation.pricePerAdult);
            const finalPricePerChild = data.pricePerChild ?? Number(existingReservation.pricePerChild);
            const finalPricePerToddler = data.pricePerToddler ?? Number(existingReservation.pricePerToddler); // NEW
            updateData.totalPrice = calculateTotalPrice(finalAdults, finalChildren, finalPricePerAdult, finalPricePerChild, finalToddlers, // NEW
            finalPricePerToddler // NEW
            );
        }
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
        if (data.customEventType !== undefined)
            updateData.customEventType = data.customEventType || null;
        if (data.birthdayAge !== undefined)
            updateData.birthdayAge = data.birthdayAge || null;
        if (data.anniversaryYear !== undefined)
            updateData.anniversaryYear = data.anniversaryYear || null;
        if (data.anniversaryOccasion !== undefined)
            updateData.anniversaryOccasion = data.anniversaryOccasion || null;
        // Update legacy fields
        if (data.date !== undefined)
            updateData.date = data.date || null;
        if (data.startTime !== undefined)
            updateData.startTime = data.startTime || null;
        if (data.endTime !== undefined)
            updateData.endTime = data.endTime || null;
        // Update notes
        if (data.notes !== undefined)
            updateData.notes = data.notes || null;
        // Add extra hours note if datetime changed
        if ((data.startDateTime || data.endDateTime) && finalStart && finalEnd) {
            const extraHoursNote = generateExtraHoursNote(finalStart, finalEnd);
            if (extraHoursNote) {
                updateData.notes = (updateData.notes || existingReservation.notes || '') + extraHoursNote;
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
            await this.createHistoryEntry(id, userId, 'UPDATED', 'multiple', 'various', 'various', `${data.reason}\n\nChanges:\n${changesSummary}`);
        }
        return reservation;
    }
    /**
     * Update reservation status
     */
    async updateStatus(id, data, userId) {
        // Validate userId exists
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
        // Create history entry
        await this.createHistoryEntry(id, userId, 'STATUS_CHANGED', 'status', existingReservation.status, data.status, data.reason || 'Status changed');
        return reservation;
    }
    /**
     * Cancel reservation (soft delete)
     */
    async cancelReservation(id, userId, reason) {
        // Validate userId exists
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
        // Create history entry
        await this.createHistoryEntry(id, userId, 'CANCELLED', 'status', existingReservation.status, ReservationStatus.CANCELLED, reason || 'Reservation cancelled');
    }
    /**
     * Validate userId exists in database
     */
    async validateUserId(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
    }
    /**
     * Check for overlapping reservations (legacy format)
     */
    async checkOverlap(hallId, date, startTime, endTime, excludeId) {
        const where = {
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
    validateStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
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
    async createHistoryEntry(reservationId, userId, changeType, fieldName, oldValue, newValue, reason) {
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
//# sourceMappingURL=reservation.service.js.map