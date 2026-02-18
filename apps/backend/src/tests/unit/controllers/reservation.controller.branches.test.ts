/**
 * ReservationController — Branch Coverage Tests
 * Targets: all-zero guests, menuPackage pricing conflicts, checkAvailability validation,
 * archived filter ternary, no-important-changes skip, downloadPDF
 * NOTE: No jest.mock('@prisma/client') — causes coverage regression
 */

jest.mock('../../../services/reservation.service', () => ({
  __esModule: true,
  default: {
    createReservation: jest.fn(),
    getReservations: jest.fn(),
    getReservationById: jest.fn(),
    updateReservation: jest.fn(),
    updateStatus: jest.fn(),
    cancelReservation: jest.fn(),
    archiveReservation: jest.fn(),
    unarchiveReservation: jest.fn(),
  },
}));

jest.mock('../../../services/deposit.service', () => ({
  __esModule: true,
  default: { checkPaidDepositsBeforeCancel: jest.fn() },
}));

jest.mock('../../../services/pdf.service', () => ({
  pdfService: { generateReservationPDF: jest.fn() },
}));

import { ReservationController } from '../../../controllers/reservation.controller';
import reservationService from '../../../services/reservation.service';
import { pdfService } from '../../../services/pdf.service';

const controller = new ReservationController();
const mockService = reservationService as jest.Mocked<typeof reservationService>;

const makeReq = (overrides?: any) => ({
  body: {}, params: {}, query: {}, user: { id: 'user-1' },
  ...overrides,
});

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.send = jest.fn();
  return res;
};

