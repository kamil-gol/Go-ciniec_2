// apps/backend/src/types/reports.types.ts

/**
 * Reports Types
 * Type definitions for reports module
 */

export type GroupByPeriod = 'day' | 'week' | 'month' | 'year';

export type ReportType = 'revenue' | 'occupancy' | 'preparations' | 'menu-preparations' | 'reservations' | 'clients';

export type ExportFormat = 'excel' | 'pdf';

// ============================================
// REVENUE REPORTS
// ============================================

export interface RevenueReportFilters {
  dateFrom: string; // ISO date "2026-01-01"
  dateTo: string;   // ISO date "2026-12-31"
  groupBy?: GroupByPeriod; // default: 'month'
  hallId?: string;
  eventTypeId?: string;
  status?: 'CONFIRMED' | 'COMPLETED'; // default: both
}

export interface RevenueReportSummary {
  totalRevenue: number;
  avgRevenuePerReservation: number;
  maxRevenueDay: string | null;
  maxRevenueDayAmount: number;
  growthPercent: number; // vs previous period
  totalReservations: number;
  completedReservations: number;
  pendingRevenue: number; // CONFIRMED but not COMPLETED
}

export interface RevenueBreakdownItem {
  period: string; // "2026-01" for month, "2026-W01" for week, "2026-01-15" for day
  revenue: number;
  count: number; // liczba rezerwacji
  avgRevenue: number; // revenue / count
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

// ============================================
// OCCUPANCY REPORTS
// ============================================

export interface OccupancyReportFilters {
  dateFrom: string;
  dateTo: string;
  hallId?: string;
}

export interface OccupancyReportSummary {
  avgOccupancy: number; // % dni z rezerwacją
  peakDay: string; // "Saturday"
  peakHall: string | null; // nazwa sali
  peakHallId: string | null;
  totalReservations: number;
  totalDaysInPeriod: number;
}

export interface OccupancyByHallItem {
  hallId: string;
  hallName: string;
  occupancy: number; // %
  reservations: number;
  avgGuestsPerReservation: number;
}

export interface PeakHourItem {
  hour: number; // 0-23
  count: number;
}

export interface PeakDayOfWeekItem {
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  dayOfWeekNum: number; // 0-6 (0 = Sunday)
  count: number;
}

export interface OccupancyReport {
  summary: OccupancyReportSummary;
  halls: OccupancyByHallItem[];
  peakHours: PeakHourItem[];
  peakDaysOfWeek: PeakDayOfWeekItem[];
  filters: OccupancyReportFilters;
}

// ============================================
// PREPARATIONS REPORTS (Service Extras) #159
// ============================================

export interface PreparationsReportFilters {
  dateFrom: string;
  dateTo: string;
  categoryId?: string;   // filter by ServiceCategory
  view?: 'detailed' | 'summary'; // default: 'detailed'
}

/** Single extra item linked to a reservation (detailed view) */
export interface PreparationItem {
  extraId: string;
  serviceName: string;
  serviceItemId: string;
  quantity: number;
  priceType: string;         // FLAT | PER_PERSON | FREE
  unitPrice: number;
  totalPrice: number;
  note: string | null;
  status: string;            // PENDING | CONFIRMED
  reservation: {
    id: string;
    clientName: string;
    hallName: string | null;
    eventTypeName: string | null;
    date: string;
    startTime: string | null;
    endTime: string | null;
    guests: number;
    adults: number;
    children: number;
    toddlers: number;
  };
}

/** Category group within a single day */
export interface PreparationCategoryGroup {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  items: PreparationItem[];
  itemCount: number;
}

/** Single day in the preparations timeline */
export interface PreparationDayGroup {
  date: string;               // "2026-03-15"
  dateLabel: string;           // "Sobota, 15 marca 2026"
  categories: PreparationCategoryGroup[];
  totalItems: number;
}

/** Summary item — aggregated per service across all reservations */
export interface PreparationSummaryItem {
  serviceItemId: string;
  serviceName: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  totalQuantity: number;
  totalPersons: number;       // sum of guests for PER_PERSON items
  reservationCount: number;
  reservations: Array<{
    id: string;
    clientName: string;
    date: string;
    startTime: string | null;
    quantity: number;
  }>;
}

/** Summary day group — aggregated view */
export interface PreparationSummaryDayGroup {
  date: string;
  dateLabel: string;
  items: PreparationSummaryItem[];
  totalItems: number;
  totalReservations: number;
}

export interface PreparationsReportSummary {
  totalExtras: number;         // total extra items across all reservations
  totalReservationsWithExtras: number;
  nearestEvent: {
    date: string;
    startTime: string | null;
    clientName: string;
  } | null;
  topCategory: {
    name: string;
    icon: string | null;
    count: number;
  } | null;
}

export interface PreparationsReport {
  summary: PreparationsReportSummary;
  days: PreparationDayGroup[];          // detailed view
  summaryDays?: PreparationSummaryDayGroup[]; // summary view (if view=summary)
  filters: PreparationsReportFilters;
}

// ============================================
// MENU PREPARATIONS REPORTS #160
// ============================================

export interface MenuPreparationsReportFilters {
  dateFrom: string;
  dateTo: string;
  view?: 'detailed' | 'summary'; // default: 'detailed'
}

/** Single dish within a course */
export interface MenuPreparationDish {
  name: string;
  description: string | null;
  portionSize: number; // portion per guest (e.g. 1.0, 0.5, 0.25) — from menuData quantity
}

/** Single course with its selected dishes */
export interface MenuPreparationCourse {
  courseName: string;
  icon: string | null;
  dishes: MenuPreparationDish[];
}

/** Reservation context for the menu report (detailed view) */
export interface MenuPreparationReservation {
  reservationId: string;
  clientName: string;
  hallName: string | null;
  eventTypeName: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  guests: {
    adults: number;
    children: number;
    toddlers: number;
    total: number;
  };
  package: {
    name: string;
    description: string | null;
  };
  courses: MenuPreparationCourse[];
  packagePrice: number;
  totalMenuPrice: number;
}

/** Single day in menu preparations timeline (detailed view) */
export interface MenuPreparationDayGroup {
  date: string;                // "2026-03-15"
  dateLabel: string;            // "Sobota, 15 marca 2026"
  reservations: MenuPreparationReservation[];
  totalReservations: number;
  totalGuests: number;
}

/** Summary: single dish aggregated across all reservations in a day (no toddlerPortions) */
export interface MenuPreparationSummaryDish {
  dishName: string;
  totalPortions: number;        // (adults + children) * portionSize — toddlers excluded
  adultPortions: number;
  childrenPortions: number;
  reservations: Array<{
    id: string;
    clientName: string;
    guests: number;
  }>;
}

/** Summary: course group containing aggregated dishes */
export interface MenuPreparationSummaryCourseGroup {
  courseName: string;
  icon: string | null;
  dishes: MenuPreparationSummaryDish[];
}

/** Summary day group — aggregated per course → per dish */
export interface MenuPreparationSummaryDayGroup {
  date: string;
  dateLabel: string;
  courses: MenuPreparationSummaryCourseGroup[];
  totalReservations: number;
  totalGuests: number;
}

export interface MenuPreparationsReportSummary {
  totalMenus: number;           // number of reservations with menu snapshot
  totalGuests: number;          // sum of all guests
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

export interface MenuPreparationsReport {
  summary: MenuPreparationsReportSummary;
  days: MenuPreparationDayGroup[];                    // detailed view
  summaryDays?: MenuPreparationSummaryDayGroup[];     // summary view (if view=summary)
  filters: MenuPreparationsReportFilters;
}

// ============================================
// EXPORT OPTIONS
// ============================================

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

// ============================================
// HELPER TYPES
// ============================================

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
