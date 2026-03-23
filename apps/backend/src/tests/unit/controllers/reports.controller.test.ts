/**
 * ReportsController — Comprehensive Unit Tests
 * Uses real zod validation (inline schemas in controller).
 */

jest.mock('../../../services/reports', () => ({
  __esModule: true,
  default: {
    getRevenueReport: jest.fn(),
    getOccupancyReport: jest.fn(),
  },
}));

jest.mock('../../../services/reports-export.service', () => ({
  __esModule: true,
  default: {
    exportRevenueToExcel: jest.fn(),
    exportRevenueToPDF: jest.fn(),
    exportOccupancyToExcel: jest.fn(),
    exportOccupancyToPDF: jest.fn(),
  },
}));

import { ReportsController } from '../../../controllers/reports.controller';
import reportsService from '../../../services/reports';
import reportsExportService from '../../../services/reports-export.service';
import { AppError } from '../../../utils/AppError';

const ctrl = new ReportsController();
const svc = reportsService as any;
const exportSvc = reportsExportService as any;

const req = (overrides: any = {}): any => ({
  body: {}, params: {}, query: {},
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

let mockNext: jest.Mock;

const VALID_REVENUE_Q = { dateFrom: '2026-01-01', dateTo: '2026-12-31' };
const VALID_OCCUPANCY_Q = { dateFrom: '2026-01-01', dateTo: '2026-12-31' };
const REVERSED_Q = { dateFrom: '2026-12-31', dateTo: '2026-01-01' };
const INVALID_Q = { dateFrom: 'bad', dateTo: 'nope' };

beforeEach(() => {
  jest.clearAllMocks();
  mockNext = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ReportsController', () => {
  // ========== getRevenueReport ==========
  describe('getRevenueReport()', () => {
    it('should pass AppError to next on invalid query', async () => {
      const response = res();
      await ctrl.getRevenueReport(req({ query: INVALID_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should pass AppError to next when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.getRevenueReport(req({ query: REVERSED_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('dateFrom');
    });

    it('should return 200 with report', async () => {
      svc.getRevenueReport.mockResolvedValue({ total: 100000 });
      const response = res();
      await ctrl.getRevenueReport(req({ query: VALID_REVENUE_Q }), response, mockNext);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { total: 100000 } })
      );
    });

    it('should pass error to next on service failure', async () => {
      svc.getRevenueReport.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.getRevenueReport(req({ query: VALID_REVENUE_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========== getOccupancyReport ==========
  describe('getOccupancyReport()', () => {
    it('should pass AppError to next on invalid query', async () => {
      const response = res();
      await ctrl.getOccupancyReport(req({ query: INVALID_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should pass AppError to next when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.getOccupancyReport(req({ query: REVERSED_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should return 200 with report', async () => {
      svc.getOccupancyReport.mockResolvedValue({ occupancy: 85 });
      const response = res();
      await ctrl.getOccupancyReport(req({ query: VALID_OCCUPANCY_Q }), response, mockNext);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should pass error to next on service failure', async () => {
      svc.getOccupancyReport.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.getOccupancyReport(req({ query: VALID_OCCUPANCY_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========== exportRevenueExcel ==========
  describe('exportRevenueExcel()', () => {
    it('should pass AppError to next on invalid query', async () => {
      const response = res();
      await ctrl.exportRevenueExcel(req({ query: INVALID_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should pass AppError to next when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.exportRevenueExcel(req({ query: REVERSED_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should send Excel file', async () => {
      svc.getRevenueReport.mockResolvedValue({ total: 50000 });
      exportSvc.exportRevenueToExcel.mockResolvedValue(Buffer.from('xlsx'));
      const response = res();
      await ctrl.exportRevenueExcel(req({ query: VALID_REVENUE_Q }), response, mockNext);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheetml'));
      expect(response.send).toHaveBeenCalled();
    });

    it('should pass error to next on service failure', async () => {
      svc.getRevenueReport.mockRejectedValue(new Error('fail'));
      const response = res();
      await ctrl.exportRevenueExcel(req({ query: VALID_REVENUE_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========== exportRevenuePDF ==========
  describe('exportRevenuePDF()', () => {
    it('should pass AppError to next on invalid query', async () => {
      const response = res();
      await ctrl.exportRevenuePDF(req({ query: INVALID_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should pass AppError to next when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.exportRevenuePDF(req({ query: REVERSED_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should send PDF file', async () => {
      svc.getRevenueReport.mockResolvedValue({ total: 50000 });
      exportSvc.exportRevenueToPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.exportRevenuePDF(req({ query: VALID_REVENUE_Q }), response, mockNext);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(response.send).toHaveBeenCalled();
    });

    it('should pass error to next on service failure', async () => {
      svc.getRevenueReport.mockRejectedValue(new Error('fail'));
      const response = res();
      await ctrl.exportRevenuePDF(req({ query: VALID_REVENUE_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========== exportOccupancyExcel ==========
  describe('exportOccupancyExcel()', () => {
    it('should pass AppError to next on invalid query', async () => {
      const response = res();
      await ctrl.exportOccupancyExcel(req({ query: INVALID_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should pass AppError to next when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.exportOccupancyExcel(req({ query: REVERSED_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should send Excel file', async () => {
      svc.getOccupancyReport.mockResolvedValue({ occupancy: 70 });
      exportSvc.exportOccupancyToExcel.mockResolvedValue(Buffer.from('xlsx'));
      const response = res();
      await ctrl.exportOccupancyExcel(req({ query: VALID_OCCUPANCY_Q }), response, mockNext);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheetml'));
      expect(response.send).toHaveBeenCalled();
    });

    it('should pass error to next on service failure', async () => {
      svc.getOccupancyReport.mockRejectedValue(new Error('fail'));
      const response = res();
      await ctrl.exportOccupancyExcel(req({ query: VALID_OCCUPANCY_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ========== exportOccupancyPDF ==========
  describe('exportOccupancyPDF()', () => {
    it('should pass AppError to next on invalid query', async () => {
      const response = res();
      await ctrl.exportOccupancyPDF(req({ query: INVALID_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should pass AppError to next when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.exportOccupancyPDF(req({ query: REVERSED_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect((mockNext.mock.calls[0][0] as AppError).statusCode).toBe(400);
    });

    it('should send PDF file', async () => {
      svc.getOccupancyReport.mockResolvedValue({ occupancy: 70 });
      exportSvc.exportOccupancyToPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.exportOccupancyPDF(req({ query: VALID_OCCUPANCY_Q }), response, mockNext);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(response.send).toHaveBeenCalled();
    });

    it('should pass error to next on service failure', async () => {
      svc.getOccupancyReport.mockRejectedValue(new Error('fail'));
      const response = res();
      await ctrl.exportOccupancyPDF(req({ query: VALID_OCCUPANCY_Q }), response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
