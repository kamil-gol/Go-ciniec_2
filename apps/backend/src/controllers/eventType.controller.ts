/**
 * EventType Controller
 * MIGRATED: AppError + no try/catch
 */

import { Request, Response } from 'express';
import eventTypeService from '../services/eventType.service';
import { AppError } from '../utils/AppError';
import { CreateEventTypeDTO, UpdateEventTypeDTO } from '../types/eventType.types';

export class EventTypeController {
  async createEventType(req: Request, res: Response): Promise<void> {
    const data: CreateEventTypeDTO = req.body;

    if (!data.name) {
      throw AppError.badRequest('Event type name is required');
    }

    const eventType = await eventTypeService.createEventType(data);

    res.status(201).json({
      success: true,
      data: eventType,
      message: 'Event type created successfully'
    });
  }

  async getEventTypes(_req: Request, res: Response): Promise<void> {
    const eventTypes = await eventTypeService.getEventTypes();

    res.status(200).json({
      success: true,
      data: eventTypes,
      count: eventTypes.length
    });
  }

  async getEventTypeById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const eventType = await eventTypeService.getEventTypeById(id);

    if (!eventType) throw AppError.notFound('Event type');

    res.status(200).json({
      success: true,
      data: eventType
    });
  }

  async updateEventType(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateEventTypeDTO = req.body;

    const eventType = await eventTypeService.updateEventType(id, data);

    res.status(200).json({
      success: true,
      data: eventType,
      message: 'Event type updated successfully'
    });
  }

  async deleteEventType(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await eventTypeService.deleteEventType(id);

    res.status(200).json({
      success: true,
      message: 'Event type deleted successfully'
    });
  }
}

export default new EventTypeController();
