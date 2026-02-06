/**
 * EventType Service
 * Business logic for event type management
 */

import { PrismaClient } from '@prisma/client';
import { CreateEventTypeDTO, UpdateEventTypeDTO, EventTypeResponse } from '../types/eventType.types';

const prisma = new PrismaClient();

export class EventTypeService {
  /**
   * Create a new event type
   */
  async createEventType(data: CreateEventTypeDTO): Promise<EventTypeResponse> {
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Event type name is required');
    }

    // Check if event type with same name exists
    const existingType = await prisma.eventType.findFirst({
      where: { name: data.name.trim() }
    });

    if (existingType) {
      throw new Error('Event type with this name already exists');
    }

    const eventType = await prisma.eventType.create({
      data: {
        name: data.name.trim()
      }
    });

    return eventType as any;
  }

  /**
   * Get all event types
   */
  async getEventTypes(): Promise<EventTypeResponse[]> {
    const eventTypes = await prisma.eventType.findMany({
      orderBy: { name: 'asc' }
    });

    return eventTypes as any[];
  }

  /**
   * Get event type by ID
   */
  async getEventTypeById(id: string): Promise<EventTypeResponse> {
    const eventType = await prisma.eventType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reservations: true }
        }
      }
    });

    if (!eventType) {
      throw new Error('Event type not found');
    }

    return eventType as any;
  }

  /**
   * Update event type
   */
  async updateEventType(id: string, data: UpdateEventTypeDTO): Promise<EventTypeResponse> {
    // Check if event type exists
    const existingType = await prisma.eventType.findUnique({
      where: { id }
    });

    if (!existingType) {
      throw new Error('Event type not found');
    }

    // Validate name if provided
    if (data.name && data.name.trim().length === 0) {
      throw new Error('Event type name cannot be empty');
    }

    // Check name uniqueness if name is being changed
    if (data.name && data.name.trim() !== existingType.name) {
      const typeWithSameName = await prisma.eventType.findFirst({
        where: { 
          name: data.name.trim(),
          id: { not: id }
        }
      });

      if (typeWithSameName) {
        throw new Error('Event type with this name already exists');
      }
    }

    const eventType = await prisma.eventType.update({
      where: { id },
      data: {
        name: data.name?.trim()
      }
    });

    return eventType as any;
  }

  /**
   * Delete event type
   */
  async deleteEventType(id: string): Promise<void> {
    // Check if event type exists
    const existingType = await prisma.eventType.findUnique({
      where: { id }
    });

    if (!existingType) {
      throw new Error('Event type not found');
    }

    // Check if event type is used in reservations
    const reservationCount = await prisma.reservation.count({
      where: { eventTypeId: id }
    });

    if (reservationCount > 0) {
      throw new Error(`Cannot delete event type that is used in ${reservationCount} reservation(s)`);
    }

    // Hard delete
    await prisma.eventType.delete({
      where: { id }
    });
  }
}

export default new EventTypeService();
