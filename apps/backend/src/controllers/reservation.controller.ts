/**
 * Reservation Controller
 * Handle HTTP requests for reservation management
 * MIGRATED: Uses AppError (no try/catch — errors forwarded by asyncHandler)
 */

import { Request, Response } from 'express';
import reservationService from '../services/reservation.service';
import { pdfService } from '../services/pdf.service';
import { AppError } from '../utils/AppError';
import {
  CreateReservationDTO,
  UpdateReservationDTO,
  UpdateStatusDTO,
  ReservationFilters,
  ReservationStatus
} from '../types/reservation.types';

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
   * Download reservation as PDF
   * GET /api/reservations/:id/pdf
   */
  async downloadPDF(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const reservation = await reservationService.getReservationById(id);

    if (!reservation) throw AppError.notFound('Reservation');

    const pdfBuffer = await pdfService.generateReservationPDF(reservation);

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
   */
  async cancelReservation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) throw AppError.unauthorized();

    await reservationService.cancelReservation(id, userId, reason);

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  }
}

export default new ReservationController();
