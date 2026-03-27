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
    checkAvailability: jest.fn(),
    prepareReservationForPDF: jest.fn(),
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
      svc.checkAvailability.mockResolvedValue({ available: true, conflicts: [] });
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

  describe('edge cases / branch coverage', () => {
    const BASE_BODY = {
      hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
      startDateTime: '2026-03-01T10:00:00Z', endDateTime: '2026-03-01T18:00:00Z',
      adults: 50, children: 10, toddlers: 5,
      pricePerAdult: 150, pricePerChild: 80,
    };

    describe('createReservation validation', () => {
      it('should throw unauthorized when no userId', async () => {
        const response = res();
        await expect(controller.createReservation(req({ body: BASE_BODY, user: undefined }), response)).rejects.toThrow('Unauthorized');
      });

      it('should throw when missing hallId', async () => {
        const response = res();
        await expect(controller.createReservation(req({ body: { ...BASE_BODY, hallId: undefined } }), response)).rejects.toThrow('Hall');
      });

      it('should throw when no date format', async () => {
        const response = res();
        await expect(controller.createReservation(req({ body: { ...BASE_BODY, startDateTime: undefined, endDateTime: undefined } }), response)).rejects.toThrow('startDateTime');
      });

      it('should accept legacy date format', async () => {
        svc.createReservation.mockResolvedValue({ id: 'r1' });
        const response = res();
        await controller.createReservation(req({
          body: { ...BASE_BODY, startDateTime: undefined, endDateTime: undefined, date: '2026-03-01', startTime: '10:00', endTime: '18:00' },
        }), response);
        expect(response.status).toHaveBeenCalledWith(201);
      });

      it('should throw when guest counts missing', async () => {
        const response = res();
        await expect(controller.createReservation(req({ body: { ...BASE_BODY, adults: undefined } }), response)).rejects.toThrow('Guest counts');
      });

      it('should throw when all guests are zero', async () => {
        const response = res();
        await expect(controller.createReservation(req({ body: { ...BASE_BODY, adults: 0, children: 0, toddlers: 0 } }), response)).rejects.toThrow('At least one guest');
      });

      it('should throw when no menuPackage and no prices', async () => {
        const response = res();
        await expect(controller.createReservation(req({ body: { ...BASE_BODY, pricePerAdult: undefined, pricePerChild: undefined } }), response)).rejects.toThrow('pricePerAdult');
      });

      it('should throw when both menuPackageId and manual prices', async () => {
        const response = res();
        await expect(controller.createReservation(req({ body: { ...BASE_BODY, menuPackageId: 'mp1' } }), response)).rejects.toThrow('Cannot specify both');
      });

      it('should succeed with menuPackageId (no manual prices)', async () => {
        svc.createReservation.mockResolvedValue({ id: 'r1' });
        const response = res();
        await controller.createReservation(req({ body: { ...BASE_BODY, pricePerAdult: undefined, pricePerChild: undefined, menuPackageId: 'mp1' } }), response);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('menu package') }));
      });
    });

    describe('checkAvailability validation', () => {
      it('should throw when missing params', async () => {
        const response = res();
        await expect(controller.checkAvailability(req({ query: {} }), response)).rejects.toThrow('hallId');
      });

      it('should throw on invalid date format', async () => {
        const response = res();
        await expect(controller.checkAvailability(req({ query: { hallId: 'h1', startDateTime: 'bad', endDateTime: 'bad' } }), response)).rejects.toThrow('Invalid date');
      });

      it('should throw when end <= start', async () => {
        const response = res();
        await expect(controller.checkAvailability(req({ query: { hallId: 'h1', startDateTime: '2026-03-01T18:00:00Z', endDateTime: '2026-03-01T10:00:00Z' } }), response)).rejects.toThrow('after');
      });

      it('should return conflicts with client and eventType', async () => {
        svc.checkAvailability.mockResolvedValue({
          available: false,
          conflicts: [{ id: 'r2', clientName: 'Jan Kowalski', eventType: 'Wesele', startDateTime: '2026-03-01T10:00:00.000Z', endDateTime: '2026-03-01T18:00:00.000Z', status: 'CONFIRMED' }],
        });
        const response = res();
        await controller.checkAvailability(req({ query: { hallId: 'h1', startDateTime: '2026-03-01T10:00:00Z', endDateTime: '2026-03-01T18:00:00Z' } }), response);
        const data = response.json.mock.calls[0][0].data;
        expect(data.available).toBe(false);
        expect(data.conflicts[0].clientName).toBe('Jan Kowalski');
      });

      it('should pass excludeReservationId when provided', async () => {
        svc.checkAvailability.mockResolvedValue({ available: true, conflicts: [] });
        const response = res();
        await controller.checkAvailability(req({ query: { hallId: 'h1', startDateTime: '2026-03-01T10:00:00Z', endDateTime: '2026-03-01T18:00:00Z', excludeReservationId: 'r-exclude' } }), response);
        expect(svc.checkAvailability).toHaveBeenCalledWith('h1', expect.any(Date), expect.any(Date), 'r-exclude');
      });
    });

    describe('getReservations filters', () => {
      it('should pass archived=true', async () => {
        svc.getReservations.mockResolvedValue([]);
        const response = res();
        await controller.getReservations(req({ query: { archived: 'true' } }), response);
        expect(svc.getReservations).toHaveBeenCalledWith(expect.objectContaining({ archived: true }));
      });

      it('should pass archived=false', async () => {
        svc.getReservations.mockResolvedValue([]);
        const response = res();
        await controller.getReservations(req({ query: { archived: 'false' } }), response);
        expect(svc.getReservations).toHaveBeenCalledWith(expect.objectContaining({ archived: false }));
      });

      it('should pass archived=undefined when not set', async () => {
        svc.getReservations.mockResolvedValue([]);
        const response = res();
        await controller.getReservations(req({ query: {} }), response);
        expect(svc.getReservations).toHaveBeenCalledWith(expect.objectContaining({ archived: undefined }));
      });
    });

    describe('updateReservation validation', () => {
      it('should throw unauthorized when no userId', async () => {
        const response = res();
        await expect(controller.updateReservation(req({ params: { id: 'r1' }, body: {}, user: undefined }), response)).rejects.toThrow('Unauthorized');
      });

      it('should throw when important changes without reason', async () => {
        const response = res();
        await expect(controller.updateReservation(req({ params: { id: 'r1' }, body: { adults: 100 } }), response)).rejects.toThrow('Reason');
      });

      it('should throw when reason too short', async () => {
        const response = res();
        await expect(controller.updateReservation(req({ params: { id: 'r1' }, body: { adults: 100, reason: 'short' } }), response)).rejects.toThrow('Reason');
      });

      it('should allow non-important changes without reason', async () => {
        svc.updateReservation.mockResolvedValue({ id: 'r1' });
        const response = res();
        await controller.updateReservation(req({ params: { id: 'r1' }, body: { notes: 'some notes' } }), response);
        expect(response.status).toHaveBeenCalledWith(200);
      });

      it('should detect startDateTime as important', async () => {
        const response = res();
        await expect(controller.updateReservation(req({ params: { id: 'r1' }, body: { startDateTime: '2026-04-01T10:00:00Z' } }), response)).rejects.toThrow('Reason');
      });

      it('should detect pricePerChild as important', async () => {
        const response = res();
        await expect(controller.updateReservation(req({ params: { id: 'r1' }, body: { pricePerChild: 100 } }), response)).rejects.toThrow('Reason');
      });
    });

    describe('updateStatus edge cases', () => {
      it('should throw unauthorized when no userId', async () => {
        const response = res();
        await expect(controller.updateStatus(req({ params: { id: 'r1' }, body: { status: 'CONFIRMED' }, user: undefined }), response)).rejects.toThrow('Unauthorized');
      });

      it('should throw when status missing', async () => {
        const response = res();
        await expect(controller.updateStatus(req({ params: { id: 'r1' }, body: {} }), response)).rejects.toThrow('Status is required');
      });

      it('should block cancel with paid deposits', async () => {
        depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({ hasPaidDeposits: true, paidCount: 2, paidTotal: 1000 });
        const response = res();
        await expect(controller.updateStatus(req({ params: { id: 'r1' }, body: { status: 'CANCELLED' } }), response)).rejects.toThrow('zaliczkami');
      });

      it('should not check deposits for non-cancel status', async () => {
        svc.updateStatus.mockResolvedValue({ id: 'r1' });
        const response = res();
        await controller.updateStatus(req({ params: { id: 'r1' }, body: { status: 'CONFIRMED' } }), response);
        expect(depSvc.checkPaidDepositsBeforeCancel).not.toHaveBeenCalled();
      });
    });

    describe('cancelReservation edge cases', () => {
      it('should throw unauthorized when no userId', async () => {
        const response = res();
        await expect(controller.cancelReservation(req({ params: { id: 'r1' }, body: {}, user: undefined }), response)).rejects.toThrow('Unauthorized');
      });

      it('should block when paid deposits exist', async () => {
        depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({ hasPaidDeposits: true, paidCount: 1, paidTotal: 500 });
        const response = res();
        await expect(controller.cancelReservation(req({ params: { id: 'r1' }, body: { reason: 'test' } }), response)).rejects.toThrow('zaliczkami');
      });
    });

    describe('archive/unarchive edge cases', () => {
      it('should throw unauthorized for archive when no userId', async () => {
        const response = res();
        await expect(controller.archiveReservation(req({ params: { id: 'r1' }, body: {}, user: undefined }), response)).rejects.toThrow('Unauthorized');
      });

      it('should throw unauthorized for unarchive when no userId', async () => {
        const response = res();
        await expect(controller.unarchiveReservation(req({ params: { id: 'r1' }, body: {}, user: undefined }), response)).rejects.toThrow('Unauthorized');
      });
    });

    describe('downloadPDF', () => {
      it('should throw when prepareReservationForPDF fails', async () => {
        svc.prepareReservationForPDF.mockRejectedValue(new Error('Nie znaleziono: Reservation'));
        const response = res();
        await expect(controller.downloadPDF(req({ params: { id: 'x' } }), response)).rejects.toThrow(/Nie znaleziono/i);
      });

      it('should return PDF buffer', async () => {
        svc.prepareReservationForPDF.mockResolvedValue({ id: 'r1' });
        (pdfService.generateReservationPDF as jest.Mock).mockResolvedValue(Buffer.from('pdf'));
        const response = res();
        await controller.downloadPDF(req({ params: { id: 'r1' } }), response);
        expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        expect(response.send).toHaveBeenCalled();
      });
    });

    describe('getReservationById edge', () => {
      it('should throw notFound when null', async () => {
        svc.getReservationById.mockResolvedValue(null);
        const response = res();
        await expect(controller.getReservationById(req({ params: { id: 'x' } }), response)).rejects.toThrow(/Nie znaleziono/i);
      });
    });
  });
});
