/**
 * EventType Service
 * Business logic for event type management
 * 🇵🇱 Spolonizowany — komunikaty z i18n/pl.ts
 */

import { prisma } from '@/lib/prisma';
import { CreateEventTypeDTO, UpdateEventTypeDTO, EventTypeResponse, EventTypeStatsResponse } from '../types/eventType.types';
import { logChange, diffObjects } from '../utils/audit-logger';
import { EVENT_TYPE } from '../i18n/pl';

// Predefined colors for event types
const PREDEFINED_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F43F5E', // rose
  '#14B8A6', // teal
];

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function isValidColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color);
}

export class EventTypeService {
  async createEventType(data: CreateEventTypeDTO, userId: string): Promise<EventTypeResponse> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error(EVENT_TYPE.NAME_REQUIRED);
    }

    if (data.color && !isValidColor(data.color)) {
      throw new Error(EVENT_TYPE.INVALID_COLOR);
    }

    const existingType = await prisma.eventType.findFirst({
      where: { name: data.name.trim() }
    });

    if (existingType) {
      throw new Error(EVENT_TYPE.NAME_EXISTS);
    }

    const eventType = await prisma.eventType.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        color: data.color || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    // Audit log
    await logChange({
      userId,
      action: 'CREATE',
      entityType: 'EVENT_TYPE',
      entityId: eventType.id,
      details: {
        description: `Utworzono typ wydarzenia: ${eventType.name}`,
        data: {
          name: eventType.name,
          color: eventType.color,
          isActive: eventType.isActive
        }
      }
    });

    return eventType as EventTypeResponse;
  }

  async getEventTypes(activeOnly: boolean = false): Promise<EventTypeResponse[]> {
    const where = activeOnly ? { isActive: true } : {};

    const eventTypes = await prisma.eventType.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return eventTypes as EventTypeResponse[];
  }

  async getEventTypeById(id: string): Promise<EventTypeResponse & { _count: { reservations: number; menuTemplates: number } }> {
    const eventType = await prisma.eventType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reservations: true,
            menuTemplates: true,
          }
        }
      }
    });

    if (!eventType) throw new Error(EVENT_TYPE.NOT_FOUND);
    return eventType as any;
  }

  async updateEventType(id: string, data: UpdateEventTypeDTO, userId: string): Promise<EventTypeResponse> {
    const existingType = await prisma.eventType.findUnique({ where: { id } });
    if (!existingType) throw new Error(EVENT_TYPE.NOT_FOUND);

    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error(EVENT_TYPE.NAME_EMPTY);
    }

    if (data.color !== undefined && data.color !== null && !isValidColor(data.color)) {
      throw new Error(EVENT_TYPE.INVALID_COLOR);
    }

    if (data.name && data.name.trim() !== existingType.name) {
      const typeWithSameName = await prisma.eventType.findFirst({
        where: { name: data.name.trim(), id: { not: id } }
      });
      if (typeWithSameName) throw new Error(EVENT_TYPE.NAME_EXISTS);
    }

    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const eventType = await prisma.eventType.update({
      where: { id },
      data: updateData
    });

    // Audit log
    const changes = diffObjects(existingType, eventType);
    if (Object.keys(changes).length > 0) {
      await logChange({
        userId,
        action: 'UPDATE',
        entityType: 'EVENT_TYPE',
        entityId: eventType.id,
        details: {
          description: `Zaktualizowano typ wydarzenia: ${eventType.name}`,
          changes
        }
      });
    }

    return eventType as EventTypeResponse;
  }

  async toggleActive(id: string, userId: string): Promise<EventTypeResponse> {
    const existingType = await prisma.eventType.findUnique({ where: { id } });
    if (!existingType) throw new Error(EVENT_TYPE.NOT_FOUND);

    const eventType = await prisma.eventType.update({
      where: { id },
      data: { isActive: !existingType.isActive }
    });

    // Audit log
    await logChange({
      userId,
      action: 'TOGGLE_ACTIVE',
      entityType: 'EVENT_TYPE',
      entityId: eventType.id,
      details: {
        description: `${eventType.isActive ? 'Aktywowano' : 'Dezaktywowano'} typ wydarzenia: ${eventType.name}`,
        oldValue: existingType.isActive,
        newValue: eventType.isActive
      }
    });

    return eventType as EventTypeResponse;
  }

  async deleteEventType(id: string, userId: string): Promise<void> {
    const existingType = await prisma.eventType.findUnique({ where: { id } });
    if (!existingType) throw new Error(EVENT_TYPE.NOT_FOUND);

    const reservationCount = await prisma.reservation.count({
      where: { eventTypeId: id }
    });

    if (reservationCount > 0) {
      throw new Error(EVENT_TYPE.CANNOT_DELETE_WITH_RESERVATIONS(reservationCount));
    }

    const menuTemplateCount = await prisma.menuTemplate.count({
      where: { eventTypeId: id }
    });

    if (menuTemplateCount > 0) {
      throw new Error(EVENT_TYPE.CANNOT_DELETE_WITH_TEMPLATES(menuTemplateCount));
    }

    await prisma.eventType.delete({ where: { id } });

    // Audit log
    await logChange({
      userId,
      action: 'DELETE',
      entityType: 'EVENT_TYPE',
      entityId: id,
      details: {
        description: `Usunięto typ wydarzenia: ${existingType.name}`,
        deletedData: {
          name: existingType.name,
          color: existingType.color
        }
      }
    });
  }

  async getEventTypeStats(): Promise<EventTypeStatsResponse[]> {
    const eventTypes = await prisma.eventType.findMany({
      include: {
        _count: {
          select: {
            reservations: true,
            menuTemplates: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return eventTypes.map(et => ({
      id: et.id,
      name: et.name,
      color: et.color,
      isActive: et.isActive,
      reservationCount: et._count.reservations,
      menuTemplateCount: et._count.menuTemplates,
    }));
  }

  getPredefinedColors(): string[] {
    return PREDEFINED_COLORS;
  }
}

export default new EventTypeService();
