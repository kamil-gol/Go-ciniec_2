/**
 * PDF Service Branch Coverage Tests
 * 
 * Purpose: Increase branch coverage for pdf.service.ts from current to 95%+
 * Target: Uncovered branches in conditional logic
 * 
 * Focus Areas:
 * 1. Optional field handling (null/undefined checks)
 * 2. Conditional rendering branches
 * 3. Edge cases in data formatting
 * 4. Error handling paths
 * 5. Font availability branches
 * 
 * Related: Issue #102 - Branch Coverage Improvement
 */

import { pdfService } from '../../../services/pdf.service';
import type {
  ReservationPDFData,
  PaymentConfirmationData,
  MenuCardPDFData,
  RevenueReportPDFData,
  OccupancyReportPDFData,
} from '../../../services/pdf.service';

// Mock company settings to avoid DB calls
jest.mock('../../../services/company-settings.service', () => ({
  __esModule: true,
  default: {
    getSettings: jest.fn().mockResolvedValue({
      companyName: 'Test Restaurant',
      address: 'Test Address',
      postalCode: '00-000',
      city: 'Test City',
      phone: '+48123456789',
      email: 'test@test.com',
      website: 'https://test.com',
      nip: '1234567890',
    }),
  },
}));

// Increase timeout for PDF generation
jest.setTimeout(30000);

