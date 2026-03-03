/**
 * PDF Service Advanced Branch Coverage Tests
 * 
 * Purpose: Cover remaining branches to achieve 95%+ branch coverage
 * Target uncovered lines: 1092, 1133-1134, 1170-1203, 1520-1522, 1644-1666
 * 
 * Focus:
 * 1. drawImportantInfoSection with different eventDate scenarios
 * 2. Menu card premium: options, packages, courses edge cases
 * 3. Occupancy report: peakHall null/undefined handling
 * 4. Revenue report: byServiceItem conditional rendering
 * 5. Financial summary: multiple deposit types
 */

import { pdfService } from '../../../services/pdf.service';
import type {
  ReservationPDFData,
  MenuCardPDFData,
  RevenueReportPDFData,
  OccupancyReportPDFData,
} from '../../../services/pdf.service';

// Mock company settings
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

jest.setTimeout(30000);

describe('PDF Service - Advanced Branch Coverage', () => {
  describe('drawImportantInfoSection - Event Date Scenarios', () => {
    it('should handle event >30 days away (gold banner, deadline = eventDate-30d)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60); // 60 days from now

      const data: ReservationPDFData = {
        id: 'TEST-FUTURE-60D',
        client: { firstName: 'Jan', lastName: 'Kowalski', phone: '+48123456789' },
        startDateTime: futureDate,
        endDateTime: new Date(futureDate.getTime() + 6 * 60 * 60 * 1000),
        adults: 100, children: 0, toddlers: 0, guests: 100,
        pricePerAdult: 200, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 20000, status: 'CONFIRMED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle event 15 days away (orange banner, deadline = today)', async () => {
      const nearDate = new Date();
      nearDate.setDate(nearDate.getDate() + 15); // 15 days from now

      const data: ReservationPDFData = {
        id: 'TEST-NEAR-15D',
        client: { firstName: 'Anna', lastName: 'Nowak', phone: '+48987654321' },
        startDateTime: nearDate,
        endDateTime: new Date(nearDate.getTime() + 8 * 60 * 60 * 1000),
        adults: 80, children: 10, toddlers: 0, guests: 90,
        pricePerAdult: 180, pricePerChild: 90, pricePerToddler: 0,
        totalPrice: 15300, status: 'PENDING', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle event 2 days away (red banner, deadline = today)', async () => {
      const urgentDate = new Date();
      urgentDate.setDate(urgentDate.getDate() + 2); // 2 days from now

      const data: ReservationPDFData = {
        id: 'TEST-URGENT-2D',
        client: { firstName: 'Piotr', lastName: 'Kowalczyk', phone: '+48555666777' },
        startDateTime: urgentDate,
        endDateTime: new Date(urgentDate.getTime() + 5 * 60 * 60 * 1000),
        adults: 50, children: 0, toddlers: 0, guests: 50,
        pricePerAdult: 150, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 7500, status: 'CONFIRMED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation WITHOUT eventDate (no date banner)', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-NO-DATE',
        client: { firstName: 'Maria', lastName: 'Lewandowska', phone: '+48111222333' },
        adults: 70, children: 0, toddlers: 0, guests: 70,
        pricePerAdult: 140, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 9800, status: 'RESERVED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateMenuCardPDF - Options Edge Cases', () => {
    it('should handle menu with ONLY required options (no active options)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu z wymaganymi opcjami',
        eventTypeName: 'Wesele',
        packages: [{
          name: 'Pakiet All-Inclusive',
          pricePerAdult: 300, pricePerChild: 150, pricePerToddler: 0,
          courses: [],
          options: [
            { name: 'Welcome drink', description: 'Prosecco', category: 'Napoje',
              priceType: 'PER_PERSON', priceAmount: 0, isRequired: true },
            { name: 'Tort weselny', description: '3kg', category: 'Desery',
              priceType: 'FLAT', priceAmount: 0, isRequired: true },
          ],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle menu with ONLY active options (no required options)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu z opcjami dodatkowymi',
        eventTypeName: 'Komunia',
        packages: [{
          name: 'Pakiet Bazowy',
          pricePerAdult: 120, pricePerChild: 60, pricePerToddler: 0,
          courses: [],
          options: [
            { name: 'Fotobudka', description: '2h', category: 'Rozrywka',
              priceType: 'FLAT', priceAmount: 1200, isRequired: false },
            { name: 'DJ', description: '4h', category: 'Muzyka',
              priceType: 'FLAT', priceAmount: 1800, isRequired: false },
          ],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle menu with NO options at all', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez opcji',
        eventTypeName: 'Urodziny',
        packages: [{
          name: 'Prosty Pakiet',
          pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
          courses: [{
            name: 'Dania główne',
            minSelect: 1, maxSelect: 1,
            dishes: [{ name: 'Pierogi' }],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package description = null', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez opisu pakietu',
        eventTypeName: 'Wesele',
        packages: [{
          name: 'Pakiet X',
          description: null,
          pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle course with dish description = null', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu z daniami bez opisu',
        eventTypeName: 'Chrzciny',
        packages: [{
          name: 'Pakiet Standard',
          pricePerAdult: 140, pricePerChild: 70, pricePerToddler: 0,
          courses: [{
            name: 'Zupy',
            minSelect: 1, maxSelect: 1,
            dishes: [
              { name: 'Rosół', description: null },
              { name: 'Krem z dyni', description: null },
            ],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - Financial Summary Edge Cases', () => {
    it('should handle reservation WITHOUT deposit (no deposit section)', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-NO-DEPOSIT',
        client: { firstName: 'Tomasz', lastName: 'Wiśniewski', phone: '+48777888999' },
        adults: 60, children: 0, toddlers: 0, guests: 60,
        pricePerAdult: 160, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 9600, status: 'PENDING', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle deposit with paid = false (OCZEK badge)', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-UNPAID-DEPOSIT',
        client: { firstName: 'Katarzyna', lastName: 'Zielińska', phone: '+48222333444' },
        adults: 80, children: 0, toddlers: 0, guests: 80,
        pricePerAdult: 180, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 14400, status: 'RESERVED',
        deposit: { amount: 500, dueDate: '2026-04-01', status: 'PENDING', paid: false },
        createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle children > 0 AND toddlers > 0 (all guest types)', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-ALL-GUEST-TYPES',
        client: { firstName: 'Andrzej', lastName: 'Kowalczyk', phone: '+48444555666' },
        adults: 40, children: 15, toddlers: 5, guests: 60,
        pricePerAdult: 150, pricePerChild: 75, pricePerToddler: 30,
        totalPrice: 7275, status: 'CONFIRMED', createdAt: new Date(),
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateRevenueReportPDF - byServiceItem Branches', () => {
    it('should handle report WITH byServiceItem AND extrasRevenue summary', async () => {
      const data: RevenueReportPDFData = {
        filters: { dateFrom: '2026-01-01', dateTo: '2026-12-31', groupBy: 'month' },
        summary: {
          totalRevenue: 500000, avgRevenuePerReservation: 12500,
          totalReservations: 40, completedReservations: 38,
          pendingRevenue: 25000, growthPercent: 18.5,
          extrasRevenue: 85000,
        },
        breakdown: [
          { period: 'Q1 2026', revenue: 150000, count: 12, avgRevenue: 12500 },
        ],
        byHall: [
          { hallName: 'Sala Główna', revenue: 300000, count: 25, avgRevenue: 12000 },
        ],
        byEventType: [
          { eventTypeName: 'Wesele', revenue: 400000, count: 32, avgRevenue: 12500 },
        ],
        byServiceItem: [
          { name: 'DJ', revenue: 45000, count: 30, avgRevenue: 1500 },
          { name: 'Fotobudka', revenue: 25000, count: 20, avgRevenue: 1250 },
          { name: 'Dekoracje', revenue: 15000, count: 15, avgRevenue: 1000 },
        ],
      };
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle report WITH byServiceItem BUT extrasRevenue = undefined', async () => {
      const data: RevenueReportPDFData = {
        filters: { dateFrom: '2026-01-01', dateTo: '2026-06-30' },
        summary: {
          totalRevenue: 200000, avgRevenuePerReservation: 10000,
          totalReservations: 20, completedReservations: 18,
          pendingRevenue: 10000, growthPercent: 5.0,
        },
        breakdown: [],
        byHall: [],
        byEventType: [],
        byServiceItem: [
          { name: 'Bar kawowy', revenue: 8000, count: 10, avgRevenue: 800 },
        ],
      };
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateOccupancyReportPDF - peakHall Variants', () => {
    it('should handle peakHall as empty string', async () => {
      const data: OccupancyReportPDFData = {
        filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
        summary: {
          avgOccupancy: 55, peakDay: 'Saturday', peakHall: '',
          totalReservations: 12, totalDaysInPeriod: 31,
        },
        halls: [
          { hallName: 'Sala A', occupancy: 60, reservations: 8, avgGuestsPerReservation: 75 },
        ],
        peakHours: [{ hour: 19, count: 6 }],
        peakDaysOfWeek: [{ dayOfWeek: 'Saturday', count: 8 }],
      };
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle report with all sections populated', async () => {
      const data: OccupancyReportPDFData = {
        filters: { dateFrom: '2026-01-01', dateTo: '2026-12-31' },
        summary: {
          avgOccupancy: 80, peakDay: 'Saturday', peakHall: 'Sala Bankietowa',
          totalReservations: 120, totalDaysInPeriod: 365,
        },
        halls: [
          { hallName: 'Sala Bankietowa', occupancy: 90, reservations: 60, avgGuestsPerReservation: 100 },
          { hallName: 'Sala Mała', occupancy: 70, reservations: 40, avgGuestsPerReservation: 50 },
          { hallName: 'Ogród', occupancy: 65, reservations: 20, avgGuestsPerReservation: 80 },
        ],
        peakHours: [
          { hour: 18, count: 50 },
          { hour: 19, count: 40 },
          { hour: 17, count: 30 },
        ],
        peakDaysOfWeek: [
          { dayOfWeek: 'Saturday', count: 80 },
          { dayOfWeek: 'Sunday', count: 30 },
          { dayOfWeek: 'Friday', count: 10 },
        ],
      };
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Menu Card - Multiple Packages', () => {
    it('should handle menu card with 3 different packages', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Multi-Pakiet',
        templateDescription: 'Oferta dla różnych budżetów',
        variant: 'Sezon 2026',
        eventTypeName: 'Wesele',
        packages: [
          {
            name: 'Pakiet Ekonomiczny',
            description: 'Dobry wybór dla mniejszych budżetów',
            pricePerAdult: 120, pricePerChild: 60, pricePerToddler: 0,
            courses: [
              { name: 'Zupy', minSelect: 1, maxSelect: 1,
                dishes: [{ name: 'Rosół' }, { name: 'Pomidorowa' }] },
            ],
            options: [],
          },
          {
            name: 'Pakiet Standard',
            description: 'Najczęściej wybierany',
            badgeText: 'NAJPOPULARNIEJSZY',
            pricePerAdult: 180, pricePerChild: 90, pricePerToddler: 0,
            includedItems: ['Tort', 'Welcome drink'],
            courses: [
              { name: 'Przystawki', minSelect: 2, maxSelect: 3,
                dishes: [{ name: 'Tatar' }, { name: 'Carpaccio' }] },
            ],
            options: [
              { name: 'Bar kawowy', category: 'Napoje', priceType: 'FLAT',
                priceAmount: 600, isRequired: false },
            ],
          },
          {
            name: 'Pakiet Premium',
            description: 'Luksusowa uczta',
            badgeText: 'EXCLUSIVE',
            pricePerAdult: 280, pricePerChild: 140, pricePerToddler: 0,
            includedItems: ['Tort premium', 'Szampan', 'Midnight snack'],
            courses: [
              { name: 'Zimne przystawki', description: 'Wykwintne', minSelect: 3, maxSelect: 5,
                dishes: [
                  { name: 'Ostrygi', description: 'Świeże', allergens: ['shellfish'] },
                  { name: 'Foie gras', description: 'Z truflami' },
                ] },
            ],
            options: [
              { name: 'Live music', category: 'Rozrywka', priceType: 'FLAT',
                priceAmount: 3000, isRequired: true },
              { name: 'Sommelie r', category: 'Napoje', priceType: 'FLAT',
                priceAmount: 1500, isRequired: false },
            ],
          },
        ],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
