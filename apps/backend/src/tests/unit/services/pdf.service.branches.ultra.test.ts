/**
 * PDF Service Ultra-Targeted Branch Coverage Tests
 * 
 * Purpose: Hit EXACT conditional branches that remain uncovered
 * Lines: 445-446, 996-999, 1133-1134, 1170-1203
 * 
 * Strategy: Create minimal test cases that force specific branch execution
 */

import { pdfService } from '../../../services/pdf.service';
import type { MenuCardPDFData } from '../../../services/pdf.service';

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

describe('PDF Service - Ultra-Targeted Branch Coverage', () => {
  describe('Line 445-446: course.description conditional', () => {
    it('should SKIP line 446 when course.description is null', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course 1',
              description: null, // Force FALSE branch
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish A' }],
            },
          ],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should EXECUTE line 446 when course.description is string', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course 1',
              description: 'Valid description text', // Force TRUE branch
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish A' }],
            },
          ],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should SKIP line 446 when course.description is empty string', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course 1',
              description: '', // Empty string = falsy
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Dish A' }],
            },
          ],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Line 996-999: allergenMap.size === 0 early return', () => {
    it('should EXECUTE early return when allergenMap is empty', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test No Allergens',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course 1',
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish A' }, // No allergens
                { name: 'Dish B' }, // No allergens
              ],
            },
          ],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should SKIP early return and render section when allergens exist', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test With Allergens',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course 1',
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish A', allergens: ['gluten'] }, // Force allergenMap.size > 0
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

  describe('Line 1133-1134: data.templateDescription conditional', () => {
    it('should SKIP line 1134 when templateDescription is null', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        templateDescription: null, // Force FALSE branch
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
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

    it('should EXECUTE line 1134 when templateDescription is string', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        templateDescription: 'Valid template description', // Force TRUE branch
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
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

    it('should SKIP line 1134 when templateDescription is undefined', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        templateDescription: undefined, // Force FALSE branch
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
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
  });

  describe('Lines 1170-1203: Package rendering conditionals', () => {
    it('should render package WITH badgeText (line ~1175)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          badgeText: 'PREMIUM', // Force TRUE branch
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

    it('should render package WITHOUT badgeText (line ~1175 skipped)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          badgeText: null, // Force FALSE branch
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

    it('should render package WITH description (line ~1193)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          description: 'Package description text', // Force TRUE branch
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

    it('should render package WITHOUT description (line ~1193 skipped)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          description: null, // Force FALSE branch
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

    it('should render package WITH includedItems (line ~1199)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          includedItems: ['Item 1', 'Item 2'], // Force TRUE branch (array with items)
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

    it('should render package WITHOUT includedItems null (line ~1199 skipped)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          includedItems: null, // Force FALSE branch (null)
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

    it('should render package WITHOUT includedItems undefined (line ~1199 skipped)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          includedItems: undefined, // Force FALSE branch (undefined)
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

    it('should render package WITH empty includedItems array (line ~1199 TRUE but no items)', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Test',
        eventTypeName: 'Test',
        packages: [{
          name: 'Pkg',
          includedItems: [], // Array exists but empty - should render differently
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
  });

  describe('Complex multi-branch scenarios', () => {
    it('should hit ALL positive branches in single package', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Full Test',
        templateDescription: 'Template description', // TRUE: line 1133
        eventTypeName: 'Test',
        packages: [{
          name: 'Full Package',
          badgeText: 'BEST', // TRUE: line 1175
          description: 'Package desc', // TRUE: line 1193
          includedItems: ['A', 'B'], // TRUE: line 1199
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course',
              description: 'Course desc', // TRUE: line 445
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish', allergens: ['nuts'] }, // TRUE: allergen rendering
              ],
            },
          ],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should hit ALL negative branches in single package', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Minimal Test',
        templateDescription: null, // FALSE: line 1133
        eventTypeName: 'Test',
        packages: [{
          name: 'Minimal Package',
          badgeText: null, // FALSE: line 1175
          description: null, // FALSE: line 1193
          includedItems: null, // FALSE: line 1199
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course',
              description: null, // FALSE: line 445
              minSelect: 1,
              maxSelect: 1,
              dishes: [
                { name: 'Dish' }, // No allergens = empty map
              ],
            },
          ],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should test mixed TRUE/FALSE branches', async () => {
      const data: MenuCardPDFData = {
        templateName: 'Mixed Test',
        templateDescription: 'Has description', // TRUE
        eventTypeName: 'Test',
        packages: [{
          name: 'Mixed Package',
          badgeText: null, // FALSE
          description: 'Has desc', // TRUE
          includedItems: null, // FALSE
          pricePerAdult: 100,
          pricePerChild: 50,
          pricePerToddler: 0,
          courses: [
            {
              name: 'Course A',
              description: null, // FALSE
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'X', allergens: ['soy'] }], // TRUE
            },
            {
              name: 'Course B',
              description: 'Has desc', // TRUE
              minSelect: 1,
              maxSelect: 1,
              dishes: [{ name: 'Y' }], // FALSE (no allergens)
            },
          ],
          options: [],
        }],
      };
      const buffer = await pdfService.generateMenuCardPDF(data);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
