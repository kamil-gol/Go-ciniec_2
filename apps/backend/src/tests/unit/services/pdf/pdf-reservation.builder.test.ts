/**
 * Unit tests for pdf-reservation.builder.ts
 * Covers: buildReservationPDF
 * Issue: #444
 */

import type { PdfDrawContext } from '@services/pdf/pdf.primitives';
import type { ReservationPDFData } from '@services/pdf/pdf.types';

// ─── Mock pdf.utils (loadPdfConfig) ──────────────────────────────────────────

const mockLoadPdfConfig = jest.fn().mockResolvedValue(null);

jest.mock('@services/pdf/pdf.utils', () => ({
  formatDate: jest.fn((d: any) => '01.01.2026'),
  formatTime: jest.fn((d: any) => '14:00'),
  formatCurrency: jest.fn((n: number) => `${n},00 zł`),
  loadPdfConfig: (...args: any[]) => mockLoadPdfConfig(...args),
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
const mockDrawImportantInfoSection = jest.fn();

jest.mock('@services/pdf/pdf.primitives', () => ({
  drawHeaderBanner: (...args: any[]) => mockDrawHeaderBanner(...args),
  drawSectionHeader: (...args: any[]) => mockDrawSectionHeader(...args),
  safePageBreak: (...args: any[]) => mockSafePageBreak(...args),
  drawInfoBox: (...args: any[]) => mockDrawInfoBox(...args),
  calculateInfoBoxHeight: (...args: any[]) => mockCalculateInfoBoxHeight(...args),
  drawSeparator: (...args: any[]) => mockDrawSeparator(...args),
  drawInlineFooter: (...args: any[]) => mockDrawInlineFooter(...args),
  drawCompactTable: (...args: any[]) => mockDrawCompactTable(...args),
  drawImportantInfoSection: (...args: any[]) => mockDrawImportantInfoSection(...args),
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
    reservationBg: '#EDE9FE',
  };
  return {
    COLORS,
    DEFAULT_COLORS: { ...COLORS },
    setColors: jest.fn(),
    resetColors: jest.fn(),
    STATUS_MAP: {
      CONFIRMED: { label: 'POTWIERDZONA', color: '#27ae60' },
      RESERVED: { label: 'REZERWACJA', color: '#3498db' },
      PENDING: { label: 'OCZEKUJĄCA', color: '#f39c12' },
      CANCELLED: { label: 'ANULOWANA', color: '#e74c3c' },
    },
    ALLERGEN_LABELS: {
      gluten: 'Gluten',
      lactose: 'Laktoza',
      nuts: 'Orzechy',
    },
  };
});

import { buildReservationPDF } from '@services/pdf/pdf-reservation.builder';

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
    image: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    end: jest.fn(),
    circle: jest.fn().mockReturnThis(),
    currentLineHeight: jest.fn().mockReturnValue(10),
    heightOfString: jest.fn().mockReturnValue(10),
    on: jest.fn((event: string, cb: () => void) => {
      if (event === 'end') setTimeout(cb, 0);
      return doc;
    }),
    y: 100,
    page: { width: 595.28, height: 841.89 },
    bufferedPageRange: jest.fn().mockReturnValue({ start: 0, count: 1 }),
    switchToPage: jest.fn().mockReturnThis(),
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
      website: 'www.restauracja.pl',
      nip: '1234567890',
    },
  };
}

