/**
 * Unit tests for pdf-menu-card.builder.ts
 * Covers: buildMenuCardPremium
 * Issue: #444
 */

import type { PdfDrawContext } from '@services/pdf/pdf.primitives';
import type { MenuCardPDFData } from '@services/pdf/pdf.types';

// ─── Mock pdf.utils ──────────────────────────────────────────────────────────

jest.mock('@services/pdf/pdf.utils', () => ({
  formatDate: jest.fn((d: any) => '01.01.2026'),
  formatCurrency: jest.fn((n: number) => `${n},00 zł`),
  collectAllAllergens: jest.fn().mockReturnValue(new Map([
    ['gluten', new Set(['Pierogi', 'Naleśniki'])],
    ['lactose', new Set(['Sernik'])],
  ])),
  getRegularFont: jest.fn((custom: boolean) => (custom ? 'DejaVu' : 'Helvetica')),
  getBoldFont: jest.fn((custom: boolean) => (custom ? 'DejaVu-Bold' : 'Helvetica-Bold')),
}));

// ─── Mock pdf.primitives ─────────────────────────────────────────────────────

const mockDrawHeaderBanner = jest.fn();
const mockSafePageBreak = jest.fn().mockReturnValue(100);
const mockDrawSeparator = jest.fn();
const mockDrawInlineFooter = jest.fn();
const mockDrawCompactTable = jest.fn();
const mockDrawAllergenSection = jest.fn();

