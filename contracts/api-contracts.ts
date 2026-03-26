/**
 * API Contracts — Shared response shape definitions
 *
 * Definiuje oczekiwane kształty odpowiedzi API dla kluczowych endpointów.
 * Używane przez testy kontraktowe zarówno po stronie backendu jak i frontendu,
 * aby wykrywać breaking changes w API responses.
 *
 * UWAGA: Te kontrakty opisują kształt RESPONSE (nie request).
 * Backend contract testy weryfikują, że Zod schemas + fixtures dają zgodne dane.
 * Frontend contract testy weryfikują, że typy TypeScript zgadzają się z kontraktem.
 */

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/** Standard API envelope returned by all endpoints */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

/** Standard error response */
export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════
// Auth responses
// ═══════════════════════════════════════════════════════════════

export interface AuthUserContract {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: {
    id: string;
    name: string;
    slug: string;
    permissions?: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
}

export interface AuthLoginResponseContract {
  success: boolean;
  data: {
    token: string;
    accessToken?: string;
    refreshToken?: string;
    user: AuthUserContract;
  };
  token: string;
  accessToken?: string;
  refreshToken?: string;
  user: AuthUserContract;
  message: string;
}

export interface AuthRegisterResponseContract {
  success: boolean;
  data: {
    token: string;
    accessToken?: string;
    refreshToken?: string;
    user: AuthUserContract;
  };
  token: string;
  accessToken?: string;
  refreshToken?: string;
  user: AuthUserContract;
  message: string;
}

// ═══════════════════════════════════════════════════════════════
// Client responses
// ═══════════════════════════════════════════════════════════════

export interface ClientContract {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  clientType: 'INDIVIDUAL' | 'COMPANY';
  companyName?: string | null;
  nip?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListResponseContract {
  success: boolean;
  data: ClientContract[];
  count: number;
}

export interface ClientSingleResponseContract {
  success: boolean;
  data: ClientContract;
}

// ═══════════════════════════════════════════════════════════════
// Hall responses
// ═══════════════════════════════════════════════════════════════

export interface HallContract {
  id: string;
  name: string;
  capacity: number;
  description?: string | null;
  isActive: boolean;
  isWholeVenue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HallListResponseContract {
  success: boolean;
  data: HallContract[];
  count: number;
}

// ═══════════════════════════════════════════════════════════════
// Reservation responses
// ═══════════════════════════════════════════════════════════════

export interface ReservationContract {
  id: string;
  hallId: string;
  clientId: string;
  eventTypeId: string;
  startDateTime: string;
  endDateTime: string;
  adults: number;
  children: number;
  toddlers: number;
  guests: number;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESERVED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ReservationCreateResponseContract {
  success: boolean;
  data: ReservationContract;
  message: string;
}

// ═══════════════════════════════════════════════════════════════
// Queue responses
// ═══════════════════════════════════════════════════════════════

export interface QueueItemContract {
  id: string;
  position: number;
  queueDate?: string;
  guests: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
  };
  notes?: string | null;
  createdAt: string;
}

export interface QueueListResponseContract {
  success: boolean;
  data: QueueItemContract[];
}

export interface QueueStatsContract {
  totalQueued: number;
  queuesByDate: Array<{
    date: string;
    count: number;
  }>;
  oldestQueueDate: string | null;
  manualOrderCount: number;
}

// ═══════════════════════════════════════════════════════════════
// Reports responses
// ═══════════════════════════════════════════════════════════════

export interface RevenueReportContract {
  success: boolean;
  data: {
    summary: {
      totalRevenue: number;
      avgRevenuePerReservation: number;
      maxRevenueDay: string | null;
      maxRevenueDayAmount: number;
      growthPercent: number;
      totalReservations: number;
      completedReservations: number;
      pendingRevenue: number;
    };
    breakdown: Array<{
      period: string;
      revenue: number;
      count: number;
      avgRevenue: number;
    }>;
    byHall: Array<{
      hallId: string;
      hallName: string;
      revenue: number;
      count: number;
      avgRevenue: number;
    }>;
    byEventType: Array<{
      eventTypeId: string;
      eventTypeName: string;
      revenue: number;
      count: number;
      avgRevenue: number;
    }>;
  };
}

export interface OccupancyReportContract {
  success: boolean;
  data: {
    summary: {
      avgOccupancy: number;
      peakDay: string;
      peakHall: string | null;
      peakHallId: string | null;
      totalReservations: number;
      totalDaysInPeriod: number;
    };
    halls: Array<{
      hallId: string;
      hallName: string;
      occupancy: number;
      reservations: number;
      avgGuestsPerReservation: number;
    }>;
    peakHours: Array<{
      hour: number;
      count: number;
    }>;
    peakDaysOfWeek: Array<{
      dayOfWeek: string;
      dayOfWeekNum: number;
      count: number;
    }>;
  };
}

// ═══════════════════════════════════════════════════════════════
// Deposit responses
// ═══════════════════════════════════════════════════════════════

export interface DepositContract {
  id: string;
  reservationId: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
  paidAt?: string | null;
  paymentMethod?: 'CASH' | 'TRANSFER' | 'BANK_TRANSFER' | 'BLIK' | 'CARD' | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Fixture data for contract testing
// ═══════════════════════════════════════════════════════════════

export const CONTRACT_FIXTURES = {
  auth: {
    loginResponse: {
      success: true,
      data: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'admin@test.pl',
          firstName: 'Jan',
          lastName: 'Kowalski',
          role: {
            id: '550e8400-e29b-41d4-a716-446655440010',
            name: 'Administrator',
            slug: 'admin',
            permissions: [
              { id: '550e8400-e29b-41d4-a716-446655440020', name: 'Manage Users', slug: 'manage-users' },
            ],
          },
        },
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
      user: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'admin@test.pl',
        firstName: 'Jan',
        lastName: 'Kowalski',
        role: {
          id: '550e8400-e29b-41d4-a716-446655440010',
          name: 'Administrator',
          slug: 'admin',
          permissions: [
            { id: '550e8400-e29b-41d4-a716-446655440020', name: 'Manage Users', slug: 'manage-users' },
          ],
        },
      },
      message: 'Logged in successfully',
    } satisfies AuthLoginResponseContract,
  },

