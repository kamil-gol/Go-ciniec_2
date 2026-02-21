/**
 * Reservation Controller
 * Handle HTTP requests for reservation management
 * MIGRATED: Uses AppError (no try/catch — errors forwarded by asyncHandler)
 * Phase 4.3: Block cancellation of reservations with paid deposits
 */

import { Request, Response } from 'express';
import reservationService from '../services/reservation.service';
import depositService from '../services/deposit.service';
import { pdfService } from '../services/pdf.service';
import { AppError } from '../utils/AppError';
import { PrismaClient } from '@prisma/client';
import {
  CreateReservationDTO,
  UpdateReservationDTO,
  UpdateStatusDTO,
  ReservationFilters,
  ReservationStatus
} from '../types/reservation.types';

const prisma = new PrismaClient();

export class ReservationController {
  /**
   * Create a new reservation
   * POST /api/reservations
   */
  async createReservation(req: Request, res: Response): Promise<void> {
    const data: CreateReservationDTO = req.body;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized();

    if (!data.hallId || !data.clientId || !data.eventTypeId) {
      throw AppError.badRequest('Hall, client, and event type are required');
    }

    const hasNewFormat = data.startDateTime && data.endDateTime;
    const hasLegacyFormat = data.date && data.startTime && data.endTime;

    if (!hasNewFormat && !hasLegacyFormat) {
      throw AppError.badRequest('Either startDateTime/endDateTime or date/startTime/endTime are required');
    }

    if (data.adults === undefined || data.children === undefined || data.toddlers === undefined) {
      throw AppError.badRequest('Guest counts are required: adults, children, and toddlers (can be 0)');
    }

    if (data.adults === 0 && data.children === 0 && data.toddlers === 0) {
      throw AppError.badRequest('At least one guest is required (adults, children, or toddlers)');
    }

    if (!data.menuPackageId) {
      if (data.pricePerAdult === undefined || data.pricePerChild === undefined) {
        throw AppError.badRequest('When no menu package is selected, pricePerAdult and pricePerChild are required');
      }
    }

    if (data.menuPackageId && (data.pricePerAdult !== undefined || data.pricePerChild !== undefined)) {
      throw AppError.badRequest('Cannot specify both menuPackageId and manual prices. Choose one method.');
    }

    const reservation = await reservationService.createReservation(data, userId);

    res.status(201).json({
      success: true,
      data: reservation,
      message: data.menuPackageId
        ? 'Reservation created successfully with menu package'
        : 'Reservation created successfully'
    });
  }

  /**
   * Get all reservations with optional filters
   * GET /api/reservations
   */
  async getReservations(req: Request, res: Response): Promise<void> {
    const filters: ReservationFilters = {
      status: req.query.status as ReservationStatus,
      hallId: req.query.hallId as string,
      clientId: req.query.clientId as string,
      eventTypeId: req.query.eventTypeId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      archived: req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined
    };

    const reservations = await reservationService.getReservations(filters);

    res.status(200).json({
      success: true,
      data: reservations,
      count: reservations.length
    });
  }

  /**
   * Get reservation by ID
   * GET /api/reservations/:id
   */
  async getReservationById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const reservation = await reservationService.getReservationById(id);

    if (!reservation) throw AppError.notFound('Reservation');

