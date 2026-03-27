/**
 * HallService — Unit Tests
 */

jest.mock('../../../lib/prisma', () => {
  const mock = {
    hall: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return { prisma: mock, __esModule: true, default: mock };
});

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
  diffObjects: jest.fn().mockReturnValue({ capacity: { old: 100, new: 150 } }),
}));

import { HallService } from '../../../services/hall.service';
import { prisma } from '../../../lib/prisma';
import { logChange, diffObjects } from '../../../utils/audit-logger';

const mockPrisma = prisma as any;
const USER = 'user-001';

const HALL = { id: 'h-001', name: 'Sala Główna', capacity: 200, description: null, amenities: [], images: [], isActive: true, isWholeVenue: false };
const WHOLE_VENUE = { ...HALL, id: 'h-wv', name: 'Cały Obiekt', isWholeVenue: true };

let service: HallService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new HallService();
  mockPrisma.hall.findMany.mockResolvedValue([HALL]);
  mockPrisma.hall.findUnique.mockResolvedValue(HALL);
  mockPrisma.hall.findFirst.mockResolvedValue(null);
  mockPrisma.hall.create.mockResolvedValue(HALL);
  mockPrisma.hall.update.mockResolvedValue(HALL);
});

describe('HallService', () => {
  describe('getHalls()', () => {
    it('should return halls', async () => {
      expect(await service.getHalls()).toHaveLength(1);
    });

    it('should apply filters', async () => {
      await service.getHalls({ isActive: true, search: 'Gł' });
      const call = mockPrisma.hall.findMany.mock.calls[0][0];
      expect(call.where.isActive).toBe(true);
      expect(call.where.OR).toHaveLength(2);
    });
  });

  describe('getHallById()', () => {
    it('should return hall', async () => {
      expect((await service.getHallById('h-001')).id).toBe('h-001');
    });

    it('should throw when not found', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(null);
      await expect(service.getHallById('x')).rejects.toThrow('Nie znaleziono sali');
    });
  });

  describe('getWholeVenueHall()', () => {
    it('should return whole venue hall', async () => {
      mockPrisma.hall.findFirst.mockResolvedValue(WHOLE_VENUE);
      const result = await service.getWholeVenueHall();
      expect(result!.isWholeVenue).toBe(true);
    });
  });

  describe('createHall()', () => {
    it('should create hall and audit', async () => {
      await service.createHall({ name: 'Nowa', capacity: 100 } as any, USER);
      expect(mockPrisma.hall.create).toHaveBeenCalledTimes(1);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', entityType: 'HALL' }));
    });

    it('should throw when isWholeVenue already exists', async () => {
      mockPrisma.hall.findFirst.mockResolvedValue(WHOLE_VENUE);
      await expect(service.createHall({ name: 'X', capacity: 100, isWholeVenue: true } as any, USER))
        .rejects.toThrow(/Cały Obiekt.*już istnieje/);
    });
  });

  describe('updateHall()', () => {
    it('should update and audit', async () => {
      await service.updateHall('h-001', { capacity: 150 } as any, USER);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(null);
      await expect(service.updateHall('x', {} as any, USER)).rejects.toThrow('Nie znaleziono sali');
    });

    it('should protect wholeVenue from deactivation', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE);
      await expect(service.updateHall('h-wv', { isActive: false } as any, USER))
        .rejects.toThrow(/dezaktywować.*Cały Obiekt/);
    });

    it('should protect wholeVenue from rename', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE);
      await expect(service.updateHall('h-wv', { name: 'New Name' } as any, USER))
        .rejects.toThrow(/zmienić nazwy.*Cały Obiekt/);
    });

    it('should not audit when no changes', async () => {
      (diffObjects as jest.Mock).mockReturnValue({});
      await service.updateHall('h-001', { capacity: 200 } as any, USER);
      expect(logChange).not.toHaveBeenCalled();
    });
  });

  describe('toggleActive()', () => {
    it('should toggle and audit', async () => {
      await service.toggleActive('h-001', USER);
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'TOGGLE_ACTIVE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(null);
      await expect(service.toggleActive('x', USER)).rejects.toThrow('Nie znaleziono sali');
    });

    it('should protect wholeVenue', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE);
      await expect(service.toggleActive('h-wv', USER)).rejects.toThrow(/dezaktywować.*Cały Obiekt/);
    });
  });

  describe('deleteHall()', () => {
    it('should soft-delete (deactivate) and audit', async () => {
      await service.deleteHall('h-001', USER);
      expect(mockPrisma.hall.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: false } }));
      expect(logChange).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE' }));
    });

    it('should throw when not found', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(null);
      await expect(service.deleteHall('x', USER)).rejects.toThrow('Nie znaleziono sali');
    });

    it('should protect wholeVenue from deletion', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE);
      await expect(service.deleteHall('h-wv', USER)).rejects.toThrow(/usunąć.*Cały Obiekt/);
    });
  });

  describe('edge cases / branch coverage', () => {
    describe('getHalls() — filter combos', () => {
      it('no filters', async () => {
        mockPrisma.hall.findMany.mockResolvedValue([]);
        await service.getHalls();
        expect(mockPrisma.hall.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
      });

      it('isActive=false filter', async () => {
        mockPrisma.hall.findMany.mockResolvedValue([]);
        await service.getHalls({ isActive: false });
        const w = mockPrisma.hall.findMany.mock.calls[0][0].where;
        expect(w.isActive).toBe(false);
      });

      it('search filter alone', async () => {
        mockPrisma.hall.findMany.mockResolvedValue([]);
        await service.getHalls({ search: 'Sala' });
        const w = mockPrisma.hall.findMany.mock.calls[0][0].where;
        expect(w.OR).toHaveLength(2);
      });
    });

    describe('createHall() — defaults', () => {
      it('should skip isWholeVenue check when false', async () => {
        mockPrisma.hall.create.mockResolvedValue(HALL);
        await service.createHall({ name: 'Sala B', capacity: 50 } as any, USER);
        expect(mockPrisma.hall.findFirst).not.toHaveBeenCalled();
      });

      it('should default description to null', async () => {
        mockPrisma.hall.create.mockResolvedValue(HALL);
        await service.createHall({ name: 'X', capacity: 10 } as any, USER);
        expect(mockPrisma.hall.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ description: null }) })
        );
      });

      it('should default amenities to []', async () => {
        mockPrisma.hall.create.mockResolvedValue(HALL);
        await service.createHall({ name: 'X', capacity: 10 } as any, USER);
        expect(mockPrisma.hall.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ amenities: [] }) })
        );
      });

      it('should default images to []', async () => {
        mockPrisma.hall.create.mockResolvedValue(HALL);
        await service.createHall({ name: 'X', capacity: 10 } as any, USER);
        expect(mockPrisma.hall.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ images: [] }) })
        );
      });

      it('should default isActive to true when undefined', async () => {
        mockPrisma.hall.create.mockResolvedValue(HALL);
        await service.createHall({ name: 'X', capacity: 10 } as any, USER);
        expect(mockPrisma.hall.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ isActive: true }) })
        );
      });

      it('should use explicit isActive=false', async () => {
        mockPrisma.hall.create.mockResolvedValue({ ...HALL, isActive: false });
        await service.createHall({ name: 'X', capacity: 10, isActive: false } as any, USER);
        expect(mockPrisma.hall.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ isActive: false }) })
        );
      });

      it('should default isWholeVenue to false', async () => {
        mockPrisma.hall.create.mockResolvedValue(HALL);
        await service.createHall({ name: 'X', capacity: 10 } as any, USER);
        expect(mockPrisma.hall.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ isWholeVenue: false }) })
        );
      });

      it('should use provided description/amenities/images', async () => {
        mockPrisma.hall.create.mockResolvedValue(HALL);
        await service.createHall({
          name: 'X', capacity: 10,
          description: 'Desc', amenities: ['WiFi'], images: ['img.jpg'],
        } as any, USER);
        expect(mockPrisma.hall.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ description: 'Desc', amenities: ['WiFi'], images: ['img.jpg'] }),
          })
        );
      });

      it('should allow isWholeVenue when none exists', async () => {
        mockPrisma.hall.findFirst.mockResolvedValue(null);
        mockPrisma.hall.create.mockResolvedValue({ ...HALL, isWholeVenue: true });
        await service.createHall({ name: 'CO', capacity: 200, isWholeVenue: true } as any, USER);
        expect(mockPrisma.hall.create).toHaveBeenCalled();
      });
    });

    describe('updateHall() — conditional fields', () => {
      it('should allow same name for isWholeVenue', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue({ ...WHOLE_VENUE, name: 'Caly Obiekt' });
        mockPrisma.hall.update.mockResolvedValue(WHOLE_VENUE);
        (diffObjects as jest.Mock).mockReturnValue({});
        await service.updateHall('h-wv', { name: 'Caly Obiekt' } as any, USER);
      });

      it('should allow isActive=true for isWholeVenue', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE);
        mockPrisma.hall.update.mockResolvedValue(WHOLE_VENUE);
        (diffObjects as jest.Mock).mockReturnValue({});
        await service.updateHall('h-wv', { isActive: true } as any, USER);
      });

      it('should update only name', async () => {
        mockPrisma.hall.update.mockResolvedValue({ ...HALL, name: 'New' });
        (diffObjects as jest.Mock).mockReturnValue({ name: { old: 'Sala Glowna', new: 'New' } });
        await service.updateHall('h-001', { name: 'New' } as any, USER);
        expect(mockPrisma.hall.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { name: 'New' } })
        );
      });

      it('should update only capacity', async () => {
        mockPrisma.hall.update.mockResolvedValue(HALL);
        (diffObjects as jest.Mock).mockReturnValue({});
        await service.updateHall('h-001', { capacity: 200 } as any, USER);
        expect(mockPrisma.hall.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { capacity: 200 } })
        );
      });

      it('should update only description', async () => {
        mockPrisma.hall.update.mockResolvedValue(HALL);
        (diffObjects as jest.Mock).mockReturnValue({});
        await service.updateHall('h-001', { description: 'Nowy' } as any, USER);
        expect(mockPrisma.hall.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { description: 'Nowy' } })
        );
      });

      it('should update only amenities', async () => {
        mockPrisma.hall.update.mockResolvedValue(HALL);
        (diffObjects as jest.Mock).mockReturnValue({});
        await service.updateHall('h-001', { amenities: ['AC'] } as any, USER);
        expect(mockPrisma.hall.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { amenities: ['AC'] } })
        );
      });

      it('should update only images', async () => {
        mockPrisma.hall.update.mockResolvedValue(HALL);
        (diffObjects as jest.Mock).mockReturnValue({});
        await service.updateHall('h-001', { images: ['new.jpg'] } as any, USER);
        expect(mockPrisma.hall.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { images: ['new.jpg'] } })
        );
      });

      it('should update only isActive', async () => {
        mockPrisma.hall.update.mockResolvedValue({ ...HALL, isActive: false });
        (diffObjects as jest.Mock).mockReturnValue({ isActive: { old: true, new: false } });
        await service.updateHall('h-001', { isActive: false } as any, USER);
        expect(mockPrisma.hall.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { isActive: false } })
        );
      });

      it('should skip audit when no changes', async () => {
        mockPrisma.hall.update.mockResolvedValue(HALL);
        (diffObjects as jest.Mock).mockReturnValue({});
        await service.updateHall('h-001', { name: 'Sala Glowna' } as any, USER);
        expect(logChange).not.toHaveBeenCalled();
      });
    });

    describe('toggleActive() — ternary', () => {
      it('should deactivate (Dezaktywowano)', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue({ ...HALL, isActive: true });
        mockPrisma.hall.update.mockResolvedValue({ ...HALL, isActive: false });
        await service.toggleActive('h-001', USER);
        expect(logChange).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.objectContaining({ description: expect.stringContaining('Dezaktywowano') }),
          })
        );
      });

      it('should activate (Aktywowano)', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue({ ...HALL, isActive: false });
        mockPrisma.hall.update.mockResolvedValue({ ...HALL, isActive: true });
        await service.toggleActive('h-001', USER);
        expect(logChange).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.objectContaining({ description: expect.stringContaining('Aktywowano') }),
          })
        );
      });

      it('should throw when isWholeVenue', async () => {
        mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE);
        await expect(service.toggleActive('h-wv', USER)).rejects.toThrow('dezaktywować');
      });
    });

    describe('deleteHall() — isWholeVenue protection', () => {
      it('should soft-delete normally', async () => {
        mockPrisma.hall.update.mockResolvedValue({ ...HALL, isActive: false });
        await service.deleteHall('h-001', USER);
        expect(mockPrisma.hall.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { isActive: false } })
        );
      });
    });

    describe('getWholeVenueHall() — null', () => {
      it('should return null when not found', async () => {
        mockPrisma.hall.findFirst.mockResolvedValue(null);
        const result = await service.getWholeVenueHall();
        expect(result).toBeNull();
      });
    });
  });
});
