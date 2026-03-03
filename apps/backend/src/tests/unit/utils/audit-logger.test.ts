import { logChange, diffObjects } from '../../../utils/audit-logger';
import { prisma } from '../../../lib/prisma';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    activityLog: {
      create: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('audit-logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logChange', () => {
    it('should log a change', async () => {
      const userId = 'user-123';
      const entity = 'Reservation';
      const entityId = 'res-456';
      const action = 'update';
      const changes = { status: { old: 'PENDING', new: 'CONFIRMED' } };
      const description = 'Status changed';

      mockPrisma.activityLog.create.mockResolvedValue({
        id: 'log-1',
        userId,
        entity,
        entityId,
        action,
        changes,
        description,
        timestamp: new Date(),
      });

      await logChange(userId, entity, entityId, action, changes, description);

      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          entity,
          entityId,
          action,
          changes,
          description,
        },
      });
    });

    it('should handle logging errors gracefully', async () => {
      const userId = 'user-123';
      const entity = 'Reservation';
      const entityId = 'res-456';
      const action = 'update';
      const changes = {};
      const description = 'Test';

      mockPrisma.activityLog.create.mockRejectedValue(new Error('Database error'));

      await expect(
        logChange(userId, entity, entityId, action, changes, description)
      ).resolves.toBeUndefined();
    });
  });

  describe('diffObjects', () => {
    it('should detect changes between objects', () => {
      const oldObj = { name: 'John', age: 30 };
      const newObj = { name: 'Jane', age: 30 };

      const diff = diffObjects(oldObj, newObj);

      expect(diff).toEqual({ name: { old: 'John', new: 'Jane' } });
    });

    it('should detect added properties', () => {
      const oldObj = { name: 'John' };
      const newObj = { name: 'John', age: 30 };

      const diff = diffObjects(oldObj, newObj);

      expect(diff).toEqual({ age: { old: undefined, new: 30 } });
    });

    it('should detect removed properties', () => {
      const oldObj = { name: 'John', age: 30 };
      const newObj = { name: 'John' };

      const diff = diffObjects(oldObj, newObj);

      expect(diff).toEqual({ age: { old: 30, new: undefined } });
    });

    it('should return empty object when no changes', () => {
      const oldObj = { name: 'John', age: 30 };
      const newObj = { name: 'John', age: 30 };

      const diff = diffObjects(oldObj, newObj);

      expect(diff).toEqual({});
    });

    it('should handle nested objects', () => {
      const oldObj = { user: { name: 'John', age: 30 } };
      const newObj = { user: { name: 'Jane', age: 30 } };

      const diff = diffObjects(oldObj, newObj);

      expect(diff.user).toBeDefined();
    });

    it('should handle null values', () => {
      const oldObj = { name: 'John', age: null };
      const newObj = { name: 'John', age: 30 };

      const diff = diffObjects(oldObj, newObj);

      expect(diff).toEqual({ age: { old: null, new: 30 } });
    });

    it('should handle Date objects', () => {
      const oldDate = new Date('2023-01-01');
      const newDate = new Date('2023-01-02');
      const oldObj = { createdAt: oldDate };
      const newObj = { createdAt: newDate };

      const diff = diffObjects(oldObj, newObj);

      expect(diff.createdAt).toBeDefined();
      expect(diff.createdAt.old).toBe(oldDate);
      expect(diff.createdAt.new).toBe(newDate);
    });
  });
});