  client: {
    single: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      firstName: 'Anna',
      lastName: 'Nowak',
      phone: '+48123456789',
      email: 'anna@example.pl',
      notes: null,
      clientType: 'INDIVIDUAL' as const,
      companyName: null,
      nip: null,
      createdAt: '2025-01-15T10:00:00.000Z',
      updatedAt: '2025-01-15T10:00:00.000Z',
    } satisfies ClientContract,

    list: {
      success: true,
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          firstName: 'Anna',
          lastName: 'Nowak',
          phone: '+48123456789',
          email: 'anna@example.pl',
          notes: null,
          clientType: 'INDIVIDUAL' as const,
          companyName: null,
          nip: null,
          createdAt: '2025-01-15T10:00:00.000Z',
          updatedAt: '2025-01-15T10:00:00.000Z',
        },
      ],
      count: 1,
    } satisfies ClientListResponseContract,
  },

  hall: {
    single: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Sala Główna',
      capacity: 200,
      description: 'Duża sala bankietowa',
      isActive: true,
      isWholeVenue: false,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    } satisfies HallContract,
  },

  reservation: {
    single: {
      id: '550e8400-e29b-41d4-a716-446655440004',
      hallId: '550e8400-e29b-41d4-a716-446655440003',
      clientId: '550e8400-e29b-41d4-a716-446655440002',
      eventTypeId: '550e8400-e29b-41d4-a716-446655440005',
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
    } satisfies ReservationContract,
  },

  queue: {
    item: {
      id: '550e8400-e29b-41d4-a716-446655440006',
      position: 1,
      queueDate: '2025-07-01',
      guests: 50,
      client: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        firstName: 'Anna',
        lastName: 'Nowak',
        phone: '+48123456789',
        email: 'anna@example.pl',
      },
      notes: 'Wesele — preferowany termin lipiec',
      createdAt: '2025-02-01T08:00:00.000Z',
    } satisfies QueueItemContract,
  },

  deposit: {
    single: {
      id: '550e8400-e29b-41d4-a716-446655440007',
      reservationId: '550e8400-e29b-41d4-a716-446655440004',
      amount: 5000,
      dueDate: '2025-03-15T00:00:00.000Z',
      status: 'PENDING' as const,
      paidAt: null,
      paymentMethod: null,
      notes: null,
      createdAt: '2025-01-20T12:00:00.000Z',
      updatedAt: '2025-01-20T12:00:00.000Z',
    } satisfies DepositContract,
  },

  reports: {
    revenue: {
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
          { hallId: '550e8400-e29b-41d4-a716-446655440003', hallName: 'Sala Główna', revenue: 100000, count: 4, avgRevenue: 25000 },
        ],
        byEventType: [
          { eventTypeId: '550e8400-e29b-41d4-a716-446655440005', eventTypeName: 'Wesele', revenue: 80000, count: 3, avgRevenue: 26667 },
        ],
      },
    } satisfies RevenueReportContract,
  },
} as const;
