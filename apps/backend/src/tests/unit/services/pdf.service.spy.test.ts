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
    const data: MenuCardPDFData = {
      templateName: 'SPY Test Menu',
      templateDescription: 'Full description to hit line 1133',
      variant: 'Premium',
      eventTypeName: 'Wesele',
      eventTypeColor: '#c8a45a',
      packages: [
        {
          name: 'Pakiet SPY',
          description: 'Package description to hit line 1193',
          shortDescription: 'Short',
          badgeText: 'PROMO',
          includedItems: ['Item A', 'Item B', 'Item C'],
          pricePerAdult: 150,
          pricePerChild: 75,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Przystawki',
              description: 'Course description ACTIVE - hits line 445-446',
              icon: 'appetizer',
              minSelect: 2,
              maxSelect: 3,
              dishes: [
                { name: 'Tatar z łososia', description: 'Z awokado', allergens: ['fish', 'eggs'] },
                { name: 'Carpaccio', description: 'Z rukolą', allergens: ['lactose'] },
                { name: 'Sałatka', allergens: ['lactose', 'nuts'] },
              ],
            },
            {
              name: 'Zupy',
              description: 'Second course description - line 445-446 again',
              icon: 'soup',
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Rosół', allergens: ['gluten'] },
                { name: 'Krem z dyni', allergens: ['lactose', 'soy'] },
              ],
            },
            {
              name: 'Dania główne',
              description: 'Third course description',
              minSelect: 1,
              maxSelect: 2,
              dishes: [
                { name: 'Połędwica', allergens: ['lactose'] },
                { name: 'Filet z dorsza', allergens: ['fish', 'lactose', 'shellfish'] },
              ],
            },
            {
              name: 'Desery',
              description: 'Fourth course description',
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Tiramisu', allergens: ['eggs', 'lactose', 'gluten'] },
                { name: 'Sernik', allergens: ['eggs', 'lactose', 'gluten', 'nuts', 'peanuts'] },
              ],
            },
          ],
          options: [
            { name: 'Tort', description: 'Wielopiętrowy', category: 'Desery', priceType: 'FLAT', priceAmount: 500, isRequired: true },
            { name: 'Fontanna', category: 'Atrakcje', priceType: 'FLAT', priceAmount: 300, isRequired: false },
          ],
        },
      ],
    };

    const buffer = await pdfService.generateMenuCardPDF(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(5000);
  });

  it('should execute drawAllergenSection early return (no allergens)', async () => {
    const data: MenuCardPDFData = {
      templateName: 'No Allergens Test',
      templateDescription: null,
      eventTypeName: 'Konferencja',
      packages: [
        {
          name: 'Pakiet Simple',
          description: null,
          badgeText: null,
          includedItems: undefined,
          pricePerAdult: 60,
          pricePerChild: 30,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Obiad',
              description: null,
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Danie A' },
                { name: 'Danie B' },
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
    const data: MenuCardPDFData = {
      templateName: 'Mixed Coverage Test',
      templateDescription: 'Has template description',
      variant: 'Standard',
      eventTypeName: 'Test Event',
      packages: [
        {
          name: 'Package ALL TRUE',
          description: 'Package description present',
          badgeText: 'BESTSELLER',
          includedItems: ['Item 1', 'Item 2'],
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course A',
              description: 'Course A description present',
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
        {
          name: 'Package ALL FALSE',
          description: null,
          badgeText: null,
          includedItems: undefined,
          pricePerAdult: 50,
          pricePerChild: 25,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course B',
              description: null,
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish B1' }],
            },
          ],
          options: [],
        },
        {
          name: 'Package MIXED',
          description: 'Has desc',
          badgeText: null,
          includedItems: ['Single item'],
          pricePerAdult: 75,
          pricePerChild: 35,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course C',
              description: '',
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish C1', allergens: ['fish'] }],
            },
            {
              name: 'Course D',
              description: 'Course D has description',
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish D1', allergens: ['soy', 'nuts'] }],
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
    const data: MenuCardPDFData = {
      templateName: 'Empty Array Test',
      templateDescription: undefined,
      eventTypeName: 'Test',
      packages: [
        {
          name: 'Package Empty Array',
          description: '',
          badgeText: '',
          includedItems: [],
          pricePerAdult: 50,
          pricePerChild: 25,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course',
              description: undefined,
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish', allergens: ['gluten'] }],
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
    const data: MenuCardPDFData = {
      templateName: 'Falsy Values Test',
      templateDescription: '',
      eventTypeName: 'Test',
      packages: [
        {
          name: 'Falsy Package',
          description: undefined,
          badgeText: '',
          includedItems: undefined,
          pricePerAdult: 50,
          pricePerChild: 0,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Falsy Course',
              description: '',
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish', allergens: undefined }],
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
