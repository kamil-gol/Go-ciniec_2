/**
 * Reservation Controller
 * Handle HTTP requests for reservation management
 */

import { Request, Response } from 'express';
import reservationService from '../services/reservation.service';
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

      if (!data.date || !data.startTime || !data.endTime || !data.guests) {
        res.status(400).json({
          success: false,
          error: 'Date, start time, end time, and number of guests are required'
        });
        return;
      }

      const reservation = await reservationService.createReservation(data, userId);

      res.status(201).json({
        success: true,
        data: reservation,
        message: 'Reservation created successfully'
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
   * Update reservation
   * PUT /api/reservations/:id
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
