/**
 * Frontend Contract Tests — API Response Shape Validation
 *
 * Weryfikuje, że frontendowe typy TypeScript zgadzają się z oczekiwanymi
 * kształtami odpowiedzi API. Używa Zod do runtime validation fixture data
 * pasujących do interfejsów zdefiniowanych w types/.
 *
 * Jeśli backend zmieni kształt odpowiedzi, te testy powinny to wykryć —
 * pod warunkiem, że fixture data odpowiada aktualnym typom frontendowym.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Zod schemas matching frontend TypeScript interfaces
// These MUST mirror types in apps/frontend/types/
// ═══════════════════════════════════════════════════════════════

// From types/common.types.ts
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.union([
    z.nativeEnum({ ADMIN: 'ADMIN', EMPLOYEE: 'EMPLOYEE', CLIENT: 'CLIENT' } as const),
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      permissions: z.array(z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      })).optional(),
    }),
  ]).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// From types/client.types.ts
const ClientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  phone: z.string(),
  notes: z.string().optional(),
  clientType: z.enum(['INDIVIDUAL', 'COMPANY']),
  companyName: z.string().optional(),
  nip: z.string().optional(),
  regon: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  companyAddress: z.string().optional(),
  contacts: z.array(z.object({
    id: z.string(),
    clientId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    isPrimary: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// From types/hall.types.ts
const HallSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number(),
  pricePerPerson: z.number(),
  pricePerChild: z.number().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
  isWholeVenue: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const EventTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  standardHours: z.number().optional(),
  extraHourRate: z.number().optional(),
  createdAt: z.string(),
});

// From types/reservation.types.ts (core fields)
const ReservationSchema = z.object({
  id: z.string(),
  hallId: z.string(),
  clientId: z.string(),
  eventTypeId: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  adults: z.number(),
  children: z.number(),
  toddlers: z.number(),
  guests: z.number(),
  pricePerAdult: z.number(),
  pricePerChild: z.number(),
  pricePerToddler: z.number(),
  totalPrice: z.number(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESERVED', 'ARCHIVED']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// From types/queue.types.ts
const QueueItemSchema = z.object({
  id: z.string(),
  position: z.number(),
  queueDate: z.string(),
  guests: z.number(),
  client: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    email: z.string().optional(),
  }),
  isManualOrder: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
});

const QueueStatsSchema = z.object({
  totalQueued: z.number(),
  queuesByDate: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
  oldestQueueDate: z.string().nullable(),
  manualOrderCount: z.number(),
});

// From types/reports.types.ts — Revenue
const RevenueSummarySchema = z.object({
  totalRevenue: z.number(),
  avgRevenuePerReservation: z.number(),
  maxRevenueDay: z.string().nullable(),
  maxRevenueDayAmount: z.number(),
  growthPercent: z.number(),
  totalReservations: z.number(),
  completedReservations: z.number(),
  pendingRevenue: z.number(),
  extrasRevenue: z.number().optional(),
});

const RevenueBreakdownItemSchema = z.object({
  period: z.string(),
  revenue: z.number(),
  count: z.number(),
  avgRevenue: z.number(),
});

const RevenueByHallItemSchema = z.object({
  hallId: z.string(),
  hallName: z.string(),
  revenue: z.number(),
  count: z.number(),
  avgRevenue: z.number(),
});

const RevenueByEventTypeItemSchema = z.object({
  eventTypeId: z.string(),
  eventTypeName: z.string(),
  revenue: z.number(),
  count: z.number(),
  avgRevenue: z.number(),
});

const RevenueReportSchema = z.object({
  summary: RevenueSummarySchema,
  breakdown: z.array(RevenueBreakdownItemSchema),
  byHall: z.array(RevenueByHallItemSchema),
  byEventType: z.array(RevenueByEventTypeItemSchema),
});

// From types/reports.types.ts — Occupancy
const OccupancySummarySchema = z.object({
  avgOccupancy: z.number(),
  peakDay: z.string(),
  peakHall: z.string().nullable(),
  peakHallId: z.string().nullable(),
  totalReservations: z.number(),
  totalDaysInPeriod: z.number(),
});

const OccupancyByHallItemSchema = z.object({
  hallId: z.string(),
  hallName: z.string(),
  occupancy: z.number(),
  reservations: z.number(),
  avgGuestsPerReservation: z.number(),
});

const OccupancyReportSchema = z.object({
  summary: OccupancySummarySchema,
  halls: z.array(OccupancyByHallItemSchema),
  peakHours: z.array(z.object({
    hour: z.number(),
    count: z.number(),
  })),
  peakDaysOfWeek: z.array(z.object({
    dayOfWeek: z.string(),
    dayOfWeekNum: z.number(),
    count: z.number(),
  })),
});

// API Envelope
const ApiEnvelopeSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    count: z.number().optional(),
  });

// ═══════════════════════════════════════════════════════════════
// Fixture data — odpowiadające realnym odpowiedziom API
// ═══════════════════════════════════════════════════════════════

const UUID = '550e8400-e29b-41d4-a716-446655440001';
const UUID2 = '550e8400-e29b-41d4-a716-446655440002';
const UUID3 = '550e8400-e29b-41d4-a716-446655440003';
const UUID4 = '550e8400-e29b-41d4-a716-446655440004';
const UUID5 = '550e8400-e29b-41d4-a716-446655440005';

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe('Frontend API Contract Tests — Response Shape Validation', () => {

  // ─────────────────────────────────────────────────────────
  // Auth
  // ─────────────────────────────────────────────────────────
  describe('Auth response contracts', () => {
    it('login response user matches User type', () => {
      const user = {
        id: UUID,
        email: 'admin@test.pl',
        firstName: 'Jan',
        lastName: 'Kowalski',
        role: {
          id: UUID2,
          name: 'Administrator',
          slug: 'admin',
          permissions: [{ id: UUID3, name: 'Manage Users', slug: 'manage-users' }],
        },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      expect(() => UserSchema.parse(user)).not.toThrow();
    });

    it('login response user with enum role matches User type', () => {
      const user = {
        id: UUID,
        email: 'admin@test.pl',
        firstName: 'Jan',
        lastName: 'Kowalski',
        role: 'ADMIN',
      };

      expect(() => UserSchema.parse(user)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Client
  // ─────────────────────────────────────────────────────────
  describe('Client response contracts', () => {
    it('client individual matches Client type', () => {
      const client = {
        id: UUID2,
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna@example.pl',
        phone: '+48123456789',
        clientType: 'INDIVIDUAL' as const,
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
      };

      expect(() => ClientSchema.parse(client)).not.toThrow();
    });

    it('client company with contacts matches Client type', () => {
      const client = {
        id: UUID2,
        firstName: 'Jan',
        lastName: 'Firma',
        phone: '+48111222333',
        clientType: 'COMPANY' as const,
        companyName: 'Firma Sp. z o.o.',
        nip: '1234567890',
        contacts: [
          {
            id: UUID3,
            clientId: UUID2,
            firstName: 'Maria',
            lastName: 'Kontakt',
            email: 'maria@firma.pl',
            phone: '+48444555666',
            role: 'Manager',
            isPrimary: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      expect(() => ClientSchema.parse(client)).not.toThrow();
    });

    it('client list API envelope matches expected shape', () => {
      const response = {
        success: true,
        data: [
          {
            id: UUID2,
            firstName: 'Anna',
            lastName: 'Nowak',
            phone: '+48123456789',
            clientType: 'INDIVIDUAL' as const,
            createdAt: '2025-01-15T10:00:00.000Z',
            updatedAt: '2025-01-15T10:00:00.000Z',
          },
        ],
        count: 1,
      };

      expect(() => ApiEnvelopeSchema(z.array(ClientSchema)).parse(response)).not.toThrow();
    });

    it('rejects client without phone', () => {
      const broken = {
        id: UUID2,
        firstName: 'Anna',
        lastName: 'Nowak',
        clientType: 'INDIVIDUAL',
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
      };

      expect(() => ClientSchema.parse(broken)).toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Hall
  // ─────────────────────────────────────────────────────────
  describe('Hall response contracts', () => {
    it('hall matches Hall type', () => {
      const hall = {
        id: UUID3,
        name: 'Sala Główna',
        capacity: 200,
        pricePerPerson: 250,
        description: 'Duża sala bankietowa',
        isActive: true,
        isWholeVenue: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      expect(() => HallSchema.parse(hall)).not.toThrow();
    });

    it('event type matches EventType type', () => {
      const eventType = {
        id: UUID5,
        name: 'Wesele',
        standardHours: 8,
        extraHourRate: 500,
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      expect(() => EventTypeSchema.parse(eventType)).not.toThrow();
    });

    it('hall list API response matches expected shape', () => {
      const response = {
        success: true,
        data: [{
          id: UUID3,
          name: 'Sala',
          capacity: 100,
          pricePerPerson: 200,
          isActive: true,
          isWholeVenue: false,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        }],
        count: 1,
      };

      expect(() => ApiEnvelopeSchema(z.array(HallSchema)).parse(response)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Reservation
  // ─────────────────────────────────────────────────────────
  describe('Reservation response contracts', () => {
    it('reservation matches Reservation type core fields', () => {
      const reservation = {
        id: UUID4,
        hallId: UUID3,
        clientId: UUID2,
        eventTypeId: UUID5,
        startDateTime: '2025-06-15T14:00:00.000Z',
        endDateTime: '2025-06-15T22:00:00.000Z',
        adults: 80,
        children: 20,
        toddlers: 5,
        guests: 105,
        pricePerAdult: 250,
        pricePerChild: 150,
        pricePerToddler: 0,
        totalPrice: 23000,
        status: 'CONFIRMED' as const,
        createdAt: '2025-01-20T12:00:00.000Z',
        updatedAt: '2025-01-20T12:00:00.000Z',
      };

      expect(() => ReservationSchema.parse(reservation)).not.toThrow();
    });

    it('all statuses from ReservationStatus enum are valid', () => {
      const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESERVED', 'ARCHIVED'] as const;
      for (const status of statuses) {
        const reservation = {
          id: UUID4,
          hallId: UUID3,
          clientId: UUID2,
          eventTypeId: UUID5,
          startDateTime: '2025-06-15T14:00:00.000Z',
          endDateTime: '2025-06-15T22:00:00.000Z',
          adults: 10,
          children: 5,
          toddlers: 2,
          guests: 17,
          pricePerAdult: 200,
          pricePerChild: 100,
          pricePerToddler: 0,
          totalPrice: 2500,
          status,
          createdAt: '2025-01-20T12:00:00.000Z',
          updatedAt: '2025-01-20T12:00:00.000Z',
        };
        expect(() => ReservationSchema.parse(reservation)).not.toThrow();
      }
    });

    it('rejects reservation without totalPrice', () => {
      const broken = {
        id: UUID4,
        hallId: UUID3,
        clientId: UUID2,
        eventTypeId: UUID5,
        startDateTime: '2025-06-15T14:00:00.000Z',
        endDateTime: '2025-06-15T22:00:00.000Z',
        adults: 80,
        children: 20,
        toddlers: 5,
        guests: 105,
        pricePerAdult: 250,
        pricePerChild: 150,
        pricePerToddler: 0,
        status: 'CONFIRMED',
        createdAt: '2025-01-20T12:00:00.000Z',
        updatedAt: '2025-01-20T12:00:00.000Z',
      };
      expect(() => ReservationSchema.parse(broken)).toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Queue
  // ─────────────────────────────────────────────────────────
  describe('Queue response contracts', () => {
    it('queue item matches QueueItem type', () => {
      const item = {
        id: UUID4,
        position: 1,
        queueDate: '2025-07-01',
        guests: 50,
        client: {
          id: UUID2,
          firstName: 'Anna',
          lastName: 'Nowak',
          phone: '+48123456789',
          email: 'anna@example.pl',
        },
        isManualOrder: false,
        notes: 'Wesele',
        createdAt: '2025-02-01T08:00:00.000Z',
        createdBy: {
          id: UUID,
          firstName: 'Jan',
          lastName: 'Admin',
        },
      };

      expect(() => QueueItemSchema.parse(item)).not.toThrow();
    });

    it('queue stats matches QueueStats type', () => {
      const stats = {
        totalQueued: 5,
        queuesByDate: [
          { date: '2025-07-01', count: 3 },
          { date: '2025-08-15', count: 2 },
        ],
        oldestQueueDate: '2025-07-01',
        manualOrderCount: 1,
      };

      expect(() => QueueStatsSchema.parse(stats)).not.toThrow();
    });

    it('queue stats with null oldestQueueDate matches type', () => {
      const emptyStats = {
        totalQueued: 0,
        queuesByDate: [],
        oldestQueueDate: null,
        manualOrderCount: 0,
      };

      expect(() => QueueStatsSchema.parse(emptyStats)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Reports
  // ─────────────────────────────────────────────────────────
  describe('Reports response contracts', () => {
    it('revenue report matches RevenueReport type', () => {
      const report = {
        summary: {
          totalRevenue: 150000,
          avgRevenuePerReservation: 25000,
          maxRevenueDay: '2025-06-15',
          maxRevenueDayAmount: 50000,
          growthPercent: 15.5,
          totalReservations: 6,
          completedReservations: 4,
          pendingRevenue: 50000,
        },
        breakdown: [
          { period: '2025-06', revenue: 75000, count: 3, avgRevenue: 25000 },
        ],
        byHall: [
          { hallId: UUID3, hallName: 'Sala Główna', revenue: 100000, count: 4, avgRevenue: 25000 },
        ],
        byEventType: [
          { eventTypeId: UUID5, eventTypeName: 'Wesele', revenue: 80000, count: 3, avgRevenue: 26667 },
        ],
      };

      expect(() => RevenueReportSchema.parse(report)).not.toThrow();
    });

    it('revenue report API response matches envelope', () => {
      const response = {
        success: true,
        data: {
          summary: {
            totalRevenue: 0,
            avgRevenuePerReservation: 0,
            maxRevenueDay: null,
            maxRevenueDayAmount: 0,
            growthPercent: 0,
            totalReservations: 0,
            completedReservations: 0,
            pendingRevenue: 0,
          },
          breakdown: [],
          byHall: [],
          byEventType: [],
        },
      };

      expect(() => ApiEnvelopeSchema(RevenueReportSchema).parse(response)).not.toThrow();
    });

    it('occupancy report matches OccupancyReport type', () => {
      const report = {
        summary: {
          avgOccupancy: 75.5,
          peakDay: '2025-06-15',
          peakHall: 'Sala Główna',
          peakHallId: UUID3,
          totalReservations: 20,
          totalDaysInPeriod: 30,
        },
        halls: [
          { hallId: UUID3, hallName: 'Sala Główna', occupancy: 80, reservations: 15, avgGuestsPerReservation: 120 },
        ],
        peakHours: [
          { hour: 14, count: 8 },
          { hour: 15, count: 6 },
        ],
        peakDaysOfWeek: [
          { dayOfWeek: 'Sobota', dayOfWeekNum: 6, count: 10 },
        ],
      };

      expect(() => OccupancyReportSchema.parse(report)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Breaking change detection
  // ─────────────────────────────────────────────────────────
  describe('Breaking change detection', () => {
    it('detects missing email in User', () => {
      const broken = { id: UUID, firstName: 'Jan', lastName: 'Kowalski' };
      expect(() => UserSchema.parse(broken)).toThrow();
    });

    it('detects missing phone in Client', () => {
      const broken = {
        id: UUID2,
        firstName: 'Anna',
        lastName: 'Nowak',
        clientType: 'INDIVIDUAL',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      expect(() => ClientSchema.parse(broken)).toThrow();
    });

    it('detects missing capacity in Hall', () => {
      const broken = {
        id: UUID3,
        name: 'Sala',
        pricePerPerson: 200,
        isActive: true,
        isWholeVenue: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      expect(() => HallSchema.parse(broken)).toThrow();
    });

    it('detects missing guests in Reservation', () => {
      const broken = {
        id: UUID4,
        hallId: UUID3,
        clientId: UUID2,
        eventTypeId: UUID5,
        startDateTime: '2025-06-15T14:00:00.000Z',
        endDateTime: '2025-06-15T22:00:00.000Z',
        adults: 80,
        children: 20,
        toddlers: 5,
        pricePerAdult: 250,
        pricePerChild: 150,
        pricePerToddler: 0,
        totalPrice: 23000,
        status: 'CONFIRMED',
        createdAt: '2025-01-20T12:00:00.000Z',
        updatedAt: '2025-01-20T12:00:00.000Z',
      };
      expect(() => ReservationSchema.parse(broken)).toThrow();
    });

    it('detects missing totalReservations in revenue summary', () => {
      const broken = {
        summary: {
          totalRevenue: 100,
          avgRevenuePerReservation: 100,
          maxRevenueDay: null,
          maxRevenueDayAmount: 0,
          growthPercent: 0,
          // totalReservations missing
          completedReservations: 0,
          pendingRevenue: 0,
        },
        breakdown: [],
        byHall: [],
        byEventType: [],
      };
      expect(() => RevenueReportSchema.parse(broken)).toThrow();
    });

    it('detects invalid status in Reservation', () => {
      const broken = {
        id: UUID4,
        hallId: UUID3,
        clientId: UUID2,
        eventTypeId: UUID5,
        startDateTime: '2025-06-15T14:00:00.000Z',
        endDateTime: '2025-06-15T22:00:00.000Z',
        adults: 80,
        children: 20,
        toddlers: 5,
        guests: 105,
        pricePerAdult: 250,
        pricePerChild: 150,
        pricePerToddler: 0,
        totalPrice: 23000,
        status: 'DELETED',
        createdAt: '2025-01-20T12:00:00.000Z',
        updatedAt: '2025-01-20T12:00:00.000Z',
      };
      expect(() => ReservationSchema.parse(broken)).toThrow();
    });
  });
});
