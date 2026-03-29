/**
 * Unit tests for pdf-revenue.builder.ts
 * Covers: buildRevenueReportPDF
 * Issue: #444
 */

import type { PdfDrawContext } from '@services/pdf/pdf.primitives';
import type { RevenueReportPDFData } from '@services/pdf/pdf.types';

// ─── Mock pdf.utils ──────────────────────────────────────────────────────────

jest.mock('@services/pdf/pdf.utils', () => ({
  formatDate: jest.fn((d: any) => '01.01.2026'),
  formatCurrency: jest.fn((n: number) => `${n},00 zł`),
  getRegularFont: jest.fn((custom: boolean) => (custom ? 'DejaVu' : 'Helvetica')),
  getBoldFont: jest.fn((custom: boolean) => (custom ? 'DejaVu-Bold' : 'Helvetica-Bold')),
}));

// ─── Mock pdf.primitives ─────────────────────────────────────────────────────

const mockDrawHeaderBanner = jest.fn();
const mockDrawSectionHeader = jest.fn();
const mockSafePageBreak = jest.fn().mockReturnValue(100);
const mockDrawInfoBox = jest.fn();
const mockCalculateInfoBoxHeight = jest.fn().mockReturnValue(80);
const mockDrawSeparator = jest.fn();
const mockDrawInlineFooter = jest.fn();
const mockDrawCompactTable = jest.fn();

jest.mock('@services/pdf/pdf.primitives', () => ({
  drawHeaderBanner: (...args: any[]) => mockDrawHeaderBanner(...args),
  drawSectionHeader: (...args: any[]) => mockDrawSectionHeader(...args),
  safePageBreak: (...args: any[]) => mockSafePageBreak(...args),
  drawInfoBox: (...args: any[]) => mockDrawInfoBox(...args),
  calculateInfoBoxHeight: (...args: any[]) => mockCalculateInfoBoxHeight(...args),
  drawSeparator: (...args: any[]) => mockDrawSeparator(...args),
  drawInlineFooter: (...args: any[]) => mockDrawInlineFooter(...args),
  drawCompactTable: (...args: any[]) => mockDrawCompactTable(...args),
}));

// ─── Mock pdf.types ──────────────────────────────────────────────────────────

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
  return { COLORS };
});

import { buildRevenueReportPDF } from '@services/pdf/pdf-revenue.builder';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockDoc(): any {
  const doc: any = {
    pipe: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    strokeColor: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    roundedRect: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    end: jest.fn(),
    heightOfString: jest.fn().mockReturnValue(10),
    on: jest.fn((event: string, cb: () => void) => {
      if (event === 'end') setTimeout(cb, 0);
      return doc;
    }),
    y: 100,
    page: { width: 595.28, height: 841.89 },
  };
  return doc;
}

function createMockCtx(): PdfDrawContext {
  return {
    useCustomFonts: false,
    restaurantData: {
      name: 'Restauracja Test',
      address: 'ul. Testowa 1, Warszawa',
      phone: '+48 123 456 789',
      email: 'test@restauracja.pl',
    },
  };
}

function createFullRevenueData(): RevenueReportPDFData {
  return {
    filters: { dateFrom: '2026-01-01', dateTo: '2026-03-31', groupBy: 'month' },
    summary: {
      totalRevenue: 250000,
      avgRevenuePerReservation: 5500,
      totalReservations: 45,
      completedReservations: 40,
      pendingRevenue: 25000,
      growthPercent: 15,
      extrasRevenue: 12000,
      categoryExtrasRevenue: 5000,
    },
    breakdown: [
      { period: 'Styczeń 2026', revenue: 80000, count: 15, avgRevenue: 5333 },
      { period: 'Luty 2026', revenue: 85000, count: 16, avgRevenue: 5312 },
      { period: 'Marzec 2026', revenue: 85000, count: 14, avgRevenue: 6071 },
    ],
    byHall: [
      { hallName: 'Sala Bankietowa', revenue: 180000, count: 30, avgRevenue: 6000 },
      { hallName: 'Sala VIP', revenue: 70000, count: 15, avgRevenue: 4666 },
    ],
    byEventType: [
      { eventTypeName: 'Wesele', revenue: 150000, count: 20, avgRevenue: 7500 },
      { eventTypeName: 'Bankiet', revenue: 60000, count: 15, avgRevenue: 4000 },
      { eventTypeName: 'Komunia', revenue: 40000, count: 10, avgRevenue: 4000 },
    ],
    byServiceItem: [
      { name: 'DJ', revenue: 6000, count: 3, avgRevenue: 2000 },
      { name: 'Dekoracje', revenue: 4000, count: 8, avgRevenue: 500 },
      { name: 'Fotograf', revenue: 2000, count: 1, avgRevenue: 2000 },
    ],
    byCategoryExtra: [
      { categoryName: 'Desery', revenue: 3000, count: 10, totalQuantity: 200, avgRevenue: 300 },
      { categoryName: 'Napoje', revenue: 2000, count: 8, totalQuantity: 150, avgRevenue: 250 },
    ],
  };
}

