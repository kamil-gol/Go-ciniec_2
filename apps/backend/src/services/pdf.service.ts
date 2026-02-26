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
  PENDING: { label: 'OCZEKUJĄCA', color: COLORS.warning },
  CONFIRMED: { label: 'POTWIERDZONA', color: COLORS.success },
  COMPLETED: { label: 'ZAKOŃCZONA', color: COLORS.textMuted },
  CANCELLED: { label: 'ANULOWANA', color: COLORS.danger },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  TRANSFER: 'Przelew bankowy',
  CASH: 'Gotówka',
  BLIK: 'BLIK',
  CARD: 'Karta płatnicza',
};

/** Polish day-of-week translations (shared helper) */
const DAY_OF_WEEK_PL: Record<string, string> = {
  'Monday': 'Poniedziałek',
  'Tuesday': 'Wtorek',
  'Wednesday': 'Środa',
  'Thursday': 'Czwartek',
  'Friday': 'Piątek',
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
      name: process.env.RESTAURANT_NAME || 'Gościniec Rodzinny',
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
      `Dziękujemy za wybór restauracji ${this.restaurantData.name}!`,
    ];
    const contactParts: string[] = [];
    if (this.restaurantData.phone) contactParts.push(this.restaurantData.phone);
    if (this.restaurantData.email) contactParts.push(this.restaurantData.email);
    if (contactParts.length > 0) {
      footerParts.push(`W razie pytań: ${contactParts.join(' | ')}`);
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
   * Row height is calculated dynamically based on the tallest cell content.
   */
  private drawCompactTable(
    doc: PDFKit.PDFDocument,
    headers: string[],
    rows: string[][],
    colWidths: number[],
    startX: number
  ): void {
    const minRowHeight = 16;
    const headerHeight = 18;
    const cellPadding = 4;
    const cellFontSize = 7;
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    let y = doc.y;

    // Header row
    doc.rect(startX, y, totalWidth, headerHeight).fill(COLORS.primaryLight);
    let x = startX;
    headers.forEach((header, i) => {
      doc.fillColor('#ffffff').fontSize(cellFontSize).font(this.getBoldFont());
      doc.text(header, x + 5, y + 5, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });
    y += headerHeight;

    // Data rows — dynamic height based on text content
    rows.forEach((row, rowIndex) => {
      /* istanbul ignore next */
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 50;
      }

      // Calculate the tallest cell in this row
      let maxCellHeight = minRowHeight;
      row.forEach((cell, i) => {
        const isFirstCol = i === 0;
        doc.fontSize(cellFontSize)
           .font(isFirstCol ? this.getBoldFont() : this.getRegularFont());
        const textHeight = doc.heightOfString(cell, { width: colWidths[i] - 10 });
        const cellHeight = textHeight + cellPadding * 2;
        if (cellHeight > maxCellHeight) maxCellHeight = cellHeight;
      });

      if (rowIndex % 2 === 0) {
        doc.rect(startX, y, totalWidth, maxCellHeight).fill(COLORS.bgLight);
      }

      x = startX;
      row.forEach((cell, i) => {
        const isFirstCol = i === 0;
        doc.fillColor(COLORS.textDark)
           .fontSize(cellFontSize)
           .font(isFirstCol ? this.getBoldFont() : this.getRegularFont());
        doc.text(cell, x + 5, y + cellPadding, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });
      y += maxCellHeight;
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

  /**
   * Collect all allergens from all packages/courses into a single map.
   * Returns Map<allergenKey, Set<dishName>> for global deduplication.
   */
  private collectAllAllergens(packages: MenuCardPackage[]): Map<string, Set<string>> {
    const allergenToDishes = new Map<string, Set<string>>();

    for (const pkg of packages) {
      for (const course of pkg.courses) {
        for (const dish of course.dishes) {
          if (dish.allergens && dish.allergens.length > 0) {
            for (const allergen of dish.allergens) {
              if (!allergenToDishes.has(allergen)) {
                allergenToDishes.set(allergen, new Set());
              }
              allergenToDishes.get(allergen)!.add(dish.name);
            }
          }
        }
      }
    }

    return allergenToDishes;
  }

  /**
   * Draw a compact allergen summary section at the end of the menu card PDF.
   * Lists each allergen once with all dishes that contain it.
   */
  private drawAllergenSection(
    doc: PDFKit.PDFDocument,
    allergenMap: Map<string, Set<string>>,
    left: number,
    pageWidth: number
  ): void {
    if (allergenMap.size === 0) return;

    this.safePageBreak(doc, 120);

    doc.moveDown(0.5);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // Section header
    doc.fontSize(10).font(this.getBoldFont()).fillColor(COLORS.allergen);
    doc.text('INFORMACJA O ALERGENACH', left, doc.y);
    doc.moveDown(0.3);

    doc.fontSize(7).font(this.getRegularFont()).fillColor(COLORS.textMuted);
    doc.text(
      'Poniżej znajduje się lista alergenów występujących w daniach z karty menu.',
      left, doc.y, { width: pageWidth }
    );
    doc.moveDown(0.4);

    // Build table rows: Allergen | Dishes
    const rows: string[][] = [];
    for (const [allergen, dishNames] of allergenMap) {
      const label = ALLERGEN_LABELS[allergen] || allergen;
      const dishes = Array.from(dishNames).join(', ');
      rows.push([label, dishes]);
    }

    const colWidths = [
      Math.round(pageWidth * 0.20),
      Math.round(pageWidth * 0.80),
    ];
    this.drawCompactTable(doc, ['Alergen', 'Występuje w daniach'], rows, colWidths, left);
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
          Title: `Potwierdzenie wpłaty ${data.depositId}`,
          Author: this.restaurantData.name,
          Subject: 'Potwierdzenie wpłaty zaliczki',
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
          Title: 'Raport Przychodów',
          Author: this.restaurantData.name,
          Subject: 'Raport przychodów',
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
          Title: 'Raport Zajętości',
          Author: this.restaurantData.name,
          Subject: 'Raport zajętości sal',
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
    doc.text(`Nr: ${r.id}  |  Wygenerowano: ${this.formatDate(new Date())}`, left, doc.y, {
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
    const eventTypeName = r.customEventType || r.eventType?.name || 'Nie określono';
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
    if (r.toddlers > 0) guestParts.push(`${r.toddlers} mał.`);
    const guestLine = `${r.guests} osób (${guestParts.join(', ')})`;

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
      doc.fontSize(9).fillColor(COLORS.textMuted).text('Brak wybranych dań', left);
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

      const dishText = dishNames.join(', ');

      tableRows.push([category.categoryName, `${category.dishes.length}`, dishText]);
    });

    const colWidths = [Math.round(pageWidth * 0.22), Math.round(pageWidth * 0.08), Math.round(pageWidth * 0.70)];
    this.drawCompactTable(doc, ['Kategoria', 'Ilość', 'Wybrane dania'], tableRows, colWidths, left);

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
      doc.fontSize(9).fillColor(COLORS.textMuted).text('Brak wybranych dań', left);
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
      const dishText = dishNames.join(', ');
      tableRows.push([category.categoryName, `${category.dishes.length}`, dishText]);
    });

    const colWidths = [Math.round(pageWidth * 0.22), Math.round(pageWidth * 0.08), Math.round(pageWidth * 0.70)];
    this.drawCompactTable(doc, ['Kategoria', 'Ilość', 'Wybrane dania'], tableRows, colWidths, left);

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
    this.drawSectionHeader(doc, 'USŁUGI DODATKOWE', left, pageWidth);

    const grouped = new Map<string, ReservationExtraForPDF[]>();
    for (const extra of extras) {
      const catName = extra.serviceItem.category?.name || 'Inne';
      if (!grouped.has(catName)) grouped.set(catName, []);
      grouped.get(catName)!.push(extra);
    }

    for (const [categoryName, items] of grouped) {
      doc.fontSize(8).font(this.getBoldFont()).fillColor(COLORS.primaryLight);
      doc.text(`${categoryName}:`, left, doc.y);
      doc.moveDown(0.1);

      for (const item of items) {
        doc.font(this.getRegularFont()).fontSize(8).fillColor(COLORS.textDark);

        const itemTotal = Number(item.totalPrice);
        let chipText: string;
        switch (item.priceType) {
          case 'FREE':
            chipText = `${item.serviceItem.name} (Gratis)`;
            break;
          case 'PER_PERSON':
            chipText = `${item.serviceItem.name} (${this.formatCurrency(itemTotal)})`;
            break;
          case 'PER_UNIT':
            chipText = `${item.serviceItem.name} ${item.quantity}szt. (${this.formatCurrency(itemTotal)})`;
            break;
          case 'FLAT':
          default:
            chipText = `${item.serviceItem.name} (${this.formatCurrency(itemTotal)})`;
            break;
        }

        if (item.note) {
          doc.font(this.getBoldFont()).text(`${chipText}`, left + 10, doc.y, { continued: true });
          doc.font(this.getRegularFont()).fontSize(7).fillColor(COLORS.textMuted);
          doc.text(`  — Uwaga: ${item.note}`, { width: pageWidth - 20 });
        } else {
          doc.text(`${chipText}`, left + 10, doc.y, { width: pageWidth - 20 });
        }
      }
      doc.moveDown(0.2);
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
      doc.text(`Dorośli: ${r.adults} os. x ${this.formatCurrency(r.pricePerAdult)}`, labelX, y);
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
      doc.text('Usługi dodatkowe', labelX, y);
      doc.text(this.formatCurrency(extrasTotalCalc), valueX, y, { width: valueWidth, align: 'right' });
      y += 16;
    }
    if (venueSurchargeAmount > 0) {
      const surchargeLabel = r.venueSurchargeLabel || 'Dopłata za cały obiekt';
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
      const depositLabel = deposit.paid ? 'Zaliczka (opłacona)' : `Zaliczka (termin: ${dueDate})`;
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
      doc.text('DO ZAPŁATY', labelX, y);
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

    // ── 1. HEADER BANNER with „OPŁACONA" badge ──
    this.drawHeaderBanner(doc, 'OPŁACONA', COLORS.success);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(this.getBoldFont());
    doc.text('POTWIERDZENIE WPŁATY ZALICZKI', left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textMuted);
    doc.text(`Nr: ${data.depositId}  |  Wygenerowano: ${this.formatDate(new Date())}`, left, doc.y, {
      align: 'center', width: pageWidth,
    });

    doc.moveDown(0.6);
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. TWO-COLUMN: KLIENT | WPŁATA ──
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

    this.drawInfoBox(doc, 'SZCZEGÓŁY WPŁATY', left + colWidth + colGap, startY, colWidth, paymentLines);

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
    resLines.push(`Gości: ${data.reservation.guests}`);
    resLines.push(`Nr rezerwacji: ${data.reservation.id}`);

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
    doc.text('Całkowita cena rezerwacji', labelX, y);
    doc.text(this.formatCurrency(totalPrice), valueX, y, { width: valueWidth, align: 'right' });
    y += 16;

    const depositBadgeWidth = 40;
    const depositBadgeGap = 6;
    const depositValueWidth = valueWidth - depositBadgeWidth - depositBadgeGap;

    doc.fontSize(9).font(this.getRegularFont()).fillColor(COLORS.success);
    doc.text('Wpłacona zaliczka', labelX, y);
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
    doc.text('POZOSTAŁO DO ZAPŁATY', labelX, y);
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

    // ── 1. HEADER BANNER with „KARTA MENU" badge ──
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

      // Badge (custom badgeText only)
      if (pkg.badgeText) {
        const pkgBadgeWidth = 90;
        const pkgBadgeX = left + pageWidth - pkgBadgeWidth - 10;
        doc.roundedRect(pkgBadgeX, pkgHeaderY + 8, pkgBadgeWidth, 18, 4).fill(COLORS.accent);
        doc.fillColor(COLORS.primary).fontSize(7).font(this.getBoldFont());
        doc.text(pkg.badgeText, pkgBadgeX, pkgHeaderY + 12, { width: pkgBadgeWidth, align: 'center' });
      }

      // Package name
      doc.fillColor('#ffffff').fontSize(14).font(this.getBoldFont());
      doc.text(pkg.name, left + 15, pkgHeaderY + 10, { width: pageWidth - 130 });

      // Prices
      doc.fontSize(8).font(this.getRegularFont()).fillColor(COLORS.textLight);
      const priceParts = [`${this.formatCurrency(pkg.pricePerAdult)}/os. dorosła`];
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

      // ── COURSES — 2-column tables (no allergens per course) ──
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

          // Build dish table rows — 2 columns: name, description
          const dishRows: string[][] = [];

          course.dishes.forEach((dish) => {
            const descText = dish.description || '';
            dishRows.push([
              dish.name,
              descText,
            ]);
          });

          // Dish table — 2 columns: name (35%), description (65%)
          const dishColWidths = [
            Math.round(pageWidth * 0.35),
            Math.round(pageWidth * 0.65),
          ];
          this.drawCompactTable(
            doc,
            ['Danie', 'Opis'],
            dishRows,
            dishColWidths,
            left
          );

          // No per-course allergen summary — moved to end of document
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

    // ── 4. GLOBAL ALLERGEN SECTION (at the end, before footer) ──
    const allergenMap = this.collectAllAllergens(data.packages);
    this.drawAllergenSection(doc, allergenMap, left, pageWidth);

    // ── 5. FOOTER ──
    doc.moveDown(1);
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
    doc.text('RAPORT PRZYCHODÓW', left, doc.y, { align: 'center', width: pageWidth });

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
      `Całkowity przychód: ${this.formatCurrency(data.summary.totalRevenue)}`,
      `Średni przychód na rezerwację: ${this.formatCurrency(data.summary.avgRevenuePerReservation)}`,
      `Liczba rezerwacji: ${data.summary.totalReservations}`,
      `Ukończone rezerwacje: ${data.summary.completedReservations}`,
      `Oczekujący przychód: ${this.formatCurrency(data.summary.pendingRevenue)}`,
      `Wzrost: ${data.summary.growthPercent}%`,
    ];
    if (data.summary.extrasRevenue !== undefined && data.summary.extrasRevenue > 0) {
      summaryLines.push(`Przychody z usług dodatkowych: ${this.formatCurrency(data.summary.extrasRevenue)}`);
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
      this.drawSectionHeader(doc, 'ROZKŁAD WG OKRESU', left, pageWidth);

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
      this.drawCompactTable(doc, ['Okres', 'Przychód', 'Liczba', 'Średnia'], breakdownRows, breakdownCols, left);

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
      this.drawCompactTable(doc, ['Sala', 'Przychód', 'Liczba', 'Średnia'], hallRows, hallCols, left);

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
      this.drawCompactTable(doc, ['Typ wydarzenia', 'Przychód', 'Liczba', 'Średnia'], eventRows, eventCols, left);

      doc.moveDown(0.4);
      this.drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 7. BY SERVICE ITEM (extras) ──
    if (data.byServiceItem && data.byServiceItem.length > 0) {
      this.safePageBreak(doc, 100);

      doc.fontSize(11).font(this.getBoldFont()).fillColor(COLORS.purple);
      doc.text('USŁUGI DODATKOWE — PRZYCHODY', left, doc.y);
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
      this.drawCompactTable(doc, ['Usługa', 'Przychód', 'Użyć', 'Śr. przychód'], extrasRows, extrasCols, left);

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
    doc.text('RAPORT ZAJĘTOŚCI', left, doc.y, { align: 'center', width: pageWidth });

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
      `Średnia zajętość: ${data.summary.avgOccupancy}%`,
      `Najpopularniejszy dzień: ${this.translateDayOfWeek(data.summary.peakDay)}`,
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
      this.drawSectionHeader(doc, 'ZAJĘTOŚĆ SAL', left, pageWidth);

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
      this.drawCompactTable(doc, ['Sala', 'Zajętość %', 'Rezerwacje', 'Śr. gości'], hallRows, hallCols, left);

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
      this.drawCompactTable(doc, ['Dzień tygodnia', 'Liczba rezerwacji'], dayRows, dayCols, left);

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
