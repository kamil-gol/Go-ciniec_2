/**
 * Hall Controller
 * MIGRATED: AppError + no try/catch
 */

import { Request, Response } from 'express';
import hallService from '../services/hall.service';
import { AppError } from '../utils/AppError';
import { CreateHallDTO, UpdateHallDTO, HallFilters } from '../types/hall.types';

export class HallController {
  async createHall(req: Request, res: Response): Promise<void> {
    const data: CreateHallDTO = req.body;

    if (!data.name || !data.capacity || data.pricePerPerson === undefined) {
      throw AppError.badRequest('Name, capacity, and pricePerPerson are required');
    }

    const hall = await hallService.createHall(data);

    res.status(201).json({
      success: true,
      data: hall,
      message: 'Hall created successfully'
    });
  }

  async getHalls(req: Request, res: Response): Promise<void> {
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
  }

  async getHallById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const hall = await hallService.getHallById(id);

    if (!hall) throw AppError.notFound('Hall');

    res.status(200).json({
      success: true,
      data: hall
    });
  }

  async updateHall(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateHallDTO = req.body;

    const hall = await hallService.updateHall(id, data);

    res.status(200).json({
      success: true,
      data: hall,
      message: 'Hall updated successfully'
    });
  }

  async deleteHall(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await hallService.deleteHall(id);

    res.status(200).json({
      success: true,
      message: 'Hall deleted successfully'
    });
  }
}

export default new HallController();
