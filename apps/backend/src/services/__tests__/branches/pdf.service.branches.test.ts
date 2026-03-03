/**
 * PDF Service Branch Coverage Tests
 * 
 * Purpose: Increase branch coverage for pdf.service.ts from current to 95%+
 * Target: Uncovered branches in conditional logic
 * 
 * Focus Areas:
 * 1. Optional field handling (null/undefined checks)
 * 2. Conditional rendering branches
 * 3. Edge cases in data formatting
 * 4. Error handling paths
 * 5. Font availability branches
 * 
 * Related: Issue #102 - Branch Coverage Improvement
 */

import { pdfService } from '../../pdf.service';
import type {
  ReservationPDFData,
  PaymentConfirmationData,
  MenuCardPDFData,
  RevenueReportPDFData,
  OccupancyReportPDFData,
} from '../../pdf.service';

describe('PDF Service - Branch Coverage', () => {
  describe('generateReservationPDF - Optional Fields Branches', () => {
    it('should handle reservation with all required fields only', async () => {
      const minimalReservation: ReservationPDFData = {
        id: 'TEST-001',
        client: {
          firstName: 'Jan',
          lastName: 'Kowalski',
          phone: '+48123456789',
        },
        adults: 50,
        children: 0,
        toddlers: 0,
        guests: 50,
        pricePerAdult: 150,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 7500,
        status: 'RESERVED',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(minimalReservation);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle reservation with optional email and address', async () => {
      const reservationWithOptionals: ReservationPDFData = {
        id: 'TEST-002',
        client: {
          firstName: 'Anna',
          lastName: 'Nowak',
          phone: '+48987654321',
          email: 'anna.nowak@example.com',
          address: 'ul. Testowa 123, 00-001 Warszawa',
        },
        adults: 100,
        children: 20,
        toddlers: 5,
        guests: 125,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
        totalPrice: 22000,
        status: 'CONFIRMED',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationWithOptionals);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle reservation with hall information', async () => {
      const reservationWithHall: ReservationPDFData = {
        id: 'TEST-003',
        client: {
          firstName: 'Piotr',
          lastName: 'Wiśniewski',
          phone: '+48111222333',
        },
        hall: {
          name: 'Sala Bankietowa A',
        },
        adults: 80,
        children: 0,
        toddlers: 0,
        guests: 80,
        pricePerAdult: 180,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 14400,
        status: 'PENDING',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationWithHall);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with event type and custom event type', async () => {
      const reservationWithEventType: ReservationPDFData = {
        id: 'TEST-004',
        client: {
          firstName: 'Maria',
          lastName: 'Kowalczyk',
          phone: '+48444555666',
        },
        eventType: {
          name: 'Wesele',
          standardHours: 6,
          extraHourRate: 500,
        },
        customEventType: 'Wesele z afterparty',
        adults: 150,
        children: 30,
        toddlers: 10,
        guests: 190,
        pricePerAdult: 220,
        pricePerChild: 110,
        pricePerToddler: 0,
        totalPrice: 36300,
        status: 'CONFIRMED',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationWithEventType);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with date/time variants - legacy strings', async () => {
      const reservationLegacyDates: ReservationPDFData = {
        id: 'TEST-005',
        client: {
          firstName: 'Tomasz',
          lastName: 'Lewandowski',
          phone: '+48777888999',
        },
        date: '2026-06-15',
        startTime: '15:00',
        endTime: '23:00',
        adults: 60,
        children: 0,
        toddlers: 0,
        guests: 60,
        pricePerAdult: 170,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 10200,
        status: 'RESERVED',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationLegacyDates);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with date/time variants - DateTime objects', async () => {
      const reservationDateTimeObjects: ReservationPDFData = {
        id: 'TEST-006',
        client: {
          firstName: 'Katarzyna',
          lastName: 'Zielińska',
          phone: '+48222333444',
        },
        startDateTime: new Date('2026-08-20T16:00:00'),
        endDateTime: new Date('2026-08-21T01:00:00'),
        eventType: {
          name: 'Wesele',
          standardHours: 6,
          extraHourRate: 600,
        },
        adults: 120,
        children: 15,
        toddlers: 5,
        guests: 140,
        pricePerAdult: 210,
        pricePerChild: 105,
        pricePerToddler: 0,
        totalPrice: 28575,
        extraHoursCost: 1800,
        status: 'CONFIRMED',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationDateTimeObjects);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with birthday age', async () => {
      const reservationBirthday: ReservationPDFData = {
        id: 'TEST-007',
        client: {
          firstName: 'Wojciech',
          lastName: 'Kaczmarek',
          phone: '+48555666777',
        },
        birthdayAge: 50,
        adults: 40,
        children: 10,
        toddlers: 0,
        guests: 50,
        pricePerAdult: 160,
        pricePerChild: 80,
        pricePerToddler: 0,
        totalPrice: 7200,
        status: 'CONFIRMED',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationBirthday);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with anniversary details', async () => {
      const reservationAnniversary: ReservationPDFData = {
        id: 'TEST-008',
        client: {
          firstName: 'Andrzej',
          lastName: 'Szymański',
          phone: '+48888999000',
        },
        anniversaryYear: 25,
        anniversaryOccasion: 'Srebrne Gody',
        adults: 70,
        children: 5,
        toddlers: 2,
        guests: 77,
        pricePerAdult: 190,
        pricePerChild: 95,
        pricePerToddler: 0,
        totalPrice: 13775,
        status: 'CONFIRMED',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationAnniversary);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with venue surcharge', async () => {
      const reservationSurcharge: ReservationPDFData = {
        id: 'TEST-009',
        client: {
          firstName: 'Magdalena',
          lastName: 'Wójcik',
          phone: '+48333444555',
        },
        adults: 30,
        children: 0,
        toddlers: 0,
        guests: 30,
        pricePerAdult: 150,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 7500,
        venueSurcharge: 3000,
        venueSurchargeLabel: 'Dopłata za wyłączność obiektu',
        status: 'CONFIRMED',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationSurcharge);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with notes', async () => {
      const reservationNotes: ReservationPDFData = {
        id: 'TEST-010',
        client: {
          firstName: 'Paweł',
          lastName: 'Kamiński',
          phone: '+48666777888',
        },
        adults: 50,
        children: 0,
        toddlers: 0,
        guests: 50,
        pricePerAdult: 140,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 7000,
        status: 'PENDING',
        notes: 'Wegetariańskie opcje menu\nSpecjalne dekoracje stołów\nMuzyka na żywo',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationNotes);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - Menu Data Branches', () => {
    it('should handle reservation without menu data', async () => {
      const reservationNoMenu: ReservationPDFData = {
        id: 'TEST-011',
        client: {
          firstName: 'Krzysztof',
          lastName: 'Dąbrowski',
          phone: '+48999000111',
        },
        adults: 40,
        children: 0,
        toddlers: 0,
        guests: 40,
        pricePerAdult: 150,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 6000,
        status: 'RESERVED',
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationNoMenu);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with menuSnapshot', async () => {
      const reservationMenuSnapshot: ReservationPDFData = {
        id: 'TEST-012',
        client: {
          firstName: 'Joanna',
          lastName: 'Jankowska',
          phone: '+48111222333',
        },
        adults: 80,
        children: 20,
        toddlers: 0,
        guests: 100,
        pricePerAdult: 200,
        pricePerChild: 100,
        pricePerToddler: 0,
        totalPrice: 18000,
        status: 'CONFIRMED',
        menuSnapshot: {
          id: 'MENU-001',
          menuData: {
            packageName: 'Pakiet Weselny Premium',
            dishSelections: [
              {
                categoryId: 'CAT-1',
                categoryName: 'Przystawki',
                dishes: [
                  {
                    dishId: 'DISH-1',
                    dishName: 'Tatar z łososia',
                    quantity: 1,
                    allergens: ['fish'],
                  },
                  {
                    dishId: 'DISH-2',
                    dishName: 'Carpaccio wołowe',
                    quantity: 1,
                  },
                ],
              },
              {
                categoryId: 'CAT-2',
                categoryName: 'Dania główne',
                dishes: [
                  {
                    dishId: 'DISH-3',
                    dishName: 'Stek z polędwicy',
                    quantity: 2,
                  },
                ],
              },
            ],
          },
          packagePrice: 150,
          optionsPrice: 20,
          totalMenuPrice: 170,
          adultsCount: 80,
          childrenCount: 20,
          toddlersCount: 0,
          selectedAt: new Date(),
        },
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationMenuSnapshot);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with legacy menuData (no snapshot)', async () => {
      const reservationLegacyMenu: ReservationPDFData = {
        id: 'TEST-013',
        client: {
          firstName: 'Robert',
          lastName: 'Mazur',
          phone: '+48444555666',
        },
        adults: 60,
        children: 10,
        toddlers: 0,
        guests: 70,
        pricePerAdult: 180,
        pricePerChild: 90,
        pricePerToddler: 0,
        totalPrice: 11700,
        status: 'CONFIRMED',
        menuData: {
          packageName: 'Pakiet Standard',
          dishSelections: [
            {
              categoryId: 'CAT-1',
              categoryName: 'Zupy',
              dishes: [
                {
                  dishId: 'DISH-1',
                  dishName: 'Rosół z makaronem',
                  quantity: 1,
                },
              ],
            },
          ],
        },
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationLegacyMenu);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - Extras Branches', () => {
    it('should handle reservation with reservationExtras', async () => {
      const reservationExtras: ReservationPDFData = {
        id: 'TEST-014',
        client: {
          firstName: 'Marcin',
          lastName: 'Piotrowski',
          phone: '+48777888999',
        },
        adults: 90,
        children: 0,
        toddlers: 0,
        guests: 90,
        pricePerAdult: 190,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 21100,
        extrasTotalPrice: 4000,
        status: 'CONFIRMED',
        reservationExtras: [
          {
            serviceItem: {
              name: 'DJ + nagłośnienie',
              priceType: 'FLAT',
              category: { name: 'Muzyka' },
            },
            quantity: 1,
            unitPrice: 2000,
            totalPrice: 2000,
            priceType: 'FLAT',
            status: 'CONFIRMED',
          },
          {
            serviceItem: {
              name: 'Fotobudka',
              priceType: 'FLAT',
              category: { name: 'Rozrywka' },
            },
            quantity: 1,
            unitPrice: 1500,
            totalPrice: 1500,
            priceType: 'FLAT',
            note: '3 godziny pracy',
            status: 'CONFIRMED',
          },
          {
            serviceItem: {
              name: 'Dodatkowe kwiaty',
              priceType: 'PER_UNIT',
              category: null,
            },
            quantity: 5,
            unitPrice: 100,
            totalPrice: 500,
            priceType: 'PER_UNIT',
            status: 'CONFIRMED',
          },
        ],
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationExtras);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with FREE extra', async () => {
      const reservationFreeExtra: ReservationPDFData = {
        id: 'TEST-015',
        client: {
          firstName: 'Agnieszka',
          lastName: 'Woźniak',
          phone: '+48222333444',
        },
        adults: 50,
        children: 0,
        toddlers: 0,
        guests: 50,
        pricePerAdult: 160,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 8000,
        status: 'CONFIRMED',
        reservationExtras: [
          {
            serviceItem: {
              name: 'Tort weselny',
              priceType: 'FREE',
              category: { name: 'Catering' },
            },
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            priceType: 'FREE',
            status: 'CONFIRMED',
          },
        ],
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationFreeExtra);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with PER_PERSON extra', async () => {
      const reservationPerPersonExtra: ReservationPDFData = {
        id: 'TEST-016',
        client: {
          firstName: 'Grzegorz',
          lastName: 'Adamczyk',
          phone: '+48555666777',
        },
        adults: 70,
        children: 0,
        toddlers: 0,
        guests: 70,
        pricePerAdult: 170,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 13300,
        status: 'CONFIRMED',
        reservationExtras: [
          {
            serviceItem: {
              name: 'Welcome drink',
              priceType: 'PER_PERSON',
              category: { name: 'Napoje' },
            },
            quantity: 70,
            unitPrice: 15,
            totalPrice: 1050,
            priceType: 'PER_PERSON',
            status: 'CONFIRMED',
          },
        ],
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationPerPersonExtra);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - Deposits Branches', () => {
    it('should handle reservation with single deposit (legacy)', async () => {
      const reservationSingleDeposit: ReservationPDFData = {
        id: 'TEST-017',
        client: {
          firstName: 'Beata',
          lastName: 'Lis',
          phone: '+48888999000',
        },
        adults: 60,
        children: 0,
        toddlers: 0,
        guests: 60,
        pricePerAdult: 150,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 9000,
        status: 'CONFIRMED',
        deposit: {
          amount: 500,
          dueDate: '2026-05-01',
          status: 'PAID',
          paid: true,
        },
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationSingleDeposit);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle reservation with deposits array - unpaid', async () => {
      const reservationDepositsUnpaid: ReservationPDFData = {
        id: 'TEST-018',
        client: {
          firstName: 'Damian',
          lastName: 'Czarnecki',
          phone: '+48333444555',
        },
        adults: 80,
        children: 0,
        toddlers: 0,
        guests: 80,
        pricePerAdult: 180,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 14400,
        status: 'PENDING',
        deposits: [
          {
            amount: 500,
            dueDate: new Date('2026-04-15'),
            status: 'PENDING',
            paid: false,
          },
        ],
        createdAt: new Date(),
      };

      const buffer = await pdfService.generateReservationPDF(reservationDepositsUnpaid);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateReservationPDF - Status Branches', () => {
    const baseReservation = {
      client: {
        firstName: 'Test',
        lastName: 'User',
        phone: '+48123456789',
      },
      adults: 50,
      children: 0,
      toddlers: 0,
      guests: 50,
      pricePerAdult: 150,
      pricePerChild: 0,
      pricePerToddler: 0,
      totalPrice: 7500,
      createdAt: new Date(),
    };

    it('should handle RESERVED status', async () => {
      const reservation: ReservationPDFData = {
        ...baseReservation,
        id: 'TEST-019',
        status: 'RESERVED',
      };

      const buffer = await pdfService.generateReservationPDF(reservation);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle PENDING status', async () => {
      const reservation: ReservationPDFData = {
        ...baseReservation,
        id: 'TEST-020',
        status: 'PENDING',
      };

      const buffer = await pdfService.generateReservationPDF(reservation);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle CONFIRMED status', async () => {
      const reservation: ReservationPDFData = {
        ...baseReservation,
        id: 'TEST-021',
        status: 'CONFIRMED',
      };

      const buffer = await pdfService.generateReservationPDF(reservation);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle COMPLETED status', async () => {
      const reservation: ReservationPDFData = {
        ...baseReservation,
        id: 'TEST-022',
        status: 'COMPLETED',
      };

      const buffer = await pdfService.generateReservationPDF(reservation);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle CANCELLED status', async () => {
      const reservation: ReservationPDFData = {
        ...baseReservation,
        id: 'TEST-023',
        status: 'CANCELLED',
      };

      const buffer = await pdfService.generateReservationPDF(reservation);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generatePaymentConfirmationPDF - Branch Coverage', () => {
    it('should handle payment confirmation with all fields', async () => {
      const paymentData: PaymentConfirmationData = {
        depositId: 'DEP-001',
        amount: 500,
        paidAt: new Date(),
        paymentMethod: 'TRANSFER',
        paymentReference: 'REF-123456',
        client: {
          firstName: 'Jan',
          lastName: 'Kowalski',
          phone: '+48123456789',
          email: 'jan@example.com',
          address: 'ul. Testowa 1, Warszawa',
        },
        reservation: {
          id: 'RES-001',
          date: '2026-06-15',
          startTime: '15:00',
          endTime: '23:00',
          hall: 'Sala A',
          eventType: 'Wesele',
          guests: 100,
          totalPrice: 20000,
        },
      };

      const buffer = await pdfService.generatePaymentConfirmationPDF(paymentData);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle payment confirmation without optional fields', async () => {
      const paymentData: PaymentConfirmationData = {
        depositId: 'DEP-002',
        amount: 1000,
        paidAt: new Date(),
        paymentMethod: 'CASH',
        client: {
          firstName: 'Anna',
          lastName: 'Nowak',
          phone: '+48987654321',
        },
        reservation: {
          id: 'RES-002',
          date: '2026-07-20',
          startTime: '16:00',
          endTime: '01:00',
          guests: 80,
          totalPrice: 15000,
        },
      };

      const buffer = await pdfService.generatePaymentConfirmationPDF(paymentData);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle different payment methods', async () => {
      const methods: Array<'TRANSFER' | 'CASH' | 'BLIK' | 'CARD'> = ['TRANSFER', 'CASH', 'BLIK', 'CARD'];

      for (const method of methods) {
        const paymentData: PaymentConfirmationData = {
          depositId: `DEP-${method}`,
          amount: 500,
          paidAt: new Date(),
          paymentMethod: method,
          client: {
            firstName: 'Test',
            lastName: 'User',
            phone: '+48123456789',
          },
          reservation: {
            id: 'RES-TEST',
            date: '2026-08-01',
            startTime: '18:00',
            endTime: '02:00',
            guests: 50,
            totalPrice: 10000,
          },
        };

        const buffer = await pdfService.generatePaymentConfirmationPDF(paymentData);
        expect(buffer).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('generateMenuCardPDF - Branch Coverage', () => {
    it('should handle menu card with minimal data', async () => {
      const menuData: MenuCardPDFData = {
        templateName: 'Menu Weselne',
        eventTypeName: 'Wesele',
        packages: [
          {
            name: 'Pakiet Standard',
            pricePerAdult: 150,
            pricePerChild: 75,
            pricePerToddler: 0,
            courses: [],
            options: [],
          },
        ],
      };

      const buffer = await pdfService.generateMenuCardPDF(menuData);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle menu card with all optional fields', async () => {
      const menuData: MenuCardPDFData = {
        templateName: 'Menu Premium',
        templateDescription: 'Ekskluzywne menu weselne z najlepszych składników',
        variant: 'Sezon letni 2026',
        eventTypeName: 'Wesele',
        eventTypeColor: '#c8a45a',
        packages: [
          {
            name: 'Pakiet Premium',
            description: 'Najlepszy wybór dla wymagających gości',
            shortDescription: 'Premium dla 100+ osób',
            pricePerAdult: 250,
            pricePerChild: 125,
            pricePerToddler: 0,
            badgeText: 'BESTSELLER',
            includedItems: ['Welcome drink', 'Tort weselny', 'Dekoracje stołów'],
            courses: [
              {
                name: 'Przystawki',
                description: 'Wybór zimnych przystawek',
                icon: 'fork',
                minSelect: 2,
                maxSelect: 3,
                dishes: [
                  {
                    name: 'Tatar z łososia',
                    description: 'Świeży łosoś z kaparami i cebulką',
                    allergens: ['fish'],
                  },
                  {
                    name: 'Carpaccio wołowe',
                    description: 'Cienkie plastry polędwicy z rukolą',
                    allergens: [],
                  },
                ],
              },
            ],
            options: [
              {
                name: 'Bar kawowy',
                description: 'Profesjonalny barista',
                category: 'Napoje',
                priceType: 'FLAT',
                priceAmount: 800,
                isRequired: true,
              },
              {
                name: 'Dodatkowy alkohol',
                description: 'Premium alkohole',
                category: 'Napoje',
                priceType: 'PER_PERSON',
                priceAmount: 50,
                isRequired: false,
              },
            ],
          },
        ],
      };

      const buffer = await pdfService.generateMenuCardPDF(menuData);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateRevenueReportPDF - Branch Coverage', () => {
    it('should handle revenue report with all sections', async () => {
      const reportData: RevenueReportPDFData = {
        filters: {
          dateFrom: '2026-01-01',
          dateTo: '2026-03-31',
          groupBy: 'month',
        },
        summary: {
          totalRevenue: 250000,
          avgRevenuePerReservation: 12500,
          totalReservations: 20,
          completedReservations: 18,
          pendingRevenue: 25000,
          growthPercent: 15.5,
          extrasRevenue: 45000,
        },
        breakdown: [
          { period: '2026-01', revenue: 80000, count: 8, avgRevenue: 10000 },
          { period: '2026-02', revenue: 90000, count: 6, avgRevenue: 15000 },
          { period: '2026-03', revenue: 80000, count: 6, avgRevenue: 13333 },
        ],
        byHall: [
          { hallName: 'Sala A', revenue: 150000, count: 12, avgRevenue: 12500 },
          { hallName: 'Sala B', revenue: 100000, count: 8, avgRevenue: 12500 },
        ],
        byEventType: [
          { eventTypeName: 'Wesele', revenue: 200000, count: 15, avgRevenue: 13333 },
          { eventTypeName: 'Urodziny', revenue: 50000, count: 5, avgRevenue: 10000 },
        ],
        byServiceItem: [
          { name: 'DJ', revenue: 30000, count: 15, avgRevenue: 2000 },
          { name: 'Fotobudka', revenue: 15000, count: 10, avgRevenue: 1500 },
        ],
      };

      const buffer = await pdfService.generateRevenueReportPDF(reportData);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle revenue report without optional sections', async () => {
      const reportData: RevenueReportPDFData = {
        filters: {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
        },
        summary: {
          totalRevenue: 50000,
          avgRevenuePerReservation: 10000,
          totalReservations: 5,
          completedReservations: 5,
          pendingRevenue: 0,
          growthPercent: 0,
        },
        breakdown: [],
        byHall: [],
        byEventType: [],
      };

      const buffer = await pdfService.generateRevenueReportPDF(reportData);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateOccupancyReportPDF - Branch Coverage', () => {
    it('should handle occupancy report with all data', async () => {
      const reportData: OccupancyReportPDFData = {
        filters: {
          dateFrom: '2026-01-01',
          dateTo: '2026-03-31',
        },
        summary: {
          avgOccupancy: 75,
          peakDay: 'Saturday',
          peakHall: 'Sala A',
          totalReservations: 25,
          totalDaysInPeriod: 90,
        },
        halls: [
          { hallName: 'Sala A', occupancy: 85, reservations: 15, avgGuestsPerReservation: 95 },
          { hallName: 'Sala B', occupancy: 65, reservations: 10, avgGuestsPerReservation: 75 },
        ],
        peakHours: [
          { hour: 18, count: 12 },
          { hour: 19, count: 8 },
          { hour: 15, count: 5 },
        ],
        peakDaysOfWeek: [
          { dayOfWeek: 'Saturday', count: 15 },
          { dayOfWeek: 'Sunday', count: 6 },
          { dayOfWeek: 'Friday', count: 4 },
        ],
      };

      const buffer = await pdfService.generateOccupancyReportPDF(reportData);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle occupancy report without peakHall', async () => {
      const reportData: OccupancyReportPDFData = {
        filters: {
          dateFrom: '2026-02-01',
          dateTo: '2026-02-28',
        },
        summary: {
          avgOccupancy: 50,
          peakDay: 'Saturday',
          totalReservations: 8,
          totalDaysInPeriod: 28,
        },
        halls: [],
        peakHours: [],
        peakDaysOfWeek: [
          { dayOfWeek: 'Saturday', count: 5 },
        ],
      };

      const buffer = await pdfService.generateOccupancyReportPDF(reportData);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
