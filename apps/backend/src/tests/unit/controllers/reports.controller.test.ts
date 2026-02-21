/**
 * ReportsController — Comprehensive Unit Tests
 * Uses real zod validation (inline schemas in controller).
 */

jest.mock('../../../services/reports.service', () => ({
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
import reportsService from '../../../services/reports.service';
import reportsExportService from '../../../services/reports-export.service';

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

const VALID_REVENUE_Q = { dateFrom: '2026-01-01', dateTo: '2026-12-31' };
const VALID_OCCUPANCY_Q = { dateFrom: '2026-01-01', dateTo: '2026-12-31' };
const REVERSED_Q = { dateFrom: '2026-12-31', dateTo: '2026-01-01' };
const INVALID_Q = { dateFrom: 'bad', dateTo: 'nope' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ReportsController', () => {
  // ========== getRevenueReport ==========
  describe('getRevenueReport()', () => {
    it('should return 400 on invalid query', async () => {
      const response = res();
      await ctrl.getRevenueReport(req({ query: INVALID_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.getRevenueReport(req({ query: REVERSED_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('dateFrom') })
      );
    });

    it('should return 200 with report', async () => {
      svc.getRevenueReport.mockResolvedValue({ total: 100000 });
      const response = res();
      await ctrl.getRevenueReport(req({ query: VALID_REVENUE_Q }), response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { total: 100000 } })
      );
    });

    it('should return 500 on error', async () => {
      svc.getRevenueReport.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.getRevenueReport(req({ query: VALID_REVENUE_Q }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== getOccupancyReport ==========
  describe('getOccupancyReport()', () => {
    it('should return 400 on invalid query', async () => {
      const response = res();
      await ctrl.getOccupancyReport(req({ query: INVALID_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.getOccupancyReport(req({ query: REVERSED_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 with report', async () => {
      svc.getOccupancyReport.mockResolvedValue({ occupancy: 85 });
      const response = res();
      await ctrl.getOccupancyReport(req({ query: VALID_OCCUPANCY_Q }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      svc.getOccupancyReport.mockRejectedValue(new Error('db'));
      const response = res();
      await ctrl.getOccupancyReport(req({ query: VALID_OCCUPANCY_Q }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== exportRevenueExcel ==========
  describe('exportRevenueExcel()', () => {
    it('should return 400 on invalid query', async () => {
      const response = res();
      await ctrl.exportRevenueExcel(req({ query: INVALID_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.exportRevenueExcel(req({ query: REVERSED_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should send Excel file', async () => {
      svc.getRevenueReport.mockResolvedValue({ total: 50000 });
      exportSvc.exportRevenueToExcel.mockResolvedValue(Buffer.from('xlsx'));
      const response = res();
      await ctrl.exportRevenueExcel(req({ query: VALID_REVENUE_Q }), response);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheetml'));
      expect(response.send).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      svc.getRevenueReport.mockRejectedValue(new Error('fail'));
      const response = res();
      await ctrl.exportRevenueExcel(req({ query: VALID_REVENUE_Q }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== exportRevenuePDF ==========
  describe('exportRevenuePDF()', () => {
    it('should return 400 on invalid query', async () => {
      const response = res();
      await ctrl.exportRevenuePDF(req({ query: INVALID_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.exportRevenuePDF(req({ query: REVERSED_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should send PDF file', async () => {
      svc.getRevenueReport.mockResolvedValue({ total: 50000 });
      exportSvc.exportRevenueToPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.exportRevenuePDF(req({ query: VALID_REVENUE_Q }), response);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(response.send).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      svc.getRevenueReport.mockRejectedValue(new Error('fail'));
      const response = res();
      await ctrl.exportRevenuePDF(req({ query: VALID_REVENUE_Q }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== exportOccupancyExcel ==========
  describe('exportOccupancyExcel()', () => {
    it('should return 400 on invalid query', async () => {
      const response = res();
      await ctrl.exportOccupancyExcel(req({ query: INVALID_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.exportOccupancyExcel(req({ query: REVERSED_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should send Excel file', async () => {
      svc.getOccupancyReport.mockResolvedValue({ occupancy: 70 });
      exportSvc.exportOccupancyToExcel.mockResolvedValue(Buffer.from('xlsx'));
      const response = res();
      await ctrl.exportOccupancyExcel(req({ query: VALID_OCCUPANCY_Q }), response);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheetml'));
      expect(response.send).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      svc.getOccupancyReport.mockRejectedValue(new Error('fail'));
      const response = res();
      await ctrl.exportOccupancyExcel(req({ query: VALID_OCCUPANCY_Q }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  // ========== exportOccupancyPDF ==========
  describe('exportOccupancyPDF()', () => {
    it('should return 400 on invalid query', async () => {
      const response = res();
      await ctrl.exportOccupancyPDF(req({ query: INVALID_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when dateFrom > dateTo', async () => {
      const response = res();
      await ctrl.exportOccupancyPDF(req({ query: REVERSED_Q }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should send PDF file', async () => {
      svc.getOccupancyReport.mockResolvedValue({ occupancy: 70 });
      exportSvc.exportOccupancyToPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await ctrl.exportOccupancyPDF(req({ query: VALID_OCCUPANCY_Q }), response);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(response.send).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      svc.getOccupancyReport.mockRejectedValue(new Error('fail'));
      const response = res();
      await ctrl.exportOccupancyPDF(req({ query: VALID_OCCUPANCY_Q }), response);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });
});
