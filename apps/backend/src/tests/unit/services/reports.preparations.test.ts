/**
 * ReportsService — Preparations & Menu Preparations Tests
 * Covers: getPreparationsReport(), getMenuPreparationsReport()
 * Gap tests for reports.service.ts
 */

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    reservation: { findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    reservationMenuSnapshot: { findMany: jest.fn() },
  },
}));

import ReportsService from '../../../services/reports';
import { prisma } from '../../../lib/prisma';

const db = prisma as any;
const svc = ReportsService;

beforeEach(() => jest.clearAllMocks());

// ── Fixtures ───────────────────────────────────────────────────────────

const mkReservationWithExtras = (overrides: Record<string, any> = {}) => ({
  id: 'r1',
  date: '2026-03-25',
  startTime: '14:00',
  endTime: '20:00',
  guests: 80,
  adults: 60,
  children: 15,
  toddlers: 5,
  startDateTime: null,
  endDateTime: null,
  client: { firstName: 'Jan', lastName: 'Kowalski', companyName: null, clientType: 'INDIVIDUAL' },
  hall: { id: 'h1', name: 'Sala A' },
  eventType: { id: 'et1', name: 'Wesele' },
  extras: [
    {
      id: 'ex1',
      quantity: 2,
      unitPrice: 100,
      priceType: 'FLAT',
      totalPrice: 200,
      note: 'Ważna uwaga',
      status: 'CONFIRMED',
      serviceItem: {
        id: 'si1',
        name: 'DJ',
        priceType: 'FLAT',
        category: { id: 'cat1', name: 'Muzyka', icon: '🎵', color: '#FF0000', displayOrder: 1 },
      },
    },
  ],
  ...overrides,
});

const mkSnapshot = (overrides: Record<string, any> = {}) => ({
  id: 'snap1',
  menuData: {
    packageName: 'Pakiet Premium',
    packageDescription: 'Opis pakietu',
    dishSelections: [
      {
        categoryName: 'Danie główne',
        categoryIcon: '🍖',
        portionTarget: 'ALL',
        dishes: [
          { dishName: 'Stek', description: 'Z sosem', quantity: 2 },
          { dishName: 'Łosoś', description: null, quantity: 1 },
        ],
      },
      {
        categoryName: 'Desery',
        portionTarget: 'CHILDREN_ONLY',
        dishes: [
          { dishName: 'Lody', description: null, quantity: 1 },
        ],
      },
    ],
  },
  packagePrice: 150,
  totalMenuPrice: 12000,
  adultsCount: 60,
  childrenCount: 15,
  toddlersCount: 5,
  reservation: {
    id: 'r1',
    date: '2026-03-25',
    startTime: '14:00',
    endTime: '20:00',
    guests: 80,
    adults: 60,
    children: 15,
    toddlers: 5,
    startDateTime: null,
    endDateTime: null,
    client: { firstName: 'Jan', lastName: 'Kowalski', companyName: null, clientType: 'INDIVIDUAL' },
    hall: { id: 'h1', name: 'Sala A' },
    eventType: { id: 'et1', name: 'Wesele' },
  },
  ...overrides,
});

// ── getPreparationsReport ──────────────────────────────────────────────

