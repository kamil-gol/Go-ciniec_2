import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), promise: vi.fn() },
}))
vi.mock('@/lib/api/deposits', () => ({
  depositsApi: { getAll: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/lib/api/attachments', () => ({
  batchCheckContract: vi.fn().mockResolvedValue({}),
  batchCheckRodo: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), delete: vi.fn() },
}))

const mockUseReservations = vi.fn()
vi.mock('@/lib/api/reservations', () => ({
  useReservations: (...args: any[]) => mockUseReservations(...args),
  useArchiveReservation: () => ({ mutateAsync: vi.fn() }),
  useUnarchiveReservation: () => ({ mutateAsync: vi.fn() }),
}))

import { ReservationsList } from '@/components/reservations/reservations-list'

function makeReservation(status: string, id: string) {
  return {
    id,
    startDateTime: '2026-06-01T12:00:00Z',
    endDateTime: '2026-06-01T20:00:00Z',
    status,
    guests: 50,
    adults: 40,
    children: 8,
    toddlers: 2,
    totalPrice: 15000,
    hall: { id: 'h1', name: 'Sala Główna' },
    client: { id: 'c1', firstName: 'Test', lastName: `Klient-${status}`, phone: '500100200', email: 'test@test.pl' },
    eventType: { id: 'et1', name: 'Wesele' },
    archivedAt: null,
  }
}

describe('ReservationStatus (status badges & labels)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Status badges', () => {
    it('should display correct label for CONFIRMED status', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('CONFIRMED', 'r-conf')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      expect(screen.getByText(/potwierdzon/i)).toBeTruthy()
    })

    it('should display correct label for PENDING status', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('PENDING', 'r-pend')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      expect(screen.getByText(/oczekując/i)).toBeTruthy()
    })

    it('should display correct label for COMPLETED status', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('COMPLETED', 'r-comp')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      expect(screen.getByText(/zakończon/i)).toBeTruthy()
    })

    it('should display correct label for CANCELLED status', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('CANCELLED', 'r-canc')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      expect(screen.getByText(/anulowan/i)).toBeTruthy()
    })
  })

  describe('Status-dependent actions', () => {
    it('should disable delete button for CANCELLED reservations', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('CANCELLED', 'r-canc')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      const deleteBtn = screen.getByTitle('Anuluj rezerwację')
      expect(deleteBtn).toHaveProperty('disabled', true)
    })

    it('should disable delete button for COMPLETED reservations', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('COMPLETED', 'r-comp')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      const deleteBtn = screen.getByTitle('Anuluj rezerwację')
      expect(deleteBtn).toHaveProperty('disabled', true)
    })

    it('should enable delete button for PENDING reservations', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('PENDING', 'r-pend')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      const deleteBtn = screen.getByTitle('Anuluj rezerwację')
      expect(deleteBtn).toHaveProperty('disabled', false)
    })

    it('should enable archive button for CANCELLED reservations', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('CANCELLED', 'r-canc')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      const archiveBtn = screen.getByTitle('Zarchiwizuj')
      expect(archiveBtn).toHaveProperty('disabled', false)
    })
  })

  describe('Archived state', () => {
    it('should show archived badge for archived reservations', () => {
      const archivedReservation = {
        ...makeReservation('CONFIRMED', 'r-arch'),
        archivedAt: '2026-05-01T12:00:00Z',
      }

      mockUseReservations.mockReturnValue({
        data: { data: [archivedReservation], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      const archivedElements = screen.getAllByText(/zarchiwizowane/i); expect(archivedElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should show restore button instead of archive for archived reservations', () => {
      const archivedReservation = {
        ...makeReservation('CONFIRMED', 'r-arch'),
        archivedAt: '2026-05-01T12:00:00Z',
      }

      mockUseReservations.mockReturnValue({
        data: { data: [archivedReservation], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      expect(screen.getByTitle('Przywróć z archiwum')).toBeTruthy()
      expect(screen.queryByTitle('Zarchiwizuj')).toBeNull()
    })
  })

  describe('Deposit badges', () => {
    it('should not show deposit badge when no deposits exist', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('CONFIRMED', 'r1')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      expect(screen.queryByText(/zaliczka/i)).toBeNull()
    })
  })

  describe('Contract & RODO badges', () => {
    it('should not show contract badge when contract status is unknown', () => {
      mockUseReservations.mockReturnValue({
        data: { data: [makeReservation('CONFIRMED', 'r1')], totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      // Initially contract status is undefined, so badge should not render
      // (batchCheckContract returns {} by default in mock)
      expect(screen.queryByText(/umowa/i)).toBeNull()
    })
  })
})
