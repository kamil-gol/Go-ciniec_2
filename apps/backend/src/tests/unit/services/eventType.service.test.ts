/**
 * EventTypeService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    eventType: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reservation: { count: jest.fn() },
    menuTemplate: { count: jest.fn() },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ name: { old: 'A', new: 'B' } }),
}));

import { EventTypeService } from '../../../services/eventType.service';
import { prisma } from '../../../lib/prisma';
import { logChange, diffObjects } from '../../../utils/audit-logger';

const mockPrisma = prisma as any;
const USER = 'user-001';

const ET = { id: 'et-001', name: 'Wesele', description: null, color: '#EF4444', isActive: true };

let service: EventTypeService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new EventTypeService();
  mockPrisma.eventType.findFirst.mockResolvedValue(null);
  mockPrisma.eventType.findMany.mockResolvedValue([ET]);
  mockPrisma.eventType.findUnique.mockResolvedValue(ET);
  mockPrisma.eventType.create.mockResolvedValue(ET);
  mockPrisma.eventType.update.mockResolvedValue(ET);
  mockPrisma.eventType.delete.mockResolvedValue(ET);
  mockPrisma.reservation.count.mockResolvedValue(0);
  mockPrisma.menuTemplate.count.mockResolvedValue(0);
});

describe('EventTypeService', () => {
  describe('createEventType()', () => {
    it('should create and audit', async () => {
      await service.createEventType({ name: 'Wesele' } as any, USER);
      expect(mockPrisma.eventType.create).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'EVENT_TYPE' }));
    });

    it('should throw when name is empty', async () => {
      await expect(service.createEventType({ name: '  ' } as any, USER)).rejects.toThrow('Event type name is required');
    });

    it('should throw on invalid color', async () => {
      await expect(service.createEventType({ name: 'Test', color: 'red' } as any, USER)).rejects.toThrow('Invalid color format');
    });

    it('should throw on duplicate name', async () => {
      mockPrisma.eventType.findFirst.mockResolvedValue(ET);
      await expect(service.createEventType({ name: 'Wesele' } as any, USER)).rejects.toThrow('already exists');
    });
  });

  describe('getEventTypes()', () => {
    it('should return all types', async () => {
      expect(await service.getEventTypes()).toHaveLength(1);
    });

    it('should filter active only', async () => {
      await service.getEventTypes(true);
      expect(mockPrisma.eventType.findMany.mock.calls[0][0].where.isActive).toBe(true);
    });
  });

  describe('getEventTypeById()', () => {
    it('should return type with counts', async () => {
      expect((await service.getEventTypeById('et-001')).id).toBe('et-001');
    });

    it('should throw when not found', async () => {
      mockPrisma.eventType.findUnique.mockResolvedValue(null);
      await expect(service.getEventTypeById('x')).rejects.toThrow('Event type not found');
    });
  });

  describe('updateEventType()', () => {
    it('should update and audit', async () => {
      await service.updateEventType('et-001', { name: 'Chrzciny' } as any, USER);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.eventType.findUnique.mockResolvedValue(null);
      await expect(service.updateEventType('x', {} as any, USER)).rejects.toThrow('Event type not found');
    });

    it('should throw on empty name', async () => {
      await expect(service.updateEventType('et-001', { name: '' } as any, USER)).rejects.toThrow('name cannot be empty');
    });

    it('should throw on invalid color', async () => {
      await expect(service.updateEventType('et-001', { color: 'xyz' } as any, USER)).rejects.toThrow('Invalid color format');
    });

    it('should throw on duplicate name', async () => {
      mockPrisma.eventType.findFirst.mockResolvedValue({ id: 'et-other', name: 'Chrzciny' });
      await expect(service.updateEventType('et-001', { name: 'Chrzciny' } as any, USER)).rejects.toThrow('already exists');
    });

    it('should not audit when no changes', async () => {
      (diffObjects as jest.Mock).mockReturnValue({});
      await service.updateEventType('et-001', { name: 'Wesele' } as any, USER);
      expect(logChange).not.toHaveBeenCalled();
    });
  });

  describe('toggleActive()', () => {
    it('should toggle and audit', async () => {
      await service.toggleActive('et-001', USER);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'TOGGLE_ACTIVE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.eventType.findUnique.mockResolvedValue(null);
      await expect(service.toggleActive('x', USER)).rejects.toThrow('Event type not found');
    });
  });

  describe('deleteEventType()', () => {
    it('should delete and audit', async () => {
      await service.deleteEventType('et-001', USER);
      expect(mockPrisma.eventType.delete).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE' }));
    });

    it('should throw when has reservations', async () => {
      mockPrisma.reservation.count.mockResolvedValue(5);
      await expect(service.deleteEventType('et-001', USER)).rejects.toThrow(/5 reservation/);
    });

    it('should throw when has menu templates', async () => {
      mockPrisma.menuTemplate.count.mockResolvedValue(2);
      await expect(service.deleteEventType('et-001', USER)).rejects.toThrow(/2 menu template/);
    });

    it('should throw when not found', async () => {
      mockPrisma.eventType.findUnique.mockResolvedValue(null);
      await expect(service.deleteEventType('x', USER)).rejects.toThrow('Event type not found');
    });
  });

  describe('getEventTypeStats()', () => {
    it('should return mapped stats', async () => {
      mockPrisma.eventType.findMany.mockResolvedValue([{ ...ET, _count: { reservations: 10, menuTemplates: 2 } }]);
      const result = await service.getEventTypeStats();
      expect(result[0].reservationCount).toBe(10);
      expect(result[0].menuTemplateCount).toBe(2);
    });
  });

  describe('getPredefinedColors()', () => {
    it('should return array of hex colors', () => {
      const colors = service.getPredefinedColors();
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
