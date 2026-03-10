/**
 * QueueService CRUD — Unit Tests
 * Tests: getQueueForDate with Polish pattern fix
 */

jest.mock('../../../lib/prisma');

import { QueueService } from '../../../services/queue.service';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const svc = new QueueService();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('QueueService', () => {
  describe('getQueueForDate()', () => {
    it('should throw on invalid date', async () => {
      await expect(svc.getQueueForDate('not-a-date'))
        .rejects.toThrow(/Nieprawidłowy.*format|Invalid.*format/i);
    });
  });
});
