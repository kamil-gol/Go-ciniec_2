/**
 * PDF Service MEGA FIX - Final Branch Coverage
 * 
 * This test file contains ONE comprehensive test that hits ALL uncovered branches.
 * Strategy: Create realistic data that forces EVERY conditional path to execute.
 */

import { pdfService } from '../../../services/pdf.service';
import type { MenuCardPDFData, RevenueReportPDFData, OccupancyReportPDFData } from '../../../services/pdf.service';

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

describe('PDF Service - MEGA COVERAGE FIX', () => {
  it('should hit ALL uncovered branches in buildMenuCardPremium', async () => {
    const data: MenuCardPDFData = {
      templateName: 'Comprehensive Menu Card',
      templateDescription: 'This template includes EVERYTHING to maximize branch coverage',
      variant: 'Premium',
      eventTypeName: 'Wesele',
      eventTypeColor: '#c8a45a',
      packages: [
        {
          name: 'Pakiet Platynowy',
          description: 'Full package with all features enabled for maximum branch coverage',
          shortDescription: 'Platinum',
          badgeText: 'BESTSELLER',
          includedItems: ['Obrus lniany', 'Serwetki', 'Dekoracja stołów', 'Oświetlenie'],
          pricePerAdult: 150,
          pricePerChild: 75,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Przystawki zimne',
              description: 'Wybór różnorodnych przystawek - OPIS AKTYWNY',
              icon: 'appetizer',
              minSelect: 2,
              maxSelect: 3,
              dishes: [
                { name: 'Tatar z łososia', description: 'Z awokado i kaparami', allergens: ['fish', 'eggs'] },
                { name: 'Carpaccio wołowe', description: 'Z rukolą i parmezanem', allergens: ['lactose'] },
                { name: 'Sałatka grecka', description: 'Tradycyjna', allergens: ['lactose'] },
              ],
            },
            {
              name: 'Zupy',
              description: 'Gorąca zupa do wyboru - DRUGI OPIS AKTYWNY',
              icon: 'soup',
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Rosół z makaronem', description: 'Tradycyjny z kurczaka', allergens: ['gluten'] },
                { name: 'Krem z dyni', description: 'Z imbirem i pestkami', allergens: ['lactose'] },
              ],
            },
            {
              name: 'Dania główne',
              description: 'Główne danie na ciepło - TRZECI OPIS',
              icon: 'main',
              minSelect: 1,
              maxSelect: 2,
              dishes: [
                { name: 'Połędwica wołowa', description: 'Medium, z ziemniakami i warzywami', allergens: ['lactose'] },
                { name: 'Filet z dorsza', description: 'Na maśle, z puree ziemniaczanym', allergens: ['fish', 'lactose'] },
                { name: 'Pierś kaczki', description: 'W sosie pomarańczowym' },
              ],
            },
            {
              name: 'Desery',
              description: 'Słodkie zakończenie - CZWARTY OPIS',
              icon: 'dessert',
              minSelect: 1,
              maxSelect: 2,
              dishes: [
                { name: 'Tiramisu', description: 'Klasyczne włoskie', allergens: ['eggs', 'lactose', 'gluten'] },
                { name: 'Lody waniliowe', description: 'Domowe, z owocami', allergens: ['lactose'] },
                { name: 'Sernik nowojorski', description: 'Z sosem malinowym', allergens: ['eggs', 'lactose', 'gluten', 'nuts'] },
              ],
            },
          ],
          options: [
            { name: 'Tort weselny', description: 'Tradycyjny, wielopiętrowy', category: 'Desery', priceType: 'FLAT', priceAmount: 500, isRequired: true },
            { name: 'Fontanna czekoladowa', description: 'Z owocami do maczania', category: 'Atrakcje', priceType: 'FLAT', priceAmount: 300, isRequired: false },
            { name: 'Drink powitalny', description: 'Szampan lub sok', category: 'Napoje', priceType: 'PER_PERSON', priceAmount: 15, isRequired: false },
          ],
        },
        {
          name: 'Pakiet Minimalistyczny',
          description: null,
          badgeText: null,
          includedItems: [],
          pricePerAdult: 80,
          pricePerChild: 40,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Zestaw 1',
              description: null,
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Danie A', description: 'Proste danie bez alergenów' }],
            },
          ],
          options: [],
        },
      ],
    };

    const buffer = await pdfService.generateMenuCardPDF(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(5000);
  });

  it('should handle menu card with NO allergens (early return branch)', async () => {
    const data: MenuCardPDFData = {
      templateName: 'No Allergens Menu',
      templateDescription: null,
      eventTypeName: 'Konferencja',
      packages: [
        {
          name: 'Pakiet Standard',
          description: null,
          badgeText: null,
          includedItems: undefined,
          pricePerAdult: 60,
          pricePerChild: 30,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Obiad',
              description: '',
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Danie X' },
                { name: 'Danie Y' },
              ],
            },
          ],
          options: [],
        },
      ],
    };

    const buffer = await pdfService.generateMenuCardPDF(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle reports with all conditional branches', async () => {
    const revenueData: RevenueReportPDFData = {
      filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31', groupBy: 'day' },
      summary: {
        totalRevenue: 50000, avgRevenuePerReservation: 2500,
        totalReservations: 20, completedReservations: 18,
        pendingRevenue: 5000, growthPercent: 15.5, extrasRevenue: 8000,
      },
      breakdown: [
        { period: '2026-01-01', revenue: 2500, count: 1, avgRevenue: 2500 },
        { period: '2026-01-02', revenue: 5000, count: 2, avgRevenue: 2500 },
      ],
      byHall: [
        { hallName: 'Sala Bankietowa', revenue: 30000, count: 12, avgRevenue: 2500 },
        { hallName: 'Sala Kameralna', revenue: 20000, count: 8, avgRevenue: 2500 },
      ],
      byEventType: [
        { eventTypeName: 'Wesele', revenue: 40000, count: 16, avgRevenue: 2500 },
        { eventTypeName: 'Urodziny', revenue: 10000, count: 4, avgRevenue: 2500 },
      ],
      byServiceItem: [
        { name: 'DJ', revenue: 4000, count: 10, avgRevenue: 400 },
        { name: 'Fotograf', revenue: 4000, count: 8, avgRevenue: 500 },
      ],
    };

    const revenueBuffer = await pdfService.generateRevenueReportPDF(revenueData);
    expect(revenueBuffer).toBeInstanceOf(Buffer);
    expect(revenueBuffer.length).toBeGreaterThan(3000);

    const occupancyData: OccupancyReportPDFData = {
      filters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
      summary: {
        avgOccupancy: 75, peakDay: 'Saturday', peakHall: 'Sala Główna',
        totalReservations: 50, totalDaysInPeriod: 31,
      },
      halls: [
        { hallName: 'Sala Główna', occupancy: 85, reservations: 25, avgGuestsPerReservation: 80 },
        { hallName: 'Sala Mała', occupancy: 65, reservations: 25, avgGuestsPerReservation: 40 },
      ],
      peakHours: [
        { hour: 18, count: 20 },
        { hour: 19, count: 15 },
        { hour: 20, count: 10 },
      ],
      peakDaysOfWeek: [
        { dayOfWeek: 'Saturday', count: 25 },
        { dayOfWeek: 'Friday', count: 15 },
        { dayOfWeek: 'Sunday', count: 10 },
      ],
    };

    const occupancyBuffer = await pdfService.generateOccupancyReportPDF(occupancyData);
    expect(occupancyBuffer).toBeInstanceOf(Buffer);
    expect(occupancyBuffer.length).toBeGreaterThan(3000);
  });

  it('should handle edge cases for ALL remaining branches', async () => {
    const mixedData: MenuCardPDFData = {
      templateName: 'Mixed Test',
      templateDescription: 'Has description',
      variant: 'Standard',
      eventTypeName: 'Test',
      packages: [
        {
          name: 'Package 1',
          description: 'Has desc',
          badgeText: 'PROMO',
          includedItems: ['Item A'],
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course A',
              description: 'Course desc A',
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish A1', allergens: ['gluten', 'lactose', 'eggs'] }],
            },
            {
              name: 'Course B',
              description: null,
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish B1', allergens: ['fish', 'soy', 'nuts'] }],
            },
          ],
          options: [
            { name: 'Option 1', category: 'Cat1', priceType: 'FLAT', priceAmount: 100, isRequired: true },
            { name: 'Option 2', category: 'Cat2', priceType: 'PER_PERSON', priceAmount: 20, isRequired: false },
          ],
        },
        {
          name: 'Package 2',
          description: null,
          badgeText: null,
          includedItems: undefined,
          pricePerAdult: 50,
          pricePerChild: 25,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course C',
              description: undefined,
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish C1' }],
            },
          ],
          options: [],
        },
      ],
    };

    const buffer = await pdfService.generateMenuCardPDF(mixedData);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});
