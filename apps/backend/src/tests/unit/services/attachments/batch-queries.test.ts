/**
 * Unit tests for attachments/batch-queries.ts
 * Covers: countByCategory, hasAttachment, batchCheckRodo, batchCheckContract
 */

jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    attachment: {
      groupBy: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { countByCategory, hasAttachment, batchCheckRodo, batchCheckContract } from '../../../../services/attachments/batch-queries';
import { prisma } from '../../../../lib/prisma';

const db = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===============================================================
// countByCategory
// ===============================================================

describe('countByCategory', () => {
  it('returns category counts as record', async () => {
    db.attachment.groupBy.mockResolvedValue([
      { category: 'RODO', _count: { id: 2 } },
      { category: 'CONTRACT', _count: { id: 1 } },
    ]);

    const result = await countByCategory('CLIENT' as any, 'c1');

    expect(result).toEqual({ RODO: 2, CONTRACT: 1 });
    expect(db.attachment.groupBy).toHaveBeenCalledWith({
      by: ['category'],
      where: { entityType: 'CLIENT', entityId: 'c1', isArchived: false },
      _count: { id: true },
    });
  });

  it('returns empty record when no attachments', async () => {
    db.attachment.groupBy.mockResolvedValue([]);

    const result = await countByCategory('CLIENT' as any, 'c1');
    expect(result).toEqual({});
  });
});

// ===============================================================
// hasAttachment
// ===============================================================

describe('hasAttachment', () => {
  it('returns true when attachment exists', async () => {
    db.attachment.count.mockResolvedValue(1);

    const result = await hasAttachment('CLIENT' as any, 'c1', 'RODO');
    expect(result).toBe(true);
  });

  it('returns false when no attachment', async () => {
    db.attachment.count.mockResolvedValue(0);

    const result = await hasAttachment('CLIENT' as any, 'c1', 'RODO');
    expect(result).toBe(false);
  });
});

// ===============================================================
// batchCheckRodo
// ===============================================================

describe('batchCheckRodo', () => {
  it('returns true for clients with RODO, false for others', async () => {
    db.attachment.findMany.mockResolvedValue([
      { entityId: 'c1' },
      { entityId: 'c3' },
    ]);

    const result = await batchCheckRodo(['c1', 'c2', 'c3']);

    expect(result).toEqual({ c1: true, c2: false, c3: true });
    expect(db.attachment.findMany).toHaveBeenCalledWith({
      where: {
        entityType: 'CLIENT',
        entityId: { in: ['c1', 'c2', 'c3'] },
        category: 'RODO',
        isArchived: false,
      },
      select: { entityId: true },
      distinct: ['entityId'],
    });
  });

  it('returns all false for empty result', async () => {
    db.attachment.findMany.mockResolvedValue([]);

    const result = await batchCheckRodo(['c1', 'c2']);
    expect(result).toEqual({ c1: false, c2: false });
  });
});

// ===============================================================
// batchCheckContract
// ===============================================================

describe('batchCheckContract', () => {
  it('returns true for reservations with CONTRACT', async () => {
    db.attachment.findMany.mockResolvedValue([{ entityId: 'r2' }]);

    const result = await batchCheckContract(['r1', 'r2']);

    expect(result).toEqual({ r1: false, r2: true });
    expect(db.attachment.findMany).toHaveBeenCalledWith({
      where: {
        entityType: 'RESERVATION',
        entityId: { in: ['r1', 'r2'] },
        category: 'CONTRACT',
        isArchived: false,
      },
      select: { entityId: true },
      distinct: ['entityId'],
    });
  });
});