    res.status(200).json({
      success: true,
      data: reservation
    });
  }

  /**
   * Check hall availability for a given time range
   * GET /api/reservations/check-availability?hallId=X&startDateTime=...&endDateTime=...
   */
  async checkAvailability(req: Request, res: Response): Promise<void> {
    const { hallId, startDateTime, endDateTime, excludeReservationId } = req.query;

    if (!hallId || !startDateTime || !endDateTime) {
      throw AppError.badRequest('hallId, startDateTime, and endDateTime are required');
    }

    const start = new Date(startDateTime as string);
    const end = new Date(endDateTime as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw AppError.badRequest('Invalid date format for startDateTime or endDateTime');
    }

    if (end <= start) {
      throw AppError.badRequest('endDateTime must be after startDateTime');
    }

    // Find overlapping reservations (not cancelled)
    const conflicts = await prisma.reservation.findMany({
      where: {
        hallId: hallId as string,
        status: {
          notIn: ['CANCELLED'],
        },
        ...(excludeReservationId ? { id: { not: excludeReservationId as string } } : {}),
        // Overlap condition: existing.start < new.end AND existing.end > new.start
        startDateTime: {
          lt: end,
        },
        endDateTime: {
          gt: start,
        },
      },
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        status: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        eventType: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    const formattedConflicts = conflicts.map((c) => ({
      id: c.id,
      clientName: c.client ? `${c.client.firstName} ${c.client.lastName}` : 'Nieznany',
      eventType: c.eventType?.name || 'Nieznany',
      startDateTime: c.startDateTime?.toISOString() || '',
      endDateTime: c.endDateTime?.toISOString() || '',
      status: c.status,
    }));

    res.status(200).json({
      success: true,
      data: {
        available: formattedConflicts.length === 0,
        conflicts: formattedConflicts,
      },
    });
  }

  /**
   * Download reservation as PDF
   * GET /api/reservations/:id/pdf
   *
   * Maps Prisma `extras` relation → `reservationExtras` expected by pdf.service.ts
   */
  async downloadPDF(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const reservation = await reservationService.getReservationById(id) as any;

    if (!reservation) throw AppError.notFound('Reservation');

    // ═══ Map extras → reservationExtras for PDF compatibility ═══
    // pdf.service.ts expects ReservationExtraForPDF[] on `reservationExtras`
    // but reservation.service.ts returns raw Prisma data on `extras`
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

    const pdfData = {
      ...reservation,
      reservationExtras,
    };

    const pdfBuffer = await pdfService.generateReservationPDF(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rezerwacja_${id.substring(0, 8)}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  }

  /**
   * Update reservation
   * PUT /api/reservations/:id
   */
  async updateReservation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateReservationDTO = req.body;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized();

    const hasImportantChanges =
      data.startDateTime !== undefined ||
      data.endDateTime !== undefined ||
      data.adults !== undefined ||
      data.children !== undefined ||
      data.toddlers !== undefined ||
      data.pricePerAdult !== undefined ||
      data.pricePerChild !== undefined ||
      data.pricePerToddler !== undefined;

    if (hasImportantChanges && (!data.reason || data.reason.length < 10)) {
      throw AppError.badRequest('Reason is required for important changes (minimum 10 characters)');
    }

    const reservation = await reservationService.updateReservation(id, data, userId);

    res.status(200).json({
      success: true,
      data: reservation,
      message: 'Reservation updated successfully'
    });
  }

  /**
   * Update reservation status
   * PATCH /api/reservations/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateStatusDTO = req.body;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized();

    if (!data.status) {
      throw AppError.badRequest('Status is required');
    }

    // ═══ Phase 4.3: Block cancellation if reservation has paid deposits ═══
    if (data.status === 'CANCELLED') {
      const depositCheck = await depositService.checkPaidDepositsBeforeCancel(id);
      if (depositCheck.hasPaidDeposits) {
        throw AppError.badRequest(
          `Nie można anulować rezerwacji z opłaconymi zaliczkami (${depositCheck.paidCount} zaliczek na łączną kwotę ${depositCheck.paidTotal.toFixed(2)} PLN). ` +
          `Najpierw cofnij płatności zaliczek.`
        );
      }
    }

    const reservation = await reservationService.updateStatus(id, data, userId);

    res.status(200).json({
      success: true,
      data: reservation,
      message: 'Reservation status updated successfully'
    });
  }

  /**
   * Cancel reservation
   * DELETE /api/reservations/:id
   * Phase 4.3: Blocks if reservation has paid deposits
   */
  async cancelReservation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized();

    // ═══ Phase 4.3: Block cancellation if reservation has paid deposits ═══
    const depositCheck = await depositService.checkPaidDepositsBeforeCancel(id);
    if (depositCheck.hasPaidDeposits) {
      throw AppError.badRequest(
        `Nie można anulować rezerwacji z opłaconymi zaliczkami (${depositCheck.paidCount} zaliczek na łączną kwotę ${depositCheck.paidTotal.toFixed(2)} PLN). ` +
        `Najpierw cofnij płatności zaliczek.`
      );
    }

    await reservationService.cancelReservation(id, userId, reason);

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  }

  /**
   * Archive reservation
   * POST /api/reservations/:id/archive
   */
  async archiveReservation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized();

    await reservationService.archiveReservation(id, userId, reason);

    res.status(200).json({
      success: true,
      message: 'Reservation archived successfully'
    });
  }

  /**
   * Unarchive reservation
   * POST /api/reservations/:id/unarchive
   */
  async unarchiveReservation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized();

    await reservationService.unarchiveReservation(id, userId, reason);

    res.status(200).json({
      success: true,
      message: 'Reservation restored from archive successfully'
    });
  }
}

export default new ReservationController();