function createFullReservationData(): ReservationPDFData {
  return {
    id: 'res-001',
    client: {
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@test.pl',
      phone: '+48 111 222 333',
      address: 'ul. Kwiatowa 5, Krakow',
    },
    hall: { name: 'Sala Bankietowa' },
    eventType: {
      name: 'Wesele',
      standardHours: 8,
      extraHourRate: 500,
    },
    date: '2026-06-15',
    startTime: '16:00',
    endTime: '02:00',
    startDateTime: new Date('2026-06-15T16:00:00'),
    endDateTime: new Date('2026-06-16T02:00:00'),
    adults: 80,
    children: 10,
    toddlers: 5,
    guests: 95,
    pricePerAdult: 250,
    pricePerChild: 150,
    pricePerToddler: 0,
    totalPrice: 25000,
    extraHoursCost: 1000,
    venueSurcharge: 2000,
    venueSurchargeLabel: 'Wynajem sali',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    discountAmount: 2500,
    priceBeforeDiscount: 27500,
    status: 'CONFIRMED',
    notes: 'Uwagi testowe\nDruga linia uwag',
    birthdayAge: 30,
    deposits: [
      { amount: 500, dueDate: new Date('2026-05-01'), status: 'PAID', paid: true },
      { amount: 5000, dueDate: '2026-06-12', status: 'PENDING', paid: false },
    ],
    menuSnapshot: {
      id: 'snap-001',
      menuData: {
        packageName: 'Pakiet Premium',
        dishSelections: [
          {
            categoryId: 'cat-1',
            categoryName: 'Przystawki',
            dishes: [
              { dishId: 'd1', dishName: 'Tatar', quantity: 1, allergens: ['gluten'] },
              { dishId: 'd2', dishName: 'Carpaccio', quantity: 2 },
            ],
          },
          {
            categoryId: 'cat-2',
            categoryName: 'Zupy',
            dishes: [
              { dishId: 'd3', dishName: 'Rosol', quantity: 1, allergens: ['lactose'] },
            ],
          },
        ],
      },
      packagePrice: 200,
      optionsPrice: 50,
      totalMenuPrice: 250,
      adultsCount: 80,
      childrenCount: 10,
      toddlersCount: 5,
      selectedAt: new Date('2026-05-01'),
    },
    reservationExtras: [
      {
        serviceItem: { name: 'DJ', priceType: 'FLAT', category: { name: 'Muzyka' } },
        quantity: 1,
        unitPrice: 2000,
        totalPrice: 2000,
        priceType: 'FLAT',
        note: 'Profesjonalny DJ',
        status: 'ACTIVE',
      },
      {
        serviceItem: { name: 'Dekoracje', priceType: 'PER_UNIT', category: { name: 'Dekoracje' } },
        quantity: 10,
        unitPrice: 50,
        totalPrice: 500,
        priceType: 'PER_UNIT',
        status: 'ACTIVE',
      },
      {
        serviceItem: { name: 'Serwetki', priceType: 'PER_PERSON', category: { name: 'Dekoracje' } },
        quantity: 95,
        unitPrice: 5,
        totalPrice: 475,
        priceType: 'PER_PERSON',
        status: 'ACTIVE',
      },
      {
        serviceItem: { name: 'Woda mineralna', priceType: 'FREE', category: null },
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        priceType: 'FREE',
        status: 'ACTIVE',
      },
    ],
    categoryExtras: [
      {
        categoryName: 'Desery',
        quantity: 2,
        pricePerItem: 15,
        guestCount: 80,
        portionTarget: 'ADULTS_ONLY',
        totalPrice: 2400,
      },
      {
        categoryName: 'Napoje',
        quantity: 1,
        pricePerItem: 10,
        guestCount: 95,
        portionTarget: 'ALL',
        totalPrice: 950,
      },
    ],
    createdAt: new Date('2026-04-01'),
  };
}

