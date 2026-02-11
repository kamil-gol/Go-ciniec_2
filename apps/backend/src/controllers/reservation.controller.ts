/**
 * Reservation Controller
 * Handle HTTP requests for reservation management with advanced features
 * UPDATED: Full support for toddlers (0-3 years) age group + PDF generation + MENU INTEGRATION
 */

import { Request, Response } from 'express';
import reservationService from '../services/reservation.service';
import { pdfService } from '../services/pdf.service';
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
   * 
   * NEW: Menu integration support
   * - Guest counts (adults, children, toddlers) are ALWAYS required
   * - menuPackageId is optional (if provided, prices come from package)
   * - If no menuPackageId, pricePerAdult and pricePerChild are required
   */
  async createReservation(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateReservationDTO = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      // Validate required fields
      if (!data.hallId || !data.clientId || !data.eventTypeId) {
        res.status(400).json({
          success: false,
          error: 'Hall, client, and event type are required'
        });
        return;
      }

      // Validate either new format (startDateTime/endDateTime) or legacy format (date/startTime/endTime)
      const hasNewFormat = data.startDateTime && data.endDateTime;
      const hasLegacyFormat = data.date && data.startTime && data.endTime;
      
      if (!hasNewFormat && !hasLegacyFormat) {
        res.status(400).json({
          success: false,
          error: 'Either startDateTime/endDateTime or date/startTime/endTime are required'
        });
        return;
      }

      // ═══════════════════════════════════════════════════════════════
      // NEW: Guest counts are ALWAYS REQUIRED
      // ═══════════════════════════════════════════════════════════════
      if (data.adults === undefined || data.children === undefined || data.toddlers === undefined) {
        res.status(400).json({
          success: false,
          error: 'Guest counts are required: adults, children, and toddlers (can be 0)'
        });
        return;
      }

      // At least one guest is required
      if (data.adults === 0 && data.children === 0 && data.toddlers === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one guest is required (adults, children, or toddlers)'
        });
        return;
      }

      // ═══════════════════════════════════════════════════════════════
      // NEW: Menu package OR manual prices
      // ═══════════════════════════════════════════════════════════════
      if (!data.menuPackageId) {
        // No package selected - manual prices are REQUIRED
        if (data.pricePerAdult === undefined || data.pricePerChild === undefined) {
          res.status(400).json({
            success: false,
            error: 'When no menu package is selected, pricePerAdult and pricePerChild are required'
          });
          return;
        }
      }

      // Cannot specify both menuPackageId and manual prices
      if (data.menuPackageId && (data.pricePerAdult !== undefined || data.pricePerChild !== undefined)) {
        res.status(400).json({
          success: false,
          error: 'Cannot specify both menuPackageId and manual prices. Choose one method.'
        });
        return;
      }

      const reservation = await reservationService.createReservation(data, userId);

      res.status(201).json({
        success: true,
        data: reservation,
        message: data.menuPackageId 
          ? 'Reservation created successfully with menu package' 
          : 'Reservation created successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create reservation'
      });
    }
  }

  /**
   * Get all reservations with optional filters
   * GET /api/reservations
   */
  async getReservations(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch reservations'
      });
    }
  }

  /**
   * Get reservation by ID
   * GET /api/reservations/:id
   */
  async getReservationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reservation = await reservationService.getReservationById(id);

      res.status(200).json({
        success: true,
        data: reservation
      });
    } catch (error: any) {
      const statusCode = error.message === 'Reservation not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch reservation'
      });
    }
  }

  /**
   * Download reservation as PDF
   * GET /api/reservations/:id/pdf
   */
  async downloadPDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get full reservation data with relations
      const reservation = await reservationService.getReservationById(id);

      if (!reservation) {
        res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
        return;
      }

      // Generate PDF
      const pdfBuffer = await pdfService.generateReservationPDF(reservation);

      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="rezerwacja_${id.substring(0, 8)}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error: any) {
      const statusCode = error.message === 'Reservation not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to generate PDF'
      });
    }
  }

  /**
   * Update reservation
   * PUT /api/reservations/:id
   * 
   * Note: Requires 'reason' field (min 10 characters) if making changes to important fields
   */
  async updateReservation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateReservationDTO = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      // Validation for important fields that require a reason
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
        res.status(400).json({
          success: false,
          error: 'Reason is required for important changes (minimum 10 characters)'
        });
        return;
      }

      const reservation = await reservationService.updateReservation(id, data, userId);

      res.status(200).json({
        success: true,
        data: reservation,
        message: 'Reservation updated successfully'
      });
    } catch (error: any) {
      const statusCode = error.message === 'Reservation not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update reservation'
      });
    }
  }

  /**
   * Update reservation status
   * PATCH /api/reservations/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateStatusDTO = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (!data.status) {
        res.status(400).json({
          success: false,
          error: 'Status is required'
        });
        return;
      }

      const reservation = await reservationService.updateStatus(id, data, userId);

      res.status(200).json({
        success: true,
        data: reservation,
        message: 'Reservation status updated successfully'
      });
    } catch (error: any) {
      const statusCode = error.message === 'Reservation not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update reservation status'
      });
    }
  }

  /**
   * Cancel reservation
   * DELETE /api/reservations/:id
   */
  async cancelReservation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      await reservationService.cancelReservation(id, userId, reason);

      res.status(200).json({
        success: true,
        message: 'Reservation cancelled successfully'
      });
    } catch (error: any) {
      const statusCode = error.message === 'Reservation not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to cancel reservation'
      });
    }
  }
}

export default new ReservationController();
