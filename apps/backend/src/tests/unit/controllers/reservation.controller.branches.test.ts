/**
 * Reservation Controller — Branch coverage tests
 * Minimal PrismaClient mock for safe module loading.
 * Tests all validation branches + checkAvailability formatting.
 */

const mockFindMany = jest.fn().mockResolvedValue([]);

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    reservation: { findMany: mockFindMany },
  })),
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

jest.mock('../../../utils/AppError', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
    static unauthorized(msg?: string) { return new MockAppError(msg || 'Unauthorized', 401); }
    static badRequest(msg: string) { return new MockAppError(msg, 400); }
    static notFound(entity: string) { return new MockAppError(`${entity} not found`, 404); }
  }
  return { AppError: MockAppError };
});

import { ReservationController } from '../../../controllers/reservation.controller';
import reservationService from '../../../services/reservation.service';
import depositService from '../../../services/deposit.service';
import { pdfService } from '../../../services/pdf.service';

const ctrl = new ReservationController();
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.send = jest.fn();
  return res;
};

const BASE_BODY = {
  hallId: 'h1', clientId: 'c1', eventTypeId: 'e1',
  startDateTime: '2026-03-01T10:00:00Z', endDateTime: '2026-03-01T18:00:00Z',
  adults: 50, children: 10, toddlers: 5,
  pricePerAdult: 150, pricePerChild: 80,
};

