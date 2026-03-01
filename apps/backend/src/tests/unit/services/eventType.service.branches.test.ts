/**
 * EventTypeService — Branch Coverage
 * createEventType: empty name, invalid color, existing name, description/color/isActive fallbacks
 * updateEventType: empty name, invalid color, color=null (valid), name conflict,
 *   conditional fields, description?.trim() || null, no changes audit skip
 * toggleActive: Aktywowano/Dezaktywowano
 * deleteEventType: has reservations, has templates
 * getEventTypes: activeOnly vs all
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    eventType: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reservation: { count: jest.fn() },
    menuTemplate: { count: jest.fn() },
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn(),
}));

import { EventTypeService } from '../../../services/eventType.service';
import { prisma } from '../../../lib/prisma';
import { diffObjects } from '../../../utils/audit-logger';

const db = prisma as any;
const mockDiff = diffObjects as jest.Mock;
const svc = new EventTypeService();

const makeET = (o: any = {}) => ({
  id: 'et-1', name: 'Wesele', description: 'Opis',
  color: '#FF0000', isActive: true,
  createdAt: new Date(), updatedAt: new Date(),
  ...o,
});

beforeEach(() => jest.resetAllMocks());

describe('EventTypeService — branches', () => {

  // ═══ createEventType ═══
  describe('createEventType()', () => {
    it('should throw when name is empty', async () => {
      await expect(svc.createEventType({ name: '' } as any, 'u-1')).rejects.toThrow(/wymagan/);
    });

    it('should throw when name is whitespace only', async () => {
      await expect(svc.createEventType({ name: '   ' } as any, 'u-1')).rejects.toThrow(/wymagan/);
    });

    it('should throw when color is invalid', async () => {
      db.eventType.findFirst.mockResolvedValue(null);
      await expect(svc.createEventType({ name: 'Test', color: 'bad' } as any, 'u-1'))
        .rejects.toThrow('hex');
    });

    it('should skip color check when no color', async () => {
      db.eventType.findFirst.mockResolvedValue(null);
      db.eventType.create.mockResolvedValue(makeET({ color: null }));
      await svc.createEventType({ name: 'New' } as any, 'u-1');
    });

    it('should throw when name already exists', async () => {
      db.eventType.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(svc.createEventType({ name: 'Wesele' } as any, 'u-1'))
        .rejects.toThrow('już istnieje');
    });

    it('should default description to null', async () => {
      db.eventType.findFirst.mockResolvedValue(null);
      db.eventType.create.mockResolvedValue(makeET());
      await svc.createEventType({ name: 'New' } as any, 'u-1');
      expect(db.eventType.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ description: null }) })
      );
    });

    it('should default color to null', async () => {
      db.eventType.findFirst.mockResolvedValue(null);
      db.eventType.create.mockResolvedValue(makeET());
      await svc.createEventType({ name: 'New' } as any, 'u-1');
      expect(db.eventType.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ color: null }) })
      );
    });

    it('should default isActive to true', async () => {
      db.eventType.findFirst.mockResolvedValue(null);
      db.eventType.create.mockResolvedValue(makeET());
      await svc.createEventType({ name: 'New' } as any, 'u-1');
      expect(db.eventType.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isActive: true }) })
      );
    });

    it('should use explicit isActive=false', async () => {
      db.eventType.findFirst.mockResolvedValue(null);
      db.eventType.create.mockResolvedValue(makeET({ isActive: false }));
      await svc.createEventType({ name: 'New', isActive: false } as any, 'u-1');
      expect(db.eventType.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isActive: false }) })
      );
    });

    it('should use provided description and color', async () => {
      db.eventType.findFirst.mockResolvedValue(null);
      db.eventType.create.mockResolvedValue(makeET());
      await svc.createEventType({ name: 'New', description: 'Desc', color: '#00FF00' } as any, 'u-1');
      expect(db.eventType.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ description: 'Desc', color: '#00FF00' }),
        })
      );
    });
  });

  // ═══ getEventTypes ═══
  describe('getEventTypes()', () => {
    it('should return all when activeOnly=false', async () => {
      db.eventType.findMany.mockResolvedValue([]);
      await svc.getEventTypes(false);
      expect(db.eventType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('should filter active when activeOnly=true', async () => {
      db.eventType.findMany.mockResolvedValue([]);
      await svc.getEventTypes(true);
      expect(db.eventType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } })
      );
    });

    it('should default to all (no param)', async () => {
      db.eventType.findMany.mockResolvedValue([]);
      await svc.getEventTypes();
      expect(db.eventType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });
  });

  // ═══ updateEventType ═══
  describe('updateEventType()', () => {
    it('should throw when not found', async () => {
      db.eventType.findUnique.mockResolvedValue(null);
      await expect(svc.updateEventType('bad', { name: 'X' }, 'u-1')).rejects.toThrow(/Nie znaleziono/i);
    });

    it('should throw when name is empty string', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      await expect(svc.updateEventType('et-1', { name: '' }, 'u-1')).rejects.toThrow('empty');
    });

    it('should throw when color is invalid', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      await expect(svc.updateEventType('et-1', { color: 'INVALID' }, 'u-1'))
        .rejects.toThrow('hex');
    });

    it('should allow color=null (remove color)', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.update.mockResolvedValue(makeET({ color: null }));
      mockDiff.mockReturnValue({ color: { old: '#FF0000', new: null } });
      await svc.updateEventType('et-1', { color: null as any }, 'u-1');
      expect(db.eventType.update).toHaveBeenCalled();
    });

    it('should check name conflict when name changes', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.findFirst.mockResolvedValue({ id: 'other' });
      await expect(svc.updateEventType('et-1', { name: 'Taken' }, 'u-1'))
        .rejects.toThrow('już istnieje');
    });

    it('should skip name check when same name', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.update.mockResolvedValue(makeET());
      mockDiff.mockReturnValue({});
      await svc.updateEventType('et-1', { name: 'Wesele' }, 'u-1');
      expect(db.eventType.findFirst).not.toHaveBeenCalled();
    });

    it('should skip name check when name not provided', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.update.mockResolvedValue(makeET());
      mockDiff.mockReturnValue({});
      await svc.updateEventType('et-1', { description: 'Nowy' }, 'u-1');
      expect(db.eventType.findFirst).not.toHaveBeenCalled();
    });

    it('should update only name field', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.findFirst.mockResolvedValue(null);
      db.eventType.update.mockResolvedValue(makeET({ name: 'Nowy' }));
      mockDiff.mockReturnValue({});
      await svc.updateEventType('et-1', { name: 'Nowy' }, 'u-1');
      const data = db.eventType.update.mock.calls[0][0].data;
      expect(data.name).toBe('Nowy');
      expect(data.description).toBeUndefined();
    });

    it('should update only description field', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.update.mockResolvedValue(makeET());
      mockDiff.mockReturnValue({});
      await svc.updateEventType('et-1', { description: 'D' }, 'u-1');
      const data = db.eventType.update.mock.calls[0][0].data;
      expect(data.description).toBe('D');
      expect(data.name).toBeUndefined();
    });

    it('should set description to null when empty', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.update.mockResolvedValue(makeET());
      mockDiff.mockReturnValue({});
      await svc.updateEventType('et-1', { description: '' }, 'u-1');
      const data = db.eventType.update.mock.calls[0][0].data;
      expect(data.description).toBeNull();
    });

    it('should update only color', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.update.mockResolvedValue(makeET());
      mockDiff.mockReturnValue({});
      await svc.updateEventType('et-1', { color: '#00FF00' }, 'u-1');
      const data = db.eventType.update.mock.calls[0][0].data;
      expect(data.color).toBe('#00FF00');
    });

    it('should update only isActive', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.update.mockResolvedValue(makeET({ isActive: false }));
      mockDiff.mockReturnValue({});
      await svc.updateEventType('et-1', { isActive: false }, 'u-1');
      const data = db.eventType.update.mock.calls[0][0].data;
      expect(data.isActive).toBe(false);
    });

    it('should audit when changes exist', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.findFirst.mockResolvedValue(null);
      db.eventType.update.mockResolvedValue(makeET({ name: 'Nowy' }));
      mockDiff.mockReturnValue({ name: { old: 'Wesele', new: 'Nowy' } });
      await svc.updateEventType('et-1', { name: 'Nowy' }, 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalled();
    });

    it('should skip audit when no changes', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.eventType.update.mockResolvedValue(makeET());
      mockDiff.mockReturnValue({});
      await svc.updateEventType('et-1', { name: 'Wesele' }, 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).not.toHaveBeenCalled();
    });
  });

  // ═══ toggleActive ═══
  describe('toggleActive()', () => {
    it('should throw when not found', async () => {
      db.eventType.findUnique.mockResolvedValue(null);
      await expect(svc.toggleActive('bad', 'u-1')).rejects.toThrow(/Nie znaleziono/i);
    });

    it('should deactivate (Dezaktywowano)', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET({ isActive: true }));
      db.eventType.update.mockResolvedValue(makeET({ isActive: false }));
      await svc.toggleActive('et-1', 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ description: expect.stringContaining('Dezaktywowano') }),
        })
      );
    });

    it('should activate (Aktywowano)', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET({ isActive: false }));
      db.eventType.update.mockResolvedValue(makeET({ isActive: true }));
      await svc.toggleActive('et-1', 'u-1');
      const { logChange } = require('../../../utils/audit-logger');
      expect(logChange).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ description: expect.stringContaining('Aktywowano') }),
        })
      );
    });
  });

  // ═══ deleteEventType ═══
  describe('deleteEventType()', () => {
    it('should throw when not found', async () => {
      db.eventType.findUnique.mockResolvedValue(null);
      await expect(svc.deleteEventType('bad', 'u-1')).rejects.toThrow(/Nie znaleziono/i);
    });

    it('should throw when has reservations', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.reservation.count.mockResolvedValue(5);
      await expect(svc.deleteEventType('et-1', 'u-1')).rejects.toThrow('5 reservation');
    });

    it('should throw when has menu templates', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.reservation.count.mockResolvedValue(0);
      db.menuTemplate.count.mockResolvedValue(3);
      await expect(svc.deleteEventType('et-1', 'u-1')).rejects.toThrow('3 menu template');
    });

    it('should delete successfully', async () => {
      db.eventType.findUnique.mockResolvedValue(makeET());
      db.reservation.count.mockResolvedValue(0);
      db.menuTemplate.count.mockResolvedValue(0);
      db.eventType.delete.mockResolvedValue(undefined);
      await svc.deleteEventType('et-1', 'u-1');
      expect(db.eventType.delete).toHaveBeenCalledWith({ where: { id: 'et-1' } });
    });
  });

  // ═══ getEventTypeById ═══
  describe('getEventTypeById()', () => {
    it('should throw when not found', async () => {
      db.eventType.findUnique.mockResolvedValue(null);
      await expect(svc.getEventTypeById('bad')).rejects.toThrow(/Nie znaleziono/i);
    });
  });

  // ═══ getPredefinedColors ═══
  describe('getPredefinedColors()', () => {
    it('should return array of colors', () => {
      const colors = svc.getPredefinedColors();
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0]).toMatch(/^#/);
    });
  });
});