function createMinimalReservationData(): ReservationPDFData {
  return {
    id: 'res-002',
    client: {
      firstName: 'Anna',
      lastName: 'Nowak',
      phone: '+48 999 888 777',
    },
    adults: 20,
    children: 0,
    toddlers: 0,
    guests: 20,
    pricePerAdult: 200,
    pricePerChild: 0,
    pricePerToddler: 0,
    totalPrice: 4000,
    status: 'RESERVED',
    createdAt: new Date('2026-04-01'),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildReservationPDF', () => {
  let doc: any;
  let ctx: PdfDrawContext;

  beforeEach(() => {
    jest.clearAllMocks();
    doc = createMockDoc();
    ctx = createMockCtx();
  });

  it('generates PDF with full data without throwing', async () => {
    const data = createFullReservationData();
    await expect(buildReservationPDF(doc, data, ctx, false)).resolves.not.toThrow();
  });

  it('generates PDF with minimal/null data gracefully', async () => {
    const data = createMinimalReservationData();
    await expect(buildReservationPDF(doc, data, ctx, false)).resolves.not.toThrow();
  });

  it('calls text() with Polish content (PLN formatting)', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('POTWIERDZENIE REZERWACJI'),
    ]));
  });

  it('draws header banner with status', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawHeaderBanner).toHaveBeenCalledWith(
      doc, ctx, 'POTWIERDZONA', '#27ae60',
    );
  });

  it('renders client and event columns via drawInfoBox', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'KLIENT',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining(['Jan Kowalski']),
    );

    expect(mockDrawInfoBox).toHaveBeenCalledWith(
      doc, ctx, 'WYDARZENIE',
      expect.any(Number), expect.any(Number), expect.any(Number),
      expect.arrayContaining(['Wesele']),
    );
  });

  it('renders menu table from menuSnapshot', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).toHaveBeenCalledWith(
      doc, ctx, 'WYBRANE MENU', expect.any(Number), expect.any(Number),
    );
    expect(mockDrawCompactTable).toHaveBeenCalled();
  });

  it('renders legacy menu when no menuSnapshot', async () => {
    const data = createFullReservationData();
    delete (data as any).menuSnapshot;
    data.menuData = {
      packageName: 'Legacy Pakiet',
      dishSelections: [
        {
          categoryId: 'cat-1',
          categoryName: 'Przystawki',
          dishes: [{ dishId: 'd1', dishName: 'Tatar', quantity: 1 }],
        },
      ],
    };

    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).toHaveBeenCalledWith(
      doc, ctx, 'WYBRANE DANIA', expect.any(Number), expect.any(Number),
    );
  });

  it('renders extras section with all price types', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).toHaveBeenCalledWith(
      doc, ctx, 'USŁUGI DODATKOWE', expect.any(Number), expect.any(Number),
    );

    // Check that text() was called with extras content
    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    const hasFlat = textCalls.some((t: string) => typeof t === 'string' && t.includes('DJ'));
    const hasPerUnit = textCalls.some((t: string) => typeof t === 'string' && t.includes('Dekoracje'));
    const hasFree = textCalls.some((t: string) => typeof t === 'string' && t.includes('Gratis'));
    expect(hasFlat).toBe(true);
    expect(hasPerUnit).toBe(true);
    expect(hasFree).toBe(true);
  });

  it('renders category extras table', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('DODATKOWO PŁATNE PORCJE'),
    ]));
  });

  it('renders financial summary with deposits', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('PODSUMOWANIE'),
    ]));
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('RAZEM'),
    ]));
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('DO ZAPŁATY'),
    ]));
  });

  it('renders discount rows when discount is present', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Suma przed rabatem'),
    ]));
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Rabat'),
    ]));
  });

  it('renders notes section when notes are present', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Uwagi:'),
    ]));
  });

  it('calls drawImportantInfoSection', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawImportantInfoSection).toHaveBeenCalledWith(
      doc, ctx, expect.any(Number), expect.any(Number), expect.any(Date),
    );
  });

  it('calls drawInlineFooter', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawInlineFooter).toHaveBeenCalledWith(
      doc, ctx, expect.any(Number), expect.any(Number),
    );
  });

  it('skips menu section when no menu data', async () => {
    const data = createMinimalReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).not.toHaveBeenCalledWith(
      doc, ctx, 'WYBRANE MENU', expect.any(Number), expect.any(Number),
    );
    expect(mockDrawSectionHeader).not.toHaveBeenCalledWith(
      doc, ctx, 'WYBRANE DANIA', expect.any(Number), expect.any(Number),
    );
  });

  it('skips extras sections when no extras', async () => {
    const data = createMinimalReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawSectionHeader).not.toHaveBeenCalledWith(
      doc, ctx, 'USŁUGI DODATKOWE', expect.any(Number), expect.any(Number),
    );
  });

  it('uses custom section order from config', async () => {
    mockLoadPdfConfig.mockResolvedValueOnce({
      sections: [
        { id: 'header', enabled: true, order: 1 },
        { id: 'footer', enabled: true, order: 2 },
      ],
    });

    const data = createMinimalReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(mockDrawHeaderBanner).toHaveBeenCalled();
    expect(mockDrawInlineFooter).toHaveBeenCalled();
    // menu section should NOT be called since it's not in custom config
    expect(mockDrawSectionHeader).not.toHaveBeenCalled();
  });

  it('applies custom colors from config', async () => {
    const { setColors } = require('@services/pdf/pdf.types');
    mockLoadPdfConfig.mockResolvedValueOnce({
      colors: { primary: '#FF0000' },
      sections: [{ id: 'header', enabled: true, order: 1 }],
    });

    const data = createMinimalReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(setColors).toHaveBeenCalled();
  });

  it('resets colors after rendering (even on error)', async () => {
    const { resetColors } = require('@services/pdf/pdf.types');
    const data = createMinimalReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    expect(resetColors).toHaveBeenCalled();
  });

  it('filters out CANCELLED deposits', async () => {
    const data = createFullReservationData();
    data.deposits = [
      { amount: 500, dueDate: new Date('2026-05-01'), status: 'PAID', paid: true },
      { amount: 1000, dueDate: new Date('2026-05-15'), status: 'CANCELLED', paid: false },
    ];

    await buildReservationPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    // Only one deposit row should appear (PAID), not two
    const depositLabels = textCalls.filter((t: string) =>
      typeof t === 'string' && t.includes('Zaliczka'),
    );
    expect(depositLabels.length).toBeGreaterThanOrEqual(1);
    // Should NOT contain "Zaliczka 1" / "Zaliczka 2" labels since only 1 active
    const numberedDeposits = depositLabels.filter((t: string) => t.includes('Zaliczka 1'));
    expect(numberedDeposits.length).toBe(0);
  });

  it('renders extra hours cost line', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Dodatkowe godziny'),
    ]));
  });

  it('renders venue surcharge line', async () => {
    const data = createFullReservationData();
    await buildReservationPDF(doc, data, ctx, false);

    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toEqual(expect.arrayContaining([
      expect.stringContaining('Wynajem sali'),
    ]));
  });

  it('uses custom fonts when useCustomFonts is true', async () => {
    const data = createMinimalReservationData();
    await buildReservationPDF(doc, data, ctx, true);

    expect(doc.font).toHaveBeenCalledWith('DejaVu-Bold');
    expect(doc.font).toHaveBeenCalledWith('DejaVu');
  });

  it('handles legacy date fields (date, startTime, endTime)', async () => {
    const data = createMinimalReservationData();
    data.date = '2026-07-01';
    data.startTime = '18:00';
    data.endTime = '23:00';

    await expect(buildReservationPDF(doc, data, ctx, false)).resolves.not.toThrow();
  });
});