describe('ReservationController — branch coverage', () => {

  beforeEach(() => jest.clearAllMocks());

  // ── createReservation: guest/pricing branches ────────────────
  describe('createReservation — guest/pricing branches', () => {

    it('should throw when all guest counts are zero', async () => {
      const req = makeReq({
        body: {
          hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
          startDateTime: '2026-09-15T14:00:00Z', endDateTime: '2026-09-15T22:00:00Z',
          adults: 0, children: 0, toddlers: 0,
        },
      });
      await expect(controller.createReservation(req as any, makeRes() as any))
        .rejects.toThrow('At least one guest is required');
    });

    it('should throw when no menuPackage and no manual prices', async () => {
      const req = makeReq({
        body: {
          hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
          startDateTime: '2026-09-15T14:00:00Z', endDateTime: '2026-09-15T22:00:00Z',
          adults: 10, children: 5, toddlers: 2,
        },
      });
      await expect(controller.createReservation(req as any, makeRes() as any))
        .rejects.toThrow('pricePerAdult and pricePerChild are required');
    });

    it('should throw when both menuPackageId and manual prices', async () => {
      const req = makeReq({
        body: {
          hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
          startDateTime: '2026-09-15T14:00:00Z', endDateTime: '2026-09-15T22:00:00Z',
          adults: 10, children: 5, toddlers: 2,
          menuPackageId: 'pkg-1', pricePerAdult: 200,
        },
      });
      await expect(controller.createReservation(req as any, makeRes() as any))
        .rejects.toThrow('Cannot specify both menuPackageId and manual prices');
    });

    it('should include menu package message when menuPackageId set', async () => {
      mockService.createReservation.mockResolvedValue({ id: 'r1' } as any);
      const req = makeReq({
        body: {
          hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
          startDateTime: '2026-09-15T14:00:00Z', endDateTime: '2026-09-15T22:00:00Z',
          adults: 10, children: 5, toddlers: 2,
          menuPackageId: 'pkg-1',
        },
      });
      const res = makeRes();
      await controller.createReservation(req as any, res as any);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Reservation created successfully with menu package' })
      );
    });

    it('should return standard message when no menuPackageId', async () => {
      mockService.createReservation.mockResolvedValue({ id: 'r1' } as any);
      const req = makeReq({
        body: {
          hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
          startDateTime: '2026-09-15T14:00:00Z', endDateTime: '2026-09-15T22:00:00Z',
          adults: 10, children: 5, toddlers: 2,
          pricePerAdult: 200, pricePerChild: 100,
        },
      });
      const res = makeRes();
      await controller.createReservation(req as any, res as any);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Reservation created successfully' })
      );
    });

    it('should accept legacy date format (date + startTime + endTime)', async () => {
      mockService.createReservation.mockResolvedValue({ id: 'r1' } as any);
      const req = makeReq({
        body: {
          hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
          date: '2026-09-15', startTime: '14:00', endTime: '22:00',
          adults: 10, children: 5, toddlers: 0,
          pricePerAdult: 200, pricePerChild: 100,
        },
      });
      const res = makeRes();
      await controller.createReservation(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ── checkAvailability: validation branches (before prisma call) ──
  describe('checkAvailability — validation', () => {

    it('should throw on invalid date format', async () => {
      const req = makeReq({
        query: { hallId: 'h1', startDateTime: 'not-a-date', endDateTime: '2026-09-15T22:00:00Z' },
      });
      await expect(controller.checkAvailability(req as any, makeRes() as any))
        .rejects.toThrow('Invalid date format');
    });

    it('should throw when endDateTime equals startDateTime', async () => {
      const req = makeReq({
        query: {
          hallId: 'h1',
          startDateTime: '2026-09-15T14:00:00Z',
          endDateTime: '2026-09-15T14:00:00Z',
        },
      });
      await expect(controller.checkAvailability(req as any, makeRes() as any))
        .rejects.toThrow('endDateTime must be after startDateTime');
    });

    it('should throw when endDateTime before startDateTime', async () => {
      const req = makeReq({
        query: {
          hallId: 'h1',
          startDateTime: '2026-09-15T22:00:00Z',
          endDateTime: '2026-09-15T14:00:00Z',
        },
      });
      await expect(controller.checkAvailability(req as any, makeRes() as any))
        .rejects.toThrow('endDateTime must be after startDateTime');
    });
  });

  // ── getReservations: archived filter ternary ──────────────────
  describe('getReservations — archived filter', () => {

    it('should set archived=true when query is "true"', async () => {
      mockService.getReservations.mockResolvedValue([]);
      const req = makeReq({ query: { archived: 'true' } });
      const res = makeRes();
      await controller.getReservations(req as any, res as any);

      expect(mockService.getReservations).toHaveBeenCalledWith(
        expect.objectContaining({ archived: true })
      );
    });

    it('should set archived=false when query is "false"', async () => {
      mockService.getReservations.mockResolvedValue([]);
      const req = makeReq({ query: { archived: 'false' } });
      const res = makeRes();
      await controller.getReservations(req as any, res as any);

      expect(mockService.getReservations).toHaveBeenCalledWith(
        expect.objectContaining({ archived: false })
      );
    });

    it('should set archived=undefined when query param not set', async () => {
      mockService.getReservations.mockResolvedValue([]);
      const req = makeReq({ query: {} });
      const res = makeRes();
      await controller.getReservations(req as any, res as any);

      expect(mockService.getReservations).toHaveBeenCalledWith(
        expect.objectContaining({ archived: undefined })
      );
    });
  });

  // ── updateReservation: important changes detection ─────────────
  describe('updateReservation — important changes', () => {

    it('should not require reason when only notes changed', async () => {
      mockService.updateReservation.mockResolvedValue({ id: 'r1' } as any);
      const req = makeReq({
        params: { id: 'r1' },
        body: { notes: 'Updated notes only' },
      });
      const res = makeRes();
      await controller.updateReservation(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should require reason when pricePerAdult changes', async () => {
      const req = makeReq({
        params: { id: 'r1' },
        body: { pricePerAdult: 300 },
      });
      await expect(controller.updateReservation(req as any, makeRes() as any))
        .rejects.toThrow('Reason is required for important changes');
    });

    it('should require reason when startDateTime changes', async () => {
      const req = makeReq({
        params: { id: 'r1' },
        body: { startDateTime: '2026-10-01T14:00:00Z' },
      });
      await expect(controller.updateReservation(req as any, makeRes() as any))
        .rejects.toThrow('Reason is required');
    });

    it('should accept important changes with valid reason >=10 chars', async () => {
      mockService.updateReservation.mockResolvedValue({ id: 'r1' } as any);
      const req = makeReq({
        params: { id: 'r1' },
        body: { adults: 50, reason: 'Zmiana liczby go\u015bci na pro\u015bb\u0119 klienta' },
      });
      const res = makeRes();
      await controller.updateReservation(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should require reason when endDateTime changes', async () => {
      const req = makeReq({
        params: { id: 'r1' },
        body: { endDateTime: '2026-10-01T23:00:00Z' },
      });
      await expect(controller.updateReservation(req as any, makeRes() as any))
        .rejects.toThrow('Reason is required');
    });

    it('should require reason when children count changes', async () => {
      const req = makeReq({
        params: { id: 'r1' },
        body: { children: 20 },
      });
      await expect(controller.updateReservation(req as any, makeRes() as any))
        .rejects.toThrow('Reason is required');
    });

    it('should require reason when toddlers count changes', async () => {
      const req = makeReq({
        params: { id: 'r1' },
        body: { toddlers: 5 },
      });
      await expect(controller.updateReservation(req as any, makeRes() as any))
        .rejects.toThrow('Reason is required');
    });

    it('should require reason when pricePerChild changes', async () => {
      const req = makeReq({
        params: { id: 'r1' },
        body: { pricePerChild: 150 },
      });
      await expect(controller.updateReservation(req as any, makeRes() as any))
        .rejects.toThrow('Reason is required');
    });

    it('should require reason when pricePerToddler changes', async () => {
      const req = makeReq({
        params: { id: 'r1' },
        body: { pricePerToddler: 50 },
      });
      await expect(controller.updateReservation(req as any, makeRes() as any))
        .rejects.toThrow('Reason is required');
    });
  });

  // ── downloadPDF ──────────────────────────────────────────
  describe('downloadPDF', () => {

    it('should send PDF with correct headers', async () => {
      mockService.getReservationById.mockResolvedValue({ id: 'r1-abc' } as any);
      (pdfService.generateReservationPDF as jest.Mock).mockResolvedValue(Buffer.from('pdf-data'));
      const req = makeReq({ params: { id: 'r1-abcdef01' } });
      const res = makeRes();
      await controller.downloadPDF(req as any, res as any);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', 8);
      expect(res.send).toHaveBeenCalled();
    });

    it('should throw 404 when reservation not found', async () => {
      mockService.getReservationById.mockResolvedValue(null);
      const req = makeReq({ params: { id: 'missing' } });
      await expect(controller.downloadPDF(req as any, makeRes() as any))
        .rejects.toThrow();
    });
  });
});
