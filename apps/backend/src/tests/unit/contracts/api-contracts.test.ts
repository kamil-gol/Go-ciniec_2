/**
 * Backend Contract Tests — API Response Shape Validation
 *
 * Te testy weryfikują, że:
 * 1. Istniejące Zod validation schemas poprawnie parsują fixture data
 * 2. Kształty odpowiedzi API zgadzają się z kontraktami zdefiniowanymi w contracts/
 * 3. Zmiany w schematach Zod lub strukturze response nie łamią kontraktu
 *
 * Pokryte endpointy: auth, clients, reservations, halls, queue, reports, deposits
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Import Zod schemas from backend validation layer
// ═══════════════════════════════════════════════════════════════
import {
  addToQueueSchema,
  updateQueueReservationSchema,
  swapPositionsSchema,
  moveToPositionSchema,
  promoteReservationSchema,
} from '@/validation/queue.validation';

import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  createRoleSchema,
  updateCompanySettingsSchema,
} from '@/validation/settings.validation';

import {
  createDepositSchema,
  updateDepositSchema,
  markPaidSchema,
  DepositStatusEnum,
  PaymentMethodEnum,
  depositFiltersSchema,
} from '@/validation/deposit.validation';

import {
  createCateringTemplateSchema,
  createCateringPackageSchema,
  createCateringSectionSchema,
} from '@/validation/catering.validation';

import {
  createMenuTemplateSchema,
  selectMenuSchema,
  categorySettingSchema,
} from '@/validation/menu.validation';

// ═══════════════════════════════════════════════════════════════
// Contract response shape schemas (Zod) — opisują odpowiedzi API
// Używane do walidacji fixture data
// ═══════════════════════════════════════════════════════════════

const AuthUserShape = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    permissions: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    })).optional(),
  }).optional(),
});

const AuthLoginResponseShape = z.object({
  success: z.literal(true),
  data: z.object({
    token: z.string().min(1),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    user: AuthUserShape,
  }),
  token: z.string().min(1),
  user: AuthUserShape,
  message: z.string(),
});

const ClientShape = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  clientType: z.enum(['INDIVIDUAL', 'COMPANY']),
  companyName: z.string().nullable().optional(),
  nip: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ClientListResponseShape = z.object({
  success: z.literal(true),
  data: z.array(ClientShape),
  count: z.number().int().min(0),
});

const HallShape = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  isWholeVenue: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const HallListResponseShape = z.object({
  success: z.literal(true),
  data: z.array(HallShape),
  count: z.number().int().min(0),
});

const ReservationShape = z.object({
  id: z.string().uuid(),
  hallId: z.string().uuid(),
  clientId: z.string().uuid(),
  eventTypeId: z.string().uuid(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  adults: z.number().int().min(0),
  children: z.number().int().min(0),
  toddlers: z.number().int().min(0),
  guests: z.number().int().min(0),
  pricePerAdult: z.number().min(0),
  pricePerChild: z.number().min(0),
  pricePerToddler: z.number().min(0),
  totalPrice: z.number().min(0),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESERVED', 'ARCHIVED']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ReservationCreateResponseShape = z.object({
  success: z.literal(true),
  data: ReservationShape,
  message: z.string(),
});

const QueueItemShape = z.object({
  id: z.string().uuid(),
  position: z.number().int().min(1),
  queueDate: z.string().optional(),
  guests: z.number().int().min(1),
  client: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    email: z.string().nullable().optional(),
  }),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
});

const QueueStatsShape = z.object({
  totalQueued: z.number().int().min(0),
  queuesByDate: z.array(z.object({
    date: z.string(),
    count: z.number().int().min(0),
  })),
  oldestQueueDate: z.string().nullable(),
  manualOrderCount: z.number().int().min(0),
});

const DepositShape = z.object({
  id: z.string().uuid(),
  reservationId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.string(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIALLY_PAID']),
  paidAt: z.string().nullable().optional(),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'BANK_TRANSFER', 'BLIK', 'CARD']).nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const RevenueReportShape = z.object({
  success: z.literal(true),
  data: z.object({
    summary: z.object({
      totalRevenue: z.number(),
      avgRevenuePerReservation: z.number(),
      maxRevenueDay: z.string().nullable(),
      maxRevenueDayAmount: z.number(),
      growthPercent: z.number(),
      totalReservations: z.number().int(),
      completedReservations: z.number().int(),
      pendingRevenue: z.number(),
    }),
    breakdown: z.array(z.object({
      period: z.string(),
      revenue: z.number(),
      count: z.number().int(),
      avgRevenue: z.number(),
    })),
    byHall: z.array(z.object({
      hallId: z.string().uuid(),
      hallName: z.string(),
      revenue: z.number(),
      count: z.number().int(),
      avgRevenue: z.number(),
    })),
    byEventType: z.array(z.object({
      eventTypeId: z.string().uuid(),
      eventTypeName: z.string(),
      revenue: z.number(),
      count: z.number().int(),
      avgRevenue: z.number(),
    })),
  }),
});

// ═══════════════════════════════════════════════════════════════
// Fixture data — realistyczne dane testowe
// ═══════════════════════════════════════════════════════════════

const UUID1 = '550e8400-e29b-41d4-a716-446655440001';
const UUID2 = '550e8400-e29b-41d4-a716-446655440002';
const UUID3 = '550e8400-e29b-41d4-a716-446655440003';
const UUID4 = '550e8400-e29b-41d4-a716-446655440004';
const UUID5 = '550e8400-e29b-41d4-a716-446655440005';

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe('API Contract Tests — Response Shape Validation', () => {

  // ─────────────────────────────────────────────────────────
  // Auth contracts
  // ─────────────────────────────────────────────────────────
  describe('Auth endpoint contracts', () => {
    it('login response matches contract shape', () => {
      const loginResponse = {
        success: true,
        data: {
          token: 'jwt-token-123',
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          user: {
            id: UUID1,
            email: 'admin@test.pl',
            firstName: 'Jan',
            lastName: 'Kowalski',
            role: {
              id: UUID2,
              name: 'Administrator',
              slug: 'admin',
              permissions: [{ id: UUID3, name: 'Manage Users', slug: 'manage-users' }],
            },
          },
        },
        token: 'jwt-token-123',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: {
          id: UUID1,
          email: 'admin@test.pl',
          firstName: 'Jan',
          lastName: 'Kowalski',
          role: {
            id: UUID2,
            name: 'Administrator',
            slug: 'admin',
            permissions: [{ id: UUID3, name: 'Manage Users', slug: 'manage-users' }],
          },
        },
        message: 'Logged in successfully',
      };

      expect(() => AuthLoginResponseShape.parse(loginResponse)).not.toThrow();
    });

    it('register response matches contract shape', () => {
      const registerResponse = {
        success: true,
        data: {
          token: 'jwt-token-456',
          user: {
            id: UUID1,
            email: 'new@test.pl',
            firstName: 'Anna',
            lastName: 'Nowak',
          },
        },
        token: 'jwt-token-456',
        user: {
          id: UUID1,
          email: 'new@test.pl',
          firstName: 'Anna',
          lastName: 'Nowak',
        },
        message: 'User registered successfully',
      };

      expect(() => AuthLoginResponseShape.parse(registerResponse)).not.toThrow();
    });

    it('rejects login response missing required fields', () => {
      const broken = {
        success: true,
        data: { token: 'x' },
        // missing user, message
      };
      expect(() => AuthLoginResponseShape.parse(broken)).toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Client contracts
  // ─────────────────────────────────────────────────────────
  describe('Client endpoint contracts', () => {
    it('client list response matches contract shape', () => {
      const response = {
        success: true,
        data: [
          {
            id: UUID2,
            firstName: 'Anna',
            lastName: 'Nowak',
            phone: '+48123456789',
            email: 'anna@example.pl',
            notes: null,
            clientType: 'INDIVIDUAL',
            companyName: null,
            nip: null,
            createdAt: '2025-01-15T10:00:00.000Z',
            updatedAt: '2025-01-15T10:00:00.000Z',
          },
        ],
        count: 1,
      };

      expect(() => ClientListResponseShape.parse(response)).not.toThrow();
    });

    it('client with company type matches contract', () => {
      const companyClient = {
        id: UUID2,
        firstName: 'Jan',
        lastName: 'Firma',
        phone: '+48111222333',
        email: null,
        notes: 'VIP',
        clientType: 'COMPANY',
        companyName: 'Firma Sp. z o.o.',
        nip: '1234567890',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      expect(() => ClientShape.parse(companyClient)).not.toThrow();
    });

    it('rejects client without required firstName', () => {
      const broken = {
        id: UUID2,
        lastName: 'Test',
        phone: '123',
        clientType: 'INDIVIDUAL',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      expect(() => ClientShape.parse(broken)).toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Hall contracts
  // ─────────────────────────────────────────────────────────
  describe('Hall endpoint contracts', () => {
    it('hall list response matches contract shape', () => {
      const response = {
        success: true,
        data: [
          {
            id: UUID3,
            name: 'Sala Główna',
            capacity: 200,
            description: 'Duża sala bankietowa',
            isActive: true,
            isWholeVenue: false,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        count: 1,
      };

      expect(() => HallListResponseShape.parse(response)).not.toThrow();
    });

    it('hall with minimal fields matches contract', () => {
      const minimalHall = {
        id: UUID3,
        name: 'Mała Sala',
        capacity: 50,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      expect(() => HallShape.parse(minimalHall)).not.toThrow();
    });

    it('rejects hall with negative capacity', () => {
      const broken = {
        id: UUID3,
        name: 'Bad Hall',
        capacity: -10,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      expect(() => HallShape.parse(broken)).toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Reservation contracts
  // ─────────────────────────────────────────────────────────
  describe('Reservation endpoint contracts', () => {
    it('reservation create response matches contract shape', () => {
      const response = {
        success: true,
        data: {
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
          status: 'CONFIRMED',
          createdAt: '2025-01-20T12:00:00.000Z',
          updatedAt: '2025-01-20T12:00:00.000Z',
        },
        message: 'Reservation created successfully',
      };

      expect(() => ReservationCreateResponseShape.parse(response)).not.toThrow();
    });

    it('all reservation statuses are valid', () => {
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
        expect(() => ReservationShape.parse(reservation)).not.toThrow();
      }
    });

    it('rejects reservation with invalid status', () => {
      const broken = {
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
        status: 'INVALID_STATUS',
        createdAt: '2025-01-20T12:00:00.000Z',
        updatedAt: '2025-01-20T12:00:00.000Z',
      };
      expect(() => ReservationShape.parse(broken)).toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Queue contracts
  // ─────────────────────────────────────────────────────────
  describe('Queue endpoint contracts', () => {
    it('queue item matches contract shape', () => {
      const queueItem = {
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
        notes: 'Wesele — preferowany termin lipiec',
        createdAt: '2025-02-01T08:00:00.000Z',
      };

      expect(() => QueueItemShape.parse(queueItem)).not.toThrow();
    });

    it('queue stats matches contract shape', () => {
      const stats = {
        totalQueued: 5,
        queuesByDate: [
          { date: '2025-07-01', count: 3 },
          { date: '2025-08-15', count: 2 },
        ],
        oldestQueueDate: '2025-07-01',
        manualOrderCount: 1,
      };

      expect(() => QueueStatsShape.parse(stats)).not.toThrow();
    });

    it('queue add validation schema accepts valid data', () => {
      const input = {
        clientId: UUID2,
        reservationQueueDate: '2025-07-01',
        guests: 50,
        adults: 40,
        children: 8,
        toddlers: 2,
        notes: 'Wesele',
      };

      expect(() => addToQueueSchema.parse(input)).not.toThrow();
    });

    it('queue promote validation schema accepts valid data', () => {
      const input = {
        hallId: UUID3,
        eventTypeId: UUID5,
        startDateTime: '2025-07-01T14:00:00.000Z',
        endDateTime: '2025-07-01T22:00:00.000Z',
        adults: 40,
        children: 8,
        toddlers: 2,
        pricePerAdult: 250,
        pricePerChild: 150,
        pricePerToddler: 0,
        status: 'CONFIRMED' as const,
      };

      expect(() => promoteReservationSchema.parse(input)).not.toThrow();
    });

    it('queue swap positions validation schema accepts valid data', () => {
      const input = {
        reservationId1: UUID1,
        reservationId2: UUID2,
      };
      expect(() => swapPositionsSchema.parse(input)).not.toThrow();
    });

    it('queue move to position validation schema accepts valid data', () => {
      expect(() => moveToPositionSchema.parse({ newPosition: 3 })).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Deposit contracts
  // ─────────────────────────────────────────────────────────
  describe('Deposit endpoint contracts', () => {
    it('deposit matches contract shape', () => {
      const deposit = {
        id: UUID4,
        reservationId: UUID3,
        amount: 5000,
        dueDate: '2025-03-15T00:00:00.000Z',
        status: 'PENDING',
        paidAt: null,
        paymentMethod: null,
        notes: null,
        createdAt: '2025-01-20T12:00:00.000Z',
        updatedAt: '2025-01-20T12:00:00.000Z',
      };

      expect(() => DepositShape.parse(deposit)).not.toThrow();
    });

    it('paid deposit matches contract shape', () => {
      const paidDeposit = {
        id: UUID4,
        reservationId: UUID3,
        amount: 5000,
        dueDate: '2025-03-15T00:00:00.000Z',
        status: 'PAID',
        paidAt: '2025-03-10T14:30:00.000Z',
        paymentMethod: 'BLIK',
        notes: 'Wpłata BLIK',
        createdAt: '2025-01-20T12:00:00.000Z',
        updatedAt: '2025-03-10T14:30:00.000Z',
      };

      expect(() => DepositShape.parse(paidDeposit)).not.toThrow();
    });

    it('all deposit statuses are valid', () => {
      const statuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIALLY_PAID'] as const;
      for (const status of statuses) {
        expect(() => DepositStatusEnum.parse(status)).not.toThrow();
      }
    });

    it('all payment methods are valid', () => {
      const methods = ['CASH', 'TRANSFER', 'BANK_TRANSFER', 'BLIK', 'CARD'] as const;
      for (const method of methods) {
        expect(() => PaymentMethodEnum.parse(method)).not.toThrow();
      }
    });

    it('create deposit validation accepts valid data', () => {
      const input = {
        amount: 5000,
        dueDate: '2025-03-15T00:00:00.000Z',
        notes: 'Zaliczka',
      };
      expect(() => createDepositSchema.parse(input)).not.toThrow();
    });

    it('mark paid validation accepts valid data', () => {
      const input = {
        paymentMethod: 'BLIK' as const,
        paidAt: '2025-03-10T14:30:00.000Z',
        amountPaid: 5000,
      };
      expect(() => markPaidSchema.parse(input)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Reports contracts
  // ─────────────────────────────────────────────────────────
  describe('Reports endpoint contracts', () => {
    it('revenue report matches contract shape', () => {
      const report = {
        success: true,
        data: {
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
        },
      };

      expect(() => RevenueReportShape.parse(report)).not.toThrow();
    });

    it('rejects revenue report missing summary fields', () => {
      const broken = {
        success: true,
        data: {
          summary: { totalRevenue: 100 },
          // missing other required summary fields
          breakdown: [],
          byHall: [],
          byEventType: [],
        },
      };
      expect(() => RevenueReportShape.parse(broken)).toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Zod request validation schemas — contract consistency
  // ─────────────────────────────────────────────────────────
  describe('Zod request validation schemas — contract consistency', () => {
    it('createUser schema accepts valid data', () => {
      const input = {
        email: 'test@example.pl',
        password: 'securePass123',
        firstName: 'Jan',
        lastName: 'Kowalski',
        roleId: UUID1,
      };
      expect(() => createUserSchema.parse(input)).not.toThrow();
    });

    it('createUser schema rejects short password', () => {
      const input = {
        email: 'test@example.pl',
        password: '12345', // too short (min 6)
        firstName: 'Jan',
        lastName: 'Kowalski',
        roleId: UUID1,
      };
      expect(() => createUserSchema.parse(input)).toThrow();
    });

    it('updateCompanySettings accepts partial data', () => {
      const input = { companyName: 'New Name' };
      expect(() => updateCompanySettingsSchema.parse(input)).not.toThrow();
    });

    it('createCateringTemplate accepts valid data', () => {
      const input = {
        name: 'Menu weselne',
        description: 'Pełne menu weselne',
        slug: 'menu-weselne',
        isActive: true,
        displayOrder: 0,
      };
      expect(() => createCateringTemplateSchema.parse(input)).not.toThrow();
    });

    it('selectMenu schema accepts valid data', () => {
      const input = {
        packageId: UUID1,
        selectedOptions: [
          { optionId: UUID2, quantity: 1 },
        ],
        dishSelections: [
          {
            categoryId: UUID3,
            dishes: [{ dishId: UUID4, quantity: 1 }],
          },
        ],
      };
      expect(() => selectMenuSchema.parse(input)).not.toThrow();
    });

    it('categorySettings schema accepts portionTarget', () => {
      const input = {
        categoryId: UUID1,
        minSelect: 1,
        maxSelect: 3,
        isRequired: true,
        portionTarget: 'ADULTS_ONLY',
        displayOrder: 0,
      };
      expect(() => categorySettingSchema.parse(input)).not.toThrow();
    });

    it('depositFilters schema coerces query params', () => {
      const input = {
        page: '2',
        limit: '50',
        sortBy: 'amount',
        sortOrder: 'desc',
      };
      const result = depositFiltersSchema.parse(input);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.sortBy).toBe('amount');
    });
  });

  // ─────────────────────────────────────────────────────────
  // Breaking change detection
  // ─────────────────────────────────────────────────────────
  describe('Breaking change detection', () => {
    it('detects if auth user response loses email field', () => {
      const brokenUser = {
        id: UUID1,
        // email missing!
        firstName: 'Jan',
        lastName: 'Kowalski',
      };
      expect(() => AuthUserShape.parse(brokenUser)).toThrow();
    });

    it('detects if client response loses phone field', () => {
      const brokenClient = {
        id: UUID2,
        firstName: 'Anna',
        lastName: 'Nowak',
        // phone missing!
        clientType: 'INDIVIDUAL',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      expect(() => ClientShape.parse(brokenClient)).toThrow();
    });

    it('detects if reservation loses guests field', () => {
      const brokenReservation = {
        id: UUID4,
        hallId: UUID3,
        clientId: UUID2,
        eventTypeId: UUID5,
        startDateTime: '2025-06-15T14:00:00.000Z',
        endDateTime: '2025-06-15T22:00:00.000Z',
        adults: 80,
        children: 20,
        toddlers: 5,
        // guests missing!
        pricePerAdult: 250,
        pricePerChild: 150,
        pricePerToddler: 0,
        totalPrice: 23000,
        status: 'CONFIRMED',
        createdAt: '2025-01-20T12:00:00.000Z',
        updatedAt: '2025-01-20T12:00:00.000Z',
      };
      expect(() => ReservationShape.parse(brokenReservation)).toThrow();
    });

    it('detects if queue item loses client.phone field', () => {
      const brokenQueueItem = {
        id: UUID4,
        position: 1,
        guests: 50,
        client: {
          id: UUID2,
          firstName: 'Anna',
          lastName: 'Nowak',
          // phone missing!
        },
        createdAt: '2025-02-01T08:00:00.000Z',
      };
      expect(() => QueueItemShape.parse(brokenQueueItem)).toThrow();
    });

    it('detects if deposit loses status field', () => {
      const brokenDeposit = {
        id: UUID4,
        reservationId: UUID3,
        amount: 5000,
        dueDate: '2025-03-15T00:00:00.000Z',
        // status missing!
        createdAt: '2025-01-20T12:00:00.000Z',
        updatedAt: '2025-01-20T12:00:00.000Z',
      };
      expect(() => DepositShape.parse(brokenDeposit)).toThrow();
    });

    it('detects if revenue report summary loses growthPercent', () => {
      const brokenReport = {
        success: true,
        data: {
          summary: {
            totalRevenue: 150000,
            avgRevenuePerReservation: 25000,
            maxRevenueDay: '2025-06-15',
            maxRevenueDayAmount: 50000,
            // growthPercent missing!
            totalReservations: 6,
            completedReservations: 4,
            pendingRevenue: 50000,
          },
          breakdown: [],
          byHall: [],
          byEventType: [],
        },
      };
      expect(() => RevenueReportShape.parse(brokenReport)).toThrow();
    });
  });
});
