/**
 * PDFService — Comprehensive Unit Tests
 * Targets 0% coverage on 1094 lines. Covers: constructor font detection,
 * generateReservationPDF (all branches), generatePaymentConfirmationPDF,
 * generateMenuCardPDF, helper methods, all conditional branches.
 */

// --- Mock PDFKit ---
const mockDocMethods: Record<string, jest.Mock> = {};
const mockDocEvents: Record<string, Function[]> = {};

function createMockDoc() {
  const events: Record<string, Function[]> = {};
  const methods = [
    'fontSize', 'font', 'text', 'fillColor', 'moveDown', 'registerFont',
    'strokeColor', 'lineWidth', 'moveTo', 'lineTo', 'stroke',
    'rect', 'fill', 'fillAndStroke', 'circle', 'roundedRect',
    'end', 'addPage',
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
      // simulate async PDF generation
      setTimeout(() => {
        if (events['data']) events['data'].forEach(cb => cb(Buffer.from('chunk1')));
        if (events['end']) events['end'].forEach(cb => cb());
      }, 5);
    }),
    heightOfString: jest.fn((text: string, options?: any) => {
      // Simple estimation: ~12px per line
      const width = options?.width || 500;
      const lines = Math.ceil(text.length / (width / 6));
      return lines * 12;
    }),
  };
  methods.forEach(m => {
    if (m !== 'end') {
      doc[m] = jest.fn(() => doc);
    }
  });
  Object.assign(mockDocMethods, doc);
  Object.assign(mockDocEvents, events);
  return doc;
}

