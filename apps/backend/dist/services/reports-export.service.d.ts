import type { RevenueReport, OccupancyReport } from '@/types/reports.types';
declare class ReportsExportService {
    /**
     * Export revenue report to Excel (XLSX)
     * @param report - Revenue report data
     * @returns Buffer of Excel file
     */
    exportRevenueToExcel(report: RevenueReport): Promise<Buffer>;
    /**
     * Export occupancy report to Excel (XLSX)
     * @param report - Occupancy report data
     * @returns Buffer of Excel file
     */
    exportOccupancyToExcel(report: OccupancyReport): Promise<Buffer>;
    /**
     * Export revenue report to PDF
     * @param report - Revenue report data
     * @returns Buffer of PDF file
     */
    exportRevenueToPDF(report: RevenueReport): Promise<Buffer>;
    /**
     * Export occupancy report to PDF
     * @param report - Occupancy report data
     * @returns Buffer of PDF file
     */
    exportOccupancyToPDF(report: OccupancyReport): Promise<Buffer>;
    /**
     * Format number as PLN currency
     */
    private formatCurrency;
    /**
     * Translate English day name to Polish
     */
    private translateDayOfWeek;
}
declare const _default: ReportsExportService;
export default _default;
//# sourceMappingURL=reports-export.service.d.ts.map