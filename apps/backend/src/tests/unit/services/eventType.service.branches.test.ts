/**
 * EventTypeService — Branch Coverage Tests
 * Tests: edge cases for updateEventType, deleteEventType
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    eventType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reservation: {
      count: jest.fn(),
    },
    menuTemplate: {
      count: jest.fn(),
    },
  },
}));

import { EventTypeService } from '../../../services/eventType.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const svc = new EventTypeService();

const EXISTING = {
  id: 'et-1',
  name: 'Wesele',
  color: '#FF5733',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('EventTypeService — branches', () => {
  describe('updateEventType()', () => {
    it('should throw when name is empty string', async () => {
      db.eventType.findUnique.mockResolvedValue(EXISTING);

      await expect(svc.updateEventType('et-1', { name: '  ' }, 'u1'))
        .rejects.toThrow(/pusta|empty/i);
    });
  });

  describe('deleteEventType()', () => {
    it('should throw when has reservations', async () => {
      db.eventType.findUnique.mockResolvedValue(EXISTING);
      db.reservation.count.mockResolvedValue(5);

      await expect(svc.deleteEventType('et-1', 'u1'))
        .rejects.toThrow(/5.*rezerwacj|5.*reservation/i);
    });

    it('should throw when has menu templates', async () => {
      db.eventType.findUnique.mockResolvedValue(EXISTING);
      db.reservation.count.mockResolvedValue(0);
      db.menuTemplate.count.mockResolvedValue(3);

      await expect(svc.deleteEventType('et-1', 'u1'))
        .rejects.toThrow(/3.*szablon|3.*template/i);
    });
  });
});
