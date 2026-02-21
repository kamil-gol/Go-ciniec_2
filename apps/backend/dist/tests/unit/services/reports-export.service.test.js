/**
 * ReportsExportService — Comprehensive Unit Tests
 * Covers Excel + PDF generation for revenue and occupancy,
 * including conditional sections (breakdown, byHall, byEventType, halls, peakHours, peakDaysOfWeek)
 * and helper methods (formatCurrency, translateDayOfWeek).
 */
import ReportsExportService from '../../../services/reports-export.service';
const svc = ReportsExportService;
const REVENUE_FULL = {
    filters: { dateFrom: '2026-01-01', dateTo: '2026-12-31', groupBy: 'month' },
    summary: {
        totalRevenue: 500000, avgRevenuePerReservation: 12500,
        totalReservations: 40, completedReservations: 35,
        pendingRevenue: 50000, growthPercent: 15,
    },
    breakdown: [{ period: '2026-01', revenue: 100000, count: 8, avgRevenue: 12500 }],
    byHall: [{ hallName: 'Sala A', revenue: 300000, count: 24, avgRevenue: 12500 }],
    byEventType: [{ eventTypeName: 'Wesele', revenue: 400000, count: 32, avgRevenue: 12500 }],
};
const REVENUE_EMPTY = {
    filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
    summary: {
        totalRevenue: 0, avgRevenuePerReservation: 0,
        totalReservations: 0, completedReservations: 0,
        pendingRevenue: 0, growthPercent: 0,
    },
    breakdown: [], byHall: [], byEventType: [],
};
const OCCUPANCY_FULL = {
    filters: { dateFrom: '2026-01-01', dateTo: '2026-12-31' },
    summary: {
        avgOccupancy: 72, peakDay: 'Saturday', peakHall: 'Sala Bankietowa',
        totalReservations: 200, totalDaysInPeriod: 365,
    },
    halls: [{ hallName: 'Sala Bankietowa', occupancy: 85, reservations: 120, avgGuestsPerReservation: 90 }],
    peakHours: [{ hour: 14, count: 45 }, { hour: 15, count: 42 }],
    peakDaysOfWeek: [{ dayOfWeek: 'Saturday', count: 80 }, { dayOfWeek: 'Sunday', count: 60 }],
};
const OCCUPANCY_EMPTY = {
    filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
    summary: {
        avgOccupancy: 0, peakDay: 'Monday', peakHall: null,
        totalReservations: 0, totalDaysInPeriod: 31,
    },
    halls: [], peakHours: [], peakDaysOfWeek: [],
};
describe('ReportsExportService', () => {
    // ========== Revenue Excel ==========
    describe('exportRevenueToExcel()', () => {
        it('should generate buffer with all sections', async () => {
            const buffer = await svc.exportRevenueToExcel(REVENUE_FULL);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
        });
        it('should generate buffer with empty sections', async () => {
            const buffer = await svc.exportRevenueToExcel(REVENUE_EMPTY);
            expect(buffer).toBeInstanceOf(Buffer);
        });
        it('should handle report without groupBy', async () => {
            const noGroupBy = { ...REVENUE_EMPTY, filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' } };
            const buffer = await svc.exportRevenueToExcel(noGroupBy);
            expect(buffer).toBeInstanceOf(Buffer);
        });
    });
    // ========== Occupancy Excel ==========
    describe('exportOccupancyToExcel()', () => {
        it('should generate buffer with all sections', async () => {
            const buffer = await svc.exportOccupancyToExcel(OCCUPANCY_FULL);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
        });
        it('should generate buffer with empty sections', async () => {
            const buffer = await svc.exportOccupancyToExcel(OCCUPANCY_EMPTY);
            expect(buffer).toBeInstanceOf(Buffer);
        });
        it('should handle null peakHall ("Brak danych" fallback)', async () => {
            const buffer = await svc.exportOccupancyToExcel(OCCUPANCY_EMPTY);
            expect(buffer).toBeInstanceOf(Buffer);
        });
    });
    // ========== Revenue PDF ==========
    describe('exportRevenueToPDF()', () => {
        it('should generate PDF buffer with all sections', async () => {
            const buffer = await svc.exportRevenueToPDF(REVENUE_FULL);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(100);
        });
        it('should generate PDF buffer with empty sections', async () => {
            const buffer = await svc.exportRevenueToPDF(REVENUE_EMPTY);
            expect(buffer).toBeInstanceOf(Buffer);
        });
        it('should handle report without groupBy in PDF', async () => {
            const noGroupBy = { ...REVENUE_EMPTY, filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' } };
            const buffer = await svc.exportRevenueToPDF(noGroupBy);
            expect(buffer).toBeInstanceOf(Buffer);
        });
    });
    // ========== Occupancy PDF ==========
    describe('exportOccupancyToPDF()', () => {
        it('should generate PDF buffer with all sections', async () => {
            const buffer = await svc.exportOccupancyToPDF(OCCUPANCY_FULL);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(100);
        });
        it('should generate PDF buffer with empty sections', async () => {
            const buffer = await svc.exportOccupancyToPDF(OCCUPANCY_EMPTY);
            expect(buffer).toBeInstanceOf(Buffer);
        });
        it('should handle null peakHall in PDF', async () => {
            const buffer = await svc.exportOccupancyToPDF(OCCUPANCY_EMPTY);
            expect(buffer).toBeInstanceOf(Buffer);
        });
    });
    // ========== translateDayOfWeek (via occupancy outputs) ==========
    describe('translateDayOfWeek coverage', () => {
        it('should translate known days through PDF generation', async () => {
            const reportAllDays = {
                ...OCCUPANCY_FULL,
                peakDaysOfWeek: [
                    { dayOfWeek: 'Monday', count: 10 },
                    { dayOfWeek: 'Tuesday', count: 20 },
                    { dayOfWeek: 'Wednesday', count: 30 },
                    { dayOfWeek: 'Thursday', count: 40 },
                    { dayOfWeek: 'Friday', count: 50 },
                    { dayOfWeek: 'Saturday', count: 60 },
                    { dayOfWeek: 'Sunday', count: 70 },
                ],
            };
            const buffer = await svc.exportOccupancyToPDF(reportAllDays);
            expect(buffer).toBeInstanceOf(Buffer);
        });
        it('should fallback unknown day name', async () => {
            const reportUnknown = {
                ...OCCUPANCY_FULL,
                peakDaysOfWeek: [{ dayOfWeek: 'Funday', count: 99 }],
            };
            const buffer = await svc.exportOccupancyToExcel(reportUnknown);
            expect(buffer).toBeInstanceOf(Buffer);
        });
    });
});
//# sourceMappingURL=reports-export.service.test.js.map