describe('ReservationController branches', () => {
  beforeEach(() => jest.clearAllMocks());

  // ===== createReservation =====
  describe('createReservation', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { body: BASE_BODY, user: undefined } as any;
      await expect(ctrl.createReservation(req, mockRes())).rejects.toThrow('Unauthorized');
    });

    it('should throw when missing hallId', async () => {
      const req = { body: { ...BASE_BODY, hallId: undefined }, user: { id: 'u1' } } as any;
      await expect(ctrl.createReservation(req, mockRes())).rejects.toThrow('Hall');
    });

    it('should throw when missing clientId', async () => {
      const req = { body: { ...BASE_BODY, clientId: '' }, user: { id: 'u1' } } as any;
      await expect(ctrl.createReservation(req, mockRes())).rejects.toThrow('Hall');
    });

    it('should throw when no date format', async () => {
      const req = {
        body: { ...BASE_BODY, startDateTime: undefined, endDateTime: undefined },
        user: { id: 'u1' }
      } as any;
      await expect(ctrl.createReservation(req, mockRes())).rejects.toThrow('startDateTime');
    });

    it('should accept legacy date format', async () => {
      (reservationService.createReservation as jest.Mock).mockResolvedValue({ id: 'r1' });
      const req = {
        body: {
          ...BASE_BODY,
          startDateTime: undefined, endDateTime: undefined,
          date: '2026-03-01', startTime: '10:00', endTime: '18:00',
        },
        user: { id: 'u1' }
      } as any;
      const res = mockRes();
      await ctrl.createReservation(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should throw when guest counts missing (adults undefined)', async () => {
      const req = {
        body: { ...BASE_BODY, adults: undefined },
        user: { id: 'u1' }
      } as any;
      await expect(ctrl.createReservation(req, mockRes())).rejects.toThrow('Guest counts');
    });

    it('should throw when all guests are zero', async () => {
      const req = {
        body: { ...BASE_BODY, adults: 0, children: 0, toddlers: 0 },
        user: { id: 'u1' }
      } as any;
      await expect(ctrl.createReservation(req, mockRes())).rejects.toThrow('At least one guest');
    });

    it('should throw when no menuPackage and no prices', async () => {
      const req = {
        body: { ...BASE_BODY, pricePerAdult: undefined, pricePerChild: undefined },
        user: { id: 'u1' }
      } as any;
      await expect(ctrl.createReservation(req, mockRes())).rejects.toThrow('pricePerAdult');
    });

    it('should throw when both menuPackageId and manual prices', async () => {
      const req = {
        body: { ...BASE_BODY, menuPackageId: 'mp1' },
        user: { id: 'u1' }
      } as any;
      await expect(ctrl.createReservation(req, mockRes())).rejects.toThrow('Cannot specify both');
    });

    it('should succeed with menuPackageId (no manual prices)', async () => {
      (reservationService.createReservation as jest.Mock).mockResolvedValue({ id: 'r1' });
      const req = {
        body: { ...BASE_BODY, pricePerAdult: undefined, pricePerChild: undefined, menuPackageId: 'mp1' },
        user: { id: 'u1' }
      } as any;
      const res = mockRes();
      await ctrl.createReservation(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('menu package'),
      }));
    });

    it('should succeed without menuPackageId', async () => {
      (reservationService.createReservation as jest.Mock).mockResolvedValue({ id: 'r1' });
      const req = { body: BASE_BODY, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.createReservation(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Reservation created successfully',
      }));
    });
  });

  // ===== checkAvailability =====
  describe('checkAvailability', () => {
    it('should throw when missing params', async () => {
      const req = { query: {} } as any;
      await expect(ctrl.checkAvailability(req, mockRes())).rejects.toThrow('hallId');
    });

    it('should throw on invalid date format', async () => {
      const req = { query: { hallId: 'h1', startDateTime: 'bad', endDateTime: 'bad' } } as any;
      await expect(ctrl.checkAvailability(req, mockRes())).rejects.toThrow('Invalid date');
    });

    it('should throw when end <= start', async () => {
      const req = {
        query: { hallId: 'h1', startDateTime: '2026-03-01T18:00:00Z', endDateTime: '2026-03-01T10:00:00Z' }
      } as any;
      await expect(ctrl.checkAvailability(req, mockRes())).rejects.toThrow('after');
    });

    it('should return available=true when no conflicts', async () => {
      mockFindMany.mockResolvedValue([]);
      const req = {
        query: { hallId: 'h1', startDateTime: '2026-03-01T10:00:00Z', endDateTime: '2026-03-01T18:00:00Z' }
      } as any;
      const res = mockRes();
      await ctrl.checkAvailability(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ available: true, conflicts: [] }),
      }));
    });

    it('should format conflicts with null client/eventType', async () => {
      mockFindMany.mockResolvedValue([{
        id: 'r1',
        client: null,
        eventType: null,
        startDateTime: null,
        endDateTime: null,
        status: 'CONFIRMED',
      }]);
      const req = {
        query: { hallId: 'h1', startDateTime: '2026-03-01T10:00:00Z', endDateTime: '2026-03-01T18:00:00Z' }
      } as any;
      const res = mockRes();
      await ctrl.checkAvailability(req, res);
      const data = res.json.mock.calls[0][0].data;
      expect(data.available).toBe(false);
      expect(data.conflicts[0].clientName).toBe('Nieznany');
      expect(data.conflicts[0].eventType).toBe('Nieznany');
      expect(data.conflicts[0].startDateTime).toBe('');
      expect(data.conflicts[0].endDateTime).toBe('');
    });

    it('should format conflicts with client and eventType', async () => {
      mockFindMany.mockResolvedValue([{
        id: 'r2',
        client: { firstName: 'Jan', lastName: 'Kowalski' },
        eventType: { name: 'Wesele' },
        startDateTime: new Date('2026-03-01T10:00:00Z'),
        endDateTime: new Date('2026-03-01T18:00:00Z'),
        status: 'CONFIRMED',
      }]);
      const req = {
        query: { hallId: 'h1', startDateTime: '2026-03-01T10:00:00Z', endDateTime: '2026-03-01T18:00:00Z' }
      } as any;
      const res = mockRes();
      await ctrl.checkAvailability(req, res);
      const c = res.json.mock.calls[0][0].data.conflicts[0];
      expect(c.clientName).toBe('Jan Kowalski');
      expect(c.eventType).toBe('Wesele');
    });

    it('should pass excludeReservationId when provided', async () => {
      mockFindMany.mockResolvedValue([]);
      const req = {
        query: {
          hallId: 'h1',
          startDateTime: '2026-03-01T10:00:00Z',
          endDateTime: '2026-03-01T18:00:00Z',
          excludeReservationId: 'r-exclude',
        }
      } as any;
      const res = mockRes();
      await ctrl.checkAvailability(req, res);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'r-exclude' },
          }),
        })
      );
    });

    it('should not include id filter without excludeReservationId', async () => {
      mockFindMany.mockResolvedValue([]);
      const req = {
        query: { hallId: 'h1', startDateTime: '2026-03-01T10:00:00Z', endDateTime: '2026-03-01T18:00:00Z' }
      } as any;
      await ctrl.checkAvailability(req, mockRes());
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.id).toBeUndefined();
    });
  });

  // ===== getReservations =====
  describe('getReservations', () => {
    it('should pass archived=true', async () => {
      (reservationService.getReservations as jest.Mock).mockResolvedValue([]);
      const req = { query: { archived: 'true' } } as any;
      await ctrl.getReservations(req, mockRes());
      expect(reservationService.getReservations).toHaveBeenCalledWith(
        expect.objectContaining({ archived: true })
      );
    });

    it('should pass archived=false', async () => {
      (reservationService.getReservations as jest.Mock).mockResolvedValue([]);
      const req = { query: { archived: 'false' } } as any;
      await ctrl.getReservations(req, mockRes());
      expect(reservationService.getReservations).toHaveBeenCalledWith(
        expect.objectContaining({ archived: false })
      );
    });

    it('should pass archived=undefined when not set', async () => {
      (reservationService.getReservations as jest.Mock).mockResolvedValue([]);
      const req = { query: {} } as any;
      await ctrl.getReservations(req, mockRes());
      expect(reservationService.getReservations).toHaveBeenCalledWith(
        expect.objectContaining({ archived: undefined })
      );
    });
  });

  // ===== getReservationById =====
  describe('getReservationById', () => {
    it('should throw notFound when null', async () => {
      (reservationService.getReservationById as jest.Mock).mockResolvedValue(null);
      const req = { params: { id: 'x' } } as any;
      await expect(ctrl.getReservationById(req, mockRes())).rejects.toThrow('nie znaleziono');
    });
  });

  // ===== downloadPDF =====
  describe('downloadPDF', () => {
    it('should throw notFound when reservation missing', async () => {
      (reservationService.getReservationById as jest.Mock).mockResolvedValue(null);
      const req = { params: { id: 'x' } } as any;
      await expect(ctrl.downloadPDF(req, mockRes())).rejects.toThrow('nie znaleziono');
    });

    it('should return PDF buffer', async () => {
      (reservationService.getReservationById as jest.Mock).mockResolvedValue({ id: 'r1' });
      (pdfService.generateReservationPDF as jest.Mock).mockResolvedValue(Buffer.from('pdf'));
      const req = { params: { id: 'r1' } } as any;
      const res = mockRes();
      await ctrl.downloadPDF(req, res);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.send).toHaveBeenCalled();
    });
  });

  // ===== updateReservation =====
  describe('updateReservation', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'r1' }, body: {}, user: undefined } as any;
      await expect(ctrl.updateReservation(req, mockRes())).rejects.toThrow('Unauthorized');
    });

    it('should throw when important changes without reason', async () => {
      const req = {
        params: { id: 'r1' },
        body: { adults: 100 },
        user: { id: 'u1' }
      } as any;
      await expect(ctrl.updateReservation(req, mockRes())).rejects.toThrow('Reason');
    });

    it('should throw when reason too short', async () => {
      const req = {
        params: { id: 'r1' },
        body: { adults: 100, reason: 'short' },
        user: { id: 'u1' }
      } as any;
      await expect(ctrl.updateReservation(req, mockRes())).rejects.toThrow('Reason');
    });

    it('should allow non-important changes without reason', async () => {
      (reservationService.updateReservation as jest.Mock).mockResolvedValue({ id: 'r1' });
      const req = {
        params: { id: 'r1' },
        body: { notes: 'some notes' },
        user: { id: 'u1' }
      } as any;
      const res = mockRes();
      await ctrl.updateReservation(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should allow important changes with valid reason', async () => {
      (reservationService.updateReservation as jest.Mock).mockResolvedValue({ id: 'r1' });
      const req = {
        params: { id: 'r1' },
        body: { pricePerAdult: 200, reason: 'Customer requested price change for new menu' },
        user: { id: 'u1' }
      } as any;
      const res = mockRes();
      await ctrl.updateReservation(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should detect startDateTime as important', async () => {
      const req = {
        params: { id: 'r1' },
        body: { startDateTime: '2026-04-01T10:00:00Z' },
        user: { id: 'u1' }
      } as any;
      await expect(ctrl.updateReservation(req, mockRes())).rejects.toThrow('Reason');
    });

    it('should detect endDateTime as important', async () => {
      const req = {
        params: { id: 'r1' },
        body: { endDateTime: '2026-04-01T18:00:00Z' },
        user: { id: 'u1' }
      } as any;
      await expect(ctrl.updateReservation(req, mockRes())).rejects.toThrow('Reason');
    });

    it('should detect children as important', async () => {
      const req = { params: { id: 'r1' }, body: { children: 20 }, user: { id: 'u1' } } as any;
      await expect(ctrl.updateReservation(req, mockRes())).rejects.toThrow('Reason');
    });

    it('should detect toddlers as important', async () => {
      const req = { params: { id: 'r1' }, body: { toddlers: 5 }, user: { id: 'u1' } } as any;
      await expect(ctrl.updateReservation(req, mockRes())).rejects.toThrow('Reason');
    });

    it('should detect pricePerChild as important', async () => {
      const req = { params: { id: 'r1' }, body: { pricePerChild: 100 }, user: { id: 'u1' } } as any;
      await expect(ctrl.updateReservation(req, mockRes())).rejects.toThrow('Reason');
    });

    it('should detect pricePerToddler as important', async () => {
      const req = { params: { id: 'r1' }, body: { pricePerToddler: 50 }, user: { id: 'u1' } } as any;
      await expect(ctrl.updateReservation(req, mockRes())).rejects.toThrow('Reason');
    });
  });

  // ===== updateStatus =====
  describe('updateStatus', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'r1' }, body: { status: 'CONFIRMED' }, user: undefined } as any;
      await expect(ctrl.updateStatus(req, mockRes())).rejects.toThrow('Unauthorized');
    });

    it('should throw when status missing', async () => {
      const req = { params: { id: 'r1' }, body: {}, user: { id: 'u1' } } as any;
      await expect(ctrl.updateStatus(req, mockRes())).rejects.toThrow('Status is required');
    });

    it('should block cancel with paid deposits', async () => {
      (depositService.checkPaidDepositsBeforeCancel as jest.Mock).mockResolvedValue({
        hasPaidDeposits: true, paidCount: 2, paidTotal: 1000,
      });
      const req = { params: { id: 'r1' }, body: { status: 'CANCELLED' }, user: { id: 'u1' } } as any;
      await expect(ctrl.updateStatus(req, mockRes())).rejects.toThrow('zaliczkami');
    });

    it('should allow cancel without paid deposits', async () => {
      (depositService.checkPaidDepositsBeforeCancel as jest.Mock).mockResolvedValue({
        hasPaidDeposits: false, paidCount: 0, paidTotal: 0,
      });
      (reservationService.updateStatus as jest.Mock).mockResolvedValue({ id: 'r1' });
      const req = { params: { id: 'r1' }, body: { status: 'CANCELLED' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should not check deposits for non-cancel status', async () => {
      (reservationService.updateStatus as jest.Mock).mockResolvedValue({ id: 'r1' });
      const req = { params: { id: 'r1' }, body: { status: 'CONFIRMED' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.updateStatus(req, res);
      expect(depositService.checkPaidDepositsBeforeCancel).not.toHaveBeenCalled();
    });
  });

  // ===== cancelReservation =====
  describe('cancelReservation', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'r1' }, body: {}, user: undefined } as any;
      await expect(ctrl.cancelReservation(req, mockRes())).rejects.toThrow('Unauthorized');
    });

    it('should block when paid deposits exist', async () => {
      (depositService.checkPaidDepositsBeforeCancel as jest.Mock).mockResolvedValue({
        hasPaidDeposits: true, paidCount: 1, paidTotal: 500,
      });
      const req = { params: { id: 'r1' }, body: { reason: 'test' }, user: { id: 'u1' } } as any;
      await expect(ctrl.cancelReservation(req, mockRes())).rejects.toThrow('zaliczkami');
    });

    it('should cancel successfully', async () => {
      (depositService.checkPaidDepositsBeforeCancel as jest.Mock).mockResolvedValue({
        hasPaidDeposits: false, paidCount: 0, paidTotal: 0,
      });
      (reservationService.cancelReservation as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { id: 'r1' }, body: { reason: 'test' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.cancelReservation(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ===== archiveReservation =====
  describe('archiveReservation', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'r1' }, body: {}, user: undefined } as any;
      await expect(ctrl.archiveReservation(req, mockRes())).rejects.toThrow('Unauthorized');
    });

    it('should archive successfully', async () => {
      (reservationService.archiveReservation as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { id: 'r1' }, body: { reason: 'done' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.archiveReservation(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ===== unarchiveReservation =====
  describe('unarchiveReservation', () => {
    it('should throw unauthorized when no userId', async () => {
      const req = { params: { id: 'r1' }, body: {}, user: undefined } as any;
      await expect(ctrl.unarchiveReservation(req, mockRes())).rejects.toThrow('Unauthorized');
    });

    it('should unarchive successfully', async () => {
      (reservationService.unarchiveReservation as jest.Mock).mockResolvedValue(undefined);
      const req = { params: { id: 'r1' }, body: { reason: 'reopen' }, user: { id: 'u1' } } as any;
      const res = mockRes();
      await ctrl.unarchiveReservation(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
