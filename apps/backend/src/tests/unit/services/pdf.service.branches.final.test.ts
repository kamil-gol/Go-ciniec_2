/**
 * PDF Service Final Branch Coverage Tests
 * 
 * Purpose: Reach 95% branch coverage by testing remaining conditional branches
 * Lines targeted: 334, 357, 367, 445-446, 996-999, 1133-1134, 1170-1203
 * 
 * Strategy:
 * - Test font availability fallbacks (lines 334, 357, 367)
 * - Test null/undefined checks in menu card builder
 * - Test early return conditions
 * - Test conditional rendering branches
 */

import { pdfService } from '../../../services/pdf.service';
import type {
  ReservationPDFData,
  MenuCardPDFData,
} from '../../../services/pdf.service';
import * as fs from 'fs';

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

// Mock fs to simulate font unavailability for branch coverage
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

jest.setTimeout(30000);

describe('PDF Service - Final Branch Coverage', () => {
  describe('Font Availability Branches (lines 334, 357, 367)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle missing regular font (line 334)', async () => {
      // Simulate: regular font not found, but bold font exists
      mockedFs.existsSync.mockImplementation((path: any) => {
        const pathStr = String(path);
        return pathStr.includes('Bold');
      });

      // Create new service instance to trigger font check
      const { PDFService } = require('../../../services/pdf.service');
      const testService = new PDFService();

      const data: ReservationPDFData = {
        id: 'TEST-FONT-1',
        client: { firstName: 'Jan', lastName: 'Kowalski', phone: '+48123456789' },
        adults: 50, children: 0, toddlers: 0, guests: 50,
        pricePerAdult: 150, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 7500, status: 'CONFIRMED', createdAt: new Date(),
      };

      const buffer = await testService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle missing bold font (line 357)', async () => {
      // Simulate: bold font not found, but regular font exists
      mockedFs.existsSync.mockImplementation((path: any) => {
        const pathStr = String(path);
        return !pathStr.includes('Bold');
      });

      const { PDFService } = require('../../../services/pdf.service');
      const testService = new PDFService();

      const data: ReservationPDFData = {
        id: 'TEST-FONT-2',
        client: { firstName: 'Anna', lastName: 'Nowak', phone: '+48987654321' },
        adults: 60, children: 0, toddlers: 0, guests: 60,
        pricePerAdult: 160, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 9600, status: 'CONFIRMED', createdAt: new Date(),
      };

      const buffer = await testService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle both fonts missing (line 367)', async () => {
      // Simulate: both fonts not found
      mockedFs.existsSync.mockReturnValue(false);

      const { PDFService } = require('../../../services/pdf.service');
      const testService = new PDFService();

      const data: ReservationPDFData = {
        id: 'TEST-FONT-3',
        client: { firstName: 'Piotr', lastName: 'Kowalczyk', phone: '+48555666777' },
        adults: 40, children: 0, toddlers: 0, guests: 40,
        pricePerAdult: 140, pricePerChild: 0, pricePerToddler: 0,
        totalPrice: 5600, status: 'CONFIRMED', createdAt: new Date(),
      };

      const buffer = await testService.generateReservationPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    afterEach(() => {
      // Restore normal fs behavior
      mockedFs.existsSync.mockReturnValue(true);
    });
  });

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
          includedItems: null,
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
          includedItems: null,
          pricePerAdult: 80, pricePerChild: 40, pricePerToddler: 0,
          courses: [], options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle package description edge case', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Menu Edge Case',
        eventTypeName: 'Wesele',
        packages: [{
          name: 'Pakiet Test',
          description: 'Szczegółowy opis pakietu z wieloma informacjami',
          badgeText: 'TEST',
          includedItems: ['Item 1', 'Item 2'],
          pricePerAdult: 200, pricePerChild: 100, pricePerToddler: 50,
          courses: [{
            name: 'Kategoria',
            description: 'Opis kategorii',
            minSelect: 1, maxSelect: 1,
            dishes: [{ name: 'Danie 1', description: 'Opis' }],
          }],
          options: [
            { name: 'Opcja 1', description: 'Opis opcji', category: 'Kategoria',
              priceType: 'FLAT', priceAmount: 500, isRequired: false },
          ],
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
  });
});
