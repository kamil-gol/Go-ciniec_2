import type { RevenueReportFilters, RevenueReport, OccupancyReportFilters, OccupancyReport } from '@/types/reports.types';
declare class ReportsService {
    /**
     * Get comprehensive revenue report with breakdown
     * @param filters - date range, groupBy, hall, eventType
     * @returns Revenue report with summary, breakdown, rankings
     */
    getRevenueReport(filters: RevenueReportFilters): Promise<RevenueReport>;
    /**
     * Get revenue for previous period (for growth calculation)
     */
    private getPreviousPeriodRevenue;
    /**
     * Group revenue by day (for finding max revenue day)
     */
    private groupRevenueByDay;
    /**
     * Group revenue by period (day/week/month/year)
     */
    private groupRevenueByPeriod;
    /**
     * Get ISO week number (1-53)
     */
    private getWeekNumber;
    /**
     * Group revenue by hall
     */
    private groupRevenueByHall;
    /**
     * Group revenue by event type
     */
    private groupRevenueByEventType;
    /**
     * Get comprehensive occupancy report
     * @param filters - date range, optional hallId
     * @returns Occupancy report with summary, hall rankings, peak times
     */
    getOccupancyReport(filters: OccupancyReportFilters): Promise<OccupancyReport>;
    /**
     * Analyze peak days of week
     */
    private analyzePeakDaysOfWeek;
    /**
     * Analyze peak hours (0-23)
     */
    private analyzePeakHours;
    /**
     * Analyze occupancy by hall
     */
    private analyzeOccupancyByHall;
}
declare const _default: ReportsService;
export default _default;
//# sourceMappingURL=reports.service.d.ts.map