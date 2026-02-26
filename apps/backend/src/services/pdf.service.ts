import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import * as fs from 'fs';
import companySettingsService from './company-settings.service';

// ═══════════════ INTERFACES ═══════════════

interface DishSelection {
  dishId: string;
  dishName: string;
  quantity: number;
  allergens?: string[];
  description?: string;
}

interface CategorySelection {
  categoryId: string;
  categoryName: string;
  dishes: DishSelection[];
}

interface MenuData {
  packageId?: string;
  packageName?: string;
  dishSelections?: CategorySelection[];
  selectedOptions?: any[];
}

interface MenuSnapshot {
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

interface ReservationExtraForPDF {
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

interface ReservationPDFData {
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
  // #137: Venue surcharge fields
  venueSurcharge?: number | null;
  venueSurchargeLabel?: string | null;
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
  createdAt: Date;
}

interface PaymentConfirmationData {
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

interface RestaurantData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  nip?: string;
}

// ═══════════════ MENU CARD PDF TYPES ═══════════════

interface MenuCardDish {
  name: string;
  description?: string | null;
  allergens?: string[];
  isDefault?: boolean;
  isRecommended?: boolean;
}

interface MenuCardCourse {
  name: string;
  description?: string | null;
  icon?: string | null;
  minSelect: number;
  maxSelect: number;
  dishes: MenuCardDish[];
}

interface MenuCardOption {
  name: string;
  description?: string | null;
  category: string;
  priceType: string;
  priceAmount: number;
  isRequired?: boolean;
}

interface MenuCardPackage {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  isPopular?: boolean;
  isRecommended?: boolean;
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
  };
  breakdown: Array<{ period: string; revenue: number; count: number; avgRevenue: number }>;
  byHall: Array<{ hallName: string; revenue: number; count: number; avgRevenue: number }>;
  byEventType: Array<{ eventTypeName: string; revenue: number; count: number; avgRevenue: number }>;
  byServiceItem?: Array<{ name: string; revenue: number; count: number; avgRevenue: number }>;
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

// ═══════════════ CONSTANTS ═══════════════

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  lactose: 'Laktoza',
  eggs: 'Jajka',
  nuts: 'Orzechy',
  fish: 'Ryby',
  soy: 'Soja',
  shellfish: 'Skorupiaki',
  peanuts: 'Orzeszki ziemne',
};

/** Premium color palette */
const COLORS = {
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
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  RESERVED: { label: 'REZERWACJA', color: COLORS.info },
  PENDING: { label: 'OCZEKUJACA', color: COLORS.warning },
  CONFIRMED: { label: 'POTWIERDZONA', color: COLORS.success },
  COMPLETED: { label: 'ZAKONCZONA', color: COLORS.textMuted },
  CANCELLED: { label: 'ANULOWANA', color: COLORS.danger },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  TRANSFER: 'Przelew bankowy',
  CASH: 'Gotowka',
  BLIK: 'BLIK',
  CARD: 'Karta platnicza',
};

/** Polish day-of-week translations (shared helper) */
const DAY_OF_WEEK_PL: Record<string, string> = {
  'Monday': 'Poniedzialek',
  'Tuesday': 'Wtorek',
  'Wednesday': 'Sroda',
  'Thursday': 'Czwartek',
  'Friday': 'Piatek',
  'Saturday': 'Sobota',
  'Sunday': 'Niedziela',
};

// ═══════════════ PDF SERVICE ═══════════════

export class PDFService {
  private readonly FONT_PATHS = {
    regular: [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/dejavu/DejaVuSans.ttf',
      './fonts/DejaVuSans.ttf',
    ],
    bold: [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
      './fonts/DejaVuSans-Bold.ttf',
    ],
  };

  private useCustomFonts: boolean = false;
  private fontRegular?: string;
  private fontBold?: string;
  private restaurantData: RestaurantData;

  constructor() {
    this.restaurantData = {
      name: process.env.RESTAURANT_NAME || 'Gosciniec Rodzinny',
      address: process.env.RESTAURANT_ADDRESS || '',
      phone: process.env.RESTAURANT_PHONE || '',
      email: process.env.RESTAURANT_EMAIL || '',
      website: process.env.RESTAURANT_WEBSITE || '',
      nip: process.env.RESTAURANT_NIP || '',
    };
    this.checkFontsAvailability();
  }

  private async refreshRestaurantData(): Promise<void> {
    try {
      const settings = await companySettingsService.getSettings();
      this.restaurantData = {
        name: settings.companyName || this.restaurantData.name,
        address: [settings.address, settings.postalCode, settings.city]
          .filter(Boolean)
          .join(', ') || this.restaurantData.address,
        phone: settings.phone || this.restaurantData.phone,
        email: settings.email || this.restaurantData.email,
        website: settings.website || this.restaurantData.website,
        nip: settings.nip || this.restaurantData.nip,
      };
    } catch (error) {
      console.warn('[PDF Service] Could not load company settings from DB, using fallbacks');
    }
  }

  private checkFontsAvailability(): void {
    for (const path of this.FONT_PATHS.regular) {
      if (fs.existsSync(path)) {
        this.fontRegular = path;
        console.log(`[PDF Service] Found regular font at: ${path}`);
        break;
      }
    }
    for (const path of this.FONT_PATHS.bold) {
      if (fs.existsSync(path)) {
        this.fontBold = path;
        console.log(`[PDF Service] Found bold font at: ${path}`);
        break;
      }
    }
    if (this.fontRegular && this.fontBold) {
      this.useCustomFonts = true;
      console.log('[PDF Service] Using custom DejaVu fonts for Polish characters');
    } else {
      console.warn('[PDF Service] DejaVu fonts not found, using built-in fonts (limited Polish character support)');
    }
  }

