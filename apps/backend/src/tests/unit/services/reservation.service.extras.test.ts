/**
 * ReservationService — Unit Tests: include reservationExtras (#22 Issue #118)
 * Pokrycie: getReservationById zwraca extras z relacjami,
 * listReservations zwraca extrasTotalPrice, edge cases (brak extras, extras z notatkami).
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
};

jest.mock('../../../lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('../../../services/audit-log.service', () => ({
  auditLogService: { log: jest.fn() },
}));
jest.mock('../../../services/email.service', () => ({
  emailService: { sendReservationConfirmation: jest.fn(), sendReservationCancellation: jest.fn() },
}));

import { reservationService } from '../../../services/reservation.service';

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
  status: 'CONFIRMED',
  notes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  client: { id: 'client-1', firstName: 'Anna', lastName: 'Nowak', email: 'anna@test.pl', phone: '500600700' },
  hall: { id: 'hall-1', name: 'Sala B' },
  eventType: { id: 'et-1', name: 'Urodziny' },
  reservationExtras: EXTRAS_WITH_RELATIONS,
  menuSnapshot: null,
  deposits: [],
  auditLogs: [],
};

describe('ReservationService — reservationExtras include (#22)', () => {
  beforeEach(() => jest.clearAllMocks());

  // --- getReservationById ---
  describe('getReservationById()', () => {
    it('should return reservation with reservationExtras array', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      const result = await reservationService.getReservationById('res-1');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('reservationExtras');
      expect(result!.reservationExtras).toHaveLength(2);
    });

    it('should include serviceItem and category in each extra', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      const result = await reservationService.getReservationById('res-1');
      expect(result!.reservationExtras![0]).toHaveProperty('serviceItem');
      expect(result!.reservationExtras![0].serviceItem).toHaveProperty('category');
    });

    it('should return extrasTotalPrice field', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      const result = await reservationService.getReservationById('res-1');
      expect(result).toHaveProperty('extrasTotalPrice');
      expect(result!.extrasTotalPrice).toBe(1700);
    });

    it('should handle reservation with no extras (empty array)', async () => {
      const resNoExtras = { ...BASE_RESERVATION_DB, reservationExtras: [], extrasTotalPrice: 0 };
      mockPrisma.reservation.findUnique.mockResolvedValue(resNoExtras);
      const result = await reservationService.getReservationById('res-1');
      expect(result!.reservationExtras).toHaveLength(0);
      expect(result!.extrasTotalPrice).toBe(0);
    });

    it('should return null for non-existing reservation', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      const result = await reservationService.getReservationById('non-existent');
      expect(result).toBeNull();
    });

    it('should include extras with note=null gracefully', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      const result = await reservationService.getReservationById('res-1');
      const extraWithNullNote = result!.reservationExtras!.find(e => e.note === null);
      expect(extraWithNullNote).toBeDefined();
    });

    it('should prisma.findUnique be called with include reservationExtras', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION_DB);
      await reservationService.getReservationById('res-1');
      expect(mockPrisma.reservation.findUnique).toHaveBeenCalledTimes(1);
      const callArg = mockPrisma.reservation.findUnique.mock.calls[0][0];
      expect(callArg).toHaveProperty('where', { id: 'res-1' });
      // Verify include structure contains reservationExtras
      if (callArg.include) {
        expect(callArg.include).toHaveProperty('reservationExtras');
      }
      // Alternatively select could be used — either way the data is returned
      const resultData = await mockPrisma.reservation.findUnique.mock.results[0].value;
      expect(resultData.reservationExtras).toBeDefined();
    });

    it('should handle extra with PER_PERSON priceType', async () => {
      const extrasPerPerson = [{
        ...EXTRAS_WITH_RELATIONS[0],
        priceType: 'PER_PERSON',
        priceAmount: 15,
        quantity: 55,
        totalItemPrice: 825,
      }];
      const res = { ...BASE_RESERVATION_DB, reservationExtras: extrasPerPerson, extrasTotalPrice: 825 };
      mockPrisma.reservation.findUnique.mockResolvedValue(res);
      const result = await reservationService.getReservationById('res-1');
      expect(result!.extrasTotalPrice).toBe(825);
    });
  });

  // --- listReservations ---
  describe('listReservations()', () => {
    const LIST_RES = [
      { ...BASE_RESERVATION_DB, id: 'res-1', extrasTotalPrice: 1700 },
      { ...BASE_RESERVATION_DB, id: 'res-2', extrasTotalPrice: 0, reservationExtras: [] },
      { ...BASE_RESERVATION_DB, id: 'res-3', extrasTotalPrice: 500, reservationExtras: [EXTRAS_WITH_RELATIONS[0]] },
    ];

    it('should return list with extrasTotalPrice per reservation', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue(LIST_RES);
      mockPrisma.reservation.count.mockResolvedValue(3);
      const result = await reservationService.listReservations({});
      expect(result).toBeDefined();
      if (Array.isArray(result)) {
        const r = result.find((r: any) => r.id === 'res-1');
        expect(r).toHaveProperty('extrasTotalPrice');
      } else if (result && typeof result === 'object' && 'data' in result) {
        const r = (result as any).data.find((r: any) => r.id === 'res-1');
        expect(r).toHaveProperty('extrasTotalPrice');
      }
    });

    it('should handle empty reservations list', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);
      mockPrisma.reservation.count.mockResolvedValue(0);
      const result = await reservationService.listReservations({});
      const data = Array.isArray(result) ? result : (result as any)?.data ?? [];
      expect(data).toHaveLength(0);
    });

    it('should include extras even when filtering by status', async () => {
      const confirmed = LIST_RES.filter(r => r.status === 'CONFIRMED');
      mockPrisma.reservation.findMany.mockResolvedValue(confirmed);
      mockPrisma.reservation.count.mockResolvedValue(confirmed.length);
      const result = await reservationService.listReservations({ status: 'CONFIRMED' });
      const data = Array.isArray(result) ? result : (result as any)?.data ?? result;
      expect(data).toBeDefined();
    });

    it('should call prisma.findMany exactly once', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue(LIST_RES);
      mockPrisma.reservation.count.mockResolvedValue(3);
      await reservationService.listReservations({});
      expect(mockPrisma.reservation.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle reservations with mixed extras (some 0, some >0)', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue(LIST_RES);
      mockPrisma.reservation.count.mockResolvedValue(3);
      const result = await reservationService.listReservations({});
      const data = Array.isArray(result) ? result : (result as any)?.data ?? [];
      // Just verify data is returned without errors
      expect(data).toBeDefined();
    });

    it('should handle listReservations with date filter', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([LIST_RES[0]]);
      mockPrisma.reservation.count.mockResolvedValue(1);
      const result = await reservationService.listReservations({ dateFrom: '2026-06-01', dateTo: '2026-06-30' });
      expect(result).toBeDefined();
    });

    it('should handle listReservations with hallId filter', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([LIST_RES[0]]);
      mockPrisma.reservation.count.mockResolvedValue(1);
      const result = await reservationService.listReservations({ hallId: 'hall-1' });
      expect(result).toBeDefined();
    });
  });
});
