/**
 * ReservationController — Unit Tests
 * Uses AppError throws (no try/catch, asyncHandler wraps).
 * We call methods directly and expect AppError to be thrown.
 */
const mockPrismaInstance = {
  reservation: { findMany: jest.fn() },
};

jest.mock('@/prisma-client', () => ({
  PrismaClient: jest.fn(() => mockPrismaInstance),
}));

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
  default: {
    checkPaidDepositsBeforeCancel: jest.fn(),
  },
}));

jest.mock('../../../services/pdf.service', () => ({
  pdfService: {
    generateReservationPDF: jest.fn(),
  },
}));

import { ReservationController } from '../../../controllers/reservation.controller';
import reservationService from '../../../services/reservation.service';
import depositService from '../../../services/deposit.service';
import { pdfService } from '../../../services/pdf.service';

const controller = new ReservationController();
const svc = reservationService as any;
const depSvc = depositService as any;
const pdfSvc = pdfService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
  user: { id: 'user-1' },
  ...overrides,
});
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn();
  r.send = jest.fn();
  r.sendFile = jest.fn();
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('ReservationController', () => {
  describe('createReservation()', () => {
    it('should throw 401 when no user', async () => {
      await expect(
        controller.createReservation(req({ user: undefined }), res())
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when required fields missing', async () => {
      await expect(
        controller.createReservation(req({ body: {} }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when no date info', async () => {
      await expect(
        controller.createReservation(req({ body: {
          hallId: 'h', clientId: 'c', eventTypeId: 'e',
        } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when no guests', async () => {
      await expect(
        controller.createReservation(req({ body: {
          hallId: 'h', clientId: 'c', eventTypeId: 'e',
          startDateTime: '2026-03-01T10:00', endDateTime: '2026-03-01T20:00',
        } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 201 on success', async () => {
      svc.createReservation.mockResolvedValue({ id: 'r-1' });
      const response = res();
      await controller.createReservation(req({ body: {
        hallId: 'h', clientId: 'c', eventTypeId: 'e',
        startDateTime: '2026-03-01T10:00', endDateTime: '2026-03-01T20:00',
        adults: 50, children: 10, toddlers: 5,
        pricePerAdult: 200, pricePerChild: 100,
      } }), response);
      expect(response.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getReservations()', () => {
    it('should return 200', async () => {
      svc.getReservations.mockResolvedValue([{ id: 'r-1' }]);
      const response = res();
      await controller.getReservations(req({ query: { status: 'CONFIRMED' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getReservationById()', () => {
    it('should throw 404', async () => {
      svc.getReservationById.mockResolvedValue(null);
      await expect(
        controller.getReservationById(req({ params: { id: 'x' } }), res())
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('checkAvailability()', () => {
    it('should throw 400 when missing params', async () => {
      await expect(
        controller.checkAvailability(req({ query: {} }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return available=true', async () => {
      mockPrismaInstance.reservation.findMany.mockResolvedValue([]);
      const response = res();
      await controller.checkAvailability(req({ query: {
        hallId: 'h-1', startDateTime: '2026-03-01T10:00', endDateTime: '2026-03-01T20:00',
      } }), response);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ available: true }) })
      );
    });
  });

  describe('updateReservation()', () => {
    it('should throw 400 when reason too short for important changes', async () => {
      await expect(
        controller.updateReservation(req({ params: { id: 'r-1' }, body: { adults: 60, reason: 'short' } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 200', async () => {
      svc.updateReservation.mockResolvedValue({ id: 'r-1' });
      const response = res();
      await controller.updateReservation(req({ params: { id: 'r-1' }, body: { notes: 'test' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateStatus()', () => {
    it('should throw 400 when no status', async () => {
      await expect(
        controller.updateStatus(req({ params: { id: 'r-1' }, body: {} }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when cancelling with paid deposits', async () => {
      depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({
        hasPaidDeposits: true, paidCount: 2, paidTotal: 5000,
      });
      await expect(
        controller.updateStatus(req({ params: { id: 'r-1' }, body: { status: 'CANCELLED' } }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 200', async () => {
      depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({ hasPaidDeposits: false });
      svc.updateStatus.mockResolvedValue({ id: 'r-1' });
      const response = res();
      await controller.updateStatus(req({ params: { id: 'r-1' }, body: { status: 'CONFIRMED' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('cancelReservation()', () => {
    it('should throw 400 when paid deposits', async () => {
      depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({
        hasPaidDeposits: true, paidCount: 1, paidTotal: 3000,
      });
      await expect(
        controller.cancelReservation(req({ params: { id: 'r-1' }, body: {} }), res())
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return 200', async () => {
      depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({ hasPaidDeposits: false });
      svc.cancelReservation.mockResolvedValue(undefined);
      const response = res();
      await controller.cancelReservation(req({ params: { id: 'r-1' }, body: { reason: 'test' } }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('archiveReservation()', () => {
    it('should return 200', async () => {
      svc.archiveReservation.mockResolvedValue(undefined);
      const response = res();
      await controller.archiveReservation(req({ params: { id: 'r-1' }, body: {} }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('unarchiveReservation()', () => {
    it('should return 200', async () => {
      svc.unarchiveReservation.mockResolvedValue(undefined);
      const response = res();
      await controller.unarchiveReservation(req({ params: { id: 'r-1' }, body: {} }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });
});
