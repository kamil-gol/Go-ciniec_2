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
      await expect(service.getHallById('x')).rejects.toThrow('Hall not found');
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
      await expect(service.updateHall('x', {} as any, USER)).rejects.toThrow('Hall not found');
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
      await expect(service.toggleActive('x', USER)).rejects.toThrow('Hall not found');
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
      await expect(service.deleteHall('x', USER)).rejects.toThrow('Hall not found');
    });

    it('should protect wholeVenue from deletion', async () => {
      mockPrisma.hall.findUnique.mockResolvedValue(WHOLE_VENUE);
      await expect(service.deleteHall('h-wv', USER)).rejects.toThrow(/usunąć.*Cały Obiekt/);
    });
  });
});
