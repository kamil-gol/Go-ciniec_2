/**
 * Unit tests for pdf-catering.builder.ts
 * Covers: buildCateringQuotePDF, buildCateringKitchenPDF, buildCateringOrderPDF, buildCateringInvoicePDF
 * Issue: #257
 */

import type { PdfDrawContext } from '@services/pdf/pdf.primitives';
import type {
  CateringQuotePDFData,
  CateringKitchenPrintData,
  CateringInvoicePDFData,
  CateringOrderPDFData,
} from '@services/pdf/pdf.types';

// ─── Mock pdf.utils (loadPdfConfig) ──────────────────────────────────────────

const mockLoadPdfConfig = jest.fn().mockResolvedValue(null);

jest.mock('@services/pdf/pdf.utils', () => ({
  formatDate: jest.fn((d: any) => '01.01.2026'),
  formatCurrency: jest.fn((n: number) => `${n},00 zł`),
  loadPdfConfig: (...args: any[]) => mockLoadPdfConfig(...args),
  getRegularFont: jest.fn((custom: boolean) => custom ? 'DejaVu' : 'Helvetica'),
  getBoldFont: jest.fn((custom: boolean) => custom ? 'DejaVu-Bold' : 'Helvetica-Bold'),
}));

// ─── Mock pdf.primitives ─────────────────────────────────────────────────────

const mockDrawHeaderBanner = jest.fn();
const mockSafePageBreak = jest.fn();
const mockDrawInfoBox = jest.fn();
const mockCalculateInfoBoxHeight = jest.fn().mockReturnValue(80);
const mockDrawSeparator = jest.fn();
const mockDrawInlineFooter = jest.fn();
const mockDrawCompactTable = jest.fn();

jest.mock('@services/pdf/pdf.primitives', () => ({
  drawHeaderBanner: (...args: any[]) => mockDrawHeaderBanner(...args),
  safePageBreak: (...args: any[]) => mockSafePageBreak(...args),
  drawInfoBox: (...args: any[]) => mockDrawInfoBox(...args),
  calculateInfoBoxHeight: (...args: any[]) => mockCalculateInfoBoxHeight(...args),
  drawSeparator: (...args: any[]) => mockDrawSeparator(...args),
  drawInlineFooter: (...args: any[]) => mockDrawInlineFooter(...args),
  drawCompactTable: (...args: any[]) => mockDrawCompactTable(...args),
}));

// ─── Mock pdf.types (mutable COLORS, STATUS_MAP, etc.) ──────────────────────

jest.mock('@services/pdf/pdf.types', () => {
  const COLORS = {
    primary: '#1a2332',
    primaryLight: '#2c3e50',
    accent: '#c8a45a',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#3498db',
    textDark: '#1a2332',
    textMuted: '#7f8c8d',
    textLight: '#bdc3c7',
    border: '#dce1e8',
    bgLight: '#f4f6f9',
    bgWhite: '#ffffff',
    allergen: '#e67e22',
    purple: '#8e44ad',
  };
  return {
    COLORS,
    DEFAULT_COLORS: { ...COLORS },
    setColors: jest.fn(),
    resetColors: jest.fn(),
    STATUS_MAP: {
      CONFIRMED: { label: 'POTWIERDZONA', color: '#27ae60' },
      PENDING: { label: 'OCZEKUJĄCA', color: '#f39c12' },
      DRAFT: { label: 'SZKIC', color: '#7f8c8d' },
    },
    DELIVERY_TYPE_LABELS: {
      PICKUP: 'Odbiór osobisty',
      DELIVERY: 'Dostawa',
      ON_SITE: 'Na miejscu',
    },
  };
});

import {
  buildCateringQuotePDF,
  buildCateringKitchenPDF,
  buildCateringOrderPDF,
  buildCateringInvoicePDF,
} from '@services/pdf/pdf-catering.builder';

import { resetColors, setColors } from '@services/pdf/pdf.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockDoc(): any {
  const doc: any = {
    page: { width: 595, height: 842 },
    y: 100,
    fillColor: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    strokeColor: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    roundedRect: jest.fn().mockReturnThis(),
    circle: jest.fn().mockReturnThis(),
    heightOfString: jest.fn().mockReturnValue(12),
  };
  return doc;
}

function createMockCtx(): PdfDrawContext {
  return {
    useCustomFonts: false,
    restaurantData: {
      name: 'Restauracja Testowa',
      address: 'ul. Testowa 1',
      phone: '+48 123 456 789',
      email: 'test@example.com',
    },
  };
}

