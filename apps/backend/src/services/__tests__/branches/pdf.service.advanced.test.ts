import { pdfService } from '../../../services/pdf.service';
import type { 
  MenuCardPDFData, 
  RevenueReportPDFData, 
  OccupancyReportPDFData 
} from '../../../services/pdf.service';

describe('PDFService - Advanced Branch Coverage', () => {
  
  // ═══════════════════════════════════════════════════════════
  // MENU CARD PDF - Edge Cases
  // ═══════════════════════════════════════════════════════════
  
  describe('generateMenuCardPDF - Edge Cases', () => {
    
    it('should handle package WITHOUT badgeText', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez badge',
        eventTypeName: 'Wesele',
        packages: [
          {
            name: 'Standard',
            pricePerAdult: 150,
            pricePerChild: 75,
            pricePerToddler: 0,
            // NO badgeText
            courses: [],
            options: [],
          },
        ],
      };
      
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle package WITHOUT includedItems', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez included',
        eventTypeName: 'Chrzciny',
        packages: [
          {
            name: 'Minimalist',
            pricePerAdult: 100,
            pricePerChild: 50,
            pricePerToddler: 0,
            // NO includedItems
            courses: [],
            options: [],
          },
        ],
      };
      
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle course WITHOUT description', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez opisu course',
        eventTypeName: 'Urodziny',
        packages: [
          {
            name: 'Pakiet A',
            pricePerAdult: 120,
            pricePerChild: 60,
            pricePerToddler: 0,
            courses: [
              {
                name: 'Dania główne',
                // NO description
                minSelect: 1,
                maxSelect: 2,
                dishes: [
                  { name: 'Schabowy', description: 'Z ziemniakami' },
                  { name: 'Kurczak', description: 'Pieczony' },
                ],
              },
            ],
            options: [],
          },
        ],
      };
      
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle EMPTY allergen map (no allergens in any dish)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez alergenów',
        eventTypeName: 'Komunia',
        packages: [
          {
            name: 'Bezpieczny',
            pricePerAdult: 140,
            pricePerChild: 70,
            pricePerToddler: 0,
            courses: [
              {
                name: 'Przystawki',
                minSelect: 1,
                maxSelect: 1,
                dishes: [
                  { 
                    name: 'Sałatka grecka',
                    // NO allergens
                  },
                ],
              },
            ],
            options: [],
          },
        ],
      };
      
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle package WITH badgeText AND includedItems', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Premium Full',
        eventTypeName: 'Wesele',
        packages: [
          {
            name: 'VIP',
            badgeText: 'BESTSELLER',
            description: 'Najbardziej popularny',
            pricePerAdult: 200,
            pricePerChild: 100,
            pricePerToddler: 0,
            includedItems: ['Tort', 'Wino', 'Dekoracje'],
            courses: [
              {
                name: 'Przystawki',
                description: 'Zimne i ciepłe',
                minSelect: 2,
                maxSelect: 3,
                dishes: [
                  { name: 'Tatar', description: 'Wołowy', allergens: ['eggs'] },
                  { name: 'Łosoś', description: 'Wędzony', allergens: ['fish'] },
                  { name: 'Carpaccio', allergens: ['lactose'] },
                ],
              },
            ],
            options: [
              {
                name: 'Fontanna czekoladowa',
                category: 'Deser',
                priceType: 'FLAT',
                priceAmount: 300,
                isRequired: true,
              },
              {
                name: 'Barmani',
                category: 'Obsługa',
                priceType: 'FLAT',
                priceAmount: 500,
                isRequired: false,
              },
            ],
          },
        ],
      };
      
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // REVENUE REPORT PDF - Edge Cases
  // ═══════════════════════════════════════════════════════════
  
  describe('generateRevenueReportPDF - Edge Cases', () => {
    
    it('should handle report WITHOUT groupBy filter', async () => {
      const data: RevenueReportPDFData = {
        filters: {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
          // NO groupBy
        },
        summary: {
          totalRevenue: 50000,
          avgRevenuePerReservation: 2500,
          totalReservations: 20,
          completedReservations: 18,
          pendingRevenue: 5000,
          growthPercent: 12.5,
        },
        breakdown: [],
        byHall: [],
        byEventType: [],
      };
      
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle report WITHOUT extrasRevenue', async () => {
      const data: RevenueReportPDFData = {
        filters: {
          dateFrom: '2026-02-01',
          dateTo: '2026-02-28',
          groupBy: 'week',
        },
        summary: {
          totalRevenue: 30000,
          avgRevenuePerReservation: 3000,
          totalReservations: 10,
          completedReservations: 9,
          pendingRevenue: 3000,
          growthPercent: -5.2,
          // NO extrasRevenue
        },
        breakdown: [
          { period: 'Tydzień 1', revenue: 15000, count: 5, avgRevenue: 3000 },
          { period: 'Tydzień 2', revenue: 15000, count: 5, avgRevenue: 3000 },
        ],
        byHall: [
          { hallName: 'Sala A', revenue: 20000, count: 6, avgRevenue: 3333 },
          { hallName: 'Sala B', revenue: 10000, count: 4, avgRevenue: 2500 },
        ],
        byEventType: [
          { eventTypeName: 'Wesele', revenue: 25000, count: 8, avgRevenue: 3125 },
          { eventTypeName: 'Urodziny', revenue: 5000, count: 2, avgRevenue: 2500 },
        ],
      };
      
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle report with extrasRevenue = 0', async () => {
      const data: RevenueReportPDFData = {
        filters: {
          dateFrom: '2026-03-01',
          dateTo: '2026-03-15',
        },
        summary: {
          totalRevenue: 20000,
          avgRevenuePerReservation: 2000,
          totalReservations: 10,
          completedReservations: 10,
          pendingRevenue: 0,
          growthPercent: 0,
          extrasRevenue: 0, // explicitly 0
        },
        breakdown: [],
        byHall: [],
        byEventType: [],
      };
      
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle report WITHOUT byServiceItem array', async () => {
      const data: RevenueReportPDFData = {
        filters: {
          dateFrom: '2026-01-01',
          dateTo: '2026-12-31',
          groupBy: 'month',
        },
        summary: {
          totalRevenue: 100000,
          avgRevenuePerReservation: 2500,
          totalReservations: 40,
          completedReservations: 38,
          pendingRevenue: 5000,
          growthPercent: 20,
          extrasRevenue: 15000,
        },
        breakdown: [
          { period: 'Styczeń', revenue: 25000, count: 10, avgRevenue: 2500 },
        ],
        byHall: [
          { hallName: 'Sala Główna', revenue: 60000, count: 25, avgRevenue: 2400 },
        ],
        byEventType: [
          { eventTypeName: 'Wesele', revenue: 80000, count: 32, avgRevenue: 2500 },
        ],
        // NO byServiceItem
      };
      
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle report WITH byServiceItem (full extras path)', async () => {
      const data: RevenueReportPDFData = {
        filters: {
          dateFrom: '2026-01-01',
          dateTo: '2026-06-30',
        },
        summary: {
          totalRevenue: 75000,
          avgRevenuePerReservation: 3000,
          totalReservations: 25,
          completedReservations: 24,
          pendingRevenue: 3000,
          growthPercent: 15,
          extrasRevenue: 12000,
        },
        breakdown: [],
        byHall: [],
        byEventType: [],
        byServiceItem: [
          { name: 'DJ', revenue: 5000, count: 10, avgRevenue: 500 },
          { name: 'Fotograf', revenue: 4000, count: 8, avgRevenue: 500 },
          { name: 'Dekoracje', revenue: 3000, count: 15, avgRevenue: 200 },
        ],
      };
      
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle EMPTY breakdown/byHall/byEventType arrays', async () => {
      const data: RevenueReportPDFData = {
        filters: {
          dateFrom: '2026-07-01',
          dateTo: '2026-07-31',
        },
        summary: {
          totalRevenue: 0,
          avgRevenuePerReservation: 0,
          totalReservations: 0,
          completedReservations: 0,
          pendingRevenue: 0,
          growthPercent: 0,
        },
        breakdown: [], // empty
        byHall: [], // empty
        byEventType: [], // empty
      };
      
      const buffer = await pdfService.generateRevenueReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // OCCUPANCY REPORT PDF - Edge Cases
  // ═══════════════════════════════════════════════════════════
  
  describe('generateOccupancyReportPDF - Edge Cases', () => {
    
    it('should handle report with peakHall = null', async () => {
      const data: OccupancyReportPDFData = {
        filters: {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
        },
        summary: {
          avgOccupancy: 45.5,
          peakDay: 'Saturday',
          peakHall: null, // NO peak hall
          totalReservations: 15,
          totalDaysInPeriod: 31,
        },
        halls: [],
        peakHours: [],
        peakDaysOfWeek: [],
      };
      
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle report with peakHall undefined (edge case)', async () => {
      const data: OccupancyReportPDFData = {
        filters: {
          dateFrom: '2026-02-01',
          dateTo: '2026-02-28',
        },
        summary: {
          avgOccupancy: 60,
          peakDay: 'Friday',
          // peakHall: undefined (not provided)
          totalReservations: 20,
          totalDaysInPeriod: 28,
        },
        halls: [
          { hallName: 'Sala A', occupancy: 70, reservations: 12, avgGuestsPerReservation: 80 },
          { hallName: 'Sala B', occupancy: 50, reservations: 8, avgGuestsPerReservation: 60 },
        ],
        peakHours: [
          { hour: 18, count: 8 },
          { hour: 19, count: 6 },
        ],
        peakDaysOfWeek: [
          { dayOfWeek: 'Saturday', count: 10 },
          { dayOfWeek: 'Sunday', count: 7 },
        ],
      };
      
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle EMPTY halls/peakHours/peakDaysOfWeek arrays', async () => {
      const data: OccupancyReportPDFData = {
        filters: {
          dateFrom: '2026-03-01',
          dateTo: '2026-03-15',
        },
        summary: {
          avgOccupancy: 0,
          peakDay: 'Monday',
          peakHall: 'Brak danych',
          totalReservations: 0,
          totalDaysInPeriod: 15,
        },
        halls: [], // empty
        peakHours: [], // empty
        peakDaysOfWeek: [], // empty
      };
      
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle full occupancy report with all data', async () => {
      const data: OccupancyReportPDFData = {
        filters: {
          dateFrom: '2026-04-01',
          dateTo: '2026-04-30',
        },
        summary: {
          avgOccupancy: 75.5,
          peakDay: 'Saturday',
          peakHall: 'Sala Główna',
          totalReservations: 35,
          totalDaysInPeriod: 30,
        },
        halls: [
          { hallName: 'Sala Główna', occupancy: 85, reservations: 20, avgGuestsPerReservation: 100 },
          { hallName: 'Sala Mała', occupancy: 65, reservations: 15, avgGuestsPerReservation: 50 },
        ],
        peakHours: [
          { hour: 17, count: 5 },
          { hour: 18, count: 12 },
          { hour: 19, count: 10 },
        ],
        peakDaysOfWeek: [
          { dayOfWeek: 'Saturday', count: 15 },
          { dayOfWeek: 'Friday', count: 10 },
          { dayOfWeek: 'Sunday', count: 8 },
        ],
      };
      
      const buffer = await pdfService.generateOccupancyReportPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