jest.mock('@services/pdf/pdf.primitives', () => ({
  drawHeaderBanner: (...args: any[]) => mockDrawHeaderBanner(...args),
  safePageBreak: (...args: any[]) => mockSafePageBreak(...args),
  drawSeparator: (...args: any[]) => mockDrawSeparator(...args),
  drawInlineFooter: (...args: any[]) => mockDrawInlineFooter(...args),
  drawCompactTable: (...args: any[]) => mockDrawCompactTable(...args),
  drawAllergenSection: (...args: any[]) => mockDrawAllergenSection(...args),
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

import { buildMenuCardPremium } from '@services/pdf/pdf-menu-card.builder';

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

function createFullMenuCardData(): MenuCardPDFData {
  return {
    templateName: 'Menu Weselne 2026',
    templateDescription: 'Eleganckie menu na wesela i przyjecia',
    variant: 'Premium',
    eventTypeName: 'Wesele',
    eventTypeColor: '#c8a45a',
    packages: [
      {
        name: 'Pakiet Zloty',
        description: 'Nasz najlepszy pakiet weselny',
        shortDescription: 'Premium',
        pricePerAdult: 350,
        pricePerChild: 200,
        pricePerToddler: 0,
        badgeText: 'BESTSELLER',
        includedItems: ['Ciasto weselne', 'Dekoracja stolow'],
        courses: [
          {
            name: 'Przystawki',
            description: 'Wybor przystawek',
            minSelect: 2,
            maxSelect: 3,
            dishes: [
              { name: 'Tatar wolowy', description: 'Swiezy tatar z jajkiem', allergens: ['gluten'] },
              { name: 'Carpaccio z buraka', description: 'Z kozim serem', allergens: ['lactose'] },
              { name: 'Bruschetta', description: null },
            ],
          },
          {
            name: 'Dania glowne',
            description: null,
            minSelect: 1,
            maxSelect: 1,
            dishes: [
              { name: 'Poledwica wolowa', description: 'Z sosem grzybowym' },
              { name: 'Losos pieczony', description: 'Z warzywami' },
            ],
          },
        ],
        options: [
          {
            name: 'Bar kawowy',
            description: 'Pelny serwis kawowy',
            category: 'Napoje',
            priceType: 'PER_PERSON',
            priceAmount: 25,
            isRequired: true,
          },
          {
            name: 'Fontanna czekoladowa',
            description: 'Belgijska czekolada',
            category: 'Dodatki',
            priceType: 'FLAT',
            priceAmount: 800,
            isRequired: false,
          },
        ],
      },
      {
        name: 'Pakiet Srebrny',
        description: null,
        pricePerAdult: 250,
        pricePerChild: 150,
        pricePerToddler: 0,
        courses: [
          {
            name: 'Przystawki',
            minSelect: 1,
            maxSelect: 2,
            dishes: [
              { name: 'Salatka Cezar', description: 'Klasyczna' },
            ],
          },
        ],
        options: [],
      },
    ],
  };
}

function createMinimalMenuCardData(): MenuCardPDFData {
  return {
    templateName: 'Menu Bankietowe',
    eventTypeName: 'Bankiet',
    packages: [
      {
        name: 'Pakiet Podstawowy',
        pricePerAdult: 150,
        pricePerChild: 80,
        pricePerToddler: 0,
        courses: [],
        options: [],
      },
    ],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildMenuCardPremium', () => {
  let doc: any;
  let ctx: PdfDrawContext;

  beforeEach(() => {
    jest.clearAllMocks();
    doc = createMockDoc();
    ctx = createMockCtx();
  });

  it('generates PDF with full data without throwing', () => {
    const data = createFullMenuCardData();
    expect(() => buildMenuCardPremium(doc, data, ctx, false)).not.toThrow();
  });

  it('generates PDF with minimal data gracefully', () => {
    const data = createMinimalMenuCardData();
    expect(() => buildMenuCardPremium(doc, data, ctx, false)).not.toThrow();
  });

  it('calls text() with Polish content', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('MENU WESELNE 2026'),
    ]));
  });

  it('draws header banner with KARTA MENU badge', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    expect(mockDrawHeaderBanner).toHaveBeenCalledWith(
      doc, ctx, 'KARTA MENU', '#c8a45a',
    );
  });

  it('renders event type and variant in subtitle', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Wesele'),
    ]));
  });

  it('renders template description when provided', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Eleganckie menu'),
    ]));
  });

  it('renders package header with name, prices, and badge', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Pakiet Zloty'),
    ]));
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('BESTSELLER'),
    ]));
  });

  it('renders included items when provided', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('W cenie: '),
    ]));
  });

  it('renders course tables with dishes', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    // Should call drawCompactTable for each course
    expect(mockDrawCompactTable).toHaveBeenCalled();
    const dishTableCalls = mockDrawCompactTable.mock.calls.filter(
      (c: any[]) => c[2][0] === 'Danie',
    );
    expect(dishTableCalls.length).toBeGreaterThanOrEqual(2); // 2 courses in first package
  });

  it('renders course selection info', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Przystawki'),
    ]));
  });

  it('renders required options as W PAKIECIE', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('W PAKIECIE'),
    ]));
  });

  it('renders optional options as OPCJE DODATKOWE', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('OPCJE DODATKOWE'),
    ]));
  });

  it('calls drawAllergenSection for global allergens', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    expect(mockDrawAllergenSection).toHaveBeenCalledWith(
      doc, ctx, expect.any(Map), expect.any(Number), expect.any(Number),
    );
  });

  it('calls drawInlineFooter', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    expect(mockDrawInlineFooter).toHaveBeenCalledWith(
      doc, ctx, expect.any(Number), expect.any(Number),
    );
  });

  it('handles multiple packages with separators', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    // 2 packages = at least 1 separator between them
    expect(mockDrawSeparator.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('skips description when null', () => {
    const data = createMinimalMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls.every((t: string) => typeof t !== 'string' || !t.includes('Eleganckie'))).toBe(true);
  });

  it('skips badge when not provided', () => {
    const data = createMinimalMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls.every((t: string) => typeof t !== 'string' || !t.includes('BESTSELLER'))).toBe(true);
  });

  it('uses custom fonts when useCustomFonts is true', () => {
    const data = createMinimalMenuCardData();
    buildMenuCardPremium(doc, data, ctx, true);

    expect(doc.font).toHaveBeenCalledWith('DejaVu-Bold');
  });

  it('calls safePageBreak before packages and courses', () => {
    const data = createFullMenuCardData();
    buildMenuCardPremium(doc, data, ctx, false);

    expect(mockSafePageBreak).toHaveBeenCalled();
  });
});
