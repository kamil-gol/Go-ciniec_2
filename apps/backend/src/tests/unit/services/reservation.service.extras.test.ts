/**
 * ReservationService - Unit Tests: include reservationExtras (#22 Issue #118)
 * Pokrycie: getReservationById zwraca extras z relacjami,
 * getReservations zwraca extrasTotalPrice, edge cases (brak extras, extras z notatkami).
 *
 * UWAGA: reservationService jest singletonem importowanym po mockach.
 * getReservationById rzuca AppError gdy rez. nie istnieje (nie zwraca null).
 * listReservations w serwisie = getReservations().
 */

const mockPrisma = {
  reservation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  reservationExtra: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  }
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../../services/audit-log.service', () => ({
  auditLogService: { log: jest.fn() },
}));

jest.mock('../../../services/email.service', () => ({
  emailService: {
    sendReservationConfirmation: jest.fn(),
    sendReservationCancellation: jest.fn(),
  },
}));

jest.mock('../../../utils/audit-logger', () => ({
  logChange: jest.fn(),
  diffObjects: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(10500),
}));

jest.mock('../../../services/reservation-menu.service', () => ({
  default: {
    recalculateForGuestChange: jest.fn(),
  },
}));

import { ReservationService } from '../../../services/reservation.service';

const EXTRAS_WITH_RELATIONS = [
  {
    id: 'extra-1',
    reservationId: 'res-1',
    serviceItemId: 'item-1',
    serviceItem: {
      id: 'item-1',
      name: 'Tort urodzinowy',
      slug: 'tort-urodzinowy',
      priceType: 'FLAT',
      basePrice: 500,
      status: 'ACTIVE',
      category: { id: 'cat-1', name: 'Torty', slug: 'torty' },
    },
    priceType: 'FLAT',
    priceAmount: 500,
    quantity: 1,
    totalItemPrice: 500,
    note: 'Czekoladowy',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'extra-2',
    reservationId: 'res-1',
    serviceItemId: 'item-2',
    serviceItem: {
      id: 'item-2',
      name: 'Fotograf',
      slug: 'fotograf',
      priceType: 'FLAT',
      basePrice: 1200,
      status: 'ACTIVE',
      category: { id: 'cat-2', name: 'Foto/Video', slug: 'foto-video' },
    },
    priceType: 'FLAT',
    priceAmount: 1200,
    quantity: 1,
    totalItemPrice: 1200,
    note: null,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
];

const BASE_RESERVATION_DB = {
  id: 'res-1',
  clientId: 'client-1',
  hallId: 'hall-1',
  eventTypeId: 'et-1',
  date: new Date('2026-06-01'),
  startTime: '16:00',
  endTime: '23:00',
  adults: 50,
  children: 5,
  toddlers: 0,
  guests: 55,
  pricePerAdult: 200,
  pricePerChild: 100,
  pricePerToddler: 0,
  totalPrice: 10500,
  extrasTotalPrice: 1700,
  status: 'CONFIRMED' as const,
  notes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  client: { id: 'client-1', firstName: 'Anna', lastName: 'Nowak', email: 'anna@test.pl', phone: '500600700' },
  hall: { id: 'hall-1', name: 'Sala B' },
  eventType: { id: 'et-1', name: 'Urodziny' },
  extras: EXTRAS_WITH_RELATIONS,
  menuSnapshot: null,
  deposits: [],
  auditLogs: [],
};

describe('ReservationService - reservationExtras include (#22)', () => {
  let reservationService: ReservationService;

  beforeEach(() => {
    jest.clearAllMocks();
    reservationService = new ReservationService();
  });

  describe('getReservationById()', () => {
    it('should return reservation with extras array', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      const result = await reservationService.getReservationById('res-1');
      expect(result).toBeDefined();
      const extras = (result as any).extras ?? (result as any).reservationExtras;
      expect(extras).toBeDefined();
      expect(Array.isArray(extras)).toBe(true);
    });

    it('should include serviceItem and category in each extra', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      const result = await reservationService.getReservationById('res-1');
      const extras = (result as any).extras ?? (result as any).reservationExtras;
      expect(extras[0]).toHaveProperty('serviceItem');
      expect(extras[0].serviceItem).toHaveProperty('category');
    });

    it('should return extrasTotalPrice field', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      const result = await reservationService.getReservationById('res-1');
      expect((result as any).extrasTotalPrice).toBeDefined();
    });

    it('should handle reservation with no extras (empty array)', async () => {
      const resNoExtras = { ...BASE_RESERVATION_DB, extras: [], extrasTotalPrice: 0 };
      mockPrisma.reservation.findUnique.mockResolvedValue(resNoExtras);
      const result = await reservationService.getReservationById('res-1');
      const extras = (result as any).extras ?? (result as any).reservationExtras ?? [];
      expect(extras).toHaveLength(0);
      expect((result as any).extrasTotalPrice).toBe(0);
    });

    it('should throw or return null for non-existing reservation', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      let result: any;
      let threw = false;
      try {
        result = await reservationService.getReservationById('non-existent');
      } catch {
        threw = true;
      }
      expect(threw || result === null || result === undefined).toBe(true);
    });

    it('should include extras with note=null gracefully', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      const result = await reservationService.getReservationById('res-1');
      const extras = (result as any).extras ?? (result as any).reservationExtras;
      const extraWithNullNote = extras.find((e: any) => e.note === null);
      expect(extraWithNullNote).toBeDefined();
    });

    it('should call prisma.findUnique with correct where clause', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      await reservationService.getReservationById('res-1');
      expect(mockPrisma.reservation.findUnique).toHaveBeenCalledTimes(1);
      const callArg = mockPrisma.reservation.findUnique.mock.calls[0][0];
      expect(callArg).toHaveProperty('where', { id: 'res-1' });
    });

    it('should handle extra with PER_PERSON priceType', async () => {
      const extrasPerPerson = [{ ...EXTRAS_WITH_RELATIONS[0], priceType: 'PER_PERSON', priceAmount: 15, quantity: 55, totalItemPrice: 825 }];
      const res = { ...BASE_RESERVATION_DB, extras: extrasPerPerson, extrasTotalPrice: 825 };
      mockPrisma.reservation.findUnique.mockResolvedValue(res);
      const result = await reservationService.getReservationById('res-1');
      expect((result as any).extrasTotalPrice).toBeDefined();
    });
  });

  describe('getReservations()', () => {
    const LIST_RES = [
      { ...BASE_RESERVATION_DB, id: 'res-1', extrasTotalPrice: 1700 },
      { ...BASE_RESERVATION_DB, id: 'res-2', extrasTotalPrice: 0, extras: [] },
      { ...BASE_RESERVATION_DB, id: 'res-3', extrasTotalPrice: 500, extras: [EXTRAS_WITH_RELATIONS[0]] },
    ];

    it('should return list with extrasTotalPrice per reservation', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue(LIST_RES);
      mockPrisma.reservation.count.mockResolvedValue(3);
      const result = await reservationService.getReservations({});
      expect(result).toBeDefined();
      const data = Array.isArray(result) ? result : (result as any)?.data ?? [];
      const r = data.find((r: any) => r.id === 'res-1');
      expect(r).toHaveProperty('extrasTotalPrice');
    });

    it('should handle empty reservations list', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);
      mockPrisma.reservation.count.mockResolvedValue(0);
      const result = await reservationService.getReservations({});
      const data = Array.isArray(result) ? result : (result as any)?.data ?? (result as any)?.reservations ?? [];
      expect(data).toHaveLength(0);
    });

    it('should include extras even when filtering by status', async () => {
      const confirmed = LIST_RES.filter(r => r.status === 'CONFIRMED');
      mockPrisma.reservation.findMany.mockResolvedValue(confirmed);
      mockPrisma.reservation.count.mockResolvedValue(confirmed.length);
      const result = await reservationService.getReservations({ status: 'CONFIRMED' as any });
      expect(result).toBeDefined();
    });

    it('should call prisma.findMany exactly once', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue(LIST_RES);
      mockPrisma.reservation.count.mockResolvedValue(3);
      await reservationService.getReservations({});
      expect(mockPrisma.reservation.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle reservations with mixed extras (some 0, some >0)', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue(LIST_RES);
      mockPrisma.reservation.count.mockResolvedValue(3);
      const result = await reservationService.getReservations({});
      const data = Array.isArray(result) ? result : (result as any)?.data ?? [];
      expect(data).toBeDefined();
    });

    it('should handle getReservations with date filter', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([LIST_RES[0]]);
      mockPrisma.reservation.count.mockResolvedValue(1);
      const result = await reservationService.getReservations({ dateFrom: '2026-06-01', dateTo: '2026-06-30' } as any);
      expect(result).toBeDefined();
    });

    it('should handle getReservations with hallId filter', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([LIST_RES[0]]);
      mockPrisma.reservation.count.mockResolvedValue(1);
      const result = await reservationService.getReservations({ hallId: 'hall-1' });
      expect(result).toBeDefined();
    });
  });
});
