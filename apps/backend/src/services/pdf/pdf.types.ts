// ═══════════════ INTERFACES ═══════════════

export interface DishSelection {
  dishId: string;
  dishName: string;
  quantity: number;
  allergens?: string[];
  description?: string;
}

export interface CategorySelection {
  categoryId: string;
  categoryName: string;
  dishes: DishSelection[];
}

export interface MenuData {
  packageId?: string;
  packageName?: string;
  dishSelections?: CategorySelection[];
  selectedOptions?: any[];
}

export interface MenuSnapshot {
  id: string;
  menuData: any;
  packagePrice: number;
  optionsPrice: number;
  totalMenuPrice: number;
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  selectedAt: Date;
}

export interface ReservationExtraForPDF {
  serviceItem: {
    name: string;
    priceType: string;
    category?: { name: string } | null;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceType: string;
  note?: string | null;
  status: string;
}

export interface ReservationPDFData {
  id: string;
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
  };
  hall?: {
    name: string;
  };
  eventType?: {
    name: string;
    standardHours?: number | null;
    extraHourRate?: number | null;
  };
  customEventType?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  adults: number;
  children: number;
  toddlers: number;
  guests: number;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  totalPrice: number;
  extrasTotalPrice?: number;
  extraHoursCost?: number | null;
  // #137: Venue surcharge fields
  venueSurcharge?: number | null;
  venueSurchargeLabel?: string | null;
  // #216: Discount fields
  discountType?: string | null;
  discountValue?: number | null;
  discountAmount?: number | null;
  priceBeforeDiscount?: number | null;
  status: string;
  notes?: string;
  birthdayAge?: number;
  anniversaryYear?: number;
  anniversaryOccasion?: string;
  deposit?: {
    amount: number;
    dueDate: string;
    status: string;
    paid: boolean;
  };
  deposits?: Array<{
    amount: number;
    dueDate: Date | string;
    status: string;
    paid: boolean;
  }>;
  menuData?: MenuData;
  menuSnapshot?: MenuSnapshot;
  reservationExtras?: ReservationExtraForPDF[];
  // #216: Category extras (extra dishes beyond package limit)
  categoryExtras?: CategoryExtraForPDF[];
  createdAt: Date;
}

export interface CategoryExtraForPDF {
  categoryName: string;
  quantity: number;
  pricePerItem: number;
  guestCount: number;
  portionTarget: string;
  totalPrice: number;
}

export interface PaymentConfirmationData {
  depositId: string;
  amount: number;
  paidAt: Date;
  paymentMethod: string;
  paymentReference?: string;
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
  };
  reservation: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    hall?: string;
    eventType?: string;
    guests: number;
    totalPrice: number;
  };
}

export interface RestaurantData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  nip?: string;
}

// ═══════════════ MENU CARD PDF TYPES ═══════════════

export interface MenuCardDish {
  name: string;
  description?: string | null;
  allergens?: string[];
}

export interface MenuCardCourse {
  name: string;
  description?: string | null;
  icon?: string | null;
  minSelect: number;
  maxSelect: number;
  dishes: MenuCardDish[];
}

export interface MenuCardOption {
  name: string;
  description?: string | null;
  category: string;
  priceType: string;
  priceAmount: number;
  isRequired?: boolean;
}

export interface MenuCardPackage {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  badgeText?: string | null;
  includedItems?: string[];
  courses: MenuCardCourse[];
  options: MenuCardOption[];
}

export interface MenuCardPDFData {
  templateName: string;
  templateDescription?: string | null;
  variant?: string | null;
  eventTypeName: string;
  eventTypeColor?: string | null;
  packages: MenuCardPackage[];
}

// ═══════════════ REPORT PDF TYPES — Zadanie 4 ═══════════════

export interface RevenueReportPDFData {
  filters: { dateFrom: string; dateTo: string; groupBy?: string };
  summary: {
    totalRevenue: number;
    avgRevenuePerReservation: number;
    totalReservations: number;
    completedReservations: number;
    pendingRevenue: number;
    growthPercent: number;
    extrasRevenue?: number;
    categoryExtrasRevenue?: number; // #216
  };
  breakdown: Array<{ period: string; revenue: number; count: number; avgRevenue: number }>;
  byHall: Array<{ hallName: string; revenue: number; count: number; avgRevenue: number }>;
  byEventType: Array<{ eventTypeName: string; revenue: number; count: number; avgRevenue: number }>;
  byServiceItem?: Array<{ name: string; revenue: number; count: number; avgRevenue: number }>;
  byCategoryExtra?: Array<{ categoryName: string; revenue: number; count: number; totalQuantity: number; avgRevenue: number }>; // #216
}

