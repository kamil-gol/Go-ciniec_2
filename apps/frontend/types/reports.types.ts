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
// Aligned with actual API response structure
// ============================================

/** KPI summary returned by API */
export interface PreparationsSummary {
  totalExtras: number;
  totalReservationsWithExtras: number;
  nearestEvent: {
    date: string;
    startTime: string;
    clientName: string;
  } | null;
  topCategory: {
    name: string;
    icon: string;
    count: number;
  } | null;
}

/** Reservation info nested inside detailed items */
export interface PreparationsReservationInfo {
  id: string;
  clientName: string;
  hallName: string;
  eventTypeName: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  adults: number;
  children: number;
  toddlers: number;
}

/** Single service extra in detailed view */
export interface PreparationsDetailedItem {
  extraId: string;
  serviceName: string;
  serviceItemId: string;
  quantity: number;
  priceType: string;
  unitPrice: number;
  totalPrice: number;
  note: string | null;
  status: string;
  reservation: PreparationsReservationInfo;
}

/** Category grouping within a day (detailed view) */
export interface PreparationsDetailedCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  items: PreparationsDetailedItem[];
  itemCount: number;
}

/** Single day in detailed view */
export interface PreparationsDetailedDay {
  date: string;
  dateLabel: string;
  categories: PreparationsDetailedCategory[];
  totalItems: number;
}

/** Reservation reference in summary view */
export interface PreparationsSummaryReservation {
  id: string;
  clientName: string;
  date: string;
  startTime: string;
  quantity: number;
}

/** Aggregated service item in summary view */
export interface PreparationsSummaryItem {
  serviceItemId: string;
  serviceName: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalQuantity: number;
  totalPersons: number;
  reservationCount: number;
  reservations: PreparationsSummaryReservation[];
}

/** Single day in summary view */
export interface PreparationsSummaryDay {
  date: string;
  dateLabel: string;
  items: PreparationsSummaryItem[];
  totalItems: number;
  totalReservations: number;
}

/** Full preparations report as returned by API */
export interface PreparationsReport {
  summary: PreparationsSummary;
  days?: PreparationsDetailedDay[];
  summaryDays?: PreparationsSummaryDay[];
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
