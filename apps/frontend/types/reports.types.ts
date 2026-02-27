// apps/frontend/types/reports.types.ts

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

export interface PreparationsReportFilters {
  dateFrom: string;
  dateTo: string;
  view: 'detailed' | 'summary';
  categoryId?: string;
  status?: string;
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
// PREPARATIONS REPORT (#159)
// ============================================

export interface PreparationsSummary {
  totalItems: number;
  totalValue: number;
  totalReservations: number;
  daysWithEvents: number;
  topCategory: string | null;
  nearestEvent: string | null;
}

export interface PreparationsDetailedItem {
  serviceName: string;
  quantity: number;
  totalPrice: number;
  reservationLabel: string;
  note?: string;
}

export interface PreparationsDetailedCategory {
  categoryName: string;
  items: PreparationsDetailedItem[];
}

export interface PreparationsDetailedDay {
  dateLabel: string;
  dayTotal: number;
  dayItemCount: number;
  categories: PreparationsDetailedCategory[];
}

export interface PreparationsSummaryTableItem {
  serviceName: string;
  categoryName: string;
  totalQuantity: number;
  totalValue: number;
  reservationCount: number;
}

export interface PreparationsReport {
  summary: PreparationsSummary;
  detailed: PreparationsDetailedDay[] | null;
  summaryTable: PreparationsSummaryTableItem[] | null;
  filters: PreparationsReportFilters;
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

export interface PreparationsReportResponse {
  success: boolean;
  data: PreparationsReport;
}