export interface OccupancyReportPDFData {
  filters: { dateFrom: string; dateTo: string };
  summary: {
    avgOccupancy: number;
    peakDay: string;
    peakHall?: string;
    totalReservations: number;
    totalDaysInPeriod: number;
  };
  halls: Array<{ hallName: string; occupancy: number; reservations: number; avgGuestsPerReservation: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  peakDaysOfWeek: Array<{ dayOfWeek: string; count: number }>;
}

// ═══════════════ CATERING PDF TYPES ═══════════════

export interface CateringOrderItemForPDF {
  dishNameSnapshot?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  extraDescription?: string;
  note?: string;
}

export interface CateringExtraItemForPDF {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CateringQuotePDFData {
  id: string;
  orderNumber: string;
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    companyName?: string;
    address?: string;
  };
  eventDate: Date;
  deliveryType: string;
  deliveryAddress?: string;
  guests: number;
  items: CateringOrderItemForPDF[];
  subtotal: number;
  discountAmount?: number;
  totalPrice: number;
  status: string;
  notes?: string;
  createdAt: Date;
}

export interface CateringKitchenPrintData {
  id: string;
  orderNumber: string;
  eventDate: Date;
  deliveryType: string;
  deliveryAddress?: string;
  guests: number;
  items: CateringOrderItemForPDF[];
  notes?: string;
}

export interface CateringInvoicePDFData {
  id: string;
  orderNumber: string;
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    companyName?: string;
    address?: string;
    nip?: string;
  };
  eventDate: Date;
  deliveryType: string;
  deliveryAddress?: string;
  items: CateringOrderItemForPDF[];
  subtotal: number;
  discountAmount?: number;
  totalPrice: number;
  status: string;
  createdAt: Date;
}

export interface CateringOrderPDFData {
  id: string;
  orderNumber: string;
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    companyName?: string;
    address?: string;
  };
  eventDate: Date | string;
  deliveryType: string;
  deliveryAddress?: string;
  guestsCount?: number;
  guests?: number;
  items: CateringOrderItemForPDF[];
  extras?: CateringExtraItemForPDF[];
  extrasTotalPrice?: number;
  subtotal: number;
  discountAmount?: number;
  totalPrice: number;
  status: string;
  notes?: string;
  createdAt: Date;
}

// ═══════════════ PDF CONFIG TYPES ═══════════════

/** PDF layout config interfaces */
export interface PdfSectionConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export interface PdfLayoutConfig {
  colors?: Record<string, string>;
  sections: PdfSectionConfig[];
}

// ═══════════════ CONSTANTS ═══════════════

export const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  lactose: 'Laktoza',
  eggs: 'Jajka',
  nuts: 'Orzechy',
  fish: 'Ryby',
  soy: 'Soja',
  shellfish: 'Skorupiaki',
  peanuts: 'Orzeszki ziemne',
};

/** Premium color palette (mutable — overridden per-render from DB config) */
export let COLORS = {
  primary: '#1a2332',       // Dark navy — headers, banners
  primaryLight: '#2c3e50',  // Lighter navy — section headers
  accent: '#c8a45a',        // Gold accent — premium feel
  success: '#27ae60',       // Green — paid, confirmed
  warning: '#f39c12',       // Orange — pending
  danger: '#e74c3c',        // Red — cancelled
  info: '#3498db',          // Blue — reserved
  textDark: '#1a2332',      // Body text
  textMuted: '#7f8c8d',     // Secondary text
  textLight: '#bdc3c7',     // Disabled text
  border: '#dce1e8',        // Table borders, separators
  bgLight: '#f4f6f9',       // Alternating rows, boxes
  bgWhite: '#ffffff',       // Main background
  allergen: '#e67e22',      // Allergen labels
  purple: '#8e44ad',        // Optional extras
  reservationBg: '#EDE9FE', // Light purple — reservation cards (menu preparations)
};

/** Snapshot of default colors for reset after each render */
export const DEFAULT_COLORS = { ...COLORS };

/** Replace COLORS with new values (used by config-driven renders) */
export function setColors(newColors: typeof COLORS): void {
  COLORS = newColors;
}

/** Reset COLORS to defaults */
export function resetColors(): void {
  COLORS = { ...DEFAULT_COLORS };
}

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  RESERVED: { label: 'REZERWACJA', color: COLORS.info },
  PENDING: { label: 'OCZEKUJĄCA', color: COLORS.warning },
  CONFIRMED: { label: 'POTWIERDZONA', color: COLORS.success },
  COMPLETED: { label: 'ZAKOŃCZONA', color: COLORS.textMuted },
  CANCELLED: { label: 'ANULOWANA', color: COLORS.danger },
  // Catering-specific statuses
  DRAFT: { label: 'SZKIC', color: COLORS.textMuted },
  INQUIRY: { label: 'ZAPYTANIE', color: COLORS.info },
  QUOTED: { label: 'WYCENIONE', color: COLORS.warning },
  IN_PREPARATION: { label: 'W PRZYGOTOWANIU', color: COLORS.info },
  READY: { label: 'GOTOWE', color: COLORS.success },
  DELIVERED: { label: 'DOSTARCZONE', color: COLORS.success },
};

export const DELIVERY_TYPE_LABELS: Record<string, string> = {
  PICKUP: 'Odbiór osobisty',
  DELIVERY: 'Dostawa',
  ON_SITE: 'Na miejscu',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  TRANSFER: 'Przelew bankowy',
  CASH: 'Gotówka',
  BLIK: 'BLIK',
  CARD: 'Karta płatnicza',
};

/** Polish day-of-week translations (shared helper) */
export const DAY_OF_WEEK_PL: Record<string, string> = {
  'Monday': 'Poniedziałek',
  'Tuesday': 'Wtorek',
  'Wednesday': 'Środa',
  'Thursday': 'Czwartek',
  'Friday': 'Piątek',
  'Saturday': 'Sobota',
  'Sunday': 'Niedziela',
};