describe('ReportsService', () => {
  describe('getPreparationsReport()', () => {
    it('powinno zwrócić raport z extras pogrupowany po dniu i kategorii', async () => {
      db.reservation.findMany.mockResolvedValue([mkReservationWithExtras()]);

      const result = await svc.getPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.summary.totalExtras).toBe(1);
      expect(result.summary.totalReservationsWithExtras).toBe(1);
      expect(result.days).toHaveLength(1);
      expect(result.days[0].date).toBe('2026-03-25');
      expect(result.days[0].dateLabel).toContain('marca');
      expect(result.days[0].categories).toHaveLength(1);
      expect(result.days[0].categories[0].categoryName).toBe('Muzyka');
      expect(result.days[0].categories[0].items).toHaveLength(1);
    });

    it('powinno obsłużyć brak extras w rezerwacjach', async () => {
      db.reservation.findMany.mockResolvedValue([
        mkReservationWithExtras({ extras: [] }),
      ]);

      const result = await svc.getPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.summary.totalExtras).toBe(0);
      expect(result.summary.totalReservationsWithExtras).toBe(0);
      expect(result.days).toHaveLength(0);
    });

    it('powinno obsłużyć brak rezerwacji', async () => {
      db.reservation.findMany.mockResolvedValue([]);

      const result = await svc.getPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.summary.totalExtras).toBe(0);
      expect(result.days).toHaveLength(0);
      expect(result.summary.nearestEvent).toBeNull();
    });

    it('powinno zastosować filtr categoryId', async () => {
      db.reservation.findMany.mockResolvedValue([]);

      await svc.getPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
        categoryId: 'cat1',
      });

      const call = db.reservation.findMany.mock.calls[0][0];
      expect(call.select.extras.where.serviceItem).toEqual({ categoryId: 'cat1' });
    });

    it('powinno zwrócić summaryDays gdy view=summary', async () => {
      db.reservation.findMany.mockResolvedValue([mkReservationWithExtras()]);

      const result = await svc.getPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
        view: 'summary',
      });

      expect(result.summaryDays).toBeDefined();
      expect(result.summaryDays!).toHaveLength(1);
      expect(result.summaryDays![0].items).toHaveLength(1);
      expect(result.summaryDays![0].items[0].serviceName).toBe('DJ');
    });

    it('powinno nie zwracać summaryDays gdy view=detailed', async () => {
      db.reservation.findMany.mockResolvedValue([mkReservationWithExtras()]);

      const result = await svc.getPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
        view: 'detailed',
      });

      expect(result.summaryDays).toBeUndefined();
    });

    it('powinno obsłużyć rezerwację z startDateTime zamiast date', async () => {
      db.reservation.findMany.mockResolvedValue([
        mkReservationWithExtras({
          date: null,
          startTime: null,
          endTime: null,
          startDateTime: new Date('2026-03-25T14:00:00'),
          endDateTime: new Date('2026-03-25T20:00:00'),
        }),
      ]);

      const result = await svc.getPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.days).toHaveLength(1);
      expect(result.days[0].date).toBe('2026-03-25');
    });

    it('powinno wyznaczyć topCategory w summary', async () => {
      db.reservation.findMany.mockResolvedValue([mkReservationWithExtras()]);

      const result = await svc.getPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.summary.topCategory).toEqual({
        name: 'Muzyka',
        icon: '🎵',
        count: 1,
      });
    });

    it('powinno obsłużyć wiele rezerwacji w wielu dniach', async () => {
      const r1 = mkReservationWithExtras();
      const r2 = mkReservationWithExtras({
        id: 'r2',
        date: '2026-03-26',
        extras: [
          {
            id: 'ex2',
            quantity: 1,
            unitPrice: 50,
            priceType: 'PER_PERSON',
            totalPrice: 4000,
            note: null,
            status: 'CONFIRMED',
            serviceItem: {
              id: 'si2',
              name: 'Fotobudka',
              priceType: 'FLAT',
              category: { id: 'cat2', name: 'Foto', icon: '📷', color: '#00FF00', displayOrder: 2 },
            },
          },
        ],
      });
      db.reservation.findMany.mockResolvedValue([r1, r2]);

      const result = await svc.getPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.summary.totalExtras).toBe(2);
      expect(result.summary.totalReservationsWithExtras).toBe(2);
      expect(result.days).toHaveLength(2);
    });
  });

  // ── getMenuPreparationsReport ────────────────────────────────────────

  describe('getMenuPreparationsReport()', () => {
    it('powinno zwrócić raport menu z courses i dishes', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([mkSnapshot()]);

      const result = await svc.getMenuPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.summary.totalMenus).toBe(1);
      expect(result.summary.totalGuests).toBe(80);
      expect(result.summary.totalAdults).toBe(60);
      expect(result.summary.totalChildren).toBe(15);
      expect(result.summary.totalToddlers).toBe(5);
      expect(result.days).toHaveLength(1);
      expect(result.days[0].reservations).toHaveLength(1);
      expect(result.days[0].reservations[0].courses).toHaveLength(2);
    });

    it('powinno obsłużyć brak snapshotów', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([]);

      const result = await svc.getMenuPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.summary.totalMenus).toBe(0);
      expect(result.summary.totalGuests).toBe(0);
      expect(result.summary.topPackage).toBeNull();
      expect(result.summary.nearestEvent).toBeNull();
      expect(result.days).toHaveLength(0);
    });

    it('powinno wyznaczyć topPackage', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([mkSnapshot()]);

      const result = await svc.getMenuPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.summary.topPackage).toEqual({
        name: 'Pakiet Premium',
        count: 1,
      });
    });

    it('powinno zwrócić summaryDays z portionTarget dla view=summary', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([mkSnapshot()]);

      const result = await svc.getMenuPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
        view: 'summary',
      });

      expect(result.summaryDays).toBeDefined();
      expect(result.summaryDays!).toHaveLength(1);
      const day = result.summaryDays![0];
      expect(day.courses).toHaveLength(2);

      // Check portion calculation for "Danie główne" (ALL: adults=60, children=15)
      const mainCourse = day.courses.find(c => c.courseName === 'Danie główne');
      expect(mainCourse).toBeDefined();
      const stekDish = mainCourse!.dishes.find(d => d.dishName === 'Stek');
      expect(stekDish).toBeDefined();
      // Stek: portionSize=2, ALL => adults*2 + children*2 = 120 + 30 = 150
      expect(stekDish!.adultPortions).toBe(120);
      expect(stekDish!.childrenPortions).toBe(30);
      expect(stekDish!.totalPortions).toBe(150);

      // Check CHILDREN_ONLY course
      const desserts = day.courses.find(c => c.courseName === 'Desery');
      expect(desserts).toBeDefined();
      const iceCream = desserts!.dishes.find(d => d.dishName === 'Lody');
      expect(iceCream!.adultPortions).toBe(0);
      expect(iceCream!.childrenPortions).toBe(15); // children=15 * portionSize=1
      expect(iceCream!.totalPortions).toBe(15);
    });

    it('powinno nie zwracać summaryDays gdy view=detailed', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([mkSnapshot()]);

      const result = await svc.getMenuPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
        view: 'detailed',
      });

      expect(result.summaryDays).toBeUndefined();
    });

    it('powinno obsłużyć snapshot z brakującymi polami menuData', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([
        mkSnapshot({
          menuData: {
            dishSelections: [
              {
                dishes: [{ name: 'Zupa', quantity: 1 }],
              },
            ],
          },
        }),
      ]);

      const result = await svc.getMenuPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.days).toHaveLength(1);
      const course = result.days[0].reservations[0].courses[0];
      expect(course.courseName).toBe('Nieznana kategoria');
      expect(course.dishes[0].name).toBe('Zupa');
    });

    it('powinno obsłużyć snapshot z null menuData', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([
        mkSnapshot({ menuData: null }),
      ]);

      const result = await svc.getMenuPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.days).toHaveLength(1);
      expect(result.days[0].reservations[0].courses).toHaveLength(0);
      expect(result.days[0].reservations[0].package.name).toBe('Nieznany pakiet');
    });

    it('powinno sortować rezerwacje po dacie i godzinie', async () => {
      const snap1 = mkSnapshot({
        reservation: {
          ...mkSnapshot().reservation,
          id: 'r1',
          date: '2026-03-26',
          startTime: '18:00',
        },
      });
      const snap2 = mkSnapshot({
        id: 'snap2',
        reservation: {
          ...mkSnapshot().reservation,
          id: 'r2',
          date: '2026-03-25',
          startTime: '10:00',
        },
      });
      db.reservationMenuSnapshot.findMany.mockResolvedValue([snap1, snap2]);

      const result = await svc.getMenuPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.days[0].date).toBe('2026-03-25');
      expect(result.days[1].date).toBe('2026-03-26');
    });

    it('powinno obsłużyć rezerwację z startDateTime zamiast date', async () => {
      db.reservationMenuSnapshot.findMany.mockResolvedValue([
        mkSnapshot({
          reservation: {
            ...mkSnapshot().reservation,
            date: null,
            startTime: null,
            endTime: null,
            startDateTime: new Date('2026-03-25T14:00:00'),
            endDateTime: new Date('2026-03-25T20:00:00'),
          },
        }),
      ]);

      const result = await svc.getMenuPreparationsReport({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.days).toHaveLength(1);
      expect(result.days[0].date).toBe('2026-03-25');
    });
  });
});
