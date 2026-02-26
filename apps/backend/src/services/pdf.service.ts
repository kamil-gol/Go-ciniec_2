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
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  RESERVED: { label: 'REZERWACJA', color: COLORS.info },
  PENDING: { label: 'OCZEKUJACA', color: COLORS.warning },
  CONFIRMED: { label: 'POTWIERDZONA', color: COLORS.success },
  COMPLETED: { label: 'ZAKONCZONA', color: COLORS.textMuted },
  CANCELLED: { label: 'ANULOWANA', color: COLORS.danger },
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
        margin: 50,
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
      this.buildPaymentConfirmationContent(doc, data);
      doc.end();
    });
  }

  async generateMenuCardPDF(data: MenuCardPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      console.log(`[PDF Service] Generating menu card PDF: ${data.templateName}`);
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
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
      this.buildMenuCardContent(doc, data);
      doc.end();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM RESERVATION PDF — #157 Redesign
  // ═══════════════════════════════════════════════════════════════

  private buildReservationPDF(doc: PDFKit.PDFDocument, r: ReservationPDFData): void {
    const left = 40;
    const pageWidth = doc.page.width - 80; // 40+40 margins

    // ── 1. PREMIUM HEADER BANNER ──
    this.drawHeaderBanner(doc, r.status);

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

    // ── 6. FINANCIAL SUMMARY BOX (includes deposit — Bug #2 fix) ──
    this.drawFinancialSummary(doc, r, left, pageWidth);

    // ── 7. NOTES ──
    if (r.notes) {
      doc.moveDown(0.4);
      doc.fontSize(8).font(this.getBoldFont()).fillColor(COLORS.textDark);
      doc.text('Uwagi: ', left, doc.y, { continued: true });
      doc.font(this.getRegularFont()).fillColor(COLORS.textMuted);
      doc.text(r.notes, { width: pageWidth - 40 });
    }

    // ── 8. FOOTER (inline, Bug #1 + #4 fix) ──
    doc.moveDown(1);
    this.drawInlineFooter(doc, left, pageWidth);
  }

  // ── HEADER BANNER ──
  private drawHeaderBanner(doc: PDFKit.PDFDocument, status: string): void {
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

    // Status badge (top-right)
    /* istanbul ignore next */
    const statusInfo = STATUS_MAP[status] || { label: status, color: COLORS.textMuted };
    const badgeWidth = 120;
    const badgeHeight = 22;
    const badgeX = pageWidth - badgeWidth - 40;
    const badgeY = 20;

    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4)
       .fill(statusInfo.color);
    doc.fillColor('#ffffff').fontSize(9).font(this.getBoldFont());
    doc.text(statusInfo.label, badgeX, badgeY + 6, { width: badgeWidth, align: 'center' });
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

    // LEFT COLUMN — Client
    this.drawInfoBox(doc, 'KLIENT', left, startY, colWidth, [
      `${r.client.firstName} ${r.client.lastName}`,
      r.client.email || '',
      r.client.phone,
      r.client.address || '',
    ].filter(Boolean));

    // RIGHT COLUMN — Event
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

    // Move Y past both columns
    const boxHeight = this.calculateInfoBoxHeight(Math.max(
      [r.client.firstName, r.client.email, r.client.phone, r.client.address].filter(Boolean).length,
      eventDetails.filter(Boolean).length
    ));
    doc.y = startY + boxHeight + 5;
  }

  // ── INFO BOX ──
  private drawInfoBox(
    doc: PDFKit.PDFDocument,
    title: string,
    x: number,
    y: number,
    width: number,
    lines: string[]
  ): void {
    const boxHeight = this.calculateInfoBoxHeight(lines.length);

    // Background
    doc.rect(x, y, width, boxHeight).fill(COLORS.bgLight);

    // Left accent bar
    doc.rect(x, y, 3, boxHeight).fill(COLORS.accent);

    // Title
    doc.fillColor(COLORS.textMuted).fontSize(7).font(this.getBoldFont());
    doc.text(title, x + 12, y + 8, { width: width - 20 });

    // Lines
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

  // ── MENU TABLE ──
  private drawMenuTable(
    doc: PDFKit.PDFDocument,
    menuSnapshot: MenuSnapshot,
    left: number,
    pageWidth: number
  ): void {
    // Section header
    /* istanbul ignore next */
    const packageName = menuSnapshot.menuData?.packageName || menuSnapshot.menuData?.package?.name || '';
    doc.fontSize(11).font(this.getBoldFont()).fillColor(COLORS.textDark);
    doc.text('WYBRANE MENU', left, doc.y);
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

    // Build table data + collect allergens
    const allAllergens = new Set<string>();
    const tableRows: string[][] = [];

    dishSelections.forEach((category) => {
      const dishNames = category.dishes.map((d) => {
        // Collect allergens
        if (d.allergens) d.allergens.forEach((a) => allAllergens.add(a));
        const qty = d.quantity > 1 ? `${d.quantity}x ` : '';
        return `${qty}${d.dishName}`;
      });

      // Join dishes, truncate if too long
      let dishText = dishNames.join(', ');
      if (dishText.length > 80) {
        dishText = dishText.substring(0, 77) + '...';
      }

      tableRows.push([
        category.categoryName,
        `${category.dishes.length}`,
        dishText,
      ]);
    });

    // Draw table
    const colWidths = [Math.round(pageWidth * 0.22), Math.round(pageWidth * 0.08), Math.round(pageWidth * 0.70)];
    this.drawCompactTable(doc, ['Kategoria', 'Ilosc', 'Wybrane dania'], tableRows, colWidths, left);

    // Allergens summary (collected, deduplicated)
    if (allAllergens.size > 0) {
      doc.moveDown(0.2);
      const labels = Array.from(allAllergens)
        .map((a) => ALLERGEN_LABELS[a] || a)
        .join(', ');
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
    doc.fontSize(11).font(this.getBoldFont()).fillColor(COLORS.textDark);
    doc.text('WYBRANE DANIA', left, doc.y);
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
    doc.fontSize(11).font(this.getBoldFont()).fillColor(COLORS.textDark);
    doc.text('USLUGI DODATKOWE', left, doc.y);
    doc.moveDown(0.2);

    // Group by category for cleaner display
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

      // Notes for items that have them
      for (const item of items) {
        if (item.note) {
          doc.fontSize(7).fillColor(COLORS.textMuted);
          doc.text(`  Uwaga: ${item.note}`, left + 10);
        }
      }
      doc.moveDown(0.1);
    }
  }

  // ── FINANCIAL SUMMARY BOX (Bug #2 fix — deposit integrated) ──
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

    // Calculate box height dynamically
    let rowCount = 0;
    if (r.adults > 0 && r.pricePerAdult > 0) rowCount++;
    if (r.children > 0 && r.pricePerChild > 0) rowCount++;
    if (r.toddlers > 0 && r.pricePerToddler > 0) rowCount++;
    if (extrasTotalCalc > 0) rowCount++;
    if (venueSurchargeAmount > 0) rowCount++;
    rowCount++; // RAZEM
    if (deposit) rowCount += 2; // Zaliczka + Do zapłaty
    const boxHeight = 30 + rowCount * 18 + (deposit ? 20 : 0);

    const boxY = doc.y;

    // Box background
    doc.rect(left, boxY, pageWidth, boxHeight).fill(COLORS.bgLight);
    // Left accent
    doc.rect(left, boxY, 3, boxHeight).fill(COLORS.accent);

    // Title
    doc.fillColor(COLORS.textDark).fontSize(11).font(this.getBoldFont());
    doc.text('PODSUMOWANIE', left + 15, boxY + 10);

    let y = boxY + 30;
    const labelX = left + 15;
    const rightEdge = left + pageWidth - 15;

    // Amount column for regular rows — full width, no badge space needed
    const valueWidth = 115;
    const valueX = rightEdge - valueWidth;

    doc.fontSize(9).font(this.getRegularFont()).fillColor(COLORS.textDark);

    // Cost breakdown
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

    // Separator before RAZEM
    y += 4;
    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(labelX, y).lineTo(rightEdge, y).stroke();
    y += 8;

    // RAZEM
    doc.fontSize(11).font(this.getBoldFont()).fillColor(COLORS.textDark);
    doc.text('RAZEM', labelX, y);
    doc.text(this.formatCurrency(displayTotal), valueX, y, { width: valueWidth, align: 'right' });
    y += 20;

    // Deposit row (Bug #2 fix — integrated into summary)
    if (deposit) {
      // Deposit row layout: [label] [amount (narrower)] [gap] [badge]
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

      // Status badge — positioned after the narrower amount column with gap
      const statusColor = deposit.paid ? COLORS.success : COLORS.warning;
      const statusText = deposit.paid ? 'OK' : 'OCZEK.';
      const depositBadgeX = depositValueX + depositValueWidth + depositBadgeGap;
      doc.roundedRect(depositBadgeX, y - 1, depositBadgeWidth, 13, 3).fill(statusColor);
      doc.fillColor('#ffffff').fontSize(6).font(this.getBoldFont());
      doc.text(statusText, depositBadgeX, y + 2, { width: depositBadgeWidth, align: 'center' });

      y += 18;

      // Separator before DO ZAPŁATY
      doc.strokeColor(COLORS.accent).lineWidth(1)
         .moveTo(labelX, y).lineTo(rightEdge, y).stroke();
      y += 8;

      // DO ZAPŁATY — uses full valueWidth like RAZEM
      const remaining = displayTotal - Number(deposit.amount);
      doc.fontSize(12).font(this.getBoldFont()).fillColor(COLORS.primary);
      doc.text('DO ZAPLATY', labelX, y);
      doc.text(this.formatCurrency(remaining), valueX, y, { width: valueWidth, align: 'right' });
    }

    doc.y = boxY + boxHeight + 5;
  }

  // ── INLINE FOOTER (Bug #1 + #4 fix) ──
  private drawInlineFooter(doc: PDFKit.PDFDocument, left: number, pageWidth: number): void {
    // Thin separator
    this.drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    doc.fontSize(7).fillColor(COLORS.textMuted).font(this.getRegularFont());

    // Bug #4 fix: Use restaurantData from CompanySettings (Ustawienia → Dane firmy)
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

  // ═══════════════════════════════════════════════════════════════
  // ██  COMPACT TABLE UTILITY
  // ═══════════════════════════════════════════════════════════════

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
      // Check for page break
      /* istanbul ignore next */
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 50;
      }

      // Alternating bg
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

  // ═══════════════════════════════════════════════════════════════
  // ██  SEPARATOR UTILITY
  // ═══════════════════════════════════════════════════════════════

  private drawSeparator(doc: PDFKit.PDFDocument, left: number, width: number): void {
    const y = doc.y;
    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(left, y).lineTo(left + width, y).stroke();
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PAYMENT CONFIRMATION (unchanged structure, updated footer)
  // ═══════════════════════════════════════════════════════════════

  private buildPaymentConfirmationContent(
    doc: PDFKit.PDFDocument,
    data: PaymentConfirmationData
  ): void {
    this.addLegacyHeader(doc);

    doc.moveDown(2);
    doc.fontSize(20).font(this.getBoldFont()).fillColor('#16a34a').text('POTWIERDZENIE WPLATY ZALICZKI', {
      align: 'center',
    });

    doc.moveDown(0.5);
    doc.fontSize(10).font(this.getRegularFont()).fillColor('#666666');
    doc.text(`Numer depozytu: ${data.depositId}`, { align: 'center' });
    doc.text(`Data wygenerowania: ${this.formatDate(new Date())}`, { align: 'center' });

    doc.moveDown(1);
    this.addLegacySeparator(doc);

    doc.moveDown(1);
    doc.fillColor('#000000').fontSize(14).font(this.getBoldFont()).text('Szczegoly wplaty');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());

    const methodLabels: Record<string, string> = {
      TRANSFER: 'Przelew bankowy',
      CASH: 'Gotowka',
      BLIK: 'BLIK',
      CARD: 'Karta platnicza',
    };

    doc.font(this.getBoldFont()).text(`Kwota: ${this.formatCurrency(data.amount)}`);
    doc.font(this.getRegularFont());
    doc.text(`Data wplaty: ${this.formatDate(data.paidAt)}`);
    /* istanbul ignore next */
    doc.text(`Metoda platnosci: ${methodLabels[data.paymentMethod] || data.paymentMethod}`);
    if (data.paymentReference) {
      doc.text(`Numer referencyjny: ${data.paymentReference}`);
    }

    doc.moveDown(1);
    this.addLegacySeparator(doc);

    doc.moveDown(1);
    doc.fontSize(14).font(this.getBoldFont()).text('Dane klienta');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());
    doc.text(`Imie i nazwisko: ${data.client.firstName} ${data.client.lastName}`);
    if (data.client.email) {
      doc.text(`Email: ${data.client.email}`);
    }
    doc.text(`Telefon: ${data.client.phone}`);
    if (data.client.address) {
      doc.text(`Adres: ${data.client.address}`);
    }

    doc.moveDown(1);
    this.addLegacySeparator(doc);

    doc.moveDown(1);
    doc.fontSize(14).font(this.getBoldFont()).text('Szczegoly rezerwacji');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());
    doc.text(`Numer rezerwacji: ${data.reservation.id}`);
    doc.text(`Data: ${data.reservation.date}`);
    doc.text(`Godzina: ${data.reservation.startTime} - ${data.reservation.endTime}`);
    if (data.reservation.eventType) {
      doc.text(`Typ wydarzenia: ${data.reservation.eventType}`);
    }
    doc.text(`Liczba gosci: ${data.reservation.guests}`);
    doc.text(`Calkowita cena rezerwacji: ${this.formatCurrency(data.reservation.totalPrice)}`);

    doc.moveDown(1.5);
    doc.fontSize(11).fillColor('#16a34a');
    doc.font(this.getBoldFont()).text('Wplata zaksiegowana pomyslnie', { align: 'center' });
    doc.fillColor('#000000');

    // Bug #4 fix: Footer with contact data from CompanySettings
    this.addLegacyFooter(doc);
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  MENU CARD BUILDER (unchanged structure)
  // ═══════════════════════════════════════════════════════════════

  private buildMenuCardContent(doc: PDFKit.PDFDocument, data: MenuCardPDFData): void {
    const pageWidth = doc.page.width - 100;

    this.addLegacyHeader(doc);

    doc.moveDown(2);
    doc.fontSize(22).font(this.getBoldFont()).fillColor('#2c3e50').text('KARTA MENU', {
      align: 'center',
    });

    doc.moveDown(0.5);
    doc.fontSize(16).font(this.getBoldFont()).fillColor('#34495e').text(data.templateName, {
      align: 'center',
    });

    const subtitleParts: string[] = [data.eventTypeName];
    if (data.variant) subtitleParts.push(data.variant);
    doc.moveDown(0.3);
    doc.fontSize(11).font(this.getRegularFont()).fillColor('#7f8c8d').text(subtitleParts.join(' | '), {
      align: 'center',
    });

    if (data.templateDescription) {
      doc.moveDown(0.5);
      doc.fontSize(10).font(this.getRegularFont()).fillColor('#555555').text(data.templateDescription, {
        align: 'center',
        width: pageWidth,
      });
    }

    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#999999').text(
      `Wygenerowano: ${this.formatDate(new Date())}`,
      { align: 'center' }
    );

    data.packages.forEach((pkg) => {
      /* istanbul ignore next */
      if (doc.y > doc.page.height - 250) doc.addPage();

      doc.moveDown(1.5);
      this.addLegacySeparator(doc);
      doc.moveDown(1);

      const pkgHeaderY = doc.y;
      const headerHeight = 60;
      doc.rect(50, pkgHeaderY, pageWidth, headerHeight)
        .fillAndStroke('#2c3e50', '#2c3e50');

      /* istanbul ignore next */
      const badgeText = pkg.badgeText || (pkg.isPopular ? 'POPULARNY' : pkg.isRecommended ? 'POLECANY' : null);
      if (badgeText) {
        doc.rect(50 + pageWidth - 100, pkgHeaderY + 5, 90, 18)
          .fillAndStroke('#e67e22', '#e67e22');
        doc.fillColor('#ffffff').fontSize(8).font(this.getBoldFont());
        doc.text(badgeText, 50 + pageWidth - 100, pkgHeaderY + 9, { width: 90, align: 'center' });
      }

      doc.fillColor('#ffffff').fontSize(16).font(this.getBoldFont());
      doc.text(pkg.name, 65, pkgHeaderY + 12, { width: pageWidth - 30 });

      doc.fontSize(9).font(this.getRegularFont()).fillColor('#ecf0f1');
      const priceParts = [`${this.formatCurrency(pkg.pricePerAdult)}/os. dorosla`];
      if (pkg.pricePerChild > 0) priceParts.push(`${this.formatCurrency(pkg.pricePerChild)}/dziecko`);
      if (pkg.pricePerToddler > 0) priceParts.push(`${this.formatCurrency(pkg.pricePerToddler)}/maluch`);
      doc.text(priceParts.join('  |  '), 65, pkgHeaderY + 38, { width: pageWidth - 30 });

      doc.y = pkgHeaderY + headerHeight + 10;
      doc.fillColor('#000000');

      if (pkg.description) {
        doc.fontSize(10).font(this.getRegularFont()).fillColor('#555555');
        doc.text(pkg.description, { width: pageWidth });
        doc.moveDown(0.5);
      }

      if (pkg.includedItems && pkg.includedItems.length > 0) {
        doc.fontSize(9).font(this.getBoldFont()).fillColor('#27ae60');
        doc.text('W cenie: ', { continued: true });
        doc.font(this.getRegularFont()).fillColor('#555555');
        doc.text(pkg.includedItems.join(', '));
        doc.moveDown(0.5);
      }

      if (pkg.courses.length > 0) {
        pkg.courses.forEach((course) => {
          /* istanbul ignore next */
          if (doc.y > doc.page.height - 150) doc.addPage();

          doc.moveDown(0.7);

          const selectText = course.minSelect === course.maxSelect
            ? `wybierz ${course.minSelect}`
            : `wybierz ${course.minSelect}-${course.maxSelect}`;

          doc.fontSize(12).font(this.getBoldFont()).fillColor('#2c3e50');
          doc.text(course.name, { continued: true });
          doc.fontSize(9).font(this.getRegularFont()).fillColor('#7f8c8d');
          doc.text(`  (${selectText} z ${course.dishes.length})`);

          /* istanbul ignore next */
          if (course.description) {
            doc.fontSize(9).font(this.getRegularFont()).fillColor('#888888');
            doc.text(course.description);
          }

          doc.moveDown(0.3);

          course.dishes.forEach((dish) => {
            /* istanbul ignore next */
            if (doc.y > doc.page.height - 100) doc.addPage();

            let marker = '  ';
            /* istanbul ignore next */
            if (dish.isRecommended) marker = '* ';
            else if (dish.isDefault) marker = '> ';

            doc.fontSize(10).font(this.getRegularFont()).fillColor('#000000');
            doc.text(`  ${marker}${dish.name}`, { indent: 15 });

            /* istanbul ignore next */
            if (dish.description) {
              doc.fontSize(8).fillColor('#777777');
              doc.text(`     ${dish.description}`, { indent: 25 });
            }

            /* istanbul ignore next */
            if (dish.allergens && dish.allergens.length > 0) {
              const labels = dish.allergens
                .map((a) => ALLERGEN_LABELS[a] || a)
                .join(', ');
              doc.fontSize(7).fillColor('#e67e22');
              doc.text(`     Alergeny: ${labels}`, { indent: 25 });
            }

            doc.moveDown(0.15);
            doc.fillColor('#000000');
          });
        });
      }

      const requiredOptions = pkg.options.filter(o => o.isRequired);
      const activeOptions = pkg.options.filter(o => !o.isRequired);

      if (requiredOptions.length > 0) {
        /* istanbul ignore next */
        if (doc.y > doc.page.height - 120) doc.addPage();

        doc.moveDown(0.7);
        doc.fontSize(11).font(this.getBoldFont()).fillColor('#27ae60');
        doc.text('W pakiecie:');
        doc.moveDown(0.2);

        requiredOptions.forEach((opt) => {
          doc.fontSize(9).font(this.getRegularFont()).fillColor('#333333');
          doc.text(`  + ${opt.name}`, { indent: 15 });
          /* istanbul ignore next */
          if (opt.description) {
            doc.fontSize(8).fillColor('#777777');
            doc.text(`     ${opt.description}`, { indent: 25 });
          }
        });
      }

      if (activeOptions.length > 0) {
        /* istanbul ignore next */
        if (doc.y > doc.page.height - 120) doc.addPage();

        doc.moveDown(0.7);
        doc.fontSize(11).font(this.getBoldFont()).fillColor('#8e44ad');
        doc.text('Opcje dodatkowe:');
        doc.moveDown(0.2);

        activeOptions.forEach((opt) => {
          const priceLabel = opt.priceType === 'PER_PERSON'
            ? `+${this.formatCurrency(opt.priceAmount)}/os.`
            : `+${this.formatCurrency(opt.priceAmount)}`;

          doc.fontSize(9).font(this.getRegularFont()).fillColor('#333333');
          doc.text(`  - ${opt.name}`, { continued: true, indent: 15 });
          doc.fillColor('#8e44ad').font(this.getBoldFont());
          doc.text(`  ${priceLabel}`);

          /* istanbul ignore next */
          if (opt.description) {
            doc.fontSize(8).font(this.getRegularFont()).fillColor('#777777');
            doc.text(`     ${opt.description}`, { indent: 25 });
          }
        });
      }
    });

    doc.moveDown(1.5);
    this.addLegacySeparator(doc);
    doc.moveDown(0.5);
    doc.fontSize(8).font(this.getRegularFont()).fillColor('#999999');
    doc.text('* = polecane przez szefa kuchni  |  > = domyslny wybor  |  - = dostepne', {
      align: 'center',
    });

    this.addLegacyFooter(doc);
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  LEGACY HELPERS (for payment confirmation & menu card)
  // ═══════════════════════════════════════════════════════════════

  private addLegacyHeader(doc: PDFKit.PDFDocument): void {
    doc.fontSize(18).font(this.getBoldFont()).fillColor('#2c3e50').text(this.restaurantData.name, {
      align: 'center',
    });
    doc.moveDown(0.3);
    doc.fontSize(9).font(this.getRegularFont()).fillColor('#7f8c8d');
    if (this.restaurantData.address) {
      doc.text(this.restaurantData.address, { align: 'center' });
    }
    const contactParts = [];
    if (this.restaurantData.phone) contactParts.push(`Tel: ${this.restaurantData.phone}`);
    if (this.restaurantData.email) contactParts.push(`Email: ${this.restaurantData.email}`);
    if (contactParts.length > 0) {
      doc.text(contactParts.join(' | '), { align: 'center' });
    }
    if (this.restaurantData.website) {
      doc.text(this.restaurantData.website, { align: 'center' });
    }
    if (this.restaurantData.nip) {
      doc.text(`NIP: ${this.restaurantData.nip}`, { align: 'center' });
    }
  }

  private addLegacySeparator(doc: PDFKit.PDFDocument): void {
    const y = doc.y;
    doc.strokeColor('#cccccc').lineWidth(1)
       .moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  }

  /** Bug #4 fix: Footer uses restaurantData from CompanySettings */
  private addLegacyFooter(doc: PDFKit.PDFDocument): void {
    const bottomY = doc.page.height - 100;
    doc.fontSize(8).fillColor('#7f8c8d').font(this.getRegularFont());

    // Build footer with contact data from CompanySettings (Ustawienia → Dane firmy)
    const contactParts: string[] = [];
    if (this.restaurantData.phone) contactParts.push(this.restaurantData.phone);
    if (this.restaurantData.email) contactParts.push(this.restaurantData.email);

    const footerText = contactParts.length > 0
      ? `Dziekujemy za wybor ${this.restaurantData.name}. W razie pytan: ${contactParts.join(' | ')}`
      : `Dziekujemy za wybor ${this.restaurantData.name}. W razie pytan prosimy o kontakt.`;

    doc.text(footerText, 50, bottomY, {
      align: 'center',
      width: doc.page.width - 100,
    });

    doc.moveDown(0.5);
    doc.fontSize(7).text(
      `Dokument wygenerowany automatycznie przez system ${this.restaurantData.name}`,
      { align: 'center' },
    );
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