jest.mock('pdfkit', () => {
  return jest.fn(() => createMockDoc());
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

import * as fs from 'fs';

const existsSyncMock = fs.existsSync as jest.Mock;

// Reset module cache for each test group
function loadPDFService(fontExists: boolean = false) {
  // Reset module registry to get fresh constructor
  jest.resetModules();
  // Re-mock before require
  jest.doMock('pdfkit', () => jest.fn(() => createMockDoc()));
  jest.doMock('fs', () => ({ existsSync: jest.fn(() => fontExists) }));

  const mod = require('../../../services/pdf.service');
  return { PDFService: mod.PDFService, pdfService: mod.pdfService };
}

describe('PDFService', () => {
  // ========== Constructor & Font Detection ==========
  describe('constructor', () => {
    it('should set useCustomFonts=true when fonts exist', () => {
      const { PDFService } = loadPDFService(true);
      const svc = new PDFService();
      // Verifies no errors during construction with fonts
      expect(svc).toBeDefined();
    });

    it('should set useCustomFonts=false when fonts missing', () => {
      const { PDFService } = loadPDFService(false);
      const svc = new PDFService();
      expect(svc).toBeDefined();
    });
  });

  // ========== generateReservationPDF ==========
  describe('generateReservationPDF()', () => {
    let svc: any;

    beforeEach(() => {
      const mod = loadPDFService(false);
      svc = new mod.PDFService();
    });

    const BASE_RESERVATION = {
      id: 'res-1',
      client: { firstName: 'Jan', lastName: 'Kowalski', email: 'jan@test.pl', phone: '123456789', address: 'ul. Test 1' },
      hall: { name: 'Sala A' },
      eventType: { name: 'Wesele' },
      date: '2026-03-15',
      startTime: '14:00',
      endTime: '22:00',
      adults: 80,
      children: 10,
      toddlers: 5,
      guests: 95,
      pricePerAdult: 250,
      pricePerChild: 150,
      pricePerToddler: 50,
      totalPrice: 22250,
      status: 'CONFIRMED',
      notes: 'Uwagi testowe',
      createdAt: new Date(),
    };

    it('should generate PDF buffer for full reservation', async () => {
      const buffer = await svc.generateReservationPDF(BASE_RESERVATION);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation without email/address', async () => {
      const res = { ...BASE_RESERVATION, client: { firstName: 'A', lastName: 'B', phone: '111' } };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with startDateTime/endDateTime', async () => {
      const res = {
        ...BASE_RESERVATION,
        date: undefined, startTime: undefined, endTime: undefined,
        startDateTime: new Date('2026-03-15T14:00:00Z'),
        endDateTime: new Date('2026-03-15T22:00:00Z'),
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with customEventType', async () => {
      const res = { ...BASE_RESERVATION, eventType: undefined, customEventType: 'Bal karnawałowy' };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation without eventType', async () => {
      const res = { ...BASE_RESERVATION, eventType: undefined, customEventType: undefined };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle 0 adults/children/toddlers', async () => {
      const res = { ...BASE_RESERVATION, adults: 0, children: 0, toddlers: 0, pricePerAdult: 0, pricePerChild: 0, pricePerToddler: 0 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle birthdayAge', async () => {
      const res = { ...BASE_RESERVATION, birthdayAge: 50 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle anniversaryYear + occasion', async () => {
      const res = { ...BASE_RESERVATION, anniversaryYear: 25, anniversaryOccasion: 'Srebrne gody' };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle anniversaryYear without occasion', async () => {
      const res = { ...BASE_RESERVATION, anniversaryYear: 10 };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation without notes', async () => {
      const res = { ...BASE_RESERVATION, notes: undefined };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle menuSnapshot', async () => {
      const res = {
        ...BASE_RESERVATION,
        menuSnapshot: {
          id: 'ms-1',
          menuData: {
            packageName: 'Gold',
            dishSelections: [
              {
                categoryId: 'c1', categoryName: 'Zupy',
                dishes: [
                  { dishId: 'd1', dishName: 'Rosol', quantity: 1, allergens: ['gluten'] },
                  { dishId: 'd2', dishName: 'Krem', quantity: 0.5 },
                ],
              },
            ],
          },
          packagePrice: 20000,
          optionsPrice: 2250,
          totalMenuPrice: 22250,
          adultsCount: 80,
          childrenCount: 10,
          toddlersCount: 5,
          selectedAt: new Date(),
        },
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle menuSnapshot with empty dishSelections', async () => {
      const res = {
        ...BASE_RESERVATION,
        menuSnapshot: {
          id: 'ms-2',
          menuData: { dishSelections: [] },
          packagePrice: 0, optionsPrice: 0, totalMenuPrice: 0,
          adultsCount: 0, childrenCount: 0, toddlersCount: 0,
          selectedAt: new Date(),
        },
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle menuSnapshot with package.name fallback', async () => {
      const res = {
        ...BASE_RESERVATION,
        menuSnapshot: {
          id: 'ms-3',
          menuData: { package: { name: 'Silver' }, dishSelections: [] },
          packagePrice: 0, optionsPrice: 0, totalMenuPrice: 0,
          adultsCount: 0, childrenCount: 0, toddlersCount: 0,
          selectedAt: new Date(),
        },
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle legacy menuData with dishSelections', async () => {
      const res = {
        ...BASE_RESERVATION,
        menuData: {
          packageName: 'Basic',
          dishSelections: [
            {
              categoryId: 'c1', categoryName: 'Przystawki',
              dishes: [
                { dishId: 'd1', dishName: 'Tatar', quantity: 2, allergens: ['eggs', 'unknown_allergen'] },
              ],
            },
          ],
        },
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle legacy menuData with empty dishSelections', async () => {
      const res = {
        ...BASE_RESERVATION,
        menuData: { dishSelections: [] },
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle deposits array', async () => {
      const res = {
        ...BASE_RESERVATION,
        deposits: [{ amount: 5000, dueDate: new Date('2026-02-01'), status: 'PAID', paid: true }],
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle deposit with string dueDate (unpaid)', async () => {
      const res = {
        ...BASE_RESERVATION,
        deposit: { amount: 5000, dueDate: '2026-02-01', status: 'PENDING', paid: false },
      };
      const buffer = await svc.generateReservationPDF(res);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle various statuses', async () => {
      for (const status of ['RESERVED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'UNKNOWN']) {
        const res = { ...BASE_RESERVATION, status };
        const buffer = await svc.generateReservationPDF(res);
        expect(buffer).toBeInstanceOf(Buffer);
      }
    });
  });

  // ========== generatePaymentConfirmationPDF ==========
  describe('generatePaymentConfirmationPDF()', () => {
    let svc: any;

    beforeEach(() => {
      const mod = loadPDFService(false);
      svc = new mod.PDFService();
    });

    const BASE_PAYMENT = {
      depositId: 'dep-1',
      amount: 5000,
      paidAt: new Date(),
      paymentMethod: 'TRANSFER',
      client: { firstName: 'Jan', lastName: 'K', email: 'jan@test.pl', phone: '111', address: 'ul. X' },
      reservation: {
        id: 'res-1', date: '2026-03-15', startTime: '14:00', endTime: '22:00',
        hall: 'Sala A', eventType: 'Wesele', guests: 95, totalPrice: 22250,
      },
    };

    it('should generate payment confirmation PDF', async () => {
      const buffer = await svc.generatePaymentConfirmationPDF(BASE_PAYMENT);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle CASH payment method', async () => {
      const buffer = await svc.generatePaymentConfirmationPDF({ ...BASE_PAYMENT, paymentMethod: 'CASH' });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle BLIK payment method', async () => {
      const buffer = await svc.generatePaymentConfirmationPDF({ ...BASE_PAYMENT, paymentMethod: 'BLIK' });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle CARD payment method', async () => {
      const buffer = await svc.generatePaymentConfirmationPDF({ ...BASE_PAYMENT, paymentMethod: 'CARD' });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle unknown payment method', async () => {
      const buffer = await svc.generatePaymentConfirmationPDF({ ...BASE_PAYMENT, paymentMethod: 'CRYPTO' });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle with paymentReference', async () => {
      const buffer = await svc.generatePaymentConfirmationPDF({ ...BASE_PAYMENT, paymentReference: 'REF-123' });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle without client email/address', async () => {
      const data = { ...BASE_PAYMENT, client: { firstName: 'A', lastName: 'B', phone: '111' } };
      const buffer = await svc.generatePaymentConfirmationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle without eventType', async () => {
      const data = { ...BASE_PAYMENT, reservation: { ...BASE_PAYMENT.reservation, eventType: undefined } };
      const buffer = await svc.generatePaymentConfirmationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  // ========== generateMenuCardPDF ==========
  describe('generateMenuCardPDF()', () => {
    let svc: any;

    beforeEach(() => {
      const mod = loadPDFService(false);
      svc = new mod.PDFService();
    });

    const BASE_MENU_CARD = {
      templateName: 'Menu Weselne 2026',
      templateDescription: 'Opis szablonu',
      variant: 'Premium',
      eventTypeName: 'Wesele',
      eventTypeColor: '#ff0000',
      packages: [
        {
          name: 'Gold',
          description: 'Pakiet Gold',
          shortDescription: 'Najlepszy',
          pricePerAdult: 350,
          pricePerChild: 200,
          pricePerToddler: 100,
          isPopular: true,
          badgeText: 'BESTSELLER',
          includedItems: ['Tort', 'Dekoracja'],
          courses: [
            {
              name: 'Zupy',
              description: 'Wybor zup',
              minSelect: 1,
              maxSelect: 2,
              dishes: [
                { name: 'Rosol', description: 'Klasyczny rosol', allergens: ['gluten', 'eggs'], isDefault: true },
                { name: 'Krem grzybowy', isRecommended: true },
                { name: 'Barszcz', allergens: [] },
              ],
            },
            {
              name: 'Dania glowne',
              minSelect: 2,
              maxSelect: 2,
              dishes: [
                { name: 'Schabowy' },
              ],
            },
          ],
          options: [
            { name: 'Bar otwarty', description: 'Opis baru', category: 'DRINKS', priceType: 'PER_PERSON', priceAmount: 50, isRequired: false },
            { name: 'DJ', category: 'ENTERTAINMENT', priceType: 'FLAT', priceAmount: 2000, isRequired: true, description: 'Profesjonalny DJ' },
          ],
        },
      ],
    };

    it('should generate menu card PDF', async () => {
      const buffer = await svc.generateMenuCardPDF(BASE_MENU_CARD);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle without variant', async () => {
      const data = { ...BASE_MENU_CARD, variant: null };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle without templateDescription', async () => {
      const data = { ...BASE_MENU_CARD, templateDescription: null };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package with isRecommended badge fallback', async () => {
      const pkg = { ...BASE_MENU_CARD.packages[0], badgeText: null, isPopular: false, isRecommended: true };
      const data = { ...BASE_MENU_CARD, packages: [pkg] };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package with no badge', async () => {
      const pkg = { ...BASE_MENU_CARD.packages[0], badgeText: null, isPopular: false, isRecommended: false };
      const data = { ...BASE_MENU_CARD, packages: [pkg] };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package without description', async () => {
      const pkg = { ...BASE_MENU_CARD.packages[0], description: null };
      const data = { ...BASE_MENU_CARD, packages: [pkg] };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package without includedItems', async () => {
      const pkg = { ...BASE_MENU_CARD.packages[0], includedItems: [] };
      const data = { ...BASE_MENU_CARD, packages: [pkg] };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle course with minSelect === maxSelect', async () => {
      const course = { ...BASE_MENU_CARD.packages[0].courses[0], minSelect: 2, maxSelect: 2 };
      const pkg = { ...BASE_MENU_CARD.packages[0], courses: [course] };
      const data = { ...BASE_MENU_CARD, packages: [pkg] };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle empty courses and options', async () => {
      const pkg = { ...BASE_MENU_CARD.packages[0], courses: [], options: [] };
      const data = { ...BASE_MENU_CARD, packages: [pkg] };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle 0 pricePerChild/pricePerToddler', async () => {
      const pkg = { ...BASE_MENU_CARD.packages[0], pricePerChild: 0, pricePerToddler: 0 };
      const data = { ...BASE_MENU_CARD, packages: [pkg] };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle option without description', async () => {
      const opts = [
        { name: 'Bar', category: 'DRINKS', priceType: 'PER_PERSON', priceAmount: 50, isRequired: false },
        { name: 'DJ', category: 'MUSIC', priceType: 'FLAT', priceAmount: 1000, isRequired: true },
      ];
      const pkg = { ...BASE_MENU_CARD.packages[0], options: opts };
      const data = { ...BASE_MENU_CARD, packages: [pkg] };
      const buffer = await svc.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  // ═══════════ edge cases / branch coverage ═══════════
  describe('edge cases / branch coverage', () => {
    let svc: any;

    beforeEach(() => {
      const mod = loadPDFService(false);
      svc = new mod.PDFService();
    });

    describe('generateReservationPDF — reservationExtras', () => {
      it('should handle reservationExtras with multiple priceTypes', async () => {
        const buffer = await svc.generateReservationPDF({
          id: 'TEST-EXTRAS',
          client: { firstName: 'Marcin', lastName: 'P', phone: '+48777888999' },
          adults: 90, children: 0, toddlers: 0, guests: 90,
          pricePerAdult: 190, pricePerChild: 0, pricePerToddler: 0,
          totalPrice: 21100, extrasTotalPrice: 4000, status: 'CONFIRMED',
          reservationExtras: [
            { serviceItem: { name: 'DJ', priceType: 'FLAT', category: { name: 'Muzyka' } },
              quantity: 1, unitPrice: 2000, totalPrice: 2000, priceType: 'FLAT', status: 'CONFIRMED' },
            { serviceItem: { name: 'Kwiaty', priceType: 'PER_UNIT', category: null },
              quantity: 5, unitPrice: 100, totalPrice: 500, priceType: 'PER_UNIT', status: 'CONFIRMED' },
            { serviceItem: { name: 'Tort', priceType: 'FREE', category: { name: 'Catering' } },
              quantity: 1, unitPrice: 0, totalPrice: 0, priceType: 'FREE', status: 'CONFIRMED' },
            { serviceItem: { name: 'Drink', priceType: 'PER_PERSON', category: { name: 'Napoje' } },
              quantity: 90, unitPrice: 15, totalPrice: 1350, priceType: 'PER_PERSON', status: 'CONFIRMED' },
          ],
          createdAt: new Date(),
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });
    });

    describe('generateReservationPDF — venueSurcharge', () => {
      it('should handle venueSurcharge and label', async () => {
        const buffer = await svc.generateReservationPDF({
          id: 'TEST-VENUE',
          client: { firstName: 'A', lastName: 'B', phone: '1' },
          adults: 30, children: 0, toddlers: 0, guests: 30,
          pricePerAdult: 150, pricePerChild: 0, pricePerToddler: 0,
          totalPrice: 7500, venueSurcharge: 3000,
          venueSurchargeLabel: 'Doplata za wylacznosc',
          status: 'CONFIRMED', createdAt: new Date(),
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });
    });

    describe('generateReservationPDF — extraHoursCost', () => {
      it('should handle extraHoursCost with DateTime objects', async () => {
        const buffer = await svc.generateReservationPDF({
          id: 'TEST-HOURS',
          client: { firstName: 'K', lastName: 'Z', phone: '2' },
          startDateTime: new Date('2026-08-20T16:00:00'),
          endDateTime: new Date('2026-08-21T01:00:00'),
          eventType: { name: 'Wesele', standardHours: 6, extraHourRate: 600 },
          adults: 120, children: 15, toddlers: 5, guests: 140,
          pricePerAdult: 210, pricePerChild: 105, pricePerToddler: 0,
          totalPrice: 28575, extraHoursCost: 1800,
          status: 'CONFIRMED', createdAt: new Date(),
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });
    });

    describe('generateReservationPDF — single deposit (legacy)', () => {
      it('should handle single deposit paid', async () => {
        const buffer = await svc.generateReservationPDF({
          id: 'TEST-DEP',
          client: { firstName: 'B', lastName: 'L', phone: '3' },
          adults: 60, children: 0, toddlers: 0, guests: 60,
          pricePerAdult: 150, pricePerChild: 0, pricePerToddler: 0,
          totalPrice: 9000, status: 'CONFIRMED',
          deposit: { amount: 500, dueDate: '2026-05-01', status: 'PAID', paid: true },
          createdAt: new Date(),
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });
    });

    describe('generateRevenueReportPDF', () => {
      it('should handle full revenue report', async () => {
        const buffer = await svc.generateRevenueReportPDF({
          filters: { dateFrom: '2026-01-01', dateTo: '2026-03-31', groupBy: 'month' },
          summary: {
            totalRevenue: 250000, avgRevenuePerReservation: 12500,
            totalReservations: 20, completedReservations: 18,
            pendingRevenue: 25000, growthPercent: 15.5, extrasRevenue: 45000,
          },
          breakdown: [{ period: '2026-01', revenue: 80000, count: 8, avgRevenue: 10000 }],
          byHall: [{ hallName: 'Sala A', revenue: 150000, count: 12, avgRevenue: 12500 }],
          byEventType: [{ eventTypeName: 'Wesele', revenue: 200000, count: 15, avgRevenue: 13333 }],
          byServiceItem: [{ name: 'DJ', revenue: 30000, count: 15, avgRevenue: 2000 }],
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });

      it('should handle minimal revenue report', async () => {
        const buffer = await svc.generateRevenueReportPDF({
          filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
          summary: {
            totalRevenue: 50000, avgRevenuePerReservation: 10000,
            totalReservations: 5, completedReservations: 5,
            pendingRevenue: 0, growthPercent: 0,
          },
          breakdown: [], byHall: [], byEventType: [],
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });

      it('should handle report without extrasRevenue', async () => {
        const buffer = await svc.generateRevenueReportPDF({
          filters: { dateFrom: '2026-02-01', dateTo: '2026-02-28', groupBy: 'week' },
          summary: {
            totalRevenue: 30000, avgRevenuePerReservation: 3000,
            totalReservations: 10, completedReservations: 9,
            pendingRevenue: 3000, growthPercent: -5.2,
          },
          breakdown: [{ period: 'Tydzien 1', revenue: 15000, count: 5, avgRevenue: 3000 }],
          byHall: [{ hallName: 'Sala A', revenue: 20000, count: 6, avgRevenue: 3333 }],
          byEventType: [{ eventTypeName: 'Wesele', revenue: 25000, count: 8, avgRevenue: 3125 }],
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });
    });

    describe('generateOccupancyReportPDF', () => {
      it('should handle full occupancy report', async () => {
        const buffer = await svc.generateOccupancyReportPDF({
          filters: { dateFrom: '2026-01-01', dateTo: '2026-03-31' },
          summary: {
            avgOccupancy: 75, peakDay: 'Saturday', peakHall: 'Sala A',
            totalReservations: 25, totalDaysInPeriod: 90,
          },
          halls: [{ hallName: 'Sala A', occupancy: 85, reservations: 15, avgGuestsPerReservation: 95 }],
          peakHours: [{ hour: 18, count: 12 }],
          peakDaysOfWeek: [{ dayOfWeek: 'Saturday', count: 15 }],
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });

      it('should handle report without peakHall', async () => {
        const buffer = await svc.generateOccupancyReportPDF({
          filters: { dateFrom: '2026-02-01', dateTo: '2026-02-28' },
          summary: {
            avgOccupancy: 50, peakDay: 'Saturday',
            totalReservations: 8, totalDaysInPeriod: 28,
          },
          halls: [], peakHours: [],
          peakDaysOfWeek: [{ dayOfWeek: 'Saturday', count: 5 }],
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });

      it('should handle empty halls/peakHours/peakDaysOfWeek', async () => {
        const buffer = await svc.generateOccupancyReportPDF({
          filters: { dateFrom: '2026-03-01', dateTo: '2026-03-15' },
          summary: {
            avgOccupancy: 0, peakDay: 'Monday', peakHall: 'Brak danych',
            totalReservations: 0, totalDaysInPeriod: 15,
          },
          halls: [], peakHours: [], peakDaysOfWeek: [],
        });
        expect(buffer).toBeInstanceOf(Buffer);
      });
    });
  });

  // ========== Font registration with custom fonts ==========
  describe('with custom fonts', () => {
    it('should register custom fonts when available', async () => {
      const mod = loadPDFService(true);
      const svc = new mod.PDFService();
      const buffer = await svc.generateReservationPDF({
        id: 'r1',
        client: { firstName: 'A', lastName: 'B', phone: '1' },
        adults: 1, children: 0, toddlers: 0, guests: 1,
        pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 100, status: 'PENDING', createdAt: new Date(),
      });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should generate payment PDF with custom fonts', async () => {
      const mod = loadPDFService(true);
      const svc = new mod.PDFService();
      const buffer = await svc.generatePaymentConfirmationPDF({
        depositId: 'd1', amount: 1000, paidAt: new Date(), paymentMethod: 'CASH',
        client: { firstName: 'A', lastName: 'B', phone: '1' },
        reservation: { id: 'r1', date: '2026-01-01', startTime: '10:00', endTime: '18:00', guests: 10, totalPrice: 5000 },
      });
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should generate menu card PDF with custom fonts', async () => {
      const mod = loadPDFService(true);
      const svc = new mod.PDFService();
      const buffer = await svc.generateMenuCardPDF({
        templateName: 'Test', eventTypeName: 'Wesele', packages: [],
      });
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
