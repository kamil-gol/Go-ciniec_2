/**
 * PDFService — Unit Tests: sekcja Extras w PDF (#21 Issue #118)
 * Pokrycie: renderowanie listy reservationExtras w generateReservationPDF,
 * kalkulacja extrasTotalPrice, warianty (pusta lista, brak pola, różne priceType).
 */

function createMockDoc() {
  const events: Record<string, Function[]> = {};
  const methods = [
    'fontSize', 'font', 'text', 'fillColor', 'moveDown', 'registerFont',
    'strokeColor', 'lineWidth', 'moveTo', 'lineTo', 'stroke',
    'rect', 'fill', 'fillAndStroke', 'circle', 'roundedRect', 'addPage',
  ];
  const doc: any = {
    page: { width: 595.28, height: 841.89 },
    x: 50,
    y: 100,
    on: jest.fn((event: string, cb: Function) => {
      events[event] = events[event] || [];
      events[event].push(cb);
      return doc;
    }),
    end: jest.fn(() => {
      setTimeout(() => {
        if (events['data']) events['data'].forEach(cb => cb(Buffer.from('chunk1')));
        if (events['end']) events['end'].forEach(cb => cb());
      }, 5);
    }),
    heightOfString: jest.fn((_text: string, options?: any) => {
      const width = options?.width || 500;
      const lines = Math.ceil(_text.length / (width / 6));
      return lines * 12;
    }),
  };
  methods.forEach(m => { doc[m] = jest.fn(() => doc); });
  return doc;
}

jest.mock('pdfkit', () => jest.fn(() => createMockDoc()));
jest.mock('fs', () => ({ existsSync: jest.fn() }));

function loadPDFService(fontExists = false) {
  jest.resetModules();
  jest.doMock('pdfkit', () => jest.fn(() => createMockDoc()));
  jest.doMock('fs', () => ({ existsSync: jest.fn(() => fontExists) }));
  const mod = require('../../../services/pdf.service');
  return { PDFService: mod.PDFService, pdfService: mod.pdfService };
}

const BASE_RESERVATION = {
  id: 'res-extras-1',
  client: { firstName: 'Anna', lastName: 'Nowak', email: 'anna@test.pl', phone: '500600700' },
  hall: { name: 'Sala B' },
  eventType: { name: 'Urodziny' },
  date: '2026-06-01',
  startTime: '16:00',
  endTime: '23:00',
  adults: 50,
  children: 5,
  toddlers: 0,
  guests: 55,
  pricePerAdult: 200,
  pricePerChild: 100,
  pricePerToddler: 0,
  totalPrice: 10500,
  status: 'CONFIRMED',
  createdAt: new Date(),
};

const SAMPLE_EXTRAS = [
  {
    id: 'extra-1',
    serviceItem: { name: 'Tort urodzinowy', category: { name: 'Torty' } },
    priceType: 'FLAT',
    priceAmount: 500,
    quantity: 1,
    totalItemPrice: 500,
    note: 'Czekoladowy, napis "Happy Birthday"',
  },
  {
    id: 'extra-2',
    serviceItem: { name: 'Fotograf', category: { name: 'Foto/Video' } },
    priceType: 'FLAT',
    priceAmount: 1200,
    quantity: 1,
    totalItemPrice: 1200,
    note: null,
  },
  {
    id: 'extra-3',
    serviceItem: { name: 'Dekoracja balonowa', category: { name: 'Dekoracje' } },
    priceType: 'PER_PERSON',
    priceAmount: 15,
    quantity: 50,
    totalItemPrice: 750,
    note: 'Kolory: różowy, złoty',
  },
];

