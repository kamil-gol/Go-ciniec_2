/**
 * SearchService — Unit Tests
 * Tests search logic with mocked Prisma.
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservation: { findMany: jest.fn() },
    client: { findMany: jest.fn() },
    hall: { findMany: jest.fn() },
  },
}));

import { SearchService } from '../../../services/search.service';
import { prisma } from '../../../lib/prisma';

const service = new SearchService();
const db = prisma as any;

beforeEach(() => jest.clearAllMocks());

describe('SearchService', () => {
  describe('globalSearch()', () => {
    it('should return empty results for query shorter than 2 chars', async () => {
      const result = await service.globalSearch('a');

      expect(result).toEqual({ reservations: [], clients: [], halls: [] });
      expect(db.reservation.findMany).not.toHaveBeenCalled();
    });

    it('should return empty results for whitespace-only query', async () => {
      const result = await service.globalSearch('   ');

      expect(result).toEqual({ reservations: [], clients: [], halls: [] });
    });

    it('should search all entities in parallel', async () => {
      db.reservation.findMany.mockResolvedValue([{ id: 'r1' }]);
      db.client.findMany.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
      db.hall.findMany.mockResolvedValue([]);

      const result = await service.globalSearch('Kowalski');

      expect(result.reservations).toHaveLength(1);
      expect(result.clients).toHaveLength(2);
      expect(result.halls).toHaveLength(0);
    });

    it('should pass limit to all queries', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      db.client.findMany.mockResolvedValue([]);
      db.hall.findMany.mockResolvedValue([]);

      await service.globalSearch('test', 10);

      expect(db.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
      expect(db.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
      expect(db.hall.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });

    it('should exclude CANCELLED and ARCHIVED reservations', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      db.client.findMany.mockResolvedValue([]);
      db.hall.findMany.mockResolvedValue([]);

      await service.globalSearch('test');

      expect(db.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { notIn: ['CANCELLED', 'ARCHIVED'] },
          }),
        })
      );
    });

    it('should filter clients by isDeleted=false', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      db.client.findMany.mockResolvedValue([]);
      db.hall.findMany.mockResolvedValue([]);

      await service.globalSearch('test');

      expect(db.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isDeleted: false }),
        })
      );
    });

    it('should filter halls by isActive=true', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      db.client.findMany.mockResolvedValue([]);
      db.hall.findMany.mockResolvedValue([]);

      await service.globalSearch('test');

      expect(db.hall.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('should use default limit of 5', async () => {
      db.reservation.findMany.mockResolvedValue([]);
      db.client.findMany.mockResolvedValue([]);
      db.hall.findMany.mockResolvedValue([]);

      await service.globalSearch('test');

      expect(db.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });
});
