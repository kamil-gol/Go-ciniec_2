/**
 * Hall Controller
 * Handle HTTP requests for hall management
 */

import { Request, Response } from 'express';
import hallService from '../services/hall.service';
import { CreateHallDTO, UpdateHallDTO, HallFilters } from '../types/hall.types';

export class HallController {
  /**
   * Create a new hall
   * POST /api/halls
   */
  async createHall(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateHallDTO = req.body;

      // Validate required fields
      if (!data.name || !data.capacity || data.pricePerPerson === undefined) {
        res.status(400).json({
          success: false,
          error: 'Name, capacity, and pricePerPerson are required'
        });
        return;
      }

      const hall = await hallService.createHall(data);

      res.status(201).json({
        success: true,
        data: hall,
        message: 'Hall created successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create hall'
      });
    }
  }

  /**
   * Get all halls with optional filters
   * GET /api/halls
   */
  async getHalls(req: Request, res: Response): Promise<void> {
    try {
      const filters: HallFilters = {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        minCapacity: req.query.minCapacity ? parseInt(req.query.minCapacity as string) : undefined,
        maxCapacity: req.query.maxCapacity ? parseInt(req.query.maxCapacity as string) : undefined,
        search: req.query.search as string
      };

      const halls = await hallService.getHalls(filters);

      res.status(200).json({
        success: true,
        data: halls,
        count: halls.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch halls'
      });
    }
  }

  /**
   * Get hall by ID
   * GET /api/halls/:id
   */
  async getHallById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const hall = await hallService.getHallById(id);

      res.status(200).json({
        success: true,
        data: hall
      });
    } catch (error: any) {
      const statusCode = error.message === 'Hall not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch hall'
      });
    }
  }

  /**
   * Update hall
   * PUT /api/halls/:id
   */
  async updateHall(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateHallDTO = req.body;

      const hall = await hallService.updateHall(id, data);

      res.status(200).json({
        success: true,
        data: hall,
        message: 'Hall updated successfully'
      });
    } catch (error: any) {
      const statusCode = error.message === 'Hall not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update hall'
      });
    }
  }

  /**
   * Delete hall (soft delete)
   * DELETE /api/halls/:id
   */
  async deleteHall(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await hallService.deleteHall(id);

      res.status(200).json({
        success: true,
        message: 'Hall deleted successfully'
      });
    } catch (error: any) {
      const statusCode = error.message === 'Hall not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete hall'
      });
    }
  }
}

export default new HallController();
