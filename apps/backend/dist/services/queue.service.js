/**
 * Queue Service
 * Business logic for reservation queue management
 */
import { PrismaClient, ReservationStatus } from '@prisma/client';
const prisma = new PrismaClient();
export class QueueService {
    /**
     * Add reservation to queue (create RESERVED status)
     */
    async addToQueue(data, createdById) {
        // Validate required fields
        if (!data.clientId || !data.reservationQueueDate || !data.guests) {
            throw new Error('Client, queue date, and guests are required');
        }
        // Validate guests
        if (data.guests < 1) {
            throw new Error('Number of guests must be at least 1');
        }
        // Parse queue date and normalize to start of day
        const queueDate = new Date(data.reservationQueueDate);
        if (isNaN(queueDate.getTime())) {
            throw new Error('Invalid queue date format');
        }
        queueDate.setHours(0, 0, 0, 0);
        // Check if date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (queueDate < today) {
            throw new Error('Queue date cannot be in the past');
        }
        // Verify client exists
        const client = await prisma.client.findUnique({
            where: { id: data.clientId },
        });
        if (!client) {
            throw new Error('Client not found');
        }
        // Get next position for this date (use separate date objects to avoid mutation)
        const startOfDay = new Date(queueDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queueDate);
        endOfDay.setHours(23, 59, 59, 999);
        const maxPosition = await prisma.reservation.aggregate({
            where: {
                status: ReservationStatus.RESERVED,
                reservationQueueDate: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
            },
            _max: {
                reservationQueuePosition: true,
            },
        });
        const nextPosition = (maxPosition._max.reservationQueuePosition || 0) + 1;
        // Create reservation with start of day timestamp
        const reservation = await prisma.reservation.create({
            data: {
                clientId: data.clientId,
                createdById,
                status: ReservationStatus.RESERVED,
                reservationQueueDate: queueDate,
                reservationQueuePosition: nextPosition,
                queueOrderManual: false,
                guests: data.guests,
                adults: data.adults || data.guests,
                children: data.children || 0,
                toddlers: data.toddlers || 0,
                totalPrice: 0,
                pricePerAdult: 0,
                pricePerChild: 0,
                pricePerToddler: 0,
                notes: data.notes || null,
            },
            include: {
                client: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return this.formatQueueItem(reservation);
    }
    /**
     * Update queue reservation
     */
    async updateQueueReservation(reservationId, data) {
        // Get existing reservation
        const existing = await prisma.reservation.findUnique({
            where: { id: reservationId },
        });
        if (!existing) {
            throw new Error('Reservation not found');
        }
        if (existing.status !== ReservationStatus.RESERVED) {
            throw new Error('Can only update RESERVED reservations');
        }
        // Build update data
        const updateData = {};
        if (data.clientId) {
            // Verify client exists
            const client = await prisma.client.findUnique({
                where: { id: data.clientId },
            });
            if (!client) {
                throw new Error('Client not found');
            }
            updateData.clientId = data.clientId;
        }
        if (data.reservationQueueDate) {
            const queueDate = new Date(data.reservationQueueDate);
            if (isNaN(queueDate.getTime())) {
                throw new Error('Invalid queue date format');
            }
            // Normalize to start of day
            queueDate.setHours(0, 0, 0, 0);
            // Check if date is not in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (queueDate < today) {
                throw new Error('Queue date cannot be in the past');
            }
            // Check if date actually changed
            const oldDate = existing.reservationQueueDate;
            const oldDateNormalized = oldDate ? new Date(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate()) : null;
            const newDateNormalized = new Date(queueDate.getFullYear(), queueDate.getMonth(), queueDate.getDate());
            const dateChanged = !oldDateNormalized || oldDateNormalized.getTime() !== newDateNormalized.getTime();
            if (dateChanged) {
                // Recalculate position for new date
                const startOfDay = new Date(queueDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(queueDate);
                endOfDay.setHours(23, 59, 59, 999);
                const maxPosition = await prisma.reservation.aggregate({
                    where: {
                        status: ReservationStatus.RESERVED,
                        reservationQueueDate: {
                            gte: startOfDay,
                            lt: endOfDay,
                        },
                        id: { not: reservationId }, // Exclude current reservation
                    },
                    _max: {
                        reservationQueuePosition: true,
                    },
                });
                const nextPosition = (maxPosition._max.reservationQueuePosition || 0) + 1;
                updateData.reservationQueuePosition = nextPosition;
                updateData.queueOrderManual = false; // Reset manual flag when changing date
            }
            updateData.reservationQueueDate = queueDate;
        }
        if (data.guests !== undefined) {
            if (data.guests < 1) {
                throw new Error('Number of guests must be at least 1');
            }
            updateData.guests = data.guests;
            updateData.adults = data.adults || data.guests;
            updateData.children = data.children || 0;
            updateData.toddlers = data.toddlers || 0;
        }
        if (data.notes !== undefined) {
            updateData.notes = data.notes || null;
        }
        // Update reservation
        const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: updateData,
            include: {
                client: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return this.formatQueueItem(updated);
    }
    /**
     * Get queue for specific date
     */
    async getQueueForDate(date) {
        const queueDate = new Date(date);
        if (isNaN(queueDate.getTime())) {
            throw new Error('Invalid date format');
        }
        const startOfDay = new Date(queueDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queueDate);
        endOfDay.setHours(23, 59, 59, 999);
        const reservations = await prisma.reservation.findMany({
            where: {
                status: ReservationStatus.RESERVED,
                reservationQueueDate: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                client: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: [
                { reservationQueuePosition: 'asc' },
            ],
        });
        return reservations.map((r) => this.formatQueueItem(r));
    }
    /**
     * Get all queues (grouped by date)
     */
    async getAllQueues() {
        const reservations = await prisma.reservation.findMany({
            where: {
                status: ReservationStatus.RESERVED,
            },
            include: {
                client: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: [
                { reservationQueueDate: 'asc' },
                { reservationQueuePosition: 'asc' },
            ],
        });
        return reservations.map((r) => this.formatQueueItem(r));
    }
    /**
     * Swap two reservations' positions
     */
    async swapPositions(id1, id2) {
        // Validate IDs
        if (!id1 || !id2) {
            throw new Error('Both reservation IDs are required');
        }
        if (id1 === id2) {
            throw new Error('Cannot swap reservation with itself');
        }
        // Get both reservations
        const [res1, res2] = await Promise.all([
            prisma.reservation.findUnique({ where: { id: id1 } }),
            prisma.reservation.findUnique({ where: { id: id2 } }),
        ]);
        if (!res1 || !res2) {
            throw new Error('One or both reservations not found');
        }
        // Verify both are RESERVED
        if (res1.status !== ReservationStatus.RESERVED || res2.status !== ReservationStatus.RESERVED) {
            throw new Error('Can only swap RESERVED reservations');
        }
        // Verify same date
        const date1 = res1.reservationQueueDate?.toDateString();
        const date2 = res2.reservationQueueDate?.toDateString();
        if (date1 !== date2) {
            throw new Error('Can only swap reservations on the same date');
        }
        // Call database function
        await prisma.$executeRaw `SELECT swap_queue_positions(${id1}::UUID, ${id2}::UUID)`;
    }
    /**
     * Move reservation to specific position
     */
    async moveToPosition(reservationId, newPosition) {
        // Validate
        if (!reservationId) {
            throw new Error('Reservation ID is required');
        }
        if (!newPosition || newPosition < 1) {
            throw new Error('Position must be at least 1');
        }
        // Get reservation
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
        });
        if (!reservation) {
            throw new Error('Reservation not found');
        }
        if (reservation.status !== ReservationStatus.RESERVED) {
            throw new Error('Can only move RESERVED reservations');
        }
        // Call database function
        await prisma.$executeRaw `SELECT move_to_queue_position(${reservationId}::UUID, ${newPosition}::INTEGER)`;
    }
    /**
     * Rebuild queue positions for all dates
     * Renumbers all RESERVED reservations per date based on createdAt
     */
    async rebuildPositions() {
        // Get all RESERVED reservations grouped by date
        const reservations = await prisma.reservation.findMany({
            where: {
                status: ReservationStatus.RESERVED,
            },
            select: {
                id: true,
                reservationQueueDate: true,
                createdAt: true,
            },
            orderBy: [
                { reservationQueueDate: 'asc' },
                { createdAt: 'asc' },
            ],
        });
        if (reservations.length === 0) {
            return { updatedCount: 0, dateCount: 0 };
        }
        // Group by date
        const byDate = new Map();
        reservations.forEach((r) => {
            if (r.reservationQueueDate) {
                const dateKey = r.reservationQueueDate.toISOString().split('T')[0];
                if (!byDate.has(dateKey)) {
                    byDate.set(dateKey, []);
                }
                byDate.get(dateKey).push({ id: r.id, createdAt: r.createdAt });
            }
        });
        // Update positions per date
        let updatedCount = 0;
        for (const [dateKey, items] of byDate.entries()) {
            // Sort by createdAt within each date
            items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            // Update each reservation with new position and normalize date to start of day
            const normalizedDate = new Date(dateKey + 'T00:00:00.000Z');
            for (let i = 0; i < items.length; i++) {
                await prisma.reservation.update({
                    where: { id: items[i].id },
                    data: {
                        reservationQueuePosition: i + 1,
                        queueOrderManual: false, // Reset manual flag
                        reservationQueueDate: normalizedDate, // Normalize to start of day
                    },
                });
                updatedCount++;
            }
        }
        return {
            updatedCount,
            dateCount: byDate.size,
        };
    }
    /**
     * Promote RESERVED reservation to PENDING/CONFIRMED
     */
    async promoteReservation(reservationId, data) {
        // Get reservation
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
        });
        if (!reservation) {
            throw new Error('Reservation not found');
        }
        if (reservation.status !== ReservationStatus.RESERVED) {
            throw new Error('Can only promote RESERVED reservations');
        }
        // Validate required fields
        if (!data.hallId || !data.eventTypeId || !data.startDateTime || !data.endDateTime) {
            throw new Error('Hall, event type, start time, and end time are required');
        }
        // Parse dates
        const startDateTime = new Date(data.startDateTime);
        const endDateTime = new Date(data.endDateTime);
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            throw new Error('Invalid date/time format');
        }
        if (endDateTime <= startDateTime) {
            throw new Error('End time must be after start time');
        }
        // Check hall availability
        const conflictingReservation = await prisma.reservation.findFirst({
            where: {
                id: { not: reservationId },
                hallId: data.hallId,
                status: {
                    in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
                },
                OR: [
                    {
                        AND: [
                            { startDateTime: { lte: startDateTime } },
                            { endDateTime: { gt: startDateTime } },
                        ],
                    },
                    {
                        AND: [
                            { startDateTime: { lt: endDateTime } },
                            { endDateTime: { gte: endDateTime } },
                        ],
                    },
                    {
                        AND: [
                            { startDateTime: { gte: startDateTime } },
                            { endDateTime: { lte: endDateTime } },
                        ],
                    },
                ],
            },
        });
        if (conflictingReservation) {
            throw new Error('Hall is already booked for this time slot');
        }
        // Calculate total price
        const totalPrice = data.adults * data.pricePerAdult +
            (data.children || 0) * (data.pricePerChild || 0) +
            (data.toddlers || 0) * (data.pricePerToddler || 0);
        // Update reservation (this will trigger auto-recalculation)
        const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: {
                status: data.status === 'CONFIRMED' ? ReservationStatus.CONFIRMED : ReservationStatus.PENDING,
                hallId: data.hallId,
                eventTypeId: data.eventTypeId,
                startDateTime,
                endDateTime,
                adults: data.adults,
                children: data.children || 0,
                toddlers: data.toddlers || 0,
                guests: data.adults + (data.children || 0) + (data.toddlers || 0),
                pricePerAdult: data.pricePerAdult,
                pricePerChild: data.pricePerChild || 0,
                pricePerToddler: data.pricePerToddler || 0,
                totalPrice,
                notes: data.notes || reservation.notes,
                customEventType: data.customEventType || null,
                birthdayAge: data.birthdayAge || null,
                anniversaryYear: data.anniversaryYear || null,
                anniversaryOccasion: data.anniversaryOccasion || null,
                // Clear queue fields
                reservationQueuePosition: null,
                reservationQueueDate: null,
            },
            include: {
                client: true,
                hall: true,
                eventType: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return updated;
    }
    /**
     * Get queue statistics
     */
    async getQueueStats() {
        const reservations = await prisma.reservation.findMany({
            where: {
                status: ReservationStatus.RESERVED,
            },
            select: {
                reservationQueueDate: true,
                guests: true,
                queueOrderManual: true,
            },
        });
        // Group by date
        const byDate = new Map();
        let manualCount = 0;
        let oldestDate = null;
        reservations.forEach((r) => {
            if (r.reservationQueueDate) {
                const dateKey = r.reservationQueueDate.toISOString().split('T')[0];
                const existing = byDate.get(dateKey) || { count: 0, totalGuests: 0 };
                byDate.set(dateKey, {
                    count: existing.count + 1,
                    totalGuests: existing.totalGuests + r.guests,
                });
                if (!oldestDate || r.reservationQueueDate < oldestDate) {
                    oldestDate = r.reservationQueueDate;
                }
            }
            if (r.queueOrderManual) {
                manualCount++;
            }
        });
        const queuesByDate = Array.from(byDate.entries()).map(([date, data]) => ({
            date,
            count: data.count,
            totalGuests: data.totalGuests,
        }));
        return {
            totalQueued: reservations.length,
            queuesByDate,
            oldestQueueDate: oldestDate,
            manualOrderCount: manualCount,
        };
    }
    /**
     * Auto-cancel expired RESERVED reservations
     */
    async autoCancelExpired() {
        const result = await prisma.$queryRaw ` 
      SELECT * FROM auto_cancel_expired_reserved()
    `;
        if (result && result.length > 0) {
            return {
                cancelledCount: result[0].cancelled_count,
                cancelledIds: result[0].cancelled_ids || [],
            };
        }
        return {
            cancelledCount: 0,
            cancelledIds: [],
        };
    }
    /**
     * Format queue item for response
     */
    formatQueueItem(reservation) {
        return {
            id: reservation.id,
            position: reservation.reservationQueuePosition || 0,
            queueDate: reservation.reservationQueueDate,
            guests: reservation.guests,
            client: {
                id: reservation.client.id,
                firstName: reservation.client.firstName,
                lastName: reservation.client.lastName,
                phone: reservation.client.phone,
                email: reservation.client.email,
            },
            isManualOrder: reservation.queueOrderManual,
            notes: reservation.notes,
            createdAt: reservation.createdAt,
            createdBy: {
                id: reservation.createdBy.id,
                firstName: reservation.createdBy.firstName,
                lastName: reservation.createdBy.lastName,
            },
        };
    }
}
export default new QueueService();
//# sourceMappingURL=queue.service.js.map