describe('PDF Service - Branch Coverage', () => {
  describe('generateReservationPDF - Optional Fields Branches', () => {
    it('should handle reservation with minimal fields', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-001',
        client: { firstName: 'Jan', lastName: 'Kowalski', phone: '+48123456789' },
        adults: 50, children: 0, toddlers: 0, guests: 50,
        pricePerAdult: 150, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 7500, status: 'RESERVED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle optional email/address', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-002',
        client: { firstName: 'Anna', lastName: 'Nowak', phone: '+48987654321',
          email: 'anna@example.com', address: 'ul. Testowa 123' },
        adults: 100, children: 20, toddlers: 5, guests: 125,
        pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
        totalPrice: 22000, status: 'CONFIRMED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle hall information', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-003',
        client: { firstName: 'Piotr', lastName: 'Wiśniewski', phone: '+48111222333' },
        hall: { name: 'Sala Bankietowa A' },
        adults: 80, children: 0, toddlers: 0, guests: 80,
        pricePerAdult: 180, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 14400, status: 'PENDING', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle event type and custom event type', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-004',
        client: { firstName: 'Maria', lastName: 'Kowalczyk', phone: '+48444555666' },
        eventType: { name: 'Wesele', standardHours: 6, extraHourRate: 500 },
        customEventType: 'Wesele z afterparty',
        adults: 150, children: 30, toddlers: 10, guests: 190,
        pricePerAdult: 220, pricePerChild: 110, pricePerToddler: 0,
        totalPrice: 36300, status: 'CONFIRMED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle legacy date/time strings', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-005',
        client: { firstName: 'Tomasz', lastName: 'Lewandowski', phone: '+48777888999' },
        date: '2026-06-15', startTime: '15:00', endTime: '23:00',
        adults: 60, children: 0, toddlers: 0, guests: 60,
        pricePerAdult: 170, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 10200, status: 'RESERVED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle DateTime objects', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-006',
        client: { firstName: 'Katarzyna', lastName: 'Zielińska', phone: '+48222333444' },
        startDateTime: new Date('2026-08-20T16:00:00'),
        endDateTime: new Date('2026-08-21T01:00:00'),
        eventType: { name: 'Wesele', standardHours: 6, extraHourRate: 600 },
        adults: 120, children: 15, toddlers: 5, guests: 140,
        pricePerAdult: 210, pricePerChild: 105, pricePerToddler: 0,
        totalPrice: 28575, extraHoursCost: 1800,
        status: 'CONFIRMED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle birthday age', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-007',
        client: { firstName: 'Wojciech', lastName: 'Kaczmarek', phone: '+48555666777' },
        birthdayAge: 50,
        adults: 40, children: 10, toddlers: 0, guests: 50,
        pricePerAdult: 160, pricePerChild: 80, pricePerToddler: 0,
        totalPrice: 7200, status: 'CONFIRMED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle anniversary details', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-008',
        client: { firstName: 'Andrzej', lastName: 'Szymański', phone: '+48888999000' },
        anniversaryYear: 25, anniversaryOccasion: 'Srebrne Gody',
        adults: 70, children: 5, toddlers: 2, guests: 77,
        pricePerAdult: 190, pricePerChild: 95, pricePerToddler: 0,
        totalPrice: 13775, status: 'CONFIRMED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle venue surcharge', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-009',
        client: { firstName: 'Magdalena', lastName: 'Wójcik', phone: '+48333444555' },
        adults: 30, children: 0, toddlers: 0, guests: 30,
        pricePerAdult: 150, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 7500, venueSurcharge: 3000,
        venueSurchargeLabel: 'Dopłata za wyłączność obiektu',
        status: 'CONFIRMED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle notes', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-010',
        client: { firstName: 'Paweł', lastName: 'Kamiński', phone: '+48666777888' },
        adults: 50, children: 0, toddlers: 0, guests: 50,
        pricePerAdult: 140, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 7000, status: 'PENDING',
        notes: 'Wegetariańskie opcje\nDekoracje stołów',
        createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - Menu/Extras/Deposits', () => {
    it('should handle menuSnapshot', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-012',
        client: { firstName: 'Joanna', lastName: 'Jankowska', phone: '+48111222333' },
        adults: 80, children: 20, toddlers: 0, guests: 100,
        pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
        totalPrice: 18000, status: 'CONFIRMED',
        menuSnapshot: {
          id: 'MENU-001',
          menuData: {
            packageName: 'Pakiet Premium',
            dishSelections: [{
              categoryId: 'CAT-1', categoryName: 'Przystawki',
              dishes: [{ dishId: 'D1', dishName: 'Tatar', quantity: 1, allergens: ['fish'] }]
            }]
          },
          packagePrice: 150, optionsPrice: 20, totalMenuPrice: 170,
          adultsCount: 80, childrenCount: 20, toddlersCount: 0,
          selectedAt: new Date(),
        },
        createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservationExtras with multiple priceTypes', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-014',
        client: { firstName: 'Marcin', lastName: 'Piotrowski', phone: '+48777888999' },
        adults: 90, children: 0, toddlers: 0, guests: 90,
        pricePerAdult: 190, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 21100, extrasTotalPrice: 4000, status: 'CONFIRMED',
        reservationExtras: [
          { serviceItem: { name: 'DJ', priceType: 'FLAT', category: { name: 'Muzyka' } },
            quantity: 1, unitPrice: 2000, totalPrice: 2000, priceType: 'FLAT', status: 'CONFIRMED' },
          { serviceItem: { name: 'Fotobudka', priceType: 'FLAT', category: { name: 'Rozrywka' } },
            quantity: 1, unitPrice: 1500, totalPrice: 1500, priceType: 'FLAT', note: '3h', status: 'CONFIRMED' },
          { serviceItem: { name: 'Kwiaty', priceType: 'PER_UNIT', category: null },
            quantity: 5, unitPrice: 100, totalPrice: 500, priceType: 'PER_UNIT', status: 'CONFIRMED' },
          { serviceItem: { name: 'Tort', priceType: 'FREE', category: { name: 'Catering' } },
            quantity: 1, unitPrice: 0, totalPrice: 0, priceType: 'FREE', status: 'CONFIRMED' },
          { serviceItem: { name: 'Drink', priceType: 'PER_PERSON', category: { name: 'Napoje' } },
            quantity: 90, unitPrice: 15, totalPrice: 1350, priceType: 'PER_PERSON', status: 'CONFIRMED' },
        ],
        createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle single deposit (legacy) - paid', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-017',
        client: { firstName: 'Beata', lastName: 'Lis', phone: '+48888999000' },
        adults: 60, children: 0, toddlers: 0, guests: 60,
        pricePerAdult: 150, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 9000, status: 'CONFIRMED',
        deposit: { amount: 500, dueDate: '2026-05-01', status: 'PAID', paid: true },
        createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle multiple deposits array', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-018',
        client: { firstName: 'Damian', lastName: 'Czarnecki', phone: '+48333444555' },
        adults: 80, children: 0, toddlers: 0, guests: 80,
        pricePerAdult: 180, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 14400, status: 'CONFIRMED',
        deposits: [
          { amount: 500, dueDate: new Date('2026-04-15'), status: 'PAID', paid: true },
          { amount: 1000, dueDate: new Date('2026-05-15'), status: 'PENDING', paid: false },
        ],
        createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - Status Branches', () => {
    const baseReservation = {
      client: { firstName: 'Test', lastName: 'User', phone: '+48123456789' },
      adults: 50, children: 0, toddlers: 0, guests: 50,
      pricePerAdult: 150, pricePerChild: 0, pricePerToddler: 0,
      totalPrice: 7500, createdAt: new Date(),
    };

    it('should handle all statuses', async () => {
      const statuses: Array<'RESERVED' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'> = 
        ['RESERVED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
      
      for (const status of statuses) {
        const data: ReservationPDFData = { ...baseReservation, id: `TEST-${status}`, status };
        const buffer = await pdfService.generateReservationPDF(data);
        expect(buffer).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('generatePaymentConfirmationPDF', () => {
    it('should handle payment with all fields', async () => {
      const data: PaymentConfirmationData = {
        depositId: 'DEP-001', amount: 500, paidAt: new Date(),
        paymentMethod: 'TRANSFER', paymentReference: 'REF-123456',
        client: { firstName: 'Jan', lastName: 'Kowalski', phone: '+48123456789',
          email: 'jan@example.com', address: 'ul. Testowa 1' },
        reservation: { id: 'RES-001', date: '2026-06-15', startTime: '15:00', endTime: '23:00',
          hall: 'Sala A', eventType: 'Wesele', guests: 100, totalPrice: 20000 },
      };
      const buffer = await pdfService.generatePaymentConfirmationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle payment without optional fields', async () => {
      const data: PaymentConfirmationData = {
        depositId: 'DEP-002', amount: 1000, paidAt: new Date(), paymentMethod: 'CASH',
        client: { firstName: 'Anna', lastName: 'Nowak', phone: '+48987654321' },
        reservation: { id: 'RES-002', date: '2026-07-20', startTime: '16:00', endTime: '01:00',
          guests: 80, totalPrice: 15000 },
      };
      const buffer = await pdfService.generatePaymentConfirmationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle all payment methods', async () => {
      const methods: Array<'TRANSFER' | 'CASH' | 'BLIK' | 'CARD'> = ['BLIK', 'CARD'];
      for (const method of methods) {
        const data: PaymentConfirmationData = {
          depositId: `DEP-${method}`, amount: 500, paidAt: new Date(), paymentMethod: method,
          client: { firstName: 'Test', lastName: 'User', phone: '+48123456789' },
          reservation: { id: 'RES-TEST', date: '2026-08-01', startTime: '18:00', endTime: '02:00',
            guests: 50, totalPrice: 10000 },
        };
        const buffer = await pdfService.generatePaymentConfirmationPDF(data);
        expect(buffer).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('generateMenuCardPDF - Basic Tests', () => {
    it('should handle minimal menu', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Weselne', eventTypeName: 'Wesele',
        packages: [{
          name: 'Pakiet Standard', pricePerAdult: 150, pricePerChild: 75, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle full menu with all optional fields', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Premium', templateDescription: 'Ekskluzywne menu',
        variant: 'Sezon 2026', eventTypeName: 'Wesele', eventTypeColor: '#c8a45a',
        packages: [{
          name: 'Pakiet Premium', description: 'Najlepszy wybór',
          shortDescription: 'Premium 100+', pricePerAdult: 250, pricePerChild: 125, pricePerToddler: 0,
          badgeText: 'BESTSELLER', includedItems: ['Welcome drink', 'Tort'],
          courses: [{
            name: 'Przystawki', description: 'Zimne przystawki', icon: 'fork',
            minSelect: 2, maxSelect: 3,
            dishes: [{ name: 'Tatar', description: 'Świeży łosoś', allergens: ['fish'] }]
          }],
          options: [{
            name: 'Bar kawowy', description: 'Barista', category: 'Napoje',
            priceType: 'FLAT', priceAmount: 800, isRequired: true,
          }],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateMenuCardPDF - Edge Cases for Branch Coverage', () => {
    it('should handle package WITHOUT badgeText', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez badge',
        eventTypeName: 'Wesele',
        packages: [{
          name: 'Standard',
          pricePerAdult: 150,
          pricePerChild: 75,
          pricePerToddler: 0,
          courses: [],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package WITHOUT includedItems', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez included',
        eventTypeName: 'Chrzciny',
        packages: [{
          name: 'Minimalist',
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle course WITHOUT description', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez opisu',
        eventTypeName: 'Urodziny',
        packages: [{
          name: 'Pakiet A',
          pricePerAdult: 120,
          pricePerChild: 60,
          pricePerToddler: 0,
          courses: [{
            name: 'Dania główne',
            minSelect: 1,
            maxSelect: 2,
            dishes: [
              { name: 'Schabowy', description: 'Z ziemniakami' },
              { name: 'Kurczak', description: 'Pieczony' },
            ],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle EMPTY allergen map', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez alergenów',
        eventTypeName: 'Komunia',
        packages: [{
          name: 'Bezpieczny',
          pricePerAdult: 140,
          pricePerChild: 70,
          pricePerToddler: 0,
          courses: [{
            name: 'Przystawki',
            minSelect: 1,
            maxSelect: 1,
            dishes: [{ name: 'Sałatka grecka' }],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateRevenueReportPDF - Basic Tests', () => {
    it('should handle full report', async () => {
      const data: RevenueReportPDFData = {
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
      };
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle minimal report', async () => {
      const data: RevenueReportPDFData = {
        filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
        summary: {
          totalRevenue: 50000, avgRevenuePerReservation: 10000,
          totalReservations: 5, completedReservations: 5,
          pendingRevenue: 0, growthPercent: 0,
        },
        breakdown: [], byHall: [], byEventType: [],
      };
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateRevenueReportPDF - Edge Cases for Branch Coverage', () => {
    it('should handle report WITHOUT groupBy filter', async () => {
      const data: RevenueReportPDFData = {
        filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
        summary: {
          totalRevenue: 50000, avgRevenuePerReservation: 2500,
          totalReservations: 20, completedReservations: 18,
          pendingRevenue: 5000, growthPercent: 12.5,
        },
        breakdown: [], byHall: [], byEventType: [],
      };
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle report WITHOUT extrasRevenue', async () => {
      const data: RevenueReportPDFData = {
        filters: { dateFrom: '2026-02-01', dateTo: '2026-02-28', groupBy: 'week' },
        summary: {
          totalRevenue: 30000, avgRevenuePerReservation: 3000,
          totalReservations: 10, completedReservations: 9,
          pendingRevenue: 3000, growthPercent: -5.2,
        },
        breakdown: [
          { period: 'Tydzień 1', revenue: 15000, count: 5, avgRevenue: 3000 },
        ],
        byHall: [{ hallName: 'Sala A', revenue: 20000, count: 6, avgRevenue: 3333 }],
        byEventType: [{ eventTypeName: 'Wesele', revenue: 25000, count: 8, avgRevenue: 3125 }],
      };
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle report with extrasRevenue = 0', async () => {
      const data: RevenueReportPDFData = {
        filters: { dateFrom: '2026-03-01', dateTo: '2026-03-15' },
        summary: {
          totalRevenue: 20000, avgRevenuePerReservation: 2000,
          totalReservations: 10, completedReservations: 10,
          pendingRevenue: 0, growthPercent: 0, extrasRevenue: 0,
        },
        breakdown: [], byHall: [], byEventType: [],
      };
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle report WITHOUT byServiceItem', async () => {
      const data: RevenueReportPDFData = {
        filters: { dateFrom: '2026-01-01', dateTo: '2026-12-31', groupBy: 'month' },
        summary: {
          totalRevenue: 100000, avgRevenuePerReservation: 2500,
          totalReservations: 40, completedReservations: 38,
          pendingRevenue: 5000, growthPercent: 20, extrasRevenue: 15000,
        },
        breakdown: [{ period: 'Styczeń', revenue: 25000, count: 10, avgRevenue: 2500 }],
        byHall: [{ hallName: 'Sala Główna', revenue: 60000, count: 25, avgRevenue: 2400 }],
        byEventType: [{ eventTypeName: 'Wesele', revenue: 80000, count: 32, avgRevenue: 2500 }],
      };
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateOccupancyReportPDF - Basic Tests', () => {
    it('should handle full report', async () => {
      const data: OccupancyReportPDFData = {
        filters: { dateFrom: '2026-01-01', dateTo: '2026-03-31' },
        summary: {
          avgOccupancy: 75, peakDay: 'Saturday', peakHall: 'Sala A',
          totalReservations: 25, totalDaysInPeriod: 90,
        },
        halls: [{ hallName: 'Sala A', occupancy: 85, reservations: 15, avgGuestsPerReservation: 95 }],
        peakHours: [{ hour: 18, count: 12 }],
        peakDaysOfWeek: [{ dayOfWeek: 'Saturday', count: 15 }],
      };
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle report without peakHall', async () => {
      const data: OccupancyReportPDFData = {
        filters: { dateFrom: '2026-02-01', dateTo: '2026-02-28' },
        summary: {
          avgOccupancy: 50, peakDay: 'Saturday',
          totalReservations: 8, totalDaysInPeriod: 28,
        },
        halls: [], peakHours: [],
        peakDaysOfWeek: [{ dayOfWeek: 'Saturday', count: 5 }],
      };
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateOccupancyReportPDF - Edge Cases for Branch Coverage', () => {
    it('should handle report with peakHall = null', async () => {
      const data: OccupancyReportPDFData = {
        filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
        summary: {
          avgOccupancy: 45.5, peakDay: 'Saturday', peakHall: null,
          totalReservations: 15, totalDaysInPeriod: 31,
        },
        halls: [], peakHours: [], peakDaysOfWeek: [],
      };
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle report with peakHall undefined', async () => {
      const data: OccupancyReportPDFData = {
        filters: { dateFrom: '2026-02-01', dateTo: '2026-02-28' },
        summary: {
          avgOccupancy: 60, peakDay: 'Friday',
          totalReservations: 20, totalDaysInPeriod: 28,
        },
        halls: [
          { hallName: 'Sala A', occupancy: 70, reservations: 12, avgGuestsPerReservation: 80 },
        ],
        peakHours: [{ hour: 18, count: 8 }],
        peakDaysOfWeek: [{ dayOfWeek: 'Saturday', count: 10 }],
      };
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle EMPTY halls/peakHours/peakDaysOfWeek', async () => {
      const data: OccupancyReportPDFData = {
        filters: { dateFrom: '2026-03-01', dateTo: '2026-03-15' },
        summary: {
          avgOccupancy: 0, peakDay: 'Monday', peakHall: 'Brak danych',
          totalReservations: 0, totalDaysInPeriod: 15,
        },
        halls: [], peakHours: [], peakDaysOfWeek: [],
      };
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
