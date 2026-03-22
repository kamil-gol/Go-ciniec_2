import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import * as fs from 'fs';
import companySettingsService from './company-settings.service';

// ═══════════════ IMPORTS FROM EXTRACTED MODULES ═══════════════

import type {
  CategorySelection,
  MenuData,
  MenuSnapshot,
  ReservationExtraForPDF,
  ReservationPDFData,
  CategoryExtraForPDF,
  PaymentConfirmationData,
  RestaurantData,
  MenuCardPDFData,
  RevenueReportPDFData,
  OccupancyReportPDFData,
  PdfLayoutConfig,
  CateringOrderItemForPDF,
  CateringQuotePDFData,
  CateringKitchenPrintData,
  CateringInvoicePDFData,
  CateringOrderPDFData,
} from './pdf/pdf.types';

import {
  ALLERGEN_LABELS,
  COLORS,
  DEFAULT_COLORS,
  setColors,
  resetColors,
  STATUS_MAP,
  DELIVERY_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from './pdf/pdf.types';

import {
  formatDate,
  formatTime,
  formatCurrency,
  translateDayOfWeek,
  collectAllAllergens,
  loadPdfConfig,
  getRegularFont,
  getBoldFont,
} from './pdf/pdf.utils';

import type { PdfDrawContext } from './pdf/pdf.primitives';
import {
  drawHeaderBanner,
  drawSectionHeader,
  safePageBreak,
  drawInfoBox,
  calculateInfoBoxHeight,
  drawSeparator,
  drawInlineFooter,
  drawCompactTable,
  drawAllergenSection,
  drawImportantInfoSection,
} from './pdf/pdf.primitives';

// ═══════════════ RE-EXPORTS (preserve public API) ═══════════════

export type {
  ReservationPDFData,
  CategoryExtraForPDF,
  PaymentConfirmationData,
  MenuCardPDFData,
  RevenueReportPDFData,
  OccupancyReportPDFData,
  CateringOrderItemForPDF,
  CateringQuotePDFData,
  CateringKitchenPrintData,
  CateringInvoicePDFData,
  CateringOrderPDFData,
} from './pdf/pdf.types';

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

  /** Build a PdfDrawContext for the extracted primitive functions */
  private getDrawContext(): PdfDrawContext {
    return {
      useCustomFonts: this.useCustomFonts,
      restaurantData: this.restaurantData,
    };
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
      this.buildReservationPDF(doc, reservation).then(() => doc.end()).catch(reject);
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

  private async buildReservationPDF(doc: PDFKit.PDFDocument, r: ReservationPDFData): Promise<void> {
    const ctx = this.getDrawContext();
    // Load layout config from DB (colors, section order/visibility)
    const config = await loadPdfConfig('pdf-layout-reservation');
    if (config?.colors) {
      setColors({ ...DEFAULT_COLORS, ...config.colors });
    }

    try {
      const left = 40;
      const pageWidth = doc.page.width - 80;

      // Build section renderers
      const sectionRenderers: Record<string, () => void> = {
        header: () => {
          /* istanbul ignore next */
          const statusInfo = STATUS_MAP[r.status] || { label: r.status, color: COLORS.textMuted };
          drawHeaderBanner(doc, ctx, statusInfo.label, statusInfo.color);
        },
        title_meta: () => {
          doc.y = 80;
          doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(this.useCustomFonts));
          doc.text('POTWIERDZENIE REZERWACJI', left, doc.y, { align: 'center', width: pageWidth });
          doc.moveDown(0.2);
          doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
          doc.text(`Nr: ${r.id}  |  Wygenerowano: ${formatDate(new Date())}`, left, doc.y, {
            align: 'center', width: pageWidth,
          });
          doc.moveDown(0.6);
          drawSeparator(doc, left, pageWidth);
          doc.moveDown(0.5);
        },
        client_event: () => {
          this.drawClientAndEventColumns(doc, r, left, pageWidth);
          doc.moveDown(0.4);
          drawSeparator(doc, left, pageWidth);
          doc.moveDown(0.4);
        },
        menu: () => {
          const menuSnapshot = r.menuSnapshot;
          if (menuSnapshot && menuSnapshot.menuData) {
            this.drawMenuTable(doc, menuSnapshot, left, pageWidth);
            doc.moveDown(0.3);
            drawSeparator(doc, left, pageWidth);
            doc.moveDown(0.4);
          } else if (r.menuData?.dishSelections && r.menuData.dishSelections.length > 0) {
            this.drawMenuTableLegacy(doc, r.menuData, left, pageWidth);
            doc.moveDown(0.3);
            drawSeparator(doc, left, pageWidth);
            doc.moveDown(0.4);
          }
        },
        extras: () => {
          if (r.reservationExtras && r.reservationExtras.length > 0) {
            this.drawExtrasInline(doc, r.reservationExtras, left, pageWidth);
            doc.moveDown(0.3);
            drawSeparator(doc, left, pageWidth);
            doc.moveDown(0.4);
          }
        },
        category_extras: () => {
          if (r.categoryExtras && r.categoryExtras.length > 0) {
            this.drawCategoryExtras(doc, r.categoryExtras, left, pageWidth);
            doc.moveDown(0.3);
            drawSeparator(doc, left, pageWidth);
            doc.moveDown(0.4);
          }
        },
        financial_summary: () => {
          this.drawFinancialSummary(doc, r, left, pageWidth);
        },
        notes: () => {
          if (r.notes) {
            doc.moveDown(0.4);
            const noteIndent = 10;
            doc.fontSize(8).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
            doc.text('Uwagi:', left, doc.y);
            doc.moveDown(0.15);
            const noteLines = r.notes.split('\n').filter(line => line.trim() !== '');
            doc.font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
            noteLines.forEach((line) => {
              doc.text(line.trim(), left + noteIndent, doc.y, { width: pageWidth - noteIndent });
            });
          }
        },
        important_info: () => {
          const eventDate = r.startDateTime
            ? new Date(r.startDateTime)
            : r.date
              ? new Date(r.date)
              : undefined;
          drawImportantInfoSection(doc, ctx, left, pageWidth, eventDate);
        },
        footer: () => {
          doc.moveDown(1);
          drawInlineFooter(doc, ctx, left, pageWidth);
        },
      };

      // Get section order from config or use default
      const sections = config?.sections
        ? [...config.sections].sort((a, b) => a.order - b.order)
        : Object.keys(sectionRenderers).map((id, i) => ({ id, enabled: true, order: i + 1 }));

      for (const section of sections) {
        if (section.enabled && sectionRenderers[section.id]) {
          sectionRenderers[section.id]();
        }
      }
    } finally {
      // Restore default colors
      resetColors();
    }
  }

  // ── TWO-COLUMN: CLIENT | EVENT ──
  private drawClientAndEventColumns(
    doc: PDFKit.PDFDocument,
    r: ReservationPDFData,
    left: number,
    pageWidth: number
  ): void {
    const ctx = this.getDrawContext();
    const colGap = 20;
    const colWidth = (pageWidth - colGap) / 2;
    const startY = doc.y;

    drawInfoBox(doc, ctx, 'KLIENT', left, startY, colWidth, [
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
      dateStr = formatDate(r.startDateTime);
      timeStr = `${formatTime(r.startDateTime)} - ${formatTime(r.endDateTime)}`;
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

    // #176: Duration with extra hours info
    if (r.startDateTime && r.endDateTime) {
      const durationMs = new Date(r.endDateTime).getTime() - new Date(r.startDateTime).getTime();
      const durationHours = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;
      const standardHours = r.eventType?.standardHours;
      if (standardHours && durationHours > standardHours) {
        const extraHours = Math.round((durationHours - standardHours) * 10) / 10;
        eventDetails.push(`Czas: ${durationHours}h (${standardHours}h + ${extraHours}h extra)`);
      } else {
        eventDetails.push(`Czas trwania: ${durationHours}h`);
      }
    }

    /* istanbul ignore next */
    if (r.birthdayAge) eventDetails.push(`Wiek jubilata: ${r.birthdayAge} lat`);
    /* istanbul ignore next */
    if (r.anniversaryYear) {
      eventDetails.push(`Rocznica: ${r.anniversaryYear} lat${r.anniversaryOccasion ? ` (${r.anniversaryOccasion})` : ''}`);
    }

    drawInfoBox(doc, ctx, 'WYDARZENIE', left + colWidth + colGap, startY, colWidth,
      eventDetails.filter(Boolean)
    );

    const boxHeight = calculateInfoBoxHeight(Math.max(
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
    const ctx = this.getDrawContext();
    /* istanbul ignore next */
    const packageName = menuSnapshot.menuData?.packageName || menuSnapshot.menuData?.package?.name || '';
    drawSectionHeader(doc, ctx, 'WYBRANE MENU', left, pageWidth);
    if (packageName) {
      doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
      doc.text(`Pakiet: ${packageName}  |  Cena menu: ${formatCurrency(menuSnapshot.totalMenuPrice)}`, left, doc.y);
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
    drawCompactTable(doc, ctx, ['Kategoria', 'Ilość', 'Wybrane dania'], tableRows, colWidths, left);

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
    const ctx = this.getDrawContext();
    drawSectionHeader(doc, ctx, 'WYBRANE DANIA', left, pageWidth);
    if (menuData.packageName) {
      doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
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
    drawCompactTable(doc, ctx, ['Kategoria', 'Ilość', 'Wybrane dania'], tableRows, colWidths, left);

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
    const ctx = this.getDrawContext();
    drawSectionHeader(doc, ctx, 'USŁUGI DODATKOWE', left, pageWidth);

    const grouped = new Map<string, ReservationExtraForPDF[]>();
    for (const extra of extras) {
      const catName = extra.serviceItem.category?.name || 'Inne';
      if (!grouped.has(catName)) grouped.set(catName, []);
      grouped.get(catName)!.push(extra);
    }

    for (const [categoryName, items] of grouped) {
      doc.fontSize(8).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.primaryLight);
      doc.text(`${categoryName}:`, left, doc.y);
      doc.moveDown(0.1);

      for (const item of items) {
        doc.font(getRegularFont(this.useCustomFonts)).fontSize(8).fillColor(COLORS.textDark);

        const itemTotal = Number(item.totalPrice);
        let chipText: string;
        switch (item.priceType) {
          case 'FREE':
            chipText = `${item.serviceItem.name} (Gratis)`;
            break;
          case 'PER_PERSON':
            chipText = `${item.serviceItem.name} (${formatCurrency(itemTotal)})`;
            break;
          case 'PER_UNIT':
            chipText = `${item.serviceItem.name} ${item.quantity}szt. (${formatCurrency(itemTotal)})`;
            break;
          case 'FLAT':
          default:
            chipText = `${item.serviceItem.name} (${formatCurrency(itemTotal)})`;
            break;
        }

        if (item.note) {
          doc.font(getBoldFont(this.useCustomFonts)).text(`${chipText}`, left + 10, doc.y, { continued: true });
          doc.font(getRegularFont(this.useCustomFonts)).fontSize(7).fillColor(COLORS.textMuted);
          doc.text(`  — Uwaga: ${item.note}`, { width: pageWidth - 20 });
        } else {
          doc.text(`${chipText}`, left + 10, doc.y, { width: pageWidth - 20 });
        }
      }
      doc.moveDown(0.2);
    }
  }

  // ── #216: CATEGORY EXTRAS TABLE ──
  private drawCategoryExtras(
    doc: PDFKit.PDFDocument,
    categoryExtras: CategoryExtraForPDF[],
    left: number,
    pageWidth: number
  ): void {
    const ctx = this.getDrawContext();
    const PORTION_LABELS: Record<string, string> = {
      ALL: 'wszyscy',
      ADULTS_ONLY: 'dorośli',
      CHILDREN_ONLY: 'dzieci',
    };

    safePageBreak(doc, 60);

    doc.fontSize(9).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.primaryLight);
    doc.text('DODATKOWO PŁATNE PORCJE', left, doc.y);
    doc.moveDown(0.3);

    // Table header
    const col1 = left;        // Kategoria
    const col2 = left + 180;  // Ilość
    const col3 = left + 230;  // Cena/szt.
    const col4 = left + 310;  // Osoby
    const rightEdge = left + pageWidth;

    doc.fontSize(7).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text('Kategoria', col1, doc.y);
    doc.text('Ilość', col2, doc.y - doc.currentLineHeight(), { width: 50 });
    doc.text('Cena/szt.', col3, doc.y - doc.currentLineHeight(), { width: 70 });
    doc.text('Osoby', col4, doc.y - doc.currentLineHeight(), { width: 50 });
    doc.text('Suma', rightEdge - 80, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    doc.moveDown(0.3);

    // Thin separator
    doc.strokeColor(COLORS.border).lineWidth(0.3)
       .moveTo(col1, doc.y).lineTo(rightEdge, doc.y).stroke();
    doc.moveDown(0.2);

    // Rows
    doc.font(getRegularFont(this.useCustomFonts)).fontSize(8).fillColor(COLORS.textDark);
    for (const extra of categoryExtras) {
      const y = doc.y;
      const portionLabel = PORTION_LABELS[extra.portionTarget] || extra.portionTarget;
      doc.text(extra.categoryName, col1, y, { width: 170 });
      doc.text(String(extra.quantity), col2, y, { width: 50 });
      doc.text(formatCurrency(extra.pricePerItem), col3, y, { width: 70 });
      doc.text(`${extra.guestCount} (${portionLabel})`, col4, y, { width: 80 });
      doc.text(formatCurrency(extra.totalPrice), rightEdge - 80, y, { width: 80, align: 'right' });
      doc.moveDown(0.15);
    }

    // Total row
    const totalCategoryExtras = categoryExtras.reduce((sum, e) => sum + e.totalPrice, 0);
    doc.moveDown(0.1);
    doc.strokeColor(COLORS.border).lineWidth(0.3)
       .moveTo(col1, doc.y).lineTo(rightEdge, doc.y).stroke();
    doc.moveDown(0.2);
    doc.font(getBoldFont(this.useCustomFonts)).fontSize(8);
    doc.text('Razem dodatkowo płatne porcje:', col1, doc.y);
    doc.text(formatCurrency(totalCategoryExtras), rightEdge - 80, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    doc.moveDown(0.3);
  }

  // ── FINANCIAL SUMMARY BOX (compact) ──
  private drawFinancialSummary(
    doc: PDFKit.PDFDocument,
    r: ReservationPDFData,
    left: number,
    pageWidth: number
  ): void {
    const ctx = this.getDrawContext();
    const extrasTotalCalc = (r.reservationExtras || [])
      .reduce((sum, e) => sum + Number(e.totalPrice), 0);
    const categoryExtrasTotalCalc = (r.categoryExtras || [])
      .reduce((sum, e) => sum + Number(e.totalPrice), 0);
    const venueSurchargeAmount = Number(r.venueSurcharge) || 0;
    const extraHoursCostAmt = Number(r.extraHoursCost) || 0;
    const discountAmount = Number(r.discountAmount) || 0;
    const hasDiscount = discountAmount > 0 && !!r.discountType;
    // totalPrice from DB already includes extras, surcharge, extraHours, and discount
    // (see recalculate-price.ts formula). Do NOT add extras again.
    const displayTotal = Number(r.totalPrice);

    // #deposits-fix (2/5): Secondary guard — filter CANCELLED deposits in the PDF renderer.
    // Primary guard lives in reservation.controller.ts downloadPDF().
    // Using both guards ensures robustness even if the controller path changes.
    const activeDeposits = (r.deposits || []).filter((d: any) => d.status !== 'CANCELLED');
    // Legacy fallback: if no deposits array, fall back to the single deposit field
    const depositsForDisplay: Array<{ amount: number | string; dueDate: Date | string; status: string; paid: boolean }> =
      activeDeposits.length > 0
        ? activeDeposits
        : r.deposit
          ? [r.deposit]
          : [];

    let rowCount = 0;
    if (r.adults > 0 && r.pricePerAdult > 0) rowCount++;
    if (r.children > 0 && r.pricePerChild > 0) rowCount++;
    if (r.toddlers > 0 && r.pricePerToddler > 0) rowCount++;
    if (extrasTotalCalc > 0) rowCount++;
    if (categoryExtrasTotalCalc > 0) rowCount++;
    if (venueSurchargeAmount > 0) rowCount++;
    if (extraHoursCostAmt > 0) rowCount++;
    if (hasDiscount) rowCount += 2; // "Suma przed rabatem" + "Rabat" rows
    rowCount++; // RAZEM
    // Each active deposit gets its own row + one final DO ZAPŁATY row
    if (depositsForDisplay.length > 0) rowCount += depositsForDisplay.length + 1;
    const boxHeight = 22 + rowCount * 13 + (depositsForDisplay.length > 0 ? 14 : 0);

    safePageBreak(doc, boxHeight + 15);
    const boxY = doc.y;

    doc.rect(left, boxY, pageWidth, boxHeight).fill(COLORS.bgLight);
    doc.rect(left, boxY, 3, boxHeight).fill(COLORS.accent);

    doc.fillColor(COLORS.textDark).fontSize(9).font(getBoldFont(this.useCustomFonts));
    doc.text('PODSUMOWANIE', left + 12, boxY + 7);

    let y = boxY + 22;
    const labelX = left + 12;
    const rightEdge = left + pageWidth - 12;
    const valueWidth = 100;
    const valueX = rightEdge - valueWidth;

    doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textDark);

    if (r.adults > 0 && r.pricePerAdult > 0) {
      const adultTotal = r.adults * Number(r.pricePerAdult);
      doc.text(`Dorośli: ${r.adults} os. x ${formatCurrency(r.pricePerAdult)}`, labelX, y);
      doc.text(formatCurrency(adultTotal), valueX, y, { width: valueWidth, align: 'right' });
      y += 13;
    }
    /* istanbul ignore next */
    if (r.children > 0 && r.pricePerChild > 0) {
      const childTotal = r.children * Number(r.pricePerChild);
      doc.text(`Dzieci (4-12 lat): ${r.children} os. x ${formatCurrency(r.pricePerChild)}`, labelX, y);
      doc.text(formatCurrency(childTotal), valueX, y, { width: valueWidth, align: 'right' });
      y += 13;
    }
    /* istanbul ignore next */
    if (r.toddlers > 0 && r.pricePerToddler > 0) {
      const toddlerTotal = r.toddlers * Number(r.pricePerToddler);
      doc.text(`Maluchy (0-3 lata): ${r.toddlers} os. x ${formatCurrency(r.pricePerToddler)}`, labelX, y);
      doc.text(formatCurrency(toddlerTotal), valueX, y, { width: valueWidth, align: 'right' });
      y += 13;
    }
    if (extrasTotalCalc > 0) {
      doc.text('Usługi dodatkowe', labelX, y);
      doc.text(formatCurrency(extrasTotalCalc), valueX, y, { width: valueWidth, align: 'right' });
      y += 13;
    }
    if (categoryExtrasTotalCalc > 0) {
      doc.text('Dodatkowo płatne porcje', labelX, y);
      doc.text(formatCurrency(categoryExtrasTotalCalc), valueX, y, { width: valueWidth, align: 'right' });
      y += 13;
    }
    if (venueSurchargeAmount > 0) {
      const surchargeLabel = r.venueSurchargeLabel || 'Dopłata za cały obiekt';
      doc.text(surchargeLabel, labelX, y);
      doc.text(formatCurrency(venueSurchargeAmount), valueX, y, { width: valueWidth, align: 'right' });
      y += 13;
    }
    if (extraHoursCostAmt > 0) {
      const extraHourRate = Number(r.eventType?.extraHourRate) || 0;
      const extraHoursCount = extraHourRate > 0
        ? Math.round(extraHoursCostAmt / extraHourRate * 10) / 10
        : 0;
      const extraLabel = extraHourRate > 0
        ? `Dodatkowe godziny: ${extraHoursCount}h \u00d7 ${formatCurrency(extraHourRate)}/h`
        : 'Dodatkowe godziny';
      doc.text(extraLabel, labelX, y);
      doc.text(formatCurrency(extraHoursCostAmt), valueX, y, { width: valueWidth, align: 'right' });
      y += 13;
    }

    // #216: Discount row
    if (hasDiscount) {
      const priceBeforeDiscount = Number(r.priceBeforeDiscount) || (displayTotal + discountAmount);
      doc.text('Suma przed rabatem', labelX, y);
      doc.text(formatCurrency(priceBeforeDiscount), valueX, y, { width: valueWidth, align: 'right' });
      y += 13;

      const discountLabel = r.discountType === 'PERCENTAGE'
        ? `Rabat (${Number(r.discountValue)}%)`
        : 'Rabat';
      doc.fillColor('#c0392b');
      doc.text(discountLabel, labelX, y);
      doc.text(`-${formatCurrency(discountAmount)}`, valueX, y, { width: valueWidth, align: 'right' });
      y += 13;
      doc.fillColor(COLORS.textDark);
    }

    y += 2;
    doc.strokeColor(COLORS.border).lineWidth(0.5)
       .moveTo(labelX, y).lineTo(rightEdge, y).stroke();
    y += 5;

    doc.fontSize(9).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
    doc.text('RAZEM', labelX, y);
    doc.text(formatCurrency(displayTotal), valueX, y, { width: valueWidth, align: 'right' });
    y += 14;

    if (depositsForDisplay.length > 0) {
      const depositBadgeWidth = 32;
      const depositBadgeGap = 4;
      const depositValueWidth = valueWidth - depositBadgeWidth - depositBadgeGap;
      const depositValueX = valueX;

      for (let i = 0; i < depositsForDisplay.length; i++) {
        const dep = depositsForDisplay[i];
        /* istanbul ignore next */
        const dueDate = dep.dueDate instanceof Date
          ? formatDate(dep.dueDate)
          : dep.dueDate;
        // Use numbered prefix only when there are multiple deposits
        const labelPrefix = depositsForDisplay.length > 1 ? `Zaliczka ${i + 1}` : 'Zaliczka';
        const depositLabel = dep.paid
          ? `${labelPrefix} (opłacona)`
          : `${labelPrefix} (termin: ${dueDate})`;

        doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.success);
        doc.text(depositLabel, labelX, y);

        if (dep.paid) {
          // Paid: full-width amount aligned with RAZEM/DO ZAPŁATY
          doc.text(`-${formatCurrency(Number(dep.amount))}`, valueX, y, { width: valueWidth, align: 'right' });
        } else {
          // Unpaid: narrower amount to leave room for badge
          doc.text(`-${formatCurrency(Number(dep.amount))}`, depositValueX, y, { width: depositValueWidth, align: 'right' });
          const depositBadgeX = depositValueX + depositValueWidth + depositBadgeGap;
          doc.roundedRect(depositBadgeX, y - 1, depositBadgeWidth, 11, 3).fill(COLORS.warning);
          doc.fillColor('#ffffff').fontSize(5.5).font(getBoldFont(this.useCustomFonts));
          doc.text('OCZEK.', depositBadgeX, y + 1, { width: depositBadgeWidth, align: 'center' });
        }

        y += 14;
      }

      doc.strokeColor(COLORS.accent).lineWidth(0.8)
         .moveTo(labelX, y).lineTo(rightEdge, y).stroke();
      y += 5;

      // DO ZAPŁATY = totalPrice minus sum of ALL active deposits
      const totalDeposited = depositsForDisplay.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const remaining = displayTotal - totalDeposited;
      doc.fontSize(10).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.primary);
      doc.text('DO ZAPŁATY', labelX, y);
      doc.text(formatCurrency(remaining), valueX, y, { width: valueWidth, align: 'right' });
    }

    doc.y = boxY + boxHeight + 3;
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM PAYMENT CONFIRMATION — Zadanie 2
  // ═══════════════════════════════════════════════════════════════

  private buildPaymentConfirmationPremium(
    doc: PDFKit.PDFDocument,
    data: PaymentConfirmationData
  ): void {
    const ctx = this.getDrawContext();
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // ── 1. HEADER BANNER with „OPŁACONA" badge ──
    drawHeaderBanner(doc, ctx, 'OPŁACONA', COLORS.success);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(this.useCustomFonts));
    doc.text('POTWIERDZENIE WPŁATY ZALICZKI', left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(`Nr: ${data.depositId}  |  Wygenerowano: ${formatDate(new Date())}`, left, doc.y, {
      align: 'center', width: pageWidth,
    });

    doc.moveDown(0.6);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. TWO-COLUMN: KLIENT | WPŁATA ──
    const colGap = 20;
    const colWidth = (pageWidth - colGap) / 2;
    const startY = doc.y;

    drawInfoBox(doc, ctx, 'KLIENT', left, startY, colWidth, [
      `${data.client.firstName} ${data.client.lastName}`,
      data.client.email || '',
      data.client.phone,
      data.client.address || '',
    ].filter(Boolean));

    /* istanbul ignore next */
    const methodLabel = PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod;
    const paymentLines: string[] = [
      formatCurrency(data.amount),
      `Data: ${formatDate(data.paidAt)}`,
      `Metoda: ${methodLabel}`,
    ];
    if (data.paymentReference) {
      paymentLines.push(`Ref: ${data.paymentReference}`);
    }

    drawInfoBox(doc, ctx, 'SZCZEGÓŁY WPŁATY', left + colWidth + colGap, startY, colWidth, paymentLines);

    const leftLines = [data.client.firstName, data.client.email, data.client.phone, data.client.address].filter(Boolean).length;
    const boxHeight = calculateInfoBoxHeight(Math.max(leftLines, paymentLines.length));
    doc.y = startY + boxHeight + 5;

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    // ── 4. RESERVATION INFO BOX (full-width) ──
    const resLines: string[] = [
      `${data.reservation.date}  ${data.reservation.startTime} - ${data.reservation.endTime}`,
    ];
    if (data.reservation.eventType) resLines.push(`Typ: ${data.reservation.eventType}`);
    resLines.push(`Gości: ${data.reservation.guests}`);
    resLines.push(`Nr rezerwacji: ${data.reservation.id}`);

    drawInfoBox(doc, ctx, 'REZERWACJA', left, doc.y, pageWidth, resLines);
    const resBoxHeight = calculateInfoBoxHeight(resLines.length);
    doc.y = doc.y + resBoxHeight + 5;

    // ── 5. FOOTER (sekcja finansowa usunieta - #172) ──
    doc.moveDown(1);
    drawInlineFooter(doc, ctx, left, pageWidth);
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM MENU CARD — Zadanie 3
  // ═══════════════════════════════════════════════════════════════

  private buildMenuCardPremium(doc: PDFKit.PDFDocument, data: MenuCardPDFData): void {
    const ctx = this.getDrawContext();
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // ── 1. HEADER BANNER with „KARTA MENU" badge ──
    drawHeaderBanner(doc, ctx, 'KARTA MENU', COLORS.accent);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(this.useCustomFonts));
    doc.text(data.templateName.toUpperCase(), left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    const subtitleParts: string[] = [data.eventTypeName];
    if (data.variant) subtitleParts.push(data.variant);
    doc.fontSize(9).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(subtitleParts.join('  |  '), left, doc.y, { align: 'center', width: pageWidth });

    if (data.templateDescription) {
      doc.moveDown(0.3);
      doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
      doc.text(data.templateDescription, left, doc.y, { align: 'center', width: pageWidth });
    }

    doc.moveDown(0.2);
    doc.fontSize(7).fillColor(COLORS.textLight);
    doc.text(`Wygenerowano: ${formatDate(new Date())}`, left, doc.y, {
      align: 'center', width: pageWidth,
    });

    doc.moveDown(0.6);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. PACKAGES ──
    data.packages.forEach((pkg, pkgIndex) => {
      if (pkgIndex > 0) {
        doc.moveDown(0.5);
        drawSeparator(doc, left, pageWidth);
        doc.moveDown(0.5);
      }

      safePageBreak(doc, 200);

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
        doc.fillColor(COLORS.primary).fontSize(7).font(getBoldFont(this.useCustomFonts));
        doc.text(pkg.badgeText, pkgBadgeX, pkgHeaderY + 12, { width: pkgBadgeWidth, align: 'center' });
      }

      // Package name
      doc.fillColor('#ffffff').fontSize(14).font(getBoldFont(this.useCustomFonts));
      doc.text(pkg.name, left + 15, pkgHeaderY + 10, { width: pageWidth - 130 });

      // Prices
      doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textLight);
      const priceParts = [`${formatCurrency(pkg.pricePerAdult)}/os. dorosła`];
      if (pkg.pricePerChild > 0) priceParts.push(`${formatCurrency(pkg.pricePerChild)}/dziecko`);
      if (pkg.pricePerToddler > 0) priceParts.push(`${formatCurrency(pkg.pricePerToddler)}/maluch`);
      doc.text(priceParts.join('  |  '), left + 15, pkgHeaderY + 32, { width: pageWidth - 40 });

      doc.y = pkgHeaderY + headerHeight + 8;

      // Description
      if (pkg.description) {
        doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
        doc.text(pkg.description, left, doc.y, { width: pageWidth });
        doc.moveDown(0.3);
      }

      // Included items — info box style
      if (pkg.includedItems && pkg.includedItems.length > 0) {
        doc.fontSize(8).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.success);
        doc.text('W cenie: ', left, doc.y, { continued: true });
        doc.font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textDark);
        doc.text(pkg.includedItems.join(', '), { width: pageWidth - 60 });
        doc.moveDown(0.3);
      }

      // ── COURSES — 2-column tables (no allergens per course) ──
      if (pkg.courses.length > 0) {
        pkg.courses.forEach((course) => {
          safePageBreak(doc, 120);
          doc.moveDown(0.4);

          // Course header
          const selectText = course.minSelect === course.maxSelect
            ? `wybierz ${course.minSelect}`
            : `wybierz ${course.minSelect}-${course.maxSelect}`;

          doc.fontSize(10).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.primaryLight);
          doc.text(course.name, left, doc.y, { continued: true });
          doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
          doc.text(`  (${selectText} z ${course.dishes.length})`);

          /* istanbul ignore next */
          if (course.description) {
            doc.fontSize(7).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
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
          drawCompactTable(
            doc,
            ctx,
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
        safePageBreak(doc, 80);
        doc.moveDown(0.5);

        doc.fontSize(9).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.success);
        doc.text('W PAKIECIE', left, doc.y);
        doc.moveDown(0.2);

        const reqRows = requiredOptions.map(opt => [
          `+ ${opt.name}`,
          opt.description || '',
        ]);
        const reqColWidths = [Math.round(pageWidth * 0.40), Math.round(pageWidth * 0.60)];
        drawCompactTable(doc, ctx, ['Opcja', 'Opis'], reqRows, reqColWidths, left);
      }

      if (activeOptions.length > 0) {
        safePageBreak(doc, 80);
        doc.moveDown(0.5);

        doc.fontSize(9).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.purple);
        doc.text('OPCJE DODATKOWE', left, doc.y);
        doc.moveDown(0.2);

        const optRows = activeOptions.map(opt => {
          const priceLabel = opt.priceType === 'PER_PERSON'
            ? `+${formatCurrency(opt.priceAmount)}/os.`
            : `+${formatCurrency(opt.priceAmount)}`;
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
        drawCompactTable(doc, ctx, ['Opcja', 'Opis', 'Cena'], optRows, optColWidths, left);
      }
    });

    // ── 4. GLOBAL ALLERGEN SECTION (at the end, before footer) ──
    const allergenMap = collectAllAllergens(data.packages);
    drawAllergenSection(doc, ctx, allergenMap, left, pageWidth);

    // ── 5. FOOTER ──
    doc.moveDown(1);
    drawInlineFooter(doc, ctx, left, pageWidth);
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM REVENUE REPORT PDF — Zadanie 4
  // ═══════════════════════════════════════════════════════════════

  private buildRevenueReportPDF(doc: PDFKit.PDFDocument, data: RevenueReportPDFData): void {
    const ctx = this.getDrawContext();
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // ── 1. HEADER BANNER ──
    drawHeaderBanner(doc, ctx, 'RAPORT', COLORS.info);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(this.useCustomFonts));
    doc.text('RAPORT PRZYCHODÓW', left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
    const metaParts: string[] = [`Okres: ${data.filters.dateFrom} - ${data.filters.dateTo}`];
    if (data.filters.groupBy) metaParts.push(`Grupowanie: ${data.filters.groupBy}`);
    metaParts.push(`Wygenerowano: ${formatDate(new Date())}`);
    doc.text(metaParts.join('  |  '), left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.6);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. SUMMARY INFO BOX ──
    const summaryLines: string[] = [
      `Całkowity przychód: ${formatCurrency(data.summary.totalRevenue)}`,
      `Średni przychód na rezerwację: ${formatCurrency(data.summary.avgRevenuePerReservation)}`,
      `Liczba rezerwacji: ${data.summary.totalReservations}`,
      `Ukończone rezerwacje: ${data.summary.completedReservations}`,
      `Oczekujący przychód: ${formatCurrency(data.summary.pendingRevenue)}`,
      `Wzrost: ${data.summary.growthPercent}%`,
    ];
    if (data.summary.extrasRevenue !== undefined && data.summary.extrasRevenue > 0) {
      summaryLines.push(`Przychody z usług dodatkowych: ${formatCurrency(data.summary.extrasRevenue)}`);
    }
    if (data.summary.categoryExtrasRevenue !== undefined && data.summary.categoryExtrasRevenue > 0) {
      summaryLines.push(`Przychody z dodatkowo płatnych porcji: ${formatCurrency(data.summary.categoryExtrasRevenue)}`);
    }

    drawInfoBox(doc, ctx, 'PODSUMOWANIE', left, doc.y, pageWidth, summaryLines);
    const summaryBoxHeight = calculateInfoBoxHeight(summaryLines.length);
    doc.y = doc.y + summaryBoxHeight + 5;

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    // ── 4. BREAKDOWN BY PERIOD ──
    if (data.breakdown.length > 0) {
      safePageBreak(doc, 100);
      drawSectionHeader(doc, ctx, 'ROZKŁAD WG OKRESU', left, pageWidth);

      const breakdownRows = data.breakdown.slice(0, 20).map(item => [
        item.period,
        formatCurrency(item.revenue),
        `${item.count}`,
        formatCurrency(item.avgRevenue),
      ]);
      const breakdownCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
      ];
      drawCompactTable(doc, ctx, ['Okres', 'Przychód', 'Liczba', 'Średnia'], breakdownRows, breakdownCols, left);

      doc.moveDown(0.4);
      drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 5. BY HALL ──
    if (data.byHall.length > 0) {
      safePageBreak(doc, 100);
      drawSectionHeader(doc, ctx, 'PRZYCHODY WG SAL', left, pageWidth);

      const hallRows = data.byHall.slice(0, 20).map(item => [
        item.hallName,
        formatCurrency(item.revenue),
        `${item.count}`,
        formatCurrency(item.avgRevenue),
      ]);
      const hallCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
      ];
      drawCompactTable(doc, ctx, ['Sala', 'Przychód', 'Liczba', 'Średnia'], hallRows, hallCols, left);

      doc.moveDown(0.4);
      drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 6. BY EVENT TYPE ──
    if (data.byEventType.length > 0) {
      safePageBreak(doc, 100);
      drawSectionHeader(doc, ctx, 'PRZYCHODY WG TYPU WYDARZENIA', left, pageWidth);

      const eventRows = data.byEventType.slice(0, 20).map(item => [
        item.eventTypeName,
        formatCurrency(item.revenue),
        `${item.count}`,
        formatCurrency(item.avgRevenue),
      ]);
      const eventCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
      ];
      drawCompactTable(doc, ctx, ['Typ wydarzenia', 'Przychód', 'Liczba', 'Średnia'], eventRows, eventCols, left);

      doc.moveDown(0.4);
      drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 7. BY SERVICE ITEM (extras) ──
    if (data.byServiceItem && data.byServiceItem.length > 0) {
      safePageBreak(doc, 100);

      doc.fontSize(11).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.purple);
      doc.text('USŁUGI DODATKOWE — PRZYCHODY', left, doc.y);
      doc.moveDown(0.3);

      const extrasRows = data.byServiceItem.slice(0, 20).map(item => [
        item.name,
        formatCurrency(item.revenue),
        `${item.count}`,
        formatCurrency(item.avgRevenue),
      ]);
      const extrasCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
      ];
      drawCompactTable(doc, ctx, ['Usługa', 'Przychód', 'Użyć', 'Śr. przychód'], extrasRows, extrasCols, left);

      // Total extras row
      if (data.summary.extrasRevenue && data.summary.extrasRevenue > 0) {
        doc.moveDown(0.2);
        doc.fontSize(9).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.purple);
        doc.text(`Razem extras: ${formatCurrency(data.summary.extrasRevenue)}`, left, doc.y);
        doc.fillColor(COLORS.textDark);
      }

      doc.moveDown(0.4);
      drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 8. BY CATEGORY EXTRA (dodatkowo płatne porcje) #216 ──
    if (data.byCategoryExtra && data.byCategoryExtra.length > 0) {
      safePageBreak(doc, 100);

      doc.fontSize(11).font(getBoldFont(this.useCustomFonts)).fillColor('#D97706');
      doc.text('DODATKOWO PŁATNE PORCJE — PRZYCHODY', left, doc.y);
      doc.moveDown(0.3);

      const catExtrasRows = data.byCategoryExtra.slice(0, 20).map(item => [
        item.categoryName,
        formatCurrency(item.revenue),
        `${item.totalQuantity}`,
        formatCurrency(item.avgRevenue),
      ]);
      const catExtrasCols = [
        Math.round(pageWidth * 0.30),
        Math.round(pageWidth * 0.25),
        Math.round(pageWidth * 0.20),
        Math.round(pageWidth * 0.25),
      ];
      drawCompactTable(doc, ctx, ['Kategoria', 'Przychód', 'Porcje', 'Śr. przychód'], catExtrasRows, catExtrasCols, left);

      if (data.summary.categoryExtrasRevenue && data.summary.categoryExtrasRevenue > 0) {
        doc.moveDown(0.2);
        doc.fontSize(9).font(getBoldFont(this.useCustomFonts)).fillColor('#D97706');
        doc.text(`Razem dodatkowo płatne porcje: ${formatCurrency(data.summary.categoryExtrasRevenue)}`, left, doc.y);
        doc.fillColor(COLORS.textDark);
      }

      doc.moveDown(0.4);
      drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 9. FOOTER ──
    doc.moveDown(0.5);
    drawInlineFooter(doc, ctx, left, pageWidth);
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  PREMIUM OCCUPANCY REPORT PDF — Zadanie 4
  // ═══════════════════════════════════════════════════════════════

  private buildOccupancyReportPDF(doc: PDFKit.PDFDocument, data: OccupancyReportPDFData): void {
    const ctx = this.getDrawContext();
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // ── 1. HEADER BANNER ──
    drawHeaderBanner(doc, ctx, 'RAPORT', COLORS.info);

    // ── 2. TITLE + META ──
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(this.useCustomFonts));
    doc.text('RAPORT ZAJĘTOŚCI', left, doc.y, { align: 'center', width: pageWidth });

    doc.moveDown(0.2);
    doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(
      `Okres: ${data.filters.dateFrom} - ${data.filters.dateTo}  |  Wygenerowano: ${formatDate(new Date())}`,
      left, doc.y, { align: 'center', width: pageWidth }
    );

    doc.moveDown(0.6);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // ── 3. SUMMARY INFO BOX ──
    const summaryLines: string[] = [
      `Średnia zajętość: ${data.summary.avgOccupancy}%`,
      `Najpopularniejszy dzień: ${translateDayOfWeek(data.summary.peakDay)}`,
      `Najpopularniejsza sala: ${data.summary.peakHall || 'Brak danych'}`,
      `Liczba rezerwacji: ${data.summary.totalReservations}`,
      `Dni w okresie: ${data.summary.totalDaysInPeriod}`,
    ];

    drawInfoBox(doc, ctx, 'PODSUMOWANIE', left, doc.y, pageWidth, summaryLines);
    const summaryBoxHeight = calculateInfoBoxHeight(summaryLines.length);
    doc.y = doc.y + summaryBoxHeight + 5;

    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    // ── 4. HALLS RANKING ──
    if (data.halls.length > 0) {
      safePageBreak(doc, 100);
      drawSectionHeader(doc, ctx, 'ZAJĘTOŚĆ SAL', left, pageWidth);

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
      drawCompactTable(doc, ctx, ['Sala', 'Zajętość %', 'Rezerwacje', 'Śr. gości'], hallRows, hallCols, left);

      doc.moveDown(0.4);
      drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 5. PEAK HOURS ──
    if (data.peakHours.length > 0) {
      safePageBreak(doc, 100);
      drawSectionHeader(doc, ctx, 'NAJPOPULARNIEJSZE GODZINY', left, pageWidth);

      const hourRows = data.peakHours.slice(0, 20).map(hour => [
        `${hour.hour}:00`,
        `${hour.count}`,
      ]);
      const hourCols = [
        Math.round(pageWidth * 0.50),
        Math.round(pageWidth * 0.50),
      ];
      drawCompactTable(doc, ctx, ['Godzina', 'Liczba rezerwacji'], hourRows, hourCols, left);

      doc.moveDown(0.4);
      drawSeparator(doc, left, pageWidth);
      doc.moveDown(0.4);
    }

    // ── 6. PEAK DAYS OF WEEK ──
    if (data.peakDaysOfWeek.length > 0) {
      safePageBreak(doc, 100);
      drawSectionHeader(doc, ctx, 'NAJPOPULARNIEJSZE DNI TYGODNIA', left, pageWidth);

      const dayRows = data.peakDaysOfWeek.map(day => [
        translateDayOfWeek(day.dayOfWeek),
        `${day.count}`,
      ]);
      const dayCols = [
        Math.round(pageWidth * 0.50),
        Math.round(pageWidth * 0.50),
      ];
      drawCompactTable(doc, ctx, ['Dzień tygodnia', 'Liczba rezerwacji'], dayRows, dayCols, left);

      doc.moveDown(0.4);
    }

    // ── 7. FOOTER ──
    doc.moveDown(0.5);
    drawInlineFooter(doc, ctx, left, pageWidth);
  }


    // ═══════════════ CATERING PDF GENERATION ═══════════════


    async generateCateringOrderPDF(data: CateringOrderPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 30, left: 40, right: 40 },
        info: {
          Title: `Zamówienie ${data.orderNumber}`,
          Author: this.restaurantData.name,
        },
      });
      this.setupFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => reject(error));
      this.buildCateringOrderPDF(doc, data);
      doc.end();
    });
  }
  async generateCateringQuotePDF(data: CateringQuotePDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 30, left: 40, right: 40 },
        info: { Title: `Wycena ${data.orderNumber}`, Author: this.restaurantData.name },
      });
      this.setupFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => reject(error));
      this.buildCateringQuotePDF(doc, data).then(() => doc.end()).catch(reject);
    });
  }

  async generateCateringKitchenPDF(data: CateringKitchenPrintData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 30, left: 40, right: 40 },
        info: { Title: `Druk kuchenny ${data.orderNumber}`, Author: this.restaurantData.name },
      });
      this.setupFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => reject(error));
      this.buildCateringKitchenPDF(doc, data);
      doc.end();
    });
  }

  async generateCateringInvoicePDF(data: CateringInvoicePDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 30, left: 40, right: 40 },
        info: { Title: `Faktura ${data.orderNumber}`, Author: this.restaurantData.name },
      });
      this.setupFonts(doc);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => reject(error));
      this.buildCateringInvoicePDF(doc, data);
      doc.end();
    });
  }

    // ═══════════════ CATERING PDF BUILDERS ═══════════════

  private async buildCateringQuotePDF(doc: PDFKit.PDFDocument, data: CateringQuotePDFData): Promise<void> {
    const ctx = this.getDrawContext();
    const config = await loadPdfConfig('pdf-layout-catering');
    if (config?.colors) {
      setColors({ ...DEFAULT_COLORS, ...config.colors });
    }

    try {
      const left = 40;
      const pageWidth = doc.page.width - 80;

      const sectionRenderers: Record<string, () => void> = {
        header: () => {
          const statusInfo = STATUS_MAP[data.status] || { label: data.status, color: COLORS.textMuted };
          drawHeaderBanner(doc, ctx, statusInfo.label, statusInfo.color);
        },
        title_meta: () => {
          doc.y = 80;
          doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(this.useCustomFonts));
          doc.text('WYCENA CATERING', left, doc.y, { align: 'center', width: pageWidth });
          doc.moveDown(0.2);
          doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
          doc.text(`Nr: ${data.orderNumber} | Data wygenerowania: ${formatDate(new Date())}`, left, doc.y, { align: 'center', width: pageWidth });
          doc.moveDown(0.6);
          drawSeparator(doc, left, pageWidth);
          doc.moveDown(0.5);
        },
        client_info: () => {
          const clientLines = [data.client.firstName + ' ' + data.client.lastName, data.client.phone];
          if (data.client.companyName) clientLines.push(data.client.companyName);
          if (data.client.email) clientLines.push(data.client.email);
          if (data.client.address) clientLines.push(data.client.address);
          drawInfoBox(doc, ctx, 'KLIENT', left, doc.y, pageWidth, clientLines);
          const boxHeight = calculateInfoBoxHeight(clientLines.length);
          doc.y += boxHeight + 5;
          doc.moveDown(0.4);
        },
        event_info: () => {
          doc.fontSize(9).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
          doc.text(`Data wydarzenia: ${formatDate(data.eventDate)}`, left, doc.y);
          doc.text(`Typ dostawy: ${DELIVERY_TYPE_LABELS[data.deliveryType] ?? data.deliveryType}`, left, doc.y);
          if (data.deliveryAddress) doc.text(`Adres: ${data.deliveryAddress}`, left, doc.y);
          doc.text(`Liczba osób: ${(data as any).guestsCount ?? data.guests ?? '—'}`, left, doc.y);
          doc.moveDown(0.4);
          drawSeparator(doc, left, pageWidth);
          doc.moveDown(0.4);
        },
        items_table: () => {
          doc.fontSize(11).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
          doc.text('POZYCJE ZAMÓWIENIA', left, doc.y);
          doc.moveDown(0.3);
          const itemRows = data.items.map(item => [
            (item.dishNameSnapshot ?? item.productName ?? '—') + (item.extraDescription ? ` (${item.extraDescription})` : ''),
            `${item.quantity}`,
            formatCurrency(item.unitPrice),
            formatCurrency(item.totalPrice),
          ]);
          const colWidths = [Math.round(pageWidth * 0.50), Math.round(pageWidth * 0.15), Math.round(pageWidth * 0.17), Math.round(pageWidth * 0.18)];
          drawCompactTable(doc, ctx, ['Danie', 'Ilość', 'Cena jedn.', 'Razem'], itemRows, colWidths, left);
          doc.moveDown(0.4);
        },
        totals: () => {
          doc.fontSize(10).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
          doc.text(`Suma częściowa: ${formatCurrency(data.subtotal)}`, left, doc.y, { align: 'right', width: pageWidth });
          if (data.discountAmount && data.discountAmount > 0) doc.text(`Rabat: -${formatCurrency(data.discountAmount)}`, left, doc.y, { align: 'right', width: pageWidth });
          doc.text(`DO ZAPŁATY: ${formatCurrency(data.totalPrice)}`, left, doc.y, { align: 'right', width: pageWidth });
        },
        notes: () => {
          if (data.notes) {
            doc.moveDown(0.4);
            doc.fontSize(8).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
            doc.text('Uwagi:', left, doc.y);
            doc.font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
            doc.text(data.notes, left, doc.y);
          }
        },
        footer: () => {
          doc.moveDown(1);
          drawInlineFooter(doc, ctx, left, pageWidth);
        },
      };

      const sections = config?.sections
        ? [...config.sections].sort((a, b) => a.order - b.order)
        : Object.keys(sectionRenderers).map((id, i) => ({ id, enabled: true, order: i + 1 }));

      for (const section of sections) {
        if (section.enabled && sectionRenderers[section.id]) {
          sectionRenderers[section.id]();
        }
      }
    } finally {
      resetColors();
    }
  }

  private buildCateringKitchenPDF(doc: PDFKit.PDFDocument, data: CateringKitchenPrintData): void {
    const ctx = this.getDrawContext();
    const left = 40;
    const pageWidth = doc.page.width - 80;
    drawHeaderBanner(doc, ctx, 'DRUK KUCHENNY', COLORS.primary);
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(18).font(getBoldFont(this.useCustomFonts));
    doc.text('DRUK KUCHENNY', left, doc.y, { align: 'center', width: pageWidth });
    doc.moveDown(0.2);
    doc.fontSize(9).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(`Nr zamówienia: ${data.orderNumber}`, left, doc.y, { align: 'center', width: pageWidth });
    doc.moveDown(0.6);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);
    doc.fontSize(10).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
    doc.text(`Data wydarzenia: ${formatDate(data.eventDate)}`, left, doc.y);
    doc.text(`Typ dostawy: ${DELIVERY_TYPE_LABELS[data.deliveryType] ?? data.deliveryType}`, left, doc.y);
    if (data.deliveryAddress) doc.text(`Adres dostawy: ${data.deliveryAddress}`, left, doc.y);
    doc.text(`Liczba gości: ${(data as any).guestsCount ?? data.guests ?? '—'}`, left, doc.y);
    doc.moveDown(0.5);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);
    doc.fontSize(12).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
    doc.text('DO PRZYGOTOWANIA', left, doc.y);
    doc.moveDown(0.3);
    const itemRows = data.items.map(item => [
      (item.dishNameSnapshot ?? item.productName ?? '—') + (item.extraDescription ? ` (${item.extraDescription})` : ''),
      `${item.quantity}`,
    ]);
    const colWidths = [Math.round(pageWidth * 0.75), Math.round(pageWidth * 0.25)];
    drawCompactTable(doc, ctx, ['Danie', 'Ilość'], itemRows, colWidths, left);
    if (data.notes) {
      doc.moveDown(0.5);
      doc.fontSize(9).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
      doc.text('Uwagi klienta:', left, doc.y);
      doc.font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
      doc.text(data.notes, left, doc.y);
    }
    doc.moveDown(1);
    drawInlineFooter(doc, ctx, left, pageWidth);
  }

    private buildCateringOrderPDF(doc: PDFKit.PDFDocument, data: CateringOrderPDFData): void {
    const ctx = this.getDrawContext();
    const left = 40;
    const pageWidth = doc.page.width - 80;

    // Header banner with status
    const statusInfo = STATUS_MAP[data.status] || { label: data.status, color: COLORS.textMuted };
    drawHeaderBanner(doc, ctx, statusInfo.label, statusInfo.color);

    // Title + metadata
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(this.useCustomFonts));
    doc.text('SZCZEGÓŁY ZAMÓWIENIA CATERING', left, doc.y, { align: 'center', width: pageWidth });
    doc.moveDown(0.2);
    doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(`Nr: ${data.orderNumber} | Wygenerowano: ${formatDate(new Date())}`, left, doc.y, {
      align: 'center',
      width: pageWidth,
    });
    doc.moveDown(0.6);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);

    // Client + Event info (two columns)
    const colGap = 20;
    const colWidth = (pageWidth - colGap) / 2;
    const startY = doc.y;

    const clientLines = [data.client.firstName + ' ' + data.client.lastName, data.client.phone];
    if (data.client.companyName) clientLines.push(data.client.companyName);
    if (data.client.email) clientLines.push(data.client.email);
    if (data.client.address) clientLines.push(data.client.address);
    drawInfoBox(doc, ctx, 'KLIENT', left, startY, colWidth, clientLines);

    const deliveryLabel = DELIVERY_TYPE_LABELS[data.deliveryType] ?? data.deliveryType;
    const eventLines = [
      formatDate(data.eventDate),
      `Typ dostawy: ${deliveryLabel}`,
      `Liczba osób: ${data.guestsCount ?? data.guests ?? '—'}`,
    ];
    if (data.deliveryAddress) eventLines.push(`Adres: ${data.deliveryAddress}`);
    drawInfoBox(doc, ctx, 'WYDARZENIE', left + colWidth + colGap, startY, colWidth, eventLines);

    const boxHeight = calculateInfoBoxHeight(Math.max(clientLines.length, eventLines.length));
    doc.y = startY + boxHeight + 5;
    doc.moveDown(0.4);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);

    // Items table
    doc.fontSize(11).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
    doc.text('POZYCJE ZAMÓWIENIA', left, doc.y);
    doc.moveDown(0.3);

    const itemRows = data.items.map(item => [
      (item.dishNameSnapshot ?? item.productName ?? '—') + (item.extraDescription ? ` (${item.extraDescription})` : ''),
      `${item.quantity}`,
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalPrice),
    ]);
    const colWidths = [Math.round(pageWidth * 0.50), Math.round(pageWidth * 0.15), Math.round(pageWidth * 0.17), Math.round(pageWidth * 0.18)];
    drawCompactTable(doc, ctx, ['Danie', 'Ilość', 'Cena jedn.', 'Razem'], itemRows, colWidths, left);

    doc.moveDown(0.4);

    // Financial summary
    doc.fontSize(10).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
    doc.text(`Suma częściowa: ${formatCurrency(data.subtotal)}`, left, doc.y, { align: 'right', width: pageWidth });
    if (data.discountAmount && data.discountAmount > 0)
      doc.text(`Rabat: -${formatCurrency(data.discountAmount)}`, left, doc.y, { align: 'right', width: pageWidth });
    doc.text(`DO ZAPŁATY: ${formatCurrency(data.totalPrice)}`, left, doc.y, { align: 'right', width: pageWidth });

    // Notes
    if (data.notes) {
      doc.moveDown(0.4);
      doc.fontSize(8).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
      doc.text('Uwagi:', left, doc.y);
      doc.font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
      doc.text(data.notes, left, doc.y);
    }

    // Footer
    doc.moveDown(1);
    drawInlineFooter(doc, ctx, left, pageWidth);
  }

  private buildCateringInvoicePDF(doc: PDFKit.PDFDocument, data: CateringInvoicePDFData): void {
    const ctx = this.getDrawContext();
    const left = 40;
    const pageWidth = doc.page.width - 80;
    const statusInfo = STATUS_MAP[data.status] || { label: data.status, color: COLORS.textMuted };
    drawHeaderBanner(doc, ctx, statusInfo.label, statusInfo.color);
    doc.y = 80;
    doc.fillColor(COLORS.textDark).fontSize(16).font(getBoldFont(this.useCustomFonts));
    doc.text('FAKTURA PRO FORMA', left, doc.y, { align: 'center', width: pageWidth });
    doc.moveDown(0.2);
    doc.fontSize(8).font(getRegularFont(this.useCustomFonts)).fillColor(COLORS.textMuted);
    doc.text(`Nr: ${data.orderNumber} | Data wystawienia: ${formatDate(new Date())}`, left, doc.y, { align: 'center', width: pageWidth });
    doc.moveDown(0.6);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.5);
    const clientLines = [data.client.firstName + ' ' + data.client.lastName, data.client.phone];
    if (data.client.companyName) clientLines.push(data.client.companyName);
    if (data.client.nip) clientLines.push(`NIP: ${data.client.nip}`);
    if (data.client.email) clientLines.push(data.client.email);
    if (data.client.address) clientLines.push(data.client.address);
    drawInfoBox(doc, ctx, 'NABYWCA', left, doc.y, pageWidth, clientLines);
    const boxHeight = calculateInfoBoxHeight(clientLines.length);
    doc.y += boxHeight + 5;
    doc.moveDown(0.4);
    doc.fontSize(9).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
    doc.text(`Data wydarzenia: ${formatDate(data.eventDate)}`, left, doc.y);
    doc.text(`Typ dostawy: ${DELIVERY_TYPE_LABELS[data.deliveryType] ?? data.deliveryType}`, left, doc.y);
    drawSeparator(doc, left, pageWidth);
    doc.moveDown(0.4);
    doc.fontSize(11).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
    doc.text('POZYCJE', left, doc.y);
    doc.moveDown(0.3);
    const itemRows = data.items.map(item => [
      (item.dishNameSnapshot ?? item.productName ?? '—') + (item.extraDescription ? ` (${item.extraDescription})` : ''),
      `${item.quantity}`,
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalPrice),
    ]);
    const colWidths = [Math.round(pageWidth * 0.50), Math.round(pageWidth * 0.15), Math.round(pageWidth * 0.17), Math.round(pageWidth * 0.18)];
    drawCompactTable(doc, ctx, ['Nazwa', 'Ilość', 'Cena jedn.', 'Wartość'], itemRows, colWidths, left);
    doc.moveDown(0.4);
    doc.fontSize(10).font(getBoldFont(this.useCustomFonts)).fillColor(COLORS.textDark);
    doc.text(`Netto: ${formatCurrency(data.subtotal)}`, left, doc.y, { align: 'right', width: pageWidth });
    if (data.discountAmount && data.discountAmount > 0) doc.text(`Rabat: -${formatCurrency(data.discountAmount)}`, left, doc.y, { align: 'right', width: pageWidth });
    doc.text(`DO ZAPŁATY: ${formatCurrency(data.totalPrice)}`, left, doc.y, { align: 'right', width: pageWidth });
    doc.moveDown(1);
    drawInlineFooter(doc, ctx, left, pageWidth);
  }
}

export const pdfService = new PDFService();
