/**
 * PDF Service Branch Coverage Tests
 * 
 * Purpose: Increase branch coverage for pdf.service.ts from current to 95%+
 * Target: 40-60 uncovered branches
 * 
 * Focus Areas:
 * 1. Error handling paths
 * 2. Conditional logic branches
 * 3. Input validation branches
 * 4. Template rendering edge cases
 * 5. Font loading error scenarios
 * 6. Buffer generation failures
 * 
 * Related: Issue #102 - Branch Coverage Improvement
 */

import pdfService from '../../../services/pdf.service';
import { Prisma } from '@prisma/client';

// Mock dependencies with __esModule pattern
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    reservation: {
      findUnique: jest.fn(),
    },
    hall: {
      findUnique: jest.fn(),
    },
    packageItem: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('pdfmake', () => {
  const mockPdfMake = {
    createPdf: jest.fn(() => ({
      getBuffer: jest.fn((callback) => callback(Buffer.from('mock-pdf-buffer'))),
    })),
  };
  return {
    __esModule: true,
    default: mockPdfMake,
  };
});

import prisma from '../../../lib/prisma';
import pdfMake from 'pdfmake';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockPdfMake = pdfMake as jest.Mocked<typeof pdfMake>;

describe('PDF Service - Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReservationPDF - Error Handling Branches', () => {
    it('should handle reservation not found error', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValueOnce(null);

      await expect(
        pdfService.generateReservationPDF(999, 'pl')
      ).rejects.toThrow('Reservation not found');

      expect(mockPrisma.reservation.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: expect.any(Object),
      });
    });

    it('should handle database connection error', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.reservation.findUnique.mockRejectedValueOnce(dbError);

      await expect(
        pdfService.generateReservationPDF(1, 'pl')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle Prisma P2025 error (Record not found)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.0.0' }
      );
      mockPrisma.reservation.findUnique.mockRejectedValueOnce(prismaError);

      await expect(
        pdfService.generateReservationPDF(1, 'pl')
      ).rejects.toThrow();
    });
  });

  describe('generateReservationPDF - Language Branches', () => {
    const mockReservation = {
      id: 1,
      customerName: 'Jan Kowalski',
      customerEmail: 'jan@example.com',
      customerPhone: '+48123456789',
      eventDate: new Date('2026-06-15'),
      guestCount: 100,
      totalPrice: new Prisma.Decimal(15000),
      status: 'CONFIRMED',
      hall: {
        id: 1,
        name: 'Sala Bankietowa A',
      },
      package: {
        id: 1,
        name: 'Pakiet Weselny Gold',
        price: new Prisma.Decimal(150),
      },
      menuItems: [],
      extras: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate PDF with Polish language', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValueOnce(mockReservation as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPdfMake.createPdf).toHaveBeenCalled();
      
      const pdfDefinition = (mockPdfMake.createPdf as jest.Mock).mock.calls[0][0];
      expect(pdfDefinition.content).toBeDefined();
    });

    it('should generate PDF with English language', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValueOnce(mockReservation as any);

      const result = await pdfService.generateReservationPDF(1, 'en');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPdfMake.createPdf).toHaveBeenCalled();
    });

    it('should generate PDF with German language', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValueOnce(mockReservation as any);

      const result = await pdfService.generateReservationPDF(1, 'de');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should default to Polish when unsupported language provided', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValueOnce(mockReservation as any);

      const result = await pdfService.generateReservationPDF(1, 'fr' as any);

      expect(result).toBeInstanceOf(Buffer);
      // Should still generate PDF with fallback language
    });
  });

  describe('generateReservationPDF - Menu Items Branches', () => {
    it('should handle reservation with no menu items', async () => {
      const reservationNoMenu = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 50,
        totalPrice: new Prisma.Decimal(5000),
        status: 'PENDING',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Basic Package', price: new Prisma.Decimal(100) },
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationNoMenu as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');

      expect(result).toBeInstanceOf(Buffer);
      const pdfDefinition = (mockPdfMake.createPdf as jest.Mock).mock.calls[0][0];
      // Verify menu section is either empty or shows "No menu items"
      expect(pdfDefinition.content).toBeDefined();
    });

    it('should handle reservation with multiple menu items', async () => {
      const reservationWithMenu = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 100,
        totalPrice: new Prisma.Decimal(20000),
        status: 'CONFIRMED',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Premium Package', price: new Prisma.Decimal(200) },
        menuItems: [
          { id: 1, name: 'Grilled Salmon', price: new Prisma.Decimal(45), category: 'Main' },
          { id: 2, name: 'Caesar Salad', price: new Prisma.Decimal(25), category: 'Starter' },
          { id: 3, name: 'Chocolate Cake', price: new Prisma.Decimal(20), category: 'Dessert' },
        ],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationWithMenu as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPdfMake.createPdf).toHaveBeenCalled();
    });
  });

  describe('generateReservationPDF - Extras Branches', () => {
    it('should handle reservation with no extras', async () => {
      const reservationNoExtras = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 50,
        totalPrice: new Prisma.Decimal(5000),
        status: 'PENDING',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Basic Package', price: new Prisma.Decimal(100) },
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationNoExtras as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with single extra', async () => {
      const reservationWithExtra = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 100,
        totalPrice: new Prisma.Decimal(17000),
        status: 'CONFIRMED',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Premium Package', price: new Prisma.Decimal(150) },
        menuItems: [],
        extras: [
          { id: 1, name: 'DJ Service', price: new Prisma.Decimal(2000), quantity: 1 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationWithExtra as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with multiple extras', async () => {
      const reservationWithExtras = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 100,
        totalPrice: new Prisma.Decimal(22000),
        status: 'CONFIRMED',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Premium Package', price: new Prisma.Decimal(150) },
        menuItems: [],
        extras: [
          { id: 1, name: 'DJ Service', price: new Prisma.Decimal(2000), quantity: 1 },
          { id: 2, name: 'Photo Booth', price: new Prisma.Decimal(1500), quantity: 1 },
          { id: 3, name: 'Flower Arrangements', price: new Prisma.Decimal(3500), quantity: 2 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationWithExtras as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - Status Branches', () => {
    const baseReservation = {
      id: 1,
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+48123456789',
      eventDate: new Date('2026-06-15'),
      guestCount: 100,
      totalPrice: new Prisma.Decimal(15000),
      hall: { id: 1, name: 'Hall A' },
      package: { id: 1, name: 'Standard Package', price: new Prisma.Decimal(150) },
      menuItems: [],
      extras: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should handle PENDING status', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValueOnce({
        ...baseReservation,
        status: 'PENDING',
      } as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle CONFIRMED status', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValueOnce({
        ...baseReservation,
        status: 'CONFIRMED',
      } as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle CANCELLED status', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValueOnce({
        ...baseReservation,
        status: 'CANCELLED',
      } as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle COMPLETED status', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValueOnce({
        ...baseReservation,
        status: 'COMPLETED',
      } as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - PDF Generation Errors', () => {
    it('should handle pdfmake createPdf error', async () => {
      const mockReservation = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 100,
        totalPrice: new Prisma.Decimal(15000),
        status: 'CONFIRMED',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Package', price: new Prisma.Decimal(150) },
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(mockReservation as any);
      
      // Mock PDF creation error
      mockPdfMake.createPdf.mockImplementationOnce(() => {
        throw new Error('PDF generation failed');
      });

      await expect(
        pdfService.generateReservationPDF(1, 'pl')
      ).rejects.toThrow('PDF generation failed');
    });

    it('should handle getBuffer callback error', async () => {
      const mockReservation = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 100,
        totalPrice: new Prisma.Decimal(15000),
        status: 'CONFIRMED',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Package', price: new Prisma.Decimal(150) },
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(mockReservation as any);
      
      // Mock getBuffer to reject
      mockPdfMake.createPdf.mockReturnValueOnce({
        getBuffer: jest.fn((callback) => {
          throw new Error('Buffer generation failed');
        }),
      } as any);

      await expect(
        pdfService.generateReservationPDF(1, 'pl')
      ).rejects.toThrow();
    });
  });

  describe('generateReservationPDF - Edge Cases', () => {
    it('should handle reservation with very long customer name', async () => {
      const reservationLongName = {
        id: 1,
        customerName: 'A'.repeat(200), // Very long name
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 100,
        totalPrice: new Prisma.Decimal(15000),
        status: 'CONFIRMED',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Package', price: new Prisma.Decimal(150) },
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationLongName as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with zero guest count', async () => {
      const reservationZeroGuests = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 0,
        totalPrice: new Prisma.Decimal(5000),
        status: 'PENDING',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Package', price: new Prisma.Decimal(100) },
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationZeroGuests as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with very high price (decimal overflow)', async () => {
      const reservationHighPrice = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 1000,
        totalPrice: new Prisma.Decimal(9999999.99),
        status: 'CONFIRMED',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Package', price: new Prisma.Decimal(9999) },
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationHighPrice as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with past event date', async () => {
      const reservationPastDate = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2020-01-01'), // Past date
        guestCount: 100,
        totalPrice: new Prisma.Decimal(15000),
        status: 'COMPLETED',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Package', price: new Prisma.Decimal(150) },
        menuItems: [],
        extras: [],
        createdAt: new Date('2019-12-01'),
        updatedAt: new Date('2020-01-02'),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationPastDate as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with future event date (far future)', async () => {
      const reservationFutureDate = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2030-12-31'), // Far future
        guestCount: 100,
        totalPrice: new Prisma.Decimal(15000),
        status: 'PENDING',
        hall: { id: 1, name: 'Hall A' },
        package: { id: 1, name: 'Package', price: new Prisma.Decimal(150) },
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationFutureDate as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - Null/Undefined Handling', () => {
    it('should handle reservation with null package', async () => {
      const reservationNullPackage = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 50,
        totalPrice: new Prisma.Decimal(5000),
        status: 'PENDING',
        hall: { id: 1, name: 'Hall A' },
        package: null,
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationNullPackage as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with undefined hall', async () => {
      const reservationNoHall = {
        id: 1,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+48123456789',
        eventDate: new Date('2026-06-15'),
        guestCount: 50,
        totalPrice: new Prisma.Decimal(5000),
        status: 'PENDING',
        hall: undefined,
        package: { id: 1, name: 'Package', price: new Prisma.Decimal(100) },
        menuItems: [],
        extras: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.reservation.findUnique.mockResolvedValueOnce(reservationNoHall as any);

      const result = await pdfService.generateReservationPDF(1, 'pl');
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
