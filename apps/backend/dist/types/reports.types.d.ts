/**
 * Reports Types
 * Type definitions for reports module
 */
export type GroupByPeriod = 'day' | 'week' | 'month' | 'year';
export type ReportType = 'revenue' | 'occupancy' | 'reservations' | 'clients';
export type ExportFormat = 'excel' | 'pdf';
export interface RevenueReportFilters {
    dateFrom: string;
    dateTo: string;
    groupBy?: GroupByPeriod;
    hallId?: string;
    eventTypeId?: string;
    status?: 'CONFIRMED' | 'COMPLETED';
}
export interface RevenueReportSummary {
    totalRevenue: number;
    avgRevenuePerReservation: number;
    maxRevenueDay: string | null;
    maxRevenueDayAmount: number;
    growthPercent: number;
    totalReservations: number;
    completedReservations: number;
    pendingRevenue: number;
}
export interface RevenueBreakdownItem {
    period: string;
    revenue: number;
    count: number;
    avgRevenue: number;
}
export interface RevenueByHallItem {
    hallId: string;
    hallName: string;
    revenue: number;
    count: number;
    avgRevenue: number;
}
export interface RevenueByEventTypeItem {
    eventTypeId: string;
    eventTypeName: string;
    revenue: number;
    count: number;
    avgRevenue: number;
}
export interface RevenueReport {
    summary: RevenueReportSummary;
    breakdown: RevenueBreakdownItem[];
    byHall: RevenueByHallItem[];
    byEventType: RevenueByEventTypeItem[];
    filters: RevenueReportFilters;
}
export interface OccupancyReportFilters {
    dateFrom: string;
    dateTo: string;
    hallId?: string;
}
export interface OccupancyReportSummary {
    avgOccupancy: number;
    peakDay: string;
    peakHall: string | null;
    peakHallId: string | null;
    totalReservations: number;
    totalDaysInPeriod: number;
}
export interface OccupancyByHallItem {
    hallId: string;
    hallName: string;
    occupancy: number;
    reservations: number;
    avgGuestsPerReservation: number;
}
export interface PeakHourItem {
    hour: number;
    count: number;
}
export interface PeakDayOfWeekItem {
    dayOfWeek: string;
    dayOfWeekNum: number;
    count: number;
}
export interface OccupancyReport {
    summary: OccupancyReportSummary;
    halls: OccupancyByHallItem[];
    peakHours: PeakHourItem[];
    peakDaysOfWeek: PeakDayOfWeekItem[];
    filters: OccupancyReportFilters;
}
export interface ExcelExportOptions {
    type: ReportType;
    filters: RevenueReportFilters | OccupancyReportFilters;
    filename?: string;
}
export interface PDFExportOptions {
    type: ReportType;
    filters: RevenueReportFilters | OccupancyReportFilters;
    filename?: string;
    includeCharts?: boolean;
}
export interface DateRange {
    from: Date;
    to: Date;
}
export interface PeriodComparison {
    current: number;
    previous: number;
    changePercent: number;
    changeAbsolute: number;
}
//# sourceMappingURL=reports.types.d.ts.map