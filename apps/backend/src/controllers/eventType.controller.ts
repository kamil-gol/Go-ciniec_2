/**
 * EventType Controller
 * Full CRUD + stats for event type management
 */

import { Request, Response } from 'express';
import eventTypeService from '../services/eventType.service';
import { AppError } from '../utils/AppError';
import { CreateEventTypeDTO, UpdateEventTypeDTO } from '../types/eventType.types';

export class EventTypeController {
  async createEventType(req: Request, res: Response): Promise<void> {
    const { name, description, color, isActive } = req.body;

    if (!name) {
      throw AppError.badRequest('Event type name is required');
    }

    const data: CreateEventTypeDTO = { name, description, color, isActive };
    const eventType = await eventTypeService.createEventType(data);

    res.status(201).json({
      success: true,
      data: eventType,
      message: 'Event type created successfully'
    });
  }

  async getEventTypes(req: Request, res: Response): Promise<void> {
    const activeOnly = req.query.isActive === 'true';
    const eventTypes = await eventTypeService.getEventTypes(activeOnly);

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
    const { name, description, color, isActive } = req.body;

    const data: UpdateEventTypeDTO = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (color !== undefined) data.color = color;
    if (isActive !== undefined) data.isActive = isActive;

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

  async getEventTypeStats(_req: Request, res: Response): Promise<void> {
    const stats = await eventTypeService.getEventTypeStats();

    res.status(200).json({
      success: true,
      data: stats,
      count: stats.length
    });
  }

  async getPredefinedColors(_req: Request, res: Response): Promise<void> {
    const colors = eventTypeService.getPredefinedColors();

    res.status(200).json({
      success: true,
      data: colors
    });
  }
}

export default new EventTypeController();
