/**
 * ReportsController — Unit Tests
 * Uses try/catch + Zod validation + export services.
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

const controller = new ReportsController();
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

beforeEach(() => jest.clearAllMocks());

describe('ReportsController', () => {
  const validRevenueQuery = { dateFrom: '2026-01-01', dateTo: '2026-02-01', groupBy: 'month' };
  const validOccupancyQuery = { dateFrom: '2026-01-01', dateTo: '2026-02-01' };

  describe('getRevenueReport()', () => {
    it('should return 400 on invalid query (bad date)', async () => {
      const response = res();
      await controller.getRevenueReport(req({ query: { dateFrom: 'bad' } }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when dateFrom > dateTo', async () => {
      const response = res();
      await controller.getRevenueReport(
        req({ query: { dateFrom: '2026-03-01', dateTo: '2026-01-01' } }), response
      );
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('dateFrom') })
      );
    });

    it('should return 200 with report', async () => {
      svc.getRevenueReport.mockResolvedValue({ totalRevenue: 50000 });
      const response = res();
      await controller.getRevenueReport(req({ query: validRevenueQuery }), response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 500 on service error', async () => {
      svc.getRevenueReport.mockRejectedValue(new Error('DB error'));
      const response = res();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await controller.getRevenueReport(req({ query: validRevenueQuery }), response);
      expect(response.status).toHaveBeenCalledWith(500);
      consoleSpy.mockRestore();
    });
  });

  describe('getOccupancyReport()', () => {
    it('should return 400 on invalid query', async () => {
      const response = res();
      await controller.getOccupancyReport(req({ query: {} }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when dateFrom > dateTo', async () => {
      const response = res();
      await controller.getOccupancyReport(
        req({ query: { dateFrom: '2026-12-01', dateTo: '2026-01-01' } }), response
      );
      expect(response.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 with report', async () => {
      svc.getOccupancyReport.mockResolvedValue({ averageOccupancy: 75 });
      const response = res();
      await controller.getOccupancyReport(req({ query: validOccupancyQuery }), response);
      expect(response.status).toHaveBeenCalledWith(200);
    });
  });

  describe('exportRevenueExcel()', () => {
    it('should send Excel buffer', async () => {
      svc.getRevenueReport.mockResolvedValue({ totalRevenue: 50000 });
      exportSvc.exportRevenueToExcel.mockResolvedValue(Buffer.from('excel'));
      const response = res();
      await controller.exportRevenueExcel(req({ query: validRevenueQuery }), response);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheetml'));
      expect(response.send).toHaveBeenCalled();
    });

    it('should return 400 on invalid dates', async () => {
      const response = res();
      await controller.exportRevenueExcel(req({ query: { dateFrom: 'bad' } }), response);
      expect(response.status).toHaveBeenCalledWith(400);
    });
  });

  describe('exportRevenuePDF()', () => {
    it('should send PDF buffer', async () => {
      svc.getRevenueReport.mockResolvedValue({ totalRevenue: 50000 });
      exportSvc.exportRevenueToPDF.mockResolvedValue(Buffer.from('pdf'));
      const response = res();
      await controller.exportRevenuePDF(req({ query: validRevenueQuery }), response);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(response.send).toHaveBeenCalled();
    });
  });
});
