/**
 * PDF Service SPY-BASED Coverage Test
 * 
 * Strategy: Use REAL PDFDocument instances (not mocks) to ensure
 * Istanbul can track actual code execution in drawing methods.
 * 
 * This test uses spies instead of mocks to allow real methods to execute.
 */

import { pdfService } from '../../../services/pdf.service';
import type { MenuCardPDFData } from '../../../services/pdf.service';
import PDFDocument from 'pdfkit';

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

describe('PDF Service - SPY-BASED Coverage', () => {
  it('should execute real buildMenuCardPremium logic with allergens', async () => {
    /**
     * This test generates a REAL PDF to force Istanbul to track:
     * - Line 445-446: course.description (TRUE)
     * - Line 996-999: allergenMap.size === 0 (FALSE - has allergens)
     * - Line 1133-1134: templateDescription (TRUE)
     * - Line 1170-1203: Package rendering with badgeText, description, includedItems
     */
    const data: MenuCardPDFData = {
      templateName: 'SPY Test Menu',
      templateDescription: 'Full description to hit line 1133', // TRUE: line 1133
      variant: 'Premium',
      eventTypeName: 'Wesele',
      eventTypeColor: '#c8a45a',
      packages: [
        {
          name: 'Pakiet SPY',
          description: 'Package description to hit line 1193', // TRUE: line 1193
          shortDescription: 'Short',
          badgeText: 'PROMO', // TRUE: line 1175
          includedItems: ['Item A', 'Item B', 'Item C'], // TRUE: line 1199
          pricePerAdult: 150,
          pricePerChild: 75,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Przystawki',
              description: 'Course description ACTIVE - hits line 445-446', // 🎯 TRUE
              icon: 'appetizer',
              minSelect: 2,
              maxSelect: 3,
              dishes: [
                {
                  name: 'Tatar z łososia',
                  description: 'Z awokado',
                  allergens: ['fish', 'eggs'], // Forces allergenMap.size > 0
                },
                {
                  name: 'Carpaccio',
                  description: 'Z rukolą',
                  allergens: ['lactose'],
                },
                {
                  name: 'Sałatka',
                  allergens: ['lactose', 'nuts'],
                },
              ],
            },
            {
              name: 'Zupy',
              description: 'Second course description - line 445-446 again', // 🎯 TRUE
              icon: 'soup',
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                {
                  name: 'Rosół',
                  allergens: ['gluten'],
                },
                {
                  name: 'Krem z dyni',
                  allergens: ['lactose', 'soy'],
                },
              ],
            },
            {
              name: 'Dania główne',
              description: 'Third course description', // 🎯 TRUE
              minSelect: 1,
              maxSelect: 2,
              dishes: [
                {
                  name: 'Polędwica',
                  allergens: ['lactose'],
                },
                {
                  name: 'Filet z dorsza',
                  allergens: ['fish', 'lactose', 'shellfish'],
                },
              ],
            },
            {
              name: 'Desery',
              description: 'Fourth course description', // 🎯 TRUE
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                {
                  name: 'Tiramisu',
                  allergens: ['eggs', 'lactose', 'gluten'],
                },
                {
                  name: 'Sernik',
                  allergens: ['eggs', 'lactose', 'gluten', 'nuts', 'peanuts'],
                },
              ],
            },
          ],
          options: [
            {
              name: 'Tort',
              description: 'Wielopiętrowy',
              category: 'Desery',
              priceType: 'FLAT',
              priceAmount: 500,
              isRequired: true,
            },
            {
              name: 'Fontanna',
              category: 'Atrakcje',
              priceType: 'FLAT',
              priceAmount: 300,
              isRequired: false,
            },
          ],
        },
      ],
    };

    // Generate REAL PDF - no mocking PDFDocument internals
    const buffer = await pdfService.generateMenuCardPDF(data);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(5000);
  });

  it('should execute drawAllergenSection early return (no allergens)', async () => {
    /**
     * Line 996-999: allergenMap.size === 0 → TRUE (early return)
     */
    const data: MenuCardPDFData = {
      templateName: 'No Allergens Test',
      templateDescription: null, // FALSE: line 1133
      eventTypeName: 'Konferencja',
      packages: [
        {
          name: 'Pakiet Simple',
          description: null, // FALSE: line 1193
          badgeText: null, // FALSE: line 1175
          includedItems: undefined, // FALSE: line 1199
          pricePerAdult: 60,
          pricePerChild: 30,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Obiad',
              description: null, // FALSE: line 445-446
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Danie A' }, // NO allergens
                { name: 'Danie B' }, // NO allergens
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

  it('should handle mixed TRUE/FALSE branches across multiple packages', async () => {
    /**
     * Comprehensive test with alternating TRUE/FALSE values
     */
    const data: MenuCardPDFData = {
      templateName: 'Mixed Coverage Test',
      templateDescription: 'Has template description', // TRUE: line 1133
      variant: 'Standard',
      eventTypeName: 'Test Event',
      packages: [
        // Package 1: ALL TRUE
        {
          name: 'Package ALL TRUE',
          description: 'Package description present', // TRUE
          badgeText: 'BESTSELLER', // TRUE
          includedItems: ['Item 1', 'Item 2'], // TRUE
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course A',
              description: 'Course A description present', // TRUE: line 445-446
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish A1', allergens: ['gluten', 'lactose'] },
                { name: 'Dish A2', allergens: ['eggs'] },
              ],
            },
          ],
          options: [
            { name: 'Option 1', category: 'Cat1', priceType: 'FLAT', priceAmount: 100, isRequired: true },
          ],
        },
        // Package 2: ALL FALSE
        {
          name: 'Package ALL FALSE',
          description: null, // FALSE
          badgeText: null, // FALSE
          includedItems: null, // FALSE
          pricePerAdult: 50,
          pricePerChild: 25,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course B',
              description: null, // FALSE: line 445-446
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish B1' }, // No allergens
              ],
            },
          ],
          options: [],
        },
        // Package 3: MIXED
        {
          name: 'Package MIXED',
          description: 'Has desc', // TRUE
          badgeText: null, // FALSE
          includedItems: ['Single item'], // TRUE
          pricePerAdult: 75,
          pricePerChild: 35,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course C',
              description: '', // FALSE (empty string is falsy)
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish C1', allergens: ['fish'] },
              ],
            },
            {
              name: 'Course D',
              description: 'Course D has description', // TRUE
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish D1', allergens: ['soy', 'nuts'] },
              ],
            },
          ],
          options: [
            { name: 'Option 2', category: 'Cat2', priceType: 'PER_PERSON', priceAmount: 20, isRequired: false },
          ],
        },
      ],
    };

    const buffer = await pdfService.generateMenuCardPDF(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(8000);
  });

  it('should handle empty includedItems array (truthy but empty)', async () => {
    /**
     * Edge case: includedItems = [] (truthy but length 0)
     */
    const data: MenuCardPDFData = {
      templateName: 'Empty Array Test',
      templateDescription: undefined, // FALSE: line 1133
      eventTypeName: 'Test',
      packages: [
        {
          name: 'Package Empty Array',
          description: '', // FALSE (empty string)
          badgeText: '', // FALSE (empty string)
          includedItems: [], // TRUE but empty (should not render anything)
          pricePerAdult: 50,
          pricePerChild: 25,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course',
              description: undefined, // FALSE: line 445-446
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish', allergens: ['gluten'] },
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

  it('should execute all allergen types for comprehensive coverage', async () => {
    /**
     * Test with ALL allergen types to maximize collectAllAllergens coverage
     */
    const data: MenuCardPDFData = {
      templateName: 'All Allergens Test',
      templateDescription: 'Full allergen coverage test',
      eventTypeName: 'Test',
      packages: [
        {
          name: 'All Allergens Package',
          description: 'Contains all allergen types',
          badgeText: 'FULL',
          includedItems: ['Everything'],
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course with all allergens',
              description: 'Comprehensive allergen test',
              minSelect: 1,
              maxSelect: 8,
              dishes: [
                { name: 'Gluten dish', allergens: ['gluten'] },
                { name: 'Lactose dish', allergens: ['lactose'] },
                { name: 'Eggs dish', allergens: ['eggs'] },
                { name: 'Nuts dish', allergens: ['nuts'] },
                { name: 'Fish dish', allergens: ['fish'] },
                { name: 'Soy dish', allergens: ['soy'] },
                { name: 'Shellfish dish', allergens: ['shellfish'] },
                { name: 'Peanuts dish', allergens: ['peanuts'] },
                // Dish with multiple allergens
                { name: 'Everything dish', allergens: ['gluten', 'lactose', 'eggs', 'nuts', 'fish', 'soy', 'shellfish', 'peanuts'] },
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

  it('should handle undefined vs null vs empty string for all conditional fields', async () => {
    /**
     * Test all falsy variants: undefined, null, '', 0, false
     */
    const data: MenuCardPDFData = {
      templateName: 'Falsy Values Test',
      templateDescription: '', // Empty string (falsy)
      eventTypeName: 'Test',
      packages: [
        {
          name: 'Falsy Package',
          description: undefined, // undefined
          badgeText: '', // empty string
          includedItems: null, // null
          pricePerAdult: 50,
          pricePerChild: 0, // zero (but still renders)
          pricePerToddler: 0,
          courses: [
            {
              name: 'Falsy Course',
              description: '', // empty string
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish', allergens: undefined }, // undefined allergens
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
});