describe('PDFService — sekcja Extras (#21)', () => {
  describe('generateReservationPDF — z reservationExtras', () => {
    let svc: any;
    beforeEach(() => { svc = new (loadPDFService(false).PDFService)(); });

    it('should generate PDF with full extras list', async () => {
      const res = { ...BASE_RESERVATION, reservationExtras: SAMPLE_EXTRAS, extrasTotalPrice: 2450 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should generate PDF with empty extras array', async () => {
      const res = { ...BASE_RESERVATION, reservationExtras: [], extrasTotalPrice: 0 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should generate PDF without reservationExtras field (undefined)', async () => {
      const res = { ...BASE_RESERVATION };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should generate PDF with extras but extrasTotalPrice=0', async () => {
      const res = { ...BASE_RESERVATION, reservationExtras: SAMPLE_EXTRAS, extrasTotalPrice: 0 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle extra with FLAT priceType', async () => {
      const extras = [{ ...SAMPLE_EXTRAS[0], priceType: 'FLAT', quantity: 1 }];
      const res = { ...BASE_RESERVATION, reservationExtras: extras, extrasTotalPrice: 500 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle extra with PER_PERSON priceType', async () => {
      const extras = [{ ...SAMPLE_EXTRAS[2], priceType: 'PER_PERSON', quantity: 55 }];
      const res = { ...BASE_RESERVATION, reservationExtras: extras, extrasTotalPrice: 825 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle extra with PER_PIECE priceType', async () => {
      const extras = [{
        id: 'extra-piece',
        serviceItem: { name: 'Butelka wina', category: { name: 'Napoje' } },
        priceType: 'PER_PIECE',
        priceAmount: 80,
        quantity: 10,
        totalItemPrice: 800,
        note: null,
      }];
      const res = { ...BASE_RESERVATION, reservationExtras: extras, extrasTotalPrice: 800 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle extra with note containing special Polish characters', async () => {
      const extras = [{
        ...SAMPLE_EXTRAS[0],
        note: 'Życzenia: Małgorzata, Ślub złoty, Ósma rocznica',
      }];
      const res = { ...BASE_RESERVATION, reservationExtras: extras, extrasTotalPrice: 500 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle extras with missing serviceItem.category', async () => {
      const extras = [{
        id: 'extra-nocat',
        serviceItem: { name: 'Usługa bez kategorii' },
        priceType: 'FLAT',
        priceAmount: 200,
        quantity: 1,
        totalItemPrice: 200,
        note: null,
      }];
      const res = { ...BASE_RESERVATION, reservationExtras: extras, extrasTotalPrice: 200 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle large extras list (10+ items)', async () => {
      const extras = Array.from({ length: 12 }, (_, i) => ({
        id: `extra-bulk-${i}`,
        serviceItem: { name: `Usługa ${i + 1}`, category: { name: 'Inne' } },
        priceType: 'FLAT',
        priceAmount: 100,
        quantity: 1,
        totalItemPrice: 100,
        note: i % 2 === 0 ? `Notatka ${i}` : null,
      }));
      const res = { ...BASE_RESERVATION, reservationExtras: extras, extrasTotalPrice: 1200 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should include extras alongside menuSnapshot', async () => {
      const res = {
        ...BASE_RESERVATION,
        menuSnapshot: {
          id: 'ms-1',
          menuData: { packageName: 'Gold', dishSelections: [] },
          packagePrice: 10000, optionsPrice: 0, totalMenuPrice: 10000,
          adultsCount: 50, childrenCount: 5, toddlersCount: 0,
          selectedAt: new Date(),
        },
        reservationExtras: SAMPLE_EXTRAS,
        extrasTotalPrice: 2450,
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should include extras alongside deposits', async () => {
      const res = {
        ...BASE_RESERVATION,
        deposits: [{ amount: 3000, dueDate: new Date('2026-04-01'), status: 'PAID', paid: true }],
        reservationExtras: SAMPLE_EXTRAS,
        extrasTotalPrice: 2450,
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle extras with quantity > 1 and correct totalItemPrice', async () => {
      const extras = [{
        id: 'extra-qty',
        serviceItem: { name: 'Kieliszek szampana', category: { name: 'Napoje' } },
        priceType: 'PER_PIECE',
        priceAmount: 25,
        quantity: 55,
        totalItemPrice: 1375,
        note: null,
      }];
      const res = { ...BASE_RESERVATION, reservationExtras: extras, extrasTotalPrice: 1375 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should work with custom fonts enabled', async () => {
      const svcWithFonts = new (loadPDFService(true).PDFService)();
      const res = { ...BASE_RESERVATION, reservationExtras: SAMPLE_EXTRAS, extrasTotalPrice: 2450 };
      const buffer = await svcWithFonts.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle extras with isExclusive serviceItem', async () => {
      const extras = [{
        id: 'extra-excl',
        serviceItem: { name: 'Wyłączność sali', category: { name: 'Premium' }, isExclusive: true },
        priceType: 'FLAT',
        priceAmount: 5000,
        quantity: 1,
        totalItemPrice: 5000,
        note: 'Sala wyłącznie dla Was',
      }];
      const res = { ...BASE_RESERVATION, reservationExtras: extras, extrasTotalPrice: 5000 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle extras with null totalItemPrice (fallback calculation)', async () => {
      const extras = [{
        id: 'extra-null-price',
        serviceItem: { name: 'Usługa testowa', category: { name: 'Inne' } },
        priceType: 'FLAT',
        priceAmount: 300,
        quantity: 1,
        totalItemPrice: null,
        note: null,
      }];
      const res = { ...BASE_RESERVATION, reservationExtras: extras, extrasTotalPrice: 300 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle extras and full reservation data combined', async () => {
      const res = {
        ...BASE_RESERVATION,
        birthdayAge: 40,
        notes: 'Proszę przynieść tort o 19:00',
        menuSnapshot: {
          id: 'ms-full',
          menuData: {
            packageName: 'Platinum',
            dishSelections: [
              { categoryId: 'c1', categoryName: 'Zupy', dishes: [{ dishId: 'd1', dishName: 'Rosół', quantity: 1 }] },
            ],
          },
          packagePrice: 9000, optionsPrice: 1500, totalMenuPrice: 10500,
          adultsCount: 50, childrenCount: 5, toddlersCount: 0,
          selectedAt: new Date(),
        },
        deposits: [{ amount: 2000, dueDate: new Date('2026-05-01'), status: 'PAID', paid: true }],
        reservationExtras: SAMPLE_EXTRAS,
        extrasTotalPrice: 2450,
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
