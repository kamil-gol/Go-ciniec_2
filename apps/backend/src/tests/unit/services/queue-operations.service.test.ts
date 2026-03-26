/**
 * queue-operations.service — Unit Tests
 * Covers: batchUpdatePositions, rebuildPositions, getQueueStats, autoCancelExpired
 */

const mockPrisma = {
  reservation: {
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../../../lib/prisma', () => ({ prisma: mockPrisma }));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import {
  batchUpdatePositions,
  rebuildPositions,
  getQueueStats,
  autoCancelExpired,
} from '../../../services/queue/queue-operations.service';
import { logChange } from '../../../utils/audit-logger';

beforeEach(() => jest.clearAllMocks());

// ── batchUpdatePositions ───────────────────────────────────────────────

describe('batchUpdatePositions()', () => {
  it('powinno rzucić błąd dla pustej listy aktualizacji', async () => {
    await expect(batchUpdatePositions([], 'user-1')).rejects.toThrow(/co najmniej jedna/);
  });

  it('powinno rzucić błąd gdy brak id w aktualizacji', async () => {
    await expect(
      batchUpdatePositions([{ id: '', position: 1 }], 'user-1'),
    ).rejects.toThrow(/identyfikator/);
  });

  it('powinno rzucić błąd dla nieprawidłowej pozycji (0)', async () => {
    await expect(
      batchUpdatePositions([{ id: 'r1', position: 0 }], 'user-1'),
    ).rejects.toThrow(/Nieprawidłowa pozycja/);
  });

  it('powinno rzucić błąd dla ujemnej pozycji', async () => {
    await expect(
      batchUpdatePositions([{ id: 'r1', position: -1 }], 'user-1'),
    ).rejects.toThrow(/Nieprawidłowa pozycja/);
  });

  it('powinno rzucić błąd dla pozycji niecałkowitej', async () => {
    await expect(
      batchUpdatePositions([{ id: 'r1', position: 1.5 }], 'user-1'),
    ).rejects.toThrow(/Nieprawidłowa pozycja/);
  });

  it('powinno wykonać transakcję i zwrócić updatedCount', async () => {
    const queueDate = new Date('2026-03-25');
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        reservation: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'r1', status: 'RESERVED', reservationQueueDate: queueDate, reservationQueuePosition: 1 },
            { id: 'r2', status: 'RESERVED', reservationQueueDate: queueDate, reservationQueuePosition: 2 },
          ]),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const result = await batchUpdatePositions(
      [
        { id: 'r1', position: 2 },
        { id: 'r2', position: 1 },
      ],
      'user-1',
    );

    expect(result.updatedCount).toBe(2);
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'QUEUE_REORDER' }),
    );
  });

  it('powinno rzucić błąd gdy rezerwacja nie ma statusu RESERVED', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        reservation: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'r1', status: 'CONFIRMED', reservationQueueDate: new Date(), reservationQueuePosition: 1 },
          ]),
          update: jest.fn(),
        },
      };
      return fn(tx);
    });

    await expect(
      batchUpdatePositions([{ id: 'r1', position: 1 }], 'user-1'),
    ).rejects.toThrow(/nie ma statusu RESERVED/);
  });

  it('powinno rzucić błąd gdy rezerwacja nie ma daty kolejki', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        reservation: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'r1', status: 'RESERVED', reservationQueueDate: null, reservationQueuePosition: 1 },
          ]),
          update: jest.fn(),
        },
      };
      return fn(tx);
    });

    await expect(
      batchUpdatePositions([{ id: 'r1', position: 1 }], 'user-1'),
    ).rejects.toThrow(/daty kolejki/);
  });

  it('powinno rzucić błąd gdy nie znaleziono wszystkich rezerwacji', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        reservation: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'r1', status: 'RESERVED', reservationQueueDate: new Date(), reservationQueuePosition: 1 },
          ]),
          update: jest.fn(),
        },
      };
      return fn(tx);
    });

    await expect(
      batchUpdatePositions(
        [{ id: 'r1', position: 1 }, { id: 'r2', position: 2 }],
        'user-1',
      ),
    ).rejects.toThrow(/Nie znaleziono/);
  });

  it('powinno rzucić błąd dla zduplikowanych pozycji', async () => {
    const queueDate = new Date('2026-03-25');
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        reservation: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'r1', status: 'RESERVED', reservationQueueDate: queueDate, reservationQueuePosition: 1 },
            { id: 'r2', status: 'RESERVED', reservationQueueDate: queueDate, reservationQueuePosition: 2 },
          ]),
          update: jest.fn(),
        },
      };
      return fn(tx);
    });

    await expect(
      batchUpdatePositions(
        [{ id: 'r1', position: 1 }, { id: 'r2', position: 1 }],
        'user-1',
      ),
    ).rejects.toThrow(/zduplikowane/i);
  });

  it('powinno rzucić błąd gdy rezerwacje z różnych dat', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        reservation: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'r1', status: 'RESERVED', reservationQueueDate: new Date('2026-03-25'), reservationQueuePosition: 1 },
            { id: 'r2', status: 'RESERVED', reservationQueueDate: new Date('2026-03-26'), reservationQueuePosition: 2 },
          ]),
          update: jest.fn(),
        },
      };
      return fn(tx);
    });

    await expect(
      batchUpdatePositions(
        [{ id: 'r1', position: 1 }, { id: 'r2', position: 2 }],
        'user-1',
      ),
    ).rejects.toThrow(/tego samego dnia/);
  });
});