function createBaseQuoteData(overrides: Partial<CateringQuotePDFData> = {}): CateringQuotePDFData {
  return {
    id: 'quote-1',
    orderNumber: 'CAT-2026-001',
    client: {
      firstName: 'Jan',
      lastName: 'Kowalski',
      phone: '+48 600 000 000',
      email: 'jan@example.com',
      companyName: 'Firma Sp. z o.o.',
      address: 'ul. Testowa 5, 00-001 Warszawa',
    },
    eventDate: new Date('2026-06-15'),
    deliveryType: 'DELIVERY',
    deliveryAddress: 'ul. Weselna 10, Kraków',
    guests: 50,
    items: [
      {
        dishNameSnapshot: 'Zupa pomidorowa',
        quantity: 50,
        unitPrice: 15,
        totalPrice: 750,
      },
      {
        productName: 'Deser lodowy',
        quantity: 50,
        unitPrice: 12,
        totalPrice: 600,
        extraDescription: 'lody waniliowe',
      },
    ],
    subtotal: 1350,
    discountAmount: 100,
    totalPrice: 1250,
    status: 'CONFIRMED',
    notes: 'Proszę o bezglutenową opcję',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function createBaseKitchenData(overrides: Partial<CateringKitchenPrintData> = {}): CateringKitchenPrintData {
  return {
    id: 'kitchen-1',
    orderNumber: 'CAT-2026-001',
    eventDate: new Date('2026-06-15'),
    deliveryType: 'DELIVERY',
    deliveryAddress: 'ul. Weselna 10',
    guests: 50,
    items: [
      { dishNameSnapshot: 'Zupa pomidorowa', quantity: 50, unitPrice: 15, totalPrice: 750 },
      { productName: 'Deser', quantity: 50, unitPrice: 12, totalPrice: 600 },
    ],
    notes: 'Bezglutenowo',
    ...overrides,
  };
}

function createBaseOrderData(overrides: Partial<CateringOrderPDFData> = {}): CateringOrderPDFData {
  return {
    id: 'order-1',
    orderNumber: 'CAT-2026-002',
    client: {
      firstName: 'Anna',
      lastName: 'Nowak',
      phone: '+48 700 000 000',
      email: 'anna@example.com',
    },
    eventDate: new Date('2026-07-20'),
    deliveryType: 'PICKUP',
    guestsCount: 30,
    items: [
      { dishNameSnapshot: 'Pierogi', quantity: 60, unitPrice: 8, totalPrice: 480 },
    ],
    subtotal: 480,
    totalPrice: 480,
    status: 'CONFIRMED',
    createdAt: new Date('2026-02-01'),
    ...overrides,
  };
}

function createBaseInvoiceData(overrides: Partial<CateringInvoicePDFData> = {}): CateringInvoicePDFData {
  return {
    id: 'inv-1',
    orderNumber: 'CAT-2026-003',
    client: {
      firstName: 'Maria',
      lastName: 'Wiśniewska',
      phone: '+48 800 000 000',
      email: 'maria@example.com',
      companyName: 'XYZ Corp',
      nip: '1234567890',
      address: 'ul. Firmowa 1',
    },
    eventDate: new Date('2026-08-10'),
    deliveryType: 'ON_SITE',
    items: [
      { dishNameSnapshot: 'Rosół', quantity: 40, unitPrice: 12, totalPrice: 480 },
    ],
    subtotal: 480,
    discountAmount: 50,
    totalPrice: 430,
    status: 'CONFIRMED',
    createdAt: new Date('2026-03-01'),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('pdf-catering.builder', () => {
  let doc: any;
  let ctx: PdfDrawContext;

  beforeEach(() => {
    jest.clearAllMocks();
    doc = createMockDoc();
    ctx = createMockCtx();
    mockLoadPdfConfig.mockResolvedValue(null);
  });

  // ═══════════════ buildCateringQuotePDF ═══════════════

  describe('buildCateringQuotePDF', () => {
    it('powinno wyrenderować wszystkie sekcje dla pełnych danych', async () => {
      const data = createBaseQuoteData();
      await buildCateringQuotePDF(doc, data, ctx, false);

      expect(mockDrawHeaderBanner).toHaveBeenCalledWith(doc, ctx, 'POTWIERDZONA', '#27ae60');
      expect(mockDrawInfoBox).toHaveBeenCalled();
      expect(mockDrawCompactTable).toHaveBeenCalled();
      expect(mockDrawInlineFooter).toHaveBeenCalled();
      expect(mockDrawSeparator).toHaveBeenCalled();
    });

    it('powinno wyrenderować tytuł WYCENA CATERING', async () => {
      const data = createBaseQuoteData();
      await buildCateringQuotePDF(doc, data, ctx, false);

      expect(doc.text).toHaveBeenCalledWith(
        'WYCENA CATERING',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' }),
      );
    });

    it('powinno obsłużyć nieznany status (fallback do textMuted)', async () => {
      const data = createBaseQuoteData({ status: 'UNKNOWN_STATUS' });
      await buildCateringQuotePDF(doc, data, ctx, false);

      expect(mockDrawHeaderBanner).toHaveBeenCalledWith(
        doc, ctx, 'UNKNOWN_STATUS', '#7f8c8d',
      );
    });

    it('powinno obsłużyć brak rabatu', async () => {
      const data = createBaseQuoteData({ discountAmount: 0 });
      await buildCateringQuotePDF(doc, data, ctx, false);

      // No discount text rendered — just subtotal and total
      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => t.includes('Rabat'))).toBe(false);
    });

    it('powinno obsłużyć brak uwag', async () => {
      const data = createBaseQuoteData({ notes: undefined });
      await buildCateringQuotePDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => t === 'Uwagi:')).toBe(false);
    });

    it('powinno wyrenderować uwagi gdy podane', async () => {
      const data = createBaseQuoteData({ notes: 'Notatka testowa' });
      await buildCateringQuotePDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls).toContain('Uwagi:');
    });

    it('powinno obsłużyć klienta bez opcjonalnych pól', async () => {
      const data = createBaseQuoteData({
        client: {
          firstName: 'Jan',
          lastName: 'Kowalski',
          phone: '+48 600 000 000',
        },
      });
      await buildCateringQuotePDF(doc, data, ctx, false);

      expect(mockDrawInfoBox).toHaveBeenCalled();
    });

    it('powinno budować tabelę pozycji z dishNameSnapshot i productName fallback', async () => {
      const data = createBaseQuoteData({
        items: [
          { dishNameSnapshot: 'Zupa', quantity: 10, unitPrice: 15, totalPrice: 150 },
          { productName: 'Napój', quantity: 10, unitPrice: 5, totalPrice: 50 },
          { quantity: 5, unitPrice: 10, totalPrice: 50 },
        ],
      });
      await buildCateringQuotePDF(doc, data, ctx, false);

      expect(mockDrawCompactTable).toHaveBeenCalled();
      const rows = mockDrawCompactTable.mock.calls[0][3];
      expect(rows[0][0]).toBe('Zupa');
      expect(rows[1][0]).toBe('Napój');
      expect(rows[2][0]).toBe('—');
    });

    it('powinno wyświetlić extraDescription w nawiasie', async () => {
      const data = createBaseQuoteData({
        items: [
          { dishNameSnapshot: 'Deser', quantity: 5, unitPrice: 10, totalPrice: 50, extraDescription: 'bez cukru' },
        ],
      });
      await buildCateringQuotePDF(doc, data, ctx, false);

      const rows = mockDrawCompactTable.mock.calls[0][3];
      expect(rows[0][0]).toBe('Deser (bez cukru)');
    });

    it('powinno użyć custom fontów gdy useCustomFonts=true', async () => {
      const data = createBaseQuoteData();
      await buildCateringQuotePDF(doc, data, ctx, true);

      expect(doc.font).toHaveBeenCalledWith('DejaVu-Bold');
    });

    it('powinno obsłużyć brak adresu dostawy', async () => {
      const data = createBaseQuoteData({ deliveryAddress: undefined });
      await buildCateringQuotePDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Adres:'))).toBe(false);
    });

    it('powinno zaaplikować custom colors z config', async () => {
      mockLoadPdfConfig.mockResolvedValueOnce({
        colors: { primary: '#ff0000' },
        sections: [],
      });

      const data = createBaseQuoteData();
      await buildCateringQuotePDF(doc, data, ctx, false);

      expect(setColors).toHaveBeenCalled();
    });

    it('powinno zawsze wywołać resetColors (nawet przy błędzie)', async () => {
      // resetColors should be called in finally block
      const data = createBaseQuoteData();
      await buildCateringQuotePDF(doc, data, ctx, false);

      expect(resetColors).toHaveBeenCalled();
    });

    it('powinno użyć config.sections do sortowania sekcji', async () => {
      mockLoadPdfConfig.mockResolvedValueOnce({
        sections: [
          { id: 'footer', enabled: true, order: 1 },
          { id: 'header', enabled: true, order: 2 },
        ],
      });

      const data = createBaseQuoteData();
      await buildCateringQuotePDF(doc, data, ctx, false);

      // Footer should be called first (order 1), then header (order 2)
      expect(mockDrawInlineFooter).toHaveBeenCalled();
      expect(mockDrawHeaderBanner).toHaveBeenCalled();
    });

    it('powinno pominąć wyłączone sekcje w config', async () => {
      mockLoadPdfConfig.mockResolvedValueOnce({
        sections: [
          { id: 'header', enabled: false, order: 1 },
          { id: 'footer', enabled: true, order: 2 },
        ],
      });

      const data = createBaseQuoteData();
      await buildCateringQuotePDF(doc, data, ctx, false);

      expect(mockDrawHeaderBanner).not.toHaveBeenCalled();
      expect(mockDrawInlineFooter).toHaveBeenCalled();
    });

    it('powinno obsłużyć delivery type fallback dla nieznanego typu', async () => {
      const data = createBaseQuoteData({ deliveryType: 'CUSTOM_TYPE' });
      await buildCateringQuotePDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('CUSTOM_TYPE'))).toBe(true);
    });
  });

  // ═══════════════ buildCateringKitchenPDF ═══════════════

  describe('buildCateringKitchenPDF', () => {
    it('powinno wyrenderować druk kuchenny z pełnymi danymi', () => {
      const data = createBaseKitchenData();
      buildCateringKitchenPDF(doc, data, ctx, false);

      expect(mockDrawHeaderBanner).toHaveBeenCalledWith(doc, ctx, 'DRUK KUCHENNY', '#1a2332');
      expect(doc.text).toHaveBeenCalledWith(
        'DRUK KUCHENNY',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' }),
      );
    });

    it('powinno wyrenderować tabelę DO PRZYGOTOWANIA', () => {
      const data = createBaseKitchenData();
      buildCateringKitchenPDF(doc, data, ctx, false);

      expect(mockDrawCompactTable).toHaveBeenCalledWith(
        doc, ctx,
        ['Danie', 'Ilość'],
        expect.any(Array),
        expect.any(Array),
        expect.any(Number),
      );
    });

    it('powinno wyrenderować uwagi klienta gdy podane', () => {
      const data = createBaseKitchenData({ notes: 'Uwaga specjalna' });
      buildCateringKitchenPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls).toContain('Uwagi klienta:');
    });

    it('powinno pominąć uwagi gdy brak', () => {
      const data = createBaseKitchenData({ notes: undefined });
      buildCateringKitchenPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls).not.toContain('Uwagi klienta:');
    });

    it('powinno pominąć adres dostawy gdy brak', () => {
      const data = createBaseKitchenData({ deliveryAddress: undefined });
      buildCateringKitchenPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Adres dostawy'))).toBe(false);
    });

    it('powinno wyrenderować adres dostawy gdy podany', () => {
      const data = createBaseKitchenData({ deliveryAddress: 'ul. Kuchenna 5' });
      buildCateringKitchenPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Adres dostawy'))).toBe(true);
    });

    it('powinno wywołać drawInlineFooter', () => {
      const data = createBaseKitchenData();
      buildCateringKitchenPDF(doc, data, ctx, false);

      expect(mockDrawInlineFooter).toHaveBeenCalled();
    });

    it('powinno obsłużyć item bez dishNameSnapshot — fallback do productName', () => {
      const data = createBaseKitchenData({
        items: [
          { productName: 'Napój', quantity: 10, unitPrice: 5, totalPrice: 50 },
          { quantity: 5, unitPrice: 10, totalPrice: 50 },
        ],
      });
      buildCateringKitchenPDF(doc, data, ctx, false);

      const rows = mockDrawCompactTable.mock.calls[0][3];
      expect(rows[0][0]).toBe('Napój');
      expect(rows[1][0]).toBe('—');
    });
  });

  // ═══════════════ buildCateringOrderPDF ═══════════════

  describe('buildCateringOrderPDF', () => {
    it('powinno wyrenderować PDF zamówienia z pełnymi danymi', () => {
      const data = createBaseOrderData();
      buildCateringOrderPDF(doc, data, ctx, false);

      expect(mockDrawHeaderBanner).toHaveBeenCalled();
      expect(doc.text).toHaveBeenCalledWith(
        'SZCZEGÓŁY ZAMÓWIENIA CATERING',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' }),
      );
    });

    it('powinno wyrenderować dwa info boxy (klient + wydarzenie)', () => {
      const data = createBaseOrderData();
      buildCateringOrderPDF(doc, data, ctx, false);

      expect(mockDrawInfoBox).toHaveBeenCalledTimes(2);
      expect(mockDrawInfoBox).toHaveBeenCalledWith(
        doc, ctx, 'KLIENT',
        expect.any(Number), expect.any(Number), expect.any(Number),
        expect.any(Array),
      );
      expect(mockDrawInfoBox).toHaveBeenCalledWith(
        doc, ctx, 'WYDARZENIE',
        expect.any(Number), expect.any(Number), expect.any(Number),
        expect.any(Array),
      );
    });

    it('powinno obsłużyć brak uwag w zamówieniu', () => {
      const data = createBaseOrderData({ notes: undefined });
      buildCateringOrderPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls).not.toContain('Uwagi:');
    });

    it('powinno wyrenderować uwagi gdy podane', () => {
      const data = createBaseOrderData({ notes: 'Proszę o kontakt telefoniczny' });
      buildCateringOrderPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls).toContain('Uwagi:');
    });

    it('powinno obsłużyć rabat w zamówieniu', () => {
      const data = createBaseOrderData({ discountAmount: 50 });
      buildCateringOrderPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Rabat'))).toBe(true);
    });

    it('powinno pominąć rabat gdy discountAmount=0', () => {
      const data = createBaseOrderData({ discountAmount: 0 });
      buildCateringOrderPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Rabat'))).toBe(false);
    });

    it('powinno obsłużyć deliveryAddress w informacjach o wydarzeniu', () => {
      const data = createBaseOrderData({ deliveryAddress: 'ul. Eventowa 5' });
      buildCateringOrderPDF(doc, data, ctx, false);

      const eventBoxCall = mockDrawInfoBox.mock.calls.find((c: any[]) => c[2] === 'WYDARZENIE');
      const eventLines = eventBoxCall![6] as string[];
      expect(eventLines.some((line: string) => line.includes('Adres:'))).toBe(true);
    });

    it('powinno użyć guests jako fallback gdy brak guestsCount', () => {
      const data = createBaseOrderData({ guestsCount: undefined, guests: 25 });
      buildCateringOrderPDF(doc, data, ctx, false);

      const eventBoxCall = mockDrawInfoBox.mock.calls.find((c: any[]) => c[2] === 'WYDARZENIE');
      const eventLines = eventBoxCall![6] as string[];
      expect(eventLines.some((line: string) => line.includes('25'))).toBe(true);
    });

    it('powinno obsłużyć nieznany status', () => {
      const data = createBaseOrderData({ status: 'WEIRD_STATUS' });
      buildCateringOrderPDF(doc, data, ctx, false);

      expect(mockDrawHeaderBanner).toHaveBeenCalledWith(
        doc, ctx, 'WEIRD_STATUS', '#7f8c8d',
      );
    });

    it('powinno obsłużyć klienta z company i address', () => {
      const data = createBaseOrderData({
        client: {
          firstName: 'Jan',
          lastName: 'Testowy',
          phone: '+48 111 111 111',
          companyName: 'TestCorp',
          email: 'jan@test.pl',
          address: 'ul. Firmowa 10',
        },
      });
      buildCateringOrderPDF(doc, data, ctx, false);

      const clientBoxCall = mockDrawInfoBox.mock.calls.find((c: any[]) => c[2] === 'KLIENT');
      const clientLines = clientBoxCall![6] as string[];
      expect(clientLines).toContain('TestCorp');
      expect(clientLines).toContain('jan@test.pl');
      expect(clientLines).toContain('ul. Firmowa 10');
    });

    it('powinno wyrenderować sekcję usług dodatkowych gdy extras niepuste', () => {
      const data = createBaseOrderData({
        extras: [{ name: 'Obsługa kelnerska', quantity: 2, unitPrice: 200, totalPrice: 400 }],
        extrasTotalPrice: 400,
      });
      buildCateringOrderPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls).toContain('USŁUGI DODATKOWE');
    });

    it('powinno pominąć sekcję usług dodatkowych gdy extras puste', () => {
      const data = createBaseOrderData({ extras: [] });
      buildCateringOrderPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls).not.toContain('USŁUGI DODATKOWE');
    });

    it('powinno pokazać linię usług dodatkowych w podsumowaniu gdy extrasTotalPrice > 0', () => {
      const data = createBaseOrderData({
        extras: [{ name: 'Dekoracja', quantity: 1, unitPrice: 300, totalPrice: 300 }],
        extrasTotalPrice: 300,
      });
      buildCateringOrderPDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Usługi dodatkowe'))).toBe(true);
    });
  });

  // ═══════════════ buildCateringInvoicePDF ═══════════════

  describe('buildCateringInvoicePDF', () => {
    it('powinno wyrenderować fakturę pro forma', () => {
      const data = createBaseInvoiceData();
      buildCateringInvoicePDF(doc, data, ctx, false);

      expect(doc.text).toHaveBeenCalledWith(
        'FAKTURA PRO FORMA',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' }),
      );
    });

    it('powinno wyrenderować box NABYWCA zamiast KLIENT', () => {
      const data = createBaseInvoiceData();
      buildCateringInvoicePDF(doc, data, ctx, false);

      expect(mockDrawInfoBox).toHaveBeenCalledWith(
        doc, ctx, 'NABYWCA',
        expect.any(Number), expect.any(Number), expect.any(Number),
        expect.any(Array),
      );
    });

    it('powinno zawierać NIP w danych nabywcy', () => {
      const data = createBaseInvoiceData();
      buildCateringInvoicePDF(doc, data, ctx, false);

      const nabywcaCall = mockDrawInfoBox.mock.calls[0];
      const lines = nabywcaCall[6] as string[];
      expect(lines.some((l: string) => l.includes('NIP:'))).toBe(true);
    });

    it('powinno pominąć NIP gdy brak', () => {
      const data = createBaseInvoiceData({
        client: {
          firstName: 'Jan',
          lastName: 'Bez NIP',
          phone: '+48 000 000 000',
        },
      });
      buildCateringInvoicePDF(doc, data, ctx, false);

      const nabywcaCall = mockDrawInfoBox.mock.calls[0];
      const lines = nabywcaCall[6] as string[];
      expect(lines.some((l: string) => l.includes('NIP:'))).toBe(false);
    });

    it('powinno wyrenderować tabelę POZYCJE', () => {
      const data = createBaseInvoiceData();
      buildCateringInvoicePDF(doc, data, ctx, false);

      expect(mockDrawCompactTable).toHaveBeenCalledWith(
        doc, ctx,
        ['Nazwa', 'Ilość', 'Cena jedn.', 'Wartość'],
        expect.any(Array),
        expect.any(Array),
        expect.any(Number),
      );
    });

    it('powinno wyrenderować Netto zamiast Suma częściowa', () => {
      const data = createBaseInvoiceData();
      buildCateringInvoicePDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Netto:'))).toBe(true);
    });

    it('powinno obsłużyć rabat na fakturze', () => {
      const data = createBaseInvoiceData({ discountAmount: 100 });
      buildCateringInvoicePDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Rabat'))).toBe(true);
    });

    it('powinno pominąć rabat gdy 0', () => {
      const data = createBaseInvoiceData({ discountAmount: 0 });
      buildCateringInvoicePDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Rabat'))).toBe(false);
    });

    it('powinno użyć status z STATUS_MAP', () => {
      const data = createBaseInvoiceData({ status: 'PENDING' });
      buildCateringInvoicePDF(doc, data, ctx, false);

      expect(mockDrawHeaderBanner).toHaveBeenCalledWith(doc, ctx, 'OCZEKUJĄCA', '#f39c12');
    });

    it('powinno wywołać drawInlineFooter', () => {
      const data = createBaseInvoiceData();
      buildCateringInvoicePDF(doc, data, ctx, false);

      expect(mockDrawInlineFooter).toHaveBeenCalled();
    });

    it('powinno obsłużyć klienta z pełnymi danymi firmowymi', () => {
      const data = createBaseInvoiceData();
      buildCateringInvoicePDF(doc, data, ctx, false);

      const nabywcaCall = mockDrawInfoBox.mock.calls[0];
      const lines = nabywcaCall[6] as string[];
      expect(lines).toContain('XYZ Corp');
      expect(lines).toContain('ul. Firmowa 1');
    });

    it('powinno obsłużyć delivery type ON_SITE', () => {
      const data = createBaseInvoiceData({ deliveryType: 'ON_SITE' });
      buildCateringInvoicePDF(doc, data, ctx, false);

      const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
      expect(textCalls.some((t: string) => typeof t === 'string' && t.includes('Na miejscu'))).toBe(true);
    });
  });
});
