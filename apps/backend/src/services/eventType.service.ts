/**
 * EventType Service
 * Business logic for event type management
 */

import { prisma } from '@/lib/prisma';
import { CreateEventTypeDTO, UpdateEventTypeDTO, EventTypeResponse } from '../types/eventType.types';

export class EventTypeService {
  async createEventType(data: CreateEventTypeDTO): Promise<EventTypeResponse> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Event type name is required');
    }

    const existingType = await prisma.eventType.findFirst({
      where: { name: data.name.trim() }
    });

    if (existingType) {
      throw new Error('Event type with this name already exists');
    }

    const eventType = await prisma.eventType.create({
      data: { name: data.name.trim() }
    });

    return eventType as any;
  }

  async getEventTypes(): Promise<EventTypeResponse[]> {
    const eventTypes = await prisma.eventType.findMany({
      orderBy: { name: 'asc' }
    });
    return eventTypes as any[];
  }

  async getEventTypeById(id: string): Promise<EventTypeResponse> {
    const eventType = await prisma.eventType.findUnique({
      where: { id },
      include: { _count: { select: { reservations: true } } }
    });

    if (!eventType) throw new Error('Event type not found');
    return eventType as any;
  }

  async updateEventType(id: string, data: UpdateEventTypeDTO): Promise<EventTypeResponse> {
    const existingType = await prisma.eventType.findUnique({ where: { id } });
    if (!existingType) throw new Error('Event type not found');

    if (data.name && data.name.trim().length === 0) {
      throw new Error('Event type name cannot be empty');
    }

    if (data.name && data.name.trim() !== existingType.name) {
      const typeWithSameName = await prisma.eventType.findFirst({
        where: { name: data.name.trim(), id: { not: id } }
      });
      if (typeWithSameName) throw new Error('Event type with this name already exists');
    }

    const eventType = await prisma.eventType.update({
      where: { id },
      data: { name: data.name?.trim() }
    });

    return eventType as any;
  }

  async deleteEventType(id: string): Promise<void> {
    const existingType = await prisma.eventType.findUnique({ where: { id } });
    if (!existingType) throw new Error('Event type not found');

    const reservationCount = await prisma.reservation.count({
      where: { eventTypeId: id }
    });

    if (reservationCount > 0) {
      throw new Error(`Cannot delete event type that is used in ${reservationCount} reservation(s)`);
    }

    await prisma.eventType.delete({ where: { id } });
  }
}

export default new EventTypeService();
