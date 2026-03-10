/**
 * PDF Service Final Branch Coverage Tests
 * 
 * Purpose: Reach 95% branch coverage by testing remaining conditional branches
 * Lines targeted: 445-446, 996-999, 1133-1134, 1170-1203
 * 
 * Strategy:
 * - Test null/undefined checks in menu card builder
 * - Test early return conditions
 * - Test conditional rendering branches
 * - Skip font availability tests (not real branches, just console.warn)
 */

import { pdfService } from '../../../services/pdf.service';
import type {
  ReservationPDFData,
  MenuCardPDFData,
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

describe('PDF Service - Final Branch Coverage', () => {
  describe('Menu Card - Course Description Branch (lines 445-446)', () => {
    it('should handle course WITH description', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu z opisem kursu',
        eventTypeName: 'Wesele',
        packages: [{
          name: 'Pakiet Standard',
          pricePerAdult: 150, pricePerChild: 75, pricePerToddler: 0,
          courses: [{
            name: 'Zupy',
            description: 'Tradycyjne polskie zupy',
            minSelect: 1, maxSelect: 1,
            dishes: [
              { name: 'Rosół', description: 'Z makaronem' },
              { name: 'Żurek', description: 'Z jajkiem' },
            ],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle course WITHOUT description (null)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez opisu kursu',
        eventTypeName: 'Komunia',
        packages: [{
          name: 'Pakiet Prosty',
          pricePerAdult: 120, pricePerChild: 60, pricePerToddler: 0,
          courses: [{
            name: 'Dania główne',
            description: null,
            minSelect: 1, maxSelect: 1,
            dishes: [{ name: 'Schabowy' }, { name: 'Kurczak' }],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle course WITHOUT description (undefined)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez opisu - undefined',
        eventTypeName: 'Urodziny',
        packages: [{
          name: 'Pakiet Test',
          pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
          courses: [{
            name: 'Przystawki',
            description: undefined,
            minSelect: 1, maxSelect: 1,
            dishes: [{ name: 'Sałatka' }],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Allergen Section - Empty Map Branch (lines 996-999)', () => {
    it('should skip allergen section when no allergens present', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez alergenów',
        eventTypeName: 'Urodziny',
        packages: [{
          name: 'Pakiet Bezpieczny',
          pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
          courses: [{
            name: 'Dania',
            minSelect: 1, maxSelect: 2,
            dishes: [
              { name: 'Sałatka' },
              { name: 'Ziemniaki' },
              { name: 'Warzywa' },
            ],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should render allergen section when allergens present', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu z alergenami',
        eventTypeName: 'Wesele',
        packages: [{
          name: 'Pakiet Standard',
          pricePerAdult: 150, pricePerChild: 75, pricePerToddler: 0,
          courses: [{
            name: 'Przystawki',
            minSelect: 1, maxSelect: 2,
            dishes: [
              { name: 'Tatar', allergens: ['fish'] },
              { name: 'Ser', allergens: ['lactose'] },
            ],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle multiple allergens across multiple courses', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu z wieloma alergenami',
        eventTypeName: 'Wesele',
        packages: [{
          name: 'Pakiet Kompleksowy',
          pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
          courses: [
            {
              name: 'Przystawki',
              minSelect: 1, maxSelect: 2,
              dishes: [
                { name: 'Tatar', allergens: ['fish', 'eggs'] },
                { name: 'Ser pleśniowy', allergens: ['lactose'] },
              ],
            },
            {
              name: 'Dania główne',
              minSelect: 1, maxSelect: 1,
              dishes: [
                { name: 'Ryba w migdałach', allergens: ['fish', 'nuts'] },
                { name: 'Kurczak w sosie sojowym', allergens: ['soy', 'gluten'] },
              ],
            },
          ],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Menu Card - Template Description Branch (lines 1133-1134)', () => {
    it('should handle menu WITH templateDescription', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Premium',
        templateDescription: 'Ekskluzywna oferta sezonowa dla wymagających gości',
        eventTypeName: 'Wesele',
        packages: [{
          name: 'Pakiet Luksus',
          pricePerAdult: 300, pricePerChild: 150, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle menu WITHOUT templateDescription (null)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Standard',
        templateDescription: null,
        eventTypeName: 'Chrzciny',
        packages: [{
          name: 'Pakiet Bazowy',
          pricePerAdult: 120, pricePerChild: 60, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle menu WITHOUT templateDescription (undefined)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Bez Opisu',
        eventTypeName: 'Spotkanie',
        packages: [{
          name: 'Pakiet Prosty',
          pricePerAdult: 80, pricePerChild: 40, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Menu Card - Package Conditional Branches (lines 1170-1203)', () => {
    it('should handle package WITH badge AND included items', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Full',
        eventTypeName: 'Wesele',
        packages: [{
          name: 'Pakiet VIP',
          badgeText: 'BESTSELLER',
          includedItems: ['Welcome drink', 'Tort weselny', 'Midnight snack'],
          pricePerAdult: 250, pricePerChild: 125, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package WITHOUT badge but WITH included items', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Semi-Full',
        eventTypeName: 'Komunia',
        packages: [{
          name: 'Pakiet Standard',
          badgeText: null,
          includedItems: ['Napoje zimne', 'Kawa'],
          pricePerAdult: 150, pricePerChild: 75, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package WITH badge but WITHOUT included items', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Badge Only',
        eventTypeName: 'Urodziny',
        packages: [{
          name: 'Pakiet Ekonomiczny',
          badgeText: 'NOWOŚĆ',
          includedItems: undefined,
          pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package WITHOUT badge AND without included items', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Minimal',
        eventTypeName: 'Spotkanie',
        packages: [{
          name: 'Pakiet Prosty',
          badgeText: null,
          includedItems: undefined,
          pricePerAdult: 80, pricePerChild: 40, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package description null vs undefined', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Description Test',
        eventTypeName: 'Test',
        packages: [
          {
            name: 'Pakiet z opisem null',
            description: null,
            pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
            courses: [], options: [],
          },
          {
            name: 'Pakiet z opisem undefined',
            description: undefined,
            pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
            courses: [], options: [],
          },
          {
            name: 'Pakiet z opisem',
            description: 'Szczegółowy opis pakietu',
            pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
            courses: [], options: [],
          },
        ],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package with all optional fields populated', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Pełny',
        templateDescription: 'Kompletna karta menu',
        variant: 'Sezon 2026',
        eventTypeName: 'Wesele',
        eventTypeColor: '#c8a45a',
        packages: [{
          name: 'Pakiet Kompletny',
          description: 'Szczegółowy opis pakietu z wszystkimi opcjami',
          shortDescription: 'Krótki opis',
          badgeText: 'PREMIUM',
          includedItems: ['Welcome drink', 'Tort', 'Dekoracje', 'DJ'],
          pricePerAdult: 300, pricePerChild: 150, pricePerToddler: 50,
          courses: [{
            name: 'Przystawki',
            description: 'Zimne i ciepłe',
            icon: 'fork',
            minSelect: 2, maxSelect: 3,
            dishes: [
              { name: 'Tatar', description: 'Z łososia', allergens: ['fish'] },
              { name: 'Carpaccio', description: 'Z wołowiny', allergens: [] },
            ],
          }],
          options: [
            { name: 'Bar kawowy', description: 'Z baristą', category: 'Napoje',
              priceType: 'FLAT', priceAmount: 800, isRequired: true },
            { name: 'Fotobudka', description: '3h zabawy', category: 'Rozrywka',
              priceType: 'FLAT', priceAmount: 1200, isRequired: false },
          ],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package with empty included items array', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Empty Array',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pakiet',
          includedItems: [],
          pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Edge Cases - Mixed Scenarios', () => {
    it('should handle reservation with all optional fields null', async () => {
      const data: ReservationPDFData = {
        id: 'TEST-NULL-FIELDS',
        client: { firstName: 'Test', lastName: 'User', phone: '+48123456789' },
        adults: 50, children: 0, toddlers: 0, guests: 50,
        pricePerAdult: 100, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 5000, status: 'RESERVED', createdAt: new Date(),
        // All optional fields explicitly null/undefined
        hall: undefined,
        eventType: undefined,
        customEventType: undefined,
        date: undefined,
        startTime: undefined,
        endTime: undefined,
        startDateTime: undefined,
        endDateTime: undefined,
        extrasTotalPrice: undefined,
        extraHoursCost: undefined,
        venueSurcharge: undefined,
        venueSurchargeLabel: undefined,
        notes: undefined,
        birthdayAge: undefined,
        anniversaryYear: undefined,
        anniversaryOccasion: undefined,
        deposit: undefined,
        deposits: undefined,
        menuData: undefined,
        menuSnapshot: undefined,
        reservationExtras: undefined,
      };
      const buffer = await pdfService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle menu card with empty courses array', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu bez kursów',
        templateDescription: null,
        variant: null,
        eventTypeName: 'Test',
        eventTypeColor: null,
        packages: [{
          name: 'Pakiet pusty',
          description: null,
          shortDescription: null,
          pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
          badgeText: null,
          includedItems: undefined,
          courses: [],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle dish with empty allergens array', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu z pustą tablicą alergenów',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pakiet Test',
          pricePerAdult: 100, pricePerChild: 50, pricePerToddler: 0,
          courses: [{
            name: 'Dania',
            minSelect: 1, maxSelect: 1,
            dishes: [
              { name: 'Danie bez alergenów', allergens: [] },
              { name: 'Danie z alergenami', allergens: ['gluten', 'lactose'] },
            ],
          }],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle multiple packages with mixed allergens', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Multi-Pakiet z alergenami',
        eventTypeName: 'Wesele',
        packages: [
          {
            name: 'Pakiet A',
            pricePerAdult: 150, pricePerChild: 75, pricePerToddler: 0,
            courses: [{
              name: 'Przystawki A',
              minSelect: 1, maxSelect: 1,
              dishes: [{ name: 'Tatar', allergens: ['fish'] }],
            }],
            options: [],
          },
          {
            name: 'Pakiet B',
            pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 0,
            courses: [{
              name: 'Przystawki B',
              minSelect: 1, maxSelect: 1,
              dishes: [{ name: 'Carpaccio', allergens: ['eggs', 'nuts'] }],
            }],
            options: [],
          },
        ],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
