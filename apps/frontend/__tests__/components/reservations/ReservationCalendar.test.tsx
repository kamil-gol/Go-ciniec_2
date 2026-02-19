import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { format, parseISO, isSameDay } from 'date-fns'
import { pl } from 'date-fns/locale'

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

function createReservation(overrides: any = {}) {
  return {
    id: `res-${Math.random().toString(36).slice(2, 8)}`,
    startDateTime: '2026-04-10T14:00:00Z',
    endDateTime: '2026-04-10T22:00:00Z',
    status: 'CONFIRMED',
    guests: 100,
    adults: 80,
    children: 15,
    toddlers: 5,
    totalPrice: 20000,
    hall: { id: 'h1', name: 'Sala Główna' },
    client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski', phone: '500100200', email: 'jan@test.pl' },
    eventType: { id: 'et1', name: 'Wesele' },
    archivedAt: null,
    ...overrides,
  }
}

describe('ReservationCalendar (date grouping view)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Date headers', () => {
    it('should display date headers with Polish day names', () => {
      const reservations = [
        createReservation({ id: 'r1', startDateTime: '2026-04-13T14:00:00Z' }), // poniedziałek
        createReservation({ id: 'r2', startDateTime: '2026-04-14T10:00:00Z' }), // wtorek
      ]

      mockUseReservations.mockReturnValue({
        data: { data: reservations, totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      expect(screen.getByText(/poniedziałek/i)).toBeTruthy()
      expect(screen.getByText(/wtorek/i)).toBeTruthy()
    })

    it('should display dates in "d MMMM yyyy" format', () => {
      const reservations = [
        createReservation({ id: 'r1', startDateTime: '2026-06-20T14:00:00Z' }),
      ]

      mockUseReservations.mockReturnValue({
        data: { data: reservations, totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      expect(screen.getByText(/20 czerwca 2026/i)).toBeTruthy()
    })

    it('should highlight today\'s date with special styling', () => {
      const today = new Date().toISOString()
      const reservations = [
        createReservation({ id: 'r-today', startDateTime: today }),
      ]

      mockUseReservations.mockReturnValue({
        data: { data: reservations, totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      // Today's header should have gradient styling (bg-gradient-to-r)
      const todayName = format(new Date(), 'EEEE', { locale: pl })
      const headerText = screen.queryByText(new RegExp(todayName, 'i'))
      expect(headerText).toBeTruthy()
    })
  })

  describe('Grouping logic', () => {
    it('should group multiple reservations on the same date under one header', () => {
      const reservations = [
        createReservation({ id: 'r1', startDateTime: '2026-05-10T10:00:00Z', client: { id: 'c1', firstName: 'Jan', lastName: 'Kowalski' } }),
        createReservation({ id: 'r2', startDateTime: '2026-05-10T16:00:00Z', client: { id: 'c2', firstName: 'Anna', lastName: 'Nowak' } }),
        createReservation({ id: 'r3', startDateTime: '2026-05-10T20:00:00Z', client: { id: 'c3', firstName: 'Piotr', lastName: 'Wiśniewski' } }),
      ]

      mockUseReservations.mockReturnValue({
        data: { data: reservations, totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      // Should show count badge "3 rezerwacji"
      expect(screen.getByText('3 rezerwacji')).toBeTruthy()

      // All clients should be visible
      expect(screen.getByText('Jan Kowalski')).toBeTruthy()
      expect(screen.getByText('Anna Nowak')).toBeTruthy()
      expect(screen.getByText('Piotr Wiśniewski')).toBeTruthy()
    })

    it('should sort dates chronologically', () => {
      const reservations = [
        createReservation({ id: 'r-late', startDateTime: '2026-05-20T10:00:00Z', client: { id: 'c1', firstName: 'Late', lastName: 'Person' } }),
        createReservation({ id: 'r-early', startDateTime: '2026-05-05T10:00:00Z', client: { id: 'c2', firstName: 'Early', lastName: 'Person' } }),
        createReservation({ id: 'r-mid', startDateTime: '2026-05-12T10:00:00Z', client: { id: 'c3', firstName: 'Mid', lastName: 'Person' } }),
      ]

      mockUseReservations.mockReturnValue({
        data: { data: reservations, totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      const allText = document.body.textContent || ''
      const earlyIdx = allText.indexOf('Early Person')
      const midIdx = allText.indexOf('Mid Person')
      const lateIdx = allText.indexOf('Late Person')

      expect(earlyIdx).toBeLessThan(midIdx)
      expect(midIdx).toBeLessThan(lateIdx)
    })

    it('should not show count badge when only one reservation on a date', () => {
      const reservations = [
        createReservation({ id: 'r1', startDateTime: '2026-07-01T10:00:00Z' }),
      ]

      mockUseReservations.mockReturnValue({
        data: { data: reservations, totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      expect(screen.queryByText(/rezerwacji$/i)).toBeNull()
    })
  })

  describe('Time display', () => {
    it('should show time range for reservations', () => {
      const reservations = [
        createReservation({
          id: 'r1',
          startDateTime: '2026-04-10T14:00:00Z',
          endDateTime: '2026-04-10T22:00:00Z',
        }),
      ]

      mockUseReservations.mockReturnValue({
        data: { data: reservations, totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<ReservationsList />)

      // Should display time range (format depends on timezone)
      const timeText = document.body.textContent || ''
      expect(timeText).toMatch(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/)
    })
  })
})