  private setupFonts(doc: PDFKit.PDFDocument): void {
    if (this.useCustomFonts && this.fontRegular && this.fontBold) {
      doc.registerFont('DejaVu', this.fontRegular);
      doc.registerFont('DejaVu-Bold', this.fontBold);
      doc.font('DejaVu');
    } else {
      doc.font('Helvetica');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  SHARED PREMIUM HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Premium header banner — navy background + gold accent + restaurant info.
   * Optionally shows a status badge in the top-right corner.
   * Used by: reservation, payment confirmation, menu card, reports.
   */
  private drawHeaderBanner(
    doc: PDFKit.PDFDocument,
    badgeLabel?: string,
    badgeColor?: string
  ): void {
    const bannerHeight = 65;
    const pageWidth = doc.page.width;

    // Dark navy banner
    doc.rect(0, 0, pageWidth, bannerHeight).fill(COLORS.primary);

    // Gold accent line at bottom
    doc.rect(0, bannerHeight - 3, pageWidth, 3).fill(COLORS.accent);

    // Restaurant name
    doc.fillColor('#ffffff').fontSize(18).font(this.getBoldFont());
    doc.text(this.restaurantData.name, 40, 14, { width: pageWidth - 200 });

    // Contact info
    doc.fontSize(7).font(this.getRegularFont()).fillColor(COLORS.textLight);
    const contactParts: string[] = [];
    if (this.restaurantData.phone) contactParts.push(this.restaurantData.phone);
    if (this.restaurantData.email) contactParts.push(this.restaurantData.email);
    if (this.restaurantData.website) contactParts.push(this.restaurantData.website);
    if (contactParts.length > 0) {
      doc.text(contactParts.join('  |  '), 40, 38, { width: pageWidth - 200 });
    }
    if (this.restaurantData.nip) {
      doc.text(`NIP: ${this.restaurantData.nip}`, 40, 50, { width: pageWidth - 200 });
    }

    // Status badge (top-right) — optional
    if (badgeLabel) {
      const color = badgeColor || COLORS.textMuted;
      const badgeWidth = 120;
      const badgeHeight = 22;
      const badgeX = pageWidth - badgeWidth - 40;
      const badgeY = 20;

      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4).fill(color);
      doc.fillColor('#ffffff').fontSize(9).font(this.getBoldFont());
      doc.text(badgeLabel, badgeX, badgeY + 6, { width: badgeWidth, align: 'center' });
    }
  }

  /**
   * Premium section header — bold title.
   */
  private drawSectionHeader(
    doc: PDFKit.PDFDocument,
    title: string,
    left: number,
    pageWidth: number
  ): void {
    doc.fontSize(11).font(this.getBoldFont()).fillColor(COLORS.textDark);
    doc.text(title, left, doc.y);
    doc.moveDown(0.3);
  }

  /**
   * Safe page break — adds a new page if remaining space is less than minSpace.
   * Returns the current Y position after potential page break.
   */
  private safePageBreak(doc: PDFKit.PDFDocument, minSpace: number = 100): number {
    if (doc.y > doc.page.height - minSpace) {
      doc.addPage();
      doc.y = 50;
    }
    return doc.y;
  }

  /**
   * Info box with title, accent bar, and content lines.
   */
  private drawInfoBox(
    doc: PDFKit.PDFDocument,
    title: string,
    x: number,
    y: number,
    width: number,
    lines: string[]
  ): void {
    const boxHeight = this.calculateInfoBoxHeight(lines.length);

    doc.rect(x, y, width, boxHeight).fill(COLORS.bgLight);
    doc.rect(x, y, 3, boxHeight).fill(COLORS.accent);

    doc.fillColor(COLORS.textMuted).fontSize(7).font(this.getBoldFont());
    doc.text(title, x + 12, y + 8, { width: width - 20 });

    doc.fontSize(9).font(this.getRegularFont()).fillColor(COLORS.textDark);
    let lineY = y + 22;
    lines.forEach((line, i) => {
      if (i === 0) {
        doc.font(this.getBoldFont()).fontSize(10);
      } else {
        doc.font(this.getRegularFont()).fontSize(8);
      }
      doc.text(line, x + 12, lineY, { width: width - 20 });
      lineY += i === 0 ? 15 : 12;
    });
  }

  private calculateInfoBoxHeight(lineCount: number): number {
    return Math.max(60, 28 + lineCount * 13);
  }

  /**
   * Thin horizontal separator line.
   */
  private drawSeparator(doc: PDFKit.PDFDocument, left: number, width: number): void {
    const y = doc.y;
    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(left, y).lineTo(left + width, y).stroke();
  }

  /**
   * Inline footer — sits in the flow (no absolute positioning).
   */
  private drawInlineFooter(doc: PDFKit.PDFDocument, left: number, pageWidth: number): void {
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    doc.fontSize(7).fillColor(COLORS.textMuted).font(this.getRegularFont());

    const footerParts: string[] = [
      `Dziekujemy za wybor ${this.restaurantData.name}!`,
    ];
    const contactParts: string[] = [];
    if (this.restaurantData.phone) contactParts.push(this.restaurantData.phone);
    if (this.restaurantData.email) contactParts.push(this.restaurantData.email);
    if (contactParts.length > 0) {
      footerParts.push(`W razie pytan: ${contactParts.join(' | ')}`);
    }
    doc.text(footerParts.join('  |  '), left, doc.y, {
      align: 'center', width: pageWidth,
    });

    doc.moveDown(0.2);
    doc.fontSize(6).fillColor(COLORS.textLight);
    doc.text(
      `Dokument wygenerowany automatycznie przez system ${this.restaurantData.name}`,
      left, doc.y,
      { align: 'center', width: pageWidth },
    );
  }

  /**
   * Compact table with header row, alternating backgrounds, page-break support.
   */
  private drawCompactTable(
    doc: PDFKit.PDFDocument,
    headers: string[],
    rows: string[][],
    colWidths: number[],
    startX: number
  ): void {
    const rowHeight = 16;
    const headerHeight = 18;
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    let y = doc.y;

    // Header row
    doc.rect(startX, y, totalWidth, headerHeight).fill(COLORS.primaryLight);
    let x = startX;
    headers.forEach((header, i) => {
      doc.fillColor('#ffffff').fontSize(7).font(this.getBoldFont());
      doc.text(header, x + 5, y + 5, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });
    y += headerHeight;

    // Data rows
    rows.forEach((row, rowIndex) => {
      /* istanbul ignore next */
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 50;
      }

      if (rowIndex % 2 === 0) {
        doc.rect(startX, y, totalWidth, rowHeight).fill(COLORS.bgLight);
      }

      x = startX;
      row.forEach((cell, i) => {
        const isFirstCol = i === 0;
        doc.fillColor(COLORS.textDark)
           .fontSize(7)
           .font(isFirstCol ? this.getBoldFont() : this.getRegularFont());
        doc.text(cell, x + 5, y + 4, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });
      y += rowHeight;
    });

    // Bottom border
    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(startX, y).lineTo(startX + totalWidth, y).stroke();

    doc.y = y + 3;
  }

  /**
   * Translate English day-of-week name to Polish.
   * Shared helper used by report builders.
   */
  private translateDayOfWeek(day: string): string {
    return DAY_OF_WEEK_PL[day] || day;
  }

  // ═══════════════ PUBLIC API ═══════════════

  async generateReservationPDF(reservation: ReservationPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      console.log(`[PDF Service] Generating PDF for reservation ${reservation.id}`);
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 30, left: 40, right: 40 },
        info: {
          Title: `Rezerwacja ${reservation.id}`,
          Author: this.restaurantData.name,
          Subject: 'Potwierdzenie rezerwacji sali',
        },
      });
      this.setupFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`[PDF Service] PDF generated successfully, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      /* istanbul ignore next */
      doc.on('error', (error) => reject(error));
      this.buildReservationPDF(doc, reservation);
      doc.end();
    });
  }

  async generatePaymentConfirmationPDF(data: PaymentConfirmationData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      console.log(`[PDF Service] Generating payment confirmation PDF for deposit ${data.depositId}`);
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 30, left: 40, right: 40 },
        info: {
          Title: `Potwierdzenie wplaty ${data.depositId}`,
          Author: this.restaurantData.name,
          Subject: 'Potwierdzenie wplaty zaliczki',
        },
      });
      this.setupFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`[PDF Service] Payment confirmation PDF generated, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      /* istanbul ignore next */
      doc.on('error', (error) => reject(error));
      this.buildPaymentConfirmationPremium(doc, data);
      doc.end();
    });
  }

  async generateMenuCardPDF(data: MenuCardPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      console.log(`[PDF Service] Generating menu card PDF: ${data.templateName}`);
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 30, left: 40, right: 40 },
        bufferPages: true,
        info: {
          Title: `Karta Menu - ${data.templateName}`,
          Author: this.restaurantData.name,
          Subject: 'Karta menu',
        },
      });
      this.setupFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`[PDF Service] Menu card PDF generated, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      /* istanbul ignore next */
      doc.on('error', (error) => reject(error));
      this.buildMenuCardPremium(doc, data);
      doc.end();
    });
  }

  /**
   * Generate premium revenue report PDF.
   * Migrated from reports-export.service.ts (Zadanie 4).
   */
  async generateRevenueReportPDF(data: RevenueReportPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      console.log('[PDF Service] Generating revenue report PDF');
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 30, left: 40, right: 40 },
        info: {
          Title: 'Raport Przychodow',
          Author: this.restaurantData.name,
          Subject: 'Raport przychodow',
        },
      });
      this.setupFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`[PDF Service] Revenue report PDF generated, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      /* istanbul ignore next */
      doc.on('error', (error) => reject(error));
      this.buildRevenueReportPDF(doc, data);
      doc.end();
    });
  }

  /**
   * Generate premium occupancy report PDF.
   * Migrated from reports-export.service.ts (Zadanie 4).
   */
  async generateOccupancyReportPDF(data: OccupancyReportPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      console.log('[PDF Service] Generating occupancy report PDF');
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 30, left: 40, right: 40 },
        info: {
          Title: 'Raport Zajetosci',
          Author: this.restaurantData.name,
          Subject: 'Raport zajetosci sal',
        },
      });
      this.setupFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`[PDF Service] Occupancy report PDF generated, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      /* istanbul ignore next */
      doc.on('error', (error) => reject(error));
      this.buildOccupancyReportPDF(doc, data);
      doc.end();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM RESERVATION PDF — #157 Redesign
  // ═══════════════════════════════════════════════════════════════

  private buildReservationPDF(doc: PDFKit.PDFDocument, r: ReservationPDFData): void {
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // ── 1. PREMIUM HEADER BANNER ──
    /* istanbul ignore next */
    const statusInfo = STATUS_MAP[r.status] || { label: r.status, color: COLORS.textMuted };
    this.drawHeaderBanner(doc, statusInfo.label, statusInfo.color);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(this.getBoldFont());
    doc.text('POTWIERDZENIE REZERWACJI', left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
    const shortId = r.id.length > 20 ? r.id.substring(0, 8) + '...' : r.id;
    doc.text(`Nr: ${shortId}  |  Wygenerowano: ${this.formatDate(new Date())}`, left, doc.y, {
      align: 'center', width: pageWidth,
    });

    doc.moveDown(0.6);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. TWO-COLUMN: CLIENT | EVENT ──
    this.drawClientAndEventColumns(doc, r, left, pageWidth);

    doc.moveDown(0.4);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    // ── 4. MENU TABLE ──
    const menuSnapshot = r.menuSnapshot;
    if (menuSnapshot && menuSnapshot.menuData) {
      this.drawMenuTable(doc, menuSnapshot, left, pageWidth);
      doc.moveDown(0.3);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    } else if (r.menuData?.dishSelections && r.menuData.dishSelections.length > 0) {
      this.drawMenuTableLegacy(doc, r.menuData, left, pageWidth);
      doc.moveDown(0.3);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 5. EXTRAS (inline chips) ──
    if (r.reservationExtras && r.reservationExtras.length > 0) {
      this.drawExtrasInline(doc, r.reservationExtras, left, pageWidth);
      doc.moveDown(0.3);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 6. FINANCIAL SUMMARY BOX ──
    this.drawFinancialSummary(doc, r, left, pageWidth);

    // ── 7. NOTES ──
    if (r.notes) {
      doc.moveDown(0.4);
      doc.fontSize(8).font(this.getBoldFont()).fillColor(COLORS.textDark);
      doc.text('Uwagi: ', left, doc.y, { continued: true });
      doc.font(this.getRegularFont()).fillColor(COLORS.textMuted);
      doc.text(r.notes, { width: pageWidth - 40 });
    }

    // ── 8. FOOTER ──
    doc.moveDown(1);
    this.drawInlineFooter(doc, left, pageWidth);
  }

  // ── TWO-COLUMN: CLIENT | EVENT ──
  private drawClientAndEventColumns(
    doc: PDFKit.PDFDocument,
    r: ReservationPDFData,
    left: number,
    pageWidth: number
  ): void {
    const colGap = 20;
    const colWidth = (pageWidth - colGap) / 2;
    const startY = doc.y;

    this.drawInfoBox(doc, 'KLIENT', left, startY, colWidth, [
      `${r.client.firstName} ${r.client.lastName}`,
      r.client.email || '',
      r.client.phone,
      r.client.address || '',
    ].filter(Boolean));

    /* istanbul ignore next */
    const eventTypeName = r.customEventType || r.eventType?.name || 'Nie okreslono';
    let dateStr = '';
    let timeStr = '';
    if (r.startDateTime && r.endDateTime) {
      dateStr = this.formatDate(r.startDateTime);
      timeStr = `${this.formatTime(r.startDateTime)} - ${this.formatTime(r.endDateTime)}`;
    } else if (r.date && r.startTime && r.endTime) {
      dateStr = r.date;
      timeStr = `${r.startTime} - ${r.endTime}`;
    }

    const guestParts: string[] = [];
    if (r.adults > 0) guestParts.push(`${r.adults} dor.`);
    if (r.children > 0) guestParts.push(`${r.children} dz.`);
    if (r.toddlers > 0) guestParts.push(`${r.toddlers} mal.`);
    const guestLine = `${r.guests} osob (${guestParts.join(', ')})`;

    const eventDetails: string[] = [
      eventTypeName,
      dateStr && timeStr ? `${dateStr}  ${timeStr}` : dateStr || timeStr,
      guestLine,
    ];
    /* istanbul ignore next */
    if (r.birthdayAge) eventDetails.push(`Wiek jubilata: ${r.birthdayAge} lat`);
    /* istanbul ignore next */
    if (r.anniversaryYear) {
      eventDetails.push(`Rocznica: ${r.anniversaryYear} lat${r.anniversaryOccasion ? ` (${r.anniversaryOccasion})` : ''}`);
    }

    this.drawInfoBox(doc, 'WYDARZENIE', left + colWidth + colGap, startY, colWidth,
      eventDetails.filter(Boolean)
    );

    const boxHeight = this.calculateInfoBoxHeight(Math.max(
      [r.client.firstName, r.client.email, r.client.phone, r.client.address].filter(Boolean).length,
      eventDetails.filter(Boolean).length
    ));
    doc.y = startY + boxHeight + 5;
  }

  // ── MENU TABLE (reservation) ──
  private drawMenuTable(
    doc: PDFKit.PDFDocument,
    menuSnapshot: MenuSnapshot,
    left: number,
    pageWidth: number
  ): void {
    /* istanbul ignore next */
    const packageName = menuSnapshot.menuData?.packageName || menuSnapshot.menuData?.package?.name || '';
    this.drawSectionHeader(doc, 'WYBRANE MENU', left, pageWidth);
    if (packageName) {
      doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
      doc.text(`Pakiet: ${packageName}  |  Cena menu: ${this.formatCurrency(menuSnapshot.totalMenuPrice)}`, left, doc.y);
    }
    doc.moveDown(0.3);

    /* istanbul ignore next */
    const dishSelections: CategorySelection[] = menuSnapshot.menuData?.dishSelections || [];
    if (dishSelections.length === 0) {
      doc.fontSize(9).fillColor(COLORS.textMuted).text('Brak wybranych dan', left);
      return;
    }

    const allAllergens = new Set<string>();
    const tableRows: string[][] = [];

    dishSelections.forEach((category) => {
      const dishNames = category.dishes.map((d) => {
        if (d.allergens) d.allergens.forEach((a) => allAllergens.add(a));
        const qty = d.quantity > 1 ? `${d.quantity}x ` : '';
        return `${qty}${d.dishName}`;
      });

      let dishText = dishNames.join(', ');
      if (dishText.length > 80) {
        dishText = dishText.substring(0, 77) + '...';
      }

      tableRows.push([category.categoryName, `${category.dishes.length}`, dishText]);
    });

    const colWidths = [Math.round(pageWidth * 0.22), Math.round(pageWidth * 0.08), Math.round(pageWidth * 0.70)];
    this.drawCompactTable(doc, ['Kategoria', 'Ilosc', 'Wybrane dania'], tableRows, colWidths, left);

    if (allAllergens.size > 0) {
      doc.moveDown(0.2);
      const labels = Array.from(allAllergens).map((a) => ALLERGEN_LABELS[a] || a).join(', ');
      doc.fontSize(7).fillColor(COLORS.allergen);
      doc.text(`Alergeny: ${labels}`, left);
      doc.fillColor(COLORS.textDark);
    }
  }

  private drawMenuTableLegacy(
    doc: PDFKit.PDFDocument,
    menuData: MenuData,
    left: number,
    pageWidth: number
  ): void {
    this.drawSectionHeader(doc, 'WYBRANE DANIA', left, pageWidth);
    if (menuData.packageName) {
      doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
      doc.text(`Pakiet: ${menuData.packageName}`, left, doc.y);
    }
    doc.moveDown(0.3);

    if (!menuData.dishSelections || menuData.dishSelections.length === 0) {
      doc.fontSize(9).fillColor(COLORS.textMuted).text('Brak wybranych dan', left);
      return;
    }

    const allAllergens = new Set<string>();
    const tableRows: string[][] = [];

    menuData.dishSelections.forEach((category) => {
      const dishNames = category.dishes.map((d) => {
        if (d.allergens) d.allergens.forEach((a) => allAllergens.add(a));
        const qty = d.quantity > 1 ? `${d.quantity}x ` : '';
        return `${qty}${d.dishName}`;
      });
      let dishText = dishNames.join(', ');
      if (dishText.length > 80) dishText = dishText.substring(0, 77) + '...';
      tableRows.push([category.categoryName, `${category.dishes.length}`, dishText]);
    });

    const colWidths = [Math.round(pageWidth * 0.22), Math.round(pageWidth * 0.08), Math.round(pageWidth * 0.70)];
    this.drawCompactTable(doc, ['Kategoria', 'Ilosc', 'Wybrane dania'], tableRows, colWidths, left);

    if (allAllergens.size > 0) {
      doc.moveDown(0.2);
      const labels = Array.from(allAllergens).map((a) => ALLERGEN_LABELS[a] || a).join(', ');
      doc.fontSize(7).fillColor(COLORS.allergen);
      doc.text(`Alergeny: ${labels}`, left);
      doc.fillColor(COLORS.textDark);
    }
  }

  // ── EXTRAS INLINE ──
  private drawExtrasInline(
    doc: PDFKit.PDFDocument,
    extras: ReservationExtraForPDF[],
    left: number,
    pageWidth: number
  ): void {
    this.drawSectionHeader(doc, 'USLUGI DODATKOWE', left, pageWidth);

    const grouped = new Map<string, ReservationExtraForPDF[]>();
    for (const extra of extras) {
      const catName = extra.serviceItem.category?.name || 'Inne';
      if (!grouped.has(catName)) grouped.set(catName, []);
      grouped.get(catName)!.push(extra);
    }

    for (const [categoryName, items] of grouped) {
      doc.fontSize(8).font(this.getBoldFont()).fillColor(COLORS.primaryLight);
      doc.text(`${categoryName}:`, left, doc.y, { continued: true });
      doc.font(this.getRegularFont()).fillColor(COLORS.textDark);

      const chips = items.map((item) => {
        const itemTotal = Number(item.totalPrice);
        switch (item.priceType) {
          case 'FREE':
            return `${item.serviceItem.name} (Gratis)`;
          case 'PER_PERSON':
            return `${item.serviceItem.name} (${this.formatCurrency(itemTotal)})`;
          case 'PER_UNIT':
            return `${item.serviceItem.name} ${item.quantity}szt. (${this.formatCurrency(itemTotal)})`;
          case 'FLAT':
          default:
            return `${item.serviceItem.name} (${this.formatCurrency(itemTotal)})`;
        }
      });

      doc.text(`  ${chips.join('  |  ')}`, { width: pageWidth - 10 });

      for (const item of items) {
        if (item.note) {
          doc.fontSize(7).fillColor(COLORS.textMuted);
          doc.text(`  Uwaga: ${item.note}`, left + 10);
        }
      }
      doc.moveDown(0.1);
    }
  }

  // ── FINANCIAL SUMMARY BOX ──
  private drawFinancialSummary(
    doc: PDFKit.PDFDocument,
    r: ReservationPDFData,
    left: number,
    pageWidth: number
  ): void {
    const extrasTotalCalc = (r.reservationExtras || [])
      .reduce((sum, e) => sum + Number(e.totalPrice), 0);
    const venueSurchargeAmount = Number(r.venueSurcharge) || 0;
    const displayTotal = Number(r.totalPrice) + extrasTotalCalc;

    /* istanbul ignore next */
    const deposit = r.deposits && r.deposits.length > 0
      ? r.deposits[0]
      : r.deposit;

    let rowCount = 0;
    if (r.adults > 0 && r.pricePerAdult > 0) rowCount++;
    if (r.children > 0 && r.pricePerChild > 0) rowCount++;
    if (r.toddlers > 0 && r.pricePerToddler > 0) rowCount++;
    if (extrasTotalCalc > 0) rowCount++;
    if (venueSurchargeAmount > 0) rowCount++;
    rowCount++;
    if (deposit) rowCount += 2;
    const boxHeight = 30 + rowCount * 18 + (deposit ? 20 : 0);

    this.safePageBreak(doc, boxHeight + 20);
    const boxY = doc.y;

    doc.rect(left, boxY, pageWidth, boxHeight).fill(COLORS.bgLight);
    doc.rect(left, boxY, 3, boxHeight).fill(COLORS.accent);

    doc.fillColor(COLORS.textDark).fontSize(11).font(this.getBoldFont());
    doc.text('PODSUMOWANIE', left + 15, boxY + 10);

    let y = boxY + 30;
    const labelX = left + 15;
    const rightEdge = left + pageWidth - 15;
    const valueWidth = 115;
    const valueX = rightEdge - valueWidth;

    doc.fontSize(9).font(this.getRegularFont()).fillColor(COLORS.textDark);

    if (r.adults > 0 && r.pricePerAdult > 0) {
      const adultTotal = r.adults * Number(r.pricePerAdult);
      doc.text(`Dorosli: ${r.adults} os. x ${this.formatCurrency(r.pricePerAdult)}`, labelX, y);
      doc.text(this.formatCurrency(adultTotal), valueX, y, { width: valueWidth, align: 'right' });
      y += 16;
    }
    /* istanbul ignore next */
    if (r.children > 0 && r.pricePerChild > 0) {
      const childTotal = r.children * Number(r.pricePerChild);
      doc.text(`Dzieci (4-12 lat): ${r.children} os. x ${this.formatCurrency(r.pricePerChild)}`, labelX, y);
      doc.text(this.formatCurrency(childTotal), valueX, y, { width: valueWidth, align: 'right' });
      y += 16;
    }
    /* istanbul ignore next */
    if (r.toddlers > 0 && r.pricePerToddler > 0) {
      const toddlerTotal = r.toddlers * Number(r.pricePerToddler);
      doc.text(`Maluchy (0-3 lata): ${r.toddlers} os. x ${this.formatCurrency(r.pricePerToddler)}`, labelX, y);
      doc.text(this.formatCurrency(toddlerTotal), valueX, y, { width: valueWidth, align: 'right' });
      y += 16;
    }
    if (extrasTotalCalc > 0) {
      doc.text('Uslugi dodatkowe', labelX, y);
      doc.text(this.formatCurrency(extrasTotalCalc), valueX, y, { width: valueWidth, align: 'right' });
      y += 16;
    }
    if (venueSurchargeAmount > 0) {
      const surchargeLabel = r.venueSurchargeLabel || 'Doplata za caly obiekt';
      doc.text(surchargeLabel, labelX, y);
      doc.text(this.formatCurrency(venueSurchargeAmount), valueX, y, { width: valueWidth, align: 'right' });
      y += 16;
    }

    y += 4;
    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(labelX, y).lineTo(rightEdge, y).stroke();
    y += 8;

    doc.fontSize(11).font(this.getBoldFont()).fillColor(COLORS.textDark);
    doc.text('RAZEM', labelX, y);
    doc.text(this.formatCurrency(displayTotal), valueX, y, { width: valueWidth, align: 'right' });
    y += 20;

    if (deposit) {
      const depositBadgeWidth = 40;
      const depositBadgeGap = 6;
      const depositValueWidth = valueWidth - depositBadgeWidth - depositBadgeGap;
      const depositValueX = valueX;

      doc.fontSize(9).font(this.getRegularFont()).fillColor(COLORS.success);
      /* istanbul ignore next */
      const dueDate = deposit.dueDate instanceof Date
        ? this.formatDate(deposit.dueDate)
        : deposit.dueDate;
      const depositLabel = deposit.paid ? 'Zaliczka (oplacona)' : `Zaliczka (termin: ${dueDate})`;
      doc.text(depositLabel, labelX, y);
      doc.text(`-${this.formatCurrency(deposit.amount)}`, depositValueX, y, { width: depositValueWidth, align: 'right' });

      const statusColor = deposit.paid ? COLORS.success : COLORS.warning;
      const statusText = deposit.paid ? 'OK' : 'OCZEK.';
      const depositBadgeX = depositValueX + depositValueWidth + depositBadgeGap;
      doc.roundedRect(depositBadgeX, y - 1, depositBadgeWidth, 13, 3).fill(statusColor);
      doc.fillColor('#ffffff').fontSize(6).font(this.getBoldFont());
      doc.text(statusText, depositBadgeX, y + 2, { width: depositBadgeWidth, align: 'center' });

      y += 18;

      doc.strokeColor(COLORS.accent).lineWidth(1)
         .moveTo(labelX, y).lineTo(rightEdge, y).stroke();
      y += 8;

      const remaining = displayTotal - Number(deposit.amount);
      doc.fontSize(12).font(this.getBoldFont()).fillColor(COLORS.primary);
      doc.text('DO ZAPLATY', labelX, y);
      doc.text(this.formatCurrency(remaining), valueX, y, { width: valueWidth, align: 'right' });
    }

    doc.y = boxY + boxHeight + 5;
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM PAYMENT CONFIRMATION — Zadanie 2
  // ═══════════════════════════════════════════════════════════════

  private buildPaymentConfirmationPremium(
    doc: PDFKit.PDFDocument,
    data: PaymentConfirmationData
  ): void {
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // ── 1. HEADER BANNER with "OPLACONA" badge ──
    this.drawHeaderBanner(doc, 'OPLACONA', COLORS.success);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(this.getBoldFont());
    doc.text('POTWIERDZENIE WPLATY ZALICZKI', left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
    const shortDepositId = data.depositId.length > 20 ? data.depositId.substring(0, 8) + '...' : data.depositId;
    doc.text(`Nr: ${shortDepositId}  |  Wygenerowano: ${this.formatDate(new Date())}`, left, doc.y, {
      align: 'center', width: pageWidth,
    });

    doc.moveDown(0.6);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. TWO-COLUMN: KLIENT | WPLATA ──
    const colGap = 20;
    const colWidth = (pageWidth - colGap) / 2;
    const startY = doc.y;

    this.drawInfoBox(doc, 'KLIENT', left, startY, colWidth, [
      `${data.client.firstName} ${data.client.lastName}`,
      data.client.email || '',
      data.client.phone,
      data.client.address || '',
    ].filter(Boolean));

    /* istanbul ignore next */
    const methodLabel = PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod;
    const paymentLines: string[] = [
      this.formatCurrency(data.amount),
      `Data: ${this.formatDate(data.paidAt)}`,
      `Metoda: ${methodLabel}`,
    ];
    if (data.paymentReference) {
      paymentLines.push(`Ref: ${data.paymentReference}`);
    }

    this.drawInfoBox(doc, 'SZCZEGOLY WPLATY', left + colWidth + colGap, startY, colWidth, paymentLines);

    const leftLines = [data.client.firstName, data.client.email, data.client.phone, data.client.address].filter(Boolean).length;
    const boxHeight = this.calculateInfoBoxHeight(Math.max(leftLines, paymentLines.length));
    doc.y = startY + boxHeight + 5;

    doc.moveDown(0.4);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    // ── 4. RESERVATION INFO BOX (full-width) ──
    const resLines: string[] = [
      `${data.reservation.date}  ${data.reservation.startTime} - ${data.reservation.endTime}`,
    ];
    if (data.reservation.hall) resLines.push(`Sala: ${data.reservation.hall}`);
    if (data.reservation.eventType) resLines.push(`Typ: ${data.reservation.eventType}`);
    resLines.push(`Gosci: ${data.reservation.guests}`);

    const shortResId = data.reservation.id.length > 20
      ? data.reservation.id.substring(0, 8) + '...'
      : data.reservation.id;
    resLines.push(`Nr rezerwacji: ${shortResId}`);

    this.drawInfoBox(doc, 'REZERWACJA', left, doc.y, pageWidth, resLines);
    const resBoxHeight = this.calculateInfoBoxHeight(resLines.length);
    doc.y = doc.y + resBoxHeight + 5;

    doc.moveDown(0.4);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    // ── 5. FINANCIAL SUMMARY BOX ──
    const totalPrice = Number(data.reservation.totalPrice);
    const paidAmount = Number(data.amount);
    const remaining = totalPrice - paidAmount;

    const finBoxHeight = 30 + 4 * 18 + 10;

    this.safePageBreak(doc, finBoxHeight + 20);
    const finBoxY = doc.y;

    doc.rect(left, finBoxY, pageWidth, finBoxHeight).fill(COLORS.bgLight);
    doc.rect(left, finBoxY, 3, finBoxHeight).fill(COLORS.accent);

    doc.fillColor(COLORS.textDark).fontSize(11).font(this.getBoldFont());
    doc.text('PODSUMOWANIE FINANSOWE', left + 15, finBoxY + 10);

    let y = finBoxY + 30;
    const labelX = left + 15;
    const rightEdge = left + pageWidth - 15;
    const valueWidth = 115;
    const valueX = rightEdge - valueWidth;

    doc.fontSize(9).font(this.getRegularFont()).fillColor(COLORS.textDark);
    doc.text('Calkowita cena rezerwacji', labelX, y);
    doc.text(this.formatCurrency(totalPrice), valueX, y, { width: valueWidth, align: 'right' });
    y += 16;

    const depositBadgeWidth = 40;
    const depositBadgeGap = 6;
    const depositValueWidth = valueWidth - depositBadgeWidth - depositBadgeGap;

    doc.fontSize(9).font(this.getRegularFont()).fillColor(COLORS.success);
    doc.text('Wplacona zaliczka', labelX, y);
    doc.text(`-${this.formatCurrency(paidAmount)}`, valueX, y, { width: depositValueWidth, align: 'right' });

    const badgeX = valueX + depositValueWidth + depositBadgeGap;
    doc.roundedRect(badgeX, y - 1, depositBadgeWidth, 13, 3).fill(COLORS.success);
    doc.fillColor('#ffffff').fontSize(6).font(this.getBoldFont());
    doc.text('ZAKS.', badgeX, y + 2, { width: depositBadgeWidth, align: 'center' });
    y += 18;

    y += 4;
    doc.strokeColor(COLORS.accent).lineWidth(1)
       .moveTo(labelX, y).lineTo(rightEdge, y).stroke();
    y += 8;

    doc.fontSize(12).font(this.getBoldFont()).fillColor(COLORS.primary);
    doc.text('POZOSTALO DO ZAPLATY', labelX, y);
    doc.text(this.formatCurrency(remaining), valueX, y, { width: valueWidth, align: 'right' });

    doc.y = finBoxY + finBoxHeight + 5;

    // ── 6. FOOTER ──
    doc.moveDown(1);
    this.drawInlineFooter(doc, left, pageWidth);
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM MENU CARD — Zadanie 3
  // ═══════════════════════════════════════════════════════════════

  private buildMenuCardPremium(doc: PDFKit.PDFDocument, data: MenuCardPDFData): void {
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // ── 1. HEADER BANNER with "KARTA MENU" badge ──
    this.drawHeaderBanner(doc, 'KARTA MENU', COLORS.accent);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(this.getBoldFont());
    doc.text(data.templateName.toUpperCase(), left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    const subtitleParts: string[] = [data.eventTypeName];
    if (data.variant) subtitleParts.push(data.variant);
    doc.fontSize(9).font(this.getRegularFont()).fillColor(COLORS.textMuted);
    doc.text(subtitleParts.join('  |  '), left, doc.y, { align: 'center', width: pageWidth });

    if (data.templateDescription) {
      doc.moveDown(0.3);
      doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
      doc.text(data.templateDescription, left, doc.y, { align: 'center', width: pageWidth });
    }

    doc.moveDown(0.2);
    doc.fontSize(7).fillColor(COLORS.textLight);
    doc.text(`Wygenerowano: ${this.formatDate(new Date())}`, left, doc.y, {
      align: 'center', width: pageWidth,
    });

    doc.moveDown(0.6);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. PACKAGES ──
    data.packages.forEach((pkg, pkgIndex) => {
      if (pkgIndex > 0) {
        doc.moveDown(0.5);
        this.drawSeparator(doc, left, pageWidth);
        doc.moveDown(0.5);
      }

      this.safePageBreak(doc, 200);

      // Package header box — navy background + gold accent
      const pkgHeaderY = doc.y;
      const headerHeight = 55;
      doc.rect(left, pkgHeaderY, pageWidth, headerHeight).fill(COLORS.primary);
      doc.rect(left, pkgHeaderY + headerHeight - 3, pageWidth, 3).fill(COLORS.accent);

      // Badge (POPULARNY / POLECANY / custom) — roundedRect style
      /* istanbul ignore next */
      const badgeText = pkg.badgeText || (pkg.isPopular ? 'POPULARNY' : pkg.isRecommended ? 'POLECANY' : null);
      if (badgeText) {
        const pkgBadgeWidth = 90;
        const pkgBadgeX = left + pageWidth - pkgBadgeWidth - 10;
        doc.roundedRect(pkgBadgeX, pkgHeaderY + 8, pkgBadgeWidth, 18, 4).fill(COLORS.accent);
        doc.fillColor(COLORS.primary).fontSize(7).font(this.getBoldFont());
        doc.text(badgeText, pkgBadgeX, pkgHeaderY + 12, { width: pkgBadgeWidth, align: 'center' });
      }

      // Package name
      doc.fillColor('#ffffff').fontSize(14).font(this.getBoldFont());
      doc.text(pkg.name, left + 15, pkgHeaderY + 10, { width: pageWidth - 130 });

      // Prices
      doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textLight);
      const priceParts = [`${this.formatCurrency(pkg.pricePerAdult)}/os. dorosla`];
      if (pkg.pricePerChild > 0) priceParts.push(`${this.formatCurrency(pkg.pricePerChild)}/dziecko`);
      if (pkg.pricePerToddler > 0) priceParts.push(`${this.formatCurrency(pkg.pricePerToddler)}/maluch`);
      doc.text(priceParts.join('  |  '), left + 15, pkgHeaderY + 32, { width: pageWidth - 40 });

      doc.y = pkgHeaderY + headerHeight + 8;

      // Description
      if (pkg.description) {
        doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
        doc.text(pkg.description, left, doc.y, { width: pageWidth });
        doc.moveDown(0.3);
      }

      // Included items — info box style
      if (pkg.includedItems && pkg.includedItems.length > 0) {
        doc.fontSize(8).font(this.getBoldFont()).fillColor(COLORS.success);
        doc.text('W cenie: ', left, doc.y, { continued: true });
        doc.font(this.getRegularFont()).fillColor(COLORS.textDark);
        doc.text(pkg.includedItems.join(', '), { width: pageWidth - 60 });
        doc.moveDown(0.3);
      }

      // ── COURSES as compact tables ──
      if (pkg.courses.length > 0) {
        pkg.courses.forEach((course) => {
          this.safePageBreak(doc, 120);
          doc.moveDown(0.4);

          // Course header
          const selectText = course.minSelect === course.maxSelect
            ? `wybierz ${course.minSelect}`
            : `wybierz ${course.minSelect}-${course.maxSelect}`;

          doc.fontSize(10).font(this.getBoldFont()).fillColor(COLORS.primaryLight);
          doc.text(course.name, left, doc.y, { continued: true });
          doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
          doc.text(`  (${selectText} z ${course.dishes.length})`);

          /* istanbul ignore next */
          if (course.description) {
            doc.fontSize(7).font(this.getRegularFont()).fillColor(COLORS.textMuted);
            doc.text(course.description, left, doc.y);
          }

          doc.moveDown(0.2);

          // Build dish table rows
          const courseAllergens = new Set<string>();
          const dishRows: string[][] = [];

          course.dishes.forEach((dish) => {
            let marker = '';
            /* istanbul ignore next */
            if (dish.isRecommended) marker = '* ';
            else if (dish.isDefault) marker = '> ';

            const descText = dish.description || '';
            const allergenText = (dish.allergens && dish.allergens.length > 0)
              ? dish.allergens.map(a => ALLERGEN_LABELS[a] || a).join(', ')
              : '';

            if (dish.allergens) dish.allergens.forEach(a => courseAllergens.add(a));

            dishRows.push([
              `${marker}${dish.name}`,
              descText,
              allergenText,
            ]);
          });

          // Dish table — 3 columns: name, description, allergens
          const dishColWidths = [
            Math.round(pageWidth * 0.35),
            Math.round(pageWidth * 0.45),
            Math.round(pageWidth * 0.20),
          ];
          this.drawCompactTable(
            doc,
            ['Danie', 'Opis', 'Alergeny'],
            dishRows,
            dishColWidths,
            left
          );

          // Allergen summary for this course
          if (courseAllergens.size > 0) {
            doc.moveDown(0.1);
            const labels = Array.from(courseAllergens).map(a => ALLERGEN_LABELS[a] || a).join(', ');
            doc.fontSize(6).fillColor(COLORS.allergen);
            doc.text(`Alergeny w kursie: ${labels}`, left);
            doc.fillColor(COLORS.textDark);
          }
        });
      }

      // ── OPTIONS ──
      const requiredOptions = pkg.options.filter(o => o.isRequired);
      const activeOptions = pkg.options.filter(o => !o.isRequired);

      if (requiredOptions.length > 0) {
        this.safePageBreak(doc, 80);
        doc.moveDown(0.5);

        doc.fontSize(9).font(this.getBoldFont()).fillColor(COLORS.success);
        doc.text('W PAKIECIE', left, doc.y);
        doc.moveDown(0.2);

        const reqRows = requiredOptions.map(opt => [
          `+ ${opt.name}`,
          opt.description || '',
        ]);
        const reqColWidths = [Math.round(pageWidth * 0.40), Math.round(pageWidth * 0.60)];
        this.drawCompactTable(doc, ['Opcja', 'Opis'], reqRows, reqColWidths, left);
      }

      if (activeOptions.length > 0) {
        this.safePageBreak(doc, 80);
        doc.moveDown(0.5);

        doc.fontSize(9).font(this.getBoldFont()).fillColor(COLORS.purple);
        doc.text('OPCJE DODATKOWE', left, doc.y);
        doc.moveDown(0.2);

        const optRows = activeOptions.map(opt => {
          const priceLabel = opt.priceType === 'PER_PERSON'
            ? `+${this.formatCurrency(opt.priceAmount)}/os.`
            : `+${this.formatCurrency(opt.priceAmount)}`;
          return [
            opt.name,
            opt.description || '',
            priceLabel,
          ];
        });
        const optColWidths = [
          Math.round(pageWidth * 0.30),
          Math.round(pageWidth * 0.45),
          Math.round(pageWidth * 0.25),
        ];
        this.drawCompactTable(doc, ['Opcja', 'Opis', 'Cena'], optRows, optColWidths, left);
      }
    });

    // ── 4. LEGEND ──
    doc.moveDown(1);
    this.safePageBreak(doc, 80);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.3);

    this.drawInfoBox(doc, 'LEGENDA', left, doc.y, pageWidth, [
      '* = polecane przez szefa kuchni',
      '> = domyslny wybor',
      '+ = w cenie pakietu',
    ]);
    const legendHeight = this.calculateInfoBoxHeight(3);
    doc.y = doc.y + legendHeight + 5;

    // ── 5. FOOTER ──
    doc.moveDown(0.5);
    this.drawInlineFooter(doc, left, pageWidth);
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM REVENUE REPORT PDF — Zadanie 4
  // ═══════════════════════════════════════════════════════════════

  private buildRevenueReportPDF(doc: PDFKit.PDFDocument, data: RevenueReportPDFData): void {
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // ── 1. HEADER BANNER ──
    this.drawHeaderBanner(doc, 'RAPORT', COLORS.info);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(this.getBoldFont());
    doc.text('RAPORT PRZYCHODOW', left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
    const metaParts: string[] = [`Okres: ${data.filters.dateFrom} - ${data.filters.dateTo}`];
    if (data.filters.groupBy) metaParts.push(`Grupowanie: ${data.filters.groupBy}`);
    metaParts.push(`Wygenerowano: ${this.formatDate(new Date())}`);
    doc.text(metaParts.join('  |  '), left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.6);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. SUMMARY INFO BOX ──
    const summaryLines: string[] = [
      `Calkowity przychod: ${this.formatCurrency(data.summary.totalRevenue)}`,
      `Sredni przychod na rezerwacje: ${this.formatCurrency(data.summary.avgRevenuePerReservation)}`,
      `Liczba rezerwacji: ${data.summary.totalReservations}`,
      `Ukonczone rezerwacje: ${data.summary.completedReservations}`,
      `Oczekujacy przychod: ${this.formatCurrency(data.summary.pendingRevenue)}`,
      `Wzrost: ${data.summary.growthPercent}%`,
    ];
    if (data.summary.extrasRevenue !== undefined && data.summary.extrasRevenue > 0) {
      summaryLines.push(`Przychody z uslug dodatkowych: ${this.formatCurrency(data.summary.extrasRevenue)}`);
    }

    this.drawInfoBox(doc, 'PODSUMOWANIE', left, doc.y, pageWidth, summaryLines);
    const summaryBoxHeight = this.calculateInfoBoxHeight(summaryLines.length);
    doc.y = doc.y + summaryBoxHeight + 5;

    doc.moveDown(0.4);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    // ── 4. BREAKDOWN BY PERIOD ──
    if (data.breakdown.length > 0) {
      this.safePageBreak(doc, 100);
      this.drawSectionHeader(doc, 'ROZKLAD WG OKRESU', left, pageWidth);

      const breakdownRows = data.breakdown.slice(0, 20).map(item => [
        item.period,
        this.formatCurrency(item.revenue),
        `${item.count}`,
        this.formatCurrency(item.avgRevenue),
      ]);
      const breakdownCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
      ];
      this.drawCompactTable(doc, ['Okres', 'Przychod', 'Liczba', 'Srednia'], breakdownRows, breakdownCols, left);

      doc.moveDown(0.4);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 5. BY HALL ──
    if (data.byHall.length > 0) {
      this.safePageBreak(doc, 100);
      this.drawSectionHeader(doc, 'PRZYCHODY WG SAL', left, pageWidth);

      const hallRows = data.byHall.slice(0, 20).map(item => [
        item.hallName,
        this.formatCurrency(item.revenue),
        `${item.count}`,
        this.formatCurrency(item.avgRevenue),
      ]);
      const hallCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
      ];
      this.drawCompactTable(doc, ['Sala', 'Przychod', 'Liczba', 'Srednia'], hallRows, hallCols, left);

      doc.moveDown(0.4);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 6. BY EVENT TYPE ──
    if (data.byEventType.length > 0) {
      this.safePageBreak(doc, 100);
      this.drawSectionHeader(doc, 'PRZYCHODY WG TYPU WYDARZENIA', left, pageWidth);

      const eventRows = data.byEventType.slice(0, 20).map(item => [
        item.eventTypeName,
        this.formatCurrency(item.revenue),
        `${item.count}`,
        this.formatCurrency(item.avgRevenue),
      ]);
      const eventCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
      ];
      this.drawCompactTable(doc, ['Typ wydarzenia', 'Przychod', 'Liczba', 'Srednia'], eventRows, eventCols, left);

      doc.moveDown(0.4);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 7. BY SERVICE ITEM (extras) ──
    if (data.byServiceItem && data.byServiceItem.length > 0) {
      this.safePageBreak(doc, 100);

      doc.fontSize(11).font(this.getBoldFont()).fillColor(COLORS.purple);
      doc.text('USLUGI DODATKOWE — PRZYCHODY', left, doc.y);
      doc.moveDown(0.3);

      const extrasRows = data.byServiceItem.slice(0, 20).map(item => [
        item.name,
        this.formatCurrency(item.revenue),
        `${item.count}`,
        this.formatCurrency(item.avgRevenue),
      ]);
      const extrasCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
      ];
      this.drawCompactTable(doc, ['Usluga', 'Przychod', 'Uzyc', 'Sr. przychod'], extrasRows, extrasCols, left);

      // Total extras row
      if (data.summary.extrasRevenue && data.summary.extrasRevenue > 0) {
        doc.moveDown(0.2);
        doc.fontSize(9).font(this.getBoldFont()).fillColor(COLORS.purple);
        doc.text(`Razem extras: ${this.formatCurrency(data.summary.extrasRevenue)}`, left, doc.y);
        doc.fillColor(COLORS.textDark);
      }

      doc.moveDown(0.4);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 8. FOOTER ──
    doc.moveDown(0.5);
    this.drawInlineFooter(doc, left, pageWidth);
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM OCCUPANCY REPORT PDF — Zadanie 4
  // ═══════════════════════════════════════════════════════════════

  private buildOccupancyReportPDF(doc: PDFKit.PDFDocument, data: OccupancyReportPDFData): void {
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // ── 1. HEADER BANNER ──
    this.drawHeaderBanner(doc, 'RAPORT', COLORS.info);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(this.getBoldFont());
    doc.text('RAPORT ZAJETOSCI', left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
    doc.text(
      `Okres: ${data.filters.dateFrom} - ${data.filters.dateTo}  |  Wygenerowano: ${this.formatDate(new Date())}`,
      left, doc.y, { align: 'center', width: pageWidth }
    );

    doc.moveDown(0.6);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. SUMMARY INFO BOX ──
    const summaryLines: string[] = [
      `Srednia zajetosc: ${data.summary.avgOccupancy}%`,
      `Najpopularniejszy dzien: ${this.translateDayOfWeek(data.summary.peakDay)}`,
      `Najpopularniejsza sala: ${data.summary.peakHall || 'Brak danych'}`,
      `Liczba rezerwacji: ${data.summary.totalReservations}`,
      `Dni w okresie: ${data.summary.totalDaysInPeriod}`,
    ];

    this.drawInfoBox(doc, 'PODSUMOWANIE', left, doc.y, pageWidth, summaryLines);
    const summaryBoxHeight = this.calculateInfoBoxHeight(summaryLines.length);
    doc.y = doc.y + summaryBoxHeight + 5;

    doc.moveDown(0.4);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    // ── 4. HALLS RANKING ──
    if (data.halls.length > 0) {
      this.safePageBreak(doc, 100);
      this.drawSectionHeader(doc, 'ZAJETOSC SAL', left, pageWidth);

      const hallRows = data.halls.slice(0, 20).map(hall => [
        hall.hallName,
        `${hall.occupancy}%`,
        `${hall.reservations}`,
        `${hall.avgGuestsPerReservation}`,
      ]);
      const hallCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.25),
      ];
      this.drawCompactTable(doc, ['Sala', 'Zajetosc %', 'Rezerwacje', 'Sr. gosci'], hallRows, hallCols, left);

      doc.moveDown(0.4);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 5. PEAK HOURS ──
    if (data.peakHours.length > 0) {
      this.safePageBreak(doc, 100);
      this.drawSectionHeader(doc, 'NAJPOPULARNIEJSZE GODZINY', left, pageWidth);

      const hourRows = data.peakHours.slice(0, 20).map(hour => [
        `${hour.hour}:00`,
        `${hour.count}`,
      ]);
      const hourCols = [
        Math.round(pageWidth * 0.50),
        Math.round(pageWidth * 0.50),
      ];
      this.drawCompactTable(doc, ['Godzina', 'Liczba rezerwacji'], hourRows, hourCols, left);

      doc.moveDown(0.4);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 6. PEAK DAYS OF WEEK ──
    if (data.peakDaysOfWeek.length > 0) {
      this.safePageBreak(doc, 100);
      this.drawSectionHeader(doc, 'NAJPOPULARNIEJSZE DNI TYGODNIA', left, pageWidth);

      const dayRows = data.peakDaysOfWeek.map(day => [
        this.translateDayOfWeek(day.dayOfWeek),
        `${day.count}`,
      ]);
      const dayCols = [
        Math.round(pageWidth * 0.50),
        Math.round(pageWidth * 0.50),
      ];
      this.drawCompactTable(doc, ['Dzien tygodnia', 'Liczba rezerwacji'], dayRows, dayCols, left);

      doc.moveDown(0.4);
    }

    // ── 7. FOOTER ──
    doc.moveDown(0.5);
    this.drawInlineFooter(doc, left, pageWidth);
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  SHARED FORMATTERS
  // ═══════════════════════════════════════════════════════════════

  private getRegularFont(): string {
    return this.useCustomFonts ? 'DejaVu' : 'Helvetica';
  }

  private getBoldFont(): string {
    return this.useCustomFonts ? 'DejaVu-Bold' : 'Helvetica-Bold';
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /* istanbul ignore next */
  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatCurrency(amount: number | string): string {
    /* istanbul ignore next */
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(numAmount);
  }
}

export const pdfService = new PDFService();