// ── rebuildPositions ───────────────────────────────────────────────────

describe('rebuildPositions()', () => {
  it('powinno zwrócić 0 gdy brak rezerwacji RESERVED', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);

    const result = await rebuildPositions('user-1');

    expect(result).toEqual({ updatedCount: 0, dateCount: 0 });
    expect(logChange).not.toHaveBeenCalled();
  });

  it('powinno przebudować pozycje pogrupowane po datach', async () => {
    const date1 = new Date('2026-03-25');
    const date2 = new Date('2026-03-26');
    mockPrisma.reservation.findMany.mockResolvedValue([
      { id: 'r1', reservationQueueDate: date1, createdAt: new Date('2026-03-20T10:00:00') },
      { id: 'r2', reservationQueueDate: date1, createdAt: new Date('2026-03-20T09:00:00') },
      { id: 'r3', reservationQueueDate: date2, createdAt: new Date('2026-03-21T08:00:00') },
    ]);
    mockPrisma.reservation.update.mockResolvedValue({});

    const result = await rebuildPositions('user-1');

    expect(result.updatedCount).toBe(3);
    expect(result.dateCount).toBe(2);

    // r2 was created earlier => position 1, r1 => position 2
    const updateCalls = mockPrisma.reservation.update.mock.calls;
    // First date group — sorted by createdAt, r2 first
    expect(updateCalls[0][0]).toEqual({
      where: { id: 'r2' },
      data: { reservationQueuePosition: 1, queueOrderManual: false },
    });
    expect(updateCalls[1][0]).toEqual({
      where: { id: 'r1' },
      data: { reservationQueuePosition: 2, queueOrderManual: false },
    });

    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'QUEUE_REBUILD' }),
    );
  });

  it('powinno pominąć rezerwacje bez reservationQueueDate', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([
      { id: 'r1', reservationQueueDate: null, createdAt: new Date() },
    ]);
    mockPrisma.reservation.update.mockResolvedValue({});

    const result = await rebuildPositions('user-1');

    expect(result.updatedCount).toBe(0);
    expect(result.dateCount).toBe(0);
  });
});

// ── getQueueStats ──────────────────────────────────────────────────────

