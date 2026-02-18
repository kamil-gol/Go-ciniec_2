/**
 * ReportsExportService — Unit Tests
 *
 * These tests verify the export service generates valid buffers.
 * ExcelJS and PDFKit are real (not mocked) since they produce in-memory buffers.
 */

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import reportsExportService from '../../../services/reports-export.service';

const REVENUE_REPORT: any = {
  summary: {
    totalRevenue: 35000, avgRevenuePerReservation: 11666.67,
    maxRevenueDay: '2026-01-22', maxRevenueDayAmount: 20000,
    growthPercent: 17, totalReservations: 3, completedReservations: 2,
    pendingRevenue: 8000,
  },
  breakdown: [
    { period: '2026-01', revenue: 35000, count: 3, avgRevenue: 11666.67 },
  ],
  byHall: [
    { hallId: 'h-001', hallName: 'Sala Główna', revenue: 27000, count: 2, avgRevenue: 13500 },
    { hallId: 'h-002', hallName: 'Sala Kameralna', revenue: 8000, count: 1, avgRevenue: 8000 },
  ],
  byEventType: [
    { eventTypeId: 'et-001', eventTypeName: 'Wesele', revenue: 27000, count: 2, avgRevenue: 13500 },
    { eventTypeId: 'et-002', eventTypeName: 'Komunia', revenue: 8000, count: 1, avgRevenue: 8000 },
  ],
  filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31', groupBy: 'month' },
};

const OCCUPANCY_REPORT: any = {
  summary: {
    avgOccupancy: 6.5, peakDay: 'Thursday', peakHall: 'Sala Główna',
    peakHallId: 'h-001', totalReservations: 3, totalDaysInPeriod: 31,
  },
  halls: [
    { hallId: 'h-001', hallName: 'Sala Główna', occupancy: 6.5, reservations: 2, avgGuestsPerReservation: 70 },
  ],
  peakHours: [{ hour: 16, count: 2 }, { hour: 18, count: 1 }],
  peakDaysOfWeek: [{ dayOfWeek: 'Thursday', dayOfWeekNum: 4, count: 2 }],
  filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
};

describe('ReportsExportService', () => {
  describe('Excel exports', () => {
    it('should export revenue report to Excel buffer', async () => {
      const buffer = await reportsExportService.exportRevenueToExcel(REVENUE_REPORT);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(100);
    });

    it('should export occupancy report to Excel buffer', async () => {
      const buffer = await reportsExportService.exportOccupancyToExcel(OCCUPANCY_REPORT);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(100);
    });

    it('should handle empty breakdown/halls gracefully', async () => {
      const emptyReport = {
        ...REVENUE_REPORT,
        breakdown: [], byHall: [], byEventType: [],
      };
      const buffer = await reportsExportService.exportRevenueToExcel(emptyReport);
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });

  describe('PDF exports', () => {
    it('should export revenue report to PDF buffer', async () => {
      const buffer = await reportsExportService.exportRevenueToPDF(REVENUE_REPORT);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(100);
      // PDF magic bytes: %PDF
      expect(buffer.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should export occupancy report to PDF buffer', async () => {
      const buffer = await reportsExportService.exportOccupancyToPDF(OCCUPANCY_REPORT);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should handle empty sections in PDF', async () => {
      const emptyReport = {
        ...OCCUPANCY_REPORT,
        halls: [], peakHours: [], peakDaysOfWeek: [],
      };
      const buffer = await reportsExportService.exportOccupancyToPDF(emptyReport);
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });
});
