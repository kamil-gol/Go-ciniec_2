// apps/frontend/src/types/reports.types.ts

// ============================================
// FILTERS
// ============================================

export type GroupByPeriod = 'day' | 'week' | 'month' | 'year';

export interface RevenueReportFilters {
  dateFrom: string;
  dateTo: string;
  groupBy?: GroupByPeriod;
  hallId?: string;
  eventTypeId?: string;
  status?: 'CONFIRMED' | 'COMPLETED';
}

export interface OccupancyReportFilters {
  dateFrom: string;
  dateTo: string;
  hallId?: string;
}

// ============================================
// REVENUE REPORT
// ============================================

export interface RevenueSummary {
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
  summary: RevenueSummary;
  breakdown: RevenueBreakdownItem[];
  byHall: RevenueByHallItem[];
  byEventType: RevenueByEventTypeItem[];
  filters: RevenueReportFilters;
}

// ============================================
// OCCUPANCY REPORT
// ============================================

export interface OccupancySummary {
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
  summary: OccupancySummary;
  halls: OccupancyByHallItem[];
  peakHours: PeakHourItem[];
  peakDaysOfWeek: PeakDayOfWeekItem[];
  filters: OccupancyReportFilters;
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface RevenueReportResponse {
  success: boolean;
  data: RevenueReport;
}

export interface OccupancyReportResponse {
  success: boolean;
  data: OccupancyReport;
}
