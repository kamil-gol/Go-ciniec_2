/**
 * QueueController — Unit Tests
 * Tests validation logic, auth checks, response formatting.
 * Service layer is fully mocked.
 */

jest.mock('../../../services/queue.service', () => ({
  __esModule: true,
  default: {
    addToQueue: jest.fn(),
    updateQueueReservation: jest.fn(),
    getQueueForDate: jest.fn(),
    getAllQueues: jest.fn(),
    swapPositions: jest.fn(),
    moveToPosition: jest.fn(),
    batchUpdatePositions: jest.fn(),
    rebuildPositions: jest.fn(),
    promoteReservation: jest.fn(),
    getQueueStats: jest.fn(),
    autoCancelExpired: jest.fn(),
  },
}));

import { QueueController } from '../../../controllers/queue.controller';
import queueService from '../../../services/queue.service';
import { AppError } from '../../../utils/AppError';

const controller = new QueueController();
const svc = queueService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, user: { id: 1 },
  ...overrides,
});

const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

// ═══════════════════════════════════════
// addToQueue
// ═══════════════════════════════════════

describe('QueueController', () => {
  describe('addToQueue()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.addToQueue(req({ user: undefined }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when clientId missing', async () => {
      const r = req({ body: { reservationQueueDate: '2026-03-15', guests: 50 } });
      await expect(controller.addToQueue(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when guests missing', async () => {
      const r = req({ body: { clientId: 'c-1', reservationQueueDate: '2026-03-15' } });
      await expect(controller.addToQueue(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when reservationQueueDate missing', async () => {
      const r = req({ body: { clientId: 'c-1', guests: 50 } });
      await expect(controller.addToQueue(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 201 on success', async () => {
      svc.addToQueue.mockResolvedValue({ id: 'q-1', position: 3 });
      const r = req({ body: { clientId: 'c-1', reservationQueueDate: '2026-03-15', guests: 50 } });
      const response = res();
      await controller.addToQueue(r, response);
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ position: 3 }) })
      );
      expect(svc.addToQueue).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 'c-1' }), 1
      );
    });
  });

  // ═══════════════════════════════════════
  // updateQueueReservation
  // ═══════════════════════════════════════

  describe('updateQueueReservation()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.updateQueueReservation(req({ user: undefined, params: { id: 'q-1' } }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on success', async () => {
      svc.updateQueueReservation.mockResolvedValue({ id: 'q-1' });
      const r = req({ params: { id: 'q-1' }, body: { notes: 'updated' } });
      const response = res();
      await controller.updateQueueReservation(r, response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(svc.updateQueueReservation).toHaveBeenCalledWith('q-1', { notes: 'updated' }, 1);
    });
  });

  // ═══════════════════════════════════════
  // getQueueForDate / getAllQueues
  // ═══════════════════════════════════════

  describe('getQueueForDate()', () => {
    it('should return 200 with data and count', async () => {
      svc.getQueueForDate.mockResolvedValue([{ id: 'q-1' }, { id: 'q-2' }]);
      const r = req({ params: { date: '2026-03-15' } });
      const response = res();
      await controller.getQueueForDate(r, response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, count: 2 })
      );
    });
  });

  describe('getAllQueues()', () => {
    it('should return 200 with all queues', async () => {
      svc.getAllQueues.mockResolvedValue([{ id: 'q-1' }]);
      const response = res();
      await controller.getAllQueues(req(), response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 })
      );
    });
  });

  // ═══════════════════════════════════════
  // swapPositions
  // ═══════════════════════════════════════

  describe('swapPositions()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.swapPositions(req({ user: undefined }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when reservationId1 missing', async () => {
      const r = req({ body: { reservationId2: 'r-2' } });
      await expect(controller.swapPositions(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when reservationId2 missing', async () => {
      const r = req({ body: { reservationId1: 'r-1' } });
      await expect(controller.swapPositions(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 200 on success', async () => {
      svc.swapPositions.mockResolvedValue(undefined);
      const r = req({ body: { reservationId1: 'r-1', reservationId2: 'r-2' } });
      const response = res();
      await controller.swapPositions(r, response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(svc.swapPositions).toHaveBeenCalledWith('r-1', 'r-2', 1);
    });
  });

  // ═══════════════════════════════════════
  // moveToPosition
  // ═══════════════════════════════════════

  describe('moveToPosition()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.moveToPosition(req({ user: undefined, params: { id: 'q-1' } }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when newPosition missing', async () => {
      const r = req({ params: { id: 'q-1' }, body: {} });
      await expect(controller.moveToPosition(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when position is not integer', async () => {
      const r = req({ params: { id: 'q-1' }, body: { newPosition: 'abc' } });
      await expect(controller.moveToPosition(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when position < 1', async () => {
      const r = req({ params: { id: 'q-1' }, body: { newPosition: 0 } });
      await expect(controller.moveToPosition(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when position is negative', async () => {
      const r = req({ params: { id: 'q-1' }, body: { newPosition: -5 } });
      await expect(controller.moveToPosition(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should parse string position and succeed', async () => {
      svc.moveToPosition.mockResolvedValue(undefined);
      const r = req({ params: { id: 'q-1' }, body: { newPosition: '3' } });
      const response = res();
      await controller.moveToPosition(r, response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(svc.moveToPosition).toHaveBeenCalledWith('q-1', 3, 1);
    });

    it('should return 200 on valid integer position', async () => {
      svc.moveToPosition.mockResolvedValue(undefined);
      const r = req({ params: { id: 'q-1' }, body: { newPosition: 5 } });
      const response = res();
      await controller.moveToPosition(r, response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  // ═══════════════════════════════════════
  // batchUpdatePositions
  // ═══════════════════════════════════════

  describe('batchUpdatePositions()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.batchUpdatePositions(req({ user: undefined }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when updates is missing', async () => {
      const r = req({ body: {} });
      await expect(controller.batchUpdatePositions(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when updates is empty array', async () => {
      const r = req({ body: { updates: [] } });
      await expect(controller.batchUpdatePositions(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when update has invalid id', async () => {
      const r = req({ body: { updates: [{ id: 123, position: 1 }] } });
      await expect(controller.batchUpdatePositions(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when update has position < 1', async () => {
      const r = req({ body: { updates: [{ id: 'q-1', position: 0 }] } });
      await expect(controller.batchUpdatePositions(r, res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 200 on valid batch', async () => {
      svc.batchUpdatePositions.mockResolvedValue({ updatedCount: 2 });
      const r = req({ body: { updates: [{ id: 'q-1', position: 1 }, { id: 'q-2', position: 2 }] } });
      const response = res();
      await controller.batchUpdatePositions(r, response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { updatedCount: 2 } })
      );
    });
  });

  // ═══════════════════════════════════════
  // promoteReservation
  // ═══════════════════════════════════════

  describe('promoteReservation()', () => {
    const VALID_PROMOTE = {
      hallId: 'h-1', eventTypeId: 'et-1',
      startDateTime: '2026-03-15T14:00', endDateTime: '2026-03-15T22:00',
      pricePerAdult: 250, adults: 80,
    };

    it('should throw 401 when no user', async () => {
      await expect(controller.promoteReservation(
        req({ user: undefined, params: { id: 'q-1' }, body: VALID_PROMOTE }), res()
      )).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when hallId missing', async () => {
      const body = { ...VALID_PROMOTE, hallId: undefined };
      await expect(controller.promoteReservation(
        req({ params: { id: 'q-1' }, body }), res()
      )).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when eventTypeId missing', async () => {
      const body = { ...VALID_PROMOTE, eventTypeId: undefined };
      await expect(controller.promoteReservation(
        req({ params: { id: 'q-1' }, body }), res()
      )).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when pricePerAdult missing', async () => {
      const body = { ...VALID_PROMOTE, pricePerAdult: 0 };
      await expect(controller.promoteReservation(
        req({ params: { id: 'q-1' }, body }), res()
      )).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 200 on valid promotion', async () => {
      svc.promoteReservation.mockResolvedValue({ id: 'r-new', status: 'PENDING' });
      const response = res();
      await controller.promoteReservation(
        req({ params: { id: 'q-1' }, body: VALID_PROMOTE }), response
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(svc.promoteReservation).toHaveBeenCalledWith('q-1', VALID_PROMOTE, 1);
    });
  });

  // ═══════════════════════════════════════
  // rebuildPositions / getStats / autoCancelExpired
  // ═══════════════════════════════════════

  describe('rebuildPositions()', () => {
    it('should throw 401 when no user', async () => {
      await expect(controller.rebuildPositions(req({ user: undefined }), res()))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return 200 on success', async () => {
      svc.rebuildPositions.mockResolvedValue({ updatedCount: 10, dateCount: 3 });
      const response = res();
      await controller.rebuildPositions(req(), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getStats()', () => {
    it('should return 200 with stats', async () => {
      svc.getQueueStats.mockResolvedValue({ totalInQueue: 15, avgWaitDays: 12 });
      const response = res();
      await controller.getStats(req(), response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { totalInQueue: 15, avgWaitDays: 12 } })
      );
    });
  });

  describe('autoCancelExpired()', () => {
    it('should return 200 with cancelled count', async () => {
      svc.autoCancelExpired.mockResolvedValue({ cancelledCount: 3, cancelledIds: ['r-1', 'r-2', 'r-3'] });
      const response = res();
      await controller.autoCancelExpired(req(), response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });
});
