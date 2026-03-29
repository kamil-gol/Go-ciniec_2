/**
 * Unit tests for pdf-occupancy.builder.ts
 * Covers: buildOccupancyReportPDF
 * Issue: #444
 */

import type { PdfDrawContext } from '@services/pdf/pdf.primitives';
import type { OccupancyReportPDFData } from '@services/pdf/pdf.types';

// ─── Mock pdf.utils ──────────────────────────────────────────────────────────

jest.mock('@services/pdf/pdf.utils', () => ({
  formatDate: jest.fn((d: any) => '01.01.2026'),
  translateDayOfWeek: jest.fn((day: string) => {
    const map: Record<string, string> = {
      Monday: 'Poniedziałek',
      Tuesday: 'Wtorek',
      Wednesday: 'Środa',
      Saturday: 'Sobota',
    };
    return map[day] || day;
  }),
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

import { buildOccupancyReportPDF } from '@services/pdf/pdf-occupancy.builder';

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

function createFullOccupancyData(): OccupancyReportPDFData {
  return {
    filters: { dateFrom: '2026-01-01', dateTo: '2026-03-31' },
    summary: {
      avgOccupancy: 72,
      peakDay: 'Saturday',
      peakHall: 'Sala Bankietowa',
      totalReservations: 45,
      totalDaysInPeriod: 90,
    },
    halls: [
      { hallName: 'Sala Bankietowa', occupancy: 85, reservations: 30, avgGuestsPerReservation: 80 },
      { hallName: 'Sala VIP', occupancy: 60, reservations: 15, avgGuestsPerReservation: 25 },
    ],
    peakHours: [
      { hour: 18, count: 20 },
      { hour: 19, count: 15 },
      { hour: 16, count: 10 },
    ],
    peakDaysOfWeek: [
      { dayOfWeek: 'Saturday', count: 18 },
      { dayOfWeek: 'Wednesday', count: 12 },
      { dayOfWeek: 'Monday', count: 8 },
    ],
  };
}

function createMinimalOccupancyData(): OccupancyReportPDFData {
  return {
    filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
    summary: {
      avgOccupancy: 0,
      peakDay: 'Monday',
      totalReservations: 0,
      totalDaysInPeriod: 31,
    },
    halls: [],
    peakHours: [],
    peakDaysOfWeek: [],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildOccupancyReportPDF', () => {
  let doc: any;
  let ctx: PdfDrawContext;

  beforeEach(() => {
    jest.clearAllMocks();
    doc = createMockDoc();
    ctx = createMockCtx();
  });

  it('generates PDF with full data without throwing', () => {
    const data = createFullOccupancyData();
    expect(() => buildOccupancyReportPDF(doc, data, ctx, false)).not.toThrow();
  });

  it('generates PDF with minimal/empty data gracefully', () => {
    const data = createMinimalOccupancyData();
    expect(() => buildOccupancyReportPDF(doc, data, ctx, false)).not.toThrow();
  });

  it('calls text() with Polish content', () => {
    const data = createFullOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('RAPORT ZAJĘTOŚCI'),
    ]));
  });

  it('draws header banner with RAPORT badge', () => {
    const data = createFullOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawHeaderBanner).toHaveBeenCalledWith(
      doc, ctx, 'RAPORT', '#3498db',
    );
  });

  it('renders summary info box with occupancy stats', () => {
    const data = createFullOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'PODSUMOWANIE',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining([
        expect.stringContaining('72%'),
        expect.stringContaining('Sobota'),
        expect.stringContaining('45'),
      ]),
    );
  });

  it('renders halls ranking table', () => {
    const data = createFullOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).toHaveBeenCalledWith(
      doc, ctx, 'ZAJĘTOŚĆ SAL', expect.any(Number), expect.any(Number),
    );

    expect(mockDrawCompactTable).toHaveBeenCalledWith(
      doc, ctx,
      ['Sala', 'Zajętość %', 'Rezerwacje', 'Śr. gości'],
      expect.arrayContaining([
        expect.arrayContaining(['Sala Bankietowa', '85%']),
      ]),
      expect.any(Array),
      expect.any(Number),
    );
  });

  it('renders peak hours table', () => {
    const data = createFullOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).toHaveBeenCalledWith(
      doc, ctx, 'NAJPOPULARNIEJSZE GODZINY', expect.any(Number), expect.any(Number),
    );

    expect(mockDrawCompactTable).toHaveBeenCalledWith(
      doc, ctx,
      ['Godzina', 'Liczba rezerwacji'],
      expect.arrayContaining([
        expect.arrayContaining(['18:00']),
      ]),
      expect.any(Array),
      expect.any(Number),
    );
  });

  it('renders peak days of week table', () => {
    const data = createFullOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).toHaveBeenCalledWith(
      doc, ctx, 'NAJPOPULARNIEJSZE DNI TYGODNIA', expect.any(Number), expect.any(Number),
    );

    expect(mockDrawCompactTable).toHaveBeenCalledWith(
      doc, ctx,
      ['Dzień tygodnia', 'Liczba rezerwacji'],
      expect.arrayContaining([
        expect.arrayContaining(['Sobota']),
      ]),
      expect.any(Array),
      expect.any(Number),
    );
  });

  it('skips halls section when no halls data', () => {
    const data = createMinimalOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).not.toHaveBeenCalledWith(
      doc, ctx, 'ZAJĘTOŚĆ SAL', expect.any(Number), expect.any(Number),
    );
  });

  it('skips peak hours section when no data', () => {
    const data = createMinimalOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).not.toHaveBeenCalledWith(
      doc, ctx, 'NAJPOPULARNIEJSZE GODZINY', expect.any(Number), expect.any(Number),
    );
  });

  it('skips peak days section when no data', () => {
    const data = createMinimalOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).not.toHaveBeenCalledWith(
      doc, ctx, 'NAJPOPULARNIEJSZE DNI TYGODNIA', expect.any(Number), expect.any(Number),
    );
  });

  it('calls drawInlineFooter', () => {
    const data = createFullOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawInlineFooter).toHaveBeenCalledWith(
      doc, ctx, expect.any(Number), expect.any(Number),
    );
  });

  it('renders period info in subtitle', () => {
    const data = createFullOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('2026-01-01'),
    ]));
  });

  it('handles peakHall as undefined (Brak danych)', () => {
    const data = createMinimalOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'PODSUMOWANIE',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining([
        expect.stringContaining('Brak danych'),
      ]),
    );
  });

  it('uses custom fonts when useCustomFonts is true', () => {
    const data = createMinimalOccupancyData();
    buildOccupancyReportPDF(doc, data, ctx, true);

    expect(doc.font).toHaveBeenCalledWith('DejaVu-Bold');
  });
});
