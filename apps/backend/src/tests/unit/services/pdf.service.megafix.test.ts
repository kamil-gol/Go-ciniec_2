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
    /**
     * This single test covers:
     * - Line 445-446: course.description (TRUE)
     * - Line 996-999: allergenMap.size === 0 (FALSE - allergens exist)
     * - Line 1133-1134: data.templateDescription (TRUE)
     * - Line 1170-1203: ALL package rendering branches (TRUE)
     */
    const data: MenuCardPDFData = {
      templateName: 'Comprehensive Menu Card',
      templateDescription: 'This template includes EVERYTHING to maximize branch coverage', // TRUE: line 1133
      variant: 'Premium',
      eventTypeName: 'Wesele',
      eventTypeColor: '#c8a45a',
      packages: [
        {
          name: 'Pakiet Platynowy',
          description: 'Full package with all features enabled for maximum branch coverage', // TRUE: line 1193
          shortDescription: 'Platinum',
          badgeText: 'BESTSELLER', // TRUE: line 1175
          includedItems: ['Obrus lniany', 'Serwetki', 'Dekoracja stołów', 'Oświetlenie'], // TRUE: line 1199
          pricePerAdult: 150,
          pricePerChild: 75,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Przystawki zimne',
              description: 'Wybór różnorodnych przystawek - OPIS AKTYWNY', // TRUE: line 445-446 🎯
              icon: 'appetizer',
              minSelect: 2,
              maxSelect: 3,
              dishes: [
                {
                  name: 'Tatar z łososia',
                  description: 'Z awokado i kaparami',
                  allergens: ['fish', 'eggs'], // Forces allergenMap.size > 0
                },
                {
                  name: 'Carpaccio wołowe',
                  description: 'Z rukolą i parmezanem',
                  allergens: ['lactose'], // More allergens
                },
                {
                  name: 'Sałatka grecka',
                  description: 'Tradycyjna',
                  allergens: ['lactose'], // Overlap allergen
                },
              ],
            },
            {
              name: 'Zupy',
              description: 'Gorąca zupa do wyboru - DRUGI OPIS AKTYWNY', // TRUE: line 445-446 again 🎯
              icon: 'soup',
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                {
                  name: 'Rosół z makaronem',
                  description: 'Tradycyjny z kurczaka',
                  allergens: ['gluten'], // New allergen
                },
                {
                  name: 'Krem z dyni',
                  description: 'Z imbirem i pestkami',
                  allergens: ['lactose'], // Overlap
                },
              ],
            },
            {
              name: 'Dania główne',
              description: 'Główne danie na ciepło - TRZECI OPIS', // TRUE: line 445-446 again 🎯
              icon: 'main',
              minSelect: 1,
              maxSelect: 2,
              dishes: [
                {
                  name: 'Polędwica wołowa',
                  description: 'Medium, z ziemniakami i warzywami',
                  allergens: ['lactose'], // Overlap
                },
                {
                  name: 'Filet z dorsza',
                  description: 'Na maśle, z puree ziemniaczanym',
                  allergens: ['fish', 'lactose'], // Multiple allergens
                },
                {
                  name: 'Pierś kaczki',
                  description: 'W sosie pomarańczowym',
                },
              ],
            },
            {
              name: 'Desery',
              description: 'Słodkie zakończenie - CZWARTY OPIS', // TRUE: line 445-446 again 🎯
              icon: 'dessert',
              minSelect: 1,
              maxSelect: 2,
              dishes: [
                {
                  name: 'Tiramisu',
                  description: 'Klasyczne włoskie',
                  allergens: ['eggs', 'lactose', 'gluten'], // Many allergens
                },
                {
                  name: 'Lody waniliowe',
                  description: 'Domowe, z owocami',
                  allergens: ['lactose'], // Overlap
                },
                {
                  name: 'Sernik nowojorski',
                  description: 'Z sosem malinowym',
                  allergens: ['eggs', 'lactose', 'gluten', 'nuts'], // Maximum allergens 🎯
                },
              ],
            },
          ],
          options: [
            {
              name: 'Tort weselny',
              description: 'Tradycyjny, wielopiętrowy',
              category: 'Desery',
              priceType: 'FLAT',
              priceAmount: 500,
              isRequired: true, // Required option
            },
            {
              name: 'Fontanna czekoladowa',
              description: 'Z owocami do maczania',
              category: 'Atrakcje',
              priceType: 'FLAT',
              priceAmount: 300,
              isRequired: false, // Optional
            },
            {
              name: 'Drink powitalny',
              description: 'Szampan lub sok',
              category: 'Napoje',
              priceType: 'PER_PERSON',
              priceAmount: 15,
              isRequired: false, // Optional
            },
          ],
        },
        // Second package to test repeated logic
        {
          name: 'Pakiet Minimalistyczny',
          description: null, // FALSE: line 1193
          badgeText: null, // FALSE: line 1175
          includedItems: [], // TRUE but empty: line 1199
          pricePerAdult: 80,
          pricePerChild: 40,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Zestaw 1',
              description: null, // FALSE: line 445-446 (test negative branch)
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                {
                  name: 'Danie A',
                  description: 'Proste danie bez alergenów',
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
    expect(buffer.length).toBeGreaterThan(5000);
  });

  it('should handle menu card with NO allergens (early return branch)', async () => {
    /**
     * Line 996-999: allergenMap.size === 0 → early return
     */
    const data: MenuCardPDFData = {
      templateName: 'No Allergens Menu',
      templateDescription: null, // FALSE: line 1133
      eventTypeName: 'Konferencja',
      packages: [
        {
          name: 'Pakiet Standard',
          description: null,
          badgeText: null,
          includedItems: undefined, // FALSE: line 1199 (undefined)
          pricePerAdult: 60,
          pricePerChild: 30,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Obiad',
              description: '', // FALSE: line 445-446 (empty string)
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Danie X' }, // No allergens
                { name: 'Danie Y' }, // No allergens
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
    /**
     * Cover remaining branches in report generators
     */
    
    // Revenue report with extras
    const revenueData: RevenueReportPDFData = {
      filters: {
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        groupBy: 'day',
      },
      summary: {
        totalRevenue: 50000,
        avgRevenuePerReservation: 2500,
        totalReservations: 20,
        completedReservations: 18,
        pendingRevenue: 5000,
        growthPercent: 15.5,
        extrasRevenue: 8000, // This enables extras section
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

    // Occupancy report
    const occupancyData: OccupancyReportPDFData = {
      filters: {
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      },
      summary: {
        avgOccupancy: 75,
        peakDay: 'Saturday',
        peakHall: 'Sala Główna',
        totalReservations: 50,
        totalDaysInPeriod: 31,
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
    /**
     * Final edge cases to maximize coverage
     */
    
    // Menu card with mixed TRUE/FALSE branches
    const mixedData: MenuCardPDFData = {
      templateName: 'Mixed Test',
      templateDescription: 'Has description', // TRUE
      variant: 'Standard',
      eventTypeName: 'Test',
      packages: [
        {
          name: 'Package 1',
          description: 'Has desc', // TRUE
          badgeText: 'PROMO', // TRUE
          includedItems: ['Item A'], // TRUE with items
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course A',
              description: 'Course desc A', // TRUE
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish A1', allergens: ['gluten', 'lactose', 'eggs'] },
              ],
            },
            {
              name: 'Course B',
              description: null, // FALSE
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish B1', allergens: ['fish', 'soy', 'nuts'] },
              ],
            },
          ],
          options: [
            { name: 'Option 1', category: 'Cat1', priceType: 'FLAT', priceAmount: 100, isRequired: true },
            { name: 'Option 2', category: 'Cat2', priceType: 'PER_PERSON', priceAmount: 20, isRequired: false },
          ],
        },
        {
          name: 'Package 2',
          description: null, // FALSE
          badgeText: null, // FALSE
          includedItems: null, // FALSE (null)
          pricePerAdult: 50,
          pricePerChild: 25,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course C',
              description: undefined, // FALSE (undefined)
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish C1' }, // No allergens
              ],
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
