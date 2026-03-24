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

import type { PdfDrawContext } from './pdf/pdf.primitives';

// ═══════════════ BUILDER IMPORTS ═══════════════

import { buildReservationPDF } from './pdf/pdf-reservation.builder';
import { buildPaymentConfirmationPremium } from './pdf/pdf-payment.builder';
import { buildMenuCardPremium } from './pdf/pdf-menu-card.builder';
import { buildRevenueReportPDF } from './pdf/pdf-revenue.builder';
import { buildOccupancyReportPDF } from './pdf/pdf-occupancy.builder';
import {
  buildCateringQuotePDF,
  buildCateringKitchenPDF,
  buildCateringOrderPDF,
  buildCateringInvoicePDF,
} from './pdf/pdf-catering.builder';

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

  // ═══════════════ HELPERS ═══════════════

  /**
   * Create a PDFDocument, wire up buffer collection, and return
   * a promise that resolves when doc.end() flushes all data.
   */
  private createDocAndCollect(
    options: PDFKit.PDFDocumentOptions,
  ): { doc: PDFKit.PDFDocument; promise: Promise<Buffer> } {
    const doc = new PDFDocument(options);
    this.setupFonts(doc);
    const chunks: Buffer[] = [];
    const promise = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      /* istanbul ignore next */
      doc.on('error', (error) => reject(error));
    });
    return { doc, promise };
  }

  private defaultA4Options(title: string, subject?: string): PDFKit.PDFDocumentOptions {
    return {
      size: 'A4',
      margins: { top: 0, bottom: 30, left: 40, right: 40 },
      info: {
        Title: title,
        Author: this.restaurantData.name,
        ...(subject ? { Subject: subject } : {}),
      },
    };
  }

  // ═══════════════ PUBLIC API ═══════════════

  async generateReservationPDF(reservation: ReservationPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    console.log(`[PDF Service] Generating PDF for reservation ${reservation.id}`);
    const { doc, promise } = this.createDocAndCollect(
      this.defaultA4Options(`Rezerwacja ${reservation.id}`, 'Potwierdzenie rezerwacji sali'),
    );
    await buildReservationPDF(doc, reservation, this.getDrawContext(), this.useCustomFonts);
    doc.end();
    const buffer = await promise;
    console.log(`[PDF Service] PDF generated successfully, size: ${buffer.length} bytes`);
    return buffer;
  }

  async generatePaymentConfirmationPDF(data: PaymentConfirmationData): Promise<Buffer> {
    await this.refreshRestaurantData();
    console.log(`[PDF Service] Generating payment confirmation PDF for deposit ${data.depositId}`);
    const { doc, promise } = this.createDocAndCollect(
      this.defaultA4Options(`Potwierdzenie wpłaty ${data.depositId}`, 'Potwierdzenie wpłaty zaliczki'),
    );
    buildPaymentConfirmationPremium(doc, data, this.getDrawContext(), this.useCustomFonts);
    doc.end();
    const buffer = await promise;
    console.log(`[PDF Service] Payment confirmation PDF generated, size: ${buffer.length} bytes`);
    return buffer;
  }

  async generateMenuCardPDF(data: MenuCardPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    console.log(`[PDF Service] Generating menu card PDF: ${data.templateName}`);
    const { doc, promise } = this.createDocAndCollect({
      ...this.defaultA4Options(`Karta Menu - ${data.templateName}`, 'Karta menu'),
      bufferPages: true,
    });
    buildMenuCardPremium(doc, data, this.getDrawContext(), this.useCustomFonts);
    doc.end();
    const buffer = await promise;
    console.log(`[PDF Service] Menu card PDF generated, size: ${buffer.length} bytes`);
    return buffer;
  }

  /**
   * Generate premium revenue report PDF.
   * Migrated from reports-export.service.ts (Zadanie 4).
   */
  async generateRevenueReportPDF(data: RevenueReportPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    console.log('[PDF Service] Generating revenue report PDF');
    const { doc, promise } = this.createDocAndCollect(
      this.defaultA4Options('Raport Przychodów', 'Raport przychodów'),
    );
    buildRevenueReportPDF(doc, data, this.getDrawContext(), this.useCustomFonts);
    doc.end();
    const buffer = await promise;
    console.log(`[PDF Service] Revenue report PDF generated, size: ${buffer.length} bytes`);
    return buffer;
  }

  /**
   * Generate premium occupancy report PDF.
   * Migrated from reports-export.service.ts (Zadanie 4).
   */
  async generateOccupancyReportPDF(data: OccupancyReportPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    console.log('[PDF Service] Generating occupancy report PDF');
    const { doc, promise } = this.createDocAndCollect(
      this.defaultA4Options('Raport Zajętości', 'Raport zajętości sal'),
    );
    buildOccupancyReportPDF(doc, data, this.getDrawContext(), this.useCustomFonts);
    doc.end();
    const buffer = await promise;
    console.log(`[PDF Service] Occupancy report PDF generated, size: ${buffer.length} bytes`);
    return buffer;
  }

  // ═══════════════ CATERING PDF GENERATION ═══════════════

  async generateCateringOrderPDF(data: CateringOrderPDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    const { doc, promise } = this.createDocAndCollect(
      this.defaultA4Options(`Zamówienie ${data.orderNumber}`),
    );
    buildCateringOrderPDF(doc, data, this.getDrawContext(), this.useCustomFonts);
    doc.end();
    return promise;
  }

  async generateCateringQuotePDF(data: CateringQuotePDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    const { doc, promise } = this.createDocAndCollect(
      this.defaultA4Options(`Wycena ${data.orderNumber}`),
    );
    await buildCateringQuotePDF(doc, data, this.getDrawContext(), this.useCustomFonts);
    doc.end();
    return promise;
  }

  async generateCateringKitchenPDF(data: CateringKitchenPrintData): Promise<Buffer> {
    await this.refreshRestaurantData();
    const { doc, promise } = this.createDocAndCollect(
      this.defaultA4Options(`Druk kuchenny ${data.orderNumber}`),
    );
    buildCateringKitchenPDF(doc, data, this.getDrawContext(), this.useCustomFonts);
    doc.end();
    return promise;
  }

  async generateCateringInvoicePDF(data: CateringInvoicePDFData): Promise<Buffer> {
    await this.refreshRestaurantData();
    const { doc, promise } = this.createDocAndCollect(
      this.defaultA4Options(`Faktura ${data.orderNumber}`),
    );
    buildCateringInvoicePDF(doc, data, this.getDrawContext(), this.useCustomFonts);
    doc.end();
    return promise;
  }
}

export const pdfService = new PDFService();