describe('getQueueStats()', () => {
  it('powinno zwrócić statystyki puste gdy brak rezerwacji', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);

    const result = await getQueueStats();

    expect(result.totalQueued).toBe(0);
    expect(result.queuesByDate).toHaveLength(0);
    expect(result.oldestQueueDate).toBeNull();
    expect(result.manualOrderCount).toBe(0);
  });

  it('powinno policzyć statystyki z kilkoma rezerwacjami', async () => {
    const date1 = new Date('2026-03-25');
    const date2 = new Date('2026-03-26');
    mockPrisma.reservation.findMany.mockResolvedValue([
      { reservationQueueDate: date1, guests: 80, queueOrderManual: true },
      { reservationQueueDate: date1, guests: 50, queueOrderManual: false },
      { reservationQueueDate: date2, guests: 100, queueOrderManual: true },
    ]);

    const result = await getQueueStats();

    expect(result.totalQueued).toBe(3);
    expect(result.queuesByDate).toHaveLength(2);
    expect(result.manualOrderCount).toBe(2);
    expect(result.oldestQueueDate).toEqual(date1);

    const day1 = result.queuesByDate.find(d => d.date === '2026-03-25');
    expect(day1).toEqual({ date: '2026-03-25', count: 2, totalGuests: 130 });
  });

  it('powinno wyznaczyć najstarszą datę kolejki', async () => {
    const older = new Date('2026-03-20');
    const newer = new Date('2026-03-25');
    mockPrisma.reservation.findMany.mockResolvedValue([
      { reservationQueueDate: newer, guests: 50, queueOrderManual: false },
      { reservationQueueDate: older, guests: 80, queueOrderManual: false },
    ]);

    const result = await getQueueStats();

    expect(result.oldestQueueDate).toEqual(older);
  });
});

// ── autoCancelExpired ──────────────────────────────────────────────────

describe('autoCancelExpired()', () => {
  it('powinno zwrócić 0 gdy brak przeterminowanych rezerwacji', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);

    const result = await autoCancelExpired();

    expect(result).toEqual({ cancelledCount: 0, cancelledIds: [] });
    expect(mockPrisma.reservation.updateMany).not.toHaveBeenCalled();
  });

  it('powinno anulować przeterminowane rezerwacje', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([
      { id: 'r1' },
      { id: 'r2' },
    ]);
    mockPrisma.reservation.updateMany.mockResolvedValue({ count: 2 });

    const result = await autoCancelExpired('user-1');

    expect(result.cancelledCount).toBe(2);
    expect(result.cancelledIds).toEqual(['r1', 'r2']);
    expect(mockPrisma.reservation.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['r1', 'r2'] } },
      data: {
        status: 'CANCELLED',
        reservationQueuePosition: null,
        reservationQueueDate: null,
      },
    });
    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'QUEUE_AUTO_CANCEL',
        details: expect.objectContaining({
          cancelledCount: 2,
          triggeredBy: 'manual',
        }),
      }),
    );
  });

  it('powinno oznaczyć triggeredBy=system gdy brak userId', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([{ id: 'r1' }]);
    mockPrisma.reservation.updateMany.mockResolvedValue({ count: 1 });

    await autoCancelExpired();

    expect(logChange).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        details: expect.objectContaining({ triggeredBy: 'system' }),
      }),
    );
  });

  it('powinno szukać tylko rezerwacji z datą PRZED dzisiaj (bug #7)', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([]);

    await autoCancelExpired();

    const call = mockPrisma.reservation.findMany.mock.calls[0][0];
    expect(call.where.status).toBe('RESERVED');
    expect(call.where.reservationQueueDate.lt).toBeDefined();

    // The lt date should be today at 00:00:00
    const ltDate = call.where.reservationQueueDate.lt;
    expect(ltDate.getHours()).toBe(0);
    expect(ltDate.getMinutes()).toBe(0);
    expect(ltDate.getSeconds()).toBe(0);
  });
});
