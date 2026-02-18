/**
 * ReservationController — Branch Coverage Tests
 * Target: 61.84% → ~90%+ branches
 * Covers: createReservation validation, checkAvailability, updateReservation reason,
 *         updateStatus/cancel paid deposits, getReservations archived
 */

const mockPrismaInstance = {
  reservation: { findMany: jest.fn() },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaInstance),
}));

jest.mock('../../../services/reservation.service', () => ({
  __esModule: true,
  default: {
    createReservation: jest.fn(),
    getReservations: jest.fn().mockResolvedValue([]),
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

const svc = reservationService as any;
const depSvc = depositService as any;
const pdfSvc = pdfService as any;
const ctrl = new ReservationController();

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
  user: { id: 'user-001' },
  ...overrides,
});
const res = () => {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn();
  r.send = jest.fn();
  return r;
};

beforeEach(() => jest.clearAllMocks());

describe('ReservationController — branches', () => {

  // ═══ createReservation validation ═══
  describe('createReservation()', () => {
    it('should throw unauthorized when no userId', async () => {
      await expect(ctrl.createReservation(req({ user: {} }), res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when missing hallId/clientId/eventTypeId', async () => {
      await expect(ctrl.createReservation(req({ body: {} }), res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when neither new nor legacy format', async () => {
      await expect(ctrl.createReservation(req({ body: { hallId: 'h', clientId: 'c', eventTypeId: 'e' } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when guest counts missing', async () => {
      await expect(ctrl.createReservation(req({
        body: { hallId: 'h', clientId: 'c', eventTypeId: 'e', startDateTime: '2027-01-01T10:00', endDateTime: '2027-01-01T20:00' }
      }), res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when all guests are 0', async () => {
      await expect(ctrl.createReservation(req({
        body: { hallId: 'h', clientId: 'c', eventTypeId: 'e', startDateTime: '2027-01-01T10:00', endDateTime: '2027-01-01T20:00', adults: 0, children: 0, toddlers: 0 }
      }), res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when no menuPackage and prices missing', async () => {
      await expect(ctrl.createReservation(req({
        body: { hallId: 'h', clientId: 'c', eventTypeId: 'e', startDateTime: '2027-01-01T10:00', endDateTime: '2027-01-01T20:00', adults: 10, children: 5, toddlers: 2 }
      }), res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when menuPackageId AND manual prices both provided', async () => {
      await expect(ctrl.createReservation(req({
        body: { hallId: 'h', clientId: 'c', eventTypeId: 'e', startDateTime: '2027-01-01T10:00', endDateTime: '2027-01-01T20:00', adults: 10, children: 5, toddlers: 2, menuPackageId: 'pkg-1', pricePerAdult: 200 }
      }), res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should succeed with menuPackageId (message includes menu package)', async () => {
      svc.createReservation.mockResolvedValue({ id: 'res-1' });
      const r = res();
      await ctrl.createReservation(req({
        body: { hallId: 'h', clientId: 'c', eventTypeId: 'e', startDateTime: '2027-01-01T10:00', endDateTime: '2027-01-01T20:00', adults: 10, children: 5, toddlers: 2, menuPackageId: 'pkg-1' }
      }), r);
      expect(r.status).toHaveBeenCalledWith(201);
      expect(r.json.mock.calls[0][0].message).toContain('menu package');
    });

    it('should succeed without menuPackageId (manual prices)', async () => {
      svc.createReservation.mockResolvedValue({ id: 'res-1' });
      const r = res();
      await ctrl.createReservation(req({
        body: { hallId: 'h', clientId: 'c', eventTypeId: 'e', startDateTime: '2027-01-01T10:00', endDateTime: '2027-01-01T20:00', adults: 10, children: 5, toddlers: 2, pricePerAdult: 200, pricePerChild: 100 }
      }), r);
      expect(r.status).toHaveBeenCalledWith(201);
      expect(r.json.mock.calls[0][0].message).not.toContain('menu package');
    });

    it('should accept legacy format', async () => {
      svc.createReservation.mockResolvedValue({ id: 'res-1' });
      const r = res();
      await ctrl.createReservation(req({
        body: { hallId: 'h', clientId: 'c', eventTypeId: 'e', date: '2027-12-15', startTime: '14:00', endTime: '22:00', adults: 10, children: 5, toddlers: 2, pricePerAdult: 200, pricePerChild: 100 }
      }), r);
      expect(r.status).toHaveBeenCalledWith(201);
    });
  });

  // ═══ getReservations — archived param ═══
  describe('getReservations()', () => {
    it('should parse archived=true', async () => {
      svc.getReservations.mockResolvedValue([]);
      const r = res();
      await ctrl.getReservations(req({ query: { archived: 'true' } }), r);
      expect(svc.getReservations).toHaveBeenCalledWith(expect.objectContaining({ archived: true }));
    });

    it('should parse archived=false', async () => {
      svc.getReservations.mockResolvedValue([]);
      const r = res();
      await ctrl.getReservations(req({ query: { archived: 'false' } }), r);
      expect(svc.getReservations).toHaveBeenCalledWith(expect.objectContaining({ archived: false }));
    });

    it('should parse archived=undefined', async () => {
      svc.getReservations.mockResolvedValue([]);
      const r = res();
      await ctrl.getReservations(req({ query: {} }), r);
      expect(svc.getReservations).toHaveBeenCalledWith(expect.objectContaining({ archived: undefined }));
    });
  });

  // ═══ checkAvailability ═══
  describe('checkAvailability()', () => {
    it('should throw 400 when missing params', async () => {
      await expect(ctrl.checkAvailability(req({ query: {} }), res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 on invalid dates', async () => {
      await expect(ctrl.checkAvailability(req({ query: { hallId: 'h', startDateTime: 'bad', endDateTime: 'bad' } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when end <= start', async () => {
      await expect(ctrl.checkAvailability(req({ query: { hallId: 'h', startDateTime: '2027-01-01T20:00', endDateTime: '2027-01-01T10:00' } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should return available=true when no conflicts', async () => {
      mockPrismaInstance.reservation.findMany.mockResolvedValue([]);
      const r = res();
      await ctrl.checkAvailability(req({ query: { hallId: 'h', startDateTime: '2027-06-01T10:00', endDateTime: '2027-06-01T20:00' } }), r);
      expect(r.json.mock.calls[0][0].data.available).toBe(true);
    });

    it('should return conflicts with formatted data', async () => {
      mockPrismaInstance.reservation.findMany.mockResolvedValue([
        { id: 'c1', startDateTime: new Date('2027-06-01T12:00'), endDateTime: new Date('2027-06-01T18:00'), status: 'CONFIRMED', client: { firstName: 'Jan', lastName: 'Kowalski' }, eventType: { name: 'Wesele' } },
      ]);
      const r = res();
      await ctrl.checkAvailability(req({ query: { hallId: 'h', startDateTime: '2027-06-01T10:00', endDateTime: '2027-06-01T20:00' } }), r);
      expect(r.json.mock.calls[0][0].data.available).toBe(false);
      expect(r.json.mock.calls[0][0].data.conflicts[0].clientName).toBe('Jan Kowalski');
    });

    it('should handle null client and eventType in conflicts', async () => {
      mockPrismaInstance.reservation.findMany.mockResolvedValue([
        { id: 'c1', startDateTime: null, endDateTime: null, status: 'PENDING', client: null, eventType: null },
      ]);
      const r = res();
      await ctrl.checkAvailability(req({ query: { hallId: 'h', startDateTime: '2027-06-01T10:00', endDateTime: '2027-06-01T20:00' } }), r);
      const conflict = r.json.mock.calls[0][0].data.conflicts[0];
      expect(conflict.clientName).toBe('Nieznany');
      expect(conflict.eventType).toBe('Nieznany');
    });

    it('should pass excludeReservationId when provided', async () => {
      mockPrismaInstance.reservation.findMany.mockResolvedValue([]);
      const r = res();
      await ctrl.checkAvailability(req({ query: { hallId: 'h', startDateTime: '2027-06-01T10:00', endDateTime: '2027-06-01T20:00', excludeReservationId: 'res-x' } }), r);
      const where = mockPrismaInstance.reservation.findMany.mock.calls[0][0].where;
      expect(where.id).toEqual({ not: 'res-x' });
    });

    it('should not include id filter when excludeReservationId absent', async () => {
      mockPrismaInstance.reservation.findMany.mockResolvedValue([]);
      const r = res();
      await ctrl.checkAvailability(req({ query: { hallId: 'h', startDateTime: '2027-06-01T10:00', endDateTime: '2027-06-01T20:00' } }), r);
      const where = mockPrismaInstance.reservation.findMany.mock.calls[0][0].where;
      expect(where.id).toBeUndefined();
    });
  });

  // ═══ updateReservation — reason requirement ═══
  describe('updateReservation()', () => {
    it('should throw unauthorized when no userId', async () => {
      await expect(ctrl.updateReservation(req({ user: {}, params: { id: 'r1' } }), res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when important change without reason', async () => {
      await expect(ctrl.updateReservation(req({ params: { id: 'r1' }, body: { adults: 20 } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when important change with short reason', async () => {
      await expect(ctrl.updateReservation(req({ params: { id: 'r1' }, body: { adults: 20, reason: 'abc' } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should succeed with important change and valid reason', async () => {
      svc.updateReservation.mockResolvedValue({ id: 'r1' });
      const r = res();
      await ctrl.updateReservation(req({ params: { id: 'r1' }, body: { adults: 20, reason: 'Klient zmieni\u0142 liczb\u0119 go\u015Bci' } }), r);
      expect(r.status).toHaveBeenCalledWith(200);
    });

    it('should succeed with non-important change without reason', async () => {
      svc.updateReservation.mockResolvedValue({ id: 'r1' });
      const r = res();
      await ctrl.updateReservation(req({ params: { id: 'r1' }, body: { notes: 'Notatka' } }), r);
      expect(r.status).toHaveBeenCalledWith(200);
    });

    it('should detect all important fields', async () => {
      for (const field of ['startDateTime', 'endDateTime', 'pricePerAdult', 'pricePerChild', 'pricePerToddler', 'children', 'toddlers']) {
        await expect(ctrl.updateReservation(req({ params: { id: 'r1' }, body: { [field]: 1 } }), res()))
          .rejects.toMatchObject({ statusCode: 400 });
      }
    });
  });

  // ═══ updateStatus — paid deposits block ═══
  describe('updateStatus()', () => {
    it('should throw unauthorized when no userId', async () => {
      await expect(ctrl.updateStatus(req({ user: {}, params: { id: 'r1' } }), res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 400 when status missing', async () => {
      await expect(ctrl.updateStatus(req({ params: { id: 'r1' }, body: {} }), res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should block CANCELLED when paid deposits exist', async () => {
      depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({ hasPaidDeposits: true, paidCount: 2, paidTotal: 1500 });
      await expect(ctrl.updateStatus(req({ params: { id: 'r1' }, body: { status: 'CANCELLED' } }), res()))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('should allow CANCELLED when no paid deposits', async () => {
      depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({ hasPaidDeposits: false, paidCount: 0, paidTotal: 0 });
      svc.updateStatus.mockResolvedValue({ id: 'r1', status: 'CANCELLED' });
      const r = res();
      await ctrl.updateStatus(req({ params: { id: 'r1' }, body: { status: 'CANCELLED' } }), r);
      expect(r.status).toHaveBeenCalledWith(200);
    });

    it('should skip deposit check for non-CANCELLED status', async () => {
      svc.updateStatus.mockResolvedValue({ id: 'r1', status: 'CONFIRMED' });
      const r = res();
      await ctrl.updateStatus(req({ params: { id: 'r1' }, body: { status: 'CONFIRMED' } }), r);
      expect(depSvc.checkPaidDepositsBeforeCancel).not.toHaveBeenCalled();
    });
  });

  // ═══ cancelReservation — paid deposits block ═══
  describe('cancelReservation()', () => {
    it('should throw unauthorized when no userId', async () => {
      await expect(ctrl.cancelReservation(req({ user: {}, params: { id: 'r1' } }), res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should block when paid deposits exist', async () => {
      depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({ hasPaidDeposits: true, paidCount: 1, paidTotal: 500 });
      await expect(ctrl.cancelReservation(req({ params: { id: 'r1' } }), res())).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should succeed when no paid deposits', async () => {
      depSvc.checkPaidDepositsBeforeCancel.mockResolvedValue({ hasPaidDeposits: false, paidCount: 0, paidTotal: 0 });
      svc.cancelReservation.mockResolvedValue(undefined);
      const r = res();
      await ctrl.cancelReservation(req({ params: { id: 'r1' }, body: { reason: 'Test' } }), r);
      expect(r.status).toHaveBeenCalledWith(200);
    });
  });

  // ═══ downloadPDF ═══
  describe('downloadPDF()', () => {
    it('should throw 404 when not found', async () => {
      svc.getReservationById.mockResolvedValue(null);
      await expect(ctrl.downloadPDF(req({ params: { id: 'bad' } }), res())).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should send PDF buffer on success', async () => {
      svc.getReservationById.mockResolvedValue({ id: 'r1' });
      pdfSvc.generateReservationPDF.mockResolvedValue(Buffer.from('pdf-content'));
      const r = res();
      await ctrl.downloadPDF(req({ params: { id: 'r1' } }), r);
      expect(r.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(r.send).toHaveBeenCalled();
    });
  });

  // ═══ archive/unarchive ═══
  describe('archiveReservation()', () => {
    it('should throw unauthorized when no userId', async () => {
      await expect(ctrl.archiveReservation(req({ user: {}, params: { id: 'r1' } }), res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should succeed', async () => {
      svc.archiveReservation.mockResolvedValue(undefined);
      const r = res();
      await ctrl.archiveReservation(req({ params: { id: 'r1' }, body: { reason: 'Test' } }), r);
      expect(r.status).toHaveBeenCalledWith(200);
    });
  });

  describe('unarchiveReservation()', () => {
    it('should throw unauthorized when no userId', async () => {
      await expect(ctrl.unarchiveReservation(req({ user: {}, params: { id: 'r1' } }), res())).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should succeed', async () => {
      svc.unarchiveReservation.mockResolvedValue(undefined);
      const r = res();
      await ctrl.unarchiveReservation(req({ params: { id: 'r1' }, body: { reason: 'Restore' } }), r);
      expect(r.status).toHaveBeenCalledWith(200);
    });
  });
});
