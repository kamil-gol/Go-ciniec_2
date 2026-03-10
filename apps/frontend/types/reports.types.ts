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

export interface MenuPreparationsReportFilters {
  dateFrom: string;
  dateTo: string;
  view: 'detailed' | 'summary';
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
  pendingRevenue: number;   extrasRevenue?: number;
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

export interface PreparationsDetailedCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  items: PreparationsDetailedItem[];
  itemCount: number;
}

export interface PreparationsDetailedDay {
  date: string;
  dateLabel: string;
  categories: PreparationsDetailedCategory[];
  totalItems: number;
}

export interface PreparationsSummaryReservation {
  id: string;
  clientName: string;
  date: string;
  startTime: string;
  quantity: number;
}

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

export interface PreparationsSummaryDay {
  date: string;
  dateLabel: string;
  items: PreparationsSummaryItem[];
  totalItems: number;
  totalReservations: number;
}

export interface PreparationsReport {
  summary: PreparationsSummary;
  days?: PreparationsDetailedDay[];
  summaryDays?: PreparationsSummaryDay[];
  filters: PreparationsReportFilters;
}

// ============================================
// MENU PREPARATIONS REPORT (#160)
// ============================================

export interface MenuPreparationsSummary {
  totalMenus: number;
  totalGuests: number;
  totalAdults: number;
  totalChildren: number;
  totalToddlers: number;
  topPackage: {
    name: string;
    count: number;
  } | null;
  nearestEvent: {
    date: string;
    startTime: string | null;
    clientName: string;
  } | null;
}

export interface MenuPreparationDish {
  name: string;
  description: string | null;
}

export interface MenuPreparationCourse {
  courseName: string;
  icon: string | null;
  dishes: MenuPreparationDish[];
}

export interface MenuPreparationGuests {
  adults: number;
  children: number;
  toddlers: number;
  total: number;
}

export interface MenuPreparationPackage {
  name: string;
  description: string | null;
}

export interface MenuPreparationReservation {
  reservationId: string;
  clientName: string;
  hallName: string | null;
  eventTypeName: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  guests: MenuPreparationGuests;
  package: MenuPreparationPackage;
  courses: MenuPreparationCourse[];
  packagePrice: number;
  totalMenuPrice: number;
}

export interface MenuPreparationDayGroup {
  date: string;
  dateLabel: string;
  reservations: MenuPreparationReservation[];
  totalReservations: number;
  totalGuests: number;
}

export interface MenuPreparationSummaryDish {
  dishName: string;
  totalPortions: number;
  adultPortions: number;
  childrenPortions: number;
  toddlerPortions: number;
  reservations: Array<{
    id: string;
    clientName: string;
    guests: number;
  }>;
}

export interface MenuPreparationSummaryCourseGroup {
  courseName: string;
  icon: string | null;
  dishes: MenuPreparationSummaryDish[];
}

export interface MenuPreparationSummaryDayGroup {
  date: string;
  dateLabel: string;
  courses: MenuPreparationSummaryCourseGroup[];
  totalReservations: number;
  totalGuests: number;
}

export interface MenuPreparationsReport {
  summary: MenuPreparationsSummary;
  days: MenuPreparationDayGroup[];
  summaryDays?: MenuPreparationSummaryDayGroup[];
  filters: MenuPreparationsReportFilters;
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

export interface MenuPreparationsReportResponse {
  success: boolean;
  data: MenuPreparationsReport;
}