function createMinimalRevenueData(): RevenueReportPDFData {
  return {
    filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
    summary: {
      totalRevenue: 0,
      avgRevenuePerReservation: 0,
      totalReservations: 0,
      completedReservations: 0,
      pendingRevenue: 0,
      growthPercent: 0,
    },
    breakdown: [],
    byHall: [],
    byEventType: [],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildRevenueReportPDF', () => {
  let doc: any;
  let ctx: PdfDrawContext;

  beforeEach(() => {
    jest.clearAllMocks();
    doc = createMockDoc();
    ctx = createMockCtx();
  });

  it('generates PDF with full data without throwing', () => {
    const data = createFullRevenueData();
    expect(() => buildRevenueReportPDF(doc, data, ctx, false)).not.toThrow();
  });

  it('generates PDF with minimal/empty data gracefully', () => {
    const data = createMinimalRevenueData();
    expect(() => buildRevenueReportPDF(doc, data, ctx, false)).not.toThrow();
  });

  it('calls text() with Polish content (PLN formatting)', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('RAPORT PRZYCHODÓW'),
    ]));
  });

  it('draws header banner with RAPORT badge', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    expect(mockDrawHeaderBanner).toHaveBeenCalledWith(
      doc, ctx, 'RAPORT', '#3498db',
    );
  });

  it('renders summary info box with revenue stats', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'PODSUMOWANIE',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining([
        expect.stringContaining('250000,00 zł'),
        expect.stringContaining('45'),
        expect.stringContaining('15%'),
      ]),
    );
  });

  it('includes extras revenue in summary when present', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'PODSUMOWANIE',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining([
        expect.stringContaining('12000,00 zł'),
      ]),
    );
  });

  it('includes category extras revenue in summary when present', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'PODSUMOWANIE',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining([
        expect.stringContaining('5000,00 zł'),
      ]),
    );
  });

  it('renders breakdown by period table', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).toHaveBeenCalledWith(
      doc, ctx, 'ROZKŁAD WG OKRESU', expect.any(Number), expect.any(Number),
    );

    expect(mockDrawCompactTable).toHaveBeenCalledWith(
      doc, ctx,
      ['Okres', 'Przychód', 'Liczba', 'Średnia'],
      expect.arrayContaining([
        expect.arrayContaining(['Styczeń 2026']),
      ]),
      expect.any(Array),
      expect.any(Number),
    );
  });

  it('renders by hall table', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).toHaveBeenCalledWith(
      doc, ctx, 'PRZYCHODY WG SAL', expect.any(Number), expect.any(Number),
    );
  });

  it('renders by event type table', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).toHaveBeenCalledWith(
      doc, ctx, 'PRZYCHODY WG TYPU WYDARZENIA', expect.any(Number), expect.any(Number),
    );
  });

  it('renders service extras revenue section', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('USŁUGI DODATKOWE — PRZYCHODY'),
    ]));
  });

  it('renders category extras revenue section (#216)', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('DODATKOWO PŁATNE PORCJE — PRZYCHODY'),
    ]));
  });

  it('renders extras total row', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Razem extras:'),
    ]));
  });

  it('renders category extras total row', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Razem dodatkowo płatne porcje:'),
    ]));
  });

  it('skips all breakdown sections when data is empty', () => {
    const data = createMinimalRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).not.toHaveBeenCalledWith(
      doc, ctx, 'ROZKŁAD WG OKRESU', expect.any(Number), expect.any(Number),
    );
    expect(mockDrawSectionHeader).not.toHaveBeenCalledWith(
      doc, ctx, 'PRZYCHODY WG SAL', expect.any(Number), expect.any(Number),
    );
    expect(mockDrawSectionHeader).not.toHaveBeenCalledWith(
      doc, ctx, 'PRZYCHODY WG TYPU WYDARZENIA', expect.any(Number), expect.any(Number),
    );
  });

  it('skips service extras section when no byServiceItem', () => {
    const data = createMinimalRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls.every((t: string) =>
      typeof t !== 'string' || !t.includes('USŁUGI DODATKOWE — PRZYCHODY'),
    )).toBe(true);
  });

  it('skips category extras section when no byCategoryExtra', () => {
    const data = createMinimalRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls.every((t: string) =>
      typeof t !== 'string' || !t.includes('DODATKOWO PŁATNE PORCJE'),
    )).toBe(true);
  });

  it('calls drawInlineFooter', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    expect(mockDrawInlineFooter).toHaveBeenCalledWith(
      doc, ctx, expect.any(Number), expect.any(Number),
    );
  });

  it('renders groupBy in subtitle when provided', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Grupowanie: month'),
    ]));
  });

  it('omits groupBy from subtitle when not provided', () => {
    const data = createMinimalRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    const subtitleCalls = textCalls.filter((t: string) =>
      typeof t === 'string' && t.includes('Okres:'),
    );
    expect(subtitleCalls.every((t: string) => !t.includes('Grupowanie:'))).toBe(true);
  });

  it('uses custom fonts when useCustomFonts is true', () => {
    const data = createMinimalRevenueData();
    buildRevenueReportPDF(doc, data, ctx, true);

    expect(doc.font).toHaveBeenCalledWith('DejaVu-Bold');
  });

  it('calls safePageBreak before each data section', () => {
    const data = createFullRevenueData();
    buildRevenueReportPDF(doc, data, ctx, false);

    // breakdown + byHall + byEventType + byServiceItem + byCategoryExtra = 5
    expect(mockSafePageBreak.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
