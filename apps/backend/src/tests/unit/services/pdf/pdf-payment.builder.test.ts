/**
 * Unit tests for pdf-payment.builder.ts
 * Covers: buildPaymentConfirmationPremium
 * Issue: #444
 */

import type { PdfDrawContext } from '@services/pdf/pdf.primitives';
import type { PaymentConfirmationData } from '@services/pdf/pdf.types';

// ─── Mock pdf.utils ──────────────────────────────────────────────────────────

jest.mock('@services/pdf/pdf.utils', () => ({
  formatDate: jest.fn((d: any) => '01.01.2026'),
  formatCurrency: jest.fn((n: number) => `${n},00 zł`),
  getRegularFont: jest.fn((custom: boolean) => (custom ? 'DejaVu' : 'Helvetica')),
  getBoldFont: jest.fn((custom: boolean) => (custom ? 'DejaVu-Bold' : 'Helvetica-Bold')),
}));

// ─── Mock pdf.primitives ─────────────────────────────────────────────────────

const mockDrawHeaderBanner = jest.fn();
const mockDrawInfoBox = jest.fn();
const mockCalculateInfoBoxHeight = jest.fn().mockReturnValue(80);
const mockDrawSeparator = jest.fn();
const mockDrawInlineFooter = jest.fn();

jest.mock('@services/pdf/pdf.primitives', () => ({
  drawHeaderBanner: (...args: any[]) => mockDrawHeaderBanner(...args),
  drawInfoBox: (...args: any[]) => mockDrawInfoBox(...args),
  calculateInfoBoxHeight: (...args: any[]) => mockCalculateInfoBoxHeight(...args),
  drawSeparator: (...args: any[]) => mockDrawSeparator(...args),
  drawInlineFooter: (...args: any[]) => mockDrawInlineFooter(...args),
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
  return {
    COLORS,
    PAYMENT_METHOD_LABELS: {
      TRANSFER: 'Przelew bankowy',
      CASH: 'Gotówka',
      BLIK: 'BLIK',
      CARD: 'Karta płatnicza',
    },
  };
});

import { buildPaymentConfirmationPremium } from '@services/pdf/pdf-payment.builder';

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

function createFullPaymentData(): PaymentConfirmationData {
  return {
    depositId: 'dep-001',
    amount: 500,
    paidAt: new Date('2026-05-01T12:00:00'),
    paymentMethod: 'TRANSFER',
    paymentReference: 'REF-12345',
    client: {
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@test.pl',
      phone: '+48 111 222 333',
      address: 'ul. Kwiatowa 5, Krakow',
    },
    reservation: {
      id: 'res-001',
      date: '2026-06-15',
      startTime: '16:00',
      endTime: '02:00',
      hall: 'Sala Bankietowa',
      eventType: 'Wesele',
      guests: 95,
      totalPrice: 25000,
    },
  };
}

function createMinimalPaymentData(): PaymentConfirmationData {
  return {
    depositId: 'dep-002',
    amount: 300,
    paidAt: new Date('2026-05-15'),
    paymentMethod: 'CASH',
    client: {
      firstName: 'Anna',
      lastName: 'Nowak',
      phone: '+48 999 888 777',
    },
    reservation: {
      id: 'res-002',
      date: '2026-07-01',
      startTime: '18:00',
      endTime: '23:00',
      guests: 20,
      totalPrice: 4000,
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildPaymentConfirmationPremium', () => {
  let doc: any;
  let ctx: PdfDrawContext;

  beforeEach(() => {
    jest.clearAllMocks();
    doc = createMockDoc();
    ctx = createMockCtx();
  });

  it('generates PDF with full data without throwing', () => {
    const data = createFullPaymentData();
    expect(() => buildPaymentConfirmationPremium(doc, data, ctx, false)).not.toThrow();
  });

  it('generates PDF with minimal data gracefully', () => {
    const data = createMinimalPaymentData();
    expect(() => buildPaymentConfirmationPremium(doc, data, ctx, false)).not.toThrow();
  });

  it('calls text() with Polish content (PLN formatting)', () => {
    const data = createFullPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('POTWIERDZENIE WPŁATY ZALICZKI'),
    ]));
  });

  it('draws header banner with OPŁACONA status', () => {
    const data = createFullPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    expect(mockDrawHeaderBanner).toHaveBeenCalledWith(
      doc, ctx, 'OPŁACONA', '#27ae60',
    );
  });

  it('renders client info box', () => {
    const data = createFullPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'KLIENT',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining(['Jan Kowalski']),
    );
  });

  it('renders payment details info box', () => {
    const data = createFullPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'SZCZEGÓŁY WPŁATY',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining([
        expect.stringContaining('500,00 zł'),
      ]),
    );
  });

  it('renders reservation info box', () => {
    const data = createFullPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'REZERWACJA',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining([
        expect.stringContaining('16:00 - 02:00'),
      ]),
    );
  });

  it('includes payment reference when provided', () => {
    const data = createFullPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'SZCZEGÓŁY WPŁATY',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining([
        expect.stringContaining('Ref: REF-12345'),
      ]),
    );
  });

  it('omits payment reference when not provided', () => {
    const data = createMinimalPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    const paymentBoxCalls = mockDrawInfoBox.mock.calls.filter(
      (c: any[]) => c[2] === 'SZCZEGÓŁY WPŁATY',
    );
    expect(paymentBoxCalls.length).toBe(1);
    const lines = paymentBoxCalls[0][6] as string[];
    expect(lines.some((l: string) => l.includes('Ref:'))).toBe(false);
  });

  it('includes event type in reservation box when provided', () => {
    const data = createFullPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'REZERWACJA',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining([
        expect.stringContaining('Typ: Wesele'),
      ]),
    );
  });

  it('calls drawInlineFooter', () => {
    const data = createFullPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    expect(mockDrawInlineFooter).toHaveBeenCalledWith(
      doc, ctx, expect.any(Number), expect.any(Number),
    );
  });

  it('calls drawSeparator for visual sections', () => {
    const data = createFullPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, false);

    expect(mockDrawSeparator).toHaveBeenCalled();
  });

  it('uses custom fonts when useCustomFonts is true', () => {
    const data = createMinimalPaymentData();
    buildPaymentConfirmationPremium(doc, data, ctx, true);

    expect(doc.font).toHaveBeenCalledWith('DejaVu-Bold');
  });
